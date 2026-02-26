'use client'

import { useState } from 'react'
import s from './forms.module.scss'

// ─── Key-Value editor ─────────────────────────────────────────────────────

interface KVPair { key: string; value: string }

function KVEditor({ label, pairs, onChange }: { label: string; pairs: KVPair[]; onChange: (p: KVPair[]) => void }) {
  function addRow() { onChange([...pairs, { key: '', value: '' }]) }
  function removeRow(i: number) { onChange(pairs.filter((_, idx) => idx !== i)) }
  function updateRow(i: number, partial: Partial<KVPair>) {
    onChange(pairs.map((p, idx) => idx === i ? { ...p, ...partial } : p))
  }

  return (
    <div className={s.field}>
      <label className={s.label}>{label}</label>
      <div className={s.kvList}>
        {pairs.map((p, i) => (
          <div key={i} className={s.kvRow}>
            <input className={s.kvInput} placeholder="Chave" value={p.key} onChange={e => updateRow(i, { key: e.target.value })} />
            <input className={s.kvInput} placeholder="Valor" value={p.value} onChange={e => updateRow(i, { value: e.target.value })} />
            <button className={s.removeBtn} onClick={() => removeRow(i)}>×</button>
          </div>
        ))}
        <button className={s.addBtn} onClick={addRow}>+ Adicionar</button>
      </div>
    </div>
  )
}

// ─── action.http_request ──────────────────────────────────────────────────

interface HttpConfig {
  url?: string
  method?: string
  auth_type?: string
  auth_token?: string
  auth_username?: string
  auth_password?: string
  auth_key?: string
  timeout_ms?: number
  on_error?: string
  headers?: KVPair[]
  response_mapping?: KVPair[]
}

export function HttpRequestForm({ config, onChange }: { config: HttpConfig; onChange: (c: HttpConfig) => void }) {
  const [v, setV] = useState<HttpConfig>({
    method: 'POST',
    auth_type: 'none',
    timeout_ms: 10000,
    on_error: 'fail',
    headers: [],
    response_mapping: [],
    ...config,
  })

  function set<K extends keyof HttpConfig>(key: K, val: HttpConfig[K]) {
    const next = { ...v, [key]: val }
    setV(next)
    onChange(next)
  }

  return (
    <>
      <div className={s.section}>
        <div className={s.field}>
          <label className={s.label}>URL</label>
          <input
            className={s.input}
            value={v.url ?? ''}
            onChange={e => set('url', e.target.value)}
            placeholder="https://api.exemplo.com/endpoint"
          />
        </div>
        <div className={s.fieldRow}>
          <div className={s.field}>
            <label className={s.label}>Método</label>
            <select className={s.select} value={v.method ?? 'POST'} onChange={e => set('method', e.target.value)}>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div className={s.field}>
            <label className={s.label}>Timeout (ms)</label>
            <input type="number" className={s.input} min={1000} max={30000} step={1000} value={v.timeout_ms ?? 10000} onChange={e => set('timeout_ms', Number(e.target.value))} />
          </div>
        </div>
      </div>

      <div className={s.section}>
        <div className={s.field}>
          <label className={s.label}>Autenticação</label>
          <select className={s.select} value={v.auth_type ?? 'none'} onChange={e => set('auth_type', e.target.value)}>
            <option value="none">Sem autenticação</option>
            <option value="bearer">Bearer Token</option>
            <option value="basic">Basic Auth</option>
            <option value="api_key">API Key (header)</option>
          </select>
        </div>

        {v.auth_type === 'bearer' && (
          <div className={s.field}>
            <label className={s.label}>Token</label>
            <input type="password" className={s.input} value={v.auth_token ?? ''} onChange={e => set('auth_token', e.target.value)} placeholder="Bearer token…" />
          </div>
        )}

        {v.auth_type === 'basic' && (
          <div className={s.fieldRow}>
            <div className={s.field}>
              <label className={s.label}>Usuário</label>
              <input className={s.input} value={v.auth_username ?? ''} onChange={e => set('auth_username', e.target.value)} />
            </div>
            <div className={s.field}>
              <label className={s.label}>Senha</label>
              <input type="password" className={s.input} value={v.auth_password ?? ''} onChange={e => set('auth_password', e.target.value)} />
            </div>
          </div>
        )}

        {v.auth_type === 'api_key' && (
          <div className={s.field}>
            <label className={s.label}>API Key</label>
            <input type="password" className={s.input} value={v.auth_key ?? ''} onChange={e => set('auth_key', e.target.value)} placeholder="Chave da API" />
          </div>
        )}
      </div>

      <div className={s.section}>
        <KVEditor label="Headers" pairs={v.headers ?? []} onChange={p => set('headers', p)} />
      </div>

      <div className={s.section}>
        <KVEditor label="Mapeamento de resposta (campo → variável)" pairs={v.response_mapping ?? []} onChange={p => set('response_mapping', p)} />
        <p className={s.hint}>Ex: chave <code>data.id</code> → variável <code>deal_id</code></p>
      </div>

      <div className={s.section}>
        <div className={s.field}>
          <label className={s.label}>Ao falhar</label>
          <select className={s.select} value={v.on_error ?? 'fail'} onChange={e => set('on_error', e.target.value)}>
            <option value="fail">Falhar o fluxo</option>
            <option value="continue">Continuar (ignorar erro)</option>
          </select>
        </div>
      </div>
    </>
  )
}

// ─── action.script ────────────────────────────────────────────────────────

interface ScriptConfig {
  code?: string
  timeout_ms?: number
  allowed_modules?: string
}

export function ScriptForm({ config, onChange }: { config: ScriptConfig; onChange: (c: ScriptConfig) => void }) {
  const [v, setV] = useState<ScriptConfig>({ code: '', timeout_ms: 5000, allowed_modules: '', ...config })

  function set<K extends keyof ScriptConfig>(key: K, val: ScriptConfig[K]) {
    const next = { ...v, [key]: val }
    setV(next)
    onChange(next)
  }

  return (
    <>
      <div className={s.section}>
        <div className={s.field}>
          <label className={s.label}>Código JavaScript</label>
          <textarea
            className={s.codeTextarea}
            value={v.code ?? ''}
            onChange={e => set('code', e.target.value)}
            rows={12}
            spellCheck={false}
            placeholder={`// context.contact → dados do contato\n// context.flow → variáveis do fluxo\n// return { result: 'valor' }`}
          />
        </div>
      </div>
      <div className={s.section}>
        <div className={s.fieldRow}>
          <div className={s.field}>
            <label className={s.label}>Timeout (ms)</label>
            <input type="number" className={s.input} min={100} max={30000} value={v.timeout_ms ?? 5000} onChange={e => set('timeout_ms', Number(e.target.value))} />
          </div>
          <div className={s.field}>
            <label className={s.label}>Módulos permitidos</label>
            <input className={s.input} value={v.allowed_modules ?? ''} onChange={e => set('allowed_modules', e.target.value)} placeholder="lodash, dayjs…" />
          </div>
        </div>
        <div className={s.infoBadge}>
          ℹ O script tem acesso ao <strong>context</strong> e deve retornar um objeto. O retorno será mesclado às variáveis do fluxo.
        </div>
      </div>
    </>
  )
}

// ─── action.webhook_out ───────────────────────────────────────────────────

export function WebhookOutForm({ config, onChange }: { config: HttpConfig; onChange: (c: HttpConfig) => void }) {
  // Reutiliza o mesmo form do HTTP Request
  return <HttpRequestForm config={config} onChange={onChange} />
}
