import React from 'react'
import { render, screen } from '@/__tests__/utils/test-utils'
import '@testing-library/jest-dom'
import { Label } from '@/components/ui/label'

describe('Label Component', () => {
  describe('Rendering', () => {
    it('should render label with text', () => {
      render(<Label>Label Text</Label>)
      expect(screen.getByText('Label Text')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<Label className="custom-label">Label</Label>)
      const label = screen.getByText('Label')
      expect(label).toHaveClass('custom-label')
    })
  })

  describe('Accessibility', () => {
    it('should associate with form control using htmlFor', () => {
      render(
        <>
          <Label htmlFor="test-input">Username</Label>
          <input id="test-input" type="text" />
        </>
      )
      const label = screen.getByText('Username')
      expect(label).toHaveAttribute('for', 'test-input')
    })
  })

  describe('Required indicator', () => {
    it('should show asterisk when required', () => {
      render(<Label required>Required Field</Label>)
      const label = screen.getByText(/Required Field/)
      expect(label).toBeInTheDocument()
    })

    it('should not show asterisk when not required', () => {
      render(<Label>Optional Field</Label>)
      const label = screen.getByText('Optional Field')
      expect(label.textContent).toBe('Optional Field')
    })
  })
})
