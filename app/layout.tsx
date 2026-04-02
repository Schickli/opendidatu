import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono, Inter } from 'next/font/google'
import 'maplibre-gl/dist/maplibre-gl.css'
import './globals.css'

const _jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] })
const _inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Zentrale - Meldungsposten',
  description: 'Informationssystem fuer die Zentrale zur Verwaltung von Meldungsposten',
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
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" className="bg-background">
      <body className="font-mono antialiased">
        {children}
      </body>
    </html>
  )
}
