import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { JOB_PRICING, JobClassification, getStripe } from '@/lib/stripe';
import { supabase } from '@/integrations/supabase/client';
import { Check, CreditCard, Building2, Users } from 'lucide-react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  jobTitle: string;
  companyName: string;
  jobClassification: JobClassification;
  jobData: {
    title: string;
    type: 'full-time' | 'part-time' | 'contract' | 'temporary';
    classification: JobClassification;
    location: string;
    salary: string;
    description: string;
    requirements: string;
    benefits: string;
  };
  companyData: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    description: string;
  };
  existingJobId?: string;
}

// Payment Form Component using Stripe Elements
function PaymentForm({
  clientSecret,
  onSuccess,
  onError,
  jobClassification,
}: {
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  jobClassification: JobClassification;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPaymentElementReady, setIsPaymentElementReady] = useState(false);

  const isLoading = !stripe || !elements || !isPaymentElementReady;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setMessage('Stripe has not loaded yet. Please try again.');
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      });

      if (error) {
        setMessage(error.message);
        onError(error.message);
      } else {
        setMessage('Payment successful!');
        onSuccess();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      setMessage(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2">Loading payment form...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border rounded-lg p-4 bg-gray-50">
        <PaymentElement
          onReady={() => setIsPaymentElementReady(true)}
          options={{
            layout: 'tabs',
            defaultValues: {
              billingDetails: {
                name: '',
                email: '',
              },
            },
          }}
        />
      </div>

      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            message.includes('successful')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message}
        </div>
      )}

      <div className="sticky bottom-0 bg-white pt-4 border-t">
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || isProcessing}
        >
          {isProcessing ? 'Processing...' : isLoading ? 'Loading...' : `Pay for ${jobClassification} Job`}
        </Button>
      </div>
    </form>
  );
}

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  jobTitle,
  companyName,
  jobClassification,
  jobData,
  companyData,
  existingJobId,
}: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const pricing = JOB_PRICING[jobClassification];

  const createPaymentIntent = useCallback(async () => {
    setIsLoading(true);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get client ID for the current user
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (clientError || !clientData) {
        throw new Error('Client profile not found');
      }

      // Create payment intent
      const response = await fetch(
        `${
          import.meta.env.VITE_SUPABASE_URL
        }/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${
              (
                await supabase.auth.getSession()
              ).data.session?.access_token
            }`,
          },
          body: JSON.stringify({
            jobPostData: {
              title: jobData.title,
              type: jobData.type,
              classification: jobData.classification,
              location: jobData.location,
              salary: jobData.salary,
              description: jobData.description,
              requirements: jobData.requirements,
              benefits: jobData.benefits,
            },
            companyData: {
              name: companyData.name,
              address: companyData.address,
              phone: companyData.phone,
              email: companyData.email,
              website: companyData.website,
              description: companyData.description,
            },
            clientId: clientData.id,
            existingJobId: existingJobId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const { clientSecret: secret } = await response.json();
      setClientSecret(secret);
    } catch (error) {
      console.error('Payment intent creation error:', error);
      toast({
        title: 'Payment Setup Failed',
        description:
          error instanceof Error
            ? error.message
            : 'There was an error setting up payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [jobData, companyData, existingJobId, toast]);

  // Create payment intent when modal opens and reset when it closes
  useEffect(() => {
    if (isOpen && !clientSecret) {
      createPaymentIntent();
    } else if (!isOpen && clientSecret) {
      // Reset clientSecret when modal closes to ensure fresh state on reopen
      setClientSecret(null);
    }
  }, [isOpen, clientSecret, createPaymentIntent]);

  const handlePaymentSuccess = () => {
    toast({
      title: 'Payment Successful!',
      description: `Your ${jobClassification.toLowerCase()} job posting has been processed.`,
    });
    onSuccess();
    onClose();
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: 'Payment Failed',
      description: error,
      variant: 'destructive',
    });
  };

  const getIcon = () => {
    return jobClassification === 'STANDARD' ? (
      <Users className="w-6 h-6" />
    ) : (
      <Building2 className="w-6 h-6" />
    );
  };

  const getFeatures = () => {
    const standardFeatures = [
      'Job posting visibility',
      'Basic candidate matching',
      'Standard support',
    ];

    const premiumFeatures = [
      'Premium job posting visibility',
      'Advanced candidate matching',
      'Priority support',
      'Enhanced analytics',
      'Dedicated account manager',
    ];

    return jobClassification === 'STANDARD'
      ? standardFeatures
      : premiumFeatures;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Complete Your Job Posting
          </DialogTitle>
          <DialogDescription>
            Choose your payment method to publish your job listing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {/* Job Summary */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Job Title:</span>
                <span className="font-medium">{jobTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Company:</span>
                <span className="font-medium">{companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Classification:</span>
                <Badge
                  variant={
                    jobClassification === 'STANDARD' ? 'default' : 'secondary'
                  }
                >
                  {getIcon()}
                  <span className="ml-1">{pricing.label}</span>
                </Badge>
              </div>
            </CardContent>
          </Card> */}

          {/* Pricing Card */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {getIcon()}
                  {pricing.label}
                </span>
                <span className="text-2xl font-bold text-primary">
                  ${pricing.price.toLocaleString()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{pricing.description}</p>

              <div className="space-y-2">
                <h4 className="font-medium">What's included:</h4>
                <ul className="space-y-1">
                  {getFeatures().map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Setting up payment...</span>
            </div>
          ) : clientSecret ? (
            <Elements
              key={clientSecret}
              stripe={getStripe()}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#2563eb',
                    colorBackground: '#ffffff',
                    colorText: '#30313d',
                    colorDanger: '#df1b41',
                    fontFamily: 'system-ui, sans-serif',
                    spacingUnit: '4px',
                    borderRadius: '8px',
                  },
                },
                loader: 'auto',
              }}
            >
              <PaymentForm
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                jobClassification={jobClassification}
              />
            </Elements>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Failed to initialize payment</p>
              <Button
                variant="outline"
                onClick={createPaymentIntent}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Security Notice */}
          <div className="text-center text-sm text-gray-500">
            <p>🔒 Secure payment powered by Stripe</p>
            <p>Your payment information is encrypted and secure</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
