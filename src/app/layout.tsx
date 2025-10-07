import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import StripeReceiptClient from '@/components/StripeReceiptClient';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import GlobalNewsletterProvider from '@/components/GlobalNewsletterProvider';
import BannedUserProvider from '@/components/BannedUserProvider';
import FreeListingsProvider from '@/components/FreeListingsProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Cinzel, Lora } from 'next/font/google';
import AutoTranslate from '@/lib/translate/AutoTranslate';
import { cookies } from 'next/headers';
import EnhancerClient from '@/lib/translate/EnhancerClient';
import NavigationProgress from '@/components/NavigationProgress';
import OnboardingGuard from '@/components/OnboardingGuard';
import LuxuryLightboxProvider from '@/components/LuxuryLightboxProvider';
import OrganizationJsonLd from '@/components/OrganizationJsonLd';
export const dynamic = 'force-dynamic';

const fontHeadline = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-headline',
});

const fontBody = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});


export const metadata: Metadata = {
  title: 'BestCarEvents',
  description: 'Your premier destination for car events and the automotive marketplace.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002'),
  openGraph: {
    siteName: 'BestCarEvents',
  },
  twitter: {
    site: '@BestCarEvents',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const c = await cookies();
  const locales = new Set(['en','sv','da','ur','it']);
  const cookieLocale = c.get('NEXT_LOCALE')?.value || 'en';
  const locale = locales.has(cookieLocale) ? cookieLocale : 'en';
  return (
    <html lang={locale} className='dark'>
      <body className={cn(
        "font-body antialiased flex flex-col min-h-screen bg-muted/90",
        fontHeadline.variable,
        fontBody.variable
      )}>
        <LanguageProvider>
          <GlobalNewsletterProvider>
            <FreeListingsProvider>
              <BannedUserProvider>
              <NavigationProgress />
              <Header />
              <LuxuryLightboxProvider>
              <main className="flex-1 mt-20">
                <OnboardingGuard />
                {/* Auto send receipt email on Stripe success in client (fallback to webhook) */}
                <StripeReceiptClient />
                {/* Auto-translate all text nodes for non-default locales */}
                {/* Default is en */}
                {/* Server component ensures no creds leak client-side */}
                {/* If cache-miss, it queues in background */}
                {/* This is a best-effort sitewide pass */}
                {/* Structured components with complex formatting may still need explicit wiring later */}
                {/* But this provides broad coverage with zero manual work */}
                {/* locale is derived from the URL per i18n */}
                {/* eslint-disable-next-line react/no-children-prop */}
                <AutoTranslate locale={locale} defaultLocale="en" children={children} />
                {/* Client enhancer to swap text after hydration if cache was just filled */}
                <EnhancerClient locale={locale} defaultLocale="en" />
              </main>
              </LuxuryLightboxProvider>
              <Footer />
              <Toaster />
              <OrganizationJsonLd />
              </BannedUserProvider>
            </FreeListingsProvider>
          </GlobalNewsletterProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
