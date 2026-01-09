/**
 * @jest-environment jsdom
 */

describe('Test Setup', () => {
  it('should have proper test environment configured', () => {
    expect(process.env.NODE_ENV).toBe('test')
    expect(global.ResizeObserver).toBeDefined()
    expect(global.IntersectionObserver).toBeDefined()
  })

  it('should have window.matchMedia mocked', () => {
    const matchMedia = window.matchMedia('(min-width: 768px)')
    expect(matchMedia).toBeDefined()
    expect(matchMedia.matches).toBe(false)
  })
})