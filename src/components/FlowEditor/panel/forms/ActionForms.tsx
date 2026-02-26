'use client'

import { useState } from 'react'
import s from './forms.module.scss'

// ─── action.send_email ─────────────────────────────────────────────────────

interface SendEmailConfig {
  to?: string
  from_name?: string
  from_email?: string
  reply_to?: string
  subject?: string
  body_html?: string
  track_opens?: boolean
  track_clicks?: boolean
}

export function SendEmailForm({ config, onChange }: { config: SendEmailConfig; onChange: (c: SendEmailConfig) => void }) {
  const [v, setV] = useState<SendEmailConfig>({ track_opens: true, track_clicks: true, ...config })

  function set<K extends keyof SendEmailConfig>(key: K, val: SendEmailConfig[K]) {
    const next = { ...v, [key]: val }
    setV(next)
    onChange(next)
  }

  return (
    <>
      <div className={s.section}>
        <div className={s.field}>
          <label className={s.label}>Para</label>
          <input className={s.input} value={v.to ?? ''} onChange={e => set('to', e.target.value)} placeholder="{{contact.email}}" />
        </div>
        <div className={s.fieldRow}>
          <div className={s.field}>
            <label className={s.label}>Nome remetente</label>
            <input className={s.input} value={v.from_name ?? ''} onChange={e => set('from_name', e.target.value)} placeholder="Sua empresa" />
          </div>
          <div className={s.field}>
            <label className={s.label}>E-mail remetente</label>
            <input className={s.input} value={v.from_email ?? ''} onChange={e => set('from_email', e.target.value)} placeholder="no-reply@empresa.com" />
          </div>
        </div>
        <div className={s.field}>
          <label className={s.label}>Assunto</label>
          <input className={s.input} value={v.subject ?? ''} onChange={e => set('subject', e.target.value)} placeholder="Olá, {{contact.first_name}}!" />
        </div>
      </div>

      <div className={s.section}>
        <div className={s.field}>
          <label className={s.label}>Corpo (HTML)</label>
          <textarea className={s.textarea} value={v.body_html ?? ''} onChange={e => set('body_html', e.target.value)} placeholder="<p>Conteúdo do e-mail…</p>" rows={5} />
        </div>
      </div>

      <div className={s.section}>
        <label className={s.checkRow}>
          <input type="checkbox" className={s.checkbox} checked={v.track_opens ?? true} onChange={e => set('track_opens', e.target.checked)} />
          <span className={s.checkLabel}>Rastrear aberturas</span>
        </label>
        <label className={s.checkRow}>
          <input type="checkbox" className={s.checkbox} checked={v.track_clicks ?? true} onChange={e => set('track_clicks', e.target.checked)} />
          <span className={s.checkLabel}>Rastrear cliques</span>
        </label>
      </div>
    </>
  )
}

// ─── action.send_whatsapp ──────────────────────────────────────────────────

interface SendWAConfig {
  to?: string
  message_type?: string
  template_name?: string
  template_params?: string[]
  body?: string
  typing_delay_ms?: number
}

export function SendWhatsAppForm({ config, onChange }: { config: SendWAConfig; onChange: (c: SendWAConfig) => void }) {
  const [v, setV] = useState<SendWAConfig>({ message_type: 'text', ...config })

  function set<K extends keyof SendWAConfig>(key: K, val: SendWAConfig[K]) {
    const next = { ...v, [key]: val }
    setV(next)
    onChange(next)
  }

  return (
    <div className={s.section}>
      <div className={s.field}>
        <label className={s.label}>Para (número com DDI)</label>
        <input className={s.input} value={v.to ?? ''} onChange={e => set('to', e.target.value)} placeholder="{{contact.phone}}" />
      </div>
      <div className={s.field}>
        <label className={s.label}>Tipo de mensagem</label>
        <select className={s.select} value={v.message_type ?? 'text'} onChange={e => set('message_type', e.target.value)}>
          <option value="text">Texto livre</option>
          <option value="template">Template HSM aprovado</option>
          <option value="image">Imagem</option>
          <option value="video">Vídeo</option>
          <option value="document">Documento</option>
          <option value="interactive">Interativo (botões/lista)</option>
        </select>
      </div>

      {v.message_type === 'template' ? (
        <div className={s.field}>
          <label className={s.label}>Nome do template</label>
          <input className={s.input} value={v.template_name ?? ''} onChange={e => set('template_name', e.target.value)} placeholder="boas_vindas_v2" />
          <p className={s.hint}>Parâmetros: <code>{'{{1}}'}</code>, <code>{'{{2}}'}</code>…</p>
        </div>
      ) : (
        <div className={s.field}>
          <label className={s.label}>Mensagem</label>
          <textarea className={s.textarea} value={v.body ?? ''} onChange={e => set('body', e.target.value)} placeholder="Olá, {{contact.first_name}}! Como posso ajudar?" rows={4} />
        </div>
      )}

      <div className={s.field}>
        <label className={s.label}>Delay de digitação (ms)</label>
        <input type="number" className={s.input} value={v.typing_delay_ms ?? 0} min={0} max={5000} onChange={e => set('typing_delay_ms', Number(e.target.value))} />
        <p className={s.hint}>Simula digitação antes de enviar. 0 = instantâneo.</p>
      </div>
    </div>
  )
}

