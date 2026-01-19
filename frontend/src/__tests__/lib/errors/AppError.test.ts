import {
  AppError,
  ErrorCode,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalError,
  ServiceUnavailableError,
  ExternalApiError,
  DatabaseError,
  WorkflowError,
  ParsingError,
  GenerationError,
  isAppError,
  isOperationalError,
} from '@/lib/errors/AppError'

describe('AppError Classes', () => {
  describe('AppError Base Class', () => {
    it('should create basic AppError', () => {
      const error = new AppError('Test error', ErrorCode.INTERNAL_ERROR, 500)
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
      expect(error.message).toBe('Test error')
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR)
      expect(error.statusCode).toBe(500)
      expect(error.isOperational).toBe(true)
    })

    it('should create AppError with context', () => {
      const context = { userId: '123', action: 'delete' }
      const error = new AppError('Test error', ErrorCode.BAD_REQUEST, 400, true, context)
      expect(error.context).toEqual(context)
    })

    it('should have timestamp', () => {
      const before = new Date().toISOString()
      const error = new AppError('Test', ErrorCode.INTERNAL_ERROR, 500)
      const after = new Date().toISOString()

      expect(error.timestamp).toBeDefined()
      expect(error.timestamp).toBeGreaterThanOrEqual(before)
      expect(error.timestamp).toBeLessThanOrEqual(after)
    })

    it('should serialize to JSON', () => {
      const error = new AppError('Test error', ErrorCode.BAD_REQUEST, 400)
      const json = error.toJSON()

      expect(json.name).toBe('AppError')
      expect(json.message).toBe('Test error')
      expect(json.code).toBe(ErrorCode.BAD_REQUEST)
      expect(json.statusCode).toBe(400)
      expect(json.timestamp).toBeDefined()
    })
  })

  describe('Client Error Classes (4xx)', () => {
    it('should create BadRequestError', () => {
      const error = new BadRequestError('Invalid input')
      expect(error).toBeInstanceOf(AppError)
      expect(error.message).toBe('Invalid input')
      expect(error.code).toBe(ErrorCode.BAD_REQUEST)
      expect(error.statusCode).toBe(400)
      expect(error.isOperational).toBe(true)
    })

    it('should create BadRequestError with default message', () => {
      const error = new BadRequestError()
      expect(error.message).toBe('Bad Request')
    })

    it('should create UnauthorizedError', () => {
      const error = new UnauthorizedError('Not authenticated')
      expect(error.message).toBe('Not authenticated')
      expect(error.code).toBe(ErrorCode.UNAUTHORIZED)
      expect(error.statusCode).toBe(401)
    })

    it('should create ForbiddenError', () => {
      const error = new ForbiddenError('Access denied')
      expect(error.message).toBe('Access denied')
      expect(error.code).toBe(ErrorCode.FORBIDDEN)
      expect(error.statusCode).toBe(403)
    })

    it('should create NotFoundError', () => {
      const error = new NotFoundError('User')
      expect(error.message).toBe('User not found')
      expect(error.code).toBe(ErrorCode.NOT_FOUND)
      expect(error.statusCode).toBe(404)
    })

    it('should create ConflictError', () => {
      const error = new ConflictError('Resource already exists')
      expect(error.message).toBe('Resource already exists')
      expect(error.code).toBe(ErrorCode.CONFLICT)
      expect(error.statusCode).toBe(409)
    })

    it('should create ValidationError', () => {
      const error = new ValidationError('Email is required')
      expect(error.message).toBe('Email is required')
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(error.statusCode).toBe(422)
    })

    it('should create RateLimitError', () => {
      const error = new RateLimitError('Too many requests')
      expect(error.message).toBe('Too many requests')
      expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED)
      expect(error.statusCode).toBe(429)
    })
  })

  describe('Server Error Classes (5xx)', () => {
    it('should create InternalError', () => {
      const error = new InternalError('Something went wrong')
      expect(error.message).toBe('Something went wrong')
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR)
      expect(error.statusCode).toBe(500)
      expect(error.isOperational).toBe(false)
    })

    it('should create ServiceUnavailableError', () => {
      const error = new ServiceUnavailableError('Database')
      expect(error.message).toBe('Database is unavailable')
      expect(error.code).toBe(ErrorCode.SERVICE_UNAVAILABLE)
      expect(error.statusCode).toBe(503)
    })

    it('should create ExternalApiError', () => {
      const error = new ExternalApiError('OpenAI', 'API key invalid')
      expect(error.message).toBe('API key invalid')
      expect(error.code).toBe(ErrorCode.EXTERNAL_API_ERROR)
      expect(error.statusCode).toBe(502)
    })

    it('should create ExternalApiError with default message', () => {
      const error = new ExternalApiError('OpenAI')
      expect(error.message).toBe('External API error: OpenAI')
    })

    it('should create DatabaseError', () => {
      const error = new DatabaseError('Connection timeout')
      expect(error.message).toBe('Connection timeout')
      expect(error.code).toBe(ErrorCode.DATABASE_ERROR)
      expect(error.statusCode).toBe(500)
    })
  })

  describe('Business Logic Error Classes', () => {
    it('should create WorkflowError', () => {
      const error = new WorkflowError('Workflow execution failed')
      expect(error.message).toBe('Workflow execution failed')
      expect(error.code).toBe(ErrorCode.WORKFLOW_ERROR)
      expect(error.statusCode).toBe(500)
    })

    it('should create ParsingError', () => {
      const error = new ParsingError('Unable to parse PDF')
      expect(error.message).toBe('Unable to parse PDF')
      expect(error.code).toBe(ErrorCode.PARSING_ERROR)
      expect(error.statusCode).toBe(500)
    })

    it('should create ParsingError with default message', () => {
      const error = new ParsingError()
      expect(error.message).toBe('Failed to parse content')
    })

    it('should create GenerationError', () => {
      const error = new GenerationError('AI generation failed')
      expect(error.message).toBe('AI generation failed')
      expect(error.code).toBe(ErrorCode.GENERATION_ERROR)
      expect(error.statusCode).toBe(500)
    })
  })

  describe('Type Guards', () => {
    it('should identify AppError instances', () => {
      const appError = new AppError('Test', ErrorCode.INTERNAL_ERROR, 500)
      const regularError = new Error('Regular error')
      const notAnError = { message: 'Not an error' }

      expect(isAppError(appError)).toBe(true)
      expect(isAppError(regularError)).toBe(false)
      expect(isAppError(notAnError)).toBe(false)
      expect(isAppError(null)).toBe(false)
      expect(isAppError(undefined)).toBe(false)
    })

    it('should identify operational errors', () => {
      const operationalError = new BadRequestError()
      const nonOperationalError = new InternalError()
      const regularError = new Error()

      expect(isOperationalError(operationalError)).toBe(true)
      expect(isOperationalError(nonOperationalError)).toBe(false)
      expect(isOperationalError(regularError)).toBe(false)
    })
  })

  describe('Error Context', () => {
    it('should support complex context objects', () => {
      const context = {
        userId: '123',
        action: 'delete',
        resource: { id: '456', type: 'document' },
        metadata: { timestamp: Date.now() },
      }
      const error = new BadRequestError('Invalid operation', context)
      expect(error.context).toEqual(context)
    })

    it('should handle undefined context', () => {
      const error = new BadRequestError('Test')
      expect(error.context).toBeUndefined()
    })
  })

  describe('Error Inheritance', () => {
    it('should maintain prototype chain', () => {
      const error = new BadRequestError()
      expect(error instanceof AppError).toBe(true)
      expect(error instanceof Error).toBe(true)
    })

    it('should have correct constructor name', () => {
      const badRequest = new BadRequestError()
      const notFound = new NotFoundError()

      expect(badRequest.name).toBe('BadRequestError')
      expect(notFound.name).toBe('NotFoundError')
    })
  })
})
