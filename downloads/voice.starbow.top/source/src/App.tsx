import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './routes/AppShell'
import { AnalysisPage } from './routes/AnalysisPage'
import { PracticePage } from './routes/PracticePage'

const InteractivePage = lazy(() => import('./routes/InteractivePage').then(module => ({ default: module.InteractivePage })))
const ManualPage = lazy(() => import('./routes/ManualPage').then(module => ({ default: module.ManualPage })))
const StatisticsPage = lazy(() => import('./routes/StatisticsPage').then(module => ({ default: module.StatisticsPage })))

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<AnalysisPage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="statistics" element={<Suspense fallback={<LoadingPage />}><StatisticsPage /></Suspense>} />
          <Route path="interactive" element={<Suspense fallback={<LoadingPage />}><InteractivePage /></Suspense>} />
          <Route path="manual" element={<Suspense fallback={<LoadingPage />}><ManualPage /></Suspense>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

function LoadingPage() {
  return <div role="status" style={{ margin: 'auto', padding: 32, color: 'var(--text-soft)' }}>正在打开页面…</div>
}
