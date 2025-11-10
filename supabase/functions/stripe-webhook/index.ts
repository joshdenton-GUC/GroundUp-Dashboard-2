import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@17.5.0';
import { generatePaymentReceiptEmail } from './templates/payment-receipt.ts';

// Initialize Resend if API key is available
let resend = null;
try {
  const { Resend } = await import('npm:resend@2.0.0');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (resendApiKey) {
    resend = new Resend(resendApiKey);
    console.log('Resend initialized successfully');
  } else {
    console.log(
      'RESEND_API_KEY not found, invoice email sending will be logged only'
    );
  }
} catch (error) {
  console.log('Failed to initialize Resend:', error.message);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, stripe-signature',
};

// Function to send invoice email after successful payment
async function sendInvoiceEmail(
  supabaseClient: any,
  paymentIntent: Stripe.PaymentIntent,
  jobPost: any,
  client: any
) {
  try {
    console.log('Sending invoice email for payment:', paymentIntent.id);

    const amount = (paymentIntent.amount / 100).toFixed(2);
    const invoiceNumber = `INV-${paymentIntent.id.slice(-8).toUpperCase()}`;
    const paymentDate = new Date(
      paymentIntent.created * 1000
    ).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Generate email content using template
    const emailContent = generatePaymentReceiptEmail({
      invoiceNumber,
      paymentDate,
      amount,
      paymentMethod:
        paymentIntent.payment_method_types[0]?.toUpperCase() || 'Card',
      transactionId: paymentIntent.id,
      recipientEmail: client.profiles.email,
      jobPost: {
        title: jobPost.title,
        company_name: jobPost.company_name,
        classification: jobPost.classification,
        location: jobPost.location,
        job_type: jobPost.job_type,
      },
    });

    if (resend) {
      // Send email using Resend
      const result = await resend.emails.send(emailContent);

      // Track the email notification in database
      if (result && result.id) {
        const { error: trackError } = await supabaseClient
          .from('email_notifications')
          .insert({
            client_id: client.id,
            recipient_email: client.profiles.email,
            email_type: 'invoice',
            subject: emailContent.subject,
            status: 'sent',
            resend_email_id: result.id,
          });

        if (trackError) {
          console.error(
            'Error tracking invoice email notification:',
            trackError
          );
        }
      }

      console.log('Invoice email sent successfully:', result.id);
      return result;
    } else {
      // Fallback: just log the email content
      console.log('Invoice email (Resend not available):', {
        recipient: client.profiles.email,
        subject: emailContent.subject,
        invoiceNumber,
        amount,
        jobTitle: jobPost.title,
      });
      return { id: 'logged-only' };
    }
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
}

serve(async req => {
  console.log('Webhook received:', req.method, req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-12-18.acacia',
    });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    console.log('Webhook body length:', body.length);
    console.log('Webhook signature present:', !!signature);

    if (!signature) {
      console.log('Missing stripe signature');
      return new Response(
        JSON.stringify({ error: 'Missing stripe signature' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle the event
    console.log('Processing webhook event:', event.type, event.id);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Get job post and client details for invoice email
        const { data: jobPostData, error: jobPostFetchError } =
          await supabaseClient
            .from('job_posts')
            .select(
              `
            *,
            clients!inner(
              id,
              company_name,
              contact_phone,
              address,
              user_id,
              profiles!inner(
                email
              )
            )
          `
            )
            .eq('stripe_payment_intent_id', paymentIntent.id)
            .single();

        if (jobPostFetchError) {
          console.error('Error fetching job post data:', jobPostFetchError);
        }

        // Update job post status to posted
        const { error: jobPostError } = await supabaseClient
          .from('job_posts')
          .update({
            status: 'posted',
            payment_status: 'completed',
            posted_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (jobPostError) {
          console.error('Error updating job post status:', jobPostError);
        }

        // Update payment transaction status
        const { error: transactionError } = await supabaseClient
          .from('payment_transactions')
          .update({
            status: 'succeeded',
            stripe_charge_id: paymentIntent.latest_charge as string,
            payment_method: paymentIntent.payment_method_types[0],
            processed_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (transactionError) {
          console.error(
            'Error updating payment transaction:',
            transactionError
          );
        }
        console.log(jobPostData, 'jobPostData');
        // Send invoice email if we have the necessary data
        if (
          jobPostData &&
          jobPostData.clients &&
          jobPostData.clients.profiles &&
          jobPostData.clients.profiles.email
        ) {
          try {
            await sendInvoiceEmail(
              supabaseClient,
              paymentIntent,
              jobPostData,
              jobPostData.clients
            );
          } catch (emailError) {
            console.error('Error sending invoice email:', emailError);
            // Don't fail the webhook if email sending fails
          }

          // Send "New Job Requisite" alert to admin and configured recipients
          try {
            console.log('Sending New Job Requisite alert...');

            // Get admin emails (all users with admin role)
            const { data: adminProfiles, error: adminError } =
              await supabaseClient
                .from('profiles')
                .select('email')
                .eq('role', 'admin');

            if (adminError) {
              console.error('Error fetching admin profiles:', adminError);
            }

            const adminEmails =
              adminProfiles?.map(p => p.email).filter(Boolean) || [];

            // Get configured alert emails for this alert type
            const { data: emailAlerts, error: alertsError } =
              await supabaseClient
                .from('email_alerts')
                .select('recipient_email')
                .eq('alert_type', 'new_job_posted')
                .eq('is_active', true);

            if (alertsError) {
              console.error('Error fetching email alerts:', alertsError);
            }

            const configuredEmails =
              emailAlerts?.map(a => a.recipient_email).filter(Boolean) || [];

            // Combine all recipient emails (admin + configured), removing duplicates
            const allRecipients = Array.from(
              new Set([...adminEmails, ...configuredEmails])
            );

            if (allRecipients.length > 0) {
              // Trigger the send-email-alert function
              const alertResponse = await fetch(
                `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email-alert`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${Deno.env.get(
                      'SUPABASE_SERVICE_ROLE_KEY'
                    )}`,
                  },
                  body: JSON.stringify({
                    alertType: 'new_job_posted',
                    recipientEmails: allRecipients,
                    clientName:
                      jobPostData.clients.profiles.full_name || 'Client',
                    companyName: jobPostData.company_name || 'Company',
                    dashboardUrl: `${
                      Deno.env.get('VITE_APP_URL') ||
                      'https://groundupcareers.com'
                    }/dashboard/manage-jobs`,
                    clientEmail: jobPostData.clients.profiles.email,
                    clientId: jobPostData.clients.id,
                    jobTitle: jobPostData.title,
                  }),
                }
              );

              if (alertResponse.ok) {
                console.log(
                  `New Job Requisite alert sent to ${allRecipients.length} recipients`
                );
              } else {
                const errorText = await alertResponse.text();
                console.error(
                  'Error sending New Job Requisite alert:',
                  errorText
                );
              }
            } else {
              console.log(
                'No recipients configured for New Job Requisite alert'
              );
            }
          } catch (alertError) {
            console.error('Error sending New Job Requisite alert:', alertError);
            // Don't fail the webhook if alert fails
          }
        } else {
          console.warn(
            'Could not send invoice email - missing job post or client email data'
          );
        }

        console.log('Payment succeeded for payment intent:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Update job post status to failed
        const { error: jobPostError } = await supabaseClient
          .from('job_posts')
          .update({
            status: 'draft',
            payment_status: 'failed',
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (jobPostError) {
          console.error('Error updating job post status:', jobPostError);
        }

        // Update payment transaction status
        const { error: transactionError } = await supabaseClient
          .from('payment_transactions')
          .update({
            status: 'failed',
            failure_reason:
              paymentIntent.last_payment_error?.message || 'Payment failed',
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (transactionError) {
          console.error(
            'Error updating payment transaction:',
            transactionError
          );
        }

        console.log('Payment failed for payment intent:', paymentIntent.id);
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Update job post status to draft
        const { error: jobPostError } = await supabaseClient
          .from('job_posts')
          .update({
            status: 'draft',
            payment_status: 'pending',
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (jobPostError) {
          console.error('Error updating job post status:', jobPostError);
        }

        // Update payment transaction status
        const { error: transactionError } = await supabaseClient
          .from('payment_transactions')
          .update({
            status: 'canceled',
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (transactionError) {
          console.error(
            'Error updating payment transaction:',
            transactionError
          );
        }

        console.log('Payment canceled for payment intent:', paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
