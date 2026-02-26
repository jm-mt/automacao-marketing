'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { deleteFlow, duplicateFlow, toggleFlowActive } from '@/app/actions/flows'
import styles from './FlowCard.module.scss'

interface FlowCardProps {
  id: string
  name: string
  active: boolean
  updated_at?: string
  onMutated: () => void
}

export default function FlowCard({ id, name, active, updated_at, onMutated }: FlowCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const updatedLabel = updated_at
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(updated_at))
    : '—'

  function openEditor() {
    router.push(`/flows/${id}`)
  }

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    startTransition(async () => {
      await toggleFlowActive(id, !active)
      onMutated()
    })
  }

  function handleDuplicate(e: React.MouseEvent) {
    e.stopPropagation()
    startTransition(async () => {
      await duplicateFlow(id)
      onMutated()
    })
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirmDelete) { setConfirmDelete(true); return }
    startTransition(async () => {
      await deleteFlow(id)
      onMutated()
    })
  }

  return (
    <div
      className={styles.card}
      onClick={openEditor}
      style={{ opacity: isPending ? 0.6 : 1 }}
      onMouseLeave={() => setConfirmDelete(false)}
    >
      <div className={styles.topRow}>
        <h3 className={styles.name}>{name}</h3>
      </div>

      <div className={styles.statusRow}>
        <span className={`${styles.badge} ${active ? styles.active : styles.inactive}`}>
          {active ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      <span className={styles.meta}>Atualizado em {updatedLabel}</span>

      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={openEditor}>
          Editar
        </button>
        <button className={styles.actionBtn} onClick={handleToggle}>
          {active ? 'Pausar' : 'Ativar'}
        </button>
        <button className={styles.actionBtn} onClick={handleDuplicate}>
          Duplicar
        </button>
        <button className={`${styles.actionBtn} ${styles.danger}`} onClick={handleDelete}>
          {confirmDelete ? 'Confirmar?' : 'Excluir'}
        </button>
      </div>
    </div>
  )
}
