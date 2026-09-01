import { promises as fs } from 'fs'
import path from 'path'
import type { AnalysisRecord } from '../types'

const DATA_DIR = path.join(process.cwd(), 'data', 'history')

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

function userFile(userId: string) {
  return path.join(DATA_DIR, `${userId.replace(/[^a-zA-Z0-9-]/g, '')}.json`)
}

export async function getHistoryForUser(userId: string): Promise<AnalysisRecord[]> {
  await ensureStore()
  try {
    const raw = await fs.readFile(userFile(userId), 'utf-8')
    return JSON.parse(raw) as AnalysisRecord[]
  } catch { return [] }
}

export async function saveAnalysis(record: AnalysisRecord & { userId: string }) {
  const history = await getHistoryForUser(record.userId)
  history.unshift(record)
  await fs.writeFile(userFile(record.userId), JSON.stringify(history.slice(0, 200), null, 2), 'utf-8')
  return record
}
