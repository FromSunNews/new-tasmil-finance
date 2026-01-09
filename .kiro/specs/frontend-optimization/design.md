# Design Document: Frontend Code Quality Optimization

## Overview

This design document outlines a practical approach to optimize the Tasmil Finance DeFi frontend application. The solution transforms the current Next.js 16 React 19 codebase into a highly maintainable, performant, and scalable application using a feature-based architecture that aligns with DeFi business domains.

The design focuses on implementing a practical folder structure that separates DeFi features (agents, chat, staking, bridge, yield, research) while maintaining the existing Next.js app directory for routing. This approach minimizes disruption while establishing clear patterns for future scalability.

## Architecture

### Practical Feature-Based Structure

The application will be restructured to align with DeFi business domains:

```
src/
├── app/                          # Keep existing: routing + special files
│   ├── (landing)/                # Route Group
│   ├── (dashboard)/              # Main Route Group
│   │   ├── agents/
│   │   ├── chat/
│   │   ├── portfolio/
│   │   └── layout.tsx
│   └── layout.tsx
├── features/                     # NEW: Core of scaling strategy
│   ├── agents/                   # Everything about agents
│   │   ├── components/           # agent-card, filter-bar, hero-section...
│   │   ├── hooks/
│   │   ├── api/                  # queries/mutations for agents
│   │   ├── types.ts
│   │   └── constants.ts
│   ├── chat/                     # Largest feature
│   │   ├── components/           # chat-client, messages/, thread/, artifact...
│   │   ├── hooks/
│   │   ├── providers/            # chat-state-provider
│   │   ├── api/                  # langgraph calls, thread management
│   │   └── utils/
│   ├── staking/                  # DeFi feature
│   │   ├── components/           # staking-operation, staking-result...
│   │   ├── hooks/                # use-staking-operations
│   │   └── api/
│   ├── bridge/
│   ├── yield/
│   └── research/                 # custom-components/research-result
├── entities/                     # Optional for later (if business domain gets complex)
│   └── wallet/                   # example: types, utils common to wallet
├── shared/                       # Replace components/ui + components/layout
│   ├── ui/                       # shadcn/ui primitives: button, card, dialog...
│   ├── layout/                   # sidebar, header, multi-sidebar...
│   ├── icons/
│   └── hooks/                    # use-mobile, use-media-query...
├── lib/                          # Keep existing + expand
│   ├── api/                      # common client (axios, fetch wrapper)
│   ├── wagmi/
│   ├── langgraph/                # wrapper for gen/ code
│   └── utils/
├── providers/                    # Keep existing (app-provider, wallet-context...)
├── gen/                          # Codegen → keep as is, don't touch
└── constants/, config/, styles/  # Keep existing
```

### Migration Strategy

#### Phase 1: Create New Structure
- Create `features/` directory with subdirectories for each DeFi domain
- Create `shared/` directory to replace scattered UI components
- Set up barrel exports for clean imports

#### Phase 2: Move Existing Components
- Move DeFi-specific components to appropriate feature directories
- Move generic UI components to `shared/ui/`
- Move layout components to `shared/layout/`
- Update import statements to use new structure

#### Phase 3: Enhance Feature Modules
- Add proper TypeScript types for each feature
- Implement feature-specific hooks and API layers
- Add comprehensive error handling and validation

## Components and Interfaces

### Enhanced DeFi Component Patterns

#### Staking Feature Enhancement
```typescript
// features/staking/types.ts
export type StakingAmount = string & { readonly brand: unique symbol }
export type ValidatorID = number & { readonly brand: unique symbol }
export type StakingReward = string & { readonly brand: unique symbol }

export interface StakingOperation {
  type: 'delegate' | 'undelegate' | 'claim' | 'restake'
  validatorId: ValidatorID
  amount?: StakingAmount
  lockupDuration?: number
}

export type StakingState =
  | { status: 'idle' }
  | { status: 'confirming'; operation: StakingOperation }
  | { status: 'pending'; txHash: TransactionHash }
  | { status: 'success'; txHash: TransactionHash; receipt: TransactionReceipt }
  | { status: 'error'; error: string }

// features/staking/hooks/use-enhanced-staking.ts
export const useEnhancedStaking = () => {
  const [state, setState] = useState<StakingState>({ status: 'idle' })
  
  const executeOperation = async (operation: StakingOperation) => {
    setState({ status: 'confirming', operation })
    
    try {
      // Enhanced error handling and validation
      const txHash = await performStakingOperation(operation)
      setState({ status: 'pending', txHash })
      
      // Wait for confirmation with proper error handling
      const receipt = await waitForConfirmation(txHash)
      setState({ status: 'success', txHash, receipt })
      
      // Optimistic updates
      queryClient.invalidateQueries(['staking', 'user-stakes'])
      
    } catch (error) {
      setState({ status: 'error', error: error.message })
    }
  }
  
  return { state, executeOperation }
}
```

