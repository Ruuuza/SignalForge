import type { CreateCampaign, Dashboard } from './types'

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })

  if (!response.ok) {
    const problem = await response.json().catch(() => null)
    throw new Error(problem?.title ?? `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export const api = {
  dashboard: () => request<Dashboard>('/api/dashboard'),
  createCampaign: (campaign: CreateCampaign) =>
    request('/api/campaigns', { method: 'POST', body: JSON.stringify(campaign) }),
  changeCampaignState: (id: string, action: 'launch' | 'pause') =>
    request(`/api/campaigns/${id}/${action}`, { method: 'POST' }),
}

export const demoDashboard: Dashboard = {
  totalProcessed: 518380,
  deliveryRate: 99.23,
  activeCampaigns: 3,
  throughputPerSecond: 5728,
  queueDepth: 612,
  p95LatencyMs: 104,
  throughputHistory: [3300, 3700, 3480, 4120, 3990, 4460, 4320, 4870, 4610, 5050, 4780, 5290, 5120, 5480, 5260, 5650, 5420, 5780, 5590, 5728],
  campaigns: [
    { id: 'demo-1', name: 'Win-back intelligence', channel: 'Push', audience: 'Dormant customers / 90d', targetVolume: 380000, status: 'Live', processed: 129630, delivered: 128400, failed: 1230, deliveryRate: 99.05, updatedAt: new Date().toISOString() },
    { id: 'demo-2', name: 'Creator launch sequence', channel: 'Email', audience: 'High-intent creators', targetVolume: 240000, status: 'Live', processed: 84940, delivered: 84200, failed: 740, deliveryRate: 99.13, updatedAt: new Date().toISOString() },
    { id: 'demo-3', name: 'Cart recovery pulse', channel: 'WhatsApp', audience: 'Abandoned checkout / 2h', targetVolume: 610000, status: 'Live', processed: 303810, delivered: 301800, failed: 2010, deliveryRate: 99.34, updatedAt: new Date().toISOString() },
    { id: 'demo-4', name: 'Loyalty tier migration', channel: 'SMS', audience: 'Gold and platinum', targetVolume: 185000, status: 'Draft', processed: 0, delivered: 0, failed: 0, deliveryRate: 0, updatedAt: new Date().toISOString() },
  ],
}
