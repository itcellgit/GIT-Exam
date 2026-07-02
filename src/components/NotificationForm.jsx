import { useState } from 'react'

// dd.mm.yyyy -> yyyy-mm-dd for <input type="date">
function toIsoDate(dmy) {
  if (!dmy) return ''
  const [d, m, y] = dmy.split('.')
  return `${y}-${m}-${d}`
}

export default function NotificationForm({ initial, onSubmit, onCancel, busy, error }) {
  const isEdit = !!initial
  const existingPdf = initial?.pdf || ''
  const existingIsUpload = existingPdf.startsWith('/uploads')

  const [text, setText] = useState(initial?.text || '')
  const [date, setDate] = useState(toIsoDate(initial?.date))
  // Pre-fill URL field only when the existing PDF is an external link.
  const [pdfUrl, setPdfUrl] = useState(existingPdf && !existingIsUpload ? existingPdf : '')
  const [pdfFile, setPdfFile] = useState(null)
  const [removePdf, setRemovePdf] = useState(false)

  function submit(e) {
    e.preventDefault()
    onSubmit({ text, date, pdfUrl, pdfFile, removePdf })
  }

  return (
    <form className="admin-form admin-form--modal" onSubmit={submit}>
      {error && <div className="form-error">{error}</div>}

      <label className="field-label" htmlFor="nf-text">Notification text *</label>
      <textarea
        id="nf-text"
        className="field-input"
        rows={4}
        placeholder="Enter the notification text…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        required
      />

      <label className="field-label" htmlFor="nf-date">Date</label>
      <input
        id="nf-date"
        className="field-input"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      {!isEdit && <span className="field-hint">Defaults to today if left empty.</span>}

      {isEdit && existingPdf && (
        <div className="current-pdf">
          Current PDF:{' '}
          <a href={existingPdf} target="_blank" rel="noopener noreferrer">
            {existingIsUpload ? existingPdf.split('/').pop() : existingPdf}
          </a>
        </div>
      )}

      <label className="field-label" htmlFor="nf-file">
        {isEdit ? 'Replace PDF (upload)' : 'Attach PDF (upload)'}
      </label>
      <input
        id="nf-file"
        className="field-input"
        type="file"
        accept="application/pdf"
        onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
        disabled={removePdf}
      />

      <label className="field-label" htmlFor="nf-url">…or link an external PDF URL</label>
      <input
        id="nf-url"
        className="field-input"
        type="url"
        placeholder="https://…/document.pdf"
        value={pdfUrl}
        onChange={(e) => setPdfUrl(e.target.value)}
        disabled={!!pdfFile || removePdf}
      />
      <span className="field-hint">An uploaded file takes precedence over the URL.</span>

      {isEdit && existingPdf && (
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={removePdf}
            onChange={(e) => setRemovePdf(e.target.checked)}
          />
          Remove current PDF
        </label>
      )}

      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : isEdit ? 'Save Changes' : 'Publish Notification'}
        </button>
      </div>
    </form>
  )
}
