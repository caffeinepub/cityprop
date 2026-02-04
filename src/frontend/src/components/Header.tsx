import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Moon, Sun, Menu, User, Car, Languages } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { AppRole } from '../backend';
import { useI18n } from '../i18n/useI18n';
import { LANGUAGES } from '../i18n/translations';

export default function Header() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { data: userProfile } = useGetCallerUserProfile();
  const { language, setLanguage, t } = useI18n();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const getRoleBadge = () => {
    if (!userProfile) return null;
    
    const isDriver = userProfile.appRole === AppRole.driver;
    
    return (
      <Badge 
        variant="outline" 
        className={`flex items-center gap-1 ${
          isDriver 
            ? 'border-primary/30 bg-primary/10 text-primary' 
            : 'border-blue-600/30 bg-blue-600/10 text-blue-600'
        }`}
      >
        {isDriver ? <Car className="h-3 w-3" /> : <User className="h-3 w-3" />}
        {isDriver ? t('header.driver') : t('header.customer')}
      </Badge>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-gold">
      <div className="container flex h-24 items-center justify-between py-3">
        <div className="flex items-center gap-4">
          <img 
            src="/assets/generated/cityprop-inc-multiservices-header-transparent.dim_200x200.png" 
            alt="Cityprop INC Multi-services" 
            className="h-20 w-20 object-contain drop-shadow-md" 
          />
          <div className="flex flex-col">
            <h1 className="text-lg font-bold leading-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent sm:text-xl">
              Cityprop Companies
            </h1>
            <p className="text-xs text-muted-foreground">Multi-services Platform</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-4 md:flex">
          {isAuthenticated && userProfile && (
            <div className="flex items-center gap-3 rounded-full bg-primary/10 border border-primary/30 px-4 py-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{userProfile.name}</span>
              </div>
              {getRoleBadge()}
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary">
                <Languages className="h-5 w-5" />
                <span className="sr-only">Select language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {LANGUAGES.map((lang) => (
                <DropdownMenuItem 
                  key={lang.code} 
                  onClick={() => setLanguage(lang.code)}
                  className={language === lang.code ? 'bg-primary/10' : ''}
                >
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>{t('header.theme.light')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>{t('header.theme.dark')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>{t('header.theme.system')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            onClick={handleAuth} 
            disabled={disabled} 
            variant={isAuthenticated ? 'outline' : 'default'}
            className={isAuthenticated ? 'border-primary/30 hover:bg-primary/10' : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-gold'}
          >
            {loginStatus === 'logging-in' ? t('header.loggingIn') : isAuthenticated ? t('header.logout') : t('header.login')}
          </Button>
        </div>

        {/* Mobile Navigation */}
        <div className="flex items-center gap-2 md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary">
                <Languages className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {LANGUAGES.map((lang) => (
                <DropdownMenuItem 
                  key={lang.code} 
                  onClick={() => setLanguage(lang.code)}
                  className={language === lang.code ? 'bg-primary/10' : ''}
                >
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>{t('header.theme.light')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>{t('header.theme.dark')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>{t('header.theme.system')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-4 pt-8">
                {isAuthenticated && userProfile && (
                  <div className="flex flex-col gap-2 rounded-lg bg-primary/10 border border-primary/30 p-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">{userProfile.name}</span>
                    </div>
                    {getRoleBadge()}
                  </div>
                )}
                <Button 
                  onClick={handleAuth} 
                  disabled={disabled} 
                  variant={isAuthenticated ? 'outline' : 'default'} 
                  className={`w-full ${isAuthenticated ? 'border-primary/30 hover:bg-primary/10' : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-gold'}`}
                >
                  {loginStatus === 'logging-in' ? t('header.loggingIn') : isAuthenticated ? t('header.logout') : t('header.login')}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
