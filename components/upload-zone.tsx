'use client'

import { ChangeEvent, DragEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'

type Props = {
  file: File | null
  onFile: (file: File) => void
  onRemove: () => void
}

const ACCEPT = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const MAX = 10 * 1024 * 1024

export function UploadZone({ file, onFile, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCount = useRef(0)
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!file) { setPreview(null); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const pick = useCallback((f?: File | null) => {
    setErr(null)
    if (!f) return
    if (!ACCEPT.includes(f.type)) { setErr('Format accepté : PNG ou JPG'); return }
    if (f.size > MAX) { setErr('Fichier trop lourd (max 10 Mo)'); return }
    onFile(f)
  }, [onFile])

  const openPicker = () => inputRef.current?.click()

  return (
    <div className="upload-block">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="sr-only"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          pick(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      {!file ? (
        <button
          type="button"
          className={`drop-zone ${dragging ? 'is-dragging' : ''}`}
          onClick={openPicker}
          onDragEnter={(e: DragEvent) => { e.preventDefault(); dragCount.current++; setDragging(true) }}
          onDragLeave={(e: DragEvent) => { e.preventDefault(); dragCount.current--; if (dragCount.current <= 0) { dragCount.current = 0; setDragging(false) } }}
          onDragOver={(e: DragEvent) => e.preventDefault()}
          onDrop={(e: DragEvent) => {
            e.preventDefault()
            dragCount.current = 0
            setDragging(false)
            pick(e.dataTransfer.files?.[0])
          }}
        >
          <div className="drop-icon"><Upload size={28} strokeWidth={1.5} /></div>
          <p className="drop-title">Déposer votre graphique ici</p>
          <p className="drop-sub">ou cliquez pour parcourir · PNG, JPG · 10 Mo max</p>
        </button>
      ) : (
        <div className="preview-box">
          {preview && <img src={preview} alt="Aperçu du graphique" className="preview-img" />}
          <div className="preview-bar">
            <div>
              <strong>{file.name}</strong>
              <span>{(file.size / 1024).toFixed(0)} Ko · Prêt à analyser</span>
            </div>
            <button type="button" className="btn-icon" onClick={onRemove} aria-label="Supprimer">
              <X size={18} />
            </button>
          </div>
          <button type="button" className="btn-ghost-sm" onClick={openPicker}>Changer de fichier</button>
        </div>
      )}

      {err && <p className="field-error">{err}</p>}
    </div>
  )
}
