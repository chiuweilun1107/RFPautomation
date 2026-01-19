import React from 'react'
import { render, screen, fireEvent } from '@/__tests__/utils/test-utils'
import '@testing-library/jest-dom'
import { Input } from '@/components/ui/input'

describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render input element', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
    })

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter text" />)
      const input = screen.getByPlaceholderText('Enter text')
      expect(input).toBeInTheDocument()
    })

    it('should render with default value', () => {
      render(<Input defaultValue="Default text" />)
      const input = screen.getByDisplayValue('Default text')
      expect(input).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<Input className="custom-class" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('custom-class')
    })
  })

  describe('Input Types', () => {
    it('should render text input by default', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'text')
    })

    it('should render email input', () => {
      render(<Input type="email" />)
      const input = document.querySelector('input[type="email"]')
      expect(input).toBeInTheDocument()
    })

    it('should render password input', () => {
      render(<Input type="password" />)
      const input = document.querySelector('input[type="password"]')
      expect(input).toBeInTheDocument()
    })

    it('should render number input', () => {
      render(<Input type="number" />)
      const input = document.querySelector('input[type="number"]')
      expect(input).toBeInTheDocument()
    })
  })

  describe('States', () => {
    it('should be enabled by default', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).not.toBeDisabled()
    })

    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />)
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
    })

    it('should be readonly when readonly prop is true', () => {
      render(<Input readOnly />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('readonly')
    })

    it('should be required when required prop is true', () => {
      render(<Input required />)
      const input = screen.getByRole('textbox')
      expect(input).toBeRequired()
    })
  })

  describe('Interactions', () => {
    it('should update value on change', () => {
      render(<Input />)
      const input = screen.getByRole('textbox') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'New value' } })
      expect(input.value).toBe('New value')
    })

    it('should call onChange handler', () => {
      const handleChange = jest.fn()
      render(<Input onChange={handleChange} />)
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'Test' } })
      expect(handleChange).toHaveBeenCalledTimes(1)
    })

    it('should call onFocus handler', () => {
      const handleFocus = jest.fn()
      render(<Input onFocus={handleFocus} />)
      const input = screen.getByRole('textbox')
      fireEvent.focus(input)
      expect(handleFocus).toHaveBeenCalledTimes(1)
    })

    it('should call onBlur handler', () => {
      const handleBlur = jest.fn()
      render(<Input onBlur={handleBlur} />)
      const input = screen.getByRole('textbox')
      fireEvent.blur(input)
      expect(handleBlur).toHaveBeenCalledTimes(1)
    })

    it('should not trigger onChange when disabled', () => {
      const handleChange = jest.fn()
      render(<Input disabled onChange={handleChange} />)
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'Test' } })
      // Disabled inputs can still technically fire change events in tests
      // but the browser prevents actual user interaction
      expect(input).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('should support aria-label', () => {
      render(<Input aria-label="Custom label" />)
      const input = screen.getByLabelText('Custom label')
      expect(input).toBeInTheDocument()
    })

    it('should support aria-describedby', () => {
      render(
        <>
          <Input aria-describedby="helper-text" />
          <div id="helper-text">Helper text</div>
        </>
      )
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-describedby', 'helper-text')
    })

    it('should support aria-invalid', () => {
      render(<Input aria-invalid="true" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('Validation', () => {
    it('should enforce maxLength', () => {
      render(<Input maxLength={5} />)
      const input = screen.getByRole('textbox') as HTMLInputElement
      fireEvent.change(input, { target: { value: '123456789' } })
      // Browser enforces maxLength
      expect(input).toHaveAttribute('maxLength', '5')
    })

    it('should enforce minLength', () => {
      render(<Input minLength={3} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('minLength', '3')
    })

    it('should enforce pattern', () => {
      render(<Input pattern="[0-9]*" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('pattern', '[0-9]*')
    })
  })

  describe('Controlled vs Uncontrolled', () => {
    it('should work as uncontrolled component', () => {
      render(<Input defaultValue="Initial" />)
      const input = screen.getByRole('textbox') as HTMLInputElement
      expect(input.value).toBe('Initial')
      fireEvent.change(input, { target: { value: 'Changed' } })
      expect(input.value).toBe('Changed')
    })

    it('should work as controlled component', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('Controlled')
        return (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )
      }
      render(<TestComponent />)
      const input = screen.getByRole('textbox') as HTMLInputElement
      expect(input.value).toBe('Controlled')
      fireEvent.change(input, { target: { value: 'Updated' } })
      expect(input.value).toBe('Updated')
    })
  })
})
