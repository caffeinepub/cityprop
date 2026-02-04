import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Loader2, Navigation, User, Car, Info, CreditCard, ShoppingBag, Hospital, PartyPopper, Briefcase, Package, Languages } from 'lucide-react';
import { UserProfile, ShoppingItem, Trip, TripStatus, PaymentStatus } from '../backend';
import { useCreateDepositCheckoutSession, useGetAllDrivers, useCreateTrip } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';

interface ServiceSelectionFormProps {
  userProfile: UserProfile;
  onCancel: () => void;
}

type ServiceType = {
  id: string;
  name: string;
  icon: React.ReactNode;
  deposit: number;
  rate: string;
  description: string;
  isHourly: boolean;
};

const SERVICES: ServiceType[] = [
  { id: 'party', name: 'Companion to a Party', icon: <PartyPopper className="h-5 w-5" />, deposit: 20, rate: '$30/hour', description: 'Professional companion for parties and events', isHourly: true },
  { id: 'hospital', name: 'Companion to Hospital', icon: <Hospital className="h-5 w-5" />, deposit: 20, rate: '$30/hour', description: 'Supportive companion for medical appointments', isHourly: true },
  { id: 'meeting', name: 'Companion to Meeting', icon: <Briefcase className="h-5 w-5" />, deposit: 20, rate: '$30/hour', description: 'Professional companion for business meetings', isHourly: true },
  { id: 'general', name: 'Companion (general)', icon: <User className="h-5 w-5" />, deposit: 20, rate: '$30/hour', description: 'General companion services', isHourly: true },
  { id: 'shopping-with', name: 'Companion to Go Shopping With', icon: <ShoppingBag className="h-5 w-5" />, deposit: 20, rate: '$30/hour', description: 'Shopping companion to assist you', isHourly: true },
  { id: 'shopping-for', name: 'Shopping for Them', icon: <Package className="h-5 w-5" />, deposit: 10, rate: '$25 flat', description: 'We shop for you and deliver', isHourly: false },
  { id: 'pickup', name: 'Pick Up an Item for Them', icon: <Package className="h-5 w-5" />, deposit: 10, rate: '$25 flat', description: 'Item pickup and delivery service', isHourly: false },
];

const COMPANY_FEE = 7;

