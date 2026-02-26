'use client'

import { useCallback, useState } from 'react'
import { useReactFlow } from '@xyflow/react'
import type { NodeType } from '@/lib/flow/types'
import s from './forms.module.scss'

// Triggers
import {
  TriggerEventForm,
  TriggerScheduleForm,
  TriggerWebhookForm,
  TriggerManualForm,
  TriggerAudienceForm,
} from './TriggerForms'

// Actions
import {
  SendEmailForm,
  SendWhatsAppForm,
  SendSmsForm,
  SendChatForm,
  ContactTagForm,
  ScoreUpdateForm,
} from './ActionForms'

// Conditions
import {
  ConditionIfElseForm,
  ConditionSwitchForm,
  ConditionWaitForm,
} from './ConditionForms'

// Delays
import {
  DelayFixedForm,
  DelayUntilTimeForm,
  DelayUntilDateForm,
  DelayUntilDayForm,
  DelaySmartSendForm,
  DelayBusinessHoursForm,
  DelayRandomForm,
} from './DelayForms'

// Loops
import {
  LoopForEachForm,
  LoopWhileForm,
  LoopRepeatForm,
  LoopRetryForm,
} from './LoopForms'

// API
import {
  HttpRequestForm,
  ScriptForm,
} from './ApiForms'

// ─── Generic fallback forms ────────────────────────────────────────────────

