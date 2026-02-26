'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import FlowCard from '@/components/Dashboard/FlowCard'
import { createFlow, getFlows } from '@/app/actions/flows'
import styles from './dashboard.module.scss'

interface FlowSummary {
  id: string
  name: string
  active: boolean
  updated_at?: string
}

export default function DashboardClient({ initialFlows }: { initialFlows: FlowSummary[] }) {
  const router = useRouter()
  const [flows, setFlows] = useState<FlowSummary[]>(initialFlows)
  const [search, setSearch] = useState('')
  const [isCreating, startCreate] = useTransition()
  const [newName, setNewName] = useState('')
  const [showModal, setShowModal] = useState(false)

  const refresh = useCallback(async () => {
    const fresh = await getFlows()
    setFlows(fresh)
  }, [])

  function openCreateModal() {
    setNewName('')
    setShowModal(true)
  }

  function handleCreate() {
    if (!newName.trim()) return
    startCreate(async () => {
      const id = await createFlow(newName.trim())
      setShowModal(false)
      router.push(`/flows/${id}`)
    })
  }

  const filtered = flows.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Fluxos de automação</h1>
          <p className={styles.subtitle}>{flows.length} fluxo{flows.length !== 1 ? 's' : ''} criado{flows.length !== 1 ? 's' : ''}</p>
        </div>
        <button className={styles.createBtn} onClick={openCreateModal}>
          + Novo fluxo
        </button>
      </header>

      {/* Search */}
      {flows.length > 0 && (
        <div className={styles.searchRow}>
          <input
            className={styles.search}
            type="text"
            placeholder="Buscar fluxo…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>
          {flows.length === 0 ? (
            <>
              <span className={styles.emptyIcon}>⚡</span>
              <p>Nenhum fluxo ainda.</p>
              <button className={styles.createBtn} onClick={openCreateModal}>Criar primeiro fluxo</button>
            </>
          ) : (
            <p>Nenhum fluxo encontrado para &quot;{search}&quot;.</p>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(f => (
            <FlowCard
              key={f.id}
              id={f.id}
              name={f.name}
              active={f.active}
              updated_at={f.updated_at}
              onMutated={refresh}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Novo fluxo</h2>
            <input
              className={styles.modalInput}
              autoFocus
              placeholder="Nome do fluxo…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
            />
            <div className={styles.modalActions}>
              <button className={styles.modalCancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className={styles.modalConfirmBtn} disabled={!newName.trim() || isCreating} onClick={handleCreate}>
                {isCreating ? 'Criando…' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
