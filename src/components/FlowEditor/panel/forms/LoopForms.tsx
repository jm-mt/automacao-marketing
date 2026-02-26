'use client'

import { useState } from 'react'
import s from './forms.module.scss'

// ─── loop.for_each ────────────────────────────────────────────────────────

interface ForEachConfig {
  collection?: string
  item_variable?: string
  index_variable?: string
  parallel?: boolean
  max_concurrency?: number
  on_error?: string
}

export function LoopForEachForm({ config, onChange }: { config: ForEachConfig; onChange: (c: ForEachConfig) => void }) {
  const [v, setV] = useState<ForEachConfig>({
    collection: '',
    item_variable: 'item',
    index_variable: 'index',
    parallel: false,
    max_concurrency: 5,
    on_error: 'continue',
    ...config,
  })

  function set<K extends keyof ForEachConfig>(key: K, val: ForEachConfig[K]) {
    const next = { ...v, [key]: val }
    setV(next)
    onChange(next)
  }

  return (
    <>
      <div className={s.section}>
        <div className={s.field}>
          <label className={s.label}>Coleção</label>
          <input
            className={s.input}
            value={v.collection ?? ''}
            onChange={e => set('collection', e.target.value)}
            placeholder="{{contact.tags}} ou {{flow.items}}"
          />
          <p className={s.hint}>Variável que contém a lista a percorrer.</p>
        </div>
        <div className={s.fieldRow}>
          <div className={s.field}>
            <label className={s.label}>Var. do item</label>
            <input className={s.input} value={v.item_variable ?? 'item'} onChange={e => set('item_variable', e.target.value)} placeholder="item" />
          </div>
          <div className={s.field}>
            <label className={s.label}>Var. do índice</label>
            <input className={s.input} value={v.index_variable ?? 'index'} onChange={e => set('index_variable', e.target.value)} placeholder="index" />
          </div>
        </div>
      </div>

      <div className={s.section}>
        <label className={s.checkRow}>
          <input
            type="checkbox"
            className={s.checkbox}
            checked={v.parallel ?? false}
            onChange={e => set('parallel', e.target.checked)}
          />
          <span className={s.checkLabel}>Execução paralela</span>
        </label>
        {v.parallel && (
          <div className={s.field}>
            <label className={s.label}>Concorrência máxima</label>
            <input type="number" className={s.input} min={1} max={50} value={v.max_concurrency ?? 5} onChange={e => set('max_concurrency', Number(e.target.value))} />
          </div>
        )}
        <div className={s.field}>
          <label className={s.label}>Ao encontrar erro</label>
          <select className={s.select} value={v.on_error ?? 'continue'} onChange={e => set('on_error', e.target.value)}>
            <option value="continue">Continuar próximo item</option>
            <option value="fail">Falhar o loop inteiro</option>
          </select>
        </div>
      </div>
    </>
  )
}

// ─── loop.while ───────────────────────────────────────────────────────────

interface WhileConfig {
  field?: string
  operator?: string
  value?: string
  max_iterations?: number
  interval_between?: string
}

