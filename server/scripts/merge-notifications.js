#!/usr/bin/env node
import { promises as fs } from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import {
  readYearlyNotifications,
  writeYearlyNotifications,
  getNotificationCreatedAtTime,
  getNotificationDateTime,
} from '../notificationArchive.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data')

async function loadJson(file) {
  const raw = await fs.readFile(file, 'utf8')
  return JSON.parse(raw)
}

// Freshness for two records that share the same id (the same notification,
// possibly edited). updatedAt reflects a real admin edit and must win over a
// stale createdAt-only copy.
function freshness(item) {
  return Date.parse(item?.updatedAt || item?.createdAt || '') || 0
}

// Notifications re-seeded from src/data/notifications.js (see server/store.js
// seedNotifications) get a brand-new random id and a single bulk createdAt
// for the whole batch, so they never collide with the real record's id.
// Group by (date + normalized text) as well so these show up as duplicates.
function contentKey(item) {
  const text = String(item?.text || '').trim().replace(/\s+/g, ' ').toLowerCase()
  return `${item?.date || ''}|${text}`
}

// Given two-or-more records describing the same notification content, pick
// the authentic one: whichever carries a real admin edit (updatedAt) wins;
// otherwise the earliest createdAt wins, since re-seeding always happens
// after the fact and can only produce a *later* createdAt than the original.
function pickAuthentic(candidates) {
  const withUpdate = candidates.filter((c) => c.updatedAt)
  if (withUpdate.length > 0) {
    return withUpdate.reduce((best, c) => (freshness(c) > freshness(best) ? c : best))
  }
  return candidates.reduce((best, c) => (getNotificationCreatedAtTime(c) < getNotificationCreatedAtTime(best) ? c : best))
}

async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.error('Usage: node server/scripts/merge-notifications.js /path/to/backup.json [--dry]')
    process.exit(2)
  }
  const backupPath = resolve(process.cwd(), args[0])
  const dry = args.includes('--dry')

  try {
    await fs.access(backupPath)
  } catch (err) {
    console.error('Backup file not found:', backupPath)
    process.exit(1)
  }

  const backupRaw = await loadJson(backupPath)
  const backupList = Array.isArray(backupRaw) ? backupRaw : (backupRaw.notifications || [])

  const current = await readYearlyNotifications(DATA_DIR, [])

  const map = new Map()
  for (const item of current) {
    if (item.id) map.set(item.id, item)
    else map.set(randomUUID(), item)
  }

  for (const item of backupList) {
    if (!item) continue
    if (!item.id) {
      // create a synthetic id to keep the item
      item.id = randomUUID()
      map.set(item.id, item)
      continue
    }
    const existing = map.get(item.id)
    if (!existing) {
      map.set(item.id, item)
      continue
    }
    // Same id: the one with the more recent edit (updatedAt, falling back to
    // createdAt) is authoritative.
    const keep = freshness(item) > freshness(existing) ? item : existing
    map.set(item.id, keep)
  }

  // Second pass: collapse content duplicates that slipped through under
  // different ids (e.g. a reseed event that regenerated ids for notifications
  // that already existed).
  const byContent = new Map()
  for (const item of map.values()) {
    const key = contentKey(item)
    if (!byContent.has(key)) byContent.set(key, [])
    byContent.get(key).push(item)
  }

  let duplicatesRemoved = 0
  const deduped = []
  for (const group of byContent.values()) {
    if (group.length === 1) {
      deduped.push(group[0])
      continue
    }
    duplicatesRemoved += group.length - 1
    deduped.push(pickAuthentic(group))
  }

  const merged = deduped.sort((a, b) => {
    const d = getNotificationDateTime(b) - getNotificationDateTime(a)
    if (d !== 0) return d
    return getNotificationCreatedAtTime(b) - getNotificationCreatedAtTime(a)
  })

  console.log('Current items:', current.length)
  console.log('Backup items:', backupList.length)
  console.log('Content duplicates collapsed:', duplicatesRemoved)
  console.log('Merged unique items:', merged.length)

  if (dry) {
    console.log('Dry-run complete. No files were modified.')
    process.exit(0)
  }

  // Write merged data into yearly files using the archive helper
  await writeYearlyNotifications(DATA_DIR, merged)
  console.log('Merged notifications written into yearly archives in', DATA_DIR)
}

main().catch((err) => {
  console.error('Merge failed:', err)
  process.exit(1)
})
