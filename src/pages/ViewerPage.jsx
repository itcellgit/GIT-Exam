import { useState, useMemo, useEffect } from 'react'
import NotificationList from '../components/NotificationList'
import Sidebar from '../components/Sidebar'
import { fetchNotifications } from '../api'
import { sortNotificationsByCreatedAt } from '../utils/notificationSort'

const PAGE_SIZE = 20

export default function ViewerPage() {
  const [raw, setRaw] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [query, setQuery] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterDay, setFilterDay] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchNotifications()
      .then((data) => {
        setRaw(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  const notifications = useMemo(
    () => sortNotificationsByCreatedAt(raw),
    [raw]
  )

  const years = useMemo(() => {
    const set = new Set(notifications.map((n) => n.date.split('.')[2]))
    return [...set].sort((a, b) => b - a)
  }, [notifications])

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      const [dd, mm, yyyy] = n.date.split('.')
      if (filterYear && yyyy !== filterYear) return false
      if (filterMonth && mm !== filterMonth) return false
      if (filterDay && dd !== filterDay) return false
      if (query && !n.text.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [notifications, query, filterYear, filterMonth, filterDay])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function goTo(p) {
    setPage(p)
  }
  function resetPage() {
    setPage(1)
  }

  return (
    <div className="page-body">
      <main className="main-content">
        {status === 'loading' && (
          <div className="state-msg">Loading notifications…</div>
        )}
        {status === 'error' && (
          <div className="state-msg state-msg--error">
            Could not load notifications. Please make sure the server is running and try again.
          </div>
        )}
        {status === 'ready' && (
          <NotificationList
            notifications={paginated}
            total={filtered.length}
            page={page}
            totalPages={totalPages}
            goTo={goTo}
            query={query}
            setQuery={(q) => {
              setQuery(q)
              resetPage()
            }}
            filterYear={filterYear}
            setFilterYear={(y) => {
              setFilterYear(y)
              resetPage()
            }}
            filterMonth={filterMonth}
            setFilterMonth={(m) => {
              setFilterMonth(m)
              resetPage()
            }}
            filterDay={filterDay}
            setFilterDay={(d) => {
              setFilterDay(d)
              resetPage()
            }}
            years={years}
            pageSize={PAGE_SIZE}
          />
        )}
      </main>
      <Sidebar />
    </div>
  )
}