#### Chat Feature Organization
```typescript
// features/chat/components/index.ts
export { ChatClient } from './chat-client'
export { MessageList } from './messages/message-list'
export { ThreadSidebar } from './thread/thread-sidebar'
export { ArtifactRenderer } from './artifact/artifact-renderer'

// features/chat/providers/chat-state-provider.tsx
export const ChatStateProvider = ({ children }: PropsWithChildren) => {
  // Move existing chat state logic here
  // Enhance with better error handling and type safety
}

// features/chat/api/langgraph.ts
export const useChatStream = (threadId: string) => {
  // Enhanced streaming with proper error boundaries
  // Better type safety for LangGraph responses
}
```

### Shared Component Library

#### Enhanced UI Components
```typescript
// shared/ui/button/button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  loadingText?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, loadingText, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }))}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <>
            <Spinner className="mr-2 h-4 w-4" />
            {loadingText || 'Loading...'}
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)
```

#### DeFi-Specific Components
```typescript
// shared/ui/defi/token-amount-input.tsx
interface TokenAmountInputProps {
  value: string
  onChange: (value: string) => void
  token: Token
  balance?: string
  maxDecimals?: number
  showMaxButton?: boolean
}

export const TokenAmountInput = ({
  value,
  onChange,
  token,
  balance,
  maxDecimals = 18,
  showMaxButton = true,
}: TokenAmountInputProps) => {
  const handleMaxClick = () => {
    if (balance) {
      onChange(balance)
    }
  }
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Amount</Label>
        {balance && (
          <span className="text-sm text-muted-foreground">
            Balance: {formatTokenAmount(balance, token.decimals)} {token.symbol}
          </span>
        )}
      </div>
      <div className="relative">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.0"
          className="pr-20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {showMaxButton && balance && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleMaxClick}
            >
              MAX
            </Button>
          )}
          <span className="text-sm font-medium">{token.symbol}</span>
        </div>
      </div>
    </div>
  )
}
```

## Data Models

### Enhanced DeFi Entity Models

#### Wallet and Token Models
```typescript
// entities/wallet/types.ts
import { z } from 'zod'

export const WalletAddressSchema = z.string().refine(
  (address) => /^0x[a-fA-F0-9]{40}$/.test(address),
  'Invalid Ethereum address format'
)

export type WalletAddress = z.infer<typeof WalletAddressSchema>

export const TokenSchema = z.object({
  address: WalletAddressSchema,
  symbol: z.string().min(1).max(10),
  name: z.string().min(1),
  decimals: z.number().int().min(0).max(18),
  logoURI: z.string().url().optional(),
  chainId: z.number().int().positive(),
})

export type Token = z.infer<typeof TokenSchema>

// entities/wallet/utils.ts
export const formatTokenAmount = (
  amount: string,
  decimals: number,
  displayDecimals: number = 4
): string => {
  const value = parseFloat(amount) / Math.pow(10, decimals)
  return value.toFixed(displayDecimals)
}

export const parseTokenAmount = (
  amount: string,
  decimals: number
): string => {
  const value = parseFloat(amount) * Math.pow(10, decimals)
  return value.toString()
}
```

#### Transaction Models
```typescript
// features/staking/types.ts
export const TransactionStateSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('idle') }),
  z.object({ 
    status: z.literal('pending'), 
    txHash: z.string(),
    operation: z.string()
  }),
  z.object({ 
    status: z.literal('confirmed'), 
    txHash: z.string(),
    blockNumber: z.number(),
    gasUsed: z.string()
  }),
  z.object({ 
    status: z.literal('failed'), 
    txHash: z.string().optional(),
    error: z.string()
  }),
])

export type TransactionState = z.infer<typeof TransactionStateSchema>
```

## Performance Optimization Strategy

### Feature-Based Code Splitting

