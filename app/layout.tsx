import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { I18nProvider } from '@/contexts/I18nContext';
import TopNav from '@/components/TopNav';
import ToastProvider from '@/components/ToastProvider';


export const metadata: Metadata = {
  title: 'Edle Voucher Generator',
  description: 'Secure voucher management portal for Edle Bingo',
  icons: {
    icon: '/images/icon1.png',
    shortcut: '/images/icon1.png',
    apple: '/images/icon1.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Ethiopic:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <I18nProvider>
            <ToastProvider />
            <TopNav />
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
