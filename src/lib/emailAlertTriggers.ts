import { emailService } from './emailService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Trigger "No Sale / Job Staged" alert for jobs that have been staged but not paid
 * This should be called when a job is created but payment is not completed
 * Sends to both admin users and configured email alerts
 */
export async function triggerNoSaleAlert(jobId: string): Promise<boolean> {
  try {
    // Get job details
    const { data: jobData, error: jobError } = await supabase
      .from('job_posts')
      .select('id, title, status, payment_status, created_at, client_id')
      .eq('id', jobId)
      .single();

    if (jobError || !jobData) {
      console.error('Error fetching job data for no sale alert:', jobError);
      return false;
    }

    // Only trigger if job is staged (draft status) and payment is not completed
    if (jobData.status !== 'draft' || jobData.payment_status === 'completed') {
      return true; // Not applicable, but not an error
    }

    // Get client details
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, company_name, user_id')
      .eq('id', jobData.client_id)
      .single();

    if (clientError || !clientData) {
      console.error('Error fetching client data:', clientError);
      return false;
    }

    // Get profile details
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', clientData.user_id)
      .single();

    if (profileError || !profileData) {
      console.error('Error fetching profile data:', profileError);
      return false;
    }

    // Send the alert via Supabase function
    // The function will fetch admin emails and configured recipients using service role key
    const { error: functionError } = await supabase.functions.invoke(
      'send-email-alert',
      {
        body: {
          alertType: 'no_sale_job_staged',
          clientName: profileData.full_name || 'Client',
          clientEmail: profileData.email || '',
          jobTitle: jobData.title,
          signupDate: jobData.created_at,
          dashboardUrl: `${window.location.origin}/dashboard/job-staging`,
        },
      }
    );

    if (functionError) {
      console.error('Error sending job staged alert:', functionError);
      return false;
    }

    console.log('Job staged alert sent successfully');
    return true;
  } catch (error) {
    console.error('Error triggering no sale alert:', error);
    return false;
  }
}

/**
 * Trigger "Job Status Update" alert when job status changes to filled, not_hired, or cancelled
 * This should be called when job status is updated
 */
export async function triggerJobStatusAlert(
  jobId: string,
  newStatus: string,
  candidateName?: string
): Promise<boolean> {
  try {
    // Only trigger for specific status changes
    const relevantStatuses = ['filled', 'not_hired', 'cancelled'];
    if (!relevantStatuses.includes(newStatus)) {
      return true; // Not applicable, but not an error
    }

    // Get job details
    const { data: jobData, error: jobError } = await supabase
      .from('job_posts')
      .select('id, title, status, client_id')
      .eq('id', jobId)
      .single();

    if (jobError || !jobData) {
      console.error('Error fetching job data for status alert:', jobError);
      return false;
    }

    // Get client details
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, company_name, user_id')
      .eq('id', jobData.client_id)
      .single();

    if (clientError || !clientData) {
      console.error('Error fetching client data:', clientError);
      return false;
    }

    // Get profile details
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', clientData.user_id)
      .single();

    if (profileError || !profileData) {
      console.error('Error fetching profile data:', profileError);
      return false;
    }

    // Send the alert
    const alertData = {
      clientName: clientData.company_name || 'Client',
      clientEmail: profileData.email || '',
      jobTitle: jobData.title,
      jobStatus: newStatus as 'filled' | 'not_hired' | 'cancelled',
      candidateName,
      dashboardUrl: `${window.location.origin}/dashboard/manage-jobs`,
    };

    return await emailService.sendJobStatusAlert(alertData);
  } catch (error) {
    console.error('Error triggering job status alert:', error);
    return false;
  }
}

/**
 * Trigger "New Resume Uploaded" alert when a resume is uploaded
 * This should be called when a new resume is processed
 */
export async function triggerNewResumeAlert(
  candidateId: string,
  resumeUrl?: string
): Promise<boolean> {
  try {
    // Get candidate details
    const { data: candidateData, error: candidateError } = await supabase
      .from('candidates')
      .select('id, full_name, email')
      .eq('id', candidateId)
      .single();

    if (candidateError || !candidateData) {
      console.error(
        'Error fetching candidate data for resume alert:',
        candidateError
      );
      return false;
    }

    // Send the alert
    const alertData = {
      candidateName: candidateData.full_name,
      candidateEmail: candidateData.email,
      resumeUrl,
      dashboardUrl: `${window.location.origin}/dashboard/review-candidates`,
    };

    return await emailService.sendNewResumeAlert(alertData);
  } catch (error) {
    console.error('Error triggering new resume alert:', error);
    return false;
  }
}

/**
 * Trigger "Client Registered" alert when a new client signs up
 * This should be called when a client account is created
 * Sends to both admin users and configured email alerts
 */
