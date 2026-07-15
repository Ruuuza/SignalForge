import { useEffect, useMemo, useState } from 'react'
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { api, demoDashboard } from './api'
import { localizeCampaignText, translations, type Language } from './i18n'
import type { Campaign, CreateCampaign, Dashboard, DeliveryEvent } from './types'
import './App.css'

type Theme = 'dark' | 'light'
type Translation = (typeof translations)[Language]
type IconName = 'grid' | 'pulse' | 'layers' | 'terminal' | 'github' | 'plus' | 'arrow' | 'sun' | 'moon' | 'globe'

const initialLanguage = (): Language => localStorage.getItem('signalforge-language') === 'pt-BR' ? 'pt-BR' : 'en-US'
const initialTheme = (): Theme => {
  const saved = localStorage.getItem('signalforge-theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

const Icon = ({ name }: { name: IconName }) => {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    pulse: <path d="M3 12h4l2.4-7 4.2 14 2.2-7H21"/>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
    terminal: <><path d="m5 7 4 4-4 4M12 17h7"/><rect x="2" y="3" width="20" height="18" rx="2"/></>,
    github: <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.87c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.54 1.03 1.54 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.58 9.58 0 0 1 12 6.82a9.6 9.6 0 0 1 2.5.34c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.86v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/>,
    plus: <path d="M12 5v14M5 12h14"/>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></>,
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
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

const ThroughputChart = ({ values, label }: { values: number[]; label: string }) => {
  const max = Math.max(...values, 1)
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${45 - (value / max) * 40}`).join(' ')
  return <div className="chart-wrap">
    <div className="chart-grid"><span>6k</span><span>4k</span><span>2k</span></div>
    <svg className="chart" viewBox="0 0 100 50" preserveAspectRatio="none" role="img" aria-label={label}>
      <defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7c5cff" stopOpacity=".45"/><stop offset="1" stopColor="#7c5cff" stopOpacity="0"/></linearGradient></defs>
      <polygon points={`0,48 ${points} 100,48`} fill="url(#chartFill)"/>
      <polyline points={points} fill="none" stroke="var(--violet-2)" strokeWidth="1.2" vectorEffect="non-scaling-stroke"/>
    </svg>
  </div>
}

type CampaignTableProps = {
  campaigns: Campaign[]
  onAction: (campaign: Campaign) => void
  disabled: boolean
  language: Language
  t: Translation
  formatNumber: Intl.NumberFormat
}

const CampaignTable = ({ campaigns, onAction, disabled, language, t, formatNumber }: CampaignTableProps) => (
  <div className="table-shell"><table>
    <thead><tr>{t.table.map((heading, index) => <th key={heading}>{index === 5 ? <span className="sr-only">{heading}</span> : heading}</th>)}</tr></thead>
    <tbody>{campaigns.map(campaign => {
      const progress = Math.min(100, campaign.processed / campaign.targetVolume * 100)
      return <tr key={campaign.id}>
        <td><strong>{localizeCampaignText(campaign.name, language)}</strong><small>{localizeCampaignText(campaign.audience, language)}</small></td>
        <td><span className="channel">{campaign.channel}</span></td>
        <td><div className="progress-copy"><span>{formatNumber.format(campaign.processed)}</span><span>{Math.round(progress)}%</span></div><div className="progress"><i style={{ width: `${progress}%` }}/></div></td>
        <td>{campaign.deliveryRate ? `${campaign.deliveryRate.toFixed(2)}%` : '—'}</td>
        <td><span className={`status ${campaign.status.toLowerCase()}`}><i/>{t.statuses[campaign.status]}</span></td>
        <td><button className="table-action" disabled={disabled || campaign.status === 'Completed'} onClick={() => onAction(campaign)}>{campaign.status === 'Live' ? t.actions.pause : t.actions.launch}</button></td>
      </tr>
    })}</tbody>
  </table></div>
)

const CreateCampaignPanel = ({ open, onClose, onCreate, t }: { open: boolean; onClose: () => void; onCreate: (value: CreateCampaign) => Promise<void>; t: Translation }) => {
  const [saving, setSaving] = useState(false)
  if (!open) return null

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setSaving(true)
    await onCreate({ name: String(data.get('name')), channel: String(data.get('channel')), audience: String(data.get('audience')), targetVolume: Number(data.get('targetVolume')) }).finally(() => setSaving(false))
  }

  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal" onMouseDown={event => event.stopPropagation()} aria-modal="true" role="dialog" aria-labelledby="campaign-modal-title">
    <div className="panel-heading"><div><span className="eyebrow">{t.modal.label}</span><h2 id="campaign-modal-title">{t.modal.title}</h2></div><button className="close" onClick={onClose} aria-label={t.modal.close}>×</button></div>
    <form onSubmit={submit}>
      <label>{t.modal.name}<input name="name" minLength={3} maxLength={120} required placeholder={t.modal.namePlaceholder}/></label>
      <label>{t.modal.audience}<input name="audience" minLength={3} maxLength={120} required placeholder={t.modal.audiencePlaceholder}/></label>
      <div className="form-row"><label>{t.modal.channel}<select name="channel"><option>Email</option><option>Push</option><option>WhatsApp</option><option>SMS</option></select></label><label>{t.modal.volume}<input name="targetVolume" type="number" min="1" max="10000000" defaultValue="100000" required/></label></div>
      <div className="modal-actions"><button type="button" className="button ghost" onClick={onClose}>{t.modal.cancel}</button><button className="button primary" disabled={saving}>{saving ? t.modal.creating : t.modal.create}</button></div>
    </form>
  </section></div>
}

function App() {
  const [language, setLanguage] = useState<Language>(initialLanguage)
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [dashboard, setDashboard] = useState<Dashboard>(demoDashboard)
  const [events, setEvents] = useState<DeliveryEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [busy, setBusy] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [noticeKey, setNoticeKey] = useState<keyof Translation['notices'] | null>(null)
  const t = translations[language]
  const formatNumber = useMemo(() => new Intl.NumberFormat(language, { notation: 'compact', maximumFractionDigits: 1 }), [language])
  const formatExact = useMemo(() => new Intl.NumberFormat(language), [language])

  useEffect(() => {
    document.documentElement.lang = language
    localStorage.setItem('signalforge-language', language)
  }, [language])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    localStorage.setItem('signalforge-theme', theme)
  }, [theme])

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
    if (!connected) { setNoticeKey('mutateDemo'); return }
    setBusy(true)
    try { await api.changeCampaignState(campaign.id, campaign.status === 'Live' ? 'pause' : 'launch'); await refresh() }
    catch { setNoticeKey('actionFailed') }
    finally { setBusy(false) }
  }

  const createCampaign = async (campaign: CreateCampaign) => {
    if (!connected) { setNoticeKey('createDemo'); return }
    try { await api.createCampaign(campaign); setModalOpen(false); await refresh() }
    catch { setNoticeKey('createFailed') }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#overview"><span className="brand-mark">S<span>F</span></span><span>SignalForge<small>OPERATIONS CONTROL</small></span></a>
      <nav>{(['grid', 'pulse', 'layers', 'terminal'] as IconName[]).map((icon, index) => <a className={index === 0 ? 'active' : ''} href={['#overview', '#pipelines', '#architecture', '#engineering'][index]} key={t.nav[index]}><Icon name={icon}/>{t.nav[index]}</a>)}</nav>
      <div className="sidebar-foot"><span className={`connection ${connected ? 'online' : ''}`}><i/>{connected ? t.apiConnected : t.demoSnapshot}</span><small>{t.stack}</small></div>
    </aside>

    <main>
      <header className="topbar">
        <div><span className="mobile-brand">SF / </span><span className="environment">{t.environment}</span></div>
        <div className="topbar-actions">
          <div className="preferences">
            <label className="language-control"><span className="sr-only">{t.preferences.language}</span><Icon name="globe"/><select value={language} onChange={event => setLanguage(event.target.value as Language)} aria-label={t.preferences.language}><option value="en-US">EN-US</option><option value="pt-BR">PT-BR</option></select></label>
            <button className="theme-toggle" onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? t.preferences.light : t.preferences.dark} title={theme === 'dark' ? t.preferences.light : t.preferences.dark}><Icon name={theme === 'dark' ? 'sun' : 'moon'}/><span>{theme === 'dark' ? t.preferences.light : t.preferences.dark}</span></button>
          </div>
          <a className="github-link" href="https://github.com/Ruuuza/SignalForge" target="_blank" rel="noreferrer"><Icon name="github"/><span>github.com/Ruuuza</span></a>
        </div>
      </header>
      <div className="content">
        {noticeKey && <div className="notice" role="status"><span>{t.notices[noticeKey]}</span><button onClick={() => setNoticeKey(null)} aria-label={t.modal.close}>×</button></div>}
        <section className="hero-section" id="overview"><div><span className="eyebrow">{t.portfolioLabel}</span><h1>{t.heroLead} <em>{t.heroAccent}</em></h1><p>{t.heroDescription}</p><div className="hero-actions"><button className="button primary" onClick={() => setModalOpen(true)}><Icon name="plus"/>{t.newJourney}</button><a className="button ghost" href="#architecture">{t.exploreArchitecture}<Icon name="arrow"/></a></div></div><div className="hero-orbit"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="core"><span>{dashboard.activeCampaigns}</span><small>{t.livePipelines}</small></div><span className="node n1">API</span><span className="node n2">EVENTS</span><span className="node n3">DATA</span></div></section>

        <section className="metrics-grid"><MetricCard label={t.metrics[0][0]} value={formatNumber.format(dashboard.totalProcessed)} detail={t.metrics[0][1]}/><MetricCard label={t.metrics[1][0]} value={`${dashboard.deliveryRate.toFixed(2)}%`} detail={t.metrics[1][1]} accent/><MetricCard label={t.metrics[2][0]} value={`${formatNumber.format(dashboard.throughputPerSecond)}/s`} detail={`${formatNumber.format(activeVolume)} ${t.metrics[2][1]}`}/><MetricCard label={t.metrics[3][0]} value={`${dashboard.p95LatencyMs} ms`} detail={`${formatExact.format(dashboard.queueDepth)} ${t.metrics[3][1]}`}/></section>

        <section className="panel performance"><div className="panel-heading"><div><span className="eyebrow">{t.liveTelemetry}</span><h2>{t.deliveryThroughput}</h2></div><div className="legend"><i/>{t.messagesPerSecond}</div></div><ThroughputChart values={dashboard.throughputHistory} label={t.chartLabel}/></section>

        <section className="panel" id="pipelines"><div className="panel-heading"><div><span className="eyebrow">{t.orchestration}</span><h2>{t.campaignPipelines}</h2></div><span className="panel-meta">{dashboard.activeCampaigns} {t.active} / {dashboard.campaigns.length} {t.total}</span></div><CampaignTable campaigns={dashboard.campaigns} onAction={changeState} disabled={busy} language={language} t={t} formatNumber={formatNumber}/></section>

        <section className="split-grid">
          <article className="panel event-panel"><div className="panel-heading"><div><span className="eyebrow">{t.eventStream}</span><h2>{t.recentDeliveries}</h2></div><span className="live-pill"><i/>{t.live}</span></div><div className="events">{events.map(event => <div className="event" key={event.id}><span className={`event-icon ${event.status.toLowerCase()}`}>{event.status === 'Delivered' ? '✓' : '!'}</span><div><strong>{localizeCampaignText(event.campaign, language)}</strong><small>{event.channel} · {formatExact.format(event.batchSize)} {t.messages}</small></div><div className="event-meta"><strong>{event.latencyMs} ms</strong><small>{new Date(event.occurredAt).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</small><span className="sr-only">{t.eventStatuses[event.status as keyof typeof t.eventStatuses] ?? event.status}</span></div></div>)}</div></article>
          <article className="panel principles"><div className="panel-heading"><div><span className="eyebrow">{t.operatingPrinciples}</span><h2>{t.builtForChange}</h2></div></div>{t.principles.map(([title, description], index) => <div className="principle" key={title}><span>0{index + 1}</span><div><strong>{title}</strong><p>{description}</p></div></div>)}</article>
        </section>

        <section className="architecture-section" id="architecture"><div className="section-intro"><span className="eyebrow">{t.architectureLabel}</span><h2>{t.architectureLead}<br/><em>{t.architectureAccent}</em></h2><p>{t.architectureDescription}</p></div><div className="architecture-stack">{t.architectureRows.map(([layer, responsibility, technologies], index) => <div className="architecture-row" key={layer}><span className="layer-index">0{index + 1}</span><strong>{layer}</strong><span>{responsibility}</span><small>{technologies}</small></div>)}</div></section>

        <section className="career-section" id="engineering"><div className="section-intro"><span className="eyebrow">{t.proofLabel}</span><h2>{t.proofLead}<br/><em>{t.proofAccent}</em></h2><p>{t.proofDescription}</p></div><div className="career-list">{t.career.map(([period, role, company, signal]) => <article key={company}><span>{period}</span><div><h3>{role}</h3><strong>{company}</strong><p>{signal}</p></div></article>)}</div></section>

        <footer><div className="brand footer-brand"><span className="brand-mark">S<span>F</span></span><span>SignalForge<small>{t.footerCredit}</small></span></div><div><span>.NET 10 / C# 14</span><span>REACT / TYPESCRIPT</span><span>EVENT-DRIVEN</span></div></footer>
      </div>
    </main>
    <CreateCampaignPanel open={modalOpen} onClose={() => setModalOpen(false)} onCreate={createCampaign} t={t}/>
  </div>
}

export default App
