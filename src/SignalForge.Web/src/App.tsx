import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { api, demoDashboard } from './api'
import { localizeCampaignText, translations, type Language } from './i18n'
import type { Campaign, CreateCampaign, Dashboard, DeliveryEvent } from './types'
import './App.css'

type Theme = 'dark' | 'light'
type Translation = (typeof translations)[Language]
type IconName = 'grid' | 'pulse' | 'layers' | 'terminal' | 'user' | 'github' | 'linkedin' | 'plus' | 'arrow' | 'sun' | 'moon' | 'globe' | 'document' | 'download'

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
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    github: <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.87c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.54 1.03 1.54 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.58 9.58 0 0 1 12 6.82a9.6 9.6 0 0 1 2.5.34c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.86v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/>,
    linkedin: <><rect x="3" y="9" width="4" height="12"/><path d="M5 3.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM11 21v-7a4 4 0 0 1 8 0v7M11 9v12M19 21v-7"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></>,
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
    document: <><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/></>,
    download: <><path d="M12 3v12m-4-4 4 4 4-4"/><path d="M5 20h14"/></>,
  }
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

const LocaleFlag = ({ language }: { language: Language }) => language === 'pt-BR'
  ? <svg className="locale-flag" viewBox="0 0 24 16" aria-hidden="true"><rect width="24" height="16" rx="1" fill="#169b62"/><path d="M12 2.2 21 8l-9 5.8L3 8z" fill="#ffdf00"/><circle cx="12" cy="8" r="3.4" fill="#002776"/><path d="M9.3 7.5c1.8-.7 3.7-.4 5.4.7" fill="none" stroke="#fff" strokeWidth=".7"/></svg>
  : <svg className="locale-flag" viewBox="0 0 24 16" aria-hidden="true"><rect width="24" height="16" rx="1" fill="#fff"/><path d="M0 0h24v2H0zm0 4h24v2H0zm0 4h24v2H0zm0 4h24v2H0z" fill="#b22234"/><rect width="10.5" height="8.6" rx=".5" fill="#3c3b6e"/><path d="m2 2 .4.8.9.1-.7.6.2.9-.8-.5-.8.5.2-.9-.7-.6.9-.1zm3.2 0 .4.8.9.1-.7.6.2.9-.8-.5-.8.5.2-.9-.7-.6.9-.1zm3.2 0 .4.8.9.1-.7.6.2.9-.8-.5-.8.5.2-.9-.7-.6.9-.1z" fill="#fff"/></svg>

const Hint = ({ label, text }: { label: string; text: string }) => {
  const id = useId()
  return <span className="tooltip">
    <button type="button" className="tooltip-trigger" aria-label={`${label}: ${text}`} aria-describedby={id}>i</button>
    <span className="tooltip-content" id={id} role="tooltip">{text}</span>
  </span>
}

const HeadingWithHint = ({ children, hint }: { children: string; hint: string }) => <div className="heading-line"><h2>{children}</h2><Hint label={children} text={hint}/></div>

const MetricCard = ({ label, value, detail, hint, accent }: { label: string; value: string; detail: string; hint: string; accent?: boolean }) => (
  <article className={`metric-card ${accent ? 'accent' : ''}`}>
    <div className="metric-label"><span>{label}</span><Hint label={label} text={hint}/></div>
    <strong>{value}</strong>
    <small>{detail}</small>
  </article>
)

type ThroughputChartProps = {
  values: number[]
  label: string
  emptyTitle: string
  emptyDescription: string
  currentLabel: string
  formatNumber: Intl.NumberFormat
}

