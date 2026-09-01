'use client'

import { useRef, useState } from 'react'
import { Send } from 'lucide-react'
import type { AnalysisRecord } from '@/lib/types'
import { answerQuestion, QUICK_QUESTIONS } from '@/lib/knowledge/chat-engine'

type Msg = { role: 'user' | 'bot'; text: string }

export function AnalysisChat({ analysis }: { analysis: AnalysisRecord | null }) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'bot', text: 'Pose-moi une question sur ton setup, le lot, le risque ou les annonces du jour.' },
  ])
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  const send = (text: string) => {
    if (!text.trim()) return
    const reply = answerQuestion(text, analysis)
    setMsgs((m) => [...m, { role: 'user', text }, { role: 'bot', text: reply }])
    setInput('')
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  return (
    <div className="chat-box">
      <h3>Expert Trading · Chat</h3>
      <div className="chat-msgs">
        {msgs.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role}`}>{m.text}</div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="chat-quick">
        {QUICK_QUESTIONS.map((q) => (
          <button key={q} type="button" onClick={() => send(q)}>{q}</button>
        ))}
      </div>
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(input) }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ex: Pourquoi ce lot ? Dois-je baisser le risque ?" />
        <button type="submit" aria-label="Envoyer"><Send size={16} /></button>
      </form>
    </div>
  )
}