export function LoopWhileForm({ config, onChange }: { config: WhileConfig; onChange: (c: WhileConfig) => void }) {
  const [v, setV] = useState<WhileConfig>({
    field: '',
    operator: 'not_equals',
    value: '',
    max_iterations: 100,
    interval_between: '5m',
    ...config,
  })

  function set<K extends keyof WhileConfig>(key: K, val: WhileConfig[K]) {
    const next = { ...v, [key]: val }
    setV(next)
    onChange(next)
  }

  return (
    <>
      <div className={s.section}>
        <label className={s.label}>Condição de continuação</label>
        <div className={s.field}>
          <input className={s.input} value={v.field ?? ''} onChange={e => set('field', e.target.value)} placeholder="Campo (ex: contact.status)" />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <select className={s.select} style={{ flex: 1 }} value={v.operator ?? 'not_equals'} onChange={e => set('operator', e.target.value)}>
            <option value="equals">= igual a</option>
            <option value="not_equals">≠ diferente de</option>
            <option value="contains">⊃ contém</option>
            <option value="is_empty">∅ está vazio</option>
            <option value="is_not_empty">∃ está preenchido</option>
          </select>
          <input className={s.input} style={{ flex: 1 }} value={v.value ?? ''} onChange={e => set('value', e.target.value)} placeholder="Valor" />
        </div>
        <p className={s.hint}>O loop continua enquanto a condição for verdadeira.</p>
      </div>

      <div className={s.section}>
        <div className={s.fieldRow}>
          <div className={s.field}>
            <label className={s.label}>Máx. iterações</label>
            <input type="number" className={s.input} min={1} value={v.max_iterations ?? 100} onChange={e => set('max_iterations', Number(e.target.value))} />
          </div>
          <div className={s.field}>
            <label className={s.label}>Intervalo entre</label>
            <input className={s.input} value={v.interval_between ?? '5m'} onChange={e => set('interval_between', e.target.value)} placeholder="5m, 1h…" />
          </div>
        </div>
      </div>
    </>
  )
}

// ─── loop.repeat ──────────────────────────────────────────────────────────

interface RepeatConfig {
  count?: number
  interval?: string
}

export function LoopRepeatForm({ config, onChange }: { config: RepeatConfig; onChange: (c: RepeatConfig) => void }) {
  const [v, setV] = useState<RepeatConfig>({ count: 3, interval: '1d', ...config })

  function set<K extends keyof RepeatConfig>(key: K, val: RepeatConfig[K]) {
    const next = { ...v, [key]: val }
    setV(next)
    onChange(next)
  }

  return (
    <div className={s.section}>
      <div className={s.fieldRow}>
        <div className={s.field}>
          <label className={s.label}>Repetições</label>
          <input type="number" className={s.input} min={1} value={v.count ?? 3} onChange={e => set('count', Number(e.target.value))} />
        </div>
        <div className={s.field}>
          <label className={s.label}>Intervalo</label>
          <input className={s.input} value={v.interval ?? '1d'} onChange={e => set('interval', e.target.value)} placeholder="1d, 12h, 30m…" />
        </div>
      </div>
      <p className={s.hint}>O bloco interno será executado {v.count ?? 3}x com intervalo de {v.interval ?? '1d'} entre cada execução.</p>
    </div>
  )
}

// ─── loop.retry ───────────────────────────────────────────────────────────

interface RetryConfig {
  max_retries?: number
  backoff?: string
  base_delay?: string
}

export function LoopRetryForm({ config, onChange }: { config: RetryConfig; onChange: (c: RetryConfig) => void }) {
  const [v, setV] = useState<RetryConfig>({ max_retries: 3, backoff: 'exponential', base_delay: '30s', ...config })

  function set<K extends keyof RetryConfig>(key: K, val: RetryConfig[K]) {
    const next = { ...v, [key]: val }
    setV(next)
    onChange(next)
  }

  return (
    <div className={s.section}>
      <div className={s.field}>
        <label className={s.label}>Máx. tentativas</label>
        <input type="number" className={s.input} min={1} max={10} value={v.max_retries ?? 3} onChange={e => set('max_retries', Number(e.target.value))} />
      </div>
      <div className={s.fieldRow}>
        <div className={s.field}>
          <label className={s.label}>Estratégia</label>
          <select className={s.select} value={v.backoff ?? 'exponential'} onChange={e => set('backoff', e.target.value)}>
            <option value="fixed">Fixo</option>
            <option value="linear">Linear</option>
            <option value="exponential">Exponencial</option>
          </select>
        </div>
        <div className={s.field}>
          <label className={s.label}>Delay base</label>
          <input className={s.input} value={v.base_delay ?? '30s'} onChange={e => set('base_delay', e.target.value)} placeholder="30s, 1m…" />
        </div>
      </div>
      <p className={s.hint}>Em caso de falha no bloco interno, tenta novamente até {v.max_retries ?? 3}x.</p>
    </div>
  )
}
