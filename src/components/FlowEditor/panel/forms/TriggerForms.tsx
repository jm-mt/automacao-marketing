'use client'

import { useState } from 'react'
import s from './forms.module.scss'

// ─── Listas de opções ──────────────────────────────────────────────────────

const EVENTS = [
  { value: 'message.received',    label: 'Mensagem recebida' },
  { value: 'message.read',        label: 'Mensagem lida' },
  { value: 'message.replied',     label: 'Mensagem respondida' },
  { value: 'message.failed',      label: 'Mensagem falhou' },
  { value: 'contact.created',     label: 'Contato criado' },
  { value: 'contact.updated',     label: 'Contato atualizado' },
  { value: 'contact.tag_added',   label: 'Tag adicionada' },
  { value: 'contact.tag_removed', label: 'Tag removida' },
  { value: 'form.submitted',      label: 'Formulário enviado' },
  { value: 'purchase.completed',  label: 'Compra realizada' },
  { value: 'purchase.abandoned',  label: 'Carrinho abandonado' },
  { value: 'link.clicked',        label: 'Link clicado' },
  { value: 'email.opened',        label: 'E-mail aberto' },
  { value: 'email.bounced',       label: 'E-mail com bounce' },
  { value: 'email.unsubscribed',  label: 'Descadastro' },
]

const CHANNELS = [
  { value: '',           label: 'Todos os canais' },
  { value: 'whatsapp',   label: 'WhatsApp' },
  { value: 'email',      label: 'E-mail' },
  { value: 'sms',        label: 'SMS' },
  { value: 'instagram_dm', label: 'Instagram DM' },
  { value: 'telegram',   label: 'Telegram' },
  { value: 'webchat',    label: 'Webchat' },
]

// ─── trigger.event ─────────────────────────────────────────────────────────

interface TriggerEventConfig {
  event?: string
  channel?: string
  deduplicate?: { enabled?: boolean; window_seconds?: number }
}

interface TriggerEventFormProps {
  config: TriggerEventConfig
  onChange: (c: TriggerEventConfig) => void
}

