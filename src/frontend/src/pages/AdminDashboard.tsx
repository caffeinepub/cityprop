import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useListApprovals, useSetApproval, useGetCompanyEarnings } from '../hooks/useQueries';
import { ApprovalStatus } from '../backend';
import { CheckCircle2, XCircle, Clock, Users, Shield, DollarSign, TrendingUp, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '../i18n/useI18n';
import StripeSetupCheck from '../components/StripeSetupCheck';
import CompanyWallet from './CompanyWallet';

export default function AdminDashboard() {
  const { data: approvals = [], isLoading } = useListApprovals();
  const { data: companyEarnings, isLoading: earningsLoading } = useGetCompanyEarnings();
  const setApproval = useSetApproval();
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [showCompanyWallet, setShowCompanyWallet] = useState(false);
  const { t } = useI18n();

  const handleApproval = async (userPrincipal: string, status: ApprovalStatus) => {
    setProcessingUser(userPrincipal);
    try {
      await setApproval.mutateAsync({
        user: userPrincipal as any,
        status,
      });
      toast.success(`User ${status === ApprovalStatus.approved ? 'approved' : 'rejected'} successfully`);
    } catch (error: any) {
      toast.error('Failed to update approval status: ' + error.message);
    } finally {
      setProcessingUser(null);
    }
  };

  const pendingApprovals = approvals.filter((a) => a.status === ApprovalStatus.pending);
  const approvedUsers = approvals.filter((a) => a.status === ApprovalStatus.approved);
  const rejectedUsers = approvals.filter((a) => a.status === ApprovalStatus.rejected);

  if (showCompanyWallet) {
    return (
      <div>
        <div className="container py-8">
          <Button
            onClick={() => setShowCompanyWallet(false)}
            variant="outline"
            className="mb-4 border-primary/30 hover:bg-primary/10"
          >
            {t('admin.backToDashboard')}
          </Button>
        </div>
        <CompanyWallet />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <StripeSetupCheck />
      
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-foreground">
              {t('admin.title')} <span className="text-primary">{t('admin.titleHighlight')}</span>
            </h1>
            <p className="text-muted-foreground">{t('admin.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCompanyWallet(true)}
            variant="outline"
            className="border-primary/30 hover:bg-primary/10 hover:text-primary"
          >
            <Wallet className="mr-2 h-4 w-4" />
            {t('admin.companyWallet')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 hover:shadow-gold transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.stats.pendingApprovals')}</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{pendingApprovals.length}</div>
            <p className="text-xs text-muted-foreground">{t('admin.stats.awaitingReview')}</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 hover:shadow-gold transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.stats.approvedUsers')}</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{approvedUsers.length}</div>
            <p className="text-xs text-muted-foreground">{t('admin.stats.activeUsers')}</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 hover:shadow-gold transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.stats.totalApplications')}</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{approvals.length}</div>
            <p className="text-xs text-muted-foreground">{t('admin.stats.allTime')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Company Earnings Summary */}
      <Card className="mb-8 border-primary/20 shadow-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            {t('admin.earnings.title')}
          </CardTitle>
          <CardDescription>{t('admin.earnings.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {earningsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : companyEarnings ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border-2 border-primary/30 bg-primary/10 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{t('admin.earnings.commission')}</span>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-primary">${companyEarnings.totalCommission.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">{t('admin.earnings.commissionNote')}</p>
                </div>

                <div className="rounded-lg border-2 border-primary/30 bg-primary/10 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{t('admin.earnings.deposits')}</span>
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-primary">${companyEarnings.totalDeposits.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">{t('admin.earnings.depositsNote')}</p>
                </div>

                <div className="rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/20 to-primary/10 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{t('admin.earnings.total')}</span>
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-primary">${companyEarnings.totalCompanyEarnings.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">{t('admin.earnings.totalNote')}</p>
                </div>
              </div>

              <Separator className="bg-primary/20" />

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <h3 className="font-semibold text-foreground mb-3">{t('admin.earnings.breakdown')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('admin.earnings.commissionJobs')}</span>
                    <span className="font-medium text-foreground">${companyEarnings.totalCommission.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('admin.earnings.allocationDeposits')}</span>
                    <span className="font-medium text-foreground">${companyEarnings.totalDeposits.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2 bg-primary/20" />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">{t('admin.earnings.totalRevenue')}</span>
                    <span className="text-lg font-bold text-primary">${companyEarnings.totalCompanyEarnings.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={() => setShowCompanyWallet(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-gold"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  {t('admin.earnings.viewFull')}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <DollarSign className="mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">{t('admin.earnings.noData')}</h3>
              <p className="text-sm text-muted-foreground">{t('admin.earnings.noDataDescription')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approvals Management */}
      <Card className="border-primary/20 shadow-gold">
        <CardHeader>
          <CardTitle>{t('admin.approvals.title')}</CardTitle>
          <CardDescription>{t('admin.approvals.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">
                {t('admin.approvals.tabs.pending')} ({pendingApprovals.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                {t('admin.approvals.tabs.approved')} ({approvedUsers.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                {t('admin.approvals.tabs.rejected')} ({rejectedUsers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              {pendingApprovals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="mb-4 h-12 w-12 text-primary" />
                  <h3 className="mb-2 text-lg font-semibold">{t('admin.approvals.empty.noPending')}</h3>
                  <p className="text-sm text-muted-foreground">{t('admin.approvals.empty.noPendingDescription')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.approvals.table.principalId')}</TableHead>
                      <TableHead>{t('admin.approvals.table.status')}</TableHead>
                      <TableHead className="text-right">{t('admin.approvals.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApprovals.map((approval) => (
                      <TableRow key={approval.principal.toString()}>
                        <TableCell className="font-mono text-xs">
                          {approval.principal.toString().slice(0, 20)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                            <Clock className="mr-1 h-3 w-3" />
                            {t('admin.approvals.tabs.pending')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-600/30 text-green-600 hover:bg-green-600/10"
                              onClick={() => handleApproval(approval.principal.toString(), ApprovalStatus.approved)}
                              disabled={processingUser === approval.principal.toString()}
                            >
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              {t('admin.approvals.actions.approve')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-600/30 text-red-600 hover:bg-red-600/10"
                              onClick={() => handleApproval(approval.principal.toString(), ApprovalStatus.rejected)}
                              disabled={processingUser === approval.principal.toString()}
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              {t('admin.approvals.actions.reject')}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="approved" className="mt-4">
              {approvedUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="mb-4 h-12 w-12 text-primary" />
                  <h3 className="mb-2 text-lg font-semibold">{t('admin.approvals.empty.noApproved')}</h3>
                  <p className="text-sm text-muted-foreground">{t('admin.approvals.empty.noApprovedDescription')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.approvals.table.principalId')}</TableHead>
                      <TableHead>{t('admin.approvals.table.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedUsers.map((approval) => (
                      <TableRow key={approval.principal.toString()}>
                        <TableCell className="font-mono text-xs">
                          {approval.principal.toString().slice(0, 20)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-green-600/30 bg-green-600/10 text-green-600">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            {t('admin.approvals.tabs.approved')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="mt-4">
              {rejectedUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <XCircle className="mb-4 h-12 w-12 text-primary" />
                  <h3 className="mb-2 text-lg font-semibold">{t('admin.approvals.empty.noRejected')}</h3>
                  <p className="text-sm text-muted-foreground">{t('admin.approvals.empty.noRejectedDescription')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.approvals.table.principalId')}</TableHead>
                      <TableHead>{t('admin.approvals.table.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejectedUsers.map((approval) => (
                      <TableRow key={approval.principal.toString()}>
                        <TableCell className="font-mono text-xs">
                          {approval.principal.toString().slice(0, 20)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-red-600/30 bg-red-600/10 text-red-600">
                            <XCircle className="mr-1 h-3 w-3" />
                            {t('admin.approvals.tabs.rejected')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
