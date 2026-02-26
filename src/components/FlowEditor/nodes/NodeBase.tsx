'use client'

import { Handle, Position, useReactFlow } from '@xyflow/react'
import { useFlowStore } from '@/hooks/useFlowStore'
import { NODE_META, CATEGORY_COLOR, CATEGORY_BG } from './nodeCategories'
import styles from './NodeBase.module.scss'

interface NodeBaseProps {
  id: string
  type: string
  selected: boolean
  data: {
    config: Record<string, unknown>
    label?: string
    error_handling?: Record<string, unknown>
  }
}

export default function NodeBase({ id, type, selected, data }: NodeBaseProps) {
  const meta = NODE_META[type]
  const selectNode = useFlowStore((s) => s.selectNode)
  const { deleteElements } = useReactFlow()

  if (!meta) {
    return (
      <div className={styles.node} style={{ borderLeftColor: '#ccc' }}>
        <span className={styles.label}>Nó desconhecido: {type}</span>
      </div>
    )
  }

  const color   = CATEGORY_COLOR[meta.category]
  const bgColor = CATEGORY_BG[meta.category]
  const handles = meta.sourceHandles ?? []
  const hasMultipleOutputs = handles.length >= 2

  // Snippet de config para exibir inline
  const configSnippet = getConfigSnippet(type, data.config)

  function handleClick() {
    selectNode(id)
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    deleteElements({ nodes: [{ id }] })
  }

  return (
    <div
      className={`${styles.node} ${selected ? styles.selected : ''}`}
      style={{ '--node-color': color, '--node-bg': bgColor } as React.CSSProperties}
      onClick={handleClick}
    >
      {/* Handle de entrada */}
      <Handle
        type="target"
        position={Position.Left}
        className={styles.handleInput}
      />

      {/* Cabeçalho do card */}
      <div className={styles.header}>
        <span
          className={styles.iconWrapper}
          style={{ background: bgColor }}
        >
          {meta.icon}
        </span>
        <div className={styles.info}>
          <span className={styles.label}>{data.label ?? meta.label}</span>
          <span className={styles.type}>{type}</span>
        </div>
        <button
          className={styles.deleteBtn}
          onClick={handleDelete}
          title="Remover nó"
        >
          ×
        </button>
      </div>

      {/* Snippet de configuração */}
      {configSnippet && (
        <div className={styles.snippet}>
          <code>{configSnippet}</code>
        </div>
      )}

      {/* Handles de saída */}
      {handles.length === 0 ? null : hasMultipleOutputs ? (
        <div className={styles.outputHandles}>
          {handles.map((h, i) => (
            <div key={h.id} className={styles.outputHandle}>
              {h.label && (
                <span
                  className={styles.handleLabel}
                  style={{ color: h.color }}
                >
                  {h.label}
                </span>
              )}
              <Handle
                type="source"
                position={Position.Right}
                id={h.id}
                className={styles.handle}
                style={{
                  top: `${((i + 1) / (handles.length + 1)) * 100}%`,
                  background: h.color,
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          id={handles[0].id}
          className={styles.handle}
          style={{ background: handles[0].color }}
        />
      )}
    </div>
  )
}

// Retorna uma linha resumida da config para exibir no card
function getConfigSnippet(type: string, config: Record<string, unknown>): string | null {
  if (!config) return null

  if (type.startsWith('trigger.event') && config.event)
    return `event: "${config.event}"`

  if (type === 'trigger.schedule' && config.cron)
    return `cron: "${config.cron}"`

  if (type === 'action.send_email' && config.subject)
    return `"${String(config.subject).slice(0, 28)}${String(config.subject).length > 28 ? '…' : ''}"`

  if (type === 'action.send_whatsapp' && config.template_name)
    return `tpl: "${config.template_name}"`

  if (type === 'condition.if_else' && config.name)
    return String(config.name)

  if (type === 'condition.wait' && config.timeout)
    return `timeout: ${config.timeout}`

  if (type === 'delay.fixed' && config.duration)
    return `${config.duration} ${config.unit}`

  if (type === 'loop.for_each' && config.collection)
    return `each: ${config.collection}`

  if (type === 'action.http_request' && config.url)
    return `${config.method} ${String(config.url).replace(/^https?:\/\//, '').slice(0, 24)}…`

  return null
}
