export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json()
      message = body.message || body.error || message
    } catch {
      // Keep the status-based fallback when the API has no JSON error body.
    }
    throw new Error(message)
  }

  if (response.status === 204) return null
  return response.json()
}

export function getProducts(search = '') {
  const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''
  return request(`/api/products${query}`)
}

export function getCustomers() {
  return request('/api/customers')
}

export function getOrders(customerId) {
  const query = customerId ? `?customer_id=${encodeURIComponent(customerId)}` : ''
  return request(`/api/orders${query}`)
}

export function createOrder(order) {
  return request('/api/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  })
}

export function updateOrderStatus(id, status) {
  return request(`/api/orders/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
