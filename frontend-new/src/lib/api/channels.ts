import { apiClient } from "./client"

export type BillingMode = "token" | "per_request" | "image" | "video" | string

export interface UserPricingInterval {
  min_tokens: number
  max_tokens: number | null
  tier_label?: string
  input_price: number | null
  output_price: number | null
  cache_write_price: number | null
  cache_read_price: number | null
  per_request_price: number | null
}

export interface UserSupportedModelPricing {
  billing_mode: BillingMode
  input_price: number | null
  output_price: number | null
  cache_write_price: number | null
  cache_read_price: number | null
  image_input_price: number | null
  image_output_price: number | null
  per_request_price: number | null
  intervals: UserPricingInterval[]
}

export interface UserSupportedModel {
  name: string
  platform: string
  pricing: UserSupportedModelPricing | null
}

export interface UserAvailableGroup {
  id: number
  name: string
  platform: string
  rate_multiplier: number
}

export interface UserChannelPlatformSection {
  platform: string
  groups: UserAvailableGroup[]
  supported_models: UserSupportedModel[]
}

export interface UserAvailableChannel {
  name: string
  description: string
  platforms: UserChannelPlatformSection[]
}

export async function getAvailableChannels(opts?: { signal?: AbortSignal }): Promise<UserAvailableChannel[]> {
  const { data } = await apiClient.get<UserAvailableChannel[]>("/channels/available", { signal: opts?.signal })
  return data
}
