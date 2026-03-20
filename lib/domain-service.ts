import { supabaseAdmin } from './supabase'
import type { CustomDomain, DnsRecord, DomainVerification } from '@/types/domain'
import { DOMAIN_TLDS } from '@/types/domain'

export async function addCustomDomain(
  projectId: string, 
  domain: string, 
  primary: boolean = false
) {
  // Validate domain
  if (!isValidDomain(domain)) {
    throw new Error('Invalid domain format')
  }

  // Check if domain already exists
  const { data: existing } = await supabaseAdmin
    .from('custom_domains')
    .select('*')
    .eq('domain', domain)
    .single()

  if (existing) {
    throw new Error('Domain already registered')
  }

  // Generate verification
  const verification: DomainVerification = {
    type: 'dns',
    name: '_vercel',
    value: generateVerificationToken(),
    verified: false,
  }

  // Create domain record
  const { data, error } = await supabaseAdmin
    .from('custom_domains')
    .insert({
      project_id: projectId,
      domain,
      status: 'pending',
      verification,
      primary,
      auto_renew: true,
      ssl_enabled: true,
    })
    .select()
    .single()

  if (error) throw error

  return {
    ...data,
    instructions: generateDnsInstructions(domain, verification),
  }
}

export async function verifyDomain(domainId: string) {
  const { data: domain } = await supabaseAdmin
    .from('custom_domains')
    .select('*')
    .eq('id', domainId)
    .single()

  if (!domain) throw new Error('Domain not found')

  // Check DNS records
  const isVerified = await checkDnsVerification(domain.domain, domain.verification)

  if (isVerified) {
    await supabaseAdmin
      .from('custom_domains')
      .update({
        status: 'active',
        'verification.verified': true,
        'verification.verified_at': new Date().toISOString(),
      })
      .eq('id', domainId)

    return { success: true, status: 'active' }
  }

  return { success: false, status: 'pending' }
}

async function checkDnsVerification(domain: string, verification: DomainVerification): Promise<boolean> {
  // This would use a DNS lookup service
  // For now, simulating the check
  return false
}

export async function getDomainPrice(tld: string) {
  const pricing = DOMAIN_TLDS.find(p => p.tld === tld)
  if (!pricing) throw new Error('Unsupported TLD')
  return pricing
}

export async function getProjectDomains(projectId: string) {
  const { data, error } = await supabaseAdmin
    .from('custom_domains')
    .select('*')
    .eq('project_id', projectId)
    .order('primary', { ascending: false })

  if (error) throw error
  return data
}

export async function deleteDomain(domainId: string) {
  await supabaseAdmin
    .from('custom_domains')
    .delete()
    .eq('id', domainId)
}

function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/
  return domainRegex.test(domain)
}

function generateVerificationToken(): string {
  return crypto.randomUUID().replace(/-/g, '').substring(0, 32)
}

function generateDnsInstructions(domain: string, verification: DomainVerification) {
  return {
    type: 'TXT',
    name: verification.name,
    value: verification.value,
    instructions: `Add a TXT record to your DNS settings:

Type: TXT
Name: ${verification.name}
Value: ${verification.value}
TTL: 3600

This may take up to 24 hours to propagate.`,
  }
}
