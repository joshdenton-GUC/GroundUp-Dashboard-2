import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Send } from 'lucide-react';

export const EmailAlertTester = () => {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const testEmailAlert = async (alertType: string) => {
    setTesting(true);
    setLastResult(null);

    try {
      console.log(`Testing email alert: ${alertType}`);

      // Call the send-email-alert function directly
      const { data, error } = await supabase.functions.invoke('send-email-alert', {
        body: {
          alertType,
          clientName: 'Test Client',
          clientEmail: 'test@example.com',
          companyName: 'Test Company Inc.',
          jobTitle: 'Senior Software Engineer',
          signupDate: new Date().toISOString(),
          dashboardUrl: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        console.error('Error testing email alert:', error);
        throw error;
      }

      console.log('Email alert test result:', data);
      setLastResult(data);

      toast({
        title: 'Test Email Sent!',
        description: data?.emailsSent
          ? `Successfully sent to ${data.successCount} recipient(s)`
          : 'Email logged (Resend not configured)',
      });
    } catch (error: any) {
      console.error('Error testing email alert:', error);
      toast({
        variant: 'destructive',
        title: 'Test Failed',
        description: error.message || 'Failed to send test email',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Alert Testing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">How to Test:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Make sure you've configured email alerts above</li>
            <li>Click a test button below</li>
            <li>Check your email inbox (and spam folder)</li>
            <li>Check the result message below</li>
          </ol>
        </div>

        <div className="grid gap-3">
          <Button
            onClick={() => testEmailAlert('client_registered')}
            disabled={testing}
            variant="outline"
            className="justify-start"
          >
            <Send className="h-4 w-4 mr-2" />
            Test "New Client Registered" Alert
          </Button>

          <Button
            onClick={() => testEmailAlert('no_sale_job_staged')}
            disabled={testing}
            variant="outline"
            className="justify-start"
          >
            <Send className="h-4 w-4 mr-2" />
            Test "No Sale / Job Staged" Alert
          </Button>

          <Button
            onClick={() => testEmailAlert('job_status_update')}
            disabled={testing}
            variant="outline"
            className="justify-start"
          >
            <Send className="h-4 w-4 mr-2" />
            Test "Job Status Update" Alert
          </Button>
        </div>

        {lastResult && (
          <div className="border rounded-lg p-4 bg-muted">
            <h3 className="font-medium mb-2">Last Test Result:</h3>
            <div className="space-y-1 text-sm">
              <div>
                <span className="font-medium">Message:</span> {lastResult.message}
              </div>
              <div>
                <span className="font-medium">Emails Sent:</span>{' '}
                {lastResult.emailsSent ? 'Yes (via Resend)' : 'No (logged only)'}
              </div>
              <div>
                <span className="font-medium">Success Count:</span>{' '}
                {lastResult.successCount || 0}
              </div>
              <div>
                <span className="font-medium">Failure Count:</span>{' '}
                {lastResult.failureCount || 0}
              </div>
            </div>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-900 mb-2">⚠️ Important:</h3>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>
              If "Emails Sent: No (logged only)" appears, the Resend API key is not
              configured
            </li>
            <li>
              If you configured an email alert above, you should receive the test
              email
            </li>
            <li>Check your spam folder if you don't see the email</li>
            <li>All admin users also receive these emails automatically</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
