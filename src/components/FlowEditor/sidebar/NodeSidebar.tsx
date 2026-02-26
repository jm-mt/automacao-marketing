'use client'

import { useState } from 'react'
import { SIDEBAR_CATEGORIES, NODE_META, CATEGORY_COLOR } from '../nodes/nodeCategories'
import DraggableNodeCard from './DraggableNodeCard'
import styles from './NodeSidebar.module.scss'

export default function NodeSidebar() {
  const [search, setSearch] = useState('')
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(['triggers', 'messaging', 'logic'])
  )

  function toggleCategory(id: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const query = search.toLowerCase().trim()

  const filteredCategories = SIDEBAR_CATEGORIES.map((cat) => ({
    ...cat,
    types: cat.types.filter((t) => {
      if (!query) return true
      const meta = NODE_META[t]
      return (
        meta?.label.toLowerCase().includes(query) ||
        t.toLowerCase().includes(query) ||
        meta?.description.toLowerCase().includes(query)
      )
    }),
  })).filter((cat) => cat.types.length > 0)

  return (
    <aside className={styles.sidebar}>
      {/* Search */}
      <div className={styles.searchWrapper}>
        <span className={styles.searchIcon}>⌕</span>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Buscar nós..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className={styles.clearBtn} onClick={() => setSearch('')}>×</button>
        )}
      </div>

      {/* Categories */}
      <div className={styles.categories}>
        {filteredCategories.map((cat) => {
          const isOpen = query ? true : openCategories.has(cat.id)
          return (
            <div key={cat.id} className={styles.category}>
              <button
                className={styles.categoryHeader}
                onClick={() => toggleCategory(cat.id)}
              >
                <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>›</span>
                <span className={styles.categoryLabel}>{cat.label}</span>
                <span className={styles.categoryCount}>{cat.types.length}</span>
              </button>

              {isOpen && (
                <div className={styles.nodeGrid}>
                  {cat.types.map((type) => {
                    const meta = NODE_META[type]
                    if (!meta) return null
                    return (
                      <DraggableNodeCard
                        key={type}
                        nodeType={type}
                        label={meta.label}
                        icon={meta.icon}
                        color={CATEGORY_COLOR[meta.category]}
                        description={meta.description}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
