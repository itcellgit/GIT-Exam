import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function onLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="header">
      <div className="header-brand">
        <img src="/Society-logo.jpg" alt="KLS Society" className="header-logo" />
        <div className="header-text">
          <h1>KLS Gogte Institute of Technology</h1>
          <h2>Examination Section</h2>
          <p>Udyambag, Belagavi – 590008 &nbsp;|&nbsp; 📞 0831-2405500</p>
        </div>
        <img src="/KLS%20GIT%20Logo.jpg" alt="KLS GIT" className="header-logo" />
      </div>
      {/* Nav is shown only to a logged-in admin. Visitors reach the login
          page by typing /login directly. */}
      {user && (
        <nav className="header-nav">
          <Link className="header-nav-link" to="/">Home</Link>
          <Link className="header-nav-link" to="/admin">Admin</Link>
          <button className="header-nav-btn" onClick={onLogout}>Logout</button>
        </nav>
      )}
    </header>
  )
}
