export interface UserAnnouncement {
  id: number
  title: string
  content: string
  notify_mode: string
  starts_at?: string
  ends_at?: string
  read_at?: string
  created_at: string
  updated_at: string
}

export interface TencentCaptchaRequestProof {
  tencent_captcha_ticket: string
  tencent_captcha_randstr: string
}

export interface ActionCaptchaRequestProof extends Partial<TencentCaptchaRequestProof> {
  turnstile_token?: string
}

export interface User {
  id: number
  username: string
  email: string
  role: "admin" | "user"
  balance: number
}

export interface AuthResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type: string
  user: User & { run_mode?: "standard" | "simple" }
}

// TOTP types
export interface TotpStatus {
  enabled: boolean
  enabled_at: number | null
  feature_enabled: boolean
}

export interface TotpSetupRequest {
  email_code?: string
  password?: string
}

export interface TotpSetupResponse {
  secret: string
  qr_code_url: string
  setup_token: string
  countdown: number
}

export interface TotpEnableRequest {
  totp_code: string
  setup_token: string
}

export interface TotpEnableResponse {
  success: boolean
}

export interface TotpDisableRequest {
  email_code?: string
  password?: string
}

export interface TotpVerificationMethod {
  method: "email" | "password"
}

export interface TotpLoginResponse {
  requires_2fa: boolean
  temp_token?: string
  user_email_masked?: string
}

export interface TotpLogin2FARequest {
  temp_token: string
  totp_code: string
}
