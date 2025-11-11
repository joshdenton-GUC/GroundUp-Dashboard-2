import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, FileText, X } from 'lucide-react';

interface CandidateFormData {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  skills: string;
  experience_years: string;
  education: string;
  summary: string;
  selectedClient: string;
  selectedJobPost: string;
}

interface Client {
  id: string;
  company_name: string;
  user_id: string;
  email?: string;
}

interface JobPost {
  id: string;
  title: string;
  location: string;
  status: string;
  payment_status: string;
}

export function DocumentUploader() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<CandidateFormData>({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    skills: '',
    experience_years: '',
    education: '',
    summary: '',
    selectedClient: '',
    selectedJobPost: '',
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingJobPosts, setLoadingJobPosts] = useState(false);
  const [resumeParsed, setResumeParsed] = useState(false);
  const [clientsWithPendingReview, setClientsWithPendingReview] = useState<
    Set<string>
  >(new Set());

  const fetchClients = useCallback(async () => {
    try {
      setLoadingClients(true);

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, company_name, user_id')
        .order('company_name');

      if (clientsError) throw clientsError;

      // Get unique user IDs
      const userIds = [...new Set((clientsData || []).map(c => c.user_id))];

      // Fetch profiles for these user IDs
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of profiles by user_id
      const profilesMap = new Map(
        (profilesData || []).map(p => [p.user_id, p])
      );

      // Map the data to include email from profiles
      const clientsWithEmail = (clientsData || []).map(client => ({
        id: client.id,
        company_name: client.company_name,
        user_id: client.user_id,
        email: profilesMap.get(client.user_id)?.email || null,
      }));

      setClients(clientsWithEmail);

      // Fetch clients with pending review candidates
      const { data: pendingCandidates, error: pendingError } = await supabase
        .from('candidates')
        .select('client_id')
        .eq('status', 'pending_review');

      if (!pendingError && pendingCandidates) {
        const pendingSet = new Set(
          pendingCandidates.map(c => c.client_id).filter(Boolean)
        );
        setClientsWithPendingReview(pendingSet);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load clients',
        variant: 'destructive',
      });
    } finally {
      setLoadingClients(false);
    }
  }, [toast]);

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Fetch job posts when client is selected
  const fetchJobPosts = useCallback(
    async (clientId: string) => {
      try {
        setLoadingJobPosts(true);
        const { data, error } = await supabase
          .from('job_posts')
          .select('id, title, location, status, payment_status')
          .eq('client_id', clientId)
          .eq('status', 'posted') // Only show active/posted jobs
          .eq('payment_status', 'completed') // Only show paid jobs
          .order('created_at', { ascending: false });

        if (error) throw error;

        setJobPosts(data || []);
      } catch (error) {
        console.error('Error fetching job posts:', error);
        toast({
          title: 'Error',
          description: 'Failed to load job posts for this client',
          variant: 'destructive',
        });
      } finally {
        setLoadingJobPosts(false);
      }
    },
    [toast]
  );

  // Fetch job posts when client is selected
  useEffect(() => {
    if (formData.selectedClient) {
      fetchJobPosts(formData.selectedClient);
    } else {
      setJobPosts([]);
      setFormData(prev => ({ ...prev, selectedJobPost: '' }));
    }
  }, [formData.selectedClient, fetchJobPosts]);

  const parseResume = useCallback(
    async (resumePath: string) => {
      try {
        setParsing(true);

        // Get the Supabase URL from the client configuration
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

        if (!supabaseUrl) {
          throw new Error(
            'Supabase URL not configured. Please check environment variables.'
          );
        }

        const resumeUrl = `${supabaseUrl}/storage/v1/object/public/resumes/${resumePath}`;

        let data, error;

        try {
          const response = await supabase.functions.invoke('parse-resume', {
            body: {
              resumeUrl,
            },
          });
          data = response.data;
          error = response.error;
        } catch (networkError: any) {
          console.error(
            'Network error calling parse-resume function:',
            networkError
          );

          // Check if it's a CORS error
          if (
            networkError.message?.includes('CORS') ||
            networkError.message?.includes('fetch')
          ) {
            throw new Error(
              'Resume parsing service is currently unavailable due to a configuration issue. Please try again later or contact support.'
            );
          }

          throw new Error(
            `Resume parsing service error: ${
              networkError.message || 'Network connection failed'
            }`
          );
        }

        if (error) {
          console.error('Supabase function error:', error);

          // Provide more specific error messages based on error type
          let errorMessage = 'Resume parsing failed';
          if (error.message?.includes('404')) {
            errorMessage =
              'Resume parsing service is not available. Please contact support.';
          } else if (error.message?.includes('500')) {
            errorMessage =
              'Resume parsing service is temporarily down. Please try again later.';
          } else if (error.message?.includes('CORS')) {
            errorMessage =
              'Resume parsing service configuration issue. Please contact support.';
          } else {
            errorMessage = `Resume parsing failed: ${
              error.message || 'Unknown service error'
            }`;
          }

          throw new Error(errorMessage);
        }

        if (!data || !data.candidateInfo) {
          throw new Error(
            'No candidate information returned from resume parsing service'
          );
        }

        const { candidateInfo } = data;

        // Check if the response contains an error even though the HTTP status was 200
        if (data.error) {
          throw new Error(data.error);
        }

        // Check for processing errors in the response
        if (
          candidateInfo.full_name === 'Processing Failed' ||
          candidateInfo.full_name === 'Gemini Disabled' ||
          candidateInfo.full_name === 'Request Error' ||
          candidateInfo.full_name === 'Missing URL' ||
          candidateInfo.summary?.includes('Error:')
        ) {
          throw new Error(candidateInfo.summary || 'Resume processing failed');
        }

        // Validate essential fields
        if (
          !candidateInfo.full_name ||
          candidateInfo.full_name.trim() === '' ||
          candidateInfo.full_name === 'Unknown Name'
        ) {
          throw new Error(
            'Could not extract candidate name from resume. Please ensure the resume contains clear contact information.'
          );
        }

        // Auto-fill form with parsed data
        setFormData(prev => ({
          ...prev,
          full_name: candidateInfo.full_name || prev.full_name,
          email: candidateInfo.email || prev.email,
          phone: candidateInfo.phone || prev.phone,
          location: candidateInfo.location || prev.location,
          skills: Array.isArray(candidateInfo.skills)
            ? candidateInfo.skills.join(', ')
            : candidateInfo.skills || prev.skills,
          experience_years:
            candidateInfo.experience_years?.toString() || prev.experience_years,
          education: candidateInfo.education || prev.education,
          summary: candidateInfo.summary || prev.summary,
        }));

        toast({
          title: 'Resume Parsed Successfully',
          description:
            'Candidate information has been auto-filled from the resume.',
        });

        setResumeParsed(true);
        return candidateInfo;
      } catch (error: unknown) {
        console.error('Error parsing resume:', error);

        // Provide more specific error messages based on the error type
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        const errorTitle = 'Parsing Failed';
        let errorDescription =
          errorMessage ||
          'Could not parse resume automatically. Please fill in the information manually.';

        if (errorMessage.includes('Could not extract readable text')) {
          errorDescription =
            'Unable to read text from PDF. The file may be image-based or corrupted. Please try uploading a text-based PDF or Word document.';
        } else if (errorMessage.includes('Gemini API')) {
          errorDescription =
            'Resume analysis service is temporarily unavailable. Please try again later or contact support.';
        } else if (errorMessage.includes('Failed to download PDF')) {
          errorDescription =
            'Could not access the uploaded resume file. Please try uploading again.';
        }

        toast({
          title: errorTitle,
          description: errorDescription,
          variant: 'destructive',
        });

        throw error instanceof Error
          ? error
          : new Error('Unknown error occurred');
      } finally {
        setParsing(false);
      }
    },
    [toast]
  );

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !user) {
        if (!user) {
          toast({
            title: 'Authentication Required',
            description: 'Please log in to upload resumes',
            variant: 'destructive',
          });
        }
        return;
      }

      // Validate file type - PDF only
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Invalid file type',
          description:
            'Please upload a PDF file (.pdf). Other formats are not currently supported.',
          variant: 'destructive',
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast({
          title: 'File too large',
          description: `File size is ${(file.size / (1024 * 1024)).toFixed(
            1
          )}MB. Please upload a file smaller than 10MB.`,
          variant: 'destructive',
        });
        return;
      }

      if (file.size < 1024) {
        // 1KB minimum
        toast({
          title: 'File too small',
          description:
            'The uploaded file appears to be empty or corrupted. Please try a different file.',
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);

      // Auto-parse PDF files
      try {
        // Upload file temporarily for parsing
        const fileExt = file.name.split('.').pop();
        const fileName = `temp_${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;
        const filePath = `${user?.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, file);

        if (!uploadError) {
          await parseResume(filePath);
        }
      } catch (error) {
        console.error('Error during auto-parsing:', error);
        // Continue without parsing if it fails
      }
    },
    [toast, user, parseResume]
  );

  const uploadResume = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      return filePath;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !user ||
      !selectedFile ||
      !formData.selectedClient ||
      !formData.selectedJobPost
    )
      return;

    // Check if selected client has a pending review
    if (clientsWithPendingReview.has(formData.selectedClient)) {
      toast({
        title: 'Cannot Assign Candidate',
        description:
          'This client has a pending candidate review. Please wait for them to accept or reject the current candidate before assigning a new one.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      // Upload the resume file
      const resumeUrl = await uploadResume(selectedFile);
      if (!resumeUrl) {
        throw new Error('Failed to upload resume');
      }

      // Parse skills array
      const skillsArray = formData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      // Save candidate data to database with client assignment
      const { data: candidateData, error: insertError } = await supabase
        .from('candidates')
        .insert({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          location: formData.location || null,
          resume_url: resumeUrl,
          skills: skillsArray,
          experience_years: formData.experience_years || null,
          education: formData.education,
          summary: formData.summary,
          uploaded_by: user.id,
          client_id: formData.selectedClient,
          job_post_id: formData.selectedJobPost || null,
          status: 'pending_review',
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Get selected client details for targeted notification
      const selectedClient = clients.find(
        client => client.id === formData.selectedClient
      );

      // Get the client's user email from the profiles table
      let clientUserEmail = null;
      if (selectedClient) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('email')
          .eq('user_id', selectedClient.user_id)
          .single();

        if (!userError && userData) {
          clientUserEmail = userData.email;
        }
      }

      // Get job post details for email
      const selectedJob = jobPosts.find(
        jp => jp.id === formData.selectedJobPost
      );

      // Send targeted email notification to the selected client
      try {
        const { data, error } = await supabase.functions.invoke(
          'notify-client',
          {
            body: {
              candidateName: formData.full_name,
              candidateEmail: formData.email,
              candidateSkills: skillsArray,
              candidateSummary: formData.summary,
              candidateLocation:
                formData.location || selectedJob?.location || null,
              candidatePosition: selectedJob?.title || null,
              clientEmails: clientUserEmail ? [clientUserEmail] : [],
              candidateId: candidateData.id,
              clientId: selectedClient.id,
            },
          }
        );

        if (error) {
          console.error('Function error:', error);
          throw error;
        }

        console.log('Email notification sent to selected client:', data);
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the entire operation if email fails
      }

      // Get selected job post title for success message
      const selectedJobPost = jobPosts.find(
        jp => jp.id === formData.selectedJobPost
      );

      toast({
        title: 'Success',
        description: `Candidate uploaded successfully and assigned to ${
          selectedClient?.company_name
        } for the position: ${
          selectedJobPost?.title || 'Job Position'
        }. Client has been notified!`,
      });

      // Refresh clients to update pending review list
      await fetchClients();

      // Reset form
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        location: '',
        skills: '',
        experience_years: '',
        education: '',
        summary: '',
        selectedClient: '',
        selectedJobPost: '',
      });
      setSelectedFile(null);
      setResumeParsed(false);
    } catch (error: any) {
      console.error('Error uploading candidate:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload candidate',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setResumeParsed(false);
    // Reset form data when file is removed
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      location: '',
      skills: '',
      experience_years: '',
      education: '',
      summary: '',
      selectedClient: formData.selectedClient, // Keep client selection
      selectedJobPost: formData.selectedJobPost, // Keep job post selection
    });
  };

  const clearClient = () => {
    setFormData(prev => ({ ...prev, selectedClient: '' }));
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Candidate Resume
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Section */}
          <div className="space-y-2">
            <Label htmlFor="resume-upload" className="text-foreground">
              Resume File
            </Label>
            {!selectedFile ? (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <Button type="button" variant="outline" asChild>
                    <label htmlFor="resume-upload" className="cursor-pointer">
                      Choose File
                    </label>
                  </Button>
                  <Input
                    id="resume-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <p className="text-sm text-muted-foreground">
                    Upload PDF documents only (max 10MB)
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client-selection" className="text-foreground">
              Assign to Client *
            </Label>
            <div className="flex gap-2">
              <Select
                value={formData.selectedClient}
                onValueChange={value =>
                  setFormData(prev => ({ ...prev, selectedClient: value }))
                }
                disabled={loadingClients}
              >
                <SelectTrigger className="bg-background border-border flex-1">
                  <SelectValue
                    placeholder={
                      loadingClients ? 'Loading clients...' : 'Select a client'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => {
                    return (
                      <SelectItem
                        key={client.id}
                        value={client.id}
                        disabled={clientsWithPendingReview.has(client.id)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-start">
                            {client.company_name}
                          </span>
                          {client.email && (
                            <span className="text-xs text-muted-foreground">
                              {client.email}
                            </span>
                          )}
                        </div>
                        {clientsWithPendingReview.has(client.id) &&
                          ' [Pending Review]'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {formData.selectedClient && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearClient}
                  className="px-3"
                >
                  Clear
                </Button>
              )}
            </div>
            {formData.selectedClient && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-800">
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      Selected:{' '}
                      {
                        clients.find(c => c.id === formData.selectedClient)
                          ?.company_name
                      }
                    </span>
                    {clients.find(c => c.id === formData.selectedClient)
                      ?.email && (
                      <span className="text-xs text-blue-700">
                        {
                          clients.find(c => c.id === formData.selectedClient)
                            ?.email
                        }
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            {clients.length === 0 && !loadingClients && (
              <p className="text-sm text-muted-foreground">
                No clients available. Please add clients first.
              </p>
            )}
          </div>

          {/* Job Position Selection */}
          {formData.selectedClient && (
            <div className="space-y-2">
              <Label htmlFor="job-post-selection" className="text-foreground">
                Select Job Position *
              </Label>
              <Select
                value={formData.selectedJobPost}
                onValueChange={value =>
                  setFormData(prev => ({ ...prev, selectedJobPost: value }))
                }
                disabled={loadingJobPosts || jobPosts.length === 0}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue
                    placeholder={
                      loadingJobPosts
                        ? 'Loading job positions...'
                        : jobPosts.length === 0
                        ? 'No job positions available'
                        : 'Select a job position'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {jobPosts.map(job => (
                    <SelectItem key={job.id} value={job.id}>
                      <div className="flex flex-col text-start">
                        <span className="font-medium">{job.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {job.location} • Posted
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {jobPosts.length === 0 && !loadingJobPosts && (
                <p className="text-sm text-yellow-600">
                  ⚠️ This client has no active posted jobs. Only paid and
                  published jobs are available for candidate assignment.
                </p>
              )}
              {formData.selectedJobPost && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-800">
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        Position:{' '}
                        {
                          jobPosts.find(
                            jp => jp.id === formData.selectedJobPost
                          )?.title
                        }
                      </span>
                      <span className="text-xs text-green-700">
                        Location:{' '}
                        {
                          jobPosts.find(
                            jp => jp.id === formData.selectedJobPost
                          )?.location
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Candidate Information - Only show after resume is parsed */}
          {resumeParsed && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">
                    Resume Successfully Parsed
                  </span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  Candidate information has been extracted from the resume.
                  Fields are locked to ensure data integrity.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-foreground">
                    Full Name *
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    disabled
                    required
                    className="bg-muted border-border text-muted-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-muted border-border text-muted-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    disabled
                    className="bg-muted border-border text-muted-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-foreground">
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    disabled
                    placeholder="Not available"
                    className="bg-muted border-border text-muted-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience_years" className="text-foreground">
                    Years of Experience
                  </Label>
                  <Select
                    disabled
                    value={formData.experience_years}
                    onValueChange={value =>
                      setFormData(prev => ({
                        ...prev,
                        experience_years: value,
                      }))
                    }
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Entry Level (0-1 years)</SelectItem>
                      <SelectItem value="2">Junior (2-3 years)</SelectItem>
                      <SelectItem value="4">Mid-level (4-6 years)</SelectItem>
                      <SelectItem value="7">Senior (7-10 years)</SelectItem>
                      <SelectItem value="10">Expert (10+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills" className="text-foreground">
                  Skills (comma-separated)
                </Label>
                <Input
                  id="skills"
                  value={formData.skills}
                  disabled
                  placeholder="N/A"
                  className="bg-muted border-border text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="education" className="text-foreground">
                  Education
                </Label>
                <Input
                  id="education"
                  value={formData.education}
                  disabled
                  placeholder="N/A"
                  className="bg-muted border-border text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary" className="text-foreground">
                  Professional Summary
                </Label>
                {formData.summary && formData.summary.includes('•') ? (
                  <div className="bg-muted border border-border rounded-md p-3 min-h-[100px]">
                    <ul className="space-y-2 text-muted-foreground">
                      {formData.summary
                        .split(/•/)
                        .filter(item => item.trim())
                        .map((item, index) => (
                          <li key={index} className="flex gap-2">
                            <span className="text-primary font-bold">•</span>
                            <span className="flex-1">{item.trim()}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : (
                  <Textarea
                    id="summary"
                    value={formData.summary}
                    disabled
                    placeholder="Brief professional summary..."
                    className="bg-muted border-border text-muted-foreground min-h-[100px]"
                  />
                )}
              </div>
            </div>
          )}

          {/* Show parsing indicator when resume is being parsed */}
          {parsing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800">
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="font-medium">Parsing Resume...</span>
              </div>
              <p className="text-blue-700 text-sm mt-1">
                Analyzing resume content with AI. This may take a few moments.
              </p>
            </div>
          )}

          {/* Submit Button - Only show when resume is parsed, client and job are selected */}
          {resumeParsed &&
            formData.selectedClient &&
            formData.selectedJobPost && (
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={
                    uploading || parsing || !selectedFile || !formData.full_name
                  }
                  className="w-fit"
                >
                  {uploading
                    ? 'Uploading...'
                    : parsing
                    ? 'Parsing Resume...'
                    : 'Upload Candidate'}
                </Button>
              </div>
            )}

          {/* Show message when conditions are not met */}
          {!resumeParsed && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">
                  Upload and Parse Resume First
                </span>
              </div>
              <p className="text-yellow-700 text-sm mt-1">
                Please upload a resume file and wait for it to be parsed before
                proceeding.
              </p>
            </div>
          )}

          {resumeParsed && !formData.selectedClient && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">Select a Client</span>
              </div>
              <p className="text-yellow-700 text-sm mt-1">
                Please select a client to assign this candidate to before
                uploading.
              </p>
            </div>
          )}

          {resumeParsed &&
            formData.selectedClient &&
            !formData.selectedJobPost && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">Select a Job Position</span>
                </div>
                <p className="text-yellow-700 text-sm mt-1">
                  Please select a job position to assign this candidate to
                  before uploading.
                </p>
              </div>
            )}
        </form>
      </CardContent>
    </Card>
  );
}
