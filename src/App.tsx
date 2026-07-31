import { HashRouter, Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import { AppStoreProvider } from './lib/store'
import { LessonFlowProvider } from './lib/lessonFlow'
import { primeVoices } from './lib/speech'
import MainLayout from './components/MainLayout'
import Dashboard from './pages/Dashboard'
import Progress from './pages/Progress'
import Settings from './pages/Settings'
import LessonSetup from './pages/LessonSetup'
import Reading from './pages/Reading'
import Vocabulary from './pages/Vocabulary'
import Speaking from './pages/Speaking'
import Summary from './pages/Summary'

export default function App() {
  useEffect(() => {
    primeVoices()
  }, [])

  return (
    <AppStoreProvider>
      <LessonFlowProvider>
        <HashRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="/lesson/setup" element={<LessonSetup />} />
            <Route path="/lesson/reading" element={<Reading />} />
            <Route path="/lesson/vocabulary" element={<Vocabulary />} />
            <Route path="/lesson/speaking" element={<Speaking />} />
            <Route path="/lesson/summary" element={<Summary />} />
          </Routes>
        </HashRouter>
      </LessonFlowProvider>
    </AppStoreProvider>
  )
}
