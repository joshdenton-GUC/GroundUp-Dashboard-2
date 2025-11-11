import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, Eye, ExternalLink } from 'lucide-react';

interface Candidate {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  resume_url: string | null;
  skills: string[] | null;
  experience_years: string | null;
  education: string | null;
  summary: string | null;
  created_at: string;
  status: string;
  client_id: string | null;
  client_name: string | null;
  client_email: string | null;
}

// Helper function to convert experience value to readable label
function getExperienceLabel(value: string | null): string {
  if (!value) return 'Not specified';

  const labels: Record<string, string> = {
    '0': 'Entry Level (0-1 years)',
    '2': 'Junior (2-3 years)',
    '4': 'Mid-level (4-6 years)',
    '7': 'Senior (7-10 years)',
    '10': 'Expert (10+ years)',
  };

  return labels[value] || `${value} years`;
}

export function CandidateManager() {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      {
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
        label: string;
      }
    > = {
      pending_review: { variant: 'outline', label: 'Pending Review' },
      reviewing: { variant: 'secondary', label: 'Reviewing' },
      interviewing: { variant: 'default', label: 'Interviewing' },
      hired: { variant: 'default', label: 'Hired' },
      not_hired: { variant: 'destructive', label: 'Not Hired' },
      rejected: { variant: 'destructive', label: 'Rejected' },
      withdrawn: { variant: 'outline', label: 'Withdrawn' },
    };

    const config = statusConfig[status] || {
      variant: 'outline' as const,
      label: status,
    };

    return (
      <Badge variant={config.variant} className="capitalize">
        {config.label}
      </Badge>
    );
  };

  const fetchCandidates = useCallback(async () => {
    try {
      // Fetch all candidates
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (candidatesError) throw candidatesError;

      // Get unique client IDs
      const clientIds = [
        ...new Set(
          (candidatesData || [])
            .map(c => c.client_id)
            .filter(Boolean) as string[]
        ),
      ];

      if (clientIds.length === 0) {
        // No clients to fetch, just use candidates data
        const transformedData = (candidatesData || []).map(candidate => ({
          ...candidate,
          client_name: null,
          client_email: null,
        }));
        setCandidates(transformedData);
        return;
      }

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, company_name, user_id')
        .in('id', clientIds);

      if (clientsError) throw clientsError;

      // Get unique user IDs from clients
      const userIds = [
        ...new Set((clientsData || []).map(c => c.user_id).filter(Boolean)),
      ];

      // Fetch profiles for these user IDs
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Create maps for efficient lookup
      const profilesMap = new Map(
        (profilesData || []).map(p => [p.user_id, p])
      );
      const clientsMap = new Map(
        (clientsData || []).map(c => ({
          ...c,
          profile: profilesMap.get(c.user_id),
        }))
          .map(c => [c.id, c])
      );

      // Transform the data to include client_name and client_email
      const transformedData = (candidatesData || []).map(candidate => {
        const client = candidate.client_id
          ? clientsMap.get(candidate.client_id)
          : null;
        return {
          ...candidate,
          client_name: client?.company_name || null,
          client_email: client?.profile?.email || null,
        };
      });

      setCandidates(transformedData);
    } catch (error: any) {
      console.error('Error fetching candidates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load candidates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const filteredCandidates = candidates.filter(candidate => {
    // Search filter
    const matchesSearch =
      candidate.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.skills?.some(skill =>
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      );

    // Status filter
    const matchesStatus =
      statusFilter === 'all' || candidate.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const viewResume = async (resumeUrl: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .createSignedUrl(resumeUrl, 3600); // 1 hour expiry

      if (error) throw error;

      window.open(data.signedUrl, '_blank');
    } catch (error: any) {
      console.error('Error viewing resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to load resume',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading candidates...</div>;
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Search className="h-5 w-5" />
          Candidate Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search candidates by name, email, company, or skills..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] bg-background border-border">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="interviewing">Interviewing</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="not_hired">Not Hired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Candidates Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-foreground">Name</TableHead>
                  <TableHead className="text-foreground">Contact</TableHead>
                  <TableHead className="text-foreground">Experience</TableHead>
                  <TableHead className="text-foreground">Skills</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                  <TableHead className="text-foreground">
                    Assigned Client
                  </TableHead>
                  <TableHead className="text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                    >
                      No candidates found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCandidates.map(candidate => (
                    <TableRow key={candidate.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-foreground">
                        {candidate.full_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="space-y-1">
                          {candidate.email && (
                            <div className="text-sm">{candidate.email}</div>
                          )}
                          {candidate.phone && (
                            <div className="text-sm">{candidate.phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getExperienceLabel(candidate.experience_years)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {candidate.skills?.slice(0, 3).map((skill, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {candidate.skills && candidate.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{candidate.skills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(candidate.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="space-y-1">
                          {candidate.client_name ? (
                            <>
                              <div className="font-medium text-foreground">
                                {candidate.client_name}
                              </div>
                              {candidate.client_email && (
                                <div className="text-sm text-muted-foreground">
                                  {candidate.client_email}
                                </div>
                              )}
                            </>
                          ) : (
                            <div>Not assigned</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl bg-card border-border" >
                              <DialogHeader>
                                <DialogTitle className="text-foreground">
                                  Candidate Details
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <h4 className="font-medium text-foreground">
                                      Name
                                    </h4>
                                    <p className="text-muted-foreground">
                                      {candidate.full_name}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-foreground">
                                      Email
                                    </h4>
                                    <p className="text-muted-foreground">
                                      {candidate.email || 'Not provided'}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-foreground">
                                      Phone
                                    </h4>
                                    <p className="text-muted-foreground">
                                      {candidate.phone || 'Not provided'}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-foreground">
                                      Experience
                                    </h4>
                                    <p className="text-muted-foreground">
                                      {getExperienceLabel(
                                        candidate.experience_years
                                      )}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-foreground">
                                      Status
                                    </h4>
                                    <div className="mt-1">
                                      {getStatusBadge(candidate.status)}
                                    </div>
                                  </div>
                                </div>

                                {candidate.education && (
                                  <div>
                                    <h4 className="font-medium text-foreground">
                                      Education
                                    </h4>
                                    <p className="text-muted-foreground">
                                      {candidate.education}
                                    </p>
                                  </div>
                                )}

                                {candidate.skills &&
                                  candidate.skills.length > 0 && (
                                    <div>
                                      <h4 className="font-medium text-foreground">
                                        Skills
                                      </h4>
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        {candidate.skills.map(
                                          (skill, index) => (
                                            <Badge
                                              key={index}
                                              variant="secondary"
                                            >
                                              {skill}
                                            </Badge>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {candidate.summary && (
                                  <div>
                                    <h4 className="font-medium text-foreground">
                                      Summary
                                    </h4>
                                    {candidate.summary.includes('•') ? (
                                      <ul className="space-y-2 text-muted-foreground">
                                        {candidate.summary
                                          .split('\n')
                                          .map((line, index) => {
                                            const trimmedLine = line.trim();
                                            if (trimmedLine.startsWith('•')) {
                                              return (
                                                <li
                                                  key={index}
                                                  className="flex gap-2"
                                                >
                                                  <span className="text-primary font-bold">
                                                    •
                                                  </span>
                                                  <span className="flex-1">
                                                    {trimmedLine
                                                      .substring(1)
                                                      .trim()}
                                                  </span>
                                                </li>
                                              );
                                            } else if (trimmedLine) {
                                              return (
                                                <li
                                                  key={index}
                                                  className="flex gap-2"
                                                >
                                                  <span className="text-primary font-bold">
                                                    •
                                                  </span>
                                                  <span className="flex-1">
                                                    {trimmedLine}
                                                  </span>
                                                </li>
                                              );
                                            }
                                            return null;
                                          })}
                                      </ul>
                                    ) : (
                                      <p className="text-muted-foreground">
                                        {candidate.summary}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {candidate.resume_url && (
                                  <div>
                                    <Button
                                      onClick={() =>
                                        viewResume(candidate.resume_url!)
                                      }
                                      variant="outline"
                                      className="w-full"
                                    >
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      View Resume
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
