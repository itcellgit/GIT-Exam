import sidebarLinks from '../data/sidebarLinks'

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {sidebarLinks.map((group, gi) => (
        <div key={gi} className="sidebar-group">
          {group.section && (
            <h3 className="sidebar-group-heading">{group.section}</h3>
          )}
          <ul className="sidebar-list">
            {group.items.map((item, ii) => (
              <li key={ii} className="sidebar-item">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`sidebar-link${item.url === '#' ? ' sidebar-link--pending' : ''}`}
                >
                  <svg className="sidebar-link-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  {item.text}
                </a>
                {item.note && <p className="sidebar-note">{item.note}</p>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  )
}
