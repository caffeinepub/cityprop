import { useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerApproved, useIsCallerAdmin } from './hooks/useQueries';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { I18nProvider } from './i18n/I18nProvider';
import { useI18n } from './i18n/useI18n';
import Header from './components/Header';
import Footer from './components/Footer';
import RoleSelectionModal from './components/RoleSelectionModal';
import ProfileSetupModal from './components/ProfileSetupModal';
import ClientDashboard from './pages/ClientDashboard';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LandingPage from './pages/LandingPage';
import ApprovalPendingScreen from './components/ApprovalPendingScreen';
import { AppRole } from './backend';

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { data: isApproved, isLoading: approvalLoading } = useIsCallerApproved();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const { t } = useI18n();

  const isAuthenticated = !!identity;

  // Show loading state while initializing or fetching profile
  if (isInitializing || (isAuthenticated && (profileLoading || approvalLoading || adminLoading))) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <div className="absolute inset-0 animate-shimmer rounded-full bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-2xl" />
            <img 
              src="/assets/generated/cityprop-inc-multiservices-hero.dim_300x300.png" 
              alt="Cityprop INC Multi-services" 
              className="relative h-56 w-56 object-contain drop-shadow-gold-lg animate-pulse" 
            />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-2 w-56 overflow-hidden rounded-full bg-primary/20">
              <div className="h-full w-1/2 animate-shimmer bg-gradient-to-r from-transparent via-primary to-transparent" />
            </div>
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show role selection modal if authenticated but no profile exists and no role selected
  const showRoleSelection = isAuthenticated && !profileLoading && isFetched && userProfile === null && selectedRole === null;
  
  // Show profile setup modal if role has been selected but profile doesn't exist yet
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null && selectedRole !== null;

  // Determine which dashboard to show based on user profile and approval status
  const showAdminDashboard = isAuthenticated && isAdmin;
  const showClientDashboard = isAuthenticated && userProfile && userProfile.appRole === AppRole.customer && isApproved;
  const showDriverDashboard = isAuthenticated && userProfile && userProfile.appRole === AppRole.driver && isApproved;
  const showApprovalPending = isAuthenticated && userProfile && !isApproved && !isAdmin;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {!isAuthenticated && <LandingPage />}
        {showApprovalPending && <ApprovalPendingScreen userProfile={userProfile} />}
        {showAdminDashboard && <AdminDashboard />}
        {showClientDashboard && <ClientDashboard userProfile={userProfile} />}
        {showDriverDashboard && <DriverDashboard userProfile={userProfile} />}
      </main>
      <Footer />
      {showRoleSelection && <RoleSelectionModal onRoleSelected={setSelectedRole} />}
      {showProfileSetup && <ProfileSetupModal selectedRole={selectedRole} />}
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </ThemeProvider>
  );
}
