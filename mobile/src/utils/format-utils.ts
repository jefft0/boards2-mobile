const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'UTC',
  timeZoneName: 'short'
})

export const formatTimestamp = (dateString: string): string => {
  try {
    const date = new Date(dateString)

    if (isNaN(date.getTime())) {
      return dateString
    }
    return dateFormatter.format(date)
  } catch (error) {
    console.error('Error formatting date:', error)
    return dateString
  }
}
