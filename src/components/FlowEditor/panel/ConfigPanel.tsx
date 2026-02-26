'use client'

import { useReactFlow } from '@xyflow/react'
import { useFlowStore } from '@/hooks/useFlowStore'
import { NODE_META, CATEGORY_COLOR } from '../nodes/nodeCategories'
import type { NodeType } from '@/lib/flow/types'
import NodeConfigForm from './forms/NodeConfigForm'
import styles from './ConfigPanel.module.scss'

export default function ConfigPanel() {
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId)
  const isPanelOpen    = useFlowStore((s) => s.isPanelOpen)
  const closePanel     = useFlowStore((s) => s.closePanel)
  const { getNode, deleteElements } = useReactFlow()

  if (!isPanelOpen || !selectedNodeId) return null

  const node = getNode(selectedNodeId)
  if (!node) return null

  const type  = (node.type ?? '') as NodeType
  const meta  = NODE_META[type]
  const color = meta ? CATEGORY_COLOR[meta.category] : 'var(--primary)'
  const label = (node.data as Record<string, unknown>).label as string | undefined

  function handleDelete() {
    deleteElements({ nodes: [{ id: selectedNodeId! }] })
    closePanel()
  }

  return (
    <aside className={`${styles.panel} ${isPanelOpen ? styles.open : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span
            className={styles.iconBadge}
            style={{ background: color + '20', color }}
          >
            {meta?.icon ?? '?'}
          </span>
          <div>
            <h2 className={styles.title}>{label ?? meta?.label ?? type}</h2>
            <span className={styles.nodeId}>ID: {selectedNodeId}</span>
          </div>
        </div>
        <button className={styles.closeBtn} onClick={closePanel} title="Fechar">×</button>
      </div>

      {/* Tipo */}
      <div className={styles.field}>
        <label className={styles.fieldLabel}>Tipo</label>
        <span className={styles.typeTag} style={{ color, borderColor: color + '40', background: color + '10' }}>
          {type}
        </span>
      </div>

      {/* Saídas */}
      {meta?.sourceHandles && meta.sourceHandles.length > 1 && (
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Saídas</label>
          <div className={styles.handles}>
            {meta.sourceHandles.map((h) => (
              <div key={h.id} className={styles.handleRow}>
                <span className={styles.handleDot} style={{ background: h.color }} />
                <span className={styles.handleId}>{h.id}</span>
                {h.label && <span className={styles.handleLabel}>{h.label}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulário de configuração */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <NodeConfigForm nodeId={selectedNodeId} nodeType={type} />
      </div>

      {/* Delete */}
      <div className={styles.actions}>
        <button className={styles.deleteBtn} onClick={handleDelete}>
          Remover nó
        </button>
      </div>
    </aside>
  )
}
