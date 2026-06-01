import { describe, it, expect } from 'vitest'
import { slugify, formatCurrency, formatDate, formatRelativeDate, cn } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('resolves tailwind conflicts', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'never', 'always')).toBe('base always')
  })
})

describe('slugify', () => {
  it('converts spaces to hyphens and lowercases', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('removes Portuguese diacritics', () => {
    expect(slugify('Não é fácil')).toBe('nao-e-facil')
  })

  it('removes leading and trailing hyphens', () => {
    expect(slugify('  hello  ')).toBe('hello')
  })

  it('collapses multiple separators', () => {
    expect(slugify('hello---world')).toBe('hello-world')
  })

  it('handles already clean slug', () => {
    expect(slugify('my-workspace')).toBe('my-workspace')
  })
})

describe('formatCurrency', () => {
  it('formats BRL currency with R$ prefix', () => {
    const result = formatCurrency(1500)
    expect(result).toMatch(/R\$/)
    expect(result).toMatch(/1\.500/)
  })

  it('handles zero', () => {
    const result = formatCurrency(0)
    expect(result).toMatch(/0/)
  })

  it('handles large values', () => {
    const result = formatCurrency(1000000)
    expect(result).toMatch(/1\.000\.000/)
  })

  it('returns a string', () => {
    expect(typeof formatCurrency(42)).toBe('string')
  })
})

describe('formatDate', () => {
  it('returns a string', () => {
    expect(typeof formatDate('2024-01-15')).toBe('string')
  })

  it('includes the day number', () => {
    const result = formatDate('2024-06-20')
    expect(result).toMatch(/20/)
  })

  it('formats using pt-BR locale separators (/ or .)', () => {
    const result = formatDate('2024-01-15')
    expect(result).toMatch(/[\/.]/)
  })
})

describe('formatRelativeDate', () => {
  it('returns "Hoje" for today', () => {
    const today = new Date().toISOString()
    expect(formatRelativeDate(today)).toBe('Hoje')
  })

  it('returns "Ontem" for yesterday', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString()
    expect(formatRelativeDate(yesterday)).toBe('Ontem')
  })

  it('returns days count for recent dates', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString()
    expect(formatRelativeDate(threeDaysAgo)).toBe('3 dias atrás')
  })
})
