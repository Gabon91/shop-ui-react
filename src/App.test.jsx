import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import * as api from './api/client'

vi.mock('./api/client', () => ({
  createOrder: vi.fn(),
  getCustomers: vi.fn(),
  getOrders: vi.fn(),
  getProducts: vi.fn(),
  updateOrderStatus: vi.fn(),
}))

const products = [{ id: 'p1', name: 'Canvas Tote', description: 'Daily carry.', price: 24 }]

describe('storefront', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getProducts.mockResolvedValue(products)
    api.getCustomers.mockResolvedValue([])
    api.getOrders.mockResolvedValue([])
  })

  it('loads products and sends searches to the API', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByText('Canvas Tote')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Search products'), 'tote')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    await waitFor(() => expect(api.getProducts).toHaveBeenLastCalledWith('tote'))
  })

  it('adds an item and submits customer details at checkout', async () => {
    const user = userEvent.setup()
    api.createOrder.mockResolvedValue({ id: 'order-1' })
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Add to cart' }))
    await user.click(screen.getByRole('button', { name: 'Continue to checkout' }))
    await user.type(screen.getByLabelText('Full name'), 'Ada Lovelace')
    await user.type(screen.getByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Phone'), '+15550100')
    await user.click(screen.getByRole('button', { name: /Place order/ }))

    await waitFor(() => expect(api.createOrder).toHaveBeenCalledWith({
      customer: { name: 'Ada Lovelace', email: 'ada@example.com', phone: '+15550100' },
      items: [{ product_id: 'p1', quantity: 1 }],
    }))
    expect(await screen.findByText('Thanks for your order.')).toBeInTheDocument()
  })

  it('resolves a tracking email to a customer before loading orders', async () => {
    const user = userEvent.setup()
    api.getCustomers.mockResolvedValue([{ id: 'c1', email: 'ada@example.com' }])
    api.getOrders.mockResolvedValue([{ id: 'o1', total: 42, status: 'Pending' }])
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Track order' }))
    await user.type(screen.getByLabelText('Customer email'), 'ADA@example.com')
    await user.click(screen.getByRole('button', { name: 'Track' }))

    await waitFor(() => expect(api.getOrders).toHaveBeenCalledWith('c1'))
    expect(await screen.findByText('Pending')).toBeInTheDocument()
  })
})
