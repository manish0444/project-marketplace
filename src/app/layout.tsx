import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import AuthProvider from '@/providers/AuthProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import Layout from '@/components/Layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://marketplace.krishendra.com'),
  title: {
    default: 'Project Showcase | Digital Marketplace',
    template: '%s | Project Showcase'
  },
  description: 'Explore and purchase high-quality digital projects, templates, and software solutions.',
  keywords: ['marketplace', 'digital products', 'software', 'templates', 'projects', 'krishendra'],
  authors: [{ name: 'Krishendra', url: 'https://krishendra.com' }],
  creator: 'Krishendra',
  publisher: 'Project Showcase',
  applicationName: 'Project Showcase',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Project Showcase | Digital Marketplace',
    description: 'Explore and purchase high-quality digital projects, templates, and software solutions.',
    siteName: 'Project Showcase',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Project Showcase',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Project Showcase | Digital Marketplace',
    description: 'Explore and purchase high-quality digital projects, templates, and software solutions.',
    images: ['/og-image.jpg'],
    creator: '@krishendra',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <Layout>
              {children}
            </Layout>
            <Toaster 
              position="bottom-right"
              toastOptions={{
                duration: 5000,
                style: {
                  background: 'var(--toaster-bg)',
                  color: 'var(--toaster-color)',
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
        
        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Project Showcase',
              url: process.env.NEXT_PUBLIC_APP_URL || 'https://marketplace.krishendra.com',
              description: 'Explore and purchase high-quality digital projects, templates, and software solutions.',
              potentialAction: {
                '@type': 'SearchAction',
                'target': {
                  '@type': 'EntryPoint',
                  'urlTemplate': `${process.env.NEXT_PUBLIC_APP_URL || 'https://marketplace.krishendra.com'}/?q={search_term_string}`
                },
                'query-input': 'required name=search_term_string'
              }
            })
          }}
        />
      </body>
    </html>
  );
}
