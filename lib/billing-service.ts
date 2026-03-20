import Stripe from 'stripe'
import { supabaseAdmin } from './supabase'
import { 
  SUBSCRIPTION_PLANS, 
  CREDIT_PACKAGES, 
  CREDIT_COSTS 
} from '@/types/billing'
import type { 
  SubscriptionPlan, 
  CreditTransaction, 
  UsageRecord,
  CreditBalance,
  Invoice,
  PaymentMethod
} from '@/types/billing'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

// Get or create Stripe customer for user
export async function getOrCreateCustomer(userId: string, email: string): Promise<string> {
  // Check if user already has a Stripe customer ID
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (userData?.stripe_customer_id) {
    return userData.stripe_customer_id
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  })

  // Save to database
  await supabaseAdmin
    .from('users')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId)

  return customer.id
}

// Create subscription checkout session
export async function createSubscriptionCheckout(
  userId: string,
  tier: 'starter' | 'pro' | 'premium' | 'enterprise',
  successUrl: string,
  cancelUrl: string
) {
  const priceId = getPriceIdForTier(tier)
  
  const session = await stripe.checkout.sessions.create({
    customer: await getOrCreateCustomer(userId, ''),
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: { userId, tier },
    },
  })

  return session
}

// Create credit purchase checkout
export async function createCreditCheckout(
  userId: string,
  packageId: string,
  successUrl: string,
  cancelUrl: string
) {
  const creditPackage = CREDIT_PACKAGES.find(p => p.id === packageId)
  if (!creditPackage) throw new Error('Invalid credit package')

  const priceId = getCreditPriceId(packageId)
  
  const session = await stripe.checkout.sessions.create({
    customer: await getOrCreateCustomer(userId, ''),
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { 
      userId, 
      type: 'credit_purchase',
      credits: creditPackage.credits.toString(),
    },
  })

  return session
}

// Get user's current subscription
export async function getUserSubscription(userId: string) {
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  return data
}

// Calculate credits remaining
export async function getCreditBalance(userId: string): Promise<CreditBalance> {
  const { data } = await supabaseAdmin
    .from('credit_balances')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!data) {
    // Create initial balance
    await supabaseAdmin
      .from('credit_balances')
      .insert({
        user_id: userId,
        credits: 0,
        lifetime_credits: 0,
        lifetime_spent: 0,
        auto_recharge: false,
        auto_recharge_threshold: 100,
        auto_recharge_amount: 1000,
      })

    return {
      userId,
      credits: 0,
      lifetimeCredits: 0,
      lifetimeSpent: 0,
      autoRecharge: false,
      autoRechargeThreshold: 100,
      autoRechargeAmount: 1000,
    }
  }

  return {
    userId: data.user_id,
    credits: data.credits,
    lifetimeCredits: data.lifetime_credits,
    lifetimeSpent: data.lifetime_spent,
    lastRefillAt: data.last_refill_at,
    autoRecharge: data.auto_recharge,
    autoRechargeThreshold: data.auto_recharge_threshold,
    autoRechargeAmount: data.auto_recharge_amount,
  }
}

// Check if user has enough credits
export async function hasEnoughCredits(userId: string, cost: number): Promise<boolean> {
  const balance = await getCreditBalance(userId)
  return balance.credits >= cost
}

// Deduct credits for action
export async function useCredits(
  userId: string,
  action: string,
  cost: number,
  projectId?: string,
  details?: Record<string, any>
): Promise<boolean> {
  const balance = await getCreditBalance(userId)
  
  if (balance.credits < cost) {
    return false
  }

  // Deduct credits
  await supabaseAdmin.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: cost,
  })

  // Record usage
  await supabaseAdmin
    .from('credit_usage')
    .insert({
      user_id: userId,
      action,
      credits_used: cost,
      project_id: projectId,
      details,
    })

  // Check if auto-recharge needed
  if (balance.autoRecharge && balance.credits - cost <= balance.autoRechargeThreshold) {
    // Trigger auto-recharge (async)
    triggerAutoRecharge(userId, balance.autoRechargeAmount)
  }

  return true
}

// Refund credits
export async function refundCredits(
  userId: string,
  amount: number,
  reason: string
): Promise<void> {
  await supabaseAdmin.rpc('add_credits', {
    p_user_id: userId,
    p_amount: amount,
  })

  await supabaseAdmin
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount,
      type: 'refund',
      description: reason,
    })
}

// Get usage history
export async function getUsageHistory(
  userId: string,
  limit: number = 100,
  offset: number = 0
): Promise<UsageRecord[]> {
  const { data } = await supabaseAdmin
    .from('credit_usage')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return data?.map((u: any) => ({
    id: u.id,
    userId: u.user_id,
    action: u.action,
    creditsUsed: u.credits_used,
    projectId: u.project_id,
    details: u.details,
    createdAt: u.created_at,
  })) || []
}

// Get transaction history
export async function getTransactionHistory(
  userId: string,
  limit: number = 100
): Promise<CreditTransaction[]> {
  const { data } = await supabaseAdmin
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return data?.map((t: any) => ({
    id: t.id,
    userId: t.user_id,
    amount: t.amount,
    type: t.type,
    description: t.description,
    action: t.action,
    projectId: t.project_id,
    createdAt: t.created_at,
  })) || []
}

// Cancel subscription
export async function cancelSubscription(userId: string): Promise<void> {
  const subscription = await getUserSubscription(userId)
  if (!subscription?.stripe_subscription_id) return

  await stripe.subscriptions.cancel(subscription.stripe_subscription_id)
}

// Update subscription tier
export async function updateSubscriptionTier(
  userId: string,
  newTier: 'starter' | 'pro' | 'premium' | 'enterprise'
): Promise<void> {
  const subscription = await getUserSubscription(userId)
  if (!subscription?.stripe_subscription_id) {
    throw new Error('No active subscription')
  }

  const newPriceId = getPriceIdForTier(newTier)

  await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    items: [{
      id: subscription.stripe_subscription_item_id,
      price: newPriceId,
    }],
    proration_behavior: 'create_prorations',
  })
}

// Get invoices
export async function getInvoices(userId: string): Promise<Invoice[]> {
  const customerId = await getOrCreateCustomer(userId, '')
  
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit: 100,
  })

  return invoices.data.map(inv => ({
    id: inv.id,
    userId,
    subscriptionId: inv.subscription?.toString(),
    status: inv.status as any,
    amount: inv.amount_due / 100,
    currency: inv.currency,
    periodStart: new Date(inv.period_start * 1000).toISOString(),
    periodEnd: new Date(inv.period_end * 1000).toISOString(),
    createdAt: new Date(inv.created * 1000).toISOString(),
    paidAt: inv.status_transitions?.paid_at 
      ? new Date(inv.status_transitions.paid_at * 1000).toISOString() 
      : undefined,
    pdfUrl: inv.invoice_pdf,
    items: inv.lines.data.map(line => ({
      description: line.description || 'Subscription',
      amount: line.amount / 100,
      quantity: line.quantity || 1,
      unitPrice: line.price?.unit_amount ? line.price.unit_amount / 100 : 0,
    })),
  }))
}

// Get payment methods
export async function getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
  const customerId = await getOrCreateCustomer(userId, '')
  
  const methods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  })

  return methods.data.map(pm => ({
    id: pm.id,
    type: 'card',
    brand: pm.card?.brand || 'unknown',
    last4: pm.card?.last4 || '0000',
    expMonth: pm.card?.exp_month || 0,
    expYear: pm.card?.exp_year || 0,
    isDefault: false, // Would need to check customer's invoice_settings
  }))
}

// Helper functions
function getPriceIdForTier(tier: string): string {
  const priceIds: Record<string, string> = {
    starter: process.env.STRIPE_STARTER_PRICE_ID!,
    pro: process.env.STRIPE_PRO_PRICE_ID!,
    premium: process.env.STRIPE_PREMIUM_PRICE_ID!,
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
  }
  
  const priceId = priceIds[tier]
  if (!priceId) throw new Error(`No price ID configured for tier: ${tier}`)
  return priceId
}

function getCreditPriceId(packageId: string): string {
  const priceIds: Record<string, string> = {
    credits_500: process.env.STRIPE_CREDIT_500_ID!,
    credits_1000: process.env.STRIPE_CREDIT_1000_ID!,
    credits_2500: process.env.STRIPE_CREDIT_2500_ID!,
    credits_5000: process.env.STRIPE_CREDIT_5000_ID!,
    credits_10000: process.env.STRIPE_CREDIT_10000_ID!,
  }
  
  const priceId = priceIds[packageId]
  if (!priceId) throw new Error(`No price ID for credit package: ${packageId}`)
  return priceId
}

async function triggerAutoRecharge(userId: string, amount: number): Promise<void> {
  // Queue auto-recharge job (would use a queue system like Bull/BullMQ)
  console.log(`Auto-recharging ${amount} credits for user ${userId}`)
}

// Webhook handler
export async function handleStripeWebhook(payload: string, signature: string): Promise<any> {
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object)
      break
    
    case 'invoice.payment_succeeded':
      await handleInvoicePaid(event.data.object)
      break
    
    case 'invoice.payment_failed':
      await handleInvoiceFailed(event.data.object)
      break
    
    case 'customer.subscription.deleted':
      await handleSubscriptionCancelled(event.data.object)
      break
  }

  return event
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId
  if (!userId) return

  // Credit purchase
  if (session.metadata?.type === 'credit_purchase') {
    const credits = parseInt(session.metadata.credits)
    
    await supabaseAdmin.rpc('add_credits', {
      p_user_id: userId,
      p_amount: credits,
    })

    await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: credits,
        type: 'purchase',
        description: `Purchased ${credits} credits`,
      })
  }
  
  // Subscription start
  if (session.mode === 'subscription') {
    await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        tier: session.metadata?.tier || 'starter',
        stripe_subscription_id: session.subscription,
        status: 'active',
      })
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  // Update subscription status
  if (invoice.subscription) {
    await supabaseAdmin
      .from('subscriptions')
      .update({ 
        status: 'active',
        current_period_end: new Date(invoice.period_end * 1000).toISOString(),
      })
      .eq('stripe_subscription_id', invoice.subscription)
  }
}

async function handleInvoiceFailed(invoice: Stripe.Invoice): Promise<void> {
  // Mark subscription as past_due
  if (invoice.subscription) {
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', invoice.subscription)
  }
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription): Promise<void> {
  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('stripe_subscription_id', subscription.id)
}

// Get subscription tier with credits
export function getSubscriptionTierWithCredits(tier: string): { tier: SubscriptionPlan; monthlyCredits: number } {
  const plan = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS]
  if (!plan) throw new Error(`Invalid tier: ${tier}`)

  const monthlyCredits = typeof plan.limits.aiGenerations === 'number' 
    ? plan.limits.aiGenerations * 10  // Each generation = 10 credits
    : 100000 // Enterprise unlimited

  return { tier: plan, monthlyCredits }
}

// Calculate cost for action
export function calculateCost(action: string, quantity: number = 1): number {
  const costPerAction = CREDIT_COSTS[action] || 0
  return costPerAction * quantity
}

// Format cost for display
export function formatCost(credits: number): string {
  return `$${(credits / 100).toFixed(2)}`
}
