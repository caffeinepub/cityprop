import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MapPin, Calendar, DollarSign, User, Car, Clock, CheckCircle, Languages, ShoppingBag, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { Trip, TripStatus, PaymentStatus } from '../backend';
import { useUpdateHelpLoadingItems, useUpdateTripStatus, useGetTrip, useUpdateTripMiles } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import { getTripProgress, getNextStatusForAction } from '../utils/tripProgress';
import { calculateTripPricing } from '../utils/tripPricing';

interface TripDetailsDialogProps {
  tripId?: bigint;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDriver?: boolean;
}

export default function TripDetailsDialog({ tripId, open, onOpenChange, isDriver = false }: TripDetailsDialogProps) {
  const { identity } = useInternetIdentity();
  const { data: trip, isLoading: tripLoading } = useGetTrip(tripId);
  const [helpLoadingAnswer, setHelpLoadingAnswer] = useState<boolean | null>(null);
  const [driverMessage, setDriverMessage] = useState('');
  const [completionTotal, setCompletionTotal] = useState('');
  const [completionDetails, setCompletionDetails] = useState('');
  const [actualMiles, setActualMiles] = useState('');
  const updateHelpLoading = useUpdateHelpLoadingItems();
  const updateTripStatus = useUpdateTripStatus();
  const updateTripMiles = useUpdateTripMiles();

  if (!trip) return null;

  const isShoppingWithTrip = trip.specialRequests.toLowerCase().includes('shopping with');
  const canShowHelpLoadingPrompt = isDriver && isShoppingWithTrip && trip.tripStatus === TripStatus.completed && trip.helpLoadingItems === null;
  const hasAnsweredHelpLoading = trip.helpLoadingItems !== null;

  const tripProgress = getTripProgress(trip.tripStatus, trip.statusUpdate);
  const pricing = calculateTripPricing(trip.miles);

  const handleSaveHelpLoading = async (answer: boolean) => {
    try {
      await updateHelpLoading.mutateAsync({
        tripId: trip.tripId,
        helpLoading: answer,
      });
      setHelpLoadingAnswer(answer);
      toast.success('Response saved successfully');
    } catch (error: any) {
      toast.error('Failed to save response: ' + error.message);
    }
  };

  const handleUpdateMiles = async () => {
    const miles = parseFloat(actualMiles);
    if (isNaN(miles) || miles < 0) {
      toast.error('Please enter a valid miles value');
      return;
    }

    try {
      await updateTripMiles.mutateAsync({
        tripId: trip.tripId,
        miles,
      });
      setActualMiles('');
      toast.success('Trip miles updated successfully');
    } catch (error: any) {
      toast.error('Failed to update miles: ' + error.message);
    }
  };

  const handleDriverAction = async () => {
    if (!tripProgress.nextAction) return;

    try {
      const action = tripProgress.nextAction;

      // Validate inputs
      if (action.requiresMessage && !driverMessage.trim()) {
        toast.error('Please enter a message');
        return;
      }

      if (action.requiresSummary) {
        const total = parseFloat(completionTotal);
        if (!completionTotal.trim() || isNaN(total) || total < 0) {
          toast.error('Please enter a valid total amount');
          return;
        }
        if (!completionDetails.trim()) {
          toast.error('Please enter completion details');
          return;
        }
      }

      // Build status update
      const summary = action.requiresSummary
        ? { total: parseFloat(completionTotal), details: completionDetails }
        : undefined;

      const { newStatus, statusUpdate } = getNextStatusForAction(
        action.action,
        driverMessage || 'Status updated',
        summary
      );

      await updateTripStatus.mutateAsync({
        tripId: trip.tripId,
        newStatus,
        statusUpdate,
      });

      // Clear form
      setDriverMessage('');
      setCompletionTotal('');
      setCompletionDetails('');

      toast.success(`Trip ${action.label.toLowerCase()} successfully`);
    } catch (error: any) {
      toast.error('Failed to update trip: ' + error.message);
    }
  };

  const getTripStatusBadge = (status: TripStatus) => {
    switch (status) {
      case TripStatus.pending:
        return <Badge variant="outline" className="border-yellow-600/30 bg-yellow-600/10 text-yellow-600">Pending</Badge>;
      case TripStatus.accepted:
        return <Badge variant="outline" className="border-blue-600/30 bg-blue-600/10 text-blue-600">Accepted</Badge>;
      case TripStatus.inProgress:
        return <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">In Progress</Badge>;
      case TripStatus.completed:
        return <Badge variant="outline" className="border-green-600/30 bg-green-600/10 text-green-600">Completed</Badge>;
      case TripStatus.cancelled:
        return <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.pending:
        return <Badge variant="outline" className="border-yellow-600/30 bg-yellow-600/10 text-yellow-600">Pending</Badge>;
      case PaymentStatus.paid:
        return <Badge variant="outline" className="border-green-600/30 bg-green-600/10 text-green-600">Paid</Badge>;
      case PaymentStatus.transferred:
        return <Badge variant="outline" className="border-blue-600/30 bg-blue-600/10 text-blue-600">Transferred</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Trip Details</DialogTitle>
          <DialogDescription>View complete trip information</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Section */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Trip Status</p>
              {getTripStatusBadge(trip.tripStatus)}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
              {getPaymentStatusBadge(trip.paymentStatus)}
            </div>
          </div>

          <Separator />

          {/* Trip Progress */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              Trip Progress
            </h3>
            
            <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Current Step</span>
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                  {tripProgress.stepLabel}
                </Badge>
              </div>
              
              {tripProgress.latestMessage && (
                <>
                  <Separator className="bg-primary/20" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Latest Update</p>
                    <p className="text-sm">{tripProgress.latestMessage}</p>
                  </div>
                </>
              )}

              {tripProgress.completionSummary && (
                <>
                  <Separator className="bg-primary/20" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Completion Summary</p>
                    <p className="text-sm font-semibold text-primary">Total: ${tripProgress.completionSummary.total.toFixed(2)}</p>
                    <p className="text-sm mt-1">{tripProgress.completionSummary.details}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Driver Action Panel */}
          {isDriver && tripProgress.nextAction && trip.tripStatus !== TripStatus.cancelled && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Driver Actions
                </h3>
                
                <Alert className="border-primary/30 bg-primary/5">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <AlertDescription>
                    <p className="font-semibold mb-3">Next Action: {tripProgress.nextAction.label}</p>
                    
                    <div className="space-y-3">
                      {tripProgress.nextAction.requiresMessage && (
                        <div>
                          <Label htmlFor="driver-message" className="text-sm">
                            Message {tripProgress.nextAction.action === 'accept' ? '(optional)' : ''}
                          </Label>
                          <Textarea
                            id="driver-message"
                            placeholder="Enter a message for the client..."
                            value={driverMessage}
                            onChange={(e) => setDriverMessage(e.target.value)}
                            className="mt-1"
                            rows={2}
                          />
                        </div>
                      )}

                      {tripProgress.nextAction.requiresSummary && (
                        <>
                          <div>
                            <Label htmlFor="completion-total" className="text-sm">
                              Total Amount *
                            </Label>
                            <Input
                              id="completion-total"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={completionTotal}
                              onChange={(e) => setCompletionTotal(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="completion-details" className="text-sm">
                              Completion Details *
                            </Label>
                            <Textarea
                              id="completion-details"
                              placeholder="Enter trip completion details..."
                              value={completionDetails}
                              onChange={(e) => setCompletionDetails(e.target.value)}
                              className="mt-1"
                              rows={3}
                            />
                          </div>
                        </>
                      )}

                      <Button
                        onClick={handleDriverAction}
                        disabled={updateTripStatus.isPending}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        {updateTripStatus.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {tripProgress.nextAction.label}
                          </>
                        )}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            </>
          )}

          {/* Driver Miles Update */}
          {isDriver && trip.tripStatus !== TripStatus.cancelled && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Actual Miles Driven
                </h3>
                
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <div>
                    <Label htmlFor="actual-miles" className="text-sm">
                      Enter Actual Miles Driven
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="actual-miles"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0.0"
                        value={actualMiles}
                        onChange={(e) => setActualMiles(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleUpdateMiles}
                        disabled={updateTripMiles.isPending || !actualMiles}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {updateTripMiles.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Save'
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {trip.miles !== null && trip.miles !== undefined && (
                    <div className="pt-2 border-t border-primary/20">
                      <p className="text-sm text-muted-foreground">Current Miles: <span className="font-medium text-foreground">{trip.miles.toFixed(1)} miles</span></p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Location Details */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Location Details
            </h3>
            
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Pickup Address</p>
                <p className="text-sm">{trip.locationDetails.pickupAddress || 'Not specified'}</p>
                {trip.locationDetails.pickupCoordinates && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Lat: {trip.locationDetails.pickupCoordinates.latitude.toFixed(6)}, Lng: {trip.locationDetails.pickupCoordinates.longitude.toFixed(6)}
                  </p>
                )}
              </div>
              
              <Separator className="bg-primary/20" />
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Dropoff Address</p>
                <p className="text-sm">{trip.locationDetails.dropoffAddress || 'Not specified'}</p>
                {trip.locationDetails.dropoffCoordinates && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Lat: {trip.locationDetails.dropoffCoordinates.latitude.toFixed(6)}, Lng: {trip.locationDetails.dropoffCoordinates.longitude.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Trip Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Trip Information
            </h3>
            
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-sm font-medium text-muted-foreground mb-1">Trip ID</p>
                <p className="text-sm font-mono">{trip.tripId.toString()}</p>
              </div>
              
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-sm font-medium text-muted-foreground mb-1">Start Time</p>
                <p className="text-sm">{new Date(Number(trip.startTime)).toLocaleString()}</p>
              </div>
              
              {trip.endTime && (
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-sm font-medium text-muted-foreground mb-1">End Time</p>
                  <p className="text-sm">{new Date(Number(trip.endTime)).toLocaleString()}</p>
                </div>
              )}
              
              {trip.miles !== null && trip.miles !== undefined && (
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Trip Miles</p>
                  <p className="text-sm">{trip.miles.toFixed(1)} miles</p>
                </div>
              )}
              
              {trip.duration && (
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Duration</p>
                  <p className="text-sm">{trip.duration.toFixed(2)} hours</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Special Requests & Features */}
          <div className="space-y-4">
            <h3 className="font-semibold">Service Details</h3>
            
            {trip.translatorNeeded && (
              <Alert className="border-primary/30 bg-primary/5">
                <Languages className="h-4 w-4 text-primary" />
                <AlertDescription>
                  <strong>Translator needed:</strong> Customer requested translation assistance
                </AlertDescription>
              </Alert>
            )}
            
            {trip.specialRequests && (
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-sm font-medium text-muted-foreground mb-1">Special Requests</p>
                <p className="text-sm whitespace-pre-wrap">{trip.specialRequests}</p>
              </div>
            )}
          </div>

          {/* Help Loading Items (Shopping-with trips only) */}
          {isShoppingWithTrip && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  Shopping Service
                </h3>
                
                {canShowHelpLoadingPrompt ? (
                  <Alert className="border-primary/30 bg-primary/5">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                    <AlertDescription>
                      <p className="font-semibold mb-3">Did you ask the client if they wanted help loading items into the car?</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveHelpLoading(true)}
                          disabled={updateHelpLoading.isPending}
                          className="bg-primary hover:bg-primary/90"
                        >
                          {updateHelpLoading.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                          Yes
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaveHelpLoading(false)}
                          disabled={updateHelpLoading.isPending}
                          className="border-primary/30"
                        >
                          No
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : hasAnsweredHelpLoading ? (
                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Help Loading Items</p>
                    <p className="text-sm">
                      {trip.helpLoadingItems ? (
                        <span className="text-green-600 font-medium">✓ Driver offered help loading items</span>
                      ) : (
                        <span className="text-muted-foreground">Driver did not offer help loading items</span>
                      )}
                    </p>
                  </div>
                ) : null}
              </div>
            </>
          )}

          {/* Cost Breakdown */}
          {(trip.tripCostCalculation || (trip.miles !== null && trip.miles !== undefined)) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Cost Breakdown
                </h3>
                
                <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-2">
                  {trip.miles !== null && trip.miles !== undefined && pricing.total > 0 ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Deposit</span>
                        <span className="font-medium">${pricing.deposit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Service Fee ({trip.miles.toFixed(1)} miles)</span>
                        <span className="font-medium">${pricing.serviceFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Company Commission</span>
                        <span className="font-medium">${pricing.companyFee.toFixed(2)}</span>
                      </div>
                      <Separator className="bg-primary/20" />
                      <div className="flex justify-between text-base">
                        <span className="font-semibold">Total Cost</span>
                        <span className="font-bold text-primary">${pricing.total.toFixed(2)}</span>
                      </div>
                    </>
                  ) : trip.tripCostCalculation ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Deposit</span>
                        <span className="font-medium">${trip.tripCostCalculation.deposit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Service Fee</span>
                        <span className="font-medium">${trip.tripCostCalculation.durationCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Company Commission</span>
                        <span className="font-medium">${trip.tripCostCalculation.companyCommission.toFixed(2)}</span>
                      </div>
                      <Separator className="bg-primary/20" />
                      <div className="flex justify-between text-base">
                        <span className="font-semibold">Total Cost</span>
                        <span className="font-bold text-primary">${trip.tripCostCalculation.totalCost.toFixed(2)}</span>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
