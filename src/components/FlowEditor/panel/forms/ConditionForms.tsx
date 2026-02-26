'use client'

import { useState } from 'react'
import s from './forms.module.scss'
import type { ConditionRule, ComparisonOperator } from '@/lib/flow/types'

// ─── Operadores disponíveis ────────────────────────────────────────────────

const OPERATORS: { value: ComparisonOperator; label: string }[] = [
  { value: 'equals',         label: '= igual a' },
  { value: 'not_equals',     label: '≠ diferente de' },
  { value: 'contains',       label: '⊃ contém' },
  { value: 'not_contains',   label: '⊄ não contém' },
  { value: 'starts_with',    label: '⌃ começa com' },
  { value: 'ends_with',      label: '⌄ termina com' },
  { value: 'greater_than',   label: '> maior que' },
  { value: 'less_than',      label: '< menor que' },
  { value: 'is_empty',       label: '∅ está vazio' },
  { value: 'is_not_empty',   label: '∃ está preenchido' },
  { value: 'has_tag',        label: '🏷 tem tag' },
  { value: 'in_segment',     label: '👥 está no segmento' },
  { value: 'matches_regex',  label: '∼ regex' },
]

// Operadores que não precisam de valor
const NO_VALUE_OPS: ComparisonOperator[] = ['is_empty', 'is_not_empty']

// ─── RuleBuilder ──────────────────────────────────────────────────────────

interface RuleBuilderProps {
  conditions: ConditionRule[]
  logic: 'AND' | 'OR'
  onChangeLogic: (logic: 'AND' | 'OR') => void
  onChangeConditions: (conditions: ConditionRule[]) => void
}

export function RuleBuilder({ conditions, logic, onChangeLogic, onChangeConditions }: RuleBuilderProps) {
  function addRule() {
    onChangeConditions([...conditions, { field: '', operator: 'equals', value: '' }])
  }

  function removeRule(i: number) {
    onChangeConditions(conditions.filter((_, idx) => idx !== i))
  }

  function updateRule(i: number, partial: Partial<ConditionRule>) {
    onChangeConditions(conditions.map((r, idx) => idx === i ? { ...r, ...partial } : r))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Logic toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className={s.logicToggle}>
          <button className={`${s.logicBtn} ${logic === 'AND' ? s.active : ''}`} onClick={() => onChangeLogic('AND')}>AND</button>
          <button className={`${s.logicBtn} ${logic === 'OR'  ? s.active : ''}`} onClick={() => onChangeLogic('OR')}>OR</button>
        </div>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {logic === 'AND' ? 'todas as condições' : 'qualquer condição'}
        </span>
      </div>

      {/* Rules */}
      {conditions.map((rule, i) => (
        <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <input
              className={s.input}
              placeholder="Campo (ex: contact.email)"
              value={rule.field}
              onChange={e => updateRule(i, { field: e.target.value })}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              <select
                className={s.select}
                style={{ flex: 1 }}
                value={rule.operator}
                onChange={e => updateRule(i, { operator: e.target.value as ComparisonOperator })}
              >
                {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
              </select>
              {!NO_VALUE_OPS.includes(rule.operator) && (
                <input
                  className={s.input}
                  style={{ flex: 1 }}
                  placeholder="Valor"
                  value={String(rule.value ?? '')}
                  onChange={e => updateRule(i, { value: e.target.value })}
                />
              )}
            </div>
          </div>
          <button className={s.removeBtn} onClick={() => removeRule(i)}>×</button>
        </div>
      ))}

      <button className={s.addBtn} onClick={addRule}>+ Adicionar condição</button>
    </div>
  )
}

// ─── condition.if_else ────────────────────────────────────────────────────

interface IfElseConfig {
  name?: string
  rules?: { logic?: 'AND' | 'OR'; conditions?: ConditionRule[] }
}

export function ConditionIfElseForm({ config, onChange }: { config: IfElseConfig; onChange: (c: IfElseConfig) => void }) {
  const [name, setName]       = useState(config.name ?? '')
  const [logic, setLogic]     = useState<'AND' | 'OR'>(config.rules?.logic ?? 'AND')
  const [conditions, setConds] = useState<ConditionRule[]>(config.rules?.conditions ?? [])

  function emit(updates: Partial<{ name: string; logic: 'AND' | 'OR'; conditions: ConditionRule[] }>) {
    const next: IfElseConfig = {
      name: updates.name ?? name,
      rules: { logic: updates.logic ?? logic, conditions: updates.conditions ?? conditions },
    }
    onChange(next)
  }

  return (
    <>
      <div className={s.section}>
        <div className={s.field}>
          <label className={s.label}>Nome da condição</label>
          <input
            className={s.input}
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => emit({ name })}
            placeholder="Ex: É cliente VIP?"
          />
        </div>
      </div>

      <div className={s.section}>
        <label className={s.label}>Regras</label>
        <RuleBuilder
          conditions={conditions}
          logic={logic}
          onChangeLogic={l => { setLogic(l); emit({ logic: l }) }}
          onChangeConditions={c => { setConds(c); emit({ conditions: c }) }}
        />
      </div>

      <div className={s.section}>
        <div className={s.infoBadge}>
          ℹ Conecte o handle <strong>Sim</strong> (verde) e <strong>Não</strong> (vermelho) no canvas.
        </div>
      </div>
    </>
  )
}

