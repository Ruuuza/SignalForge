export type Campaign = {
  id: string
  name: string
  channel: string
  audience: string
  targetVolume: number
  status: 'Draft' | 'Live' | 'Paused' | 'Completed'
  processed: number
  delivered: number
  failed: number
  deliveryRate: number
  updatedAt: string
}

export type Dashboard = {
  totalProcessed: number
  deliveryRate: number
  activeCampaigns: number
  throughputPerSecond: number
  queueDepth: number
  p95LatencyMs: number
  throughputHistory: number[]
  campaigns: Campaign[]
}

export type DeliveryEvent = {
  id: string
  campaignId: string
  campaign: string
  channel: string
  status: string
  batchSize: number
  latencyMs: number
  occurredAt: string
}

export type CreateCampaign = {
  name: string
  channel: string
  audience: string
  targetVolume: number
}
