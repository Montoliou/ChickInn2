import { useRef, useState } from 'react'
import { Camera, Image, X } from 'lucide-react'

interface PhotoPickerProps {
  currentUrl?: string | null
  preview?: string | null
  onSelect: (file: File) => void
  size?: 'sm' | 'lg'
  placeholder?: React.ReactNode
}

export function PhotoPicker({ currentUrl, preview, onSelect, size = 'lg', placeholder }: PhotoPickerProps) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const libraryRef = useRef<HTMLInputElement>(null)
  const [showMenu, setShowMenu] = useState(false)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onSelect(file)
    setShowMenu(false)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const sizeClasses = size === 'lg'
    ? 'w-24 h-24'
    : 'w-11 h-11'

  const iconSize = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'

  const displayUrl = preview || currentUrl

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        className={`${sizeClasses} rounded-full bg-green-50 border-2 border-dashed border-green-300 flex items-center justify-center overflow-hidden active:scale-95 transition-transform relative`}
        aria-label="Foto auswählen"
      >
        {displayUrl ? (
          <img src={displayUrl} alt="Foto" className="w-full h-full object-cover" />
        ) : (
          placeholder || <Camera className={`${iconSize} text-green-400`} />
        )}
        {size === 'sm' && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-white">
            <Camera className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </button>

      {/* Selection menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute z-50 mt-2 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden w-52">
            <button
              onClick={() => { cameraRef.current?.click(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 active:bg-gray-50 transition-colors"
            >
              <Camera className="w-5 h-5 text-green-500" />
              Foto aufnehmen
            </button>
            <div className="border-t border-gray-100" />
            <button
              onClick={() => { libraryRef.current?.click(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 active:bg-gray-50 transition-colors"
            >
              <Image className="w-5 h-5 text-green-500" />
              Aus Mediathek
            </button>
            <div className="border-t border-gray-100" />
            <button
              onClick={() => setShowMenu(false)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 active:bg-gray-50 transition-colors"
            >
              <X className="w-5 h-5" />
              Abbrechen
            </button>
          </div>
        </>
      )}

      {/* Camera input */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      {/* Library input (no capture = opens photo library) */}
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  )
}
