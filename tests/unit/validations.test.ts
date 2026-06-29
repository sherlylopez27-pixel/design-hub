import { describe, it, expect } from 'vitest'
import { voteSchema, projectSchema, designVersionSchema, imageUploadSchema } from '@/lib/validations'

describe('voteSchema', () => {
  const valid = {
    project_id: '550e8400-e29b-41d4-a716-446655440000',
    selected_version_id: '550e8400-e29b-41d4-a716-446655440001',
    voter_name: 'Jane Smith',
    voter_email: 'jane@company.com',
    reason: 'I liked the layout',
  }

  it('accepts valid input', () => {
    expect(voteSchema.safeParse(valid).success).toBe(true)
  })

  it('lowercases email', () => {
    const result = voteSchema.safeParse({ ...valid, voter_email: 'JANE@COMPANY.COM' })
    expect(result.success && result.data.voter_email).toBe('jane@company.com')
  })

  it('rejects invalid project_id', () => {
    expect(voteSchema.safeParse({ ...valid, project_id: 'not-a-uuid' }).success).toBe(false)
  })

  it('rejects invalid email', () => {
    expect(voteSchema.safeParse({ ...valid, voter_email: 'not-an-email' }).success).toBe(false)
  })

  it('rejects empty name', () => {
    expect(voteSchema.safeParse({ ...valid, voter_name: '' }).success).toBe(false)
  })

  it('rejects empty reason', () => {
    expect(voteSchema.safeParse({ ...valid, reason: '' }).success).toBe(false)
  })
})

describe('projectSchema', () => {
  it('accepts valid project', () => {
    expect(projectSchema.safeParse({ title: 'My Project' }).success).toBe(true)
  })

  it('defaults status to draft', () => {
    const result = projectSchema.safeParse({ title: 'Test' })
    expect(result.success && result.data.status).toBe('draft')
  })

  it('defaults results_mode to after_close', () => {
    const result = projectSchema.safeParse({ title: 'Test' })
    expect(result.success && result.data.results_mode).toBe('after_close')
  })

  it('rejects invalid status', () => {
    expect(projectSchema.safeParse({ title: 'Test', status: 'invalid' }).success).toBe(false)
  })

  it('rejects empty title', () => {
    expect(projectSchema.safeParse({ title: '' }).success).toBe(false)
  })
})

describe('imageUploadSchema', () => {
  it('accepts valid jpeg under 5MB', () => {
    expect(imageUploadSchema.safeParse({ size: 1024 * 1024, type: 'image/jpeg' }).success).toBe(true)
  })

  it('rejects files over 5MB', () => {
    expect(imageUploadSchema.safeParse({ size: 6 * 1024 * 1024, type: 'image/jpeg' }).success).toBe(false)
  })

  it('rejects gif type', () => {
    expect(imageUploadSchema.safeParse({ size: 1024, type: 'image/gif' }).success).toBe(false)
  })
})
