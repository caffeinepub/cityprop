import { useEffect, useState } from 'react';
import { useIsStripeConfigured, useIsCallerAdmin, useSetStripeConfiguration } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function StripeSetupCheck() {
  const { data: isConfigured, isLoading: configLoading } = useIsStripeConfigured();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const setStripeConfig = useSetStripeConfiguration();

  const [showSetup, setShowSetup] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [countries, setCountries] = useState('US,CA,GB');

  useEffect(() => {
    if (!configLoading && !adminLoading && isAdmin && !isConfigured) {
      setShowSetup(true);
    }
  }, [isConfigured, isAdmin, configLoading, adminLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!secretKey.trim()) {
      toast.error('Please enter your Stripe secret key');
      return;
    }

    const countryList = countries
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c.length === 2);

    if (countryList.length === 0) {
      toast.error('Please enter at least one valid country code');
      return;
    }

    try {
      await setStripeConfig.mutateAsync({
        secretKey: secretKey.trim(),
        allowedCountries: countryList,
      });
      toast.success('Stripe configured successfully!');
      setShowSetup(false);
    } catch (error: any) {
      toast.error('Failed to configure Stripe: ' + error.message);
    }
  };

  if (configLoading || adminLoading) {
    return null;
  }

  if (!isAdmin || isConfigured) {
    return null;
  }

  return (
    <Dialog open={showSetup} onOpenChange={setShowSetup}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Configure Stripe Payment</DialogTitle>
          <DialogDescription>Set up Stripe to enable payment processing for companion services</DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            You need to configure Stripe before clients can make bookings. Get your secret key from the{' '}
            <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="font-medium underline">
              Stripe Dashboard
            </a>
            .
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="secretKey">Stripe Secret Key *</Label>
            <Input id="secretKey" type="password" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} placeholder="sk_test_..." required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="countries">Allowed Countries (comma-separated) *</Label>
            <Input id="countries" value={countries} onChange={(e) => setCountries(e.target.value)} placeholder="US,CA,GB" required />
            <p className="text-xs text-muted-foreground">Use 2-letter country codes (e.g., US, CA, GB)</p>
          </div>

          <Button type="submit" className="w-full" disabled={setStripeConfig.isPending}>
            {setStripeConfig.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Configuring...
              </>
            ) : (
              'Configure Stripe'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
