# API Routes Migration Status

## ✅ Completed (5/21)

1. ✅ `/api/sources/create` - Complete error handling migration
2. ✅ `/api/sources/from-text` - Complete error handling migration
3. ✅ `/api/sources/summarize` - Complete error handling migration
4. ✅ `/api/n8n/draft` - Complete error handling migration
5. ✅ `/api/n8n/chat` - Complete error handling migration

## 🔄 Remaining (16/21)

### High Priority (User-Facing)
6. `/api/sources/from-url` - Web crawling and source creation
7. `/api/sources/ai-search` - AI-powered source search
8. `/api/n8n/ingest` - Document ingestion workflow
9. `/api/n8n/parse` - Document parsing workflow
10. `/api/rag/generate` - RAG content generation

### Medium Priority (Background Operations)
11. `/api/trigger-aggregation` - Workflow aggregation
12. `/api/generate-document` - Document generation
13. `/api/export` - Document export
14. `/api/templates/parse` - Template parsing
15. `/api/templates/update` - Template updates
16. `/api/templates/save-as` - Save template as new

### Low Priority (Webhooks - Can Handle Any Format)
17. `/api/webhook/generate-content` - Content generation webhook
18. `/api/webhook/generate-image` - Image generation webhook
19. `/api/webhook/integrate-chapter` - Chapter integration webhook
20. `/api/text-removal` - Text removal service
21. `/api/proposal/extract-structure-from-template` - Structure extraction

## Migration Pattern for Remaining Routes

### Pattern 1: Simple Database Operation
```typescript
export const POST = asyncHandler(async (request: Request) => {
  const context = createApiContext('POST', '/api/...');
  logger.apiRequest('POST', '/api/...');

  const body = await parseRequestBody<RequestType>(request);
  validateRequiredFields(body, ['field1', 'field2']);

  const supabase = await createClient();
  const { data, error } = await supabase...;

  if (error) {
    logger.error('Operation failed', error, context);
    throw new DatabaseError('Failed to ...', { error: error.message });
  }

  logger.apiResponse('POST', '/api/...', 200);
  return successResponse({ data });
});
```

### Pattern 2: External API Call
```typescript
export const POST = asyncHandler(async (request: Request) => {
  const context = createApiContext('POST', '/api/...');
  logger.apiRequest('POST', '/api/...');

  const body = await parseRequestBody<RequestType>(request);

  logger.externalApi('ServiceName', 'operation');

  const response = await fetch(url, { ... });
  if (!response.ok) {
    throw new ExternalApiError('ServiceName', 'Operation failed', {
      statusCode: response.status
    });
  }

  const data = await response.json();

  logger.apiResponse('POST', '/api/...', 200);
  return successResponse(data);
});
```

### Pattern 3: Authenticated Route
```typescript
export const POST = asyncHandler(async (request: Request) => {
  const context = createApiContext('POST', '/api/...');
  logger.apiRequest('POST', '/api/...');

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new UnauthorizedError('Authentication required');
  }

  // ... rest of logic
});
```

## Next Steps

1. Continue migrating remaining routes (prioritize high-priority routes first)
2. Run build verification after each batch
3. Test API endpoints with Postman/curl
4. Update client-side error handling
5. Create completion report

## Build Verification Checklist

After completing all migrations:

- [ ] `npm run build` passes without errors
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes (or only warnings)
- [ ] All API routes follow unified error format
- [ ] Logging is consistent across routes
- [ ] Documentation is updated
