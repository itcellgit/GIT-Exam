export function getNotificationSortTime(item) {
  if (!item) return 0

  if (item.createdAt) {
    const createdAtTime = Date.parse(item.createdAt)
    if (!Number.isNaN(createdAtTime)) return createdAtTime
  }

  if (item.date) {
    const [dd, mm, yyyy] = String(item.date).split('.')
    if (dd && mm && yyyy) {
      const legacyTime = new Date(Number(yyyy), Number(mm) - 1, Number(dd)).getTime()
      if (!Number.isNaN(legacyTime)) return legacyTime
    }
  }

  return 0
}

export function sortNotificationsByCreatedAt(notifications) {
  return [...notifications].sort((a, b) => getNotificationSortTime(b) - getNotificationSortTime(a))
}