#### Dynamic Imports for Features
```typescript
// app/(dashboard)/staking/page.tsx
import { lazy, Suspense } from 'react'
import { StakingSkeleton } from '@/shared/ui/skeletons'

const StakingFeature = lazy(() => import('@/features/staking/components/staking-page'))

export default function StakingPage() {
  return (
    <Suspense fallback={<StakingSkeleton />}>
      <StakingFeature />
    </Suspense>
  )
}

// features/staking/components/index.ts
export const StakingPage = lazy(() => import('./staking-page'))
export const StakingOperationModal = lazy(() => import('./staking-operation-modal'))
```

#### Optimized Bundle Structure
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'lucide-react',
    ],
  },
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        defi: {
          test: /[\\/]features[\\/](staking|bridge|yield)[\\/]/,
          name: 'defi-features',
          priority: 10,
        },
        chat: {
          test: /[\\/]features[\\/]chat[\\/]/,
          name: 'chat-feature',
          priority: 10,
        },
        shared: {
          test: /[\\/]shared[\\/]/,
          name: 'shared-components',
          priority: 5,
        },
      },
    }
    return config
  },
}
```

### React Query Optimization for DeFi Data

#### Feature-Specific Query Keys
```typescript
// features/staking/api/query-keys.ts
export const stakingKeys = {
  all: ['staking'] as const,
  validators: () => [...stakingKeys.all, 'validators'] as const,
  validator: (id: ValidatorID) => [...stakingKeys.validators(), id] as const,
  userStakes: (address: WalletAddress) => [...stakingKeys.all, 'user-stakes', address] as const,
  rewards: (address: WalletAddress) => [...stakingKeys.all, 'rewards', address] as const,
}

