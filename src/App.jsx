import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createOrder, getCustomers, getOrders, getProducts, updateOrderStatus } from './api/client'

const STATUS_OPTIONS = ['Pending', 'Completed', 'Cancelled']

function toList(payload, key) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.[key])) return payload[key]
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0)
}

function orderTotal(order) {
  if (order.total_amount != null) return Number(order.total_amount)
  if (order.total != null) return Number(order.total)
  const items = order.items || order.order_items || []
  return items.reduce((sum, item) => sum + Number(item.price ?? item.product?.price ?? 0) * Number(item.quantity ?? 1), 0)
}

function ErrorMessage({ message }) {
  if (!message) return null
  return <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>
}

function EmptyState({ children }) {
  return <div className="rounded-2xl border border-dashed border-ink/20 px-6 py-12 text-center text-sm text-ink/55">{children}</div>
}

function Header({ view, setView, cartCount }) {
  const nav = [['shop', 'Shop'], ['track', 'Track order'], ['admin', 'Admin']]
  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <button onClick={() => setView('shop')} className="flex items-center gap-2 text-left" aria-label="Go to shop">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-lg text-lime">✦</span>
          <span className="text-base font-black tracking-tight sm:text-lg">Gabistar</span>
        </button>
        <nav className="flex items-center rounded-full border border-ink/10 bg-white p-1" aria-label="Primary navigation">
          {nav.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              aria-current={view === key ? 'page' : undefined}
              className={`rounded-full px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${view === key ? 'bg-ink text-white' : 'text-ink/60 hover:text-ink'}`}
            >
              {label}{key === 'shop' && cartCount > 0 ? ` · ${cartCount}` : ''}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}

function ProductCard({ product, onAdd }) {
  const image = product.image_url || product.image || product.thumbnail
  return (
    <article className="group overflow-hidden rounded-3xl border border-ink/10 bg-white transition hover:-translate-y-1 hover:shadow-card">
      <div className="aspect-[4/3] overflow-hidden bg-[#e7ebdf]">
        {image ? (
          <img src={image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center text-5xl text-moss/30" aria-hidden="true">✦</div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-bold">{product.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink/55">{product.description || 'A considered everyday essential.'}</p>
          </div>
          <span className="shrink-0 font-black">{money(product.price)}</span>
        </div>
        <button onClick={() => onAdd(product)} className="btn-primary mt-5 w-full">Add to cart</button>
      </div>
    </article>
  )
}

function Cart({ items, updateQuantity, onCheckout }) {
  const total = items.reduce((sum, item) => sum + Number(item.product.price || 0) * item.quantity, 0)
  return (
    <aside className="panel h-fit p-5 lg:sticky lg:top-24" aria-label="Shopping cart">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">Your cart</h2>
        <span className="rounded-full bg-lime px-3 py-1 text-xs font-bold">{items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
      </div>
      {items.length === 0 ? (
        <EmptyState>Your cart is ready for something good.</EmptyState>
      ) : (
        <div className="mt-5 space-y-4">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex items-center justify-between gap-3 border-b border-ink/10 pb-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{product.name}</p>
                <p className="text-xs text-ink/50">{money(product.price)} each</p>
              </div>
              <div className="flex items-center rounded-full border border-ink/15 bg-paper">
                <button className="h-8 w-8" aria-label={`Decrease ${product.name} quantity`} onClick={() => updateQuantity(product.id, quantity - 1)}>−</button>
                <span className="w-6 text-center text-sm font-bold">{quantity}</span>
                <button className="h-8 w-8" aria-label={`Increase ${product.name} quantity`} onClick={() => updateQuantity(product.id, quantity + 1)}>+</button>
              </div>
            </div>
          ))}
          <div className="flex justify-between text-lg font-black"><span>Total</span><span>{money(total)}</span></div>
          <button onClick={onCheckout} className="btn-primary w-full">Continue to checkout</button>
        </div>
      )}
    </aside>
  )
}

function Checkout({ items, onBack, onSuccess }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const total = items.reduce((sum, item) => sum + Number(item.product.price || 0) * item.quantity, 0)

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const order = await createOrder({
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        items: items.map(({ product, quantity }) => ({ product_id: product.id, quantity })),
      })
      onSuccess(order)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <button onClick={onBack} className="mb-6 text-sm font-bold text-moss">← Back to products</button>
      <div className="panel grid overflow-hidden md:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={submit} className="p-6 sm:p-9">
          <p className="eyebrow">Secure checkout</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Where should we reach you?</h1>
          <p className="mt-2 text-sm leading-6 text-ink/55">These details identify your order and let you track it later.</p>
          <div className="mt-7 space-y-4">
            {[
              ['name', 'Full name', 'text', 'Ada Lovelace'],
              ['email', 'Email', 'email', 'ada@example.com'],
              ['phone', 'Phone', 'tel', '+1 555 0100'],
            ].map(([name, label, type, placeholder]) => (
              <label key={name} className="block text-sm font-bold">
                {label}
                <input className="field mt-2" name={name} type={type} placeholder={placeholder} required value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} />
              </label>
            ))}
          </div>
          <ErrorMessage message={error} />
          <button disabled={submitting} className="btn-primary mt-6 w-full">{submitting ? 'Placing order…' : `Place order · ${money(total)}`}</button>
        </form>
        <div className="bg-ink p-6 text-white sm:p-9">
          <p className="eyebrow !text-lime">Order summary</p>
          <div className="mt-6 space-y-4">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex justify-between gap-4 text-sm">
                <span className="text-white/70">{quantity} × {product.name}</span>
                <span className="font-bold">{money(Number(product.price) * quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-between border-t border-white/20 pt-6 text-xl font-black"><span>Total</span><span>{money(total)}</span></div>
        </div>
      </div>
    </main>
  )
}

function Shop({ cart, setCart, onCheckout }) {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProducts = useCallback(async (term = '') => {
    setLoading(true)
    setError('')
    try {
      setProducts(toList(await getProducts(term), 'products'))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadProducts() }, [loadProducts])

  function add(product) {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id)
      return existing
        ? current.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { product, quantity: 1 }]
    })
  }

  function updateQuantity(id, quantity) {
    setCart((current) => quantity < 1 ? current.filter((item) => item.product.id !== id) : current.map((item) => item.product.id === id ? { ...item, quantity } : item))
  }

  return (
    <main>
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
        <p className="eyebrow">Useful things, thoughtfully picked</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-black leading-[1.05] tracking-[-0.04em] sm:text-6xl">Everyday goods.<br /><span className="text-moss">Nothing ordinary.</span></h1>
        <form className="mt-8 flex max-w-xl gap-2" role="search" onSubmit={(e) => { e.preventDefault(); loadProducts(search) }}>
          <label className="sr-only" htmlFor="product-search">Search products</label>
          <input id="product-search" className="field" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search the collection" />
          <button className="btn-primary">Search</button>
        </form>
      </section>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-20 sm:px-6 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black">The collection</h2>
            {!loading && <span className="text-sm text-ink/50">{products.length} products</span>}
          </div>
          <ErrorMessage message={error} />
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2"><div className="h-96 animate-pulse rounded-3xl bg-white" /><div className="h-96 animate-pulse rounded-3xl bg-white" /></div>
          ) : products.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} onAdd={add} />)}</div>
          ) : (
            <EmptyState>No products found. Try a different search.</EmptyState>
          )}
        </div>
        <Cart items={cart} updateQuantity={updateQuantity} onCheckout={onCheckout} />
      </section>
    </main>
  )
}

