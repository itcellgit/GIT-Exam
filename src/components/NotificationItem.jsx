function daysSincePosted(dateStr) {
  const [dd, mm, yyyy] = dateStr.split('.')
  const posted = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
  const today = new Date()
  const diffMs = today - posted
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export default function NotificationItem({ item }) {
  const isNew = daysSincePosted(item.date) <= 10

  return (
    <tr className="notification-row">
      <td className="notification-date">{item.date}</td>
      <td>
        <div className="notification-text-cell">
          {isNew && <span className="badge-new">NEW</span>}
          <span>{item.text}</span>
        </div>
      </td>
      <td className="notification-pdf-cell">
        {item.pdf && (
          <a
            href={item.pdf}
            target="_blank"
            rel="noopener noreferrer"
            className="pdf-link"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            View
          </a>
        )}
      </td>
    </tr>
  )
}
