import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { InstallPrompt } from './InstallPrompt'

export function Layout() {
  return (
    <div className="flex flex-col min-h-svh">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <InstallPrompt />
      <BottomNav />
    </div>
  )
}
