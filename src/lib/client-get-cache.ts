type CachedJsonEntry<T> = {
  data: T
  expiresAt: number
  status: number
  ok: boolean
}

type CachedJsonResult<T> = {
  data: T
  status: number
  ok: boolean
}

const DEFAULT_TTL_MS = 30_000
const cache = new Map<string, CachedJsonEntry<unknown>>()
const pendingRequests = new Map<string, Promise<CachedJsonResult<unknown>>>()

function getHeaderValue(headers: HeadersInit | undefined, name: string): string {
  if (!headers) return ''
  if (headers instanceof Headers) return headers.get(name) || ''
  if (Array.isArray(headers)) {
    return headers.find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1] || ''
  }

  return Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1] || ''
}

function buildCacheKey(url: string, init: RequestInit | undefined): string {
  const authorization = getHeaderValue(init?.headers, 'authorization')
  return `${url}::${authorization}`
}

export async function cachedJson<T>(
  url: string,
  init?: RequestInit,
  options: { ttlMs?: number; force?: boolean } = {}
): Promise<CachedJsonResult<T>> {
  const key = buildCacheKey(url, init)
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS
  const cached = cache.get(key) as CachedJsonEntry<T> | undefined

  if (!options.force && cached && cached.expiresAt > Date.now()) {
    return { data: cached.data, ok: cached.ok, status: cached.status }
  }

  const pending = pendingRequests.get(key) as Promise<CachedJsonResult<T>> | undefined
  if (!options.force && pending) return pending

  const request = fetch(url, init)
    .then(async (response) => {
      const data = await response.json() as T
      const result = { data, ok: response.ok, status: response.status }

      if (response.ok) {
        cache.set(key, { ...result, expiresAt: Date.now() + ttlMs })
      }

      return result
    })
    .finally(() => pendingRequests.delete(key))

  pendingRequests.set(key, request)
  return request
}

export function clearClientGetCache(prefix?: string) {
  for (const key of cache.keys()) {
    if (!prefix || key.startsWith(prefix)) cache.delete(key)
  }
}
