import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

// Add interceptor to attach token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers = config.headers || {}
      config.headers['Authorization'] = `Bearer ${token}`
    }
  }
  return config
})

export async function register(email: string, password: string, full_name?: string) {
  const res = await api.post('/auth/register', { email, password, full_name })
  return res.data
}

export async function login(email: string, password: string) {
  const res = await api.post('/auth/token', new URLSearchParams({
    username: email,
    password,
  }))
  return res.data
}

export async function fetchOrganizations() {
  const res = await api.get('/organizations/')
  return res.data
}

export async function createOrganization(name: string, description?: string) {
  const res = await api.post('/organizations/', { name, description })
  return res.data
}

export async function fetchSites(orgId: number) {
  const res = await api.get('/sites/', { params: { organization_id: orgId } })
  return res.data
}

export async function fetchFixturesBySite(siteId: number) {
  const res = await api.get('/fixtures/', { params: { site_id: siteId } })
  return res.data
}

export async function searchFixtures(orgId: number, params: {
  query?: string;
  compliance_status?: string[];
  standards?: string[];
  import_source?: string[];
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_dir?: string;
  page?: number;
  page_size?: number;
}) {
  const res = await api.post('/fixtures/search', params, {
    params: { organization_id: orgId },
  })
  return res.data
}

export async function importFixtures(orgId: number, file: File) {
  const formData = new FormData()
  formData.append('file', file, file.name)
  const res = await api.post('/fixtures/import', formData, {
    params: { organization_id: orgId },
  })
  return res.data
}

export async function importFixturesCSV(orgId: number, file: File) {
  return importFixtures(orgId, file)
}

export async function downloadImportErrorReport(auditId: number) {
  const res = await api.get(`/fixtures/import-audit/${auditId}/error-report`, {
    responseType: 'blob',
  })
  return res.data
}

export async function fetchImportAudits(orgId: number) {
  const res = await api.get('/fixtures/import-audits', {
    params: { organization_id: orgId },
  })
  return res.data
}

export async function evaluateFixture(fixtureId: number) {
  const res = await api.get(`/fixtures/${fixtureId}/evaluate`)
  return res.data
}

export async function evaluateBatch(orgId: number) {
  const res = await api.post('/fixtures/evaluate-batch', null, {
    params: { organization_id: orgId },
  })
  return res.data
}

export async function exportFixturesCSV(params: { organization_id?: number; site_id?: number }) {
  const res = await api.get('/fixtures/export-csv', { params, responseType: 'blob' })
  return res.data
}

export async function downloadFixturePdf(fixtureId: number) {
  const res = await api.get(`/fixtures/${fixtureId}/report.pdf`, { responseType: 'blob' })
  return res.data
}

export async function fetchAnalytics(orgId: number) {
  const res = await api.get(`/analytics/organization/${orgId}`)
  return res.data
}

export async function fetchReplacementPlans(params: { organization_id?: number; site_id?: number }) {
  const res = await api.get('/replacement-plans/', { params })
  return res.data
}

export async function createReplacementPlan(plan: { fixture_id: number; proposed_type: string; estimated_wattage_reduction?: number; estimated_cost?: number; status?: string }) {
  const res = await api.post('/replacement-plans/', plan)
  return res.data
}

export async function updateReplacementPlan(planId: number, plan: { fixture_id: number; proposed_type: string; estimated_wattage_reduction?: number; estimated_cost?: number; status?: string }) {
  const res = await api.put(`/replacement-plans/${planId}`, plan)
  return res.data
}

export default api
