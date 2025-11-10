import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const AuthCallbackPage = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [emailAlertSent, setEmailAlertSent] = useState(false);

  // Check if this is a password recovery flow
  useEffect(() => {
    const checkForRecoveryFlow = () => {
      // If the hash contains type=recovery, redirect to reset password page
      if (location.hash && location.hash.includes('type=recovery')) {
        console.log('[AuthCallback] Recovery flow detected, redirecting to reset password page');
        navigate('/reset-password', { replace: true });
      }
    };
    
    checkForRecoveryFlow();
  }, [location.hash, navigate]);

  const redirectUser = useCallback(() => {
    // Redirect based on user role
    if (profile?.role === 'admin') {
      navigate('/dashboard');
    } else {
      // Default redirect for regular users
      navigate('/post-new-job');
    }
  }, [profile, navigate]);

  const triggerClientRegistrationEmail = async (userId: string) => {
    try {
      console.log(
        '[ClientRegistration] Checking for new client signup...',
        userId
      );

      // Get the client record
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, created_at, welcome_email_sent')
        .eq('user_id', userId)
        .single();

      if (clientError) {
        console.error(
          '[ClientRegistration] Error fetching client:',
          clientError
        );
        return;
      }

      if (!clientData) {
        console.log('[ClientRegistration] No client record found');
        return;
      }

      console.log('[ClientRegistration] Client found:', {
        id: clientData.id,
        created_at: clientData.created_at,
        welcome_email_sent: clientData.welcome_email_sent,
      });

      // Check if email was already sent
      if (clientData.welcome_email_sent) {
        console.log(
          '[ClientRegistration] Welcome email already sent, skipping'
        );
        return;
      }

      // Check if this is a newly created account (created within last 30 minutes)
      const thirtyMinutesAgo = new Date(
        Date.now() - 30 * 60 * 1000
      ).toISOString();

      if (clientData.created_at < thirtyMinutesAgo) {
        console.log(
          '[ClientRegistration] Client account is older than 30 minutes, skipping'
        );
        return;
      }

      console.log(
        '[ClientRegistration] New client detected, sending registration email...'
      );

      // Call the notify-new-client Edge Function
      const { data: functionData, error: emailError } =
        await supabase.functions.invoke('notify-new-client', {
          body: { clientId: clientData.id },
        });

      if (emailError) {
        console.error('[ClientRegistration] Failed to send email:', emailError);
        return;
      }

      console.log(
        '[ClientRegistration] Email function response:',
        functionData
      );

      // Mark email as sent
      const { error: updateError } = await supabase
        .from('clients')
        .update({ welcome_email_sent: true })
        .eq('id', clientData.id);

      if (updateError) {
        console.error(
          '[ClientRegistration] Failed to mark email as sent:',
          updateError
        );
      } else {
        console.log(
          '[ClientRegistration] ✅ Successfully sent registration email and marked as sent'
        );
      }
    } catch (error) {
      console.error('[ClientRegistration] Unexpected error:', error);
    }
  };

  const handleAuthentication = useCallback(async () => {
    if (!user || !profile) return;

    // Get URL parameters to check if this is an invite flow
    const searchParams = new URLSearchParams(location.search);
    const inviteType = searchParams.get('type');

    // Only check password_set for invite flows, not regular signups
    if (inviteType === 'invite' && !user.user_metadata?.password_set) {
      console.log(
        '[AuthCallback] Invited user needs to set password, redirecting...'
      );
      navigate('/auth/set-password');
      return;
    }

    // Trigger client registration email alert for new clients
    if (profile.role === 'client' && !emailAlertSent) {
      await triggerClientRegistrationEmail(user.id);
      setEmailAlertSent(true);
    }

    // Redirect user based on their role
    redirectUser();
  }, [user, profile, navigate, location.search, emailAlertSent, redirectUser]);

  useEffect(() => {
    // If user is not authenticated, redirect to home
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Handle authentication when user is authenticated
    if (!loading && user && profile) {
      handleAuthentication();
    }
  }, [user, profile, loading, emailAlertSent, handleAuthentication]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange mx-auto mb-4"></div>
          <p className="text-lg">Completing your authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to home
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange mx-auto mb-4"></div>
        <p className="text-lg">Redirecting you to your dashboard...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
