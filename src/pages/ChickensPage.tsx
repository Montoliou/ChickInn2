import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useChickens } from '../hooks/useChickens'
import { useEggs } from '../hooks/useEggs'
import { uploadPhoto } from '../hooks/usePhotoUpload'
import { PhotoPicker } from '../components/PhotoPicker'
import { PullToRefresh } from '../components/PullToRefresh'
import { ListRowSkeleton } from '../components/Skeleton'
import { useToast } from '../context/ToastContext'
import { Plus, Bird, ChevronRight, Upload, FileSpreadsheet, Check, Egg, CalendarDays, Skull } from 'lucide-react'

interface CsvRow { name: string; eggs: number; breed: string }

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  // Detect separator (semicolon for German Excel, comma otherwise)
  const sep = lines[0].includes(';') ? ';' : ','
  const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''))

  // Map columns by name
  const nameIdx = headers.findIndex(h => ['name', 'huhn', 'chicken'].includes(h))
  const eggsIdx = headers.findIndex(h => ['eier', 'eggs', 'anzahl', 'count'].includes(h))
  const breedIdx = headers.findIndex(h => ['rasse', 'breed', 'race'].includes(h))

  // If no headers match, try positional: first col = name, second = eggs
  if (nameIdx === -1) {
    return lines.slice(1).map(line => {
      const cols = line.split(sep).map(c => c.trim().replace(/^["']|["']$/g, ''))
      return { name: cols[0] ?? '', eggs: parseInt(cols[1] ?? '0') || 0, breed: cols[2] ?? '' }
    }).filter(r => r.name)
  }

  return lines.slice(1).map(line => {
    const cols = line.split(sep).map(c => c.trim().replace(/^["']|["']$/g, ''))
    return {
      name: cols[nameIdx] ?? '',
      eggs: eggsIdx >= 0 ? (parseInt(cols[eggsIdx]) || 0) : 0,
      breed: breedIdx >= 0 ? (cols[breedIdx] ?? '') : '',
    }
  }).filter(r => r.name)
}

export function ChickensPage() {
  const { chickens, loading, addChicken, refresh: refreshChickens } = useChickens()
  const { addEgg } = useEggs()
  const toast = useToast()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [breed, setBreed] = useState('')
  const [notes, setNotes] = useState('')
  const [initialEggs, setInitialEggs] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [csvRows, setCsvRows] = useState<CsvRow[]>([])
  const [showImport, setShowImport] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState(0)
  const [importStatus, setImportStatus] = useState('')
  const [importFrom, setImportFrom] = useState(() => {
    const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d.toISOString().slice(0, 10)
  })
  const [importTo, setImportTo] = useState(() => new Date().toISOString().slice(0, 10))
  const csvInputRef = useRef<HTMLInputElement>(null)

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const rows = parseCsv(text)
      if (rows.length > 0) {
        setCsvRows(rows)
        setShowImport(true)
      }
    }
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  const handleImport = async () => {
    setImporting(true)
    setImportDone(0)
    setImportStatus('')

    const fromDate = new Date(importFrom)
    const toDate = new Date(importTo)

    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i]
      try {
        // Check if chicken already exists
        let chicken = chickens.find(c => c.name.toLowerCase() === row.name.toLowerCase())
        if (!chicken) {
          setImportStatus(`Lege "${row.name}" an...`)
          chicken = await addChicken({ name: row.name, breed: row.breed || undefined })
        }

        // Add eggs spread across the date range
        if (row.eggs > 0 && chicken) {
          const totalDays = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / 86400000))
          for (let e = 0; e < row.eggs; e++) {
            setImportStatus(`${row.name}: Ei ${e + 1}/${row.eggs}`)
            // Spread eggs evenly across the period
            const dayOffset = Math.floor((e / row.eggs) * totalDays)
            const eggDate = new Date(fromDate)
            eggDate.setDate(eggDate.getDate() + dayOffset)
            eggDate.setHours(8, Math.floor(Math.random() * 60))
            await addEgg(chicken.id, eggDate.getTime())
          }
        }
        setImportDone(i + 1)
      } catch (err) {
        console.error(`Import failed for ${row.name}:`, err)
      }
    }
    setImporting(false)
    setImportStatus('')
    setShowImport(false)
    setCsvRows([])
  }

  const handlePhotoSelect = (file: File) => {
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const resetForm = () => {
    setName(''); setBreed(''); setNotes(''); setInitialEggs(''); setPhotoFile(null); setPhotoPreview(null); setShowForm(false)
  }

  const handleSave = async () => {
    if (!name.trim() || saving) return
    setSaving(true)
    try {
      let photoUrl: string | undefined
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile)
      }
      const newName = name.trim()
      const parsedEggs = parseInt(initialEggs) || 0
      await addChicken({
        name: newName,
        breed: breed.trim() || undefined,
        notes: notes.trim() || undefined,
        photoUrl,
        initialEggCount: parsedEggs > 0 ? parsedEggs : undefined,
      })
      resetForm()
      toast.success(`${newName} angelegt`)
    } catch (err) {
      console.error('Failed to save chicken:', err)
      toast.error('Konnte Huhn nicht speichern')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PullToRefresh onRefresh={refreshChickens}>
    <div className="p-4 space-y-4" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Hühner</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => csvInputRef.current?.click()}
            className="text-gray-400 active:text-green-600 p-2 min-w-11 min-h-11 flex items-center justify-center"
            aria-label="CSV importieren"
          >
            <Upload className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-md active:scale-95 transition-transform"
            aria-label="Huhn hinzufügen"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
      <input ref={csvInputRef} type="file" accept=".csv,.txt,.tsv" onChange={handleCsvFile} className="hidden" />

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
          <h2 className="font-semibold text-gray-800 text-center">Neues Huhn</h2>

          <div className="flex justify-center">
            <PhotoPicker
              preview={photoPreview}
              onSelect={handlePhotoSelect}
              size="lg"
            />
          </div>

          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Name *"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-shadow"
          />
          <input
            value={breed}
            onChange={e => setBreed(e.target.value)}
            placeholder="Rasse (optional)"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-shadow"
          />
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notiz (optional)"
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 resize-none transition-shadow"
          />
          <div>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={initialEggs}
              onChange={e => setInitialEggs(e.target.value)}
              placeholder="Bisherige Eier (optional)"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-shadow [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <p className="text-xs text-gray-400 mt-1 px-1">Eier die vor der App-Nutzung gelegt wurden</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={resetForm}
              disabled={saving}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-base font-medium active:scale-[0.98] transition-transform"
            >Abbrechen</button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="flex-1 py-3 rounded-xl bg-green-500 text-white text-base font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform shadow-sm"
            >{saving ? 'Speichert...' : 'Speichern'}</button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <ListRowSkeleton key={i} />)}
        </div>
      ) : (() => {
        const alive = chickens.filter(c => !c.diedAt)
        const dead = chickens.filter(c => !!c.diedAt)
        return chickens.length === 0 && !showForm ? (
          <div className="text-center py-20 text-gray-400">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bird className="w-8 h-8 text-green-300" />
            </div>
            <p className="font-medium text-gray-500">Noch keine Hühner</p>
            <p className="text-sm mt-1">Tippe auf + um eines anzulegen.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alive.map(chicken => (
              <div key={chicken.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 px-4 py-3">
                <Link to={`/chickens/${chicken.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-green-50 to-green-100 border border-green-200 flex items-center justify-center overflow-hidden shrink-0">
                    {chicken.photoUrl
                      ? <img src={chicken.photoUrl} alt={chicken.name} className="w-full h-full object-cover" />
                      : <Bird className="w-5 h-5 text-green-500" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800 truncate">{chicken.name}</p>
                    {chicken.breed && <p className="text-sm text-gray-400 truncate">{chicken.breed}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </Link>
              </div>
            ))}

            {/* Ahnengalerie */}
            {dead.length > 0 && (
              <>
                <div className="flex items-center gap-2 pt-4 pb-1 px-1">
                  <Skull className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-400">Ahnengalerie</h2>
                </div>
                {dead.map(chicken => (
                  <div key={chicken.id} className="bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3 px-4 py-3 opacity-70">
                    <Link to={`/chickens/${chicken.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-linear-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 grayscale">
                        {chicken.photoUrl
                          ? <img src={chicken.photoUrl} alt={chicken.name} className="w-full h-full object-cover" />
                          : <Bird className="w-5 h-5 text-gray-400" />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-500 truncate">{chicken.name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {chicken.diedAt && `† ${new Date(chicken.diedAt + 'T00:00').toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                    </Link>
                  </div>
                ))}
              </>
            )}
          </div>
        )
      })()}

      {/* CSV Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={() => { if (!importing) setShowImport(false) }}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-500" />
              CSV Import
            </h3>

            {/* Date range for egg distribution */}
            {csvRows.some(r => r.eggs > 0) && (
              <div className="bg-amber-50 rounded-xl p-3 space-y-2">
                <p className="text-xs font-medium text-amber-700 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Zeitraum für historische Eier
                </p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-amber-600">Von</label>
                    <input type="date" value={importFrom} onChange={e => setImportFrom(e.target.value)}
                      className="w-full border border-amber-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-amber-400 bg-white" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-amber-600">Bis</label>
                    <input type="date" value={importTo} onChange={e => setImportTo(e.target.value)}
                      max={new Date().toISOString().slice(0, 10)}
                      className="w-full border border-amber-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-amber-400 bg-white" />
                  </div>
                </div>
                <p className="text-xs text-amber-500">
                  Eier werden gleichmäßig über diesen Zeitraum verteilt.
                </p>
              </div>
            )}

            <p className="text-sm text-gray-500">
              {csvRows.length} Hühner, {csvRows.reduce((s, r) => s + r.eggs, 0)} Eier:
            </p>

            <div className="overflow-y-auto flex-1 -mx-2 px-2 space-y-1.5">
              {csvRows.map((row, i) => (
                <div key={i} className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <Bird className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{row.name}</p>
                    {row.breed && <p className="text-xs text-gray-400 truncate">{row.breed}</p>}
                  </div>
                  {row.eggs > 0 && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                      <Egg className="w-3 h-3" /> {row.eggs}
                    </span>
                  )}
                  {importing && i < importDone && (
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {importStatus && (
              <p className="text-xs text-green-600 text-center animate-pulse">{importStatus}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowImport(false); setCsvRows([]) }}
                disabled={importing}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium disabled:opacity-40"
              >
                Abbrechen
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex-1 py-3 rounded-xl bg-green-500 text-white text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {importing ? (
                  <>{importDone}/{csvRows.length} importiert...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Importieren</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PullToRefresh>
  )
}
