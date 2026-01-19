import { renderHook } from '@testing-library/react'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'

describe('useKeyboardShortcut', () => {
  let handler: jest.Mock

  beforeEach(() => {
    handler = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Functionality', () => {
    it('should call handler when key is pressed', () => {
      renderHook(() => useKeyboardShortcut({ key: 'Escape' }, handler))

      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(event)
    })

    it('should not call handler for different key', () => {
      renderHook(() => useKeyboardShortcut({ key: 'Escape' }, handler))

      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      document.dispatchEvent(event)

      expect(handler).not.toHaveBeenCalled()
    })

    it('should handle multiple key presses', () => {
      renderHook(() => useKeyboardShortcut({ key: 'Escape' }, handler))

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

      expect(handler).toHaveBeenCalledTimes(3)
    })
  })

  describe('Modifier Keys', () => {
    it('should call handler when ctrlKey is pressed', () => {
      renderHook(() =>
        useKeyboardShortcut({ key: 'k', ctrlKey: true }, handler)
      )

      const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })
      document.dispatchEvent(event)

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should not call handler when ctrlKey is not pressed', () => {
      renderHook(() =>
        useKeyboardShortcut({ key: 'k', ctrlKey: true }, handler)
      )

      const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: false })
      document.dispatchEvent(event)

      expect(handler).not.toHaveBeenCalled()
    })

    it('should call handler when shiftKey is pressed', () => {
      renderHook(() =>
        useKeyboardShortcut({ key: 'S', shiftKey: true }, handler)
      )

      const event = new KeyboardEvent('keydown', { key: 'S', shiftKey: true })
      document.dispatchEvent(event)

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should call handler when altKey is pressed', () => {
      renderHook(() =>
        useKeyboardShortcut({ key: 'a', altKey: true }, handler)
      )

      const event = new KeyboardEvent('keydown', { key: 'a', altKey: true })
      document.dispatchEvent(event)

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should call handler when metaKey is pressed', () => {
      renderHook(() =>
        useKeyboardShortcut({ key: 'm', metaKey: true }, handler)
      )

      const event = new KeyboardEvent('keydown', { key: 'm', metaKey: true })
      document.dispatchEvent(event)

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple modifier keys', () => {
      renderHook(() =>
        useKeyboardShortcut(
          { key: 'k', ctrlKey: true, shiftKey: true },
          handler
        )
      )

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        shiftKey: true,
      })
      document.dispatchEvent(event)

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should not call handler if modifier key mismatch', () => {
      renderHook(() =>
        useKeyboardShortcut(
          { key: 'k', ctrlKey: true, shiftKey: true },
          handler
        )
      )

      // Only ctrlKey, missing shiftKey
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        shiftKey: false,
      })
      document.dispatchEvent(event)

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('Enabled State', () => {
    it('should call handler when enabled is true', () => {
      renderHook(() =>
        useKeyboardShortcut({ key: 'Escape', enabled: true }, handler)
      )

      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should not call handler when enabled is false', () => {
      renderHook(() =>
        useKeyboardShortcut({ key: 'Escape', enabled: false }, handler)
      )

      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)

      expect(handler).not.toHaveBeenCalled()
    })

    it('should call handler when enabled is undefined (default true)', () => {
      renderHook(() => useKeyboardShortcut({ key: 'Escape' }, handler))

      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should toggle handler based on enabled state changes', () => {
      const { rerender } = renderHook(
        ({ enabled }) => useKeyboardShortcut({ key: 'Escape', enabled }, handler),
        { initialProps: { enabled: true } }
      )

      // Enabled, should call
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      expect(handler).toHaveBeenCalledTimes(1)

      // Disable
      rerender({ enabled: false })
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      expect(handler).toHaveBeenCalledTimes(1) // Still 1

      // Re-enable
      rerender({ enabled: true })
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      expect(handler).toHaveBeenCalledTimes(2)
    })
  })

  describe('Cleanup', () => {
    it('should remove event listener on unmount', () => {
      const { unmount } = renderHook(() =>
        useKeyboardShortcut({ key: 'Escape' }, handler)
      )

      unmount()

      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)

      expect(handler).not.toHaveBeenCalled()
    })

    it('should update listener when handler changes', () => {
      const handler1 = jest.fn()
      const handler2 = jest.fn()

      const { rerender } = renderHook(
        ({ handler }) => useKeyboardShortcut({ key: 'Escape' }, handler),
        { initialProps: { handler: handler1 } }
      )

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).not.toHaveBeenCalled()

      rerender({ handler: handler2 })

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })
  })

  describe('Special Keys', () => {
    it('should handle Escape key', () => {
      renderHook(() => useKeyboardShortcut({ key: 'Escape' }, handler))

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should handle Enter key', () => {
      renderHook(() => useKeyboardShortcut({ key: 'Enter' }, handler))

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should handle Tab key', () => {
      renderHook(() => useKeyboardShortcut({ key: 'Tab' }, handler))

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should handle Space key', () => {
      renderHook(() => useKeyboardShortcut({ key: ' ' }, handler))

      document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should handle Arrow keys', () => {
      const handlers = {
        up: jest.fn(),
        down: jest.fn(),
        left: jest.fn(),
        right: jest.fn(),
      }

      renderHook(() => {
        useKeyboardShortcut({ key: 'ArrowUp' }, handlers.up)
        useKeyboardShortcut({ key: 'ArrowDown' }, handlers.down)
        useKeyboardShortcut({ key: 'ArrowLeft' }, handlers.left)
        useKeyboardShortcut({ key: 'ArrowRight' }, handlers.right)
      })

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))

      expect(handlers.up).toHaveBeenCalledTimes(1)
      expect(handlers.down).toHaveBeenCalledTimes(1)
      expect(handlers.left).toHaveBeenCalledTimes(1)
      expect(handlers.right).toHaveBeenCalledTimes(1)
    })
  })
})
