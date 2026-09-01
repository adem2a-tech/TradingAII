'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'

type Toast = { id: string; msg: string }

const Ctx = createContext<{ toast: (msg: string) => void }>({ toast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const counter = useRef(0)

  const toast = useCallback((msg: string) => {
    const id = `${Date.now()}-${++counter.current}-${Math.random().toString(36).slice(2, 7)}`
    setItems((p) => [...p, { id, msg }])
    setTimeout(() => setItems((p) => p.filter((t) => t.id !== id)), 3200)
  }, [])

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="toasts">
        {items.map((t) => (
          <div key={t.id} className="toast">{t.msg}</div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  return useContext(Ctx)
}
