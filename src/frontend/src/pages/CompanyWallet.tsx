import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Wallet, PiggyBank, Receipt, ExternalLink, RefreshCw } from 'lucide-react';
import { useGetCompanyEarnings, useGetClientTrips } from '../hooks/useQueries';
import { TripStatus } from '../backend';

export default function CompanyWallet() {
  const { data: companyEarnings, isLoading: earningsLoading } = useGetCompanyEarnings();
  const { data: trips = [], isLoading: tripsLoading } = useGetClientTrips();

  // Calculate additional metrics
  const completedTrips = trips.filter(trip => trip.tripStatus === TripStatus.completed);
  const totalTrips = completedTrips.length;

  // Calculate tax funds collected (if any drivers opted in)
  const totalTaxFunds = 0; // This would need to be tracked separately in the backend

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-foreground">
              Company <span className="text-primary">Wallet</span>
            </h1>
            <p className="text-muted-foreground">Track total company revenue with real-time Stripe integration</p>
          </div>
          {(earningsLoading || tripsLoading) && (
            <Badge variant="outline" className="h-fit border-blue-600/30 bg-blue-600/10 text-blue-600">
              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
              Syncing
            </Badge>
          )}
        </div>
      </div>

      {/* Total Revenue Summary */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card className="border-primary/20 hover:shadow-gold transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${companyEarnings?.totalCompanyEarnings.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 hover:shadow-gold transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${companyEarnings?.totalCommission.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">$5/hour from jobs</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 hover:shadow-gold transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deposits</CardTitle>
            <PiggyBank className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${companyEarnings?.totalDeposits.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">$5 per booking</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 hover:shadow-gold transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
            <Receipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalTrips}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown Card */}
      <Card className="mb-8 border-primary/20 shadow-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Revenue Breakdown - Automatic Stripe Processing
          </CardTitle>
          <CardDescription>Real-time company income tracking with Stripe integration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {earningsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : companyEarnings ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border-2 border-primary/30 bg-primary/10 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground">Commission Earnings</span>
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    ${companyEarnings.totalCommission.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    $5 per hour commission from completed jobs
                  </p>
                  <Separator className="my-3 bg-primary/20" />
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rate per hour</span>
                      <span className="font-medium">$5.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed jobs</span>
                      <span className="font-medium">{totalTrips}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border-2 border-primary/30 bg-primary/10 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground">Deposit Share</span>
                    <PiggyBank className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    ${companyEarnings.totalDeposits.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    $5 allocation from each client deposit
                  </p>
                  <Separator className="my-3 bg-primary/20" />
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Share per deposit</span>
                      <span className="font-medium">$5.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total deposits</span>
                      <span className="font-medium">{totalTrips}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-primary/20" />

              {/* Total Revenue Summary */}
              <div className="rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/20 to-primary/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Total Company Revenue</h3>
                    <p className="text-sm text-muted-foreground">Combined earnings from all sources via Stripe</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-primary">
                      ${companyEarnings.totalCompanyEarnings.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4 bg-primary/20" />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Commission from jobs</span>
                    <span className="font-medium text-foreground">${companyEarnings.totalCommission.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Deposit allocations</span>
                    <span className="font-medium text-foreground">${companyEarnings.totalDeposits.toFixed(2)}</span>
                  </div>
                  {totalTaxFunds > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Tax funds collected</span>
                      <span className="font-medium text-foreground">${totalTaxFunds.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stripe Integration Info */}
              <Alert className="border-primary/30 bg-primary/5">
                <ExternalLink className="h-4 w-4 text-primary" />
                <AlertDescription>
                  <strong className="text-foreground">Stripe Dashboard Integration:</strong> All payments are automatically processed through Stripe. Access your Stripe dashboard for comprehensive transaction history, per-driver analytics, and detailed per-job breakdowns. Real-time updates reflect completed payments and transfers.
                </AlertDescription>
              </Alert>

              {/* Payment History Summary */}
              <div className="rounded-lg border border-primary/20 bg-background p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  Payment Summary
                </h3>
                <div className="grid gap-3 md:grid-cols-3 text-sm">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Average per Job</p>
                    <p className="text-lg font-bold text-primary">
                      ${totalTrips > 0 ? (companyEarnings.totalCompanyEarnings / totalTrips).toFixed(2) : '0.00'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Commission Rate</p>
                    <p className="text-lg font-bold text-primary">$5/hour</p>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Deposit Share</p>
                    <p className="text-lg font-bold text-primary">$5/booking</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wallet className="mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">No Revenue Data</h3>
              <p className="text-sm text-muted-foreground">Company earnings will appear here once trips are completed</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
