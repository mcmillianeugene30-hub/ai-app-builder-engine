export type MobilePlatform = 'ios' | 'android' | 'both'
export type MobileFramework = 'react-native' | 'flutter' | 'ionic'
export type BuildStatus = 'queued' | 'building' | 'completed' | 'failed'

export interface MobileExport {
  id: string
  projectId: string
  platform: MobilePlatform
  framework: MobileFramework
  status: BuildStatus
  config: MobileConfig
  createdAt: string
  updatedAt: string
  buildUrl?: string
  downloadUrl?: string
  errorMessage?: string
  expiresAt?: string
}

export interface MobileConfig {
  appName: string
  bundleId: string
  version: string
  buildNumber: number
  icons: MobileAsset[]
  splashScreens: MobileAsset[]
  permissions: string[]
  environment: Record<string, string>
  customScripts?: Record<string, string>
}

export interface MobileAsset {
  id: string
  type: 'icon' | 'splash'
  platform?: 'ios' | 'android'
  size: string
  url: string
  density?: string
}

export interface MobileBuild {
  id: string
  exportId: string
  platform: MobilePlatform
  status: BuildStatus
  startedAt?: string
  completedAt?: string
  durationMs?: number
  logs: MobileBuildLog[]
  artifacts: MobileArtifact[]
}

export interface MobileBuildLog {
  timestamp: string
  level: 'info' | 'warning' | 'error'
  message: string
  step?: string
}

export interface MobileArtifact {
  id: string
  type: 'apk' | 'aab' | 'ipa' | 'app' | 'source'
  platform: 'ios' | 'android'
  url: string
  size: number
  createdAt: string
}

// Pricing for mobile builds
export const MOBILE_BUILD_PRICING: Record<MobilePlatform, number> = {
  ios: 50,
  android: 40,
  both: 80,
}
