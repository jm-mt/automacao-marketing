'use client'

import { useState } from 'react'
import s from './forms.module.scss'

// ─── delay.fixed ──────────────────────────────────────────────────────────

interface DelayFixedConfig {
  duration?: number
  unit?: string
  respect_business_hours?: boolean
}

export function DelayFixedForm({ config, onChange }: { config: DelayFixedConfig; onChange: (c: DelayFixedConfig) => void }) {
  const [v, setV] = useState<DelayFixedConfig>({ duration: 1, unit: 'hours', respect_business_hours: false, ...config })

  function set<K extends keyof DelayFixedConfig>(key: K, val: DelayFixedConfig[K]) {
    const next = { ...v, [key]: val }
    setV(next)
    onChange(next)
  }

  return (
    <div className={s.section}>
      <div className={s.fieldRow}>
        <div className={s.field}>
          <label className={s.label}>Duração</label>
          <input
            type="number"
            className={s.input}
            min={1}
            value={v.duration ?? 1}
            onChange={e => set('duration', Number(e.target.value))}
          />
        </div>
        <div className={s.field}>
          <label className={s.label}>Unidade</label>
          <select className={s.select} value={v.unit ?? 'hours'} onChange={e => set('unit', e.target.value)}>
            <option value="minutes">Minutos</option>
            <option value="hours">Horas</option>
            <option value="days">Dias</option>
            <option value="weeks">Semanas</option>
          </select>
        </div>
      </div>
      <label className={s.checkRow}>
        <input
          type="checkbox"
          className={s.checkbox}
          checked={v.respect_business_hours ?? false}
          onChange={e => set('respect_business_hours', e.target.checked)}
        />
        <span className={s.checkLabel}>Respeitar horário comercial</span>
      </label>
    </div>
  )
}

// ─── delay.until_time ─────────────────────────────────────────────────────

interface DelayUntilTimeConfig {
  time?: string
  timezone?: string
}

export function DelayUntilTimeForm({ config, onChange }: { config: DelayUntilTimeConfig; onChange: (c: DelayUntilTimeConfig) => void }) {
  const [v, setV] = useState<DelayUntilTimeConfig>({ time: '09:00', timezone: 'contact', ...config })

  function set<K extends keyof DelayUntilTimeConfig>(key: K, val: DelayUntilTimeConfig[K]) {
    const next = { ...v, [key]: val }
    setV(next)
    onChange(next)
  }

  return (
    <div className={s.section}>
      <div className={s.field}>
        <label className={s.label}>Horário</label>
        <input type="time" className={s.input} value={v.time ?? '09:00'} onChange={e => set('time', e.target.value)} />
      </div>
      <div className={s.field}>
        <label className={s.label}>Fuso horário</label>
        <select className={s.select} value={v.timezone ?? 'contact'} onChange={e => set('timezone', e.target.value)}>
          <option value="contact">Do contato</option>
          <option value="America/Sao_Paulo">América/São Paulo</option>
          <option value="UTC">UTC</option>
          <option value="America/New_York">América/Nova York</option>
        </select>
        <p className={s.hint}>O fluxo aguarda até que esse horário chegue no dia atual do contato.</p>
      </div>
    </div>
  )
}

// ─── delay.until_date ─────────────────────────────────────────────────────

interface DelayUntilDateConfig {
  datetime?: string
  timezone?: string
}

export function DelayUntilDateForm({ config, onChange }: { config: DelayUntilDateConfig; onChange: (c: DelayUntilDateConfig) => void }) {
  const [v, setV] = useState<DelayUntilDateConfig>({ timezone: 'America/Sao_Paulo', ...config })

  function set<K extends keyof DelayUntilDateConfig>(key: K, val: DelayUntilDateConfig[K]) {
    const next = { ...v, [key]: val }
    setV(next)
    onChange(next)
  }

  return (
    <div className={s.section}>
      <div className={s.field}>
        <label className={s.label}>Data e hora</label>
        <input type="datetime-local" className={s.input} value={v.datetime ?? ''} onChange={e => set('datetime', e.target.value)} />
      </div>
      <div className={s.field}>
        <label className={s.label}>Fuso horário</label>
        <select className={s.select} value={v.timezone ?? 'America/Sao_Paulo'} onChange={e => set('timezone', e.target.value)}>
          <option value="America/Sao_Paulo">América/São Paulo</option>
          <option value="UTC">UTC</option>
          <option value="America/New_York">América/Nova York</option>
        </select>
      </div>
    </div>
  )
}

// ─── delay.until_day ──────────────────────────────────────────────────────

interface DelayUntilDayConfig {
  day?: string
  time?: string
  timezone?: string
}

export function DelayUntilDayForm({ config, onChange }: { config: DelayUntilDayConfig; onChange: (c: DelayUntilDayConfig) => void }) {
  const [v, setV] = useState<DelayUntilDayConfig>({ day: 'monday', time: '09:00', timezone: 'America/Sao_Paulo', ...config })

  function set<K extends keyof DelayUntilDayConfig>(key: K, val: DelayUntilDayConfig[K]) {
    const next = { ...v, [key]: val }
    setV(next)
    onChange(next)
  }

  return (
    <div className={s.section}>
      <div className={s.field}>
        <label className={s.label}>Dia da semana</label>
        <select className={s.select} value={v.day ?? 'monday'} onChange={e => set('day', e.target.value)}>
          <option value="monday">Segunda-feira</option>
          <option value="tuesday">Terça-feira</option>
          <option value="wednesday">Quarta-feira</option>
          <option value="thursday">Quinta-feira</option>
          <option value="friday">Sexta-feira</option>
          <option value="saturday">Sábado</option>
          <option value="sunday">Domingo</option>
        </select>
      </div>
      <div className={s.fieldRow}>
        <div className={s.field}>
          <label className={s.label}>Horário</label>
          <input type="time" className={s.input} value={v.time ?? '09:00'} onChange={e => set('time', e.target.value)} />
        </div>
        <div className={s.field}>
          <label className={s.label}>Fuso horário</label>
          <select className={s.select} value={v.timezone ?? 'America/Sao_Paulo'} onChange={e => set('timezone', e.target.value)}>
            <option value="America/Sao_Paulo">América/São Paulo</option>
            <option value="UTC">UTC</option>
            <option value="contact">Do contato</option>
          </select>
        </div>
      </div>
    </div>
  )
}

