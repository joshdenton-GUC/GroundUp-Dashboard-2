import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentUploader } from './DocumentUploader';
import { CandidateManager } from './CandidateManager';
import { ClientManager } from './ClientManager';
import { EmailAlertsManager } from './EmailAlertsManager';
import { EmailAlertTester } from './EmailAlertTester';
import { SecurityAuditLog } from './SecurityAuditLog';
import { AddClientDialog } from './AddClientDialog';
import {
  Upload,
  Users,
  Building2,
  LogOut,
  UserPlus,
  Briefcase,
  DollarSign,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DashboardMetrics {
  totalCandidates: number;
  activeClients: number;
  candidatesChangePercent: number;
  clientsChangePercent: number;
}

interface ActivityLog {
  id: string;
  type: 'user_registered' | 'job_staged' | 'job_paid';
  description: string;
  timestamp: string;
  icon: React.ReactNode;
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCandidates: 0,
    activeClients: 0,
    candidatesChangePercent: 0,
    clientsChangePercent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const { signOut } = useAuth();
  const { toast } = useToast();

  const fetchDashboardMetrics = useCallback(async () => {
    try {
      setLoading(true);

      // --- Base Metrics ---
      // Total candidates count
      const { count: totalCandidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true });

      if (candidatesError) throw candidatesError;

      // Active clients count (role = 'client')
      const { count: activeClients, error: clientsError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'client');

      if (clientsError) throw clientsError;

      // --- Date Ranges for Monthly Comparison ---
      const now = new Date();
      const startOfCurrentMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );
      const startOfPreviousMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );

      // --- Current Month Counts ---
      const { count: currentMonthCandidates, error: currentCandidatesError } =
        await supabase
          .from('candidates')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfCurrentMonth.toISOString());

      if (currentCandidatesError) throw currentCandidatesError;

      const { count: currentMonthClients, error: currentClientsError } =
        await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfCurrentMonth.toISOString());
      if (currentClientsError) throw currentClientsError;

      // --- Previous Month Counts ---
      const { count: prevMonthCandidates, error: prevCandidatesError } =
        await supabase
          .from('candidates')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfPreviousMonth.toISOString())
          .lt('created_at', startOfCurrentMonth.toISOString());

      if (prevCandidatesError) throw prevCandidatesError;

      const { count: prevMonthClients, error: prevClientsError } =
        await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfPreviousMonth.toISOString())
          .lt('created_at', startOfCurrentMonth.toISOString());

      if (prevClientsError) throw prevClientsError;

      // --- Percentage Change Calculation ---
      const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      const candidatesChangePercent = calculateChange(
        currentMonthCandidates,
        prevMonthCandidates
      );
      const clientsChangePercent = calculateChange(
        currentMonthClients,
        prevMonthClients
      );

      // --- Update Metrics State ---
      setMetrics({
        totalCandidates: totalCandidates || 0,
        activeClients: activeClients || 0,
        candidatesChangePercent,
        clientsChangePercent,
      });
    } catch (error: any) {
      console.error('Error fetching dashboard metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard metrics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchRecentActivities = useCallback(async () => {
    try {
      setActivitiesLoading(true);
      const allActivities: ActivityLog[] = [];

      // Fetch recent user registrations
      const { data: recentUsers, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (usersError) throw usersError;

      if (recentUsers) {
        recentUsers.forEach(user => {
          allActivities.push({
            id: `user-${user.user_id}`,
            type: 'user_registered',
            description: `New user registered: ${
              user.full_name || user.email || 'Unknown'
            }`,
            timestamp: user.created_at,
            icon: <UserPlus className="h-4 w-4 text-green-600" />,
          });
        });
      }

      // Fetch recent staged jobs (draft status) with client info
      const { data: stagedJobs, error: stagedError } = await supabase
        .from('job_posts')
        .select(
          `
          id, 
          title, 
          created_at, 
          status,
          client_id,
          clients(company_name)
        `
        )
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(10);

      if (stagedError) throw stagedError;

      if (stagedJobs) {
        stagedJobs.forEach((job: any) => {
          const clientName = job.clients?.company_name || 'Unknown Client';
          allActivities.push({
            id: `staged-${job.id}`,
            type: 'job_staged',
            description: `Job staged by ${clientName}: ${job.title}`,
            timestamp: job.created_at,
            icon: <Briefcase className="h-4 w-4 text-blue-600" />,
          });
        });
      }

      // Fetch recent paid jobs with client info
      const { data: paidJobs, error: paidError } = await supabase
        .from('job_posts')
        .select(
          `
          id, 
          title, 
          created_at, 
          payment_status, 
          posted_at,
          client_id,
          clients(company_name)
        `
        )
        .eq('payment_status', 'completed')
        .order('posted_at', { ascending: false })
        .limit(10);

      if (paidError) throw paidError;

      if (paidJobs) {
        paidJobs.forEach((job: any) => {
          const clientName = job.clients?.company_name || 'Unknown Client';
          allActivities.push({
            id: `paid-${job.id}`,
            type: 'job_paid',
            description: `Job posted by ${clientName}: ${job.title}`,
            timestamp: job.posted_at || job.created_at,
            icon: <DollarSign className="h-4 w-4 text-emerald-600" />,
          });
        });
      }

      // Sort all activities by timestamp and take the last 20
      const sortedActivities = allActivities
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 20);

      setActivities(sortedActivities);
    } catch (error: any) {
      console.error('Error fetching recent activities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recent activities',
        variant: 'destructive',
      });
    } finally {
      setActivitiesLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardMetrics();
    fetchRecentActivities();
  }, [fetchDashboardMetrics, fetchRecentActivities]);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Admin Dashboard
          </h2>
          <p className="text-muted-foreground">
            Manage candidates, clients, and uploads from this central hub.
          </p>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7 bg-muted/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="upload">Upload Resumes</TabsTrigger>
          <TabsTrigger value="candidates">Assign Candidates</TabsTrigger>
          <TabsTrigger value="clients">Manage Clients</TabsTrigger>
          <TabsTrigger value="alerts">Email Alerts</TabsTrigger>
          {/* <TabsTrigger value="security">Security</TabsTrigger> */}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Candidates
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {loading ? '...' : metrics.totalCandidates.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loading
                    ? 'Loading...'
                    : `${metrics.candidatesChangePercent >= 0 ? '+' : ''}${
                        metrics.candidatesChangePercent
                      }% from last month`}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Clients
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {loading ? '...' : metrics.activeClients.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loading
                    ? 'Loading...'
                    : `${metrics.clientsChangePercent >= 0 ? '+' : ''}${
                        metrics.clientsChangePercent
                      }% from last month`}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => setActiveTab('upload')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New Resume
                </Button>
                <AddClientDialog
                  trigger={
                    <Button className="w-full justify-start" variant="outline">
                      <Building2 className="mr-2 h-4 w-4" />
                      Add New Client
                    </Button>
                  }
                  onSuccess={() => {
                    // Refresh metrics when a new client is added
                    fetchDashboardMetrics();
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Log */}
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-xl font-bold text-foreground">
                  Recent Activity
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Last 20 activities across the platform
                </p>
              </div>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Loading activities...</p>
                </div>
              ) : activities.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">
                    No recent activities found
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {activities.map(activity => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="mt-0.5">{activity.icon}</div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium text-foreground leading-none">
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <DocumentUploader />
        </TabsContent>

        <TabsContent value="candidates">
          <CandidateManager />
        </TabsContent>

        <TabsContent value="clients">
          <ClientManager />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <EmailAlertsManager />
          <EmailAlertTester />
        </TabsContent>
        <TabsContent value="security">
          <SecurityAuditLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
