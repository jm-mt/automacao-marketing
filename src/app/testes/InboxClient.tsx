'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getFlows } from '@/app/actions/flows'
import styles from './inbox.module.scss'

// ─── Tipos ─────────────────────────────────────────────────────────────────

interface SimContact { id: string; email: string; first_name?: string; phone?: string }
interface LogEntry   { node_id: string; type: string; status: string; detail: string; ts: string }
interface Email {
  id: number; direction: 'outbound' | 'inbound'
  from_address: string; to_address: string
  subject: string; body_html: string | null; sent_at: string
}
interface AllEmail extends Email {
  thread_id: string | null; flow_name: string | null
  flow_id: string | null; contact: SimContact | null
}
interface FlowRun {
  id: string; flow_id: string; flow_name: string
  contact: SimContact; status: string; wait_label: string | null
  log: LogEntry[]; emails: Email[]
  created_at: string; updated_at: string
}
interface RunSummary {
  id: string; flow_name: string; contact: SimContact
  status: string; wait_label: string | null; created_at: string
}
interface FlowOption { id: string; name: string }
interface NodeCount  { count: number; type: string; detail: string }
interface AnalyticsData {
  nodes: Record<string, NodeCount>
  runs: { id: string; contact: SimContact; status: string; wait_label: string | null; created_at: string; updated_at: string }[]
}

// ─── Constantes ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  running:       'Executando…',
  waiting_reply: '⏳ Ag. resposta',
  waiting_delay: '⏳ Ag. tempo',
  waiting_chat:  '💬 Ag. chat',
  completed:     '✓ Concluído',
  error:         '✗ Erro',
}
const STATUS_CLASS: Record<string, string> = {
  running:       'statusRunning',
  waiting_reply: 'statusWait',
  waiting_delay: 'statusWait',
  waiting_chat:  'statusChat',
  completed:     'statusDone',
  error:         'statusError',
}

const REPLY_TEMPLATES = [
  'Tenho interesse!',
  'Não tenho interesse no momento.',
  'Sim, pode me enviar mais informações.',
  'Ok, obrigado!',
]

const fmt = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(iso))

type Tab = 'inbox' | 'emails' | 'analytics'

// ─── Componente principal ──────────────────────────────────────────────────

