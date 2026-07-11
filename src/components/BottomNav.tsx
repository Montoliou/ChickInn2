import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Bird, BarChart3, Settings } from 'lucide-react'

const tabs = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/chickens', label: 'Hühner', Icon: Bird },
  { to: '/reports', label: 'Auswertung', Icon: BarChart3 },
  { to: '/settings', label: 'Mehr', Icon: Settings },
]

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex max-w-lg mx-auto">
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors min-h-12 justify-center ` +
              (isActive ? 'text-green-600' : 'text-gray-400')
            }
          >
            {({ isActive }) => (
              <>
                <tab.Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span>{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
