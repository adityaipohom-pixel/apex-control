import { useEffect, useState } from 'react'

/** Live clock - used by the header and the dashboard hero. */
export function useClock(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
