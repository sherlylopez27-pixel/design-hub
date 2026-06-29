import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  isProjectLive,
  getEffectiveStatus,
  formatDeadline,
  generateSlug,
  generateShortId,
  isValidEmail,
  calcPercentages,
  findWinner,
} from '@/lib/utils'

describe('isProjectLive', () => {
  it('returns false for draft', () => {
    expect(isProjectLive('draft', null)).toBe(false)
  })

  it('returns false for closed', () => {
    expect(isProjectLive('closed', null)).toBe(false)
  })

  it('returns true for active with no deadline', () => {
    expect(isProjectLive('active', null)).toBe(true)
  })

  it('returns true for active with future deadline', () => {
    const future = new Date()
    future.setDate(future.getDate() + 10)
    expect(isProjectLive('active', future.toISOString().split('T')[0])).toBe(true)
  })

  it('returns false for active with past deadline', () => {
    const past = new Date()
    past.setDate(past.getDate() - 1)
    expect(isProjectLive('active', past.toISOString().split('T')[0])).toBe(false)
  })

  it('returns true for active with today\'s deadline', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(isProjectLive('active', today)).toBe(true)
  })
})

describe('getEffectiveStatus', () => {
  it('returns draft for draft projects', () => {
    expect(getEffectiveStatus('draft', null)).toBe('draft')
  })

  it('returns closed for closed projects', () => {
    expect(getEffectiveStatus('closed', null)).toBe('closed')
  })

  it('returns active for active with no deadline', () => {
    expect(getEffectiveStatus('active', null)).toBe('active')
  })

  it('returns closed for active with past deadline', () => {
    const past = new Date()
    past.setDate(past.getDate() - 1)
    expect(getEffectiveStatus('active', past.toISOString().split('T')[0])).toBe('closed')
  })

  it('returns active for active with future deadline', () => {
    const future = new Date()
    future.setDate(future.getDate() + 10)
    expect(getEffectiveStatus('active', future.toISOString().split('T')[0])).toBe('active')
  })
})

describe('formatDeadline', () => {
  it('returns empty string for null', () => {
    expect(formatDeadline(null)).toBe('')
  })

  it('returns "Closes today" for today', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(formatDeadline(today)).toBe('Closes today')
  })

  it('returns "Closes tomorrow" for tomorrow', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(formatDeadline(tomorrow.toISOString().split('T')[0])).toBe('Closes tomorrow')
  })

  it('returns "Closed" for past dates', () => {
    const past = new Date()
    past.setDate(past.getDate() - 5)
    expect(formatDeadline(past.toISOString().split('T')[0])).toBe('Closed')
  })

  it('returns "Closes in N days" for future dates', () => {
    const future = new Date()
    future.setDate(future.getDate() + 7)
    expect(formatDeadline(future.toISOString().split('T')[0])).toBe('Closes in 7 days')
  })
})

describe('generateSlug', () => {
  it('converts title to lowercase kebab', () => {
    expect(generateSlug('Hello World')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(generateSlug('Hello, World!')).toBe('hello-world')
  })

  it('collapses multiple dashes', () => {
    expect(generateSlug('Hello   World')).toBe('hello-world')
  })

  it('trims leading and trailing dashes', () => {
    expect(generateSlug('  Hello  ')).toBe('hello')
  })

  it('truncates to 60 characters', () => {
    const long = 'a'.repeat(100)
    expect(generateSlug(long).length).toBeLessThanOrEqual(60)
  })
})

describe('generateShortId', () => {
  it('returns 8 characters', () => {
    expect(generateShortId()).toHaveLength(8)
  })

  it('returns alphanumeric only', () => {
    expect(generateShortId()).toMatch(/^[a-z0-9]+$/)
  })

  it('generates unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateShortId()))
    expect(ids.size).toBeGreaterThan(95)
  })
})

describe('isValidEmail', () => {
  it('validates correct emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('user+tag@sub.example.co.uk')).toBe(true)
  })

  it('rejects invalid emails', () => {
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })
})

describe('calcPercentages', () => {
  it('returns empty object for zero total', () => {
    expect(calcPercentages([{ version_id: 'a', vote_count: 0 }], 0)).toEqual({})
  })

  it('calculates correct percentages', () => {
    const counts = [
      { version_id: 'a', vote_count: 3 },
      { version_id: 'b', vote_count: 1 },
    ]
    const result = calcPercentages(counts, 4)
    expect(result['a']).toBe(75)
    expect(result['b']).toBe(25)
  })

  it('rounds to nearest integer', () => {
    const counts = [
      { version_id: 'a', vote_count: 1 },
      { version_id: 'b', vote_count: 2 },
    ]
    const result = calcPercentages(counts, 3)
    expect(result['a']).toBe(33)
    expect(result['b']).toBe(67)
  })
})

describe('findWinner', () => {
  it('returns null for empty counts', () => {
    expect(findWinner([])).toBeNull()
  })

  it('returns null for all-zero votes', () => {
    expect(findWinner([{ version_id: 'a', vote_count: 0 }])).toBeNull()
  })

  it('returns null for a tie', () => {
    expect(
      findWinner([
        { version_id: 'a', vote_count: 5 },
        { version_id: 'b', vote_count: 5 },
      ])
    ).toBeNull()
  })

  it('returns the version with most votes', () => {
    expect(
      findWinner([
        { version_id: 'a', vote_count: 3 },
        { version_id: 'b', vote_count: 7 },
        { version_id: 'c', vote_count: 2 },
      ])
    ).toBe('b')
  })
})
