import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Mock API handlers for DeFi testing
export const handlers = [
  // Mock staking API endpoints
  http.get('/api/validators', () => {
    return HttpResponse.json({
      data: [
        {
          id: 1,
          name: 'Validator 1',
          commission: '5%',
          votingPower: '1000000',
          status: 'active',
        },
        {
          id: 2,
          name: 'Validator 2',
          commission: '3%',
          votingPower: '2000000',
          status: 'active',
        },
      ],
    })
  }),

  http.get('/api/user/:address/stakes', () => {
    return HttpResponse.json({
      data: [
        {
          validatorId: 1,
          amount: '100',
          rewards: '5.5',
          status: 'active',
        },
      ],
    })
  }),

  // Mock bridge API endpoints
  http.get('/api/bridge/routes', () => {
    return HttpResponse.json({
      data: [
        {
          from: 'ethereum',
          to: 'polygon',
          token: 'USDC',
          fee: '0.1%',
          estimatedTime: '5 minutes',
        },
      ],
    })
  }),

  // Mock yield farming endpoints
  http.get('/api/yield/pools', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'eth-usdc',
          name: 'ETH-USDC',
          apy: '12.5%',
          tvl: '1000000',
          rewards: ['COMP', 'ETH'],
        },
      ],
    })
  }),

  // Mock chat/agent endpoints
  http.post('/api/chat/message', () => {
    return HttpResponse.json({
      data: {
        id: 'msg-123',
        content: 'Mock response',
        timestamp: new Date().toISOString(),
      },
    })
  }),
]

// Create MSW server instance
export const server = setupServer(...handlers)