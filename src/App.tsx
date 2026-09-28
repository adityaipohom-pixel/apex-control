import { AppShell } from './components/layout/AppShell'
import { useRouter } from './hooks/useRouter'
import { HomePage } from './pages/HomePage'
import { AppsPage } from './pages/AppsPage'
import { MediaPage } from './pages/MediaPage'
import { SystemPage } from './pages/SystemPage'
import { FilesPage } from './pages/FilesPage'
import { ToolsPage } from './pages/ToolsPage'
import { SettingsPage } from './pages/SettingsPage'
import { NotFoundPage } from './pages/NotFoundPage'

const PAGES = {
  home: HomePage,
  apps: AppsPage,
  media: MediaPage,
  system: SystemPage,
  files: FilesPage,
  tools: ToolsPage,
  settings: SettingsPage,
} as const

/** Root component: navigation + page switching. */
export default function App() {
  const { route } = useRouter()
  const Page = PAGES[route] ?? NotFoundPage

  return (
    <AppShell>
      <Page />
    </AppShell>
  )
}
