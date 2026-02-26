'use client'

import { create } from 'zustand'

interface FlowStore {
  // Metadados do fluxo
  flowId: string
  flowName: string
  flowActive: boolean

  // Estado da UI
  selectedNodeId: string | null
  isPanelOpen: boolean
  isSaving: boolean

  // Actions
  setFlowMeta: (meta: { id: string; name: string; active: boolean }) => void
  setFlowName: (name: string) => void
  toggleActive: () => void
  selectNode: (id: string | null) => void
  closePanel: () => void
  setSaving: (saving: boolean) => void
}

export const useFlowStore = create<FlowStore>((set) => ({
  flowId: '',
  flowName: 'Novo Fluxo',
  flowActive: false,

  selectedNodeId: null,
  isPanelOpen: false,
  isSaving: false,

  setFlowMeta: ({ id, name, active }) =>
    set({ flowId: id, flowName: name, flowActive: active }),

  setFlowName: (name) => set({ flowName: name }),

  toggleActive: () => set((s) => ({ flowActive: !s.flowActive })),

  selectNode: (id) =>
    set({ selectedNodeId: id, isPanelOpen: id !== null }),

  closePanel: () =>
    set({ selectedNodeId: null, isPanelOpen: false }),

  setSaving: (saving) => set({ isSaving: saving }),
}))