export default function ServiceSelectionForm({ userProfile, onCancel }: ServiceSelectionFormProps) {
  const { identity } = useInternetIdentity();
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('2');
  const [notes, setNotes] = useState('');
  const [translatorNeeded, setTranslatorNeeded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('card');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [driverPhotos, setDriverPhotos] = useState<Map<string, string>>(new Map());

  const createDepositCheckout = useCreateDepositCheckoutSession();
  const createTrip = useCreateTrip();
  const { data: drivers = [], isLoading: driversLoading } = useGetAllDrivers();

  useEffect(() => {
    setCurrentLocation({
      latitude: userProfile.userCoordinates.latitude,
      longitude: userProfile.userCoordinates.longitude,
    });
  }, [userProfile]);

  useEffect(() => {
    const loadPhotos = async () => {
      const photoMap = new Map<string, string>();
      for (const driver of drivers) {
        if (driver.photo) {
          const url = driver.photo.getDirectURL();
          photoMap.set(driver.driverId.toString(), url);
        }
      }
      setDriverPhotos(photoMap);
    };
    
    if (drivers.length > 0) {
      loadPhotos();
    }
  }, [drivers]);

  const handleUpdateLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGettingLocation(false);
        toast.success('Location updated');
      },
      (error) => {
        setGettingLocation(false);
        toast.error('Failed to get location: ' + error.message);
      }
    );
  };

  const calculateEstimate = () => {
    if (!selectedService) return { serviceFee: 0, deposit: 0, total: 0, driverEarnings: 0 };
    
    const deposit = selectedService.deposit;
    let serviceFee = 0;
    
    if (selectedService.isHourly) {
      const hours = parseFloat(estimatedHours) || 0;
      serviceFee = hours * 30;
    } else {
      serviceFee = 25;
    }
    
    const total = deposit + serviceFee;
    const driverEarnings = serviceFee - COMPANY_FEE;
    
    return { serviceFee, deposit, total, driverEarnings };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedService || !startLocation.trim() || !endLocation.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!selectedDriverId) {
      toast.error('Please select a driver');
      return;
    }

    if (!identity) {
      toast.error('Please log in to continue');
      return;
    }

    const estimate = calculateEstimate();
    const selectedDriver = drivers.find(d => d.driverId.toString() === selectedDriverId);

    if (!selectedDriver) {
      toast.error('Selected driver not found');
      return;
    }

    try {
      // Create trip record first
      const tripId = BigInt(Date.now());
      const trip: Trip = {
        tripId,
        clientId: identity.getPrincipal(),
        driverId: selectedDriver.driverId,
        startLocation: currentLocation || userProfile.userCoordinates,
        endLocation: undefined,
        startTime: BigInt(Date.now()),
        endTime: undefined,
        tripStatus: TripStatus.pending,
        distance: undefined,
        duration: undefined,
        totalCost: estimate.total,
        depositPaid: false,
        tripCostCalculation: {
          baseCost: estimate.deposit,
          mileageCost: 0,
          durationCost: estimate.serviceFee,
          totalCost: estimate.total,
          deposit: estimate.deposit,
          companyCommission: COMPANY_FEE,
        },
        statusUpdate: undefined,
        paymentStatus: PaymentStatus.pending,
        locationDetails: {
          pickupAddress: startLocation,
          pickupCoordinates: currentLocation || userProfile.userCoordinates,
          dropoffAddress: endLocation,
          dropoffCoordinates: undefined,
        },
        specialRequests: `Service: ${selectedService.name}${notes ? `\nNotes: ${notes}` : ''}${selectedService.isHourly ? `\nEstimated hours: ${estimatedHours}` : ''}`,
        translatorNeeded,
        helpLoadingItems: undefined,
      };

      await createTrip.mutateAsync(trip);

      // Create deposit checkout session
      const depositItems: ShoppingItem[] = [
        {
          productName: `${selectedService.name} - Deposit`,
          productDescription: `Deposit for ${selectedService.name} (card required)`,
          priceInCents: BigInt(selectedService.deposit * 100),
          quantity: BigInt(1),
          currency: 'usd',
        },
      ];

      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const session = await createDepositCheckout.mutateAsync({
        items: depositItems,
        successUrl: `${baseUrl}/?payment=success&service=${selectedService.id}&driver=${selectedDriverId}&paymentMethod=${paymentMethod}`,
        cancelUrl: `${baseUrl}/?payment=cancelled`,
      });

      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }

      // Redirect to Stripe checkout for deposit payment
      window.location.href = session.url;
    } catch (error: any) {
      toast.error('Failed to create booking: ' + error.message);
    }
  };

  const estimate = calculateEstimate();

  if (!selectedService) {
    return (
      <Card className="mb-8 border-primary/20 shadow-gold-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Select a Service</CardTitle>
          <CardDescription>Choose the service you need</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {SERVICES.map((service) => (
            <button
              key={service.id}
              onClick={() => setSelectedService(service)}
              className="w-full flex items-start gap-4 rounded-lg border-2 border-muted bg-background p-4 hover:bg-primary/5 hover:border-primary/30 transition-all text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                {service.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{service.name}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <span className="font-medium text-primary">${service.deposit} deposit</span>
                  <span className="text-muted-foreground">+</span>
                  <span className="font-medium text-primary">{service.rate}</span>
                </div>
              </div>
            </button>
          ))}
        </CardContent>
        <CardFooter>
          <Button type="button" variant="outline" onClick={onCancel} className="w-full border-primary/30 hover:bg-primary/10">
            Cancel
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="mb-8 border-primary/20 shadow-gold-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Book: {selectedService.name}</CardTitle>
        <CardDescription>Complete your booking details</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Selected Service Info */}
          <Alert className="border-primary/30 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription>
              <strong>Service:</strong> {selectedService.name} - ${selectedService.deposit} deposit (card required) + {selectedService.rate}
            </AlertDescription>
          </Alert>

          {/* Driver Selection */}
          <div className="space-y-3">
            <Label>Select Your Driver *</Label>
            {driversLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : drivers.length === 0 ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 text-center">
                <User className="mx-auto mb-2 h-8 w-8 text-primary" />
                <p className="text-sm text-muted-foreground">No drivers available at the moment</p>
              </div>
            ) : (
              <RadioGroup value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <div className="space-y-3">
                  {drivers.map((driver) => (
                    <div key={driver.driverId.toString()} className="relative">
                      <RadioGroupItem
                        value={driver.driverId.toString()}
                        id={driver.driverId.toString()}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={driver.driverId.toString()}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-muted bg-background p-3 hover:bg-primary/5 hover:border-primary/30 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-all"
                      >
                        <Avatar className="h-12 w-12 border-2 border-primary/30">
                          <AvatarImage
                            src={driverPhotos.get(driver.driverId.toString())}
                            alt={driver.name}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{driver.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Car className="h-3 w-3 text-primary" />
                            <span>{driver.carNumber}</span>
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
          </div>

          {/* Start Location */}
          <div className="space-y-2">
            <Label htmlFor="start-location">Start Location *</Label>
            <div className="flex gap-2">
              <Input
                id="start-location"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                placeholder="123 Main St, City, State"
                required
                className="flex-1 border-primary/20"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                onClick={handleUpdateLocation} 
                disabled={gettingLocation}
                className="border-primary/30 hover:bg-primary/10 hover:text-primary"
              >
                {gettingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
              </Button>
            </div>
            {currentLocation && (
              <p className="text-xs text-muted-foreground">
                Current: Lat: {currentLocation.latitude.toFixed(6)}, Lng: {currentLocation.longitude.toFixed(6)}
              </p>
            )}
          </div>

          {/* End Location */}
          <div className="space-y-2">
            <Label htmlFor="end-location">End Location *</Label>
            <Input 
              id="end-location" 
              value={endLocation} 
              onChange={(e) => setEndLocation(e.target.value)} 
              placeholder="456 Oak Ave, City, State" 
              required 
              className="border-primary/20 focus:ring-primary"
            />
          </div>

          {/* Estimated Hours (only for hourly services) */}
          {selectedService.isHourly && (
            <div className="space-y-2">
              <Label htmlFor="hours">Estimated Hours *</Label>
              <Input 
                id="hours" 
                type="number" 
                step="0.5" 
                min="0.5" 
                value={estimatedHours} 
                onChange={(e) => setEstimatedHours(e.target.value)} 
                required 
                className="border-primary/20 focus:ring-primary"
              />
            </div>
          )}

          {/* Translator Needed */}
          <div className="flex items-center space-x-2 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
            <Checkbox 
              id="translator" 
              checked={translatorNeeded}
              onCheckedChange={(checked) => setTranslatorNeeded(checked === true)}
            />
            <Label 
              htmlFor="translator" 
              className="flex items-center gap-2 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              <Languages className="h-4 w-4 text-primary" />
              Translator needed
            </Label>
          </div>

          {/* Payment Method for Service Fee */}
          <div className="space-y-3">
            <Label>Service Fee Payment Method *</Label>
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'cash' | 'card')}>
              <div className="flex items-center space-x-2 rounded-lg border-2 border-muted bg-background p-3 hover:bg-primary/5 hover:border-primary/30 transition-all">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex-1 cursor-pointer">Pay by Cash</Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border-2 border-muted bg-background p-3 hover:bg-primary/5 hover:border-primary/30 transition-all">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex-1 cursor-pointer">Pay by Card</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea 
              id="notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="Any special requirements or instructions..." 
              rows={3} 
              className="border-primary/20 focus:ring-primary"
            />
          </div>

          {/* Cost Breakdown */}
          <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
            <h3 className="mb-3 font-semibold text-primary">Cost Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deposit (card required)</span>
                <span className="font-medium">${estimate.deposit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Service Fee {selectedService.isHourly ? `(${estimatedHours} hrs × $30/hr)` : '(flat rate)'}
                </span>
                <span className="font-medium">${estimate.serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pl-4 text-xs">
                <span className="text-muted-foreground">• Driver earnings (after $7 company fee)</span>
                <span className="font-medium">${estimate.driverEarnings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-primary/30 pt-2 text-base">
                <span className="font-semibold">Estimated Total</span>
                <span className="font-bold text-primary">${estimate.total.toFixed(2)}</span>
              </div>
            </div>
            <Alert className="mt-3 border-primary/30 bg-background">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-xs">
                Deposit must be paid by card. Service fee can be paid by {paymentMethod === 'cash' ? 'cash' : 'card'}.
              </AlertDescription>
            </Alert>
          </div>

          {/* Stripe Payment Info */}
          <Alert className="border-blue-600/30 bg-blue-600/5">
            <CreditCard className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm">
              <strong>Secure Stripe Payment:</strong> You will be redirected to Stripe's secure checkout to pay the deposit by card. The service fee will be paid {paymentMethod === 'cash' ? 'in cash to the driver' : 'by card through Stripe'}.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setSelectedService(null)} 
            className="flex-1 border-primary/30 hover:bg-primary/10"
          >
            Back
          </Button>
          <Button 
            type="submit" 
            disabled={createDepositCheckout.isPending || createTrip.isPending || drivers.length === 0} 
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-gold"
          >
            {(createDepositCheckout.isPending || createTrip.isPending) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Deposit with Stripe
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
