import { useEffect, useState } from 'react'
import {
  fetchNotifications,
  publishNotification,
  updateNotification,
  deleteNotification,
} from '../../api'
import Modal from '../Modal'
import NotificationForm from '../NotificationForm'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const PAGE_SIZE = 9
const SEARCH_DEBOUNCE_MS = 350

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

export default function NotificationsTab() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [years, setYears] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal state: null = closed, { mode, item } = open
  const [modal, setModal] = useState(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')

  // List controls
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterDay, setFilterDay] = useState('')
  const [page, setPage] = useState(1)

  // Debounce free-text search so every keystroke doesn't hit the server.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [query])

  async function load() {
    setLoading(true)
    try {
      // noStore: admin must see its own add/edit/delete immediately,
      // not a 30s-stale cached response.
      const data = await fetchNotifications(
        { year: filterYear, month: filterMonth, day: filterDay, q: debouncedQuery, page, pageSize: PAGE_SIZE },
        { noStore: true }
      )
      setItems(data.items)
      setTotal(data.total)
      setYears(data.years)
      if (data.page !== page) setPage(data.page)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterYear, filterMonth, filterDay, debouncedQuery, page])

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
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
        await publishNotification(payload)
      } else {
        await updateNotification(modal.item.id, payload)
      }
      setModal(null)
      await load()
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
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const end = Math.min(page * PAGE_SIZE, total)

  return (
    <div className="notifications-tab">
      <div className="admin-toolbar admin-toolbar--plain">
        <button className="btn-primary" onClick={openCreate}>＋ Add Notification</button>
      </div>

      {error && <div className="form-error">{error}</div>}

      {/* Search + filters */}
      <div className="admin-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="Search notifications…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
        {total === 0
          ? 'No notifications found.'
          : `Showing ${start}–${end} of ${total} notification${total !== 1 ? 's' : ''}`}
      </div>

      {/* Box / card layout */}
      {loading ? (
        <div className="state-msg">Loading…</div>
      ) : (
        <div className="notif-card-grid">
          {items.map((item) => (
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
          <button className="pg-btn" disabled={page === 1} onClick={() => setPage(1)} title="First page">«</button>
          <button className="pg-btn" disabled={page === 1} onClick={() => setPage(page - 1)} title="Previous page">‹</button>
          {paginationRange(page, totalPages).map((p, i) =>
            p === '…'
              ? <span key={`dot-${i}`} className="pg-dots">…</span>
              : <button
                  key={p}
                  className={`pg-btn${p === page ? ' active' : ''}`}
                  onClick={() => setPage(p)}
                >{p}</button>
          )}
          <button className="pg-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)} title="Next page">›</button>
          <button className="pg-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)} title="Last page">»</button>
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
    </div>
  )
}
