# Unit Testing Quick Start Guide

## 🚀 Running Tests

```bash
# Run all tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Coverage report
npm run test:coverage

# CI mode
npm run test:ci
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── __tests__/          # All test files
│   │   ├── utils/          # Test utilities
│   │   │   ├── test-utils.tsx    # Custom render
│   │   │   └── mock-data.ts      # Mock factories
│   │   ├── components/     # Component tests
│   │   ├── hooks/          # Hook tests
│   │   └── lib/            # Utility tests
│   ├── components/         # Source components
│   ├── hooks/              # Source hooks
│   └── lib/                # Source utilities
├── jest.config.js          # Jest configuration
└── jest.setup.js           # Test environment setup
```

## ✅ Current Status

- **Test Files:** 11
- **Total Tests:** 190
- **Passing:** 161 (84.7%)
- **Infrastructure:** ✅ Complete
- **Coverage Target:** 70% (current: 2.86%)

## 📝 Writing Tests

### 1. Component Test Template

```typescript
import React from 'react'
import { render, screen, fireEvent } from '@/__tests__/utils/test-utils'
import '@testing-library/jest-dom'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('should handle click', () => {
    const handleClick = jest.fn()
    render(<MyComponent onClick={handleClick} />)

    fireEvent.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### 2. Hook Test Template

```typescript
import { renderHook } from '@testing-library/react'
import { useMyHook } from '@/hooks/useMyHook'

describe('useMyHook', () => {
  it('should return expected value', () => {
    const { result } = renderHook(() => useMyHook())
    expect(result.current).toBeDefined()
  })
})
```

### 3. Utility Test Template

```typescript
import { myUtility } from '@/lib/myUtility'

describe('myUtility', () => {
  it('should handle normal case', () => {
    const result = myUtility('input')
    expect(result).toBe('expected output')
  })

  it('should handle edge case', () => {
    expect(() => myUtility(null)).toThrow()
  })
})
```

## 🎯 Best Practices

### ✅ DO

- ✅ Test behavior, not implementation
- ✅ Use descriptive test names
- ✅ Test edge cases and error states
- ✅ Mock external dependencies
- ✅ Use `screen` queries from RTL
- ✅ Clean up after each test

### ❌ DON'T

- ❌ Test implementation details
- ❌ Write brittle tests
- ❌ Rely on test execution order
- ❌ Mock too much
- ❌ Forget accessibility tests

## 🔍 Common Queries

```typescript
// By role (preferred)
screen.getByRole('button', { name: /submit/i })
screen.getByRole('textbox', { name: /username/i })

// By label
screen.getByLabelText('Email Address')

// By text
screen.getByText('Click me')

// By test ID (last resort)
screen.getByTestId('custom-element')

// Query variants
getBy    // throws error if not found
queryBy  // returns null if not found
findBy   // async, waits for element
```

## 🛠️ Mocking

### Mock API Calls

```typescript
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'mocked' }),
  })
)
```

### Mock Modules

```typescript
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(),
    select: jest.fn(),
  })),
}))
```

### Mock Functions

```typescript
const mockFn = jest.fn()
mockFn.mockReturnValue('value')
mockFn.mockResolvedValue('async value')
mockFn.mockRejectedValue(new Error('error'))
```

## 🐛 Debugging

### View Rendered Output

```typescript
import { debug } from '@testing-library/react'

render(<MyComponent />)
debug() // Prints DOM tree
```

### Check What's Rendered

```typescript
screen.logTestingPlaygroundURL()
// Opens browser with interactive query builder
```

### Focus on Specific Element

```typescript
const element = screen.getByRole('button')
debug(element) // Only prints this element
```

## 📊 Coverage Reports

After running `npm run test:coverage`, open:

```
frontend/coverage/lcov-report/index.html
```

### Understanding Coverage

- **Statements:** % of code statements executed
- **Branches:** % of if/else branches tested
- **Functions:** % of functions called
- **Lines:** % of code lines executed

## 🔧 Troubleshooting

### Test Timeout

```typescript
it('should complete within time', async () => {
  // Increase timeout for this test
}, 10000) // 10 seconds
```

### Async Operations

```typescript
import { waitFor } from '@testing-library/react'

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})
```

### Act Warning

```typescript
import { act } from '@testing-library/react'

await act(async () => {
  // Perform state updates
})
```

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Playground](https://testing-playground.com/)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🎓 Learning Path

1. **Start Simple:** Test pure utilities
2. **Move to Hooks:** Test custom hooks
3. **Basic Components:** Buttons, inputs, cards
4. **Complex Components:** Forms, modals, tables
5. **Integration:** Multi-component workflows

## 💡 Pro Tips

1. **Write tests first** (TDD) when fixing bugs
2. **Use data-testid** sparingly (accessibility first)
3. **Test user behavior**, not React internals
4. **Keep tests simple** and focused
5. **Refactor tests** like production code

---

**Quick Reference Created:** 2026-01-18
**For Full Details:** See `UNIT_TEST_REPORT.md`
