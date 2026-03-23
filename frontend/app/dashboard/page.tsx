"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'
import { fetchOrganizations, fetchSites, fetchFixturesBySite, createOrganization, fetchAnalytics, exportFixturesCSV, importFixturesCSV, createReplacementPlan, fetchReplacementPlans } from '../../lib/api'
import api from '../../lib/api'

interface Organization {
  id: number
  name: string
  description?: string
}
interface Site {
  id: number
  name: string
  description?: string
  organization_id: number
}
interface Fixture {
  id: number
  asset_tag: string
  fixture_type: string
  cct?: number
  lumens?: number
  shielding?: string
  tilt?: number
  site_id?: number
  zone_id?: number
}

const DashboardPage: React.FC = () => {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<number | null>(null)
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSite, setSelectedSite] = useState<number | null>(null)
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [fixtureEvaluations, setFixtureEvaluations] = useState<Record<number, { status: string; reasons: any }>>({})
  const [analytics, setAnalytics] = useState<any | null>(null)
  const [replacementPlans, setReplacementPlans] = useState<any[]>([])
  const [importMessage, setImportMessage] = useState('')
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgDesc, setNewOrgDesc] = useState('')
  const [error, setError] = useState('')

  // Check token on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  useEffect(() => {
    fetchOrganizations().then(setOrganizations).catch(() => setError('Failed to load organizations'))
  }, [])

  useEffect(() => {
    if (selectedOrg) {
      fetchSites(selectedOrg).then(setSites).catch(() => setError('Failed to load sites'))
    } else {
      setSites([])
    }
    setSelectedSite(null)
    setFixtures([])
  }, [selectedOrg])

  useEffect(() => {
    if (selectedSite) {
      fetchFixturesBySite(selectedSite).then((data) => {
        setFixtures(data)
        // evaluate each fixture
        data.forEach(async (fixture: Fixture) => {
          try {
            const res = await api.get(`/fixtures/${fixture.id}/evaluate`)
            setFixtureEvaluations((prev) => ({ ...prev, [fixture.id]: res.data }))
          } catch {
            setFixtureEvaluations((prev) => ({ ...prev, [fixture.id]: { status: 'unknown', reasons: {} } }))
          }
        })
      }).catch(() => setError('Failed to load fixtures'))
    } else {
      setFixtures([])
      setFixtureEvaluations({})
    }
  }, [selectedSite])

  useEffect(() => {
    // Fetch analytics when organization changes
    if (selectedOrg) {
      fetchAnalytics(selectedOrg).then(setAnalytics).catch(() => setAnalytics(null))
    } else {
      setAnalytics(null)
    }
  }, [selectedOrg])

  useEffect(() => {
    // Fetch replacement plans when site changes
    if (selectedSite) {
      fetchReplacementPlans({ site_id: selectedSite }).then(setReplacementPlans).catch(() => setReplacementPlans([]))
    } else {
      setReplacementPlans([])
    }
  }, [selectedSite])

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const org = await createOrganization(newOrgName, newOrgDesc)
      setOrganizations([...organizations, org])
      setNewOrgName('')
      setNewOrgDesc('')
    } catch {
      setError('Failed to create organization')
    }
  }

  const handleExportCSV = async () => {
    try {
      let blob: Blob
      if (selectedSite) {
        blob = await exportFixturesCSV({ site_id: selectedSite })
      } else if (selectedOrg) {
        blob = await exportFixturesCSV({ organization_id: selectedOrg })
      } else {
        return
      }
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'fixtures.csv'
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to export CSV')
    }
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedOrg) return
    try {
      const result = await importFixturesCSV(selectedOrg, file)
      setImportMessage(`Imported ${result.imported} fixtures with ${result.errors.length} errors`)
      // refresh fixtures
      if (selectedSite) {
        fetchFixturesBySite(selectedSite).then(setFixtures)
      }
    } catch {
      setError('Failed to import CSV')
    }
  }

  const handleCreateReplacement = async (fixtureId: number) => {
    try {
      const plan = await createReplacementPlan({ fixture_id: fixtureId, proposed_type: 'Recommended LED', estimated_wattage_reduction: 50, estimated_cost: 200 })
      setReplacementPlans([...replacementPlans, plan])
    } catch {
      setError('Failed to create replacement plan')
    }
  }

  return (
    <div>
      <Navbar />
      <main className="p-4">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Organizations</h2>
          <ul className="mb-2 space-y-1">
            {organizations.map((org) => (
              <li key={org.id} className="flex items-center justify-between">
                <button className={`py-1 px-2 rounded ${selectedOrg === org.id ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setSelectedOrg(org.id)}>
                  {org.name}
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={handleCreateOrganization} className="space-y-2">
            <input type="text" placeholder="New organization name" value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} className="border px-2 py-1 w-full" required />
            <input type="text" placeholder="Description (optional)" value={newOrgDesc} onChange={(e) => setNewOrgDesc(e.target.value)} className="border px-2 py-1 w-full" />
            <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded">Create Org</button>
          </form>
        </div>
        {selectedOrg && (
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Sites</h2>
            <ul className="mb-2 space-y-1">
              {sites.map((site) => (
                <li key={site.id}>
                  <button className={`py-1 px-2 rounded ${selectedSite === site.id ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setSelectedSite(site.id)}>
                    {site.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {selectedOrg && analytics && (
          <div className="mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white shadow p-4 rounded">
              <h3 className="font-semibold">Total Fixtures</h3>
              <p className="text-xl">{analytics.total_fixtures}</p>
            </div>
            <div className="bg-green-100 shadow p-4 rounded">
              <h3 className="font-semibold">Pass</h3>
              <p className="text-xl">{analytics.pass}</p>
            </div>
            <div className="bg-yellow-100 shadow p-4 rounded">
              <h3 className="font-semibold">Warn</h3>
              <p className="text-xl">{analytics.warn}</p>
            </div>
            <div className="bg-red-100 shadow p-4 rounded">
              <h3 className="font-semibold">Fail</h3>
              <p className="text-xl">{analytics.fail}</p>
            </div>
            <div className="bg-orange-100 shadow p-4 rounded">
              <h3 className="font-semibold">Glare Risk</h3>
              <p className="text-xl">{analytics.glare_risk}</p>
            </div>
            <div className="bg-purple-100 shadow p-4 rounded">
              <h3 className="font-semibold">Uplight Risk</h3>
              <p className="text-xl">{analytics.uplight_risk}</p>
            </div>
          </div>
        )}
        {selectedOrg && (
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Inventory Tools</h2>
            <div className="flex items-center space-x-4">
              <button onClick={handleExportCSV} className="bg-blue-600 text-white px-3 py-1 rounded">Export CSV</button>
              <label className="block">
                <span className="sr-only">Import CSV</span>
                <input type="file" accept=".csv" onChange={handleImportCSV} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border file:border-gray-300 file:rounded file:bg-gray-50 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-gray-100" />
              </label>
              {importMessage && <span className="text-sm text-green-600">{importMessage}</span>}
            </div>
          </div>
        )}
        {selectedSite && (
          <div className="overflow-x-auto">
            <h2 className="font-semibold mb-2">Fixtures</h2>
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-gray-200 text-left">
                  <th className="px-2 py-1 border">Asset Tag</th>
                  <th className="px-2 py-1 border">Type</th>
                  <th className="px-2 py-1 border">CCT</th>
                  <th className="px-2 py-1 border">Lumens</th>
                  <th className="px-2 py-1 border">Status</th>
                  <th className="px-2 py-1 border">PDF</th>
                  <th className="px-2 py-1 border">Replacement</th>
                </tr>
              </thead>
              <tbody>
                {fixtures.map((fx) => {
                  const evaluation = fixtureEvaluations[fx.id]
                  const plan = replacementPlans.find((p) => p.fixture_id === fx.id)
                  return (
                    <tr key={fx.id} className="border-b">
                      <td className="px-2 py-1 border">{fx.asset_tag}</td>
                      <td className="px-2 py-1 border">{fx.fixture_type}</td>
                      <td className="px-2 py-1 border">{fx.cct ?? ''}</td>
                      <td className="px-2 py-1 border">{fx.lumens ?? ''}</td>
                      <td className="px-2 py-1 border">
                        {evaluation ? (
                          <span className={
                            evaluation.status === 'pass' ? 'text-green-700' : evaluation.status === 'warn' ? 'text-yellow-700' : 'text-red-700'
                          }>
                            {evaluation.status}
                          </span>
                        ) : '...'}
                      </td>
                      <td className="px-2 py-1 border">
                        {/* Link to download PDF */}
                        <a href={`${process.env.NEXT_PUBLIC_API_URL}/fixtures/${fx.id}/report.pdf`} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">PDF</a>
                      </td>
                      <td className="px-2 py-1 border">
                        {plan ? (
                          <span className="text-sm">{plan.status}</span>
                        ) : evaluation && evaluation.status === 'fail' ? (
                          <button onClick={() => handleCreateReplacement(fx.id)} className="bg-red-600 text-white px-2 py-1 rounded">Plan</button>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

export default DashboardPage