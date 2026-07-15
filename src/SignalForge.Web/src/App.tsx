import { useEffect, useMemo, useState } from 'react'
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { api, demoDashboard } from './api'
import type { Campaign, CreateCampaign, Dashboard, DeliveryEvent } from './types'
import './App.css'

const formatNumber = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const formatExact = new Intl.NumberFormat('en-US')

const Icon = ({ name }: { name: 'grid' | 'pulse' | 'layers' | 'terminal' | 'github' | 'plus' | 'arrow' }) => {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    pulse: <path d="M3 12h4l2.4-7 4.2 14 2.2-7H21"/>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
    terminal: <><path d="m5 7 4 4-4 4M12 17h7"/><rect x="2" y="3" width="20" height="18" rx="2"/></>,
    github: <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.87c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.54 1.03 1.54 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.58 9.58 0 0 1 12 6.82a9.6 9.6 0 0 1 2.5.34c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.86v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/>,
    plus: <path d="M12 5v14M5 12h14"/>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>,
  }
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

const MetricCard = ({ label, value, detail, accent }: { label: string; value: string; detail: string; accent?: boolean }) => (
  <article className={`metric-card ${accent ? 'accent' : ''}`}>
    <div className="metric-label"><span>{label}</span><span className="metric-spark">↗</span></div>
    <strong>{value}</strong>
    <small>{detail}</small>
  </article>
)

