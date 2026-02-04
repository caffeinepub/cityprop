import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Mail, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../backend';
import { useI18n } from '../i18n/useI18n';

interface ApprovalPendingScreenProps {
  userProfile: UserProfile;
}

export default function ApprovalPendingScreen({ userProfile }: ApprovalPendingScreenProps) {
  const { t } = useI18n();

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-2xl">
        <Card className="border-primary/20 shadow-gold-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/30">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              {userProfile.isDriver ? t('approval.driverTitle') : t('approval.accountTitle')}
            </CardTitle>
            <CardDescription>{t('approval.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-primary/30 bg-primary/5">
              <Mail className="h-4 w-4 text-primary" />
              <AlertDescription>
                <strong>{t('approval.thankYou', { name: userProfile.name })}</strong>
                <br />
                {userProfile.isDriver ? (
                  <>
                    {t('approval.driverMessage')}{' '}
                    <a href="mailto:cityprop01@gmail.com" className="font-semibold text-primary underline">
                      cityprop01@gmail.com
                    </a>{' '}
                    for background verification and approval.
                  </>
                ) : (
                  t('approval.accountMessage')
                )}
              </AlertDescription>
            </Alert>

            {userProfile.isDriver && (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">{t('approval.emailInstructions')}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{t('approval.requirements.contact')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{t('approval.requirements.carInfo')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{t('approval.requirements.license')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{t('approval.requirements.workHistory')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{t('approval.requirements.background')}</span>
                  </li>
                </ul>
                <Alert className="border-primary/30 bg-primary/5 mt-4">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm">
                    <strong>Driver Requirements:</strong> {t('approval.driverRequirements')}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="rounded-lg border border-primary/20 bg-background p-4">
              <h3 className="mb-2 font-semibold text-foreground">{t('approval.nextSteps')}</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>{t('approval.steps.email')}</li>
                <li>{t('approval.steps.review')}</li>
                <li>{t('approval.steps.verification')}</li>
                <li>{t('approval.steps.notification')}</li>
                <li>{t('approval.steps.start')}</li>
              </ol>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              {t('approval.questions')}{' '}
              <a href="mailto:cityprop01@gmail.com" className="font-medium text-primary underline">
                cityprop01@gmail.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