// features/staking/api/queries.ts
export const useValidators = () => {
  return useQuery({
    queryKey: stakingKeys.validators(),
    queryFn: fetchValidators,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useUserStakes = (address: WalletAddress) => {
  return useQuery({
    queryKey: stakingKeys.userStakes(address),
    queryFn: () => fetchUserStakes(address),
    enabled: !!address,
    staleTime: 30 * 1000, // 30 seconds for user data
  })
}
```

## Testing Strategy

### Testing Pyramid Structure

#### Unit Tests (70%)
```typescript
// Hook testing with React Testing Library
import { renderHook, act } from '@testing-library/react'
import { useStaking } from '@/features/staking/hooks/use-staking'

describe('useStaking', () => {
  it('should handle stake operation successfully', async () => {
    const { result } = renderHook(() => useStaking())
    
    await act(async () => {
      await result.current.stake({ validatorId: 1, amount: '100' })
    })
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })
})

// Component testing
import { render, screen, fireEvent } from '@testing-library/react'
import { StakingForm } from '@/features/staking/components/staking-form'

describe('StakingForm', () => {
  it('should validate amount input', async () => {
    render(<StakingForm />)
    
    const amountInput = screen.getByLabelText(/amount/i)
    fireEvent.change(amountInput, { target: { value: '-100' } })
    
    expect(screen.getByText(/amount must be positive/i)).toBeInTheDocument()
  })
})
```

#### Integration Tests (20%)
```typescript
// API integration tests
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ValidatorList } from '@/features/staking/components/validator-list'

const server = setupServer(
  rest.get('/api/validators', (req, res, ctx) => {
    return res(ctx.json({ data: mockValidators }))
  })
)

describe('ValidatorList Integration', () => {
  it('should fetch and display validators', async () => {
    const queryClient = new QueryClient()
    
    render(
      <QueryClientProvider client={queryClient}>
        <ValidatorList />
      </QueryClientProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Validator 1')).toBeInTheDocument()
    })
  })
})
```

#### E2E Tests (10%)
```typescript
// Playwright E2E tests
import { test, expect } from '@playwright/test'

test.describe('Staking Flow', () => {
  test('should complete full staking process', async ({ page }) => {
    // Mock wallet connection
    await page.goto('/staking')
    await page.click('[data-testid="connect-wallet"]')
    
    // Select validator
    await page.click('[data-testid="validator-1"]')
    
    // Enter amount
    await page.fill('[data-testid="stake-amount"]', '100')
    
    // Submit transaction
    await page.click('[data-testid="stake-submit"]')
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })
})
```

### Web3 Testing Strategy

#### Contract Interaction Testing
```typescript
// Mock Web3 providers for testing
import { createMockProvider } from '@/shared/lib/test-utils/mock-provider'

describe('Staking Contract Integration', () => {
  it('should handle contract call failures gracefully', async () => {
    const mockProvider = createMockProvider({
      contractCalls: {
        delegate: { shouldFail: true, error: 'Insufficient balance' }
      }
    })
    
    const { result } = renderHook(() => useStaking(), {
      wrapper: ({ children }) => (
        <Web3Provider provider={mockProvider}>
          {children}
        </Web3Provider>
      )
    })
    
    await act(async () => {
      await result.current.stake({ validatorId: 1, amount: '1000' })
    })
    
    expect(result.current.error).toContain('Insufficient balance')
  })
})
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the updated requirements focused on practical DeFi frontend optimization, the following properties have been identified as testable:

### Feature Architecture Properties

Property 1: Feature module organization
*For any* DeFi feature (agents, chat, staking, bridge, yield, research), it should be organized in the features directory with proper subdirectories for components, hooks, api, types, and constants
**Validates: Requirements 1.1**

Property 2: Shared component organization
*For any* reusable UI component, it should be located in the shared directory with proper categorization (ui, layout, icons, hooks)
**Validates: Requirements 1.4**

Property 3: Barrel export implementation
*For any* feature module, it should have index.ts files that properly export public interfaces for clean imports
**Validates: Requirements 1.5**

Property 4: DeFi component separation
*For any* component, it should be clearly categorized as either DeFi-specific (in features) or generic UI (in shared)
**Validates: Requirements 1.6**

### DeFi Component Enhancement Properties

Property 5: Enhanced staking operations
*For any* staking operation, it should implement proper error handling, type safety, and transaction state management
**Validates: Requirements 2.1**

Property 6: Web3 transaction state management
*For any* Web3 interaction, it should properly manage transaction states through discriminated unions
**Validates: Requirements 2.2**

Property 7: Wallet connection patterns
*For any* wallet interaction, it should use reusable patterns for connection and contract interactions
**Validates: Requirements 2.3**

Property 8: DeFi data formatting
*For any* DeFi data display, it should properly format tokens, addresses, and amounts using standardized utilities
**Validates: Requirements 2.4**

Property 9: Optimistic updates implementation
*For any* transaction operation, it should implement optimistic updates for better user experience
**Validates: Requirements 2.5**

### Type Safety Properties

Property 10: Branded types for DeFi values
*For any* DeFi-specific value like wallet addresses or token amounts, it should use branded types for type safety
**Validates: Requirements 3.1**

Property 11: Zod validation schemas
*For any* DeFi entity definition, it should use Zod schemas for strict validation
**Validates: Requirements 3.2**

Property 12: Discriminated unions for states
*For any* complex state like transaction or loading states, it should use discriminated unions for type safety
**Validates: Requirements 3.3**

Property 13: Contract ABI type generation
*For any* contract interaction, it should use properly generated TypeScript types from contract ABIs
**Validates: Requirements 3.4**

Property 14: Strict TypeScript configuration
*For any* TypeScript file, it should compile without errors under strict configuration with no implicit any types
**Validates: Requirements 3.5**

Property 15: DeFi utility types
*For any* common DeFi pattern like staking rewards or liquidity positions, it should use predefined utility types
**Validates: Requirements 3.6**

### Performance Properties

Property 16: Feature-based code splitting
*For any* DeFi feature module, it should implement proper code splitting with dynamic imports
**Validates: Requirements 4.1**

Property 17: Transaction history virtualization
*For any* large list like transaction history, it should implement virtualization for performance
**Validates: Requirements 4.2**

Property 18: Bundle size optimization
*For any* import statement, it should follow tree-shaking friendly patterns to optimize bundle size
**Validates: Requirements 4.3**

Property 19: Real-time data optimization
*For any* real-time data handling, it should implement efficient WebSocket connections and updates
**Validates: Requirements 4.4**

Property 20: Blockchain data caching
*For any* blockchain data fetching, it should use React Query with appropriate caching strategies
**Validates: Requirements 4.5**

Property 21: Asset optimization
*For any* image or asset, it should use Next.js optimization features for performance
**Validates: Requirements 4.6**

### State Management Properties

Property 22: Zustand TypeScript integration
*For any* global state management, it should use Zustand with proper TypeScript integration
**Validates: Requirements 5.1**

Property 23: React Query for blockchain data
*For any* blockchain data management, it should use React Query for caching and synchronization
**Validates: Requirements 5.2**

Property 24: DeFi error boundaries
*For any* DeFi operation, it should be wrapped with appropriate error boundaries
**Validates: Requirements 5.3**

Property 25: Form validation with Zod
*For any* form in the application, it should use React Hook Form with Zod validation
**Validates: Requirements 5.4**

Property 26: Transaction optimistic updates
*For any* transaction operation, it should implement optimistic updates
**Validates: Requirements 5.5**

Property 27: State separation
*For any* component, local UI state should be separated from global application state
**Validates: Requirements 5.6**

### Testing Properties

Property 28: DeFi utility testing
*For any* DeFi utility function or custom hook, it should have corresponding unit tests
**Validates: Requirements 6.1**

Property 29: DeFi component testing
*For any* DeFi component test, it should use React Testing Library with DeFi-specific test utilities
**Validates: Requirements 6.2**

Property 30: DeFi workflow integration tests
*For any* critical DeFi user flow like staking or bridging, it should have integration tests
**Validates: Requirements 6.3**

Property 31: Web3 provider mocking
*For any* blockchain interaction test, it should properly mock Web3 providers and contract calls
**Validates: Requirements 6.4**

Property 32: DeFi E2E testing
*For any* complete DeFi workflow, it should have E2E tests using Playwright
**Validates: Requirements 6.5**

Property 33: DeFi code coverage
*For any* DeFi-related code module, it should achieve minimum 80% code coverage
**Validates: Requirements 6.6**

### Developer Experience Properties

Property 34: DeFi-specific linting rules
*For any* code file, it should pass ESLint rules specific to DeFi development patterns
**Validates: Requirements 7.1**

Property 35: Pre-commit hooks for DeFi
*For any* code commit, it should trigger pre-commit hooks for linting and testing
**Validates: Requirements 7.2**

Property 36: Hot module replacement
*For any* development change, it should trigger hot module replacement for fast feedback
**Validates: Requirements 7.3**

Property 37: DeFi debugging tools
*For any* DeFi operation debugging, proper source maps and debugging tools should be available
**Validates: Requirements 7.4**

Property 38: Automated dependency management
*For any* dependency update, it should be handled through automated processes with security scanning
**Validates: Requirements 7.5**

Property 39: DeFi development documentation
*For any* DeFi feature development workflow, it should have comprehensive documentation
**Validates: Requirements 7.6**

### Security Properties

Property 40: DeFi input validation
*For any* DeFi operation input, it should be properly validated and sanitized
**Validates: Requirements 8.1**

Property 41: Sensitive data handling
*For any* sensitive data like private keys, it should never be stored in the frontend
**Validates: Requirements 8.2**

Property 42: DeFi CSP headers
*For any* page load, it should enforce Content Security Policy headers appropriate for DeFi applications
**Validates: Requirements 8.3**

Property 43: Contract call validation
*For any* contract call, it should implement proper transaction validation and confirmation
**Validates: Requirements 8.4**

Property 44: API rate limiting
*For any* API endpoint, it should implement appropriate rate limiting
**Validates: Requirements 8.5**

Property 45: Dependency vulnerability scanning
*For any* dependency, it should be scanned for known security vulnerabilities
**Validates: Requirements 8.6**

### Monitoring Properties

Property 46: DeFi performance monitoring
*For any* DeFi operation, performance metrics should be collected and monitored
**Validates: Requirements 9.1**

Property 47: DeFi error tracking
*For any* error in DeFi features, it should be tracked and reported comprehensively
**Validates: Requirements 9.2**

Property 48: Privacy-compliant DeFi analytics
*For any* DeFi user analytics, it should respect privacy and regulatory requirements
**Validates: Requirements 9.3**

Property 49: DeFi-specific metrics tracking
*For any* DeFi operation, it should track specific metrics like transaction success rates
**Validates: Requirements 9.4**

Property 50: DeFi feature flags
*For any* new DeFi feature, it should support gradual rollouts through feature flags
**Validates: Requirements 9.5**

Property 51: DeFi A/B testing
*For any* DeFi UI experiment, it should be supported by A/B testing infrastructure
**Validates: Requirements 9.6**

### Build System Properties

Property 52: DeFi-optimized Next.js configuration
*For any* production build, it should use Next.js configuration optimized for DeFi applications
**Validates: Requirements 10.1**

Property 53: Asset optimization for DeFi
*For any* production asset, it should be properly optimized and compressed
**Validates: Requirements 10.2**

Property 54: Multi-network environment configuration
*For any* environment deployment, it should use appropriate configurations for different blockchain networks
**Validates: Requirements 10.3**

Property 55: DeFi data caching strategies
*For any* DeFi data deployment, it should implement proper caching strategies
**Validates: Requirements 10.4**

Property 56: DeFi CI/CD testing
*For any* deployment pipeline, it should include automated testing for DeFi features
**Validates: Requirements 10.5**

Property 57: Blockchain network environment management
*For any* environment, it should properly manage environment variables for different blockchain networks
**Validates: Requirements 10.6**

## Error Handling

### Comprehensive Error Boundary System

#### Global Error Boundary
```typescript
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class GlobalErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  constructor(props: PropsWithChildren) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }
  
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    
    // Log to monitoring service
    logger.error('Global error boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }
    
    return this.props.children
  }
}
```

#### Feature-Level Error Boundaries
```typescript
const StakingErrorBoundary = ({ children }: PropsWithChildren) => {
  return (
    <ErrorBoundary
      FallbackComponent={StakingErrorFallback}
      onError={(error, errorInfo) => {
        logger.error('Staking feature error', { error, errorInfo })
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
```

### Error Classification and Handling

#### Error Types and Handlers
```typescript
// Error classification
abstract class AppError extends Error {
  abstract readonly type: string
  abstract readonly severity: 'low' | 'medium' | 'high' | 'critical'
  abstract readonly userMessage: string
}

class ValidationError extends AppError {
  readonly type = 'VALIDATION_ERROR'
  readonly severity = 'low' as const
  
  constructor(field: string, message: string) {
    super(`Validation failed for ${field}: ${message}`)
    this.userMessage = message
  }
}

class NetworkError extends AppError {
  readonly type = 'NETWORK_ERROR'
  readonly severity = 'medium' as const
  readonly userMessage = 'Network connection failed. Please try again.'
}

class ContractError extends AppError {
  readonly type = 'CONTRACT_ERROR'
  readonly severity = 'high' as const
  
  constructor(message: string) {
    super(message)
    this.userMessage = 'Transaction failed. Please check your wallet and try again.'
  }
}

// Error handler
const handleError = (error: unknown) => {
  if (error instanceof AppError) {
    switch (error.severity) {
      case 'low':
        toast.warning(error.userMessage)
        break
      case 'medium':
        toast.error(error.userMessage)
        break
      case 'high':
      case 'critical':
        toast.error(error.userMessage)
        logger.error(error.message, { error })
        break
    }
  } else {
    // Unknown error
    toast.error('An unexpected error occurred')
    logger.error('Unknown error', { error })
  }
}
```

## Testing Strategy

### Comprehensive Testing Approach

The testing strategy implements a dual approach combining traditional unit/integration/E2E tests with property-based testing for comprehensive coverage:

#### Unit Testing (70% of test suite)
- **Focus**: Individual functions, hooks, and components
- **Tools**: Jest, React Testing Library, @testing-library/jest-dom
- **Coverage**: All utility functions, custom hooks, and component logic
- **Minimum Coverage**: 80% code coverage across all modules

#### Integration Testing (20% of test suite)
- **Focus**: Feature workflows and API integrations
- **Tools**: MSW for API mocking, React Testing Library for component integration
- **Coverage**: Critical user flows, Web3 interactions, state management
- **Approach**: Test complete features end-to-end within the frontend

#### E2E Testing (10% of test suite)
- **Focus**: Critical user paths and cross-browser compatibility
- **Tools**: Playwright for reliable E2E testing
- **Coverage**: Authentication, staking flows, portfolio management
- **Approach**: Test complete user journeys across the entire application

#### Property-Based Testing
- **Focus**: Universal properties that should hold across all inputs
- **Tools**: Fast-check for JavaScript property-based testing
- **Coverage**: All correctness properties defined in this document
- **Configuration**: Minimum 100 iterations per property test
- **Integration**: Each property test references its corresponding design property

### Testing Configuration

#### Jest Configuration
```typescript
// jest.config.ts
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/test/**/*',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}
```

#### Property-Based Testing Setup
```typescript
// Property test example with proper tagging
import fc from 'fast-check'

describe('Feature: frontend-optimization, Property 1: Feature-based folder structure compliance', () => {
  it('should maintain proper directory structure for all features', () => {
    fc.assert(fc.property(
      fc.constantFrom(...getFeatureDirectories()),
      (featureDir) => {
        const structure = analyzeDirectoryStructure(featureDir)
        expect(structure).toMatchFeatureSlicedPattern()
      }
    ), { numRuns: 100 })
  })
})
```

Now I need to use the prework tool to analyze the acceptance criteria before writing the correctness properties:

<function_calls>
<invoke name="prework">
<parameter name="featureName">frontend-optimization