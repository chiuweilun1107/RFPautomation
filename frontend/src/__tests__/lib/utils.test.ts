import { cn } from '@/lib/utils'

describe('utils', () => {
  describe('cn (className merge)', () => {
    it('should merge multiple class names', () => {
      const result = cn('class1', 'class2', 'class3')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).toContain('class3')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const result = cn('base', isActive && 'active')
      expect(result).toContain('base')
      expect(result).toContain('active')
    })

    it('should filter out falsy values', () => {
      const result = cn('class1', false, null, undefined, 'class2')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).not.toContain('false')
      expect(result).not.toContain('null')
    })

    it('should handle Tailwind CSS conflicts', () => {
      const result = cn('px-4', 'px-6')
      // Should only contain one px- class (the last one)
      expect(result).toBe('px-6')
    })

    it('should handle array inputs', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).toContain('class3')
    })

    it('should handle object inputs', () => {
      const result = cn({
        'class1': true,
        'class2': false,
        'class3': true,
      })
      expect(result).toContain('class1')
      expect(result).not.toContain('class2')
      expect(result).toContain('class3')
    })

    it('should handle empty inputs', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle mixed input types', () => {
      const result = cn(
        'base',
        ['array-class'],
        { 'object-class': true },
        false && 'conditional',
        'final'
      )
      expect(result).toContain('base')
      expect(result).toContain('array-class')
      expect(result).toContain('object-class')
      expect(result).toContain('final')
      expect(result).not.toContain('conditional')
    })

    it('should handle duplicate classes', () => {
      // cn doesn't deduplicate by default, it merges Tailwind conflicts
      const result = cn('duplicate', 'duplicate', 'duplicate')
      expect(result).toContain('duplicate')
    })

    it('should handle complex Tailwind utilities', () => {
      const result = cn(
        'flex items-center justify-between',
        'px-4 py-2',
        'bg-blue-500 hover:bg-blue-600',
        'rounded-lg shadow-md'
      )
      expect(result).toContain('flex')
      expect(result).toContain('items-center')
      expect(result).toContain('justify-between')
      expect(result).toContain('px-4')
      expect(result).toContain('py-2')
      expect(result).toContain('bg-blue-500')
      expect(result).toContain('hover:bg-blue-600')
      expect(result).toContain('rounded-lg')
      expect(result).toContain('shadow-md')
    })
  })
})