// ─── delay.smart_send ─────────────────────────────────────────────────────

export function DelaySmartSendForm({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className={s.section}>
      <div className={s.infoBadge}>
        ℹ O envio inteligente utiliza o histórico de engajamento do contato para determinar o melhor horário de envio automaticamente.
      </div>
      <div className={s.field}>
        <label className={s.label}>Janela máxima de espera</label>
        <select
          className={s.select}
          value={String(config.max_window ?? '24h')}
          onChange={e => onChange({ ...config, max_window: e.target.value })}
        >
          <option value="6h">6 horas</option>
          <option value="12h">12 horas</option>
          <option value="24h">24 horas</option>
          <option value="48h">48 horas</option>
        </select>
      </div>
    </div>
  )
}

// ─── delay.business_hours ─────────────────────────────────────────────────

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface BusinessHoursConfig {
  timezone?: string
  start_time?: string
  end_time?: string
  days?: number[]
}

export function DelayBusinessHoursForm({ config, onChange }: { config: BusinessHoursConfig; onChange: (c: BusinessHoursConfig) => void }) {
  const [v, setV] = useState<BusinessHoursConfig>({
    timezone: 'America/Sao_Paulo',
    start_time: '09:00',
    end_time: '18:00',
    days: [1, 2, 3, 4, 5],
    ...config,
  })

  function set<K extends keyof BusinessHoursConfig>(key: K, val: BusinessHoursConfig[K]) {
    const next = { ...v, [key]: val }
    setV(next)
    onChange(next)
  }

  function toggleDay(d: number) {
    const days = v.days ?? [1, 2, 3, 4, 5]
    const next = days.includes(d) ? days.filter(x => x !== d) : [...days, d].sort()
    set('days', next)
  }

  return (
    <div className={s.section}>
      <div className={s.field}>
        <label className={s.label}>Dias úteis</label>
        <div style={{ display: 'flex', gap: 4 }}>
          {WEEKDAYS.map((label, d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              style={{
                flex: 1,
                padding: '5px 0',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
                background: (v.days ?? []).includes(d) ? 'var(--primary)' : 'var(--bg-surface)',
                color: (v.days ?? []).includes(d) ? '#fff' : 'var(--text-muted)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className={s.fieldRow}>
        <div className={s.field}>
          <label className={s.label}>Início</label>
          <input type="time" className={s.input} value={v.start_time ?? '09:00'} onChange={e => set('start_time', e.target.value)} />
        </div>
        <div className={s.field}>
          <label className={s.label}>Fim</label>
          <input type="time" className={s.input} value={v.end_time ?? '18:00'} onChange={e => set('end_time', e.target.value)} />
        </div>
      </div>
      <div className={s.field}>
        <label className={s.label}>Fuso horário</label>
        <select className={s.select} value={v.timezone ?? 'America/Sao_Paulo'} onChange={e => set('timezone', e.target.value)}>
          <option value="America/Sao_Paulo">América/São Paulo</option>
          <option value="UTC">UTC</option>
          <option value="America/New_York">América/Nova York</option>
          <option value="Europe/London">Europa/Londres</option>
        </select>
      </div>
      <p className={s.hint}>O fluxo só avança quando estiver dentro do horário comercial definido.</p>
    </div>
  )
}

// ─── delay.random ─────────────────────────────────────────────────────────

interface DelayRandomConfig {
  min_duration?: number
  max_duration?: number
  unit?: string
}

export function DelayRandomForm({ config, onChange }: { config: DelayRandomConfig; onChange: (c: DelayRandomConfig) => void }) {
  const [v, setV] = useState<DelayRandomConfig>({ min_duration: 1, max_duration: 5, unit: 'hours', ...config })

  function set<K extends keyof DelayRandomConfig>(key: K, val: DelayRandomConfig[K]) {
    const next = { ...v, [key]: val }
    setV(next)
    onChange(next)
  }

  return (
    <div className={s.section}>
      <div className={s.fieldRow}>
        <div className={s.field}>
          <label className={s.label}>Mínimo</label>
          <input type="number" className={s.input} min={0} value={v.min_duration ?? 1} onChange={e => set('min_duration', Number(e.target.value))} />
        </div>
        <div className={s.field}>
          <label className={s.label}>Máximo</label>
          <input type="number" className={s.input} min={1} value={v.max_duration ?? 5} onChange={e => set('max_duration', Number(e.target.value))} />
        </div>
        <div className={s.field}>
          <label className={s.label}>Unidade</label>
          <select className={s.select} value={v.unit ?? 'hours'} onChange={e => set('unit', e.target.value)}>
            <option value="minutes">Minutos</option>
            <option value="hours">Horas</option>
            <option value="days">Dias</option>
          </select>
        </div>
      </div>
      <p className={s.hint}>O delay será um valor aleatório entre mínimo e máximo.</p>
    </div>
  )
}
