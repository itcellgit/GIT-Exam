import { promises as fs } from 'fs'
import { join } from 'path'

export function getNotificationDateTime(item) {
  if (!item) return 0

  if (item.date) {
    const [dd, mm, yyyy] = String(item.date).split('.')
    if (dd && mm && yyyy) {
      const legacyTime = new Date(Number(yyyy), Number(mm) - 1, Number(dd)).getTime()
      if (!Number.isNaN(legacyTime)) return legacyTime
    }
  }

  return 0
}

export function getNotificationCreatedAtTime(item) {
  if (!item?.createdAt) return 0

  const createdAtTime = Date.parse(item.createdAt)
  return Number.isNaN(createdAtTime) ? 0 : createdAtTime
}

export function sortNotifications(notifications) {
  return [...notifications].sort((a, b) => {
    const dateDiff = getNotificationDateTime(b) - getNotificationDateTime(a)
    if (dateDiff !== 0) return dateDiff
    return getNotificationCreatedAtTime(b) - getNotificationCreatedAtTime(a)
  })
}

export function getNotificationYear(item) {
  if (!item) return null

  if (item.date) {
    const [dd, mm, yyyy] = String(item.date).split('.')
    if (yyyy && /^\d{4}$/.test(yyyy)) return Number(yyyy)
  }

  if (item.createdAt) {
    const createdAtTime = Date.parse(item.createdAt)
    if (!Number.isNaN(createdAtTime)) return new Date(createdAtTime).getUTCFullYear()
  }

  return null
}

export function getYearlyFileName(year) {
  return `notifications_${year}.json`
}

export function getYearlyFilePath(dataDir, year) {
  return join(dataDir, getYearlyFileName(year))
}

export function groupNotificationsByYear(notifications) {
  const grouped = new Map()
  for (const notification of notifications) {
    const year = getNotificationYear(notification) ?? new Date(getNotificationDateTime(notification)).getUTCFullYear()
    if (!grouped.has(year)) grouped.set(year, [])
    grouped.get(year).push(notification)
  }
  return grouped
}

export async function readYearlyNotifications(dataDir, fallback = []) {
  const files = (await fs.readdir(dataDir).catch(() => [])).filter((name) => /^notifications_\d{4}\.json$/.test(name)).sort()
  if (files.length === 0) return fallback

  const notifications = []
  for (const fileName of files) {
    const fullPath = join(dataDir, fileName)
    const content = await fs.readFile(fullPath, 'utf8').catch(() => '[]')
    try {
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed)) notifications.push(...parsed)
    } catch {
      // Ignore invalid archive files and continue.
    }
  }

  return sortNotifications(notifications)
}

export async function writeYearlyNotifications(dataDir, notifications) {
  const grouped = groupNotificationsByYear(notifications)

  const years = [...grouped.keys()].sort((a, b) => Number(a) - Number(b))
  for (const year of years) {
    const payload = sortNotifications(grouped.get(year))
    const filePath = getYearlyFilePath(dataDir, year)
    await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8')
  }

  return years
}
