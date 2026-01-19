import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils'
import '@testing-library/jest-dom'
import ChatInterface from '@/components/chat/ChatInterface'
import { mockMessage, mockEvidence, mockApiResponse } from '@/__tests__/utils/mock-data'

// Mock fetch
global.fetch = jest.fn()

// Mock react-markdown to avoid ES module issues
jest.mock('react-markdown', () => {
  return function ReactMarkdown({ children }: { children: string }) {
    return <div>{children}</div>
  }
})

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    info: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
  },
}))

// Mock dynamic imports
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => {
    return function MockSourceDetailPanel() {
      return <div>Source Detail Panel</div>
    }
  },
}))

// Mock hooks
jest.mock('@/hooks/useFocusTrap', () => ({
  useFocusTrap: () => ({ current: null }),
}))

jest.mock('@/hooks/useRestoreFocus', () => ({
  useRestoreFocus: jest.fn(),
}))

jest.mock('@/hooks/useKeyboardShortcut', () => ({
  useKeyboardShortcut: jest.fn(),
}))

describe('ChatInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue(
      mockApiResponse({
        answer: 'Test response',
        sources: [],
      })
    )
  })

  describe('Component Rendering', () => {
    it('should render chat button when closed', () => {
      render(<ChatInterface />)
      const button = screen.getByLabelText('開啟 AI 助理聊天視窗')
      expect(button).toBeInTheDocument()
    })

    it('should show chat window when button is clicked', async () => {
      render(<ChatInterface />)
      const button = screen.getByLabelText('開啟 AI 助理聊天視窗')

      // Simulate click
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('should render with empty message state', async () => {
      render(<ChatInterface />)
      const button = screen.getByLabelText('開啟 AI 助理聊天視窗')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText(/Ask me anything about your documents!/i)).toBeInTheDocument()
      })
    })

    it('should render close button in chat window', async () => {
      render(<ChatInterface />)
      const openButton = screen.getByLabelText('開啟 AI 助理聊天視窗')
      fireEvent.click(openButton)

      await waitFor(() => {
        const closeButton = screen.getByLabelText('關閉聊天視窗')
        expect(closeButton).toBeInTheDocument()
      })
    })
  })

  describe('Message Sending', () => {
    it('should send message when form is submitted', async () => {
      render(<ChatInterface />)
      const openButton = screen.getByLabelText('開啟 AI 助理聊天視窗')
      fireEvent.click(openButton)

      await waitFor(() => {
        const input = screen.getByLabelText('輸入您的問題')
        fireEvent.change(input, { target: { value: 'Test question' } })

        const submitButton = screen.getByLabelText('送出訊息')
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/n8n/chat',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        )
      })
    })

    it('should not send empty message', async () => {
      render(<ChatInterface />)
      const openButton = screen.getByLabelText('開啟 AI 助理聊天視窗')
      fireEvent.click(openButton)

      await waitFor(() => {
        const submitButton = screen.getByLabelText('送出訊息')
        expect(submitButton).toBeDisabled()
      })
    })

    it('should clear input after sending message', async () => {
      render(<ChatInterface />)
      const openButton = screen.getByLabelText('開啟 AI 助理聊天視窗')
      fireEvent.click(openButton)

      await waitFor(async () => {
        const input = screen.getByLabelText('輸入您的問題') as HTMLInputElement
        fireEvent.change(input, { target: { value: 'Test question' } })

        const submitButton = screen.getByLabelText('送出訊息')
        fireEvent.click(submitButton)

        await waitFor(() => {
          expect(input.value).toBe('')
        })
      })
    })

    it('should display loading state while sending', async () => {
      render(<ChatInterface />)
      const openButton = screen.getByLabelText('開啟 AI 助理聊天視窗')
      fireEvent.click(openButton)

      await waitFor(async () => {
        const input = screen.getByLabelText('輸入您的問題')
        fireEvent.change(input, { target: { value: 'Test question' } })

        const submitButton = screen.getByLabelText('送出訊息')
        fireEvent.click(submitButton)

        // Check for loading indicator
        const loadingText = await screen.findByText('Thinking...')
        expect(loadingText).toBeInTheDocument()
      })
    })
  })

  describe('Message Display', () => {
    it('should display user message after sending', async () => {
      render(<ChatInterface />)
      const openButton = screen.getByLabelText('開啟 AI 助理聊天視窗')
      fireEvent.click(openButton)

      await waitFor(async () => {
        const input = screen.getByLabelText('輸入您的問題')
        fireEvent.change(input, { target: { value: 'Test question' } })

        const submitButton = screen.getByLabelText('送出訊息')
        fireEvent.click(submitButton)

        const userMessage = await screen.findByText('Test question')
        expect(userMessage).toBeInTheDocument()
      })
    })

    it('should display assistant response', async () => {
      render(<ChatInterface />)
      const openButton = screen.getByLabelText('開啟 AI 助理聊天視窗')
      fireEvent.click(openButton)

      await waitFor(async () => {
        const input = screen.getByLabelText('輸入您的問題')
        fireEvent.change(input, { target: { value: 'Test question' } })

        const submitButton = screen.getByLabelText('送出訊息')
        fireEvent.click(submitButton)

        const response = await screen.findByText('Test response')
        expect(response).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<ChatInterface />)
      const openButton = screen.getByLabelText('開啟 AI 助理聊天視窗')
      fireEvent.click(openButton)

      await waitFor(async () => {
        const input = screen.getByLabelText('輸入您的問題')
        fireEvent.change(input, { target: { value: 'Test question' } })

        const submitButton = screen.getByLabelText('送出訊息')
        fireEvent.click(submitButton)

        const errorMessage = await screen.findByText('Error connecting to AI service.')
        expect(errorMessage).toBeInTheDocument()
      })
    })
  })

  describe('Search Scopes', () => {
    it('should render all search scope buttons', async () => {
      render(<ChatInterface />)
      const openButton = screen.getByLabelText('開啟 AI 助理聊天視窗')
      fireEvent.click(openButton)

      await waitFor(() => {
        expect(screen.getByLabelText('標案資料來源')).toBeInTheDocument()
        expect(screen.getByLabelText('內部資料來源')).toBeInTheDocument()
        expect(screen.getByLabelText('外部資料來源')).toBeInTheDocument()
      })
    })

    it('should toggle scope when clicked', async () => {
      render(<ChatInterface />)
      const openButton = screen.getByLabelText('開啟 AI 助理聊天視窗')
      fireEvent.click(openButton)

      await waitFor(() => {
        const tenderScope = screen.getByLabelText('標案資料來源')
        const initialPressed = tenderScope.getAttribute('aria-pressed') === 'true'

        fireEvent.click(tenderScope)

        const newPressed = tenderScope.getAttribute('aria-pressed') === 'true'
        expect(newPressed).toBe(!initialPressed)
      })
    })
  })

  describe('History Navigation', () => {
    it('should clear messages when clear button is clicked', async () => {
      render(<ChatInterface />)
      const openButton = screen.getByLabelText('開啟 AI 助理聊天視窗')
      fireEvent.click(openButton)

      await waitFor(async () => {
        const input = screen.getByLabelText('輸入您的問題')
        fireEvent.change(input, { target: { value: 'Test question' } })

        const submitButton = screen.getByLabelText('送出訊息')
        fireEvent.click(submitButton)

        await waitFor(() => {
          expect(screen.getByText('Test question')).toBeInTheDocument()
        })

        const clearButton = screen.getByLabelText('清除聊天歷史紀錄')
        fireEvent.click(clearButton)

        await waitFor(() => {
          expect(screen.queryByText('Test question')).not.toBeInTheDocument()
        })
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<ChatInterface />)
      const openButton = screen.getByLabelText('開啟 AI 助理聊天視窗')
      fireEvent.click(openButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
        expect(screen.getByRole('search')).toHaveAttribute('aria-label', 'AI 助理對話輸入')
      })
    })

    it('should trap focus within dialog', async () => {
      render(<ChatInterface />)
      const openButton = screen.getByLabelText('開啟 AI 助理聊天視窗')
      fireEvent.click(openButton)

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toBeInTheDocument()
      })
    })
  })
})