// ─── condition.switch ─────────────────────────────────────────────────────

interface SwitchCase { name: string; operator: string; value: string; target: string }
interface SwitchConfig { field?: string; cases?: SwitchCase[]; default?: string }

export function ConditionSwitchForm({ config, onChange }: { config: SwitchConfig; onChange: (c: SwitchConfig) => void }) {
  const [field, setField] = useState(config.field ?? '')
  const [cases, setCases] = useState<SwitchCase[]>(config.cases ?? [])
  const [def, setDef]     = useState(config.default ?? '')

  function emit(updates: Partial<SwitchConfig>) {
    onChange({ field: field, cases, default: def, ...updates })
  }

  function addCase() {
    const next = [...cases, { name: `Case ${cases.length + 1}`, operator: 'equals', value: '', target: '' }]
    setCases(next); emit({ cases: next })
  }

  function updateCase(i: number, partial: Partial<SwitchCase>) {
    const next = cases.map((c, idx) => idx === i ? { ...c, ...partial } : c)
    setCases(next); emit({ cases: next })
  }

  function removeCase(i: number) {
    const next = cases.filter((_, idx) => idx !== i)
    setCases(next); emit({ cases: next })
  }

  return (
    <>
      <div className={s.section}>
        <div className={s.field}>
          <label className={s.label}>Campo avaliado</label>
          <input
            className={s.input}
            value={field}
            onChange={e => setField(e.target.value)}
            onBlur={() => emit({ field })}
            placeholder="contact.lifecycle_stage"
          />
        </div>
      </div>

      <div className={s.section}>
        <label className={s.label}>Cases</label>
        <div className={s.variantList}>
          {cases.map((c, i) => (
            <div key={i} className={s.variantRow}>
              <div className={s.variantHeader}>
                <span>Case {i + 1}</span>
                <button className={s.removeBtn} onClick={() => removeCase(i)}>×</button>
              </div>
              <input className={s.input} placeholder="Nome" value={c.name} onChange={e => updateCase(i, { name: e.target.value })} />
              <div style={{ display: 'flex', gap: 4 }}>
                <select className={s.select} value={c.operator} onChange={e => updateCase(i, { operator: e.target.value })}>
                  {OPERATORS.slice(0, 5).map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                </select>
                <input className={s.input} placeholder="Valor" value={c.value} onChange={e => updateCase(i, { value: e.target.value })} />
              </div>
            </div>
          ))}
          <button className={s.addBtn} onClick={addCase}>+ Adicionar case</button>
        </div>
      </div>

      <div className={s.section}>
        <div className={s.field}>
          <label className={s.label}>Node padrão (default)</label>
          <input className={s.input} value={def} onChange={e => setDef(e.target.value)} onBlur={() => emit({ default: def })} placeholder="ID do nó de fallback" />
        </div>
      </div>
    </>
  )
}

// ─── condition.wait ───────────────────────────────────────────────────────

interface WaitConfig {
  name?: string
  wait_for?: string
  event_type?: string
  field?: string
  expected_value?: string
  check_interval?: string
  signal_key?: string
  timeout?: string
}

export function ConditionWaitForm({ config, onChange }: { config: WaitConfig; onChange: (c: WaitConfig) => void }) {
  const [v, setV] = useState<WaitConfig>({ wait_for: 'event', timeout: '24h', ...config })

  function set<K extends keyof WaitConfig>(key: K, val: WaitConfig[K]) {
    const next = { ...v, [key]: val }
    setV(next)
    onChange(next)
  }

  return (
    <>
      <div className={s.section}>
        <div className={s.field}>
          <label className={s.label}>Nome</label>
          <input className={s.input} value={v.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="Ex: Aguardar resposta" />
        </div>
        <div className={s.field}>
          <label className={s.label}>Aguardar por</label>
          <select className={s.select} value={v.wait_for ?? 'event'} onChange={e => set('wait_for', e.target.value)}>
            <option value="event">Evento específico</option>
            <option value="response">Resposta do contato</option>
            <option value="field_change">Mudança em campo</option>
            <option value="external_signal">Sinal externo</option>
          </select>
        </div>
      </div>

      {v.wait_for === 'event' && (
        <div className={s.section}>
          <div className={s.field}>
            <label className={s.label}>Tipo de evento</label>
            <input className={s.input} value={v.event_type ?? ''} onChange={e => set('event_type', e.target.value)} placeholder="email.opened" />
          </div>
        </div>
      )}

      {v.wait_for === 'field_change' && (
        <div className={s.section}>
          <div className={s.field}>
            <label className={s.label}>Campo</label>
            <input className={s.input} value={v.field ?? ''} onChange={e => set('field', e.target.value)} placeholder="contact.payment_status" />
          </div>
          <div className={s.field}>
            <label className={s.label}>Valor esperado</label>
            <input className={s.input} value={v.expected_value ?? ''} onChange={e => set('expected_value', e.target.value)} placeholder="paid" />
          </div>
          <div className={s.field}>
            <label className={s.label}>Verificar a cada</label>
            <input className={s.input} value={v.check_interval ?? '5m'} onChange={e => set('check_interval', e.target.value)} placeholder="5m" />
          </div>
        </div>
      )}

      {v.wait_for === 'external_signal' && (
        <div className={s.section}>
          <div className={s.field}>
            <label className={s.label}>Chave do sinal</label>
            <input className={s.input} value={v.signal_key ?? ''} onChange={e => set('signal_key', e.target.value)} placeholder="{'manager_approval_{{contact.id}}'}" />
          </div>
        </div>
      )}

      <div className={s.section}>
        <div className={s.field}>
          <label className={s.label}>Timeout máximo</label>
          <input className={s.input} value={v.timeout ?? '24h'} onChange={e => set('timeout', e.target.value)} placeholder="24h, 7d, 30m…" />
          <p className={s.hint}>Após expirar, o fluxo segue pelo handle <strong>Timeout</strong>.</p>
        </div>
      </div>

      <div className={s.section}>
        <div className={s.infoBadge}>
          ℹ Conecte o handle <strong>Atendido</strong> (verde) e <strong>Timeout</strong> (âmbar) no canvas.
        </div>
      </div>
    </>
  )
}
