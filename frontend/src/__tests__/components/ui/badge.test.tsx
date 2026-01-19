import React from 'react'
import { render, screen } from '@/__tests__/utils/test-utils'
import '@testing-library/jest-dom'
import { Badge } from '@/components/ui/badge'

describe('Badge Component', () => {
  describe('Rendering', () => {
    it('should render badge with text', () => {
      render(<Badge>Badge Text</Badge>)
      expect(screen.getByText('Badge Text')).toBeInTheDocument()
    })

    it('should render with default variant', () => {
      render(<Badge>Default</Badge>)
      const badge = screen.getByText('Default')
      expect(badge).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<Badge className="custom-badge">Badge</Badge>)
      const badge = screen.getByText('Badge')
      expect(badge).toHaveClass('custom-badge')
    })
  })

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Badge variant="default">Default</Badge>)
      const badge = screen.getByText('Default')
      expect(badge).toBeInTheDocument()
    })

    it('should render secondary variant', () => {
      render(<Badge variant="secondary">Secondary</Badge>)
      const badge = screen.getByText('Secondary')
      expect(badge).toBeInTheDocument()
    })

    it('should render destructive variant', () => {
      render(<Badge variant="destructive">Destructive</Badge>)
      const badge = screen.getByText('Destructive')
      expect(badge).toBeInTheDocument()
    })

    it('should render outline variant', () => {
      render(<Badge variant="outline">Outline</Badge>)
      const badge = screen.getByText('Outline')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Content', () => {
    it('should render with number content', () => {
      render(<Badge>42</Badge>)
      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('should render with icon', () => {
      render(
        <Badge>
          <span data-testid="icon">✓</span> Success
        </Badge>
      )
      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByText('Success')).toBeInTheDocument()
    })

    it('should render empty badge', () => {
      const { container } = render(<Badge />)
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('Multiple Badges', () => {
    it('should render multiple badges', () => {
      render(
        <div>
          <Badge>Badge 1</Badge>
          <Badge>Badge 2</Badge>
          <Badge>Badge 3</Badge>
        </div>
      )
      expect(screen.getByText('Badge 1')).toBeInTheDocument()
      expect(screen.getByText('Badge 2')).toBeInTheDocument()
      expect(screen.getByText('Badge 3')).toBeInTheDocument()
    })

    it('should render badges with different variants', () => {
      render(
        <div>
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      )
      expect(screen.getByText('Default')).toBeInTheDocument()
      expect(screen.getByText('Secondary')).toBeInTheDocument()
      expect(screen.getByText('Destructive')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should support aria-label', () => {
      render(<Badge aria-label="Status badge">Active</Badge>)
      const badge = screen.getByLabelText('Status badge')
      expect(badge).toBeInTheDocument()
    })

    it('should support role attribute', () => {
      render(<Badge role="status">Status</Badge>)
      const badge = screen.getByRole('status')
      expect(badge).toBeInTheDocument()
    })
  })
})
