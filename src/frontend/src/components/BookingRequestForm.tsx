import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Clock, DollarSign, Loader2, Navigation, User, Car, Info, CreditCard, AlertTriangle } from 'lucide-react';
import { UserProfile, ShoppingItem } from '../backend';
import { useCreateCheckoutSession, useGetAllDrivers } from '../hooks/useQueries';
import { toast } from 'sonner';
import { calculateDistance, formatDistance } from '../utils/distance';

interface BookingRequestFormProps {
  userProfile: UserProfile;
  onCancel: () => void;
}

const DEPOSIT = 10;
const COMPANY_ALLOCATION = 5;
const HOURLY_RATE = 30;
const MILEAGE_RATE = 1.5;
const MAX_DISTANCE_MILES = 10;
const DISTANCE_BASED_DEPOSIT = 10;
const DISTANCE_BASED_SERVICE_FEE = 25;

export default function BookingRequestForm({ userProfile, onCancel }: BookingRequestFormProps) {
  const [activityType, setActivityType] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('2');
  const [estimatedMiles, setEstimatedMiles] = useState('10');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [gettingPickupLocation, setGettingPickupLocation] = useState(false);
  const [gettingDropoffLocation, setGettingDropoffLocation] = useState(false);
  const [pickupCoordinates, setPickupCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [dropoffCoordinates, setDropoffCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [driverPhotos, setDriverPhotos] = useState<Map<string, string>>(new Map());

  const createCheckout = useCreateCheckoutSession();
  const { data: drivers = [], isLoading: driversLoading } = useGetAllDrivers();

  useEffect(() => {
    setPickupCoordinates({
      latitude: userProfile.userCoordinates.latitude,
      longitude: userProfile.userCoordinates.longitude,
    });
  }, [userProfile]);

  useEffect(() => {
    // Load driver photos
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

  const calculateEstimate = () => {
    const distanceMiles = calculateDistanceMiles();
    
    // Check if distance-based pricing applies (distance <= 10 miles)
    if (distanceMiles !== null && distanceMiles <= MAX_DISTANCE_MILES) {
      const deposit = DISTANCE_BASED_DEPOSIT;
      const serviceFee = DISTANCE_BASED_SERVICE_FEE;
      const total = deposit + serviceFee;
      return { hourCost: 0, mileageCost: serviceFee, total, deposit, serviceFee };
    }
    
    // Original pricing for > 10 miles (blocked) or no coordinates
    const hours = parseFloat(estimatedHours) || 0;
    const miles = parseFloat(estimatedMiles) || 0;
    const hourCost = hours * HOURLY_RATE;
    const mileageCost = miles * MILEAGE_RATE;
    const total = DEPOSIT + hourCost + mileageCost;
    return { hourCost, mileageCost, total, deposit: DEPOSIT, serviceFee: hourCost + mileageCost };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activityType || !pickupAddress.trim() || !dropoffAddress.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!selectedDriverId) {
      toast.error('Please select a driver');
      return;
    }

    if (!pickupCoordinates || !dropoffCoordinates) {
      toast.error('Please capture both pickup and dropoff coordinates for distance calculation');
      return;
    }

    const distanceMiles = calculateDistanceMiles();
    if (distanceMiles === null) {
      toast.error('Unable to calculate distance. Please capture coordinates.');
      return;
    }

    if (distanceMiles > MAX_DISTANCE_MILES) {
      toast.error(`Distance exceeds ${MAX_DISTANCE_MILES} miles. Bookings are limited to ${MAX_DISTANCE_MILES} miles.`);
      return;
    }

    const estimate = calculateEstimate();
    const selectedDriver = drivers.find(d => d.driverId.toString() === selectedDriverId);

    // Create shopping items for Stripe checkout
    const items: ShoppingItem[] = [
      {
        productName: 'Companion Service Deposit',
        productDescription: `Non-refundable booking deposit for up to ${MAX_DISTANCE_MILES} miles`,
        priceInCents: BigInt(estimate.deposit * 100),
        quantity: BigInt(1),
        currency: 'usd',
      },
    ];

    try {
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const session = await createCheckout.mutateAsync({
        items,
        successUrl: `${baseUrl}/?payment=success`,
        cancelUrl: `${baseUrl}/?payment=cancelled`,
      });

      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }

      // Redirect to Stripe checkout for automatic payment processing
      window.location.href = session.url;
    } catch (error: any) {
      toast.error('Failed to create booking: ' + error.message);
    }
  };

  const estimate = calculateEstimate();
  const distanceMiles = calculateDistanceMiles();
  const showDistanceWarning = distanceMiles !== null && distanceMiles > MAX_DISTANCE_MILES;
  const canSubmit = !showDistanceWarning && pickupCoordinates && dropoffCoordinates;

  return (
    <Card className="mb-8 border-primary/20 shadow-gold-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Book a Companion</CardTitle>
        <CardDescription>Fill in the details for your companion service request with automatic Stripe payment</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
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

          {/* Activity Type */}
          <div className="space-y-2">
            <Label htmlFor="activity">Activity Type *</Label>
            <Select value={activityType} onValueChange={setActivityType} required>
              <SelectTrigger id="activity" className="border-primary/20 focus:ring-primary">
                <SelectValue placeholder="Select activity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shopping">Shopping</SelectItem>
                <SelectItem value="hospital">Hospital Visit</SelectItem>
                <SelectItem value="party">Party/Event</SelectItem>
                <SelectItem value="airport">Airport Transfer</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
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
                Pickup: {pickupCoordinates.latitude.toFixed(6)}, {pickupCoordinates.longitude.toFixed(6)}
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
                Dropoff: {dropoffCoordinates.latitude.toFixed(6)}, {dropoffCoordinates.longitude.toFixed(6)}
              </p>
            )}
          </div>

          {/* Distance Display */}
          {distanceMiles !== null && (
            <Alert className={showDistanceWarning ? "border-destructive/50 bg-destructive/10" : "border-primary/30 bg-primary/5"}>
              <MapPin className={`h-4 w-4 ${showDistanceWarning ? 'text-destructive' : 'text-primary'}`} />
              <AlertDescription>
                <strong>Calculated Distance:</strong> {formatDistance(distanceMiles)}
                {showDistanceWarning && (
                  <div className="mt-1 text-destructive font-medium">
                    Distance exceeds {MAX_DISTANCE_MILES} miles. Bookings are limited to {MAX_DISTANCE_MILES} miles.
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

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
                <span className="text-muted-foreground">Non-refundable Deposit</span>
                <span className="font-medium">${estimate.deposit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Service Fee (up to {MAX_DISTANCE_MILES} miles)
                </span>
                <span className="font-medium">${estimate.serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-primary/30 pt-2 text-base">
                <span className="font-semibold">Total</span>
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
              <strong>Secure Stripe Payment:</strong> You will be redirected to Stripe's secure checkout to complete your payment with credit or debit card. After trip completion, driver earnings and company commissions are automatically calculated and processed.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            className="flex-1 border-primary/30 hover:bg-primary/10"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!canSubmit || createCheckout.isPending || drivers.length === 0} 
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-gold"
          >
            {createCheckout.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay with Stripe
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