export default function InboxClient() {
  const [activeTab, setActiveTab] = useState<Tab>('inbox')
  const [runs,      setRuns]      = useState<RunSummary[]>([])
  const [allFlows,  setAllFlows]  = useState<FlowOption[]>([])
  const [showModal, setShowModal] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchRuns = useCallback(async () => {
    const res  = await fetch('/api/flow-run', { cache: 'no-store' })
    const data = await res.json() as RunSummary[]
    setRuns(data)
  }, [])

  useEffect(() => {
    fetchRuns()
    getFlows().then(list => setAllFlows(list.map(f => ({ id: f.id, name: f.name }))))
    pollingRef.current = setInterval(fetchRuns, 3000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [fetchRuns])

  return (
    <div className={styles.pageWithTabs}>

      {/* ── Header com abas ── */}
      <div className={styles.pageHeader}>
        <div className={styles.tabs}>
          <span className={styles.pageTitle}>Testes</span>
          {(['inbox', 'emails', 'analytics'] as Tab[]).map(tab => (
            <button
              key={tab}
              className={`${styles.tabBtn} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'inbox' ? 'Inbox' : tab === 'emails' ? 'Todos os Emails' : 'Analytics'}
            </button>
          ))}
        </div>
        <div className={styles.headerRight}>
          <span className={styles.pollingBadge}>
            <span className={styles.pollingDot} />
            {runs.length} teste{runs.length !== 1 ? 's' : ''}
          </span>
          <button className={styles.newBtn} onClick={() => setShowModal(true)}>+ Novo Teste</button>
        </div>
      </div>

      {/* ── Conteúdo da aba ── */}
      <div className={styles.tabContent}>
        {activeTab === 'inbox'     && <InboxTab     runs={runs} onRefreshRuns={fetchRuns} />}
        {activeTab === 'emails'    && <EmailsTab    flows={allFlows} />}
        {activeTab === 'analytics' && <AnalyticsTab flows={allFlows} onSwitchToInbox={() => setActiveTab('inbox')} />}
      </div>

      {showModal && (
        <NewTestModal
          onClose={() => setShowModal(false)}
          onCreate={async () => {
            setShowModal(false)
            await fetchRuns()
            setActiveTab('inbox')
          }}
        />
      )}
    </div>
  )
}

// ─── Aba Inbox ─────────────────────────────────────────────────────────────

function InboxTab({ runs, onRefreshRuns }: { runs: RunSummary[]; onRefreshRuns: () => Promise<void> }) {
  const [activeRun,    setActiveRun]    = useState<FlowRun | null>(null)
  const [activeRunId,  setActiveRunId]  = useState<string | null>(null)
  const [showReply,    setShowReply]    = useState(false)
  const [replyBody,    setReplyBody]    = useState('')
  const [replySubject, setReplySubject] = useState('')
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [showLog,      setShowLog]      = useState(false)
  const [viewMode,     setViewMode]     = useState<'html' | 'source'>('html')
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchActiveRun = useCallback(async (id: string) => {
    const res  = await fetch(`/api/flow-run/${id}`, { cache: 'no-store' })
    const data = await res.json() as FlowRun
    setActiveRun(data)
  }, [])

  useEffect(() => {
    if (!activeRunId) return
    pollingRef.current = setInterval(() => fetchActiveRun(activeRunId), 3000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [activeRunId, fetchActiveRun])

  async function selectRun(id: string) {
    setActiveRunId(id)
    setSelectedEmail(null)
    setShowReply(false)
    await fetchActiveRun(id)
  }

  async function advance(action: 'reply' | 'skip_delay' | 'timeout') {
    if (!activeRunId) return
    const body: Record<string, string> = { action }
    if (action === 'reply') {
      body.reply_body    = replyBody
      body.reply_subject = replySubject || `Re: ${selectedEmail?.subject ?? 'resposta'}`
    }
    await fetch(`/api/flow-run/${activeRunId}/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setShowReply(false)
    setReplyBody('')
    await fetchActiveRun(activeRunId)
    await onRefreshRuns()
  }

  return (
    <div className={styles.inboxLayout}>

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.list}>
          {runs.length === 0 && (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>⚡</span>
              <p>Nenhum teste ainda.</p>
              <p>Clique em <strong>+ Novo Teste</strong>.</p>
            </div>
          )}
          {runs.map(run => (
            <button
              key={run.id}
              className={`${styles.listItem} ${activeRunId === run.id ? styles.active : ''}`}
              onClick={() => selectRun(run.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemFlow}>{run.flow_name}</span>
                <span className={`${styles.statusBadge} ${styles[STATUS_CLASS[run.status] ?? 'statusRunning']}`}>
                  {STATUS_LABEL[run.status] ?? run.status}
                </span>
              </div>
              <span className={styles.itemContact}>
                {run.contact.first_name ? `${run.contact.first_name} — ` : ''}{run.contact.email}
              </span>
              <span className={styles.itemDate}>{fmt(run.created_at)}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Viewer */}
      <div className={styles.viewer}>
        {!activeRun ? (
          <div className={styles.emptyViewer}>
            <span className={styles.emptyIcon}>⚡</span>
            <p>Selecione um teste para visualizar</p>
          </div>
        ) : (
          <>
            {/* Run header */}
            <div className={styles.runHeader}>
              <div className={styles.runMeta}>
                <h2 className={styles.runTitle}>{activeRun.flow_name}</h2>
                <p className={styles.runContact}>
                  {activeRun.contact.first_name && <strong>{activeRun.contact.first_name}</strong>}
                  {activeRun.contact.first_name && ' — '}
                  {activeRun.contact.email}
                  {activeRun.contact.phone && ` · ${activeRun.contact.phone}`}
                </p>
              </div>
              <div className={styles.runActions}>
                <span className={`${styles.statusBadge} ${styles[STATUS_CLASS[activeRun.status] ?? 'statusRunning']}`}>
                  {STATUS_LABEL[activeRun.status] ?? activeRun.status}
                </span>
                <button className={styles.logBtn} onClick={() => setShowLog(v => !v)}>
                  {showLog ? 'Ocultar log' : 'Ver log'}
                </button>
              </div>
            </div>

            {/* Wait banner */}
            {(activeRun.status === 'waiting_reply' || activeRun.status === 'waiting_chat' || activeRun.status === 'waiting_delay') && !showReply && (
              <div className={styles.waitBanner}>
                <span className={styles.waitIcon}>
                  {activeRun.status === 'waiting_chat' ? '💬' : activeRun.status === 'waiting_reply' ? '📬' : '⏱'}
                </span>
                <div className={styles.waitInfo}>
                  <strong>{activeRun.wait_label}</strong>
                  <p>
                    {activeRun.status === 'waiting_chat'
                      ? 'O fluxo enviou uma mensagem de chat e aguarda resposta.'
                      : activeRun.status === 'waiting_reply'
                      ? 'O fluxo aguarda uma resposta do contato.'
                      : 'O fluxo aguarda a passagem de tempo.'}
                  </p>
                </div>
                <div className={styles.waitBtns}>
                  {(activeRun.status === 'waiting_reply' || activeRun.status === 'waiting_chat') && (
                    <>
                      <button className={styles.replyBtn}
                        onClick={() => { setShowReply(true); setReplySubject('') }}>
                        ↩ Responder
                      </button>
                      <button className={styles.timeoutBtn} onClick={() => advance('timeout')}>
                        ⏰ Timeout
                      </button>
                    </>
                  )}
                  {activeRun.status === 'waiting_delay' && (
                    <button className={styles.replyBtn} onClick={() => advance('skip_delay')}>
                      ⏩ Pular tempo
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Reply box */}
            {showReply && (
              <div className={styles.replyBox}>
                <div className={styles.replyHeader}>
                  <strong>Resposta de {activeRun.contact.email}</strong>
                  <button className={styles.closeReply} onClick={() => setShowReply(false)}>×</button>
                </div>
                <div className={styles.templateChips}>
                  {REPLY_TEMPLATES.map(tpl => (
                    <button key={tpl} className={styles.chip} onClick={() => setReplyBody(tpl)}>
                      {tpl}
                    </button>
                  ))}
                </div>
                <input
                  className={styles.replySubject}
                  placeholder={`Re: ${selectedEmail?.subject ?? 'resposta'}`}
                  value={replySubject}
                  onChange={e => setReplySubject(e.target.value)}
                />
                <textarea
                  className={styles.replyTextarea}
                  placeholder="Digite a resposta do contato…"
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  rows={4}
                />
                <div className={styles.replyFooter}>
                  <button className={styles.cancelReply} onClick={() => setShowReply(false)}>Cancelar</button>
                  <button className={styles.sendReply} onClick={() => advance('reply')}>
                    Enviar resposta
                  </button>
                </div>
              </div>
            )}

            {/* Log */}
            {showLog && (
              <div className={styles.logPanel}>
                <div className={styles.logTitle}>Log de execução</div>
                {activeRun.log.map((entry, i) => (
                  <div key={i} className={`${styles.logEntry} ${styles[`log_${entry.status}`]}`}>
                    <span className={styles.logIcon}>
                      {entry.status === 'ok' ? '✓' : entry.status === 'wait' ? '⏳' : entry.status === 'exit' ? '⏹' : '✗'}
                    </span>
                    <span className={styles.logType}>{entry.type}</span>
                    <span className={styles.logDetail}>{entry.detail}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Thread */}
            <div className={styles.thread}>
              {activeRun.emails.length === 0 && (
                <div className={styles.emptyThread}>
                  <span className={styles.emptyIcon}>✉</span>
                  <p>Nenhum e-mail ainda neste teste.</p>
                </div>
              )}
              {activeRun.emails.map(email => (
                <div
                  key={email.id}
                  className={`${styles.emailCard} ${email.direction === 'inbound' ? styles.inbound : styles.outbound}`}
                  onClick={() => { setSelectedEmail(email); setViewMode('html') }}
                >
                  <div className={styles.emailMeta}>
                    <span className={styles.dirLabel}>
                      {email.direction === 'outbound' ? '⬆ Fluxo → Contato' : '⬇ Contato → Fluxo'}
                    </span>
                    <span className={styles.emailTime}>{fmt(email.sent_at)}</span>
                  </div>
                  <div className={styles.emailFrom}>
                    De: <strong>{email.from_address}</strong> → {email.to_address}
                  </div>
                  <div className={styles.emailSubject}>{email.subject}</div>
                  {email.direction === 'outbound' && activeRun.status === 'waiting_reply' && (
                    <button
                      className={styles.inlineReplyBtn}
                      onClick={e => {
                        e.stopPropagation()
                        setSelectedEmail(email)
                        setShowReply(true)
                        setReplySubject(`Re: ${email.subject}`)
                      }}
                    >
                      ↩ Responder
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Visualizador */}
            {selectedEmail && (
              <div className={styles.emailViewer}>
                <div className={styles.emailViewerHeader}>
                  <div>
                    <strong>{selectedEmail.subject}</strong>
                    <p className={styles.emailViewerMeta}>
                      {selectedEmail.from_address} → {selectedEmail.to_address} · {fmt(selectedEmail.sent_at)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div className={styles.viewToggle}>
                      <button
                        className={`${styles.viewToggleBtn} ${viewMode === 'html' ? styles.viewToggleActive : ''}`}
                        onClick={() => setViewMode('html')}>Preview</button>
                      <button
                        className={`${styles.viewToggleBtn} ${viewMode === 'source' ? styles.viewToggleActive : ''}`}
                        onClick={() => setViewMode('source')}>HTML</button>
                    </div>
                    <button className={styles.closeReply} onClick={() => setSelectedEmail(null)}>×</button>
                  </div>
                </div>
                <div className={styles.emailViewerBody}>
                  {viewMode === 'html'
                    ? selectedEmail.body_html
                      ? <iframe className={styles.emailFrame} srcDoc={selectedEmail.body_html} sandbox="allow-same-origin" title="Preview" />
                      : <div className={styles.emptyViewer}><p>(sem HTML)</p></div>
                    : <pre className={styles.sourceCode}>{selectedEmail.body_html ?? '(sem HTML)'}</pre>
                  }
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Aba Todos os Emails ───────────────────────────────────────────────────

function EmailsTab({ flows }: { flows: FlowOption[] }) {
  const [emails,     setEmails]     = useState<AllEmail[]>([])
  const [filterDir,  setFilterDir]  = useState<'all' | 'outbound' | 'inbound'>('all')
  const [filterFlow, setFilterFlow] = useState<string>('all')
  const [selected,   setSelected]   = useState<AllEmail | null>(null)
  const [viewMode,   setViewMode]   = useState<'html' | 'source'>('html')

  useEffect(() => {
    fetch('/api/emails', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => setEmails(data as AllEmail[]))
  }, [])

  const filtered = emails.filter(e => {
    if (filterDir !== 'all' && e.direction !== filterDir) return false
    if (filterFlow !== 'all' && e.flow_id !== filterFlow) return false
    return true
  })

  return (
    <div className={styles.fullTab}>
      <div className={styles.filterBar}>
        <select className={styles.filterSelect} value={filterDir}
          onChange={e => setFilterDir(e.target.value as typeof filterDir)}>
          <option value="all">Todos os tipos</option>
          <option value="outbound">⬆ Outbound (fluxo → contato)</option>
          <option value="inbound">⬇ Inbound (contato → fluxo)</option>
        </select>
        <select className={styles.filterSelect} value={filterFlow}
          onChange={e => setFilterFlow(e.target.value)}>
          <option value="all">Todos os fluxos</option>
          {flows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <span className={styles.filterCount}>
          {filtered.length} e-mail{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className={styles.emailTableWrap}>
        <table className={styles.emailTable}>
          <thead>
            <tr>
              <th>Dir</th>
              <th>De</th>
              <th>Para</th>
              <th>Assunto</th>
              <th>Contato</th>
              <th>Fluxo</th>
              <th>Enviado em</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className={styles.emptyRow}>Nenhum e-mail encontrado</td></tr>
            )}
            {filtered.map(email => (
              <tr
                key={email.id}
                className={`${styles.tableRow} ${selected?.id === email.id ? styles.tableRowActive : ''}`}
                onClick={() => { setSelected(email); setViewMode('html') }}
              >
                <td>
                  <span className={`${styles.dirBadge} ${email.direction === 'outbound' ? styles.dirOut : styles.dirIn}`}>
                    {email.direction === 'outbound' ? '⬆ out' : '⬇ in'}
                  </span>
                </td>
                <td className={styles.tdMono}>{email.from_address}</td>
                <td className={styles.tdMono}>{email.to_address}</td>
                <td className={styles.tdSubject}>{email.subject}</td>
                <td className={styles.tdMuted}>{email.contact?.email ?? '—'}</td>
                <td className={styles.tdMuted}>{email.flow_name ?? '—'}</td>
                <td className={styles.tdMuted}>{fmt(email.sent_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className={styles.emailViewer}>
          <div className={styles.emailViewerHeader}>
            <div>
              <strong>{selected.subject}</strong>
              <p className={styles.emailViewerMeta}>
                {selected.from_address} → {selected.to_address} · {fmt(selected.sent_at)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className={styles.viewToggle}>
                <button className={`${styles.viewToggleBtn} ${viewMode === 'html' ? styles.viewToggleActive : ''}`}
                  onClick={() => setViewMode('html')}>Preview</button>
                <button className={`${styles.viewToggleBtn} ${viewMode === 'source' ? styles.viewToggleActive : ''}`}
                  onClick={() => setViewMode('source')}>HTML</button>
              </div>
              <button className={styles.closeReply} onClick={() => setSelected(null)}>×</button>
            </div>
          </div>
          <div className={styles.emailViewerBody}>
            {viewMode === 'html'
              ? selected.body_html
                ? <iframe className={styles.emailFrame} srcDoc={selected.body_html} sandbox="allow-same-origin" title="Preview" />
                : <div className={styles.emptyViewer}><p>(sem HTML)</p></div>
              : <pre className={styles.sourceCode}>{selected.body_html ?? '(sem HTML)'}</pre>
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Aba Analytics ────────────────────────────────────────────────────────

function AnalyticsTab({ flows, onSwitchToInbox }: { flows: FlowOption[]; onSwitchToInbox: () => void }) {
  const [flowId,  setFlowId]  = useState<string>('')
  const [data,    setData]    = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)

  async function loadAnalytics(id: string) {
    if (!id) { setData(null); return }
    setLoading(true)
    const res  = await fetch(`/api/flow-analytics?flow_id=${id}`, { cache: 'no-store' })
    const json = await res.json() as AnalyticsData
    setData(json)
    setLoading(false)
  }

  function handleFlowChange(id: string) {
    setFlowId(id)
    loadAnalytics(id)
  }

  const nodeEntries = data ? Object.entries(data.nodes) : []
  const maxCount    = nodeEntries.length > 0 ? Math.max(...nodeEntries.map(([, n]) => n.count)) : 1

  return (
    <div className={styles.fullTab}>
      <div className={styles.filterBar}>
        <select className={styles.filterSelect} value={flowId}
          onChange={e => handleFlowChange(e.target.value)}>
          <option value="">Selecione um fluxo…</option>
          {flows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        {data && (
          <span className={styles.filterCount}>
            {data.runs.length} run{data.runs.length !== 1 ? 's' : ''} ·{' '}
            {nodeEntries.length} nó{nodeEntries.length !== 1 ? 's' : ''} executados
          </span>
        )}
      </div>

      {!flowId && (
        <div className={styles.emptyViewer}>
          <span className={styles.emptyIcon}>📊</span>
          <p>Selecione um fluxo para ver o funil de execução</p>
        </div>
      )}

      {loading && <div className={styles.emptyViewer}><p>Carregando…</p></div>}

      {data && !loading && (
        <div className={styles.analyticsBody}>

          {/* Funil de nós */}
          {nodeEntries.length === 0 ? (
            <div className={styles.emptyViewer}>
              <span className={styles.emptyIcon}>📭</span>
              <p>Nenhum nó executado ainda neste fluxo.</p>
            </div>
          ) : (
            <div className={styles.nodeGrid}>
              {nodeEntries
                .sort((a, b) => b[1].count - a[1].count)
                .map(([nodeId, node]) => (
                  <div key={nodeId} className={styles.nodeCard}>
                    <div className={styles.nodeCardType}>{node.type}</div>
                    <div className={styles.nodeCardCount}>{node.count}</div>
                    <div className={styles.nodeCardLabel}>{node.detail}</div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${Math.round((node.count / maxCount) * 100)}%` }}
                      />
                    </div>
                    <div className={styles.nodeCardSub}>{nodeId}</div>
                  </div>
                ))
              }
            </div>
          )}

          {/* Tabela de runs */}
          <div className={styles.analyticsSection}>
            <h3 className={styles.analyticsSectionTitle}>
              Runs deste fluxo ({data.runs.length})
            </h3>
            <table className={styles.emailTable}>
              <thead>
                <tr>
                  <th>Contato</th>
                  <th>Status</th>
                  <th>Criado em</th>
                  <th>Atualizado em</th>
                </tr>
              </thead>
              <tbody>
                {data.runs.length === 0 && (
                  <tr><td colSpan={4} className={styles.emptyRow}>Nenhum run ainda</td></tr>
                )}
                {data.runs.map(run => (
                  <tr key={run.id} className={styles.tableRow} onClick={onSwitchToInbox}>
                    <td className={styles.tdMono}>{run.contact?.email ?? run.id}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[STATUS_CLASS[run.status] ?? 'statusRunning']}`}>
                        {STATUS_LABEL[run.status] ?? run.status}
                      </span>
                    </td>
                    <td className={styles.tdMuted}>{fmt(run.created_at)}</td>
                    <td className={styles.tdMuted}>{fmt(run.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Modal Novo Teste ─────────────────────────────────────────────────────

function NewTestModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (runId: string) => void
}) {
  const [flows,     setFlows]     = useState<FlowOption[]>([])
  const [flowId,    setFlowId]    = useState('')
  const [firstName, setFirstName] = useState('')
  const [email,     setEmail]     = useState('')
  const [phone,     setPhone]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [err,       setErr]       = useState('')

  useEffect(() => {
    getFlows().then(list => setFlows(list.map(f => ({ id: f.id, name: f.name }))))
  }, [])

  async function handleCreate() {
    if (!flowId || !email) { setErr('Selecione um fluxo e informe o e-mail.'); return }
    setLoading(true); setErr('')
    const res = await fetch('/api/flow-run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flow_id: flowId,
        contact: { email, first_name: firstName || undefined, phone: phone || undefined },
      }),
    })
    const data = await res.json() as { id?: string; error?: string }
    setLoading(false)
    if (!res.ok || !data.id) { setErr(data.error ?? 'Erro ao iniciar teste'); return }
    onCreate(data.id)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Novo teste de fluxo</h2>

        <label className={styles.modalLabel}>Fluxo</label>
        <select className={styles.modalSelect} value={flowId} onChange={e => setFlowId(e.target.value)}>
          <option value="">Selecione um fluxo…</option>
          {flows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>

        <label className={styles.modalLabel}>Nome do contato</label>
        <input className={styles.modalInput} placeholder="João Silva"
          value={firstName} onChange={e => setFirstName(e.target.value)} />

        <label className={styles.modalLabel}>E-mail do contato *</label>
        <input className={styles.modalInput} type="email" placeholder="joao@exemplo.com"
          value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()} />

        <label className={styles.modalLabel}>Telefone (opcional)</label>
        <input className={styles.modalInput} placeholder="+5511999999999"
          value={phone} onChange={e => setPhone(e.target.value)} />

        {err && <p style={{ color: '#DC2626', fontSize: 12 }}>{err}</p>}

        <div className={styles.modalActions}>
          <button className={styles.modalCancelBtn} onClick={onClose}>Cancelar</button>
          <button className={styles.modalConfirmBtn}
            disabled={loading || !flowId || !email}
            onClick={handleCreate}>
            {loading ? 'Iniciando…' : '▶ Iniciar teste'}
          </button>
        </div>
      </div>
    </div>
  )
}
