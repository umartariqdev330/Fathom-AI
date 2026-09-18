import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { Meetings } from './pages/Meetings'
import { MeetingDetail } from './pages/MeetingDetail'
import { SearchPage } from './pages/SearchPage'
import { CalendarPage } from './pages/CalendarPage'
import { HighlightsPage } from './pages/HighlightsPage'
import { SettingsPage } from './pages/SettingsPage'
import { SharedClipPage } from './pages/SharedClipPage'
import { NotFound } from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      {/* Public: a clip link has to open for someone who was never on the call. */}
      <Route path="/share/:token" element={<SharedClipPage />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/meetings" element={<Meetings />} />
        <Route path="/meetings/:id" element={<MeetingDetail />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/highlights" element={<HighlightsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
