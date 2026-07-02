import NotificationItem from './NotificationItem'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function paginationRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total]
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '…', current - 1, current, current + 1, '…', total]
}

export default function NotificationList({
  notifications, total, page, totalPages, goTo,
  query, setQuery, filterYear, setFilterYear,
  filterMonth, setFilterMonth, filterDay, setFilterDay,
  years, pageSize,
}) {
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))
  const hasFilter = query || filterYear || filterMonth || filterDay

  function clearAll() {
    setQuery('')
    setFilterYear('')
    setFilterMonth('')
    setFilterDay('')
  }

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <section className="notification-list">
      <div className="notification-list-heading">Notifications</div>

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search notifications…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <select
          className="filter-select"
          value={filterYear}
          onChange={e => setFilterYear(e.target.value)}
        >
          <option value="">All Years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          className="filter-select"
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
        >
          <option value="">All Months</option>
          {MONTHS.map((m, i) => (
            <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={filterDay}
          onChange={e => setFilterDay(e.target.value)}
        >
          <option value="">All Days</option>
          {days.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        {hasFilter && (
          <button className="clear-btn" onClick={clearAll}>Clear</button>
        )}
      </div>

      <div className="results-info">
        {total === 0
          ? 'No notifications found.'
          : `Showing ${start}–${end} of ${total} notification${total !== 1 ? 's' : ''}`}
      </div>

      <table className="notification-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Notification</th>
            <th>View</th>
          </tr>
        </thead>
        <tbody>
          {notifications.map((item, i) => (
            <NotificationItem key={i} item={item} />
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pg-btn"
            disabled={page === 1}
            onClick={() => goTo(1)}
            title="First page"
          >«</button>
          <button
            className="pg-btn"
            disabled={page === 1}
            onClick={() => goTo(page - 1)}
            title="Previous page"
          >‹</button>

          {paginationRange(page, totalPages).map((p, i) =>
            p === '…'
              ? <span key={`dot-${i}`} className="pg-dots">…</span>
              : <button
                  key={p}
                  className={`pg-btn${p === page ? ' active' : ''}`}
                  onClick={() => goTo(p)}
                >{p}</button>
          )}

          <button
            className="pg-btn"
            disabled={page === totalPages}
            onClick={() => goTo(page + 1)}
            title="Next page"
          >›</button>
          <button
            className="pg-btn"
            disabled={page === totalPages}
            onClick={() => goTo(totalPages)}
            title="Last page"
          >»</button>
        </div>
      )}
    </section>
  )
}
