import { useState, useEffect } from 'react'
import { Download, X, Share } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window) && !ua.includes('CriOS')
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosTip, setShowIosTip] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't show if already installed or previously dismissed this session
    if (isStandalone()) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // iOS Safari: show manual tip
    if (isIosSafari()) {
      const dismissedAt = localStorage.getItem('chickinn_install_dismissed')
      if (!dismissedAt || Date.now() - Number(dismissedAt) > 7 * 24 * 60 * 60 * 1000) {
        setShowIosTip(true)
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    setDeferredPrompt(null)
    setShowIosTip(false)
    localStorage.setItem('chickinn_install_dismissed', String(Date.now()))
  }

  if (isStandalone() || dismissed) return null

  // Chrome/Android/Desktop install prompt
  if (deferredPrompt) {
    return (
      <div className="mx-4 mb-4 bg-linear-to-r from-green-500 to-green-600 rounded-2xl p-4 shadow-lg flex items-center gap-3 text-white">
        <Download className="w-6 h-6 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">App installieren</p>
          <p className="text-xs text-green-100">Zum Homescreen hinzufügen</p>
        </div>
        <button onClick={handleInstall}
          className="bg-white text-green-600 font-semibold text-sm px-4 py-2 rounded-xl active:scale-95 transition-transform shrink-0">
          Installieren
        </button>
        <button onClick={handleDismiss} className="p-1 text-green-200" aria-label="Schließen">
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // iOS Safari manual tip
  if (showIosTip) {
    return (
      <div className="mx-4 mb-4 bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
            <Share className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-800">Zum Homescreen hinzufügen</p>
            <p className="text-xs text-gray-500 mt-1">
              Tippe auf <Share className="w-3.5 h-3.5 inline text-blue-500 -mt-0.5" /> unten in Safari, dann auf <strong>"Zum Home-Bildschirm"</strong>.
            </p>
          </div>
          <button onClick={handleDismiss} className="p-1 text-gray-300" aria-label="Schließen">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return null
}
