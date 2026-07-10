import { useEffect, useMemo, useState } from 'react'
import {
  fetchNotifications,
  publishNotification,
  updateNotification,
  deleteNotification,
} from '../api'
import Modal from '../components/Modal'
import NotificationForm from '../components/NotificationForm'
import ChangePasswordForm from '../components/ChangePasswordForm'
import { sortNotificationsByCreatedAt } from '../utils/notificationSort'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const PAGE_SIZE = 9

// yyyy-mm-dd (from <input type="date">) -> dd.mm.yyyy
function toDdMmYyyy(isoDate) {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-')
  return `${d}.${m}.${y}`
}

function paginationRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total]
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '…', current - 1, current, current + 1, '…', total]
}

export default function AdminPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal state: null = closed, { mode, item } = open
  const [modal, setModal] = useState(null)
  const [showPwModal, setShowPwModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')

  // List controls
  const [query, setQuery] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterDay, setFilterDay] = useState('')
  const [page, setPage] = useState(1)

  async function load() {
    setLoading(true)
    try {
      setItems(await fetchNotifications())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const sorted = useMemo(
    () => sortNotificationsByCreatedAt(items),
    [items]
  )

  const years = useMemo(() => {
    const set = new Set(sorted.map((n) => n.date.split('.')[2]))
    return [...set].sort((a, b) => b - a)
  }, [sorted])

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))

  const filtered = useMemo(() => {
    return sorted.filter((n) => {
      const [dd, mm, yyyy] = n.date.split('.')
      if (filterYear && yyyy !== filterYear) return false
      if (filterMonth && mm !== filterMonth) return false
      if (filterDay && dd !== filterDay) return false
      if (query && !n.text.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [sorted, query, filterYear, filterMonth, filterDay])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const hasFilter = query || filterYear || filterMonth || filterDay

  function resetPage() {
    setPage(1)
  }
  function clearAll() {
    setQuery('')
    setFilterYear('')
    setFilterMonth('')
    setFilterDay('')
    resetPage()
  }

  function openCreate() {
    setFormError('')
    setModal({ mode: 'create', item: null })
  }
  function openEdit(item) {
    setFormError('')
    setModal({ mode: 'edit', item })
  }
  function closeModal() {
    if (busy) return
    setModal(null)
  }

  async function handleSubmit(values) {
    setFormError('')
    setBusy(true)
    try {
      const payload = {
        text: values.text.trim(),
        date: toDdMmYyyy(values.date),
        pdfUrl: values.pdfUrl.trim(),
        pdfFile: values.pdfFile,
        removePdf: values.removePdf,
      }
      if (modal.mode === 'create') {
        const created = await publishNotification(payload)
        setItems((prev) => [created, ...prev])
      } else {
        const updated = await updateNotification(modal.item.id, payload)
        setItems((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
      }
      setModal(null)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this notification?')) return
    try {
      await deleteNotification(id)
      setItems((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  const start = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const end = Math.min(safePage * PAGE_SIZE, filtered.length)

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <h2 className="admin-title">Manage Notifications</h2>
        <div className="admin-header-actions">
          <button className="btn-secondary" onClick={() => setShowPwModal(true)}>Change Password</button>
          <button className="btn-primary" onClick={openCreate}>＋ Add Notification</button>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      {/* Search + filters */}
      <div className="admin-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="Search notifications…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); resetPage() }}
        />
        <select
          className="filter-select"
          value={filterYear}
          onChange={(e) => { setFilterYear(e.target.value); resetPage() }}
        >
          <option value="">All Years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          className="filter-select"
          value={filterMonth}
          onChange={(e) => { setFilterMonth(e.target.value); resetPage() }}
        >
          <option value="">All Months</option>
          {MONTHS.map((m, i) => (
            <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={filterDay}
          onChange={(e) => { setFilterDay(e.target.value); resetPage() }}
        >
          <option value="">All Days</option>
          {days.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        {hasFilter && <button className="clear-btn" onClick={clearAll}>Clear</button>}
      </div>

      <div className="results-info results-info--admin">
        {filtered.length === 0
          ? 'No notifications found.'
          : `Showing ${start}–${end} of ${filtered.length} notification${filtered.length !== 1 ? 's' : ''}`}
      </div>

      {/* Box / card layout */}
      {loading ? (
        <div className="state-msg">Loading…</div>
      ) : (
        <div className="notif-card-grid">
          {paginated.map((item) => (
            <article key={item.id} className="notif-card">
              <div className="notif-card-top">
                <span className="notif-card-date">{item.date}</span>
                <div className="notif-card-actions">
                  <button className="btn-edit" onClick={() => openEdit(item)}>Edit</button>
                  <button className="btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
                </div>
              </div>
              <p className="notif-card-text">{item.text}</p>
              {item.pdf && (
                <a href={item.pdf} target="_blank" rel="noopener noreferrer" className="pdf-link">
                  View PDF
                </a>
              )}
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button className="pg-btn" disabled={safePage === 1} onClick={() => setPage(1)} title="First page">«</button>
          <button className="pg-btn" disabled={safePage === 1} onClick={() => setPage(safePage - 1)} title="Previous page">‹</button>
          {paginationRange(safePage, totalPages).map((p, i) =>
            p === '…'
              ? <span key={`dot-${i}`} className="pg-dots">…</span>
              : <button
                  key={p}
                  className={`pg-btn${p === safePage ? ' active' : ''}`}
                  onClick={() => setPage(p)}
                >{p}</button>
          )}
          <button className="pg-btn" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)} title="Next page">›</button>
          <button className="pg-btn" disabled={safePage === totalPages} onClick={() => setPage(totalPages)} title="Last page">»</button>
        </div>
      )}

      {modal && (
        <Modal
          title={modal.mode === 'create' ? 'Publish a Notification' : 'Edit Notification'}
          onClose={closeModal}
        >
          <NotificationForm
            initial={modal.item}
            onSubmit={handleSubmit}
            onCancel={closeModal}
            busy={busy}
            error={formError}
          />
        </Modal>
      )}

      {showPwModal && (
        <Modal title="Change Password" onClose={() => setShowPwModal(false)}>
          <ChangePasswordForm onClose={() => setShowPwModal(false)} />
        </Modal>
      )}
    </div>
  )
}
