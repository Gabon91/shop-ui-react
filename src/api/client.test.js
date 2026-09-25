import { afterEach, describe, expect, it, vi } from 'vitest'
import { createOrder, getOrders, getProducts, updateOrderStatus } from './client'

function jsonResponse(body, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  })
}

describe('API client', () => {
  afterEach(() => vi.restoreAllMocks())

  it('encodes product search terms', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockReturnValue(jsonResponse([]))
    await getProducts('desk lamp')
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/products?search=desk%20lamp',
      expect.objectContaining({ headers: expect.objectContaining({ Accept: 'application/json' }) }),
    )
  })

  it('filters orders by customer id', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockReturnValue(jsonResponse([]))
    await getOrders('customer-1')
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/api/orders?customer_id=customer-1')
  })

  it('posts orders and patches statuses with JSON bodies', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockReturnValueOnce(jsonResponse({ id: 'order-1' }, 201))
      .mockReturnValueOnce(jsonResponse({ id: 'order-1', status: 'Completed' }))

    const payload = { customer: { email: 'ada@example.com' }, items: [{ product_id: 'p1', quantity: 2 }] }
    await createOrder(payload)
    await updateOrderStatus('order-1', 'Completed')

    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://localhost:3000/api/orders', expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) }))
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'http://localhost:3000/api/orders/order-1/status', expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ status: 'Completed' }) }))
  })
})
