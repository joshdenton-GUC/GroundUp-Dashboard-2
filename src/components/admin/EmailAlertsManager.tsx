import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailAlert {
  id: string;
  alert_type: string;
  recipient_email: string;
  is_active: boolean;
  created_at: string;
}

const ALERT_TYPES = [
  {
    value: 'new_job_posted',
    label: 'New Job Requisite',
  },
  { value: 'client_registered', label: 'New Client Registered' },
  { value: 'no_sale_job_staged', label: 'No Sale / Job Staged' },
  { value: 'job_status_update', label: 'Job Status Update' },
  { value: 'resume_rejection', label: 'Resume Rejection' },
];

export const EmailAlertsManager = () => {
  const [emailAlerts, setEmailAlerts] = useState<EmailAlert[]>([]);
  const [newAlert, setNewAlert] = useState({
    alert_type: '',
    recipient_email: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchEmailAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('email_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmailAlerts(data || []);
    } catch (error) {
      console.error('Error fetching email alerts:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch email alerts',
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchEmailAlerts();
  }, [fetchEmailAlerts]);

  const addEmailAlert = async () => {
    if (
      !newAlert.alert_type ||
      !newAlert.recipient_email.trim() ||
      !newAlert.recipient_email.includes('@')
    ) {
      toast({
        variant: 'destructive',
        title: 'Invalid Data',
        description:
          'Please select an alert type and enter a valid email address',
      });
      return;
    }

    setLoading(true);
    try {
      // Get the current user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from('email_alerts').insert([
        {
          alert_type: newAlert.alert_type,
          recipient_email: newAlert.recipient_email.trim(),
          is_active: newAlert.is_active,
          created_by: user?.id,
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Email alert configured successfully',
      });

      setNewAlert({
        alert_type: '',
        recipient_email: '',
        is_active: true,
      });
      fetchEmailAlerts();
    } catch (error) {
      console.error('Error adding email alert:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to configure email alert',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAlert = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('email_alerts')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Alert ${isActive ? 'enabled' : 'disabled'} successfully`,
      });

      fetchEmailAlerts();
    } catch (error) {
      console.error('Error updating email alert:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update email alert',
      });
    }
  };

  const removeEmailAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from('email_alerts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Email alert removed successfully',
      });

      fetchEmailAlerts();
    } catch (error) {
      console.error('Error removing email alert:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove email alert',
      });
    }
  };

  const getAlertTypeLabel = (type: string) => {
    const alertType = ALERT_TYPES.find(t => t.value === type);
    return alertType ? alertType.label : type;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Email Alert Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="alert-type">Alert Type</Label>
            <Select
              value={newAlert.alert_type}
              onValueChange={value =>
                setNewAlert({ ...newAlert, alert_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select alert type" />
              </SelectTrigger>
              <SelectContent>
                {ALERT_TYPES.map(type => (
                  <SelectItem
                    key={type.value}
                    value={type.value}
                    style={{ cursor: 'pointer' }}
                  >
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="recipient-email">Recipient Email</Label>
            <Input
              id="recipient-email"
              type="email"
              placeholder="notifications@example.com"
              value={newAlert.recipient_email}
              onChange={e =>
                setNewAlert({ ...newAlert, recipient_email: e.target.value })
              }
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={addEmailAlert}
              disabled={
                loading ||
                !newAlert.alert_type ||
                !newAlert.recipient_email.trim()
              }
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Alert
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Configured Email Alerts</Label>
          {emailAlerts.length === 0 ? (
            <p className="text-muted-foreground">No email alerts configured</p>
          ) : (
            <div className="space-y-3">
              {emailAlerts.map(alert => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {getAlertTypeLabel(alert.alert_type)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {alert.recipient_email}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alert.is_active}
                        onCheckedChange={checked =>
                          toggleAlert(alert.id, checked)
                        }
                      />
                      <span className="text-sm">
                        {alert.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeEmailAlert(alert.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