const ThroughputChart = ({ values }: { values: number[] }) => {
  const max = Math.max(...values, 1)
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${45 - (value / max) * 40}`).join(' ')
  const area = `0,48 ${points} 100,48`
  return (
    <div className="chart-wrap">
      <div className="chart-grid"><span>6k</span><span>4k</span><span>2k</span></div>
      <svg className="chart" viewBox="0 0 100 50" preserveAspectRatio="none" role="img" aria-label="Message throughput trend">
        <defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7c5cff" stopOpacity=".45"/><stop offset="1" stopColor="#7c5cff" stopOpacity="0"/></linearGradient></defs>
        <polygon points={area} fill="url(#chartFill)" />
        <polyline points={points} fill="none" stroke="#a896ff" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  )
}

const CampaignTable = ({ campaigns, onAction, disabled }: { campaigns: Campaign[]; onAction: (campaign: Campaign) => void; disabled: boolean }) => (
  <div className="table-shell">
    <table>
      <thead><tr><th>Journey</th><th>Channel</th><th>Progress</th><th>Delivery</th><th>Status</th><th><span className="sr-only">Action</span></th></tr></thead>
      <tbody>{campaigns.map(campaign => {
        const progress = Math.min(100, campaign.processed / campaign.targetVolume * 100)
        return <tr key={campaign.id}>
          <td><strong>{campaign.name}</strong><small>{campaign.audience}</small></td>
          <td><span className="channel">{campaign.channel}</span></td>
          <td><div className="progress-copy"><span>{formatNumber.format(campaign.processed)}</span><span>{Math.round(progress)}%</span></div><div className="progress"><i style={{ width: `${progress}%` }}/></div></td>
          <td>{campaign.deliveryRate ? `${campaign.deliveryRate.toFixed(2)}%` : '—'}</td>
          <td><span className={`status ${campaign.status.toLowerCase()}`}><i />{campaign.status}</span></td>
          <td><button className="table-action" disabled={disabled || campaign.status === 'Completed'} onClick={() => onAction(campaign)}>{campaign.status === 'Live' ? 'Pause' : 'Launch'}</button></td>
        </tr>
      })}</tbody>
    </table>
  </div>
)

const CreateCampaignPanel = ({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (value: CreateCampaign) => Promise<void> }) => {
  const [saving, setSaving] = useState(false)
  if (!open) return null
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setSaving(true)
    await onCreate({ name: String(data.get('name')), channel: String(data.get('channel')), audience: String(data.get('audience')), targetVolume: Number(data.get('targetVolume')) }).finally(() => setSaving(false))
  }
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal" onMouseDown={event => event.stopPropagation()} aria-modal="true" role="dialog">
    <div className="panel-heading"><div><span className="eyebrow">NEW JOURNEY</span><h2>Create campaign</h2></div><button className="close" onClick={onClose} aria-label="Close">×</button></div>
    <form onSubmit={submit}>
      <label>Campaign name<input name="name" minLength={3} maxLength={120} required placeholder="e.g. Renewal intelligence" /></label>
      <label>Audience<input name="audience" minLength={3} maxLength={120} required placeholder="e.g. Annual plans / 30d" /></label>
      <div className="form-row"><label>Channel<select name="channel"><option>Email</option><option>Push</option><option>WhatsApp</option><option>SMS</option></select></label><label>Target volume<input name="targetVolume" type="number" min="1" max="10000000" defaultValue="100000" required /></label></div>
      <div className="modal-actions"><button type="button" className="button ghost" onClick={onClose}>Cancel</button><button className="button primary" disabled={saving}>{saving ? 'Creating…' : 'Create journey'}</button></div>
    </form>
  </section></div>
}

const architecture = [
  ['Experience', 'Operational control surface', 'React 19 · TypeScript · SignalR'],
  ['Edge', 'Secure and observable contracts', 'ASP.NET Core 10 · OpenAPI · Health'],
  ['Application', 'Use-case orchestration', 'Services · Dependency inversion'],
  ['Domain', 'Business rules and lifecycle', 'C# 14 · Rich domain model'],
  ['Infrastructure', 'Durable, zero-setup persistence', 'EF Core 10 · SQLite · Docker'],
]

const career = [
  ['2022 — PRESENT', 'Senior Developer', 'Locaweb / Wake', 'Campaign delivery, dynamic templates, cross-platform integrations, and resilient high-volume messaging.'],
  ['2016 — 2022', 'Senior Developer', 'Social Miner', 'Scalable products, APIs, microservices, observability, and the disciplined evolution of legacy systems.'],
  ['2013 — PRESENT', 'Full-stack Consultant', 'Code Solutions', 'End-to-end delivery, architecture standards, integrations, and technical debt reduction across industries.'],
]

function App() {
  const [dashboard, setDashboard] = useState<Dashboard>(demoDashboard)
  const [events, setEvents] = useState<DeliveryEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [busy, setBusy] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [notice, setNotice] = useState('')

  const refresh = async () => {
    try { setDashboard(await api.dashboard()); setConnected(true) }
    catch { setConnected(false) }
  }

  useEffect(() => {
    void refresh()
    const refreshTimer = window.setInterval(() => void refresh(), 5000)
    const connection = new HubConnectionBuilder().withUrl('/hubs/delivery').withAutomaticReconnect().configureLogging(LogLevel.Warning).build()
    connection.on('deliveryEvent', (event: DeliveryEvent) => setEvents(current => [event, ...current].slice(0, 8)))
    void connection.start().then(() => setConnected(true)).catch(() => setConnected(false))
    return () => { window.clearInterval(refreshTimer); void connection.stop() }
  }, [])

  useEffect(() => {
    if (events.length || !connected) return
    const channels = ['Push', 'Email', 'WhatsApp']
    setEvents(Array.from({ length: 5 }, (_, index) => ({ id: String(index), campaignId: '', campaign: demoDashboard.campaigns[index % 3].name, channel: channels[index % 3], status: index === 3 ? 'Degraded' : 'Delivered', batchSize: 680 + index * 147, latencyMs: 68 + index * 11, occurredAt: new Date(Date.now() - index * 11000).toISOString() })))
  }, [connected, events.length])

  const activeVolume = useMemo(() => dashboard.campaigns.filter(value => value.status === 'Live').reduce((sum, value) => sum + value.targetVolume, 0), [dashboard])

  const changeState = async (campaign: Campaign) => {
    if (!connected) { setNotice('Start the API to mutate live data. The current view is a resilient demo snapshot.'); return }
    setBusy(true)
    try { await api.changeCampaignState(campaign.id, campaign.status === 'Live' ? 'pause' : 'launch'); await refresh() }
    catch (error) { setNotice(error instanceof Error ? error.message : 'The action could not be completed.') }
    finally { setBusy(false) }
  }

  const createCampaign = async (campaign: CreateCampaign) => {
    if (!connected) { setNotice('Start the API to create a campaign.'); return }
    try { await api.createCampaign(campaign); setModalOpen(false); await refresh() }
    catch (error) { setNotice(error instanceof Error ? error.message : 'The campaign could not be created.') }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#overview"><span className="brand-mark">S<span>F</span></span><span>SignalForge<small>OPERATIONS CONTROL</small></span></a>
      <nav><a className="active" href="#overview"><Icon name="grid"/>Overview</a><a href="#pipelines"><Icon name="pulse"/>Pipelines</a><a href="#architecture"><Icon name="layers"/>Architecture</a><a href="#engineering"><Icon name="terminal"/>Engineering proof</a></nav>
      <div className="sidebar-foot"><span className={`connection ${connected ? 'online' : ''}`}><i />{connected ? 'API connected' : 'Demo snapshot'}</span><small>.NET 10 LTS · React 19</small></div>
    </aside>

    <main>
      <header className="topbar"><div><span className="mobile-brand">SF /</span><span className="environment">PRODUCTION SIMULATION</span></div><a className="github-link" href="https://github.com/Ruuuza" target="_blank" rel="noreferrer"><Icon name="github"/>github.com/Ruuuza</a></header>
      <div className="content">
        {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')}>×</button></div>}
        <section className="hero-section" id="overview"><div><span className="eyebrow">PORTFOLIO SYSTEM / 01</span><h1>Engineering the systems behind <em>meaningful customer moments.</em></h1><p>SignalForge is a production-minded campaign control plane built to demonstrate resilient delivery, thoughtful architecture, and full-stack product engineering.</p><div className="hero-actions"><button className="button primary" onClick={() => setModalOpen(true)}><Icon name="plus"/>New journey</button><a className="button ghost" href="#architecture">Explore architecture<Icon name="arrow"/></a></div></div><div className="hero-orbit"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="core"><span>{dashboard.activeCampaigns}</span><small>LIVE<br/>PIPELINES</small></div><span className="node n1">API</span><span className="node n2">EVENTS</span><span className="node n3">DATA</span></div></section>

        <section className="metrics-grid"><MetricCard label="Messages processed" value={formatNumber.format(dashboard.totalProcessed)} detail="Durable lifecycle metrics"/><MetricCard label="Delivery rate" value={`${dashboard.deliveryRate.toFixed(2)}%`} detail="Across all active channels" accent/><MetricCard label="Throughput" value={`${formatNumber.format(dashboard.throughputPerSecond)}/s`} detail={`${formatNumber.format(activeVolume)} active target`}/><MetricCard label="P95 latency" value={`${dashboard.p95LatencyMs} ms`} detail={`${formatExact.format(dashboard.queueDepth)} events queued`}/></section>

        <section className="panel performance"><div className="panel-heading"><div><span className="eyebrow">LIVE TELEMETRY</span><h2>Delivery throughput</h2></div><div className="legend"><i/>messages / second</div></div><ThroughputChart values={dashboard.throughputHistory}/></section>

        <section className="panel" id="pipelines"><div className="panel-heading"><div><span className="eyebrow">ORCHESTRATION</span><h2>Campaign pipelines</h2></div><span className="panel-meta">{dashboard.activeCampaigns} active / {dashboard.campaigns.length} total</span></div><CampaignTable campaigns={dashboard.campaigns} onAction={changeState} disabled={busy}/></section>

        <section className="split-grid">
          <article className="panel event-panel"><div className="panel-heading"><div><span className="eyebrow">EVENT STREAM</span><h2>Recent deliveries</h2></div><span className="live-pill"><i/>LIVE</span></div><div className="events">{events.map(event => <div className="event" key={event.id}><span className={`event-icon ${event.status.toLowerCase()}`}>{event.status === 'Delivered' ? '✓' : '!'}</span><div><strong>{event.campaign}</strong><small>{event.channel} · {formatExact.format(event.batchSize)} messages</small></div><div className="event-meta"><strong>{event.latencyMs} ms</strong><small>{new Date(event.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</small></div></div>)}</div></article>
          <article className="panel principles"><div className="panel-heading"><div><span className="eyebrow">OPERATING PRINCIPLES</span><h2>Built for change</h2></div></div><div className="principle"><span>01</span><div><strong>Resilience over optimism</strong><p>Explicit state, bounded work, health probes, and graceful frontend fallback.</p></div></div><div className="principle"><span>02</span><div><strong>Observability by default</strong><p>Live delivery signals turn invisible background work into operational context.</p></div></div><div className="principle"><span>03</span><div><strong>Boundaries that endure</strong><p>Business rules remain independent from transport, storage, and interface concerns.</p></div></div></article>
        </section>

        <section className="architecture-section" id="architecture"><div className="section-intro"><span className="eyebrow">ARCHITECTURE / 02</span><h2>Simple to run.<br/><em>Serious by design.</em></h2><p>A modular monolith keeps local execution frictionless while preserving boundaries that can evolve into independent services when scale or ownership demands it.</p></div><div className="architecture-stack">{architecture.map(([layer, responsibility, technologies], index) => <div className="architecture-row" key={layer}><span className="layer-index">0{index + 1}</span><strong>{layer}</strong><span>{responsibility}</span><small>{technologies}</small></div>)}</div></section>

        <section className="career-section" id="engineering"><div className="section-intro"><span className="eyebrow">ENGINEERING PROOF / 03</span><h2>Experience translated<br/>into <em>running software.</em></h2><p>The project is intentionally aligned with more than a decade of product delivery, modernization, messaging, and solution architecture.</p></div><div className="career-list">{career.map(([period, role, company, signal]) => <article key={company}><span>{period}</span><div><h3>{role}</h3><strong>{company}</strong><p>{signal}</p></div></article>)}</div></section>

        <footer><div className="brand footer-brand"><span className="brand-mark">S<span>F</span></span><span>SignalForge<small>DESIGNED & ENGINEERED BY RODRIGO ALVES RUZA</small></span></div><div><span>.NET 10 / C# 14</span><span>REACT / TYPESCRIPT</span><span>EVENT-DRIVEN</span></div></footer>
      </div>
    </main>
    <CreateCampaignPanel open={modalOpen} onClose={() => setModalOpen(false)} onCreate={createCampaign}/>
  </div>
}

export default App
