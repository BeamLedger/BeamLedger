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
        <div className="flex h-screen bg-[#0d0d10] overflow-hidden" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {children}
          </div>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0d0d10',
              border: '1px solid #1e1e26',
              color: '#e5e5f0',
              borderRadius: 0,
            },
          }}
        />
      </body>
    </html>
  )
}
