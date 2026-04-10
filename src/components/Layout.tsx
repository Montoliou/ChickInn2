import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { InstallPrompt } from './InstallPrompt'

export function Layout() {
  return (
    <div className="min-h-svh">
      <main className="pb-20">
        <Outlet />
      </main>
      <InstallPrompt />
      <BottomNav />
    </div>
  )
}
