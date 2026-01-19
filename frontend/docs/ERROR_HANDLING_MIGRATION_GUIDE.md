# Error Handling Migration Guide

## Overview

This guide provides instructions for migrating existing API routes to use the new unified error handling system.

## New System Components

### 1. Error Classes (`@/lib/errors/AppError`)

Custom error classes for type-safe error handling:

```typescript
- BadRequestError (400)
- UnauthorizedError (401)
- ForbiddenError (403)
- NotFoundError (404)
- ConflictError (409)
- ValidationError (422)
- RateLimitError (429)
- InternalError (500)
- ServiceUnavailableError (503)
- ExternalApiError (502)
- DatabaseError (500)
- WorkflowError (500)
- ParsingError (500)
- GenerationError (500)
```

### 2. Error Handler (`@/lib/errors/error-handler`)

Utilities for consistent error handling:

```typescript
- asyncHandler() - Wraps async handlers with try-catch
- handleError() - Converts errors to standard response
- successResponse() - Creates success responses
- parseRequestBody() - Safe JSON parsing
- validateRequiredFields() - Field validation
- safeDatabaseOperation() - Database error wrapper
- safeExternalApiCall() - External API error wrapper
```

### 3. Logger (`@/lib/errors/logger`)

Structured logging system:

```typescript
- logger.info() - Info messages
- logger.warn() - Warnings
- logger.error() - Errors
- logger.debug() - Debug (dev only)
- logger.apiRequest() - API requests
- logger.apiResponse() - API responses
- logger.dbQuery() - Database queries
- logger.externalApi() - External API calls
```

## Migration Steps

### Step 1: Update Imports

**Before:**
```typescript
import { NextResponse } from "next/server";
import { getErrorMessage } from '@/lib/errorUtils';
```

**After:**
```typescript
import {
  asyncHandler,
  successResponse,
  parseRequestBody,
  validateRequiredFields,
  BadRequestError,
  DatabaseError,
  ExternalApiError,
} from "@/lib/errors";
import { logger, createApiContext } from "@/lib/errors";
```

### Step 2: Define Request Interface

**Before:**
```typescript
export async function POST(request: Request) {
  try {
    const { field1, field2 } = await request.json();
    // ...
  }
}
```

**After:**
```typescript
interface MyRequest {
  field1: string;
  field2?: number;
}

export const POST = asyncHandler(async (request: Request) => {
  const context = createApiContext('POST', '/api/my-route');
  logger.apiRequest('POST', '/api/my-route');

  const body = await parseRequestBody<MyRequest>(request);
  validateRequiredFields(body, ['field1']);
  // ...
});
```

### Step 3: Replace Manual Error Handling

**Before:**
```typescript
if (!field) {
  return NextResponse.json({ error: 'Field required' }, { status: 400 });
}
```

**After:**
```typescript
if (!field) {
  throw new BadRequestError('Field required', { field: 'field1' });
}
```

### Step 4: Replace Database Operations

**Before:**
```typescript
const { data, error } = await supabase.from('table').insert(data);
if (error) {
  console.error('DB Error:', error);
  return NextResponse.json({ error: error.message }, { status: 500 });
}
```

**After:**
```typescript
const { data, error } = await supabase.from('table').insert(data);
if (error) {
  logger.error('Failed to insert', error, context);
  throw new DatabaseError('Failed to insert record', { error: error.message });
}
```

### Step 5: Replace External API Calls

**Before:**
```typescript
const response = await fetch(url);
if (!response.ok) {
  throw new Error(`API error: ${response.statusText}`);
}
```

**After:**
```typescript
logger.externalApi('ServiceName', 'operation', { url });

const response = await fetch(url);
if (!response.ok) {
  logger.error('External API failed', new Error(response.statusText), context);
  throw new ExternalApiError('ServiceName', `Operation failed: ${response.statusText}`, {
    statusCode: response.status,
  });
}
```

### Step 6: Replace Success Responses

**Before:**
```typescript
return NextResponse.json({ success: true, data });
```

**After:**
```typescript
logger.apiResponse('POST', '/api/my-route', 200);
return successResponse({ data }, 200, { message: 'Operation successful' });
```

### Step 7: Remove Manual Try-Catch

**Before:**
```typescript
export async function POST(request: Request) {
  try {
    // ... logic
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
```

**After:**
```typescript
export const POST = asyncHandler(async (request: Request) => {
  // ... logic (no try-catch needed!)
  return successResponse({ success: true });
});
// asyncHandler automatically catches and handles errors
```

## Complete Example

### Before (Old Pattern):

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getErrorMessage } from '@/lib/errorUtils';

export async function POST(request: Request) {
  try {
    const { title, content } = await request.json();

    if (!content || content.length < 10) {
      return NextResponse.json({ error: 'Content too short' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('sources')
      .insert({ title, content })
      .select()
      .single();

    if (error) {
      console.error('DB Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, source: data });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
```

### After (New Pattern):

```typescript
import { createClient } from "@/lib/supabase/server";
import {
  asyncHandler,
  successResponse,
  parseRequestBody,
  validateRequiredFields,
  BadRequestError,
  DatabaseError,
} from "@/lib/errors";
import { logger, createApiContext } from "@/lib/errors";

interface CreateSourceRequest {
  title: string;
  content: string;
}

export const POST = asyncHandler(async (request: Request) => {
  const context = createApiContext('POST', '/api/sources/create');
  logger.apiRequest('POST', '/api/sources/create');

  // Parse and validate
  const body = await parseRequestBody<CreateSourceRequest>(request);
  validateRequiredFields(body, ['content']);

  const { title, content } = body;

  // Validate content length
  if (content.length < 10) {
    throw new BadRequestError('Content too short', {
      length: content.length,
      minimum: 10
    });
  }

  const supabase = await createClient();

  // Database operation
  const { data, error } = await supabase
    .from('sources')
    .insert({ title, content })
    .select()
    .single();

  if (error) {
    logger.error('Failed to insert source', error, context, { title });
    throw new DatabaseError('Failed to create source', { error: error.message });
  }

  logger.info('Source created successfully', context, { sourceId: data.id });
  logger.apiResponse('POST', '/api/sources/create', 200);

  return successResponse({ source: data }, 200);
});
```

## Benefits

✅ **Type Safety**: Custom error classes with typed context
✅ **Consistent Format**: All errors follow the same response structure
✅ **Better Logging**: Structured logs with context and metadata
✅ **Less Boilerplate**: `asyncHandler` eliminates manual try-catch
✅ **Easier Debugging**: Rich error context and stack traces in dev
✅ **Sentry Ready**: Error structure compatible with Sentry integration

## Response Format

### Success Response:
```json
{
  "data": { ... },
  "metadata": {
    "message": "Operation successful"
  }
}
```

### Error Response:
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "timestamp": "2026-01-18T...",
    "context": { ... },
    "requestId": "uuid"
  }
}
```

## Testing

After migration, verify:

1. **Build passes**: `npm run build`
2. **No type errors**: `npm run type-check`
3. **Lint passes**: `npm run lint`
4. **API returns correct format**: Test with curl/Postman
5. **Errors are logged**: Check console logs
6. **Status codes are correct**: Verify HTTP status codes

## Backward Compatibility

The old `errorUtils.ts` has been updated to support both old and new formats:

- Existing code using `getErrorMessage()` continues to work
- New error format is detected and handled correctly
- Gradual migration is supported

## Next Steps

1. Update all API routes to use new error handling
2. Update client-side error handling to parse new format
3. Add Sentry integration for error tracking
4. Add custom error pages for better UX
5. Add request ID tracking for debugging
