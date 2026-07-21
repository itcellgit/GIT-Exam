import { useState } from 'react'
import Modal from '../components/Modal'
import ChangePasswordForm from '../components/ChangePasswordForm'
import NotificationsTab from '../components/admin/NotificationsTab'
import SidebarLinksTab from '../components/admin/SidebarLinksTab'

const TABS = [
  { key: 'notifications', label: 'Notifications' },
  { key: 'transcript', label: 'Transcript Application (Online)' },
  { key: 'helpFiles', label: 'Help Files' },
]

export default function AdminPage() {
  const [tab, setTab] = useState('notifications')
  const [showPwModal, setShowPwModal] = useState(false)

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <h2 className="admin-title">Admin Panel</h2>
        <div className="admin-header-actions">
          <button className="btn-secondary" onClick={() => setShowPwModal(true)}>Change Password</button>
        </div>
      </div>

      <div className="admin-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`admin-tab${tab === t.key ? ' admin-tab--active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="admin-tab-panel">
        {tab === 'notifications' && <NotificationsTab />}
        {tab === 'transcript' && (
          <SidebarLinksTab
            section="transcript"
            title="Transcript Application (Online)"
            addLabel="Add Link"
          />
        )}
        {tab === 'helpFiles' && (
          <SidebarLinksTab
            section="helpFiles"
            title="Help Files"
            addLabel="Add Help File"
          />
        )}
      </div>

      {showPwModal && (
        <Modal title="Change Password" onClose={() => setShowPwModal(false)}>
          <ChangePasswordForm onClose={() => setShowPwModal(false)} />
        </Modal>
      )}
    </div>
  )
}
