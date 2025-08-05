import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import AnimatedNavbar from "@/components/AnimatedNavbar"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TaskHub - Premium Freelance Marketplace",
  description: "Connect with top-rated professionals and get your projects done faster",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} bg-gray-50 min-h-screen`}>
          <AnimatedNavbar />
          <main>{children}</main>
          <Toaster position="top-right" richColors />
        </body>
      </html>
    </ClerkProvider>
  )
}
