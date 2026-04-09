import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useChickens } from '../hooks/useChickens'
import { uploadPhoto } from '../hooks/usePhotoUpload'
import { PhotoPicker } from '../components/PhotoPicker'
import { Plus, X, Bird, ChevronRight, Upload, FileSpreadsheet, Check } from 'lucide-react'

interface CsvRow { name: string; breed: string; notes: string }

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  // Detect separator (semicolon for German Excel, comma otherwise)
  const sep = lines[0].includes(';') ? ';' : ','
  const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''))

  // Map columns by name
  const nameIdx = headers.findIndex(h => ['name', 'huhn', 'chicken'].includes(h))
  const breedIdx = headers.findIndex(h => ['rasse', 'breed', 'race'].includes(h))
  const notesIdx = headers.findIndex(h => ['notiz', 'notizen', 'notes', 'bemerkung'].includes(h))

  if (nameIdx === -1) return []

  return lines.slice(1).map(line => {
    const cols = line.split(sep).map(c => c.trim().replace(/^["']|["']$/g, ''))
    return {
      name: cols[nameIdx] ?? '',
      breed: breedIdx >= 0 ? (cols[breedIdx] ?? '') : '',
      notes: notesIdx >= 0 ? (cols[notesIdx] ?? '') : '',
    }
  }).filter(r => r.name)
}

export function ChickensPage() {
  const { chickens, addChicken, deleteChicken } = useChickens()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [breed, setBreed] = useState('')
  const [notes, setNotes] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [csvRows, setCsvRows] = useState<CsvRow[]>([])
  const [showImport, setShowImport] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState(0)
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
    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i]
      try {
        await addChicken({
          name: row.name,
          breed: row.breed || undefined,
          notes: row.notes || undefined,
        })
        setImportDone(i + 1)
      } catch (err) {
        console.error(`Import failed for ${row.name}:`, err)
      }
    }
    setImporting(false)
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
    setName(''); setBreed(''); setNotes(''); setPhotoFile(null); setPhotoPreview(null); setShowForm(false)
  }

  const handleSave = async () => {
    if (!name.trim() || saving) return
    setSaving(true)
    try {
      let photoUrl: string | undefined
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile)
      }
      await addChicken({
        name: name.trim(),
        breed: breed.trim() || undefined,
        notes: notes.trim() || undefined,
        photoUrl,
      })
      resetForm()
    } catch (err) {
      console.error('Failed to save chicken:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
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
      {chickens.length === 0 && !showForm ? (
        <div className="text-center py-20 text-gray-400">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bird className="w-8 h-8 text-green-300" />
          </div>
          <p className="font-medium text-gray-500">Noch keine Hühner</p>
          <p className="text-sm mt-1">Tippe auf + um eines anzulegen.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {chickens.map(chicken => (
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
              <button
                onClick={() => { if (confirm(`${chicken.name} wirklich löschen?`)) deleteChicken(chicken.id) }}
                className="text-gray-300 p-2 active:text-red-400 shrink-0 min-w-11 min-h-11 flex items-center justify-center"
                aria-label={`${chicken.name} löschen`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* CSV Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={() => { if (!importing) setShowImport(false) }}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-500" />
              CSV Import
            </h3>
            <p className="text-sm text-gray-500">
              {csvRows.length} Hühner gefunden. Vorschau:
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
                  {importing && i < importDone && (
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                  )}
                </div>
              ))}
            </div>

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
                  <><Upload className="w-4 h-4" /> {csvRows.length} importieren</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
