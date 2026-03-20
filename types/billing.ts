export type SubscriptionTier = 'starter' | 'pro' | 'premium' | 'enterprise'

export interface SubscriptionPlan {
  id: SubscriptionTier
  name: string
  price: number
  currency: string
  interval: 'month' | 'year'
  description: string
  features: string[]
  limits: PlanLimits
  popular?: boolean
}

export interface PlanLimits {
  projects: number | 'unlimited'
  aiGenerations: number | 'unlimited'
  storageGB: number
  teamMembers: number
  deployments: number | 'unlimited'
  previewRefreshes: number | 'unlimited'
  chatMessages: number | 'unlimited'
  mobileBuilds: number | 'unlimited'
  customDomains: number
  apiCalls: number | 'unlimited'
  prioritySupport: boolean
}

// UPDATED PRICING - Profit margin on OpenAI costs
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 5.99,
    currency: 'USD',
    interval: 'month',
    description: 'Perfect for individuals exploring AI development',
    features: [
      '5 Projects',
      '100 AI Generations/month',
      '5GB Storage',
      'Basic Code Editor',
      'Live Preview',
      'Community Support',
    ],
    limits: {
      projects: 5,
      aiGenerations: 100,
      storageGB: 5,
      teamMembers: 1,
      deployments: 10,
      previewRefreshes: 500,
      chatMessages: 50,
      mobileBuilds: 2,
      customDomains: 0,
      apiCalls: 1000,
      prioritySupport: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 15.99,
    currency: 'USD',
    interval: 'month',
    description: 'For serious developers and small teams',
    popular: true,
    features: [
      'Unlimited Projects',
      '1,000 AI Generations/month',
      '50GB Storage',
      'Advanced Monaco Editor',
      'Database Sandbox',
      'Git Integration',
      'Team Collaboration (5 members)',
      'Priority Support',
    ],
    limits: {
      projects: 'unlimited',
      aiGenerations: 1000,
      storageGB: 50,
      teamMembers: 5,
      deployments: 'unlimited',
      previewRefreshes: 'unlimited',
      chatMessages: 500,
      mobileBuilds: 10,
      customDomains: 2,
      apiCalls: 10000,
      prioritySupport: true,
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 29.99,
    currency: 'USD',
    interval: 'month',
    description: 'For power users and growing teams',
    features: [
      'Everything in Pro',
      '5,000 AI Generations/month',
      '200GB Storage',
      'CI/CD Pipelines',
      'Custom Domain Support',
      'Plugin Marketplace',
      'Team Collaboration (15 members)',
      'Analytics Dashboard',
      'AI Agents',
      'Priority Support',
    ],
    limits: {
      projects: 'unlimited',
      aiGenerations: 5000,
      storageGB: 200,
      teamMembers: 15,
      deployments: 'unlimited',
      previewRefreshes: 'unlimited',
      chatMessages: 2000,
      mobileBuilds: 25,
      customDomains: 5,
      apiCalls: 50000,
      prioritySupport: true,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 150.00,
    currency: 'USD',
    interval: 'month',
    description: 'For organizations requiring scale and security',
    features: [
      'Everything in Premium',
      '50,000 AI Generations/month',
      '1TB Storage',
      'Unlimited Team Members',
      'SSO/SAML Authentication',
      'SLA Guarantee (99.9%)',
      'Dedicated Support',
      'Custom AI Models',
      'Audit Logs',
      'On-premise Option',
    ],
    limits: {
      projects: 'unlimited',
      aiGenerations: 50000,
      storageGB: 1024,
      teamMembers: 'unlimited',
      deployments: 'unlimited',
      previewRefreshes: 'unlimited',
      chatMessages: 'unlimited',
      mobileBuilds: 'unlimited',
      customDomains: 25,
      apiCalls: 'unlimited',
      prioritySupport: true,
    },
  },
}

// UPDATED CREDIT COSTS - Based on OpenAI pricing + 100-150% margin
export const CREDIT_COSTS: Record<string, number> = {
  // AI Operations (OpenAI charges $0.01-$0.06, we charge $0.12-$0.15 = 100-150% margin)
  ai_generation: 12,          // Was 5, now 12 credits ($0.12) - 100% margin on $0.06
  ai_chat: 5,                 // Was 2, now 5 credits ($0.05) - ~100% margin
  ai_refactor: 15,            // New: $0.15 - higher complexity
  ai_documentation: 8,        // New: $0.08
  ai_test_generation: 10,     // New: $0.10
  ai_security_scan: 20,     // New: $0.20 - premium feature
  ai_accessibility_check: 12, // New: $0.12
  
  // Preview & Testing
  preview_render: 1,          // $0.01 - low cost
  preview_refresh: 2,         // Was 1, now 2 credits
  
  // Deployment
  deployment: 10,             // $0.10
  deployment_rollback: 5,   // $0.05
  
  // Mobile (Was $0.20, now $1.20 = 6x increase)
  mobile_export_ios: 120,     // Was 20, now 120 credits ($1.20)
  mobile_export_android: 120, // Was 20, now 120 credits ($1.20)
  mobile_export_both: 200,    // Was 35, now 200 credits ($2.00) - bundle discount
  
  // Database
  db_query: 1,                // $0.01
  db_migration: 5,           // $0.05
  
  // Add-ons
  custom_domain: 200,        // Was 50, now 200 credits ($2.00/month)
  extra_team_seat: 200,      // $2.00/month per seat
  priority_support: 2000,    // $20.00/month
  
  // CI/CD
  pipeline_run: 15,          // $0.15
  pipeline_minute: 1,        // $0.01 per minute
  
  // Agent Operations
  agent_code_review: 25,      // $0.25
  agent_optimization: 30,    // $0.30
}

// UPDATED CREDIT PACKAGES
export const CREDIT_PACKAGES = [
  { id: 'credits_500', credits: 500, price: 5, pricePerCredit: 0.01 },
  { id: 'credits_1000', credits: 1000, price: 9, pricePerCredit: 0.009 },
  { id: 'credits_2500', credits: 2500, price: 20, pricePerCredit: 0.008 },
  { id: 'credits_5000', credits: 5000, price: 35, pricePerCredit: 0.007 },
  { id: 'credits_10000', credits: 10000, price: 60, pricePerCredit: 0.006 },
]

export interface CreditTransaction {
  id: string
  userId: string
  amount: number
  type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'subscription'
  description: string
  action?: string
  projectId?: string
  createdAt: string
}

export interface CreditBalance {
  userId: string
  credits: number
  lifetimeCredits: number
  lifetimeSpent: number
  lastRefillAt?: string
  autoRecharge: boolean
  autoRechargeThreshold: number
  autoRechargeAmount: number
}

export interface UsageRecord {
  id: string
  userId: string
  action: string
  creditsUsed: number
  projectId?: string
  details?: Record<string, any>
  createdAt: string
}

export interface Invoice {
  id: string
  userId: string
  subscriptionId?: string
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
  amount: number
  currency: string
  periodStart?: string
  periodEnd?: string
  createdAt: string
  paidAt?: string
  pdfUrl?: string
  items: InvoiceItem[]
}

export interface InvoiceItem {
  description: string
  amount: number
  quantity: number
  unitPrice: number
}

export interface PaymentMethod {
  id: string
  type: 'card'
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault: boolean
}
