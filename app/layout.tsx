import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import ChatWidget from '@/app/components/ChatWidget'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'GoalSquad.shop - Community Commerce Platform',
  description: 'Global 4PL and Fintech platform for community commerce',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GoalSquad',
  },
}

export const viewport: Viewport = {
  themeColor: '#004040',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <ChatWidget />
        </AuthProvider>
      </body>
    </html>
  )
}
