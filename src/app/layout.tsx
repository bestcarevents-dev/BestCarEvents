import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import GlobalNewsletterProvider from '@/components/GlobalNewsletterProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Montserrat } from 'next/font/google';

const fontHeadline = Montserrat({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-headline',
});

const fontBody = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
});


export const metadata: Metadata = {
  title: 'BestCarEvents',
  description: 'Your premier destination for car events and the automotive marketplace.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className='dark'>
      <body className={cn(
        "font-body antialiased flex flex-col min-h-screen bg-muted/90",
        fontHeadline.variable,
        fontBody.variable
      )}>
        <LanguageProvider>
          <GlobalNewsletterProvider>
            <Header />
            <main className="flex-1 mt-24">{children}</main>
            <Footer />
            <Toaster />
          </GlobalNewsletterProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
