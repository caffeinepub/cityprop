import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { DollarSign, Clock, MapPin, TrendingUp, Car, User, Info, Receipt, CheckCircle, Wallet, Mail, Eye, Bell } from 'lucide-react';
import { UserProfile, TripStatus, PaymentStatus } from '../backend';
import { useGetCallerDriverProfile, useGetDriverTrips, useGetDriverEarnings, useGetPendingTripsOfDriver } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useI18n } from '../i18n/useI18n';
import DriverWallet from './DriverWallet';
import VideoPlayer from '../components/VideoPlayer';
import TripDetailsDialog from '../components/TripDetailsDialog';
import { getTripProgress } from '../utils/tripProgress';

interface DriverDashboardProps {
  userProfile: UserProfile;
}

export default function DriverDashboard({ userProfile }: DriverDashboardProps) {
  const { identity } = useInternetIdentity();
  const { data: driverProfile, isLoading: driverLoading } = useGetCallerDriverProfile();
  const { data: trips = [], isLoading: tripsLoading } = useGetDriverTrips();
  const { data: pendingTrips = [], isLoading: pendingLoading } = useGetPendingTripsOfDriver();
  const { data: earnings, isLoading: earningsLoading } = useGetDriverEarnings(identity?.getPrincipal());
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [showWallet, setShowWallet] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<bigint | undefined>(undefined);
  const [showTripDetails, setShowTripDetails] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    if (driverProfile?.photo) {
      const url = driverProfile.photo.getDirectURL();
      setPhotoUrl(url);
    }
  }, [driverProfile]);

  const completedTrips = trips.filter(trip => trip.tripStatus === TripStatus.completed);
  const totalJobs = completedTrips.length;

  let totalServicePay = 0;
  let totalCompanyFeeDeduction = 0;

  completedTrips.forEach(trip => {
    if (trip.tripCostCalculation) {
      const serviceFee = trip.tripCostCalculation.durationCost;
      totalServicePay += serviceFee;
      totalCompanyFeeDeduction += 7;
    }
  });

  const netEarnings = totalServicePay - totalCompanyFeeDeduction;

  const paidTrips = completedTrips.filter(trip => trip.paymentStatus === PaymentStatus.paid).length;
  const pendingPaymentTrips = completedTrips.filter(trip => trip.paymentStatus === PaymentStatus.pending).length;
  const transferredTrips = completedTrips.filter(trip => trip.paymentStatus === PaymentStatus.transferred).length;

  const handleViewTrip = (tripId: bigint) => {
    setSelectedTripId(tripId);
    setShowTripDetails(true);
  };

  if (showWallet) {
    return <DriverWallet userProfile={userProfile} />;
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-foreground">{t('driver.title')}</h1>
            <p className="text-muted-foreground">{t('driver.welcome')} <span className="text-primary font-semibold">{userProfile.name}</span>!</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowWallet(true)}
              variant="outline"
              className="border-primary/30 hover:bg-primary/10 hover:text-primary"
            >
              <Wallet className="mr-2 h-4 w-4" />
              {t('driver.viewWallet')}
            </Button>
            <Badge variant="outline" className="h-fit border-primary/30 bg-primary/10 text-primary">
              <Car className="mr-1 h-3 w-3" />
              {t('driver.available')}
            </Badge>
          </div>
        </div>
      </div>

      {/* New Requests (Pending) Section */}
      {pendingTrips.length > 0 && (
        <Card className="mb-8 border-yellow-600/30 shadow-gold bg-yellow-600/5">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Bell className="h-6 w-6 text-yellow-600" />
              New Requests (Pending)
            </CardTitle>
            <CardDescription>Review and accept new trip requests from customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTrips.map((trip) => {
                const progress = getTripProgress(trip.tripStatus, trip.statusUpdate);
                return (
                  <div
                    key={trip.tripId.toString()}
                    className="flex items-center justify-between rounded-lg border-2 border-yellow-600/30 bg-yellow-600/5 p-4 hover:bg-yellow-600/10 hover:border-yellow-600/50 transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="border-yellow-600/50 bg-yellow-600/20 text-yellow-700">
                          NEW REQUEST
                        </Badge>
                        <p className="font-semibold">Trip #{trip.tripId.toString().slice(-6)}</p>
                        {trip.translatorNeeded && (
                          <Badge variant="outline" className="border-blue-600/30 bg-blue-600/10 text-blue-600">
                            Translator
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-primary" />
                          {trip.locationDetails.pickupAddress || 'Pickup location'}
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-primary" />
                          {new Date(Number(trip.startTime)).toLocaleString()}
                        </p>
                        {trip.specialRequests && (
                          <p className="text-xs italic">Service: {trip.specialRequests.split('\n')[0].replace('Service: ', '')}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleViewTrip(trip.tripId)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Review Request
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How Cityprop Works Video Section */}
      <section className="mb-8">
        <Card className="border-primary/20 shadow-gold">
          <CardHeader>
            <CardTitle className="text-xl">{t('driver.howItWorks.title')}</CardTitle>
            <CardDescription>{t('driver.howItWorks.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mx-auto max-w-4xl px-4">
              <VideoPlayer
                videoUrl="/assets/driver-instructional-video.mp4"
                thumbnailUrl="/assets/generated/driver-app-video-thumbnail.dim_400x300.jpg"
                title="Driver service guide"
                autoplayMuted={true}
                className="aspect-video"
              />
            </div>
            <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-6">
              <p className="text-base text-muted-foreground text-center">
                {t('driver.howItWorks.videoDescription')}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Earnings Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card className="border-primary/20 hover:shadow-gold transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('driver.stats.netEarnings')}</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${netEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{t('driver.stats.afterFee')}</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 hover:shadow-gold transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('driver.stats.grossEarnings')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${totalServicePay.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{t('driver.stats.beforeDeductions')}</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 hover:shadow-gold transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('driver.stats.completedServices')}</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalJobs}</div>
            <p className="text-xs text-muted-foreground">{t('driver.stats.allTime')}</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 hover:shadow-gold transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Bell className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingTrips.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting your response</p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Summary Card */}
      <Card className="mb-8 border-primary/20 shadow-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            {t('driver.earnings.title')}
          </CardTitle>
          <CardDescription>{t('driver.earnings.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border-2 border-primary/30 bg-primary/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{t('driver.earnings.servicePay')}</span>
                <span className="text-xl font-bold text-primary">${totalServicePay.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t('driver.earnings.totalFromCompleted')}</p>
            </div>

            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">{t('driver.earnings.companyFee')}</span>
                <span className="text-lg font-bold text-destructive">-${totalCompanyFeeDeduction.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t('driver.earnings.perService')}</p>
            </div>
          </div>

          <Separator className="bg-primary/20" />

          <div className="rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-foreground">{t('driver.earnings.totalPayment')}</span>
              <span className="text-3xl font-bold text-primary">${netEarnings.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t('driver.earnings.paid')}</p>
                <Badge variant="outline" className="border-green-600/30 bg-green-600/10 text-green-600">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  {paidTrips}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t('driver.earnings.pending')}</p>
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                  <Clock className="mr-1 h-3 w-3" />
                  {pendingPaymentTrips}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t('driver.earnings.transferred')}</p>
                <Badge variant="outline" className="border-blue-600/30 bg-blue-600/10 text-blue-600">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  {transferredTrips}
                </Badge>
              </div>
            </div>
          </div>

          {driverProfile?.stripeAccountId ? (
            <Alert className="border-primary/30 bg-primary/5">
              <CheckCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <strong>Stripe Connected:</strong> {t('driver.earnings.stripeConnected')}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-yellow-600/30 bg-yellow-600/5">
              <Info className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm">
                <strong>Connect Stripe:</strong> {t('driver.earnings.connectStripe')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* My Trips */}
      {trips.length > 0 && (
        <Card className="mb-8 border-primary/20 shadow-gold">
          <CardHeader>
            <CardTitle className="text-2xl">My Trips</CardTitle>
            <CardDescription>View your assigned trips and service details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trips.map((trip) => {
                const progress = getTripProgress(trip.tripStatus, trip.statusUpdate);
                return (
                  <div
                    key={trip.tripId.toString()}
                    className="flex items-center justify-between rounded-lg border-2 border-muted bg-background p-4 hover:bg-primary/5 hover:border-primary/30 transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold">Trip #{trip.tripId.toString().slice(-6)}</p>
                        <Badge variant="outline" className={
                          trip.tripStatus === TripStatus.completed ? 'border-green-600/30 bg-green-600/10 text-green-600' :
                          trip.tripStatus === TripStatus.inProgress ? 'border-primary/30 bg-primary/10 text-primary' :
                          trip.tripStatus === TripStatus.cancelled ? 'border-destructive/30 bg-destructive/10 text-destructive' :
                          'border-yellow-600/30 bg-yellow-600/10 text-yellow-600'
                        }>
                          {progress.stepLabel}
                        </Badge>
                        {trip.translatorNeeded && (
                          <Badge variant="outline" className="border-blue-600/30 bg-blue-600/10 text-blue-600">
                            Translator
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-primary" />
                          {trip.locationDetails.pickupAddress || 'Pickup location'}
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-primary" />
                          {new Date(Number(trip.startTime)).toLocaleDateString()}
                        </p>
                        {progress.latestMessage && (
                          <p className="text-xs italic">Latest: {progress.latestMessage.substring(0, 50)}{progress.latestMessage.length > 50 ? '...' : ''}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewTrip(trip.tripId)}
                      className="border-primary/30 hover:bg-primary/10"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Company */}
      <Card className="mb-8 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            {t('driver.contact.title')}
          </CardTitle>
          <CardDescription>{t('driver.contact.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-primary/30 bg-primary/5">
            <Mail className="h-4 w-4 text-primary" />
            <AlertDescription>
              <strong>{t('common.driverSupport')}</strong> {t('driver.contact.message')}{' '}
              <a href="mailto:cityprop01@gmail.com" className="font-semibold text-primary underline">
                cityprop01@gmail.com
              </a>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Driver Info */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>{t('driver.profile.title')}</CardTitle>
          <CardDescription>{t('driver.profile.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {driverLoading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 pb-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-md" />
                <Avatar className="relative h-20 w-20 border-2 border-primary/30">
                  <AvatarImage src={photoUrl || undefined} alt={userProfile.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <h3 className="text-xl font-semibold">{userProfile.name}</h3>
                {driverProfile && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Car className="h-3 w-3 text-primary" />
                    {driverProfile.carNumber}
                  </p>
                )}
              </div>
            </div>
          )}
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-sm font-medium text-muted-foreground">{t('driver.profile.name')}</p>
              <p className="text-base font-semibold">{userProfile.name}</p>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-sm font-medium text-muted-foreground">{t('driver.profile.phone')}</p>
              <p className="text-base font-semibold">{userProfile.phoneNumber}</p>
            </div>
            {driverProfile && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-sm font-medium text-muted-foreground">{t('driver.profile.carDetails')}</p>
                <p className="text-base font-semibold">{driverProfile.carNumber}</p>
              </div>
            )}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-sm font-medium text-muted-foreground">{t('driver.profile.currentLocation')}</p>
              <p className="text-sm">
                Lat: {userProfile.userCoordinates.latitude.toFixed(4)}, Lng: {userProfile.userCoordinates.longitude.toFixed(4)}
              </p>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-sm font-medium text-muted-foreground">{t('driver.profile.status')}</p>
              <Badge variant="outline" className="mt-1 border-primary/30 bg-primary/10 text-primary">
                <Car className="mr-1 h-3 w-3" />
                {t('driver.available')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <TripDetailsDialog
        tripId={selectedTripId}
        open={showTripDetails}
        onOpenChange={setShowTripDetails}
        isDriver={true}
      />
    </div>
  );
}
