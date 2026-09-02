import os from 'os'
import path from 'path'

/** Chemin writable en local et sur Vercel (/tmp). */
export function getDataRoot() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(os.tmpdir(), 'tradeai-data')
  }
  return path.join(process.cwd(), 'data')
}

export function getDataSubdir(name: string) {
  return path.join(getDataRoot(), name)
}
