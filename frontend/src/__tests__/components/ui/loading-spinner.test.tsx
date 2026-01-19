import React from 'react'
import { render, screen } from '@/__tests__/utils/test-utils'
import '@testing-library/jest-dom'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

describe('LoadingSpinner Component', () => {
  describe('Rendering', () => {
    it('should render loading spinner', () => {
      const { container } = render(<LoadingSpinner />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should have loading-spinner class', () => {
      const { container } = render(<LoadingSpinner />)
      const spinner = container.firstChild as HTMLElement
      expect(spinner).toHaveClass('loading-spinner')
    })

    it('should apply custom className', () => {
      const { container } = render(<LoadingSpinner className="custom-class" />)
      const spinner = container.firstChild as HTMLElement
      expect(spinner).toHaveClass('custom-class')
      expect(spinner).toHaveClass('loading-spinner')
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label for loading state', () => {
      render(<LoadingSpinner />)
      const spinner = screen.getByLabelText('Loading')
      expect(spinner).toBeInTheDocument()
    })

    it('should have role=status', () => {
      render(<LoadingSpinner />)
      const spinner = screen.getByRole('status')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('Sizes', () => {
    it('should render small size', () => {
      const { container } = render(<LoadingSpinner size="sm" />)
      const spinner = container.firstChild as HTMLElement
      expect(spinner).toHaveClass('h-4', 'w-4')
    })

    it('should render medium size by default', () => {
      const { container } = render(<LoadingSpinner />)
      const spinner = container.firstChild as HTMLElement
      expect(spinner).toHaveClass('h-8', 'w-8')
    })

    it('should render large size', () => {
      const { container } = render(<LoadingSpinner size="lg" />)
      const spinner = container.firstChild as HTMLElement
      expect(spinner).toHaveClass('h-12', 'w-12')
    })
  })
})
