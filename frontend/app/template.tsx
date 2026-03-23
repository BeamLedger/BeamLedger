import UtilityBar from '../components/UtilityBar'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <UtilityBar />
      <main className="flex-1 overflow-y-auto" style={{ background: "#0d0d10" }}>
        {children}
      </main>
    </>
  )
}
