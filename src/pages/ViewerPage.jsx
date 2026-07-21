import { useEffect, useState } from 'react'
import NotificationList from '../components/NotificationList'
import Sidebar from '../components/Sidebar'
import { fetchNotifications } from '../api'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 350

export default function ViewerPage() {
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [notifications, setNotifications] = useState([])
  const [total, setTotal] = useState(0)
  const [years, setYears] = useState([])

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

  useEffect(() => {
    let cancelled = false
    fetchNotifications({
      year: filterYear,
      month: filterMonth,
      day: filterDay,
      q: debouncedQuery,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((data) => {
        if (cancelled) return
        setNotifications(data.items)
        setTotal(data.total)
        setYears(data.years)
        if (data.page !== page) setPage(data.page)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [filterYear, filterMonth, filterDay, debouncedQuery, page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

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
            notifications={notifications}
            total={total}
            page={page}
            totalPages={totalPages}
            goTo={goTo}
            query={query}
            setQuery={setQuery}
            filterYear={filterYear}
            setFilterYear={(y) => { setFilterYear(y); resetPage() }}
            filterMonth={filterMonth}
            setFilterMonth={(m) => { setFilterMonth(m); resetPage() }}
            filterDay={filterDay}
            setFilterDay={(d) => { setFilterDay(d); resetPage() }}
            years={years}
            pageSize={PAGE_SIZE}
          />
        )}
      </main>
      <Sidebar />
    </div>
  )
}