function OrderCard({ order, admin = false, onStatusChange, updating }) {
  const status = order.status || 'Pending'
  const date = order.created_at || order.createdAt
  return (
    <article className="rounded-2xl border border-ink/10 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Order #{String(order.id || '').slice(0, 8) || '—'}</p>
          <p className="mt-1 text-lg font-black">{money(orderTotal(order))}</p>
          {date && <p className="mt-1 text-xs text-ink/45">{new Date(date).toLocaleDateString()}</p>}
        </div>
        {admin ? (
          <label className="text-xs font-bold text-ink/50">
            Status
            <select aria-label={`Status for order ${order.id}`} className="ml-2 rounded-full border border-ink/15 bg-paper px-3 py-2 text-sm text-ink" value={status} disabled={updating} onChange={(e) => onStatusChange(order.id, e.target.value)}>
              {STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        ) : (
          <span className="rounded-full bg-lime px-3 py-1 text-xs font-bold">{status}</span>
        )}
      </div>
      {(order.customer?.name || order.customer_name) && <p className="mt-4 text-sm text-ink/60">Customer: {order.customer?.name || order.customer_name}</p>}
    </article>
  )
}

function Tracking() {
  const [email, setEmail] = useState('')
  const [orders, setOrders] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function track(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSearched(true)
    try {
      const customers = toList(await getCustomers(), 'customers')
      const customer = customers.find((item) => item.email?.toLowerCase() === email.trim().toLowerCase())
      setOrders(customer ? toList(await getOrders(customer.id), 'orders') : [])
    } catch (err) {
      setError(err.message)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="eyebrow">Order tracking</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Find your latest order.</h1>
      <p className="mt-3 text-ink/55">Enter the same email address you used at checkout.</p>
      <form onSubmit={track} className="panel mt-8 flex gap-2 p-3">
        <label htmlFor="tracking-email" className="sr-only">Customer email</label>
        <input id="tracking-email" className="field !border-0 !bg-transparent" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <button disabled={loading} className="btn-primary shrink-0">{loading ? 'Looking…' : 'Track'}</button>
      </form>
      <div className="mt-8 space-y-4">
        <ErrorMessage message={error} />
        {!loading && searched && !orders.length && !error && <EmptyState>No orders were found for this email.</EmptyState>}
        {orders.map((order) => <OrderCard key={order.id} order={order} />)}
      </div>
    </main>
  )
}

function Admin() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState('')

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try { setOrders(toList(await getOrders(), 'orders')) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadOrders() }, [loadOrders])

  async function changeStatus(id, status) {
    setUpdating(id)
    setError('')
    try {
      await updateOrderStatus(id, status)
      setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order))
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdating('')
    }
  }

  const totals = useMemo(() => ({ count: orders.length, revenue: orders.reduce((sum, order) => sum + orderTotal(order), 0) }), [orders])

  return (
    <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Business dashboard</p><h1 className="mt-3 text-4xl font-black tracking-tight">Orders at a glance.</h1></div>
        <button onClick={loadOrders} className="btn-secondary">Refresh</button>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="panel p-6"><p className="text-sm text-ink/50">Total orders</p><p className="mt-2 text-3xl font-black">{totals.count}</p></div>
        <div className="panel p-6"><p className="text-sm text-ink/50">Order value</p><p className="mt-2 text-3xl font-black">{money(totals.revenue)}</p></div>
      </div>
      <div className="mt-8 space-y-4">
        <ErrorMessage message={error} />
        {loading ? <p className="text-sm text-ink/50">Loading orders…</p> : !orders.length ? <EmptyState>No orders yet.</EmptyState> : orders.map((order) => <OrderCard key={order.id} order={order} admin onStatusChange={changeStatus} updating={updating === order.id} />)}
      </div>
    </main>
  )
}

