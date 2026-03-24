import './globals.css'
import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import Sidebar from '../components/Sidebar'

export const metadata: Metadata = {
  title: 'BeamLedger CVRS',
  description: 'Compliance Verification & Record System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex h-screen bg-white overflow-hidden" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {children}
          </div>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              color: '#1f2937',
              borderRadius: 0,
            },
          }}
        />
      </body>
    </html>
  )
}
