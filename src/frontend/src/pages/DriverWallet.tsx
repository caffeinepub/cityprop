import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, Wallet, Receipt, CreditCard, RefreshCw } from 'lucide-react';
import { UserProfile, PaymentStatus, TripStatus } from '../backend';
import { useGetDriverTrips, useGetDriverEarnings } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface DriverWalletProps {
  userProfile: UserProfile;
}

export default function DriverWallet({ userProfile }: DriverWalletProps) {
  const { identity } = useInternetIdentity();
  const { data: trips = [], isLoading: tripsLoading } = useGetDriverTrips();
  const { data: earnings, isLoading: earningsLoading } = useGetDriverEarnings(identity?.getPrincipal());

  // Calculate earnings from completed trips
  const completedTrips = trips.filter(trip => trip.tripStatus === TripStatus.completed);

  // Calculate totals from trip data
  let totalHourlyPay = 0;
  let totalMileagePay = 0;
  let totalCommissionDeduction = 0;
  let totalTaxDeduction = 0;

  completedTrips.forEach(trip => {
    if (trip.tripCostCalculation) {
      const hours = trip.duration ? trip.duration / 60 : 0;
      const miles = trip.distance || 0;
      
      totalHourlyPay += hours * 30;
      totalMileagePay += miles * 1.5;
      totalCommissionDeduction += trip.tripCostCalculation.companyCommission;
    }
  });

  const grossEarnings = totalHourlyPay + totalMileagePay;
  const netEarnings = grossEarnings - totalCommissionDeduction - totalTaxDeduction;

  // Group trips by payment status
  const pendingTrips = completedTrips.filter(trip => trip.paymentStatus === PaymentStatus.pending);
  const paidTrips = completedTrips.filter(trip => trip.paymentStatus === PaymentStatus.paid);
  const transferredTrips = completedTrips.filter(trip => trip.paymentStatus === PaymentStatus.transferred);

  // Calculate earnings by status
  const calculateStatusEarnings = (statusTrips: typeof completedTrips) => {
    let hourly = 0;
    let mileage = 0;
    let commission = 0;

    statusTrips.forEach(trip => {
      if (trip.tripCostCalculation) {
        const hours = trip.duration ? trip.duration / 60 : 0;
        const miles = trip.distance || 0;
        
        hourly += hours * 30;
        mileage += miles * 1.5;
        commission += trip.tripCostCalculation.companyCommission;
      }
    });

    return { hourly, mileage, commission, net: hourly + mileage - commission };
  };

  const pendingEarnings = calculateStatusEarnings(pendingTrips);
  const paidEarnings = calculateStatusEarnings(paidTrips);
  const transferredEarnings = calculateStatusEarnings(transferredTrips);

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-foreground">
              Driver <span className="text-primary">Wallet</span>
            </h1>
            <p className="text-muted-foreground">Track your earnings and payout status with real-time Stripe updates</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-fit border-primary/30 bg-primary/10 text-primary">
              <Wallet className="mr-1 h-3 w-3" />
              Active
            </Badge>
            {(tripsLoading || earningsLoading) && (
              <Badge variant="outline" className="h-fit border-blue-600/30 bg-blue-600/10 text-blue-600">
                <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                Syncing
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Total Earnings Summary */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card className="border-primary/20 hover:shadow-gold transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${netEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Net after deductions</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 hover:shadow-gold transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hourly Pay</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${totalHourlyPay.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">$30 per hour</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 hover:shadow-gold transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mileage Pay</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${totalMileagePay.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">$1.50 per mile</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 hover:shadow-gold transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
            <Receipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{completedTrips.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Breakdown Card */}
      <Card className="mb-8 border-primary/20 shadow-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Earnings Breakdown
          </CardTitle>
          <CardDescription>Detailed view of your income and deductions with automatic Stripe processing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border-2 border-primary/30 bg-primary/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Hourly Earnings</span>
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">${totalHourlyPay.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">$30 per hour worked</p>
            </div>

            <div className="rounded-lg border-2 border-primary/30 bg-primary/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Mileage Earnings</span>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">${totalMileagePay.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">$1.50 per mile driven</p>
            </div>

            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Deductions</span>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
              <div className="text-2xl font-bold text-destructive">-${totalCommissionDeduction.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Company commission</p>
            </div>
          </div>

          <Separator className="bg-primary/20" />

          <div className="rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-foreground">Net Earnings</span>
              <span className="text-3xl font-bold text-primary">${netEarnings.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout Status Tabs with Real-Time Updates */}
      <Card className="border-primary/20 shadow-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payout Status - Real-Time Stripe Tracking
          </CardTitle>
          <CardDescription>Automatic payment status updates from Stripe integration</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">
                Pending ({pendingTrips.length})
              </TabsTrigger>
              <TabsTrigger value="paid">
                Paid ({paidTrips.length})
              </TabsTrigger>
              <TabsTrigger value="transferred">
                Transferred ({transferredTrips.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              <div className="mb-4 rounded-lg border-2 border-primary/30 bg-primary/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Pending Earnings</span>
                  <span className="text-xl font-bold text-primary">${pendingEarnings.net.toFixed(2)}</span>
                </div>
              </div>

              {pendingTrips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="mb-4 h-12 w-12 text-primary" />
                  <h3 className="mb-2 text-lg font-semibold">No Pending Payouts</h3>
                  <p className="text-sm text-muted-foreground">All your earnings have been processed</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip ID</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Miles</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingTrips.map((trip) => {
                      const hours = trip.duration ? (trip.duration / 60).toFixed(1) : '0';
                      const miles = trip.distance?.toFixed(1) || '0';
                      const hourlyPay = trip.duration ? (trip.duration / 60) * 30 : 0;
                      const mileagePay = (trip.distance || 0) * 1.5;
                      const commission = trip.tripCostCalculation?.companyCommission || 0;
                      const net = hourlyPay + mileagePay - commission;

                      return (
                        <TableRow key={trip.tripId.toString()}>
                          <TableCell className="font-mono text-xs">#{trip.tripId.toString().slice(0, 8)}</TableCell>
                          <TableCell>{hours} hrs</TableCell>
                          <TableCell>{miles} mi</TableCell>
                          <TableCell className="font-semibold">${net.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                              <Clock className="mr-1 h-3 w-3" />
                              Pending
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {pendingTrips.length > 0 && (
                <Alert className="mt-4 border-primary/30 bg-primary/5">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm">
                    <strong>Pending Payouts:</strong> These earnings are awaiting Stripe processing. Payments are automatically calculated and processed after trip completion.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="paid" className="mt-4">
              <div className="mb-4 rounded-lg border-2 border-green-600/30 bg-green-600/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Paid Earnings</span>
                  <span className="text-xl font-bold text-green-600">${paidEarnings.net.toFixed(2)}</span>
                </div>
              </div>

              {paidTrips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle className="mb-4 h-12 w-12 text-green-600" />
                  <h3 className="mb-2 text-lg font-semibold">No Paid Transactions</h3>
                  <p className="text-sm text-muted-foreground">Completed trips will appear here once paid</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip ID</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Miles</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paidTrips.map((trip) => {
                      const hours = trip.duration ? (trip.duration / 60).toFixed(1) : '0';
                      const miles = trip.distance?.toFixed(1) || '0';
                      const hourlyPay = trip.duration ? (trip.duration / 60) * 30 : 0;
                      const mileagePay = (trip.distance || 0) * 1.5;
                      const commission = trip.tripCostCalculation?.companyCommission || 0;
                      const net = hourlyPay + mileagePay - commission;

                      return (
                        <TableRow key={trip.tripId.toString()}>
                          <TableCell className="font-mono text-xs">#{trip.tripId.toString().slice(0, 8)}</TableCell>
                          <TableCell>{hours} hrs</TableCell>
                          <TableCell>{miles} mi</TableCell>
                          <TableCell className="font-semibold">${net.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-green-600/30 bg-green-600/10 text-green-600">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Paid
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {paidTrips.length > 0 && (
                <Alert className="mt-4 border-green-600/30 bg-green-600/5">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-sm">
                    <strong>Paid Status:</strong> These payments have been processed by Stripe and are ready for transfer to your account.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="transferred" className="mt-4">
              <div className="mb-4 rounded-lg border-2 border-blue-600/30 bg-blue-600/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Transferred Earnings</span>
                  <span className="text-xl font-bold text-blue-600">${transferredEarnings.net.toFixed(2)}</span>
                </div>
              </div>

              {transferredTrips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CreditCard className="mb-4 h-12 w-12 text-blue-600" />
                  <h3 className="mb-2 text-lg font-semibold">No Transferred Payments</h3>
                  <p className="text-sm text-muted-foreground">Stripe transfers will appear here once confirmed</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip ID</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Miles</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transferredTrips.map((trip) => {
                      const hours = trip.duration ? (trip.duration / 60).toFixed(1) : '0';
                      const miles = trip.distance?.toFixed(1) || '0';
                      const hourlyPay = trip.duration ? (trip.duration / 60) * 30 : 0;
                      const mileagePay = (trip.distance || 0) * 1.5;
                      const commission = trip.tripCostCalculation?.companyCommission || 0;
                      const net = hourlyPay + mileagePay - commission;

                      return (
                        <TableRow key={trip.tripId.toString()}>
                          <TableCell className="font-mono text-xs">#{trip.tripId.toString().slice(0, 8)}</TableCell>
                          <TableCell>{hours} hrs</TableCell>
                          <TableCell>{miles} mi</TableCell>
                          <TableCell className="font-semibold">${net.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-blue-600/30 bg-blue-600/10 text-blue-600">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Transferred
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {transferredTrips.length > 0 && (
                <Alert className="mt-4 border-blue-600/30 bg-blue-600/5">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm">
                    <strong>Stripe Transfers Confirmed:</strong> These payments have been successfully transferred to your connected Stripe account. Funds should be available in your bank account according to your Stripe payout schedule.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
