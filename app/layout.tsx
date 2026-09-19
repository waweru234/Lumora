import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Caveat, Instrument_Sans, Lobster_Two } from 'next/font/google'
import './globals.css'

const display = Lobster_Two({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-display' })
const body = Instrument_Sans({ subsets: ['latin'], variable: '--font-body' })
const handwritten = Caveat({ subsets: ['latin'], variable: '--font-handwritten' })

export const metadata: Metadata = {
  title: 'Lumora — Trade with clarity',
  description: 'A modern trading experience built around speed, insight, and control.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${handwritten.variable} antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
