import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import GlobalNewsletterProvider from '@/components/GlobalNewsletterProvider';
import FreeListingsProvider from '@/components/FreeListingsProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Cinzel, Lora } from 'next/font/google';
import AutoTranslate from '@/lib/translate/AutoTranslate';
import { cookies } from 'next/headers';
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
    <html lang="en" className='dark'>
      <body className={cn(
        "font-body antialiased flex flex-col min-h-screen bg-muted/90",
        fontHeadline.variable,
        fontBody.variable
      )}>
        <LanguageProvider>
          <GlobalNewsletterProvider>
            <FreeListingsProvider>
              <Header />
              <main className="flex-1 mt-20">
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
              </main>
              <Footer />
              <Toaster />
            </FreeListingsProvider>
          </GlobalNewsletterProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
