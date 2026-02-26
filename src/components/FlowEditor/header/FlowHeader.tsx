'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { useFlowStore } from '@/hooks/useFlowStore'
import styles from './FlowHeader.module.scss'

interface FlowHeaderProps {
  onSave: () => Promise<void>
}

export default function FlowHeader({ onSave }: FlowHeaderProps) {
  const flowName   = useFlowStore((s) => s.flowName)
  const flowActive = useFlowStore((s) => s.flowActive)
  const isSaving   = useFlowStore((s) => s.isSaving)
  const setFlowName  = useFlowStore((s) => s.setFlowName)
  const toggleActive = useFlowStore((s) => s.toggleActive)

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue]     = useState(flowName)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setNameValue(flowName)
    setEditingName(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function commitName() {
    const trimmed = nameValue.trim()
    if (trimmed) setFlowName(trimmed)
    setEditingName(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitName()
    if (e.key === 'Escape') setEditingName(false)
  }

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {/* Voltar ao dashboard */}
        <Link href="/" className={styles.backBtn} title="Voltar ao dashboard">
          ← Fluxos
        </Link>

        <span className={styles.divider} />

        <div className={styles.logo}>A</div>

        {editingName ? (
          <input
            ref={inputRef}
            className={styles.nameInput}
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={commitName}
            onKeyDown={onKeyDown}
          />
        ) : (
          <button className={styles.nameBtn} onClick={startEdit} title="Clique para editar o nome">
            {flowName}
          </button>
        )}

        <button
          className={`${styles.statusBadge} ${flowActive ? styles.active : styles.inactive}`}
          onClick={toggleActive}
          title={flowActive ? 'Clique para desativar' : 'Clique para ativar'}
        >
          <span className={styles.statusDot} />
          {flowActive ? 'Ativo' : 'Inativo'}
        </button>
      </div>

      <div className={styles.right}>
        <button
          className={`${styles.saveBtn} ${isSaving ? styles.saving : ''}`}
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </header>
  )
}