// ─── action.send_sms ───────────────────────────────────────────────────────

interface SendSmsConfig { to?: string; body?: string; sender_id?: string }

export function SendSmsForm({ config, onChange }: { config: SendSmsConfig; onChange: (c: SendSmsConfig) => void }) {
  const [v, setV] = useState<SendSmsConfig>(config)

  function set<K extends keyof SendSmsConfig>(key: K, val: SendSmsConfig[K]) {
    const next = { ...v, [key]: val }
    setV(next)
    onChange(next)
  }

  return (
    <div className={s.section}>
      <div className={s.field}>
        <label className={s.label}>Para</label>
        <input className={s.input} value={v.to ?? ''} onChange={e => set('to', e.target.value)} placeholder="{{contact.phone}}" />
      </div>
      <div className={s.field}>
        <label className={s.label}>Mensagem</label>
        <textarea className={s.textarea} value={v.body ?? ''} onChange={e => set('body', e.target.value)} placeholder="Sua mensagem…" rows={3} />
        <p className={s.hint}>Máx 160 chars por segmento. Suporta variáveis <code>{'{{contact.name}}'}</code>.</p>
      </div>
      <div className={s.field}>
        <label className={s.label}>Sender ID (opcional)</label>
        <input className={s.input} value={v.sender_id ?? ''} onChange={e => set('sender_id', e.target.value)} placeholder="EMPRESA" />
      </div>
    </div>
  )
}

// ─── action.send_chat ──────────────────────────────────────────────────────

const CHAT_CHANNELS = [
  { value: 'webchat', label: 'Webchat' },
  { value: 'instagram_dm', label: 'Instagram DM' },
  { value: 'facebook_messenger', label: 'Facebook Messenger' },
  { value: 'telegram', label: 'Telegram' },
]

interface SendChatConfig { channel?: string; body?: string; assign_to?: string }

export function SendChatForm({ config, onChange }: { config: SendChatConfig; onChange: (c: SendChatConfig) => void }) {
  const [v, setV] = useState<SendChatConfig>({ channel: 'webchat', ...config })

  function set<K extends keyof SendChatConfig>(key: K, val: SendChatConfig[K]) {
    const next = { ...v, [key]: val }
    setV(next)
    onChange(next)
  }

  return (
    <div className={s.section}>
      <div className={s.field}>
        <label className={s.label}>Canal</label>
        <select className={s.select} value={v.channel ?? 'webchat'} onChange={e => set('channel', e.target.value)}>
          {CHAT_CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div className={s.field}>
        <label className={s.label}>Mensagem</label>
        <textarea className={s.textarea} value={v.body ?? ''} onChange={e => set('body', e.target.value)} placeholder="Texto da mensagem…" rows={3} />
      </div>
      <div className={s.field}>
        <label className={s.label}>Atribuir para agente/equipe</label>
        <input className={s.input} value={v.assign_to ?? ''} onChange={e => set('assign_to', e.target.value)} placeholder="ID do agente ou equipe" />
      </div>
    </div>
  )
}

// ─── CRM actions genéricos ─────────────────────────────────────────────────

export function ContactTagForm({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const [tags, setTags] = useState(String(config.tags ? (config.tags as string[]).join(', ') : ''))

  return (
    <div className={s.section}>
      <div className={s.field}>
        <label className={s.label}>Tags (separadas por vírgula)</label>
        <input
          className={s.input}
          value={tags}
          onChange={e => setTags(e.target.value)}
          onBlur={() => onChange({ tags: tags.split(',').map(t => t.trim()).filter(Boolean) })}
          placeholder="vip, lead_quente, trial"
        />
      </div>
    </div>
  )
}

export function ScoreUpdateForm({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const [op, setOp] = useState(String(config.operation ?? 'add'))
  const [val, setVal] = useState(Number(config.value ?? 10))

  function save() { onChange({ operation: op, value: val }) }

  return (
    <div className={s.section}>
      <div className={s.fieldRow}>
        <div className={s.field}>
          <label className={s.label}>Operação</label>
          <select className={s.select} value={op} onChange={e => { setOp(e.target.value); save() }}>
            <option value="add">Somar (+)</option>
            <option value="subtract">Subtrair (−)</option>
            <option value="set">Definir (=)</option>
          </select>
        </div>
        <div className={s.field}>
          <label className={s.label}>Valor</label>
          <input type="number" className={s.input} value={val} onChange={e => { setVal(Number(e.target.value)); save() }} />
        </div>
      </div>
    </div>
  )
}
