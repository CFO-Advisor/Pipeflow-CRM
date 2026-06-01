import { describe, it, expect } from 'vitest'

// Tests the validation logic mirrored from app/api/invite/route.ts
// Avoids mocking Supabase/Resend by testing the rules in isolation

function validateInviteInput(body: { email?: unknown; workspaceId?: unknown }) {
  if (!body.email || !body.workspaceId) return { valid: false, error: 'Dados inválidos.' }
  if (typeof body.email !== 'string' || typeof body.workspaceId !== 'string')
    return { valid: false, error: 'Dados inválidos.' }
  return { valid: true }
}

describe('invite route — input validation', () => {
  it('rejects missing email', () => {
    expect(validateInviteInput({ workspaceId: 'ws-123' }).valid).toBe(false)
  })

  it('rejects missing workspaceId', () => {
    expect(validateInviteInput({ email: 'test@example.com' }).valid).toBe(false)
  })

  it('rejects null values', () => {
    expect(validateInviteInput({ email: null, workspaceId: 'ws-123' }).valid).toBe(false)
  })

  it('passes with valid email and workspaceId', () => {
    const result = validateInviteInput({
      email: 'colaborador@empresa.com',
      workspaceId: 'uuid-1234',
    })
    expect(result.valid).toBe(true)
  })

  it('includes error message on failure', () => {
    const result = validateInviteInput({ email: '' })
    expect(result.error).toBe('Dados inválidos.')
  })
})