export function TriggerEventForm({ config, onChange }: TriggerEventFormProps) {
  const [v, setV] = useState<TriggerEventConfig>({
    event: '',
    channel: '',
    deduplicate: { enabled: false, window_seconds: 300 },
    ...config,
  })

  function set<K extends keyof TriggerEventConfig>(key: K, val: TriggerEventConfig[K]) {
    const next = { ...v, [key]: val }
    setV(next)
    onChange(next)
  }

  return (
    <>
      <div className={s.section}>
        <div className={s.field}>
          <label className={s.label}>Evento</label>
          <select className={s.select} value={v.event ?? ''} onChange={e => set('event', e.target.value)}>
            <option value="">Selecione um evento…</option>
            {EVENTS.map(ev => <option key={ev.value} value={ev.value}>{ev.label}</option>)}
          </select>
        </div>
        <div className={s.field}>
          <label className={s.label}>Canal</label>
          <select className={s.select} value={v.channel ?? ''} onChange={e => set('channel', e.target.value)}>
            {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <div className={s.section}>
        <label className={s.checkRow}>
          <input
            type="checkbox"
            className={s.checkbox}
            checked={v.deduplicate?.enabled ?? false}
            onChange={e => set('deduplicate', { ...v.deduplicate, enabled: e.target.checked })}
          />
          <span className={s.checkLabel}>Evitar duplicatas</span>
        </label>
        {v.deduplicate?.enabled && (
          <div className={s.field}>
            <label className={s.label}>Janela (segundos)</label>
            <input
              type="number"
              className={s.input}
              value={v.deduplicate.window_seconds ?? 300}
              min={1}
              onChange={e => set('deduplicate', { ...v.deduplicate, window_seconds: Number(e.target.value) })}
            />
          </div>
        )}
      </div>
    </>
  )
}

// ─── trigger.schedule ──────────────────────────────────────────────────────

interface TriggerScheduleConfig {
  mode?: 'cron' | 'interval' | 'datetime' | 'relative'
  cron?: string
  interval?: string
  datetime?: string
  timezone?: string
}

interface TriggerScheduleFormProps {
  config: TriggerScheduleConfig
  onChange: (c: TriggerScheduleConfig) => void
}

export function TriggerScheduleForm({ config, onChange }: TriggerScheduleFormProps) {
  const [v, setV] = useState<TriggerScheduleConfig>({ mode: 'cron', timezone: 'America/Sao_Paulo', ...config })

  function set<K extends keyof TriggerScheduleConfig>(key: K, val: TriggerScheduleConfig[K]) {
    const next = { ...v, [key]: val }
    setV(next)
    onChange(next)
  }

  return (
    <div className={s.section}>
      <div className={s.field}>
        <label className={s.label}>Modo</label>
        <select className={s.select} value={v.mode ?? 'cron'} onChange={e => set('mode', e.target.value as TriggerScheduleConfig['mode'])}>
          <option value="cron">Expressão Cron</option>
          <option value="interval">Intervalo fixo</option>
          <option value="datetime">Data/hora específica</option>
          <option value="relative">Relativo (ex: toda terça)</option>
        </select>
      </div>

      {v.mode === 'cron' && (
        <div className={s.field}>
          <label className={s.label}>Expressão Cron</label>
          <input className={s.input} value={v.cron ?? ''} onChange={e => set('cron', e.target.value)} placeholder="0 9 * * 1" />
          <p className={s.hint}>Ex: <code>0 9 * * 1</code> = toda segunda às 9h</p>
        </div>
      )}

      {v.mode === 'interval' && (
        <div className={s.field}>
          <label className={s.label}>Intervalo</label>
          <input className={s.input} value={v.interval ?? ''} onChange={e => set('interval', e.target.value)} placeholder="30m, 2h, 1d…" />
        </div>
      )}

      {v.mode === 'datetime' && (
        <div className={s.field}>
          <label className={s.label}>Data e hora</label>
          <input type="datetime-local" className={s.input} value={v.datetime ?? ''} onChange={e => set('datetime', e.target.value)} />
        </div>
      )}

      <div className={s.field}>
        <label className={s.label}>Fuso horário</label>
        <select className={s.select} value={v.timezone ?? 'America/Sao_Paulo'} onChange={e => set('timezone', e.target.value)}>
          <option value="America/Sao_Paulo">América/São Paulo (BRT)</option>
          <option value="UTC">UTC</option>
          <option value="America/New_York">América/Nova York</option>
          <option value="Europe/London">Europa/Londres</option>
        </select>
      </div>
    </div>
  )
}

// ─── trigger.webhook ───────────────────────────────────────────────────────

interface TriggerWebhookConfig {
  method?: string[]
  auth_type?: 'none' | 'api_key' | 'hmac_sha256' | 'bearer'
  secret?: string
  response_mode?: 'immediate' | 'wait_for_completion'
  timeout_ms?: number
}

interface TriggerWebhookFormProps {
  config: TriggerWebhookConfig
  onChange: (c: TriggerWebhookConfig) => void
}

export function TriggerWebhookForm({ config, onChange }: TriggerWebhookFormProps) {
  const [v, setV] = useState<TriggerWebhookConfig>({ method: ['POST'], auth_type: 'none', response_mode: 'immediate', ...config })

  function set<K extends keyof TriggerWebhookConfig>(key: K, val: TriggerWebhookConfig[K]) {
    const next = { ...v, [key]: val }
    setV(next)
    onChange(next)
  }

  return (
    <div className={s.section}>
      <div className={s.field}>
        <label className={s.label}>Autenticação</label>
        <select className={s.select} value={v.auth_type ?? 'none'} onChange={e => set('auth_type', e.target.value as TriggerWebhookConfig['auth_type'])}>
          <option value="none">Sem autenticação</option>
          <option value="api_key">API Key</option>
          <option value="hmac_sha256">HMAC SHA-256</option>
          <option value="bearer">Bearer Token</option>
        </select>
      </div>

      {v.auth_type !== 'none' && (
        <div className={s.field}>
          <label className={s.label}>Segredo / Token</label>
          <input type="password" className={s.input} value={v.secret ?? ''} onChange={e => set('secret', e.target.value)} placeholder="Chave secreta…" />
        </div>
      )}

      <div className={s.field}>
        <label className={s.label}>Modo de resposta</label>
        <select className={s.select} value={v.response_mode ?? 'immediate'} onChange={e => set('response_mode', e.target.value as TriggerWebhookConfig['response_mode'])}>
          <option value="immediate">Imediato (202 Accepted)</option>
          <option value="wait_for_completion">Aguardar execução</option>
        </select>
      </div>

      {v.response_mode === 'wait_for_completion' && (
        <div className={s.field}>
          <label className={s.label}>Timeout (ms)</label>
          <input type="number" className={s.input} value={v.timeout_ms ?? 10000} min={1000} max={30000} onChange={e => set('timeout_ms', Number(e.target.value))} />
        </div>
      )}

      <div className={s.infoBadge}>
        ℹ A URL do webhook será gerada após salvar o fluxo.
      </div>
    </div>
  )
}

// ─── trigger.manual ────────────────────────────────────────────────────────

export function TriggerManualForm({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const [desc, setDesc] = useState(String(config.description ?? ''))
  return (
    <div className={s.section}>
      <div className={s.field}>
        <label className={s.label}>Descrição (opcional)</label>
        <input className={s.input} value={desc} onChange={e => setDesc(e.target.value)} onBlur={() => onChange({ description: desc })} placeholder="Ex: Campanha de Black Friday" />
      </div>
      <div className={s.infoBadge}>ℹ Disparado manualmente pelo dashboard ou via API.</div>
    </div>
  )
}

// ─── trigger.audience ──────────────────────────────────────────────────────

export function TriggerAudienceForm({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const [freq, setFreq] = useState(String(config.evaluation_frequency ?? 'daily'))
  const [policy, setPolicy] = useState(String(config.re_entry_policy ?? 'never'))

  function save() {
    onChange({ ...config, evaluation_frequency: freq, re_entry_policy: policy })
  }

  return (
    <div className={s.section}>
      <div className={s.field}>
        <label className={s.label}>Frequência de avaliação</label>
        <select className={s.select} value={freq} onChange={e => { setFreq(e.target.value); save() }}>
          <option value="realtime">Tempo real</option>
          <option value="hourly">A cada hora</option>
          <option value="daily">Diariamente</option>
        </select>
      </div>
      <div className={s.field}>
        <label className={s.label}>Reentrada no fluxo</label>
        <select className={s.select} value={policy} onChange={e => { setPolicy(e.target.value); save() }}>
          <option value="never">Nunca</option>
          <option value="after_completion">Após conclusão</option>
          <option value="after_x_days">Após X dias</option>
        </select>
      </div>
    </div>
  )
}
