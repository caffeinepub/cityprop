import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Clock, DollarSign, Shield, Car, Users } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useI18n } from '../i18n/useI18n';
import VideoPlayer from '../components/VideoPlayer';

export default function LandingPage() {
  const { login, loginStatus } = useInternetIdentity();
  const { t } = useI18n();

  return (
    <div className="container py-12">
      {/* Hero Section */}
      <section className="mb-20 text-center">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="mb-10 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-shimmer rounded-full bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-2xl" />
              <img 
                src="/assets/generated/cityprop-inc-multiservices-hero.dim_300x300.png" 
                alt="Cityprop INC Multi-services" 
                className="relative h-56 w-56 object-contain sm:h-64 sm:w-64 md:h-72 md:w-72 drop-shadow-gold-lg" 
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">{t('landing.hero.title')}</span>
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl lg:text-2xl px-4">
            {t('landing.hero.subtitle')}
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center pt-4">
            <Button 
              size="lg" 
              onClick={login} 
              disabled={loginStatus === 'logging-in'} 
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-gold-lg text-base px-8 py-6"
            >
              {loginStatus === 'logging-in' ? t('header.loggingIn') : t('landing.hero.getStartedClient')}
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={login} 
              disabled={loginStatus === 'logging-in'} 
              className="w-full sm:w-auto border-primary/30 hover:bg-primary/10 hover:text-primary text-base px-8 py-6"
            >
              {t('landing.hero.becomeDriver')}
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Video Section */}
      <section className="mb-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-3xl font-bold text-foreground md:text-4xl">
            {t('landing.howItWorks.title')} <span className="text-primary">{t('landing.howItWorks.titleHighlight')}</span>
          </h2>
          <div className="mx-auto max-w-4xl px-4">
            <VideoPlayer
              videoUrl="/assets/client-instructional-video.mp4"
              thumbnailUrl="/assets/generated/client-app-video-thumbnail.dim_400x300.jpg"
              title="Learn how to book a service"
              autoplayMuted={true}
              className="aspect-video"
            />
            <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-6">
              <p className="text-base text-muted-foreground text-center">
                {t('landing.howItWorks.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mb-20">
        <h2 className="mb-10 text-center text-3xl font-bold text-foreground md:text-4xl">{t('landing.features.title')} <span className="text-primary">{t('landing.features.titleHighlight')}</span>?</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-primary/20 hover:border-primary/40 transition-all hover:shadow-gold">
            <CardHeader>
              <MapPin className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>{t('landing.features.gpsTracking.title')}</CardTitle>
              <CardDescription>{t('landing.features.gpsTracking.description')}</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-all hover:shadow-gold">
            <CardHeader>
              <Clock className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>{t('landing.features.flexibleServices.title')}</CardTitle>
              <CardDescription>{t('landing.features.flexibleServices.description')}</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-all hover:shadow-gold">
            <CardHeader>
              <DollarSign className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>{t('landing.features.transparentPricing.title')}</CardTitle>
              <CardDescription>{t('landing.features.transparentPricing.description')}</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-all hover:shadow-gold">
            <CardHeader>
              <Shield className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>{t('landing.features.securePayments.title')}</CardTitle>
              <CardDescription>{t('landing.features.securePayments.description')}</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-all hover:shadow-gold">
            <CardHeader>
              <Car className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>{t('landing.features.professionalDrivers.title')}</CardTitle>
              <CardDescription>{t('landing.features.professionalDrivers.description')}</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-all hover:shadow-gold">
            <CardHeader>
              <Users className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>{t('landing.features.easyBooking.title')}</CardTitle>
              <CardDescription>{t('landing.features.easyBooking.description')}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Services Section */}
      <section className="mb-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-3xl font-bold text-foreground md:text-4xl">{t('landing.services.title')} <span className="text-primary">{t('landing.services.titleHighlight')}</span></h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-2 border-primary/30 shadow-gold">
              <CardHeader>
                <CardTitle className="text-xl">{t('landing.services.companion.title')}</CardTitle>
                <CardDescription>{t('landing.services.companion.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {t('landing.services.companion.items.party')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {t('landing.services.companion.items.hospital')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {t('landing.services.companion.items.meeting')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {t('landing.services.companion.items.general')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {t('landing.services.companion.items.shopping')}
                  </li>
                </ul>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 mt-4">
                  <p className="text-lg font-bold text-primary">{t('landing.services.companion.pricing')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('landing.services.companion.pricingNote')}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/30 shadow-gold">
              <CardHeader>
                <CardTitle className="text-xl">{t('landing.services.shopping.title')}</CardTitle>
                <CardDescription>{t('landing.services.shopping.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {t('landing.services.shopping.items.shopping')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {t('landing.services.shopping.items.pickup')}
                  </li>
                </ul>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 mt-4">
                  <p className="text-lg font-bold text-primary">{t('landing.services.shopping.pricing')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('landing.services.shopping.pricingNote')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6 rounded-lg bg-primary/5 border border-primary/20 p-4">
            <p className="text-center text-sm text-muted-foreground">
              <strong>Note:</strong> {t('landing.services.note')}
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border-2 border-primary/20 p-8 text-center md:p-12 shadow-gold-lg">
        <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">{t('landing.cta.title')}</h2>
        <p className="mb-6 text-lg text-muted-foreground md:text-xl">{t('landing.cta.subtitle')}</p>
        <Button 
          size="lg" 
          onClick={login} 
          disabled={loginStatus === 'logging-in'}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-gold-lg text-base px-8 py-6"
        >
          {loginStatus === 'logging-in' ? t('header.loggingIn') : t('landing.cta.button')}
        </Button>
      </section>
    </div>
  );
}