export async function triggerClientRegisteredAlert(
  clientId: string
): Promise<boolean> {
  try {
    // Get client details
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, company_name, created_at, user_id, contact_phone, address')
      .eq('id', clientId)
      .single();

    if (clientError || !clientData) {
      console.error(
        'Error fetching client data for registration alert:',
        clientError
      );
      return false;
    }

    // Get profile details
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', clientData.user_id)
      .single();

    if (profileError || !profileData) {
      console.error('Error fetching profile data:', profileError);
      return false;
    }

    // Get admin emails (all users with admin role)
    const { data: adminProfiles, error: adminError } = await supabase
      .from('profiles')
      .select('email')
      .eq('role', 'admin');

    if (adminError) {
      console.error('Error fetching admin profiles:', adminError);
    }

    const adminEmails = adminProfiles?.map(p => p.email).filter(Boolean) || [];

    // Get configured alert emails for this alert type
    const { data: emailAlerts, error: alertsError } = await supabase
      .from('email_alerts')
      .select('recipient_email')
      .eq('alert_type', 'client_registered')
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

    if (allRecipients.length === 0) {
      console.warn('No recipients found for client registered alert');
      return true; // Not an error, just no recipients configured
    }

    // Send the alert via Supabase function
    const { error: functionError } = await supabase.functions.invoke(
      'send-email-alert',
      {
        body: {
          alertType: 'client_registered',
          recipientEmails: allRecipients,
          clientName: profileData.full_name || 'Client',
          clientEmail: profileData.email || '',
          companyName: clientData.company_name || 'Company',
          signupDate: clientData.created_at,
          dashboardUrl: `${window.location.origin}/dashboard`,
        },
      }
    );

    if (functionError) {
      console.error('Error sending client registered alert:', functionError);
      return false;
    }

    console.log(
      `Client registered alert sent to ${allRecipients.length} recipients`
    );
    return true;
  } catch (error) {
    console.error('Error triggering client registered alert:', error);
    return false;
  }
}

/**
 * Check for staged jobs that haven't been paid and send no-sale alerts
 * This can be called periodically or manually
 */
export async function checkAndSendNoSaleAlerts(): Promise<{
  success: boolean;
  alertsSent: number;
  errors: string[];
}> {
  try {
    const errors: string[] = [];
    let alertsSent = 0;

    // Find jobs that are staged (draft status) and haven't been paid
    // and were created more than 1 hour ago (to avoid immediate alerts)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: stagedJobs, error: jobsError } = await supabase
      .from('job_posts')
      .select('id, title, status, payment_status, created_at, client_id')
      .eq('status', 'draft')
      .neq('payment_status', 'completed')
      .lt('created_at', oneHourAgo);

    if (jobsError) {
      console.error('Error fetching staged jobs:', jobsError);
      return { success: false, alertsSent: 0, errors: [jobsError.message] };
    }

    if (!stagedJobs || stagedJobs.length === 0) {
      return { success: true, alertsSent: 0, errors: [] };
    }

    // Get all client IDs
    const clientIds = [...new Set(stagedJobs.map(j => j.client_id))];

    // Fetch clients
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('id, company_name, user_id')
      .in('id', clientIds);

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      return { success: false, alertsSent: 0, errors: [clientsError.message] };
    }

    // Get all user IDs
    const userIds = [...new Set((clientsData || []).map(c => c.user_id))];

    // Fetch profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, email')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return { success: false, alertsSent: 0, errors: [profilesError.message] };
    }

    // Create maps for efficient lookup
    const profilesMap = new Map(
      (profilesData || []).map(p => [p.user_id, p])
    );
    const clientsMap = new Map(
      (clientsData || []).map(c => [c.id, { ...c, profile: profilesMap.get(c.user_id) }])
    );

    // Send alerts for each staged job
    for (const job of stagedJobs) {
      try {
        const client = clientsMap.get(job.client_id);
        if (!client) {
          errors.push(`Client not found for job ${job.id}`);
          continue;
        }

        const alertData = {
          clientName: client.company_name || 'Client',
          clientEmail: client.profile?.email || '',
          jobTitle: job.title,
          signupDate: job.created_at,
          dashboardUrl: `${window.location.origin}/dashboard/job-staging`,
        };

        const success = await emailService.sendNoSaleAlert(alertData);
        if (success) {
          alertsSent++;
        }
      } catch (error) {
        const errorMsg = `Failed to send no-sale alert for job ${job.id}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return { success: true, alertsSent, errors };
  } catch (error) {
    console.error('Error in checkAndSendNoSaleAlerts:', error);
    return { success: false, alertsSent: 0, errors: [error as string] };
  }
}
