import { useEffect, useRef, useState } from 'react'
import {
  fetchSidebarLinks,
  createSidebarLink,
  updateSidebarLink,
  deleteSidebarLink,
  reorderSidebarLinks,
} from '../../api'
import Modal from '../Modal'
import SidebarLinkForm from './SidebarLinkForm'

export default function SidebarLinksTab({ section, title, addLabel }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal state: null = closed, { mode, item } = open
  const [modal, setModal] = useState(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')

  const dragIdRef = useRef(null)
  const [dragOverId, setDragOverId] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const data = await fetchSidebarLinks()
      setItems(data[section] || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section])

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
    const text = values.text.trim()
    const url = values.url.trim()
    if (!values.file && !url) {
      setFormError('A file upload or URL is required')
      return
    }
    setBusy(true)
    try {
      const payload = { text, url, note: values.note.trim(), file: values.file }
      if (modal.mode === 'create') {
        const created = await createSidebarLink(section, payload)
        setItems((prev) => [...prev, created])
      } else {
        const updated = await updateSidebarLink(section, modal.item.id, payload)
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
      }
      setModal(null)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this link?')) return
    try {
      await deleteSidebarLink(section, id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  function persistOrder(next) {
    setItems(next)
    reorderSidebarLinks(section, next.map((i) => i.id)).catch((err) => setError(err.message))
  }

  function move(index, dir) {
    const target = index + dir
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    persistOrder(next)
  }

  function onDragStart(id) {
    dragIdRef.current = id
  }
  function onDragOver(e, id) {
    e.preventDefault()
    if (id !== dragIdRef.current) setDragOverId(id)
  }
  function onDragLeave(id) {
    setDragOverId((cur) => (cur === id ? null : cur))
  }
  function onDrop(e, targetId) {
    e.preventDefault()
    setDragOverId(null)
    const sourceId = dragIdRef.current
    dragIdRef.current = null
    if (!sourceId || sourceId === targetId) return
    const from = items.findIndex((i) => i.id === sourceId)
    const to = items.findIndex((i) => i.id === targetId)
    if (from === -1 || to === -1) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    persistOrder(next)
  }
  function onDragEnd() {
    dragIdRef.current = null
    setDragOverId(null)
  }

  return (
    <div className="sidebar-links-tab">
      <div className="admin-toolbar admin-toolbar--plain">
        <button className="btn-primary" onClick={openCreate}>＋ {addLabel}</button>
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="state-msg">Loading…</div>
      ) : items.length === 0 ? (
        <div className="state-msg">No entries yet. Click “{addLabel}” to add one.</div>
      ) : (
        <ul className="link-list">
          {items.map((item, index) => (
            <li
              key={item.id}
              className={`link-row${dragOverId === item.id ? ' link-row--drag-over' : ''}`}
              draggable
              onDragStart={() => onDragStart(item.id)}
              onDragOver={(e) => onDragOver(e, item.id)}
              onDragLeave={() => onDragLeave(item.id)}
              onDrop={(e) => onDrop(e, item.id)}
              onDragEnd={onDragEnd}
            >
              <span className="link-row-handle" title="Drag to reorder" aria-hidden="true">⠿</span>

              <div className="link-row-order-btns">
                <button
                  type="button"
                  className="order-btn"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label="Move up"
                >▲</button>
                <button
                  type="button"
                  className="order-btn"
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Move down"
                >▼</button>
              </div>

              <div className="link-row-content">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="link-row-text">
                  {item.text}
                </a>
                {item.note && <p className="link-row-note">{item.note}</p>}
              </div>

              <div className="link-row-actions">
                <button className="btn-edit" onClick={() => openEdit(item)}>Edit</button>
                <button className="btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modal && (
        <Modal
          title={modal.mode === 'create' ? `Add to ${title}` : 'Edit Link'}
          onClose={closeModal}
        >
          <SidebarLinkForm
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
