import { useState } from 'react'

export default function SidebarLinkForm({ initial, onSubmit, onCancel, busy, error }) {
  const isEdit = !!initial
  const existingUrl = initial?.url || ''
  const existingIsUpload = existingUrl.startsWith('/uploads')

  const [text, setText] = useState(initial?.text || '')
  const [url, setUrl] = useState(existingUrl && !existingIsUpload ? existingUrl : '')
  const [file, setFile] = useState(null)
  const [note, setNote] = useState(initial?.note || '')

  function submit(e) {
    e.preventDefault()
    onSubmit({ text, url, note, file })
  }

  return (
    <form className="admin-form admin-form--modal" onSubmit={submit}>
      {error && <div className="form-error">{error}</div>}

      <label className="field-label" htmlFor="slf-text">Link text *</label>
      <input
        id="slf-text"
        className="field-input"
        type="text"
        placeholder="e.g. Transcript Application (Online)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        required
      />

      {isEdit && existingUrl && (
        <div className="current-pdf">
          Current link:{' '}
          <a href={existingUrl} target="_blank" rel="noopener noreferrer">
            {existingIsUpload ? existingUrl.split('/').pop() : existingUrl}
          </a>
        </div>
      )}

      <label className="field-label" htmlFor="slf-file">
        {isEdit ? 'Replace file (upload)' : 'Attach file (upload)'}
      </label>
      <input
        id="slf-file"
        className="field-input"
        type="file"
        accept="application/pdf,image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <label className="field-label" htmlFor="slf-url">…or link an external URL</label>
      <input
        id="slf-url"
        className="field-input"
        type="url"
        placeholder="https://…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={!!file}
      />
      <span className="field-hint">
        An uploaded file takes precedence over the URL. One of the two is required.
      </span>

      <label className="field-label" htmlFor="slf-note">Note (optional)</label>
      <textarea
        id="slf-note"
        className="field-input"
        rows={2}
        placeholder="Optional helper text shown under the link…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Link'}
        </button>
      </div>
    </form>
  )
}
