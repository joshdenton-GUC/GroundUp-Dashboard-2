import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@17.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
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

    const { jobPostData, clientId, companyData, existingJobId } =
      await req.json();

    // Validate required fields
    if (!jobPostData || !clientId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Determine pricing based on classification
    const pricing = {
      STANDARD: { price: 50000, priceId: 'price_standard_job' }, // $500 in cents
      PREMIUM: { price: 150000, priceId: 'price_premium_job' }, // $1500 in cents
    };

    const jobPricing =
      pricing[jobPostData.classification as keyof typeof pricing];
    if (!jobPricing) {
      return new Response(
        JSON.stringify({ error: 'Invalid job classification' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let jobPost;

    if (existingJobId) {
      // Update existing draft job to pending payment status
      const { data: updatedJob, error: updateError } = await supabaseClient
        .from('job_posts')
        .update({
          title: jobPostData.title,
          job_type: jobPostData.type,
          classification: jobPostData.classification,
          location: jobPostData.location,
          salary: jobPostData.salary,
          description: jobPostData.description,
          requirements: jobPostData.requirements,
          benefits: jobPostData.benefits,
          company_name: companyData?.name || '',
          company_address: companyData?.address || '',
          company_phone: companyData?.phone || '',
          company_email: companyData?.email || '',
          company_website: companyData?.website || '',
          company_description: companyData?.description || '',
          status: 'pending_payment',
          payment_status: 'pending',
          amount_cents: jobPricing.price,
          stripe_price_id: jobPricing.priceId,
        })
        .eq('id', existingJobId)
        .eq('client_id', clientId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating job post:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update job post' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      jobPost = updatedJob;
    } else {
      // Create new job post in database
      const { data: newJobPost, error: jobPostError } = await supabaseClient
        .from('job_posts')
        .insert({
          client_id: clientId,
          title: jobPostData.title,
          job_type: jobPostData.type,
          classification: jobPostData.classification,
          location: jobPostData.location,
          salary: jobPostData.salary,
          description: jobPostData.description,
          requirements: jobPostData.requirements,
          benefits: jobPostData.benefits,
          company_name: companyData?.name || '',
          company_address: companyData?.address || '',
          company_phone: companyData?.phone || '',
          company_email: companyData?.email || '',
          company_website: companyData?.website || '',
          company_description: companyData?.description || '',
          status: 'pending_payment',
          payment_status: 'pending',
          amount_cents: jobPricing.price,
          stripe_price_id: jobPricing.priceId,
        })
        .select()
        .single();

      if (jobPostError) {
        console.error('Error creating job post:', jobPostError);
        return new Response(
          JSON.stringify({ error: 'Failed to create job post' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      jobPost = newJobPost;
    }

    // Create Stripe Payment Intent

    const paymentIntent = await stripe.paymentIntents.create({
      amount: jobPricing.price,
      currency: 'usd',
      metadata: {
        job_post_id: jobPost.id,
        client_id: clientId,
        classification: jobPostData.classification,
      },
      description: `Job Posting: ${jobPostData.title} (${jobPostData.classification})`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('PaymentIntent created successfully:', paymentIntent.id);

    // Update job post with payment intent ID
    const { error: updateError } = await supabaseClient
      .from('job_posts')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', jobPost.id);

    if (updateError) {
      console.error(
        'Error updating job post with payment intent:',
        updateError
      );
    }

    // Create payment transaction record
    const { error: transactionError } = await supabaseClient
      .from('payment_transactions')
      .insert({
        job_post_id: jobPost.id,
        stripe_payment_intent_id: paymentIntent.id,
        amount_cents: jobPricing.price,
        currency: 'usd',
        status: 'pending',
      });

    if (transactionError) {
      console.error('Error creating payment transaction:', transactionError);
    }

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        jobPostId: jobPost.id,
        paymentIntentId: paymentIntent.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
