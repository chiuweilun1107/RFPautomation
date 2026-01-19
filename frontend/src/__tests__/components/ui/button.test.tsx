import React from 'react'
import { render, screen, fireEvent } from '@/__tests__/utils/test-utils'
import '@testing-library/jest-dom'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('should render button with default variant', () => {
      render(<Button>Default</Button>)
      const button = screen.getByText('Default')
      expect(button).toHaveClass('bg-primary')
    })

    it('should apply custom className', () => {
      render(<Button className="custom-class">Button</Button>)
      const button = screen.getByText('Button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('Variants', () => {
    it('should render destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>)
      const button = screen.getByText('Delete')
      expect(button).toHaveClass('bg-destructive')
    })

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>)
      const button = screen.getByText('Outline')
      expect(button).toHaveClass('border')
    })

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByText('Secondary')
      expect(button).toHaveClass('bg-secondary')
    })

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByText('Ghost')
      expect(button).toHaveClass('hover:bg-accent')
    })

    it('should render link variant', () => {
      render(<Button variant="link">Link</Button>)
      const button = screen.getByText('Link')
      expect(button).toHaveClass('underline-offset-4')
    })
  })

  describe('Sizes', () => {
    it('should render default size', () => {
      render(<Button size="default">Default Size</Button>)
      const button = screen.getByText('Default Size')
      expect(button).toHaveClass('h-9')
    })

    it('should render small size', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByText('Small')
      expect(button).toHaveClass('h-8')
    })

    it('should render large size', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByText('Large')
      expect(button).toHaveClass('h-10')
    })

    it('should render icon size', () => {
      render(<Button size="icon" aria-label="Icon button">X</Button>)
      const button = screen.getByLabelText('Icon button')
      expect(button).toHaveClass('size-9')
    })
  })

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByText('Disabled')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:opacity-50')
    })

    it('should not be disabled by default', () => {
      render(<Button>Enabled</Button>)
      const button = screen.getByText('Enabled')
      expect(button).not.toBeDisabled()
    })
  })

  describe('Interactions', () => {
    it('should call onClick handler when clicked', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      const button = screen.getByText('Click me')
      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick when disabled', () => {
      const handleClick = jest.fn()
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      )
      const button = screen.getByText('Disabled')
      fireEvent.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have button role', () => {
      render(<Button>Button</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should support aria-label', () => {
      render(<Button aria-label="Custom label">X</Button>)
      expect(screen.getByLabelText('Custom label')).toBeInTheDocument()
    })

    it('should support aria-disabled', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByText('Disabled')
      expect(button).toHaveAttribute('disabled')
    })
  })

  describe('Type Attribute', () => {
    it('should have button type by default', () => {
      render(<Button>Submit</Button>)
      const button = screen.getByText('Submit')
      expect(button).toHaveAttribute('type', 'button')
    })

    it('should accept submit type', () => {
      render(<Button type="submit">Submit</Button>)
      const button = screen.getByText('Submit')
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('should accept reset type', () => {
      render(<Button type="reset">Reset</Button>)
      const button = screen.getByText('Reset')
      expect(button).toHaveAttribute('type', 'reset')
    })
  })
})
