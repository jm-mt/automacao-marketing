import { Suspense } from 'react'
import { getFlows } from '@/app/actions/flows'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const flows = await getFlows()
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Carregando…</div>}>
      <DashboardClient initialFlows={flows} />
    </Suspense>
  )
}
