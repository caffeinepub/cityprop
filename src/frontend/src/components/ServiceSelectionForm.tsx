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
import { MapPin, Loader2, Navigation, User, Car, Info, CreditCard, ShoppingBag, Hospital, PartyPopper, Briefcase, Package, Languages, AlertTriangle } from 'lucide-react';
import { UserProfile, ShoppingItem, Trip, TripStatus, PaymentStatus } from '../backend';
import { useCreateDepositCheckoutSession, useGetAllDrivers, useCreateTrip } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import { calculateDistance, formatDistance } from '../utils/distance';
import { calculateTripPricing, isValidMilesForBooking, getMaxDistanceMiles } from '../utils/tripPricing';

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
const MAX_DISTANCE_MILES = getMaxDistanceMiles();

export default function ServiceSelectionForm({ userProfile, onCancel }: ServiceSelectionFormProps) {
  const { identity } = useInternetIdentity();
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('2');
  const [tripMiles, setTripMiles] = useState('');
  const [notes, setNotes] = useState('');
  const [translatorNeeded, setTranslatorNeeded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('card');
  const [gettingPickupLocation, setGettingPickupLocation] = useState(false);
  const [gettingDropoffLocation, setGettingDropoffLocation] = useState(false);
  const [pickupCoordinates, setPickupCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [dropoffCoordinates, setDropoffCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [driverPhotos, setDriverPhotos] = useState<Map<string, string>>(new Map());

  const createDepositCheckout = useCreateDepositCheckoutSession();
  const createTrip = useCreateTrip();
  const { data: drivers = [], isLoading: driversLoading } = useGetAllDrivers();

  useEffect(() => {
    setPickupCoordinates({
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

  const handleCapturePickupLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    setGettingPickupLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPickupCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGettingPickupLocation(false);
        toast.success('Pickup location captured');
      },
      (error) => {
        setGettingPickupLocation(false);
        toast.error('Failed to get pickup location: ' + error.message);
      }
    );
  };

  const handleCaptureDropoffLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    setGettingDropoffLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDropoffCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGettingDropoffLocation(false);
        toast.success('Dropoff location captured');
      },
      (error) => {
        setGettingDropoffLocation(false);
        toast.error('Failed to get dropoff location: ' + error.message);
      }
    );
  };

  const calculateDistanceMiles = (): number | null => {
    if (!pickupCoordinates || !dropoffCoordinates) return null;
    return calculateDistance(
      pickupCoordinates.latitude,
      pickupCoordinates.longitude,
      dropoffCoordinates.latitude,
      dropoffCoordinates.longitude
    );
  };

  const isDistanceBasedService = (): boolean => {
    return selectedService?.id === 'shopping-for' || selectedService?.id === 'pickup';
  };

  const calculateEstimate = () => {
    if (!selectedService) return { serviceFee: 0, deposit: 0, total: 0, driverEarnings: 0 };
    
    // For distance-based services, use manual miles input
    if (isDistanceBasedService()) {
      const miles = parseFloat(tripMiles) || null;
      const pricing = calculateTripPricing(miles);
      return {
        serviceFee: pricing.serviceFee,
        deposit: pricing.deposit,
        total: pricing.total,
        driverEarnings: pricing.driverEarnings,
      };
    }
    
    // For hourly services, use original pricing
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

    if (!selectedService || !pickupAddress.trim() || !dropoffAddress.trim()) {
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

    // For distance-based services, validate miles
    if (isDistanceBasedService()) {
      const miles = parseFloat(tripMiles) || null;
      if (!isValidMilesForBooking(miles)) {
        toast.error(`Please enter trip miles (must be between 0 and ${MAX_DISTANCE_MILES} miles)`);
        return;
      }
    }

    const estimate = calculateEstimate();
    const selectedDriver = drivers.find(d => d.driverId.toString() === selectedDriverId);

    if (!selectedDriver) {
      toast.error('Selected driver not found');
      return;
    }

    const distanceMiles = calculateDistanceMiles();
    const manualMiles = isDistanceBasedService() ? parseFloat(tripMiles) || undefined : undefined;

    try {
      // Create trip record first
      const tripId = BigInt(Date.now());
      const trip: Trip = {
        tripId,
        clientId: identity.getPrincipal(),
        driverId: selectedDriver.driverId,
        startLocation: pickupCoordinates || userProfile.userCoordinates,
        endLocation: dropoffCoordinates || undefined,
        startTime: BigInt(Date.now()),
        endTime: undefined,
        tripStatus: TripStatus.pending,
        distance: distanceMiles || 0,
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
          pickupAddress: pickupAddress,
          pickupCoordinates: pickupCoordinates || undefined,
          dropoffAddress: dropoffAddress,
          dropoffCoordinates: dropoffCoordinates || undefined,
        },
        specialRequests: `Service: ${selectedService.name}${notes ? `\nNotes: ${notes}` : ''}${selectedService.isHourly ? `\nEstimated hours: ${estimatedHours}` : ''}${manualMiles ? `\nTrip miles: ${manualMiles.toFixed(1)}` : ''}`,
        translatorNeeded,
        helpLoadingItems: undefined,
        miles: manualMiles,
      };

      await createTrip.mutateAsync(trip);

      // Create deposit checkout session
      const depositItems: ShoppingItem[] = [
        {
          productName: `${selectedService.name} - Deposit`,
          productDescription: `Non-refundable deposit for ${selectedService.name}`,
          priceInCents: BigInt(estimate.deposit * 100),
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
  const parsedMiles = parseFloat(tripMiles) || null;
  const showMilesWarning = isDistanceBasedService() && parsedMiles !== null && parsedMiles > MAX_DISTANCE_MILES;
  const canSubmit = !showMilesWarning && (!isDistanceBasedService() || isValidMilesForBooking(parsedMiles));

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
              <strong>Service:</strong> {selectedService.name}
              {isDistanceBasedService() && parsedMiles !== null && isValidMilesForBooking(parsedMiles) ? (
                <> - ${estimate.deposit} deposit + ${estimate.serviceFee} service fee (up to {MAX_DISTANCE_MILES} miles)</>
              ) : (
                <> - ${selectedService.deposit} deposit + {selectedService.rate}</>
              )}
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

          {/* Pickup Address */}
          <div className="space-y-2">
            <Label htmlFor="pickup-address">Pickup Address *</Label>
            <div className="flex gap-2">
              <Input
                id="pickup-address"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="123 Main St, City, State"
                required
                className="flex-1 border-primary/20"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                onClick={handleCapturePickupLocation} 
                disabled={gettingPickupLocation}
                className="border-primary/30 hover:bg-primary/10 hover:text-primary"
                title="Capture pickup GPS coordinates"
              >
                {gettingPickupLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
              </Button>
            </div>
            {pickupCoordinates && (
              <p className="text-xs text-muted-foreground">
                Pickup: Lat: {pickupCoordinates.latitude.toFixed(6)}, Lng: {pickupCoordinates.longitude.toFixed(6)}
              </p>
            )}
          </div>

          {/* Dropoff Address */}
          <div className="space-y-2">
            <Label htmlFor="dropoff-address">Dropoff Address *</Label>
            <div className="flex gap-2">
              <Input 
                id="dropoff-address" 
                value={dropoffAddress} 
                onChange={(e) => setDropoffAddress(e.target.value)} 
                placeholder="456 Oak Ave, City, State" 
                required 
                className="flex-1 border-primary/20 focus:ring-primary"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                onClick={handleCaptureDropoffLocation} 
                disabled={gettingDropoffLocation}
                className="border-primary/30 hover:bg-primary/10 hover:text-primary"
                title="Capture dropoff GPS coordinates"
              >
                {gettingDropoffLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
              </Button>
            </div>
            {dropoffCoordinates && (
              <p className="text-xs text-muted-foreground">
                Dropoff: Lat: {dropoffCoordinates.latitude.toFixed(6)}, Lng: {dropoffCoordinates.longitude.toFixed(6)}
              </p>
            )}
          </div>

          {/* Trip Miles (for distance-based services) */}
          {isDistanceBasedService() && (
            <div className="space-y-2">
              <Label htmlFor="trip-miles">Trip Miles (manual entry) *</Label>
              <Input 
                id="trip-miles" 
                type="number" 
                step="0.1" 
                min="0" 
                max={MAX_DISTANCE_MILES}
                value={tripMiles} 
                onChange={(e) => setTripMiles(e.target.value)} 
                placeholder="Enter estimated miles"
                required 
                className="border-primary/20 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">
                Enter the estimated trip distance in miles (up to {MAX_DISTANCE_MILES} miles)
              </p>
              {showMilesWarning && (
                <Alert className="border-destructive/50 bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">
                    Distance exceeds {MAX_DISTANCE_MILES} miles. Bookings are limited to {MAX_DISTANCE_MILES} miles.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

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
                <span className="text-muted-foreground">Deposit (non-refundable)</span>
                <span className="font-medium">${estimate.deposit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Service Fee {selectedService.isHourly ? `(${estimatedHours} hrs × $30/hr)` : isDistanceBasedService() && parsedMiles ? `(${parsedMiles.toFixed(1)} miles)` : '(flat rate)'}
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
            <Alert className="mt-3 border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-xs text-destructive">
                <strong>Non-Refundable Deposit:</strong> The ${estimate.deposit.toFixed(2)} deposit is non-refundable even if you cancel the service.
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
            disabled={!canSubmit || createDepositCheckout.isPending || createTrip.isPending || drivers.length === 0} 
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
