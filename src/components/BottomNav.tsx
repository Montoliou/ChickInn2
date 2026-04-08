import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/chickens', label: 'Hühner', icon: '🐔' },
  { to: '/reports', label: 'Auswertung', icon: '📈' },
  { to: '/settings', label: 'Einstellungen', icon: '⚙️' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex">
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors ` +
              (isActive ? 'text-green-600' : 'text-gray-500')
            }
          >
            <span className="text-xl">{tab.icon}</span>
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
