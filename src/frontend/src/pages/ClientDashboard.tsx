import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Calendar, AlertCircle, Mail, Eye } from 'lucide-react';
import { UserProfile, TripStatus } from '../backend';
import { useI18n } from '../i18n/useI18n';
import { useGetClientTrips } from '../hooks/useQueries';
import ServiceSelectionForm from '../components/ServiceSelectionForm';
import StripeSetupCheck from '../components/StripeSetupCheck';
import TripDetailsDialog from '../components/TripDetailsDialog';
import { getTripProgress } from '../utils/tripProgress';

interface ClientDashboardProps {
  userProfile: UserProfile;
}

export default function ClientDashboard({ userProfile }: ClientDashboardProps) {
  const [showServiceSelection, setShowServiceSelection] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<bigint | undefined>(undefined);
  const [showTripDetails, setShowTripDetails] = useState(false);
  const { t } = useI18n();
  const { data: trips = [], isLoading: tripsLoading } = useGetClientTrips();

  const activeTrips = trips.filter(trip => 
    trip.tripStatus === TripStatus.pending || 
    trip.tripStatus === TripStatus.accepted || 
    trip.tripStatus === TripStatus.inProgress
  );
  const completedTrips = trips.filter(trip => trip.tripStatus === TripStatus.completed);

  const handleViewTrip = (tripId: bigint) => {
    setSelectedTripId(tripId);
    setShowTripDetails(true);
  };

  return (
    <div className="container py-8">
      <StripeSetupCheck />
      
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">{t('client.welcome')} <span className="text-primary">{userProfile.name}</span>!</h1>
        <p className="text-muted-foreground">{t('client.subtitle')}</p>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 hover:shadow-gold transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('client.stats.activeBookings')}</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeTrips.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeTrips.length === 0 ? t('client.stats.noActive') : 'Currently active'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 hover:shadow-gold transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('client.stats.completedServices')}</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{completedTrips.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedTrips.length === 0 ? t('client.stats.startFirst') : 'All time'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 hover:shadow-gold transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{trips.length}</div>
            <p className="text-xs text-muted-foreground">All bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Action Card */}
      {!showServiceSelection ? (
        <Card className="mb-8 border-primary/20 shadow-gold">
          <CardHeader>
            <CardTitle className="text-2xl">{t('client.selectService.title')}</CardTitle>
            <CardDescription>{t('client.selectService.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => setShowServiceSelection(true)} 
              size="lg" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-gold"
            >
              {t('client.selectService.button')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ServiceSelectionForm userProfile={userProfile} onCancel={() => setShowServiceSelection(false)} />
      )}

      {/* My Trips */}
      {trips.length > 0 && (
        <Card className="mb-8 border-primary/20 shadow-gold">
          <CardHeader>
            <CardTitle className="text-2xl">My Trips</CardTitle>
            <CardDescription>View your booking history and trip details</CardDescription>
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
                          <p className="text-xs italic text-primary">Update: {progress.latestMessage.substring(0, 60)}{progress.latestMessage.length > 60 ? '...' : ''}</p>
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
            {t('client.contact.title')}
          </CardTitle>
          <CardDescription>{t('client.contact.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-primary/30 bg-primary/5">
            <Mail className="h-4 w-4 text-primary" />
            <AlertDescription>
              <strong>{t('common.customerSupport')}</strong> {t('client.contact.message')}{' '}
              <a href="mailto:cityprop01@gmail.com" className="font-semibold text-primary underline">
                cityprop01@gmail.com
              </a>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Current Location */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>{t('client.location.title')}</CardTitle>
          <CardDescription>{t('client.location.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">
              Lat: {userProfile.userCoordinates.latitude.toFixed(6)}, Lng: {userProfile.userCoordinates.longitude.toFixed(6)}
            </span>
          </div>
          <div className="mt-4 rounded-lg bg-primary/5 border border-primary/20 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 text-primary" />
              <p className="text-sm text-muted-foreground">
                {t('client.location.updateNote')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <TripDetailsDialog
        tripId={selectedTripId}
        open={showTripDetails}
        onOpenChange={setShowTripDetails}
        isDriver={false}
      />
    </div>
  );
}