function SimpleTextField({ config, onChange, label, field, placeholder }: {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
  label: string
  field: string
  placeholder?: string
}) {
  const [val, setVal] = useState(String(config[field] ?? ''))
  return (
    <div className={s.section}>
      <div className={s.field}>
        <label className={s.label}>{label}</label>
        <input
          className={s.input}
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={() => onChange({ ...config, [field]: val })}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}

function ContactUpdateForm({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const [pairs, setPairs] = useState<{ key: string; value: string }[]>(() => {
    const fm = config.field_mapping as Record<string, unknown> | undefined
    return fm ? Object.entries(fm).map(([k, v]) => ({ key: k, value: String(v) })) : []
  })
  const [merge, setMerge] = useState(String(config.merge_strategy ?? 'overwrite'))

  function emitPairs(p: { key: string; value: string }[], m = merge) {
    const field_mapping = Object.fromEntries(p.map(({ key, value }) => [key, value]))
    onChange({ ...config, field_mapping, merge_strategy: m })
  }

  function addRow() { const next = [...pairs, { key: '', value: '' }]; setPairs(next); emitPairs(next) }
  function removeRow(i: number) { const next = pairs.filter((_, idx) => idx !== i); setPairs(next); emitPairs(next) }
  function updateRow(i: number, partial: Partial<{ key: string; value: string }>) {
    const next = pairs.map((p, idx) => idx === i ? { ...p, ...partial } : p)
    setPairs(next); emitPairs(next)
  }

  return (
    <div className={s.section}>
      <div className={s.field}>
        <label className={s.label}>Campos a atualizar</label>
        <div className={s.kvList}>
          {pairs.map((p, i) => (
            <div key={i} className={s.kvRow}>
              <input className={s.kvInput} placeholder="Campo" value={p.key} onChange={e => updateRow(i, { key: e.target.value })} />
              <input className={s.kvInput} placeholder="Valor" value={p.value} onChange={e => updateRow(i, { value: e.target.value })} />
              <button className={s.removeBtn} onClick={() => removeRow(i)}>×</button>
            </div>
          ))}
          <button className={s.addBtn} onClick={addRow}>+ Adicionar campo</button>
        </div>
      </div>
      <div className={s.field}>
        <label className={s.label}>Estratégia de merge</label>
        <select className={s.select} value={merge} onChange={e => { setMerge(e.target.value); emitPairs(pairs, e.target.value) }}>
          <option value="overwrite">Sobrescrever</option>
          <option value="append">Acrescentar</option>
          <option value="if_empty">Só se vazio</option>
        </select>
      </div>
    </div>
  )
}

function AbSplitForm({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const [variants, setVariants] = useState<{ name: string; weight: number }[]>(() => {
    const v = config.variants as Array<{ name: string; weight: number }> | undefined
    return v ?? [{ name: 'Variante A', weight: 50 }, { name: 'Variante B', weight: 50 }]
  })

  function emit(v: { name: string; weight: number }[]) {
    onChange({ ...config, variants: v })
  }

  function addVariant() {
    const next = [...variants, { name: `Variante ${String.fromCharCode(65 + variants.length)}`, weight: 0 }]
    setVariants(next); emit(next)
  }

  function removeVariant(i: number) {
    const next = variants.filter((_, idx) => idx !== i); setVariants(next); emit(next)
  }

  function updateVariant(i: number, partial: Partial<{ name: string; weight: number }>) {
    const next = variants.map((v, idx) => idx === i ? { ...v, ...partial } : v)
    setVariants(next); emit(next)
  }

  const total = variants.reduce((sum, v) => sum + v.weight, 0)

  return (
    <div className={s.section}>
      <label className={s.label}>Variantes A/B</label>
      <div className={s.variantList}>
        {variants.map((v, i) => (
          <div key={i} className={s.variantRow}>
            <div className={s.variantHeader}>
              <span>{v.name}</span>
              <button className={s.removeBtn} onClick={() => removeVariant(i)}>×</button>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <input className={s.input} placeholder="Nome" value={v.name} onChange={e => updateVariant(i, { name: e.target.value })} />
              <input type="number" className={s.input} style={{ width: 70 }} min={0} max={100} value={v.weight} onChange={e => updateVariant(i, { weight: Number(e.target.value) })} />
              <span style={{ alignSelf: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>%</span>
            </div>
          </div>
        ))}
      </div>
      <button className={s.addBtn} onClick={addVariant}>+ Adicionar variante</button>
      {total !== 100 && (
        <p className={s.hint} style={{ color: '#DC2626' }}>⚠ Total deve ser 100%. Atual: {total}%</p>
      )}
    </div>
  )
}

// ─── Dispatcher principal ──────────────────────────────────────────────────

interface NodeConfigFormProps {
  nodeId: string
  nodeType: NodeType
}

export default function NodeConfigForm({ nodeId, nodeType }: NodeConfigFormProps) {
  const { getNode, setNodes } = useReactFlow()
  const [saved, setSaved] = useState(false)

  const node = getNode(nodeId)
  const data = node?.data as Record<string, unknown> | undefined
  const config = (data?.config ?? {}) as Record<string, unknown>

  const handleChange = useCallback((newConfig: Record<string, unknown>) => {
    setNodes(nodes =>
      nodes.map(n =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, config: newConfig } }
          : n
      )
    )
    setSaved(false)
  }, [nodeId, setNodes])

  function handleSave() {
    // TODO: trigger auto-save / Server Action
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const form = renderForm(nodeType, config, handleChange)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {form}
      </div>
      <div className={s.saveSection}>
        <button className={s.saveBtn} onClick={handleSave}>
          {saved ? '✓ Salvo' : 'Salvar configuração'}
        </button>
      </div>
    </div>
  )
}

// ─── Roteamento de formulários ─────────────────────────────────────────────

function renderForm(
  type: NodeType,
  config: Record<string, unknown>,
  onChange: (c: Record<string, unknown>) => void
): React.ReactNode {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = config as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const on = onChange as (c: any) => void

  switch (type) {
    // Triggers
    case 'trigger.event':    return <TriggerEventForm config={c} onChange={on} />
    case 'trigger.schedule': return <TriggerScheduleForm config={c} onChange={on} />
    case 'trigger.webhook':  return <TriggerWebhookForm config={c} onChange={on} />
    case 'trigger.manual':   return <TriggerManualForm config={c} onChange={on} />
    case 'trigger.audience': return <TriggerAudienceForm config={c} onChange={on} />

    // Actions — Mensageria
    case 'action.send_email':    return <SendEmailForm config={c} onChange={on} />
    case 'action.send_whatsapp': return <SendWhatsAppForm config={c} onChange={on} />
    case 'action.send_sms':      return <SendSmsForm config={c} onChange={on} />
    case 'action.send_chat':     return <SendChatForm config={c} onChange={on} />

    // Actions — CRM
    case 'action.contact_update':
    case 'action.contact_create':
      return <ContactUpdateForm config={c} onChange={on} />
    case 'action.contact_tag_add':
    case 'action.contact_tag_remove':
      return <ContactTagForm config={c} onChange={on} />
    case 'action.score_update': return <ScoreUpdateForm config={c} onChange={on} />
    case 'action.contact_add_to_list':
    case 'action.contact_remove_from_list':
      return (
        <SimpleTextField
          config={c} onChange={on}
          label="ID da lista" field="list_id" placeholder="list_abc123"
        />
      )
    case 'action.contact_delete':
      return (
        <SimpleTextField
          config={c} onChange={on}
          label="Motivo (opcional)" field="reason" placeholder="Ex: contato inativo"
        />
      )
    case 'action.note_create':
      return (
        <div className={s.section}>
          <div className={s.field}>
            <label className={s.label}>Conteúdo da nota</label>
            <textarea
              className={s.textarea}
              value={String(c.body ?? '')}
              onChange={e => on({ ...c, body: e.target.value })}
              rows={4}
              placeholder="Texto da nota…"
            />
          </div>
        </div>
      )
    case 'action.deal_create':
      return (
        <div className={s.section}>
          <div className={s.fieldRow}>
            <div className={s.field}>
              <label className={s.label}>Pipeline ID</label>
              <input className={s.input} value={String(c.pipeline_id ?? '')} onChange={e => on({ ...c, pipeline_id: e.target.value })} placeholder="pipe_xxx" />
            </div>
            <div className={s.field}>
              <label className={s.label}>Estágio ID</label>
              <input className={s.input} value={String(c.stage_id ?? '')} onChange={e => on({ ...c, stage_id: e.target.value })} placeholder="stage_xxx" />
            </div>
          </div>
          <div className={s.fieldRow}>
            <div className={s.field}>
              <label className={s.label}>Valor (R$)</label>
              <input type="number" className={s.input} value={Number(c.value ?? 0)} onChange={e => on({ ...c, value: Number(e.target.value) })} />
            </div>
            <div className={s.field}>
              <label className={s.label}>Responsável</label>
              <input className={s.input} value={String(c.owner ?? '')} onChange={e => on({ ...c, owner: e.target.value })} placeholder="ID do usuário" />
            </div>
          </div>
        </div>
      )
    case 'action.flow_start':
    case 'action.flow_stop':
    case 'action.flow_pause':
      return (
        <SimpleTextField
          config={c} onChange={on}
          label="ID do fluxo" field="flow_id" placeholder="flow_abc123 ou 'current'"
        />
      )
    case 'action.ab_split':
    case 'control.ab_split':
      return <AbSplitForm config={c} onChange={on} />

    // Actions — API
    case 'action.http_request':
    case 'action.webhook_out':
      return <HttpRequestForm config={c} onChange={on} />
    case 'action.script':
      return <ScriptForm config={c} onChange={on} />

    // Conditions
    case 'condition.if_else': return <ConditionIfElseForm config={c} onChange={on} />
    case 'condition.switch':  return <ConditionSwitchForm config={c} onChange={on} />
    case 'condition.wait':    return <ConditionWaitForm config={c} onChange={on} />

    // Delays
    case 'delay.fixed':          return <DelayFixedForm config={c} onChange={on} />
    case 'delay.until_time':     return <DelayUntilTimeForm config={c} onChange={on} />
    case 'delay.until_date':     return <DelayUntilDateForm config={c} onChange={on} />
    case 'delay.until_day':      return <DelayUntilDayForm config={c} onChange={on} />
    case 'delay.smart_send':     return <DelaySmartSendForm config={c} onChange={on} />
    case 'delay.business_hours': return <DelayBusinessHoursForm config={c} onChange={on} />
    case 'delay.random':         return <DelayRandomForm config={c} onChange={on} />

    // Loops
    case 'loop.for_each': return <LoopForEachForm config={c} onChange={on} />
    case 'loop.while':    return <LoopWhileForm config={c} onChange={on} />
    case 'loop.repeat':   return <LoopRepeatForm config={c} onChange={on} />
    case 'loop.retry':    return <LoopRetryForm config={c} onChange={on} />

    // Control
    case 'control.goto':
      return (
        <SimpleTextField
          config={c} onChange={on}
          label="Nó de destino" field="target_node" placeholder="ID do nó"
        />
      )
    case 'control.exit':
      return (
        <div className={s.section}>
          <div className={s.field}>
            <label className={s.label}>Status de saída</label>
            <select className={s.select} value={String(c.status ?? 'completed')} onChange={e => on({ ...c, status: e.target.value })}>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
              <option value="goal_reached">Meta atingida</option>
            </select>
          </div>
          <div className={s.field}>
            <label className={s.label}>Motivo (opcional)</label>
            <input className={s.input} value={String(c.reason ?? '')} onChange={e => on({ ...c, reason: e.target.value })} placeholder="Ex: descadastrado" />
          </div>
        </div>
      )

    default:
      return (
        <div className={s.section}>
          <div className={s.infoBadge}>
            ℹ Nenhum formulário configurado para este tipo de nó.
          </div>
          <div className={s.field}>
            <label className={s.label}>Configuração (JSON)</label>
            <textarea
              className={s.codeTextarea}
              value={JSON.stringify(c, null, 2)}
              onChange={e => {
                try { onChange(JSON.parse(e.target.value)) } catch { /* ignore */ }
              }}
              rows={8}
            />
          </div>
        </div>
      )
  }
}
