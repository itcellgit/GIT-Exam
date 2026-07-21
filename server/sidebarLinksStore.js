// Simple JSON-file backed store for sidebar link sections (Transcript
// Application / Help Files). On first run it seeds from
// src/data/sidebarLinks.js so the admin-managed content starts out
// identical to what the sidebar already shows.
import { fileURLToPath, pathToFileURL } from 'url'
import { dirname, join } from 'path'
import { promises as fs } from 'fs'
import { randomUUID } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data')
const FILE = join(DATA_DIR, 'sidebarLinks.json')

export const SECTIONS = ['transcript', 'helpFiles']

async function readJson(file, fallback) {
  try {
    const raw = await fs.readFile(file, 'utf8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

async function writeJson(file, data) {
  const tmp = `${file}.tmp`
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8')
  await fs.rename(tmp, file)
}

function assertSection(section) {
  if (!SECTIONS.includes(section)) {
    const err = new Error(`Unknown sidebar link section: ${section}`)
    err.status = 400
    throw err
  }
}

async function seed() {
  const seedPath = join(__dirname, '..', 'src', 'data', 'sidebarLinks.js')
  let groups = []
  try {
    const mod = await import(pathToFileURL(seedPath).href)
    groups = Array.isArray(mod.default) ? mod.default : []
  } catch (err) {
    console.warn('Could not seed sidebar links from src/data/sidebarLinks.js:', err.message)
  }

  const transcriptGroup = groups.find((g) => !g.section) || null
  const helpGroup = groups.find((g) => g.section === 'Help Files') || null

  const toItems = (group) =>
    (group?.items || []).map((it) => ({
      id: randomUUID(),
      text: it.text,
      url: it.url,
      note: it.note || null,
      createdAt: new Date().toISOString(),
    }))

  const data = {
    transcript: toItems(transcriptGroup),
    helpFiles: toItems(helpGroup),
  }
  await writeJson(FILE, data)
  console.log(
    `Seeded sidebar links: ${data.transcript.length} transcript item(s), ${data.helpFiles.length} help file item(s)`
  )
  return data
}

export async function initSidebarLinksStore() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(FILE)
  } catch {
    await seed()
  }
}

export async function getSidebarLinks() {
  return readJson(FILE, { transcript: [], helpFiles: [] })
}

export async function addSidebarLink(section, { text, url, note }) {
  assertSection(section)
  const data = await getSidebarLinks()
  const item = {
    id: randomUUID(),
    text,
    url,
    note: note || null,
    createdAt: new Date().toISOString(),
  }
  data[section].push(item)
  await writeJson(FILE, data)
  return item
}

export async function updateSidebarLink(section, id, fields) {
  assertSection(section)
  const data = await getSidebarLinks()
  const idx = data[section].findIndex((i) => i.id === id)
  if (idx === -1) return null
  data[section][idx] = { ...data[section][idx], ...fields, updatedAt: new Date().toISOString() }
  await writeJson(FILE, data)
  return data[section][idx]
}

export async function deleteSidebarLink(section, id) {
  assertSection(section)
  const data = await getSidebarLinks()
  const item = data[section].find((i) => i.id === id)
  data[section] = data[section].filter((i) => i.id !== id)
  await writeJson(FILE, data)
  return item || null
}

// orderedIds: full or partial list of ids in the desired order. Any items
// not mentioned keep their relative order and are appended at the end.
export async function reorderSidebarLinks(section, orderedIds) {
  assertSection(section)
  const data = await getSidebarLinks()
  const byId = new Map(data[section].map((i) => [i.id, i]))
  const next = orderedIds.map((id) => byId.get(id)).filter(Boolean)
  const placed = new Set(next.map((i) => i.id))
  const missing = data[section].filter((i) => !placed.has(i.id))
  data[section] = [...next, ...missing]
  await writeJson(FILE, data)
  return data[section]
}
