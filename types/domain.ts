export type DomainStatus = 'pending' | 'active' | 'error' | 'expired' | 'transferring'
export type DnsRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS'

export interface CustomDomain {
  id: string
  domain: string
  projectId: string
  status: DomainStatus
  vercelDomainId?: string
  createdAt: string
  updatedAt: string
  expiresAt?: string
  autoRenew: boolean
  sslEnabled: boolean
  dnsRecords: DnsRecord[]
  verification: DomainVerification
  redirect?: string
  primary: boolean
}

export interface DnsRecord {
  id: string
  type: DnsRecordType
  name: string
  value: string
  ttl: number
  priority?: number
}

export interface DomainVerification {
  type: 'dns' | 'file'
  name: string
  value: string
  verified: boolean
  verifiedAt?: string
}

export interface DomainAnalytics {
  domainId: string
  period: string
  requests: number
  bandwidth: number
  uniqueVisitors: number
  topPaths: { path: string; requests: number }[]
  topReferrers: { referrer: string; requests: number }[]
  statusCodes: Record<string, number>
}

export interface DomainPricing {
  tld: string
  registrationPrice: number
  renewalPrice: number
  transferPrice: number
  minRegistrationYears: number
  maxRegistrationYears: number
}

export const DOMAIN_TLDS: DomainPricing[] = [
  { tld: '.com', registrationPrice: 12, renewalPrice: 12, transferPrice: 12, minRegistrationYears: 1, maxRegistrationYears: 10 },
  { tld: '.io', registrationPrice: 35, renewalPrice: 35, transferPrice: 35, minRegistrationYears: 1, maxRegistrationYears: 10 },
  { tld: '.app', registrationPrice: 14, renewalPrice: 14, transferPrice: 14, minRegistrationYears: 1, maxRegistrationYears: 10 },
  { tld: '.dev', registrationPrice: 15, renewalPrice: 15, transferPrice: 15, minRegistrationYears: 1, maxRegistrationYears: 10 },
  { tld: '.co', registrationPrice: 25, renewalPrice: 25, transferPrice: 25, minRegistrationYears: 1, maxRegistrationYears: 10 },
]