const ThroughputChart = ({ values, label, emptyTitle, emptyDescription, currentLabel, formatNumber }: ThroughputChartProps) => {
  const hasData = values.some(value => value > 0)
  const max = Math.max(...values, 1)
  const scaleMax = hasData ? Math.max(1000, Math.ceil(max / 1000) * 1000) : 6000
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${45 - (value / scaleMax) * 40}`).join(' ')
  const lastValue = values.at(-1) ?? 0
  const lastY = 45 - (lastValue / scaleMax) * 40
  const chartKey = values.join('-')

  return <div className={`chart-wrap ${hasData ? 'has-data' : 'is-empty'}`}>
    <div className="chart-grid"><span>{formatNumber.format(scaleMax)}</span><span>{formatNumber.format(Math.round(scaleMax * .66))}</span><span>{formatNumber.format(Math.round(scaleMax * .33))}</span></div>
    {hasData ? <>
      <div className="chart-current"><span>{currentLabel}</span><strong>{formatNumber.format(lastValue)}/s</strong></div>
      <svg className="chart" viewBox="0 0 100 50" preserveAspectRatio="none" role="img" aria-label={label}>
        <defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7c5cff" stopOpacity=".45"/><stop offset="1" stopColor="#7c5cff" stopOpacity="0"/></linearGradient></defs>
        <g key={chartKey} className="chart-series"><polygon points={`0,48 ${points} 100,48`} fill="url(#chartFill)"/><polyline className="chart-line" points={points} fill="none" stroke="var(--violet-2)" strokeWidth="1.2" vectorEffect="non-scaling-stroke"/><circle className="chart-pulse" cx="100" cy={lastY} r="1.5" fill="var(--violet-2)"/></g>
      </svg>
    </> : <div className="chart-empty"><span className="chart-empty-icon"><Icon name="pulse"/></span><div><strong>{emptyTitle}</strong><p>{emptyDescription}</p></div></div>}
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
        <td data-label={t.table[0]}><strong>{localizeCampaignText(campaign.name, language)}</strong><small>{localizeCampaignText(campaign.audience, language)}</small></td>
        <td data-label={t.table[1]}><span className="channel">{campaign.channel}</span></td>
        <td data-label={t.table[2]}><div className="progress-copy"><span>{formatNumber.format(campaign.processed)}</span><span>{Math.round(progress)}%</span></div><div className="progress"><i style={{ width: `${progress}%` }}/></div></td>
        <td data-label={t.table[3]}>{campaign.deliveryRate ? `${campaign.deliveryRate.toFixed(2)}%` : '—'}</td>
        <td data-label={t.table[4]}><span className={`status ${campaign.status.toLowerCase()}`}><i/>{t.statuses[campaign.status]}</span></td>
        <td data-label={t.table[5]}><button className="table-action" disabled={disabled || campaign.status === 'Completed'} onClick={() => onAction(campaign)}>{campaign.status === 'Live' ? t.actions.pause : t.actions.launch}</button></td>
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
  const [activeCase, setActiveCase] = useState(0)
  const [aboutTab, setAboutTab] = useState<'profile' | 'resume'>('profile')
  const [noticeKey, setNoticeKey] = useState<keyof Translation['notices'] | null>(null)
  const dashboardLoaded = useRef(false)
  const languageMenu = useRef<HTMLDetailsElement>(null)
  const t = translations[language]
  const formatNumber = useMemo(() => new Intl.NumberFormat(language, { notation: 'compact', maximumFractionDigits: 1 }), [language])
  const formatExact = useMemo(() => new Intl.NumberFormat(language), [language])
  const resumePath = language === 'pt-BR' ? '/resumes/Rodrigo-Alves-Ruza-Curriculo-pt-BR.pdf' : '/resumes/Rodrigo-Alves-Ruza-Resume-en-US.pdf'
  const linkedInUrl = language === 'pt-BR'
    ? 'https://www.linkedin.com/in/rodrigo-ruza/?locale=pt-BR'
    : 'https://www.linkedin.com/in/rodrigo-ruza/?locale=en-US'

  const selectLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage)
    if (languageMenu.current) languageMenu.current.open = false
  }

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
    try {
      const snapshot = await api.dashboard()
      setDashboard(current => {
        if (!dashboardLoaded.current) {
          dashboardLoaded.current = true
          return snapshot
        }
        return { ...snapshot, throughputHistory: [...current.throughputHistory.slice(-19), snapshot.throughputPerSecond] }
      })
      setConnected(true)
    }
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
    try {
      const created = await api.createCampaign(campaign)
      await api.changeCampaignState(created.id, 'launch')
      setModalOpen(false)
      await refresh()
      setNoticeKey('simulationStarted')
    }
    catch { setNoticeKey('createFailed') }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#overview"><span className="brand-mark">R<span>S</span></span><span>RUZO SOLUTIONS<small>{t.brandSubtitle}</small></span></a>
      <nav>{(['grid', 'pulse', 'layers', 'terminal', 'user'] as IconName[]).map((icon, index) => <a className={index === 0 ? 'active' : ''} href={['#overview', '#pipelines', '#architecture', '#engineering', '#about'][index]} key={t.nav[index]}><Icon name={icon}/>{t.nav[index]}</a>)}</nav>
      <div className="sidebar-foot"><span className={`connection ${connected ? 'online' : ''}`}><i/>{connected ? t.apiConnected : t.demoSnapshot}</span><small>{t.stack}</small></div>
    </aside>

    <main>
      <header className="topbar">
        <div><span className="mobile-brand">RS / </span><span className="environment">{t.environment}</span></div>
        <div className="topbar-actions">
          <div className="preferences">
            <details className="language-control" ref={languageMenu}>
              <summary aria-label={t.preferences.language}><LocaleFlag language={language}/><span>{language}</span><i/></summary>
              <div className="language-options" role="listbox" aria-label={t.preferences.language}>
                <button type="button" role="option" aria-selected={language === 'en-US'} onClick={() => selectLanguage('en-US')}><LocaleFlag language="en-US"/><span><strong>English</strong><small>United States · EN-US</small></span></button>
                <button type="button" role="option" aria-selected={language === 'pt-BR'} onClick={() => selectLanguage('pt-BR')}><LocaleFlag language="pt-BR"/><span><strong>Português</strong><small>Brasil · PT-BR</small></span></button>
              </div>
            </details>
            <button className="theme-toggle" onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? t.preferences.light : t.preferences.dark} title={theme === 'dark' ? t.preferences.light : t.preferences.dark}><Icon name={theme === 'dark' ? 'sun' : 'moon'}/><span>{theme === 'dark' ? t.preferences.light : t.preferences.dark}</span></button>
          </div>
          <div className="profile-links"><a className="github-link" href={linkedInUrl} target="_blank" rel="noreferrer" aria-label={t.linkedin}><Icon name="linkedin"/><span>LinkedIn</span></a><a className="github-link" href="https://github.com/Ruuuza/SignalForge" target="_blank" rel="noreferrer" aria-label="GitHub"><Icon name="github"/><span>GitHub</span></a></div>
        </div>
      </header>
      <div className="content">
        {noticeKey && <div className="notice" role="status"><span>{t.notices[noticeKey]}</span><button onClick={() => setNoticeKey(null)} aria-label={t.modal.close}>×</button></div>}
        <section className="hero-section" id="overview"><div><div className="eyebrow-line"><span className="eyebrow">{t.portfolioLabel}</span><Hint label={t.portfolioLabel} text={t.tooltips.hero}/></div><h1>{t.heroLead} <em>{t.heroAccent}</em></h1><p>{t.heroDescription}</p><div className="hero-actions"><button className="button primary" onClick={() => setModalOpen(true)}><Icon name="plus"/>{t.newJourney}</button><a className="button ghost" href="#architecture">{t.exploreArchitecture}<Icon name="arrow"/></a></div></div><div className="hero-orbit"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className={`core ${dashboard.activeCampaigns ? 'is-live' : 'is-idle'}`} tabIndex={0} title={t.tooltips.livePipelines} aria-label={dashboard.activeCampaigns ? `${dashboard.activeCampaigns} ${t.simulation.liveLabel}. ${t.tooltips.livePipelines}` : `${t.simulation.idleTitle}. ${t.simulation.idleLabel}`}><div className="core-content">{dashboard.activeCampaigns ? <><span>{dashboard.activeCampaigns}</span><small>{t.simulation.liveLabel}</small></> : <><span className="core-ready">{t.simulation.idleTitle}</span><small>{t.simulation.idleLabel}</small></>}</div></div><span className="node n1">API</span><span className="node n2">EVENTS</span><span className="node n3">DATA</span></div></section>

        <section className="metrics-grid"><MetricCard label={t.metrics[0][0]} value={formatNumber.format(dashboard.totalProcessed)} detail={t.metrics[0][1]} hint={t.tooltips.metrics[0]}/><MetricCard label={t.metrics[1][0]} value={`${dashboard.deliveryRate.toFixed(2)}%`} detail={t.metrics[1][1]} hint={t.tooltips.metrics[1]} accent/><MetricCard label={t.metrics[2][0]} value={`${formatNumber.format(dashboard.throughputPerSecond)}/s`} detail={`${formatNumber.format(activeVolume)} ${t.metrics[2][1]}`} hint={t.tooltips.metrics[2]}/><MetricCard label={t.metrics[3][0]} value={`${dashboard.p95LatencyMs} ms`} detail={`${formatExact.format(dashboard.queueDepth)} ${t.metrics[3][1]}`} hint={t.tooltips.metrics[3]}/></section>

        <section className="panel performance"><div className="panel-heading"><div><span className="eyebrow">{t.liveTelemetry}</span><HeadingWithHint hint={t.tooltips.telemetry}>{t.deliveryThroughput}</HeadingWithHint></div><div className="legend"><i/>{t.messagesPerSecond}</div></div><ThroughputChart values={dashboard.throughputHistory} label={t.chartLabel} emptyTitle={t.simulation.telemetryIdleTitle} emptyDescription={t.simulation.telemetryIdleDescription} currentLabel={t.simulation.currentThroughput} formatNumber={formatNumber}/></section>

        <section className="panel" id="pipelines"><div className="panel-heading"><div><span className="eyebrow">{t.orchestration}</span><HeadingWithHint hint={t.tooltips.pipelines}>{t.campaignPipelines}</HeadingWithHint></div><span className="panel-meta">{dashboard.activeCampaigns} {t.active} / {dashboard.campaigns.length} {t.total}</span></div><CampaignTable campaigns={dashboard.campaigns} onAction={changeState} disabled={busy} language={language} t={t} formatNumber={formatNumber}/></section>

        <section className="split-grid">
          <article className="panel event-panel"><div className="panel-heading"><div><span className="eyebrow">{t.eventStream}</span><HeadingWithHint hint={t.tooltips.events}>{t.recentDeliveries}</HeadingWithHint></div><span className="live-pill"><i/>{t.live}</span></div><div className="events">{events.map(event => <div className="event" key={event.id}><span className={`event-icon ${event.status.toLowerCase()}`}>{event.status === 'Delivered' ? '✓' : '!'}</span><div><strong>{localizeCampaignText(event.campaign, language)}</strong><small>{event.channel} · {formatExact.format(event.batchSize)} {t.messages}</small></div><div className="event-meta"><strong>{event.latencyMs} ms</strong><small>{new Date(event.occurredAt).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</small><span className="sr-only">{t.eventStatuses[event.status as keyof typeof t.eventStatuses] ?? event.status}</span></div></div>)}</div></article>
          <article className="panel principles"><div className="panel-heading"><div><span className="eyebrow">{t.operatingPrinciples}</span><HeadingWithHint hint={t.tooltips.principles}>{t.builtForChange}</HeadingWithHint></div></div>{t.principles.map(([title, description], index) => <div className="principle" key={title}><span>0{index + 1}</span><div><strong>{title}</strong><p>{description}</p></div></div>)}</article>
        </section>

        <section className="architecture-section" id="architecture"><div className="section-intro"><div className="eyebrow-line"><span className="eyebrow">{t.architectureLabel}</span><Hint label={t.architectureLabel} text={t.tooltips.architecture}/></div><h2>{t.architectureLead}<br/><em>{t.architectureAccent}</em></h2><p>{t.architectureDescription}</p></div><div className="architecture-stack">{t.architectureRows.map(([layer, responsibility, technologies], index) => <div className="architecture-row" key={layer}><span className="layer-index">0{index + 1}</span><strong>{layer}</strong><span>{responsibility}</span><small>{technologies}</small></div>)}</div></section>

        <section className="engineering-section" id="engineering">
          <div className="section-intro"><div className="eyebrow-line"><span className="eyebrow">{t.proofLabel}</span><Hint label={t.proofLabel} text={t.tooltips.engineering}/></div><h2>{t.proofLead}<br/><em>{t.proofAccent}</em></h2><p>{t.proofDescription}</p></div>
          <div className="decision-lab">
            <div className="decision-tabs" role="tablist" aria-label={t.proofLabel}>{t.engineeringCases.map(([title, summary], index) => <button type="button" role="tab" id={`case-tab-${index}`} aria-controls={`case-panel-${index}`} aria-selected={activeCase === index} className={activeCase === index ? 'active' : ''} onClick={() => setActiveCase(index)} key={title}><span>0{index + 1}</span><div><strong>{title}</strong><small>{summary}</small></div><Icon name="arrow"/></button>)}</div>
            {t.engineeringCases.map(([title, summary, challenge, decision, evidence], index) => activeCase === index && <article className="decision-panel" role="tabpanel" id={`case-panel-${index}`} aria-labelledby={`case-tab-${index}`} key={title}><span className="eyebrow">CASE / 0{index + 1}</span><h3>{title}</h3><p>{summary}</p><div className="case-grid">{[challenge, decision, evidence].map((value, itemIndex) => <div key={t.caseLabels[itemIndex]}><span>0{itemIndex + 1}</span><strong>{t.caseLabels[itemIndex]}</strong><p>{value}</p></div>)}</div></article>)}
          </div>
        </section>

        <section className="about-section" id="about">
          <div className="section-intro"><div className="eyebrow-line"><span className="eyebrow">{t.aboutLabel}</span><Hint label={t.aboutLabel} text={t.tooltips.about}/></div><h2>{t.aboutLead}<br/><em>{t.aboutAccent}</em></h2><p>{t.aboutDescription}</p><div className="about-tabs" role="tablist" aria-label={t.aboutLabel}><button type="button" role="tab" aria-selected={aboutTab === 'profile'} className={aboutTab === 'profile' ? 'active' : ''} onClick={() => setAboutTab('profile')}>{t.aboutTabs.profile}</button><button type="button" role="tab" aria-selected={aboutTab === 'resume'} className={aboutTab === 'resume' ? 'active' : ''} onClick={() => setAboutTab('resume')}>{t.aboutTabs.resume}</button></div></div>
          {aboutTab === 'profile' ? <div role="tabpanel"><div className="about-stats">{t.aboutStats.map(([value, label]) => <article key={label}><strong>{value}</strong><span>{label}</span></article>)}</div><div className="career-list">{t.career.map(([period, role, company, signal]) => <article key={company}><span>{period}</span><div><h3>{role}</h3><strong>{company}</strong><p>{signal}</p></div></article>)}</div></div> : <article className="resume-panel" role="tabpanel"><div className="resume-copy"><span className="resume-icon"><Icon name="document"/></span><div><span className="eyebrow">PDF / 2025</span><h3>{t.aboutTabs.resumeTitle}</h3><p>{t.aboutTabs.resumeDescription}</p><small>{t.aboutTabs.resumeMeta}</small></div><div className="resume-actions"><a className="button ghost" href={resumePath} target="_blank" rel="noreferrer">{t.aboutTabs.view}<Icon name="arrow"/></a><a className="button primary" href={resumePath} download><Icon name="download"/>{t.aboutTabs.download}</a></div></div><iframe className="resume-preview" src={`${resumePath}#view=FitH&toolbar=0`} title={t.aboutTabs.resumeTitle}/></article>}
        </section>

        <footer><div className="brand footer-brand"><span className="brand-mark">R<span>S</span></span><span>RUZO SOLUTIONS<small>{t.footerCredit}</small></span></div><div><span>.NET 10 / C# 14</span><span>REACT / TYPESCRIPT</span><span>EVENT-DRIVEN</span></div></footer>
      </div>
    </main>
    <CreateCampaignPanel open={modalOpen} onClose={() => setModalOpen(false)} onCreate={createCampaign} t={t}/>
  </div>
}

export default App
