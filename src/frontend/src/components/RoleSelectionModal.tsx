import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Car, CheckCircle } from 'lucide-react';
import { AppRole } from '../backend';

interface RoleSelectionModalProps {
  onRoleSelected: (role: AppRole) => void;
}

export default function RoleSelectionModal({ onRoleSelected }: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      onRoleSelected(selectedRole);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-3xl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to Cityprop</DialogTitle>
          <DialogDescription className="text-base">Choose how you'd like to use our platform</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-6 md:grid-cols-2">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-gold ${
              selectedRole === AppRole.customer
                ? 'border-2 border-primary shadow-gold' 
                : 'border-2 border-muted hover:border-primary/50'
            }`}
            onClick={() => setSelectedRole(AppRole.customer)}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-xl">Customer</CardTitle>
              <CardDescription>Book services and companions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>Book companion services for parties, hospitals, meetings, and shopping</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>Select from verified professional drivers</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>Transparent pricing with secure payments</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>Real-time GPS tracking for safety</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-gold ${
              selectedRole === AppRole.driver
                ? 'border-2 border-primary shadow-gold' 
                : 'border-2 border-muted hover:border-primary/50'
            }`}
            onClick={() => setSelectedRole(AppRole.driver)}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Car className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-xl">Driver</CardTitle>
              <CardDescription>Provide companion services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>Earn money providing companion services</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>Flexible schedule - work when you want</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>Automatic payment processing via Stripe</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>Background verification for safety</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3">
          <Button 
            onClick={handleContinue} 
            disabled={!selectedRole}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-gold px-8"
            size="lg"
          >
            Continue as {selectedRole === AppRole.customer ? 'Customer' : selectedRole === AppRole.driver ? 'Driver' : '...'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
