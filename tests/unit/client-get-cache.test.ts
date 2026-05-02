import { afterEach, describe, expect, it, vi } from 'vitest'
import { cachedJson, clearClientGetCache } from '@/lib/client-get-cache'

afterEach(() => {
  clearClientGetCache()
  vi.restoreAllMocks()
})

describe('client GET cache', () => {
  it('reuses a fresh cached JSON response', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () => Response.json({ schools: [] })
    )

    await cachedJson('/api/schools')
    await cachedJson('/api/schools')

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('dedupes matching in-flight requests', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () => Response.json({ levels: [] })
    )

    await Promise.all([
      cachedJson('/api/levels'),
      cachedJson('/api/levels'),
    ])

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('separates cached entries by authorization header', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () => Response.json({ users: [] })
    )

    await cachedJson('/api/users', { headers: { Authorization: 'Bearer one' } })
    await cachedJson('/api/users', { headers: { Authorization: 'Bearer two' } })

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('can force a refetch', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () => Response.json({ students: [] })
    )

    await cachedJson('/api/students')
    await cachedJson('/api/students', undefined, { force: true })

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
