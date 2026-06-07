import { describe, it, expect } from 'vitest'
import { createPkcePair } from '../src/auth/google-loopback'

describe('createPkcePair', () => {
  it('produces a verifier and a different challenge', () => {
    const { verifier, challenge } = createPkcePair()
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(challenge).not.toBe(verifier)
  })

  it('produces a unique verifier each call', () => {
    expect(createPkcePair().verifier).not.toBe(createPkcePair().verifier)
  })
})
