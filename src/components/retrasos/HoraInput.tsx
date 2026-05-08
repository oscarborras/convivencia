'use client'

import { useEffect, useState } from 'react'

export default function HoraInput() {
  const [value, setValue] = useState('')

  useEffect(() => {
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    setValue(`${hh}:${mm}`)
  }, [])

  return (
    <input
      type="time"
      name="hora_registro"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      required
      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner text-sm font-mono"
    />
  )
}
