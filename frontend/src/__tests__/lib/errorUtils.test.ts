import {
  isError,
  getErrorMessage,
  isApiError,
  getApiErrorMessage,
  isAppError,
} from '@/lib/errorUtils'
import { AppError, ErrorCode } from '@/lib/errors/AppError'

describe('errorUtils', () => {
  describe('isError', () => {
    it('should return true for Error instances', () => {
      const error = new Error('Test error')
      expect(isError(error)).toBe(true)
    })

    it('should return false for non-Error values', () => {
      expect(isError('string')).toBe(false)
      expect(isError(123)).toBe(false)
      expect(isError(null)).toBe(false)
      expect(isError(undefined)).toBe(false)
      expect(isError({})).toBe(false)
    })

    it('should return true for custom Error subclasses', () => {
      class CustomError extends Error {}
      const error = new CustomError('Custom error')
      expect(isError(error)).toBe(true)
    })
  })

  describe('getErrorMessage', () => {
    it('should extract message from Error object', () => {
      const error = new Error('Test error message')
      expect(getErrorMessage(error)).toBe('Test error message')
    })

    it('should return default message for unknown error types', () => {
      expect(getErrorMessage(null)).toBe('An unknown error occurred')
      expect(getErrorMessage(undefined)).toBe('An unknown error occurred')
      expect(getErrorMessage(123)).toBe('An unknown error occurred')
    })

    it('should convert string errors to messages', () => {
      expect(getErrorMessage('String error')).toContain('String error')
    })

    it('should handle objects with toString method', () => {
      // getErrorMessage only handles Error instances and strings
      const obj = { toString: () => 'Object error' }
      // Will return default message for objects
      expect(getErrorMessage(obj)).toBe('An unknown error occurred')
    })
  })

  describe('isApiError', () => {
    it('should return true for objects with error property', () => {
      const apiError = { error: 'API error' }
      expect(isApiError(apiError)).toBe(true)
    })

    it('should return true for objects with message property', () => {
      const apiError = { message: 'API message' }
      expect(isApiError(apiError)).toBe(true)
    })

    it('should return true for objects with both error and message', () => {
      const apiError = { error: 'API error', message: 'API message' }
      expect(isApiError(apiError)).toBe(true)
    })

    it('should return false for non-API error objects', () => {
      expect(isApiError({})).toBe(false)
      expect(isApiError(null)).toBe(false)
      expect(isApiError(undefined)).toBe(false)
      expect(isApiError('string')).toBe(false)
    })

    it('should return true for AppError instances', () => {
      const appError = new AppError('Test error', ErrorCode.BAD_REQUEST, 400)
      expect(isApiError(appError)).toBe(true)
    })
  })

  describe('getApiErrorMessage', () => {
    it('should extract error message from API error response', () => {
      const apiError = { error: 'API error message' }
      expect(getApiErrorMessage(apiError)).toBe('API error message')
    })

    it('should extract message from message property', () => {
      const apiError = { message: 'API message' }
      expect(getApiErrorMessage(apiError)).toBe('API message')
    })

    it('should prioritize error over message', () => {
      const apiError = { error: 'Error message', message: 'Message' }
      expect(getApiErrorMessage(apiError)).toBe('Error message')
    })

    it('should return default message for non-API errors', () => {
      expect(getApiErrorMessage(null)).toBe('Request failed')
      expect(getApiErrorMessage({})).toBe('Request failed')
    })

    it('should use custom default message', () => {
      expect(getApiErrorMessage(null, 'Custom default')).toBe('Custom default')
    })

    it('should handle nested error objects', () => {
      const nestedError = {
        error: {
          message: 'Nested error message',
        },
      }
      expect(getApiErrorMessage(nestedError)).toBe('Nested error message')
    })

    it('should handle AppError instances', () => {
      const appError = new AppError('App error message', ErrorCode.INTERNAL_ERROR, 500)
      expect(getApiErrorMessage(appError)).toBe('App error message')
    })
  })

  describe('AppError', () => {
    it('should create AppError with all properties', () => {
      const context = { key: 'value' }
      const error = new AppError('Test message', ErrorCode.BAD_REQUEST, 400, true, context)
      expect(error.message).toBe('Test message')
      expect(error.code).toBe(ErrorCode.BAD_REQUEST)
      expect(error.statusCode).toBe(400)
      expect(error.context).toEqual(context)
    })

    it('should create AppError with default operational flag', () => {
      const error = new AppError('Test message', ErrorCode.INTERNAL_ERROR, 500)
      expect(error.statusCode).toBe(500)
      expect(error.isOperational).toBe(true)
    })

    it('should be instance of Error', () => {
      const error = new AppError('Test message', ErrorCode.INTERNAL_ERROR, 500)
      expect(error instanceof Error).toBe(true)
    })
  })

  describe('isAppError', () => {
    it('should return true for AppError instances', () => {
      const error = new AppError('Test message', ErrorCode.INTERNAL_ERROR, 500)
      expect(isAppError(error)).toBe(true)
    })

    it('should return false for regular Error instances', () => {
      const error = new Error('Test message')
      expect(isAppError(error)).toBe(false)
    })

    it('should return false for non-error values', () => {
      expect(isAppError(null)).toBe(false)
      expect(isAppError(undefined)).toBe(false)
      expect(isAppError({})).toBe(false)
      expect(isAppError('string')).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle circular references in error objects', () => {
      const circularError: any = { error: 'Circular' }
      circularError.self = circularError
      expect(() => getApiErrorMessage(circularError)).not.toThrow()
    })

    it('should handle very long error messages', () => {
      const longMessage = 'a'.repeat(10000)
      const error = new Error(longMessage)
      expect(getErrorMessage(error)).toBe(longMessage)
    })

    it('should handle errors with special characters', () => {
      const specialError = new Error('Error: 测试 ñ ü \n\t')
      expect(getErrorMessage(specialError)).toBe('Error: 测试 ñ ü \n\t')
    })
  })
})