function Success({ order, onContinue }) {
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-2xl place-items-center px-4 py-16 text-center">
      <div className="panel w-full p-10">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-lime text-2xl">✓</div>
        <p className="eyebrow mt-7">Order confirmed</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Thanks for your order.</h1>
        <p className="mx-auto mt-3 max-w-md text-ink/55">Your order{order?.id ? ` #${String(order.id).slice(0, 8)}` : ''} was received. Use your email in order tracking for updates.</p>
        <button onClick={onContinue} className="btn-primary mt-7">Continue shopping</button>
      </div>
    </main>
  )
}

export default function App() {
  const [view, setView] = useState('shop')
  const [cart, setCart] = useState([])
  const [createdOrder, setCreatedOrder] = useState(null)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  function navigate(next) {
    setView(next)
    window.scrollTo?.(0, 0)
  }

  function orderCreated(order) {
    setCreatedOrder(order)
    setCart([])
    navigate('success')
  }

  return (
    <div className="min-h-screen">
      <Header view={view} setView={navigate} cartCount={cartCount} />
      {view === 'shop' && <Shop cart={cart} setCart={setCart} onCheckout={() => cart.length && navigate('checkout')} />}
      {view === 'checkout' && <Checkout items={cart} onBack={() => navigate('shop')} onSuccess={orderCreated} />}
      {view === 'track' && <Tracking />}
      {view === 'admin' && <Admin />}
      {view === 'success' && <Success order={createdOrder} onContinue={() => navigate('shop')} />}
      <footer className="border-t border-ink/10 px-4 py-8 text-center text-xs text-ink/45">Gabistar · Built for speed, kept simple.</footer>
    </div>
  )
}
