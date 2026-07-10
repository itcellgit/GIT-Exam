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

export function sortNotificationsByCreatedAt(notifications) {
  return [...notifications].sort((a, b) => {
    const dateDiff = getNotificationDateTime(b) - getNotificationDateTime(a)
    if (dateDiff !== 0) return dateDiff
    return getNotificationCreatedAtTime(b) - getNotificationCreatedAtTime(a)
  })
}
