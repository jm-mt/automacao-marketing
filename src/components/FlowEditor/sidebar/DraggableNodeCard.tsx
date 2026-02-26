'use client'

import styles from './DraggableNodeCard.module.scss'

interface DraggableNodeCardProps {
  nodeType: string
  label: string
  icon: string
  color: string
  description: string
}

export default function DraggableNodeCard({
  nodeType,
  label,
  icon,
  color,
  description,
}: DraggableNodeCardProps) {
  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('application/reactflow/type', nodeType)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      className={styles.card}
      draggable
      onDragStart={onDragStart}
      title={description}
      style={{ '--card-color': color } as React.CSSProperties}
    >
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{label}</span>
    </div>
  )
}
