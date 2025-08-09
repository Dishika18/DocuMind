import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "DocuMinds",
  description: "Analyze your documents and get intelligent, AI-powered insights instantly.",
  generator: "Dishika Vaishkiyar",
  icons: {
    icon: "/favicon.png", 
  },
  openGraph: {
    title: "DocuMinds - Smart AI Document Analyzer",
    siteName: "DocuMinds",
    url: "https://docu-mind-mocha.vercel.app/",
    description:
      "Analyze your documents and get intelligent, AI-powered insights instantly.",
    type: "website",
    images: [
      {
        url: "/og-image.png", 
        width: 1200,
        height: 630,
        alt: "DocuMinds - Smart AI Document Analyzer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DocuMinds - Smart AI Document Analyzer",
    description:
      "Analyze your documents and get intelligent, AI-powered insights instantly.",
    images: ["/og-image.png"], 
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
