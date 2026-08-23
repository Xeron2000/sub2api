import { httpClient } from "./client/http-client"
export type PublicSettings = { site_name?: string; site_logo?: string; contact_info?: string; backend_mode_enabled?: boolean }
export function getPublicSettings() { return httpClient.get<PublicSettings>("/settings/public").then(r => r.data) }
export type ModelPlazaItem = { id: string; name: string; group: string }
export function getModelPlaza() { return httpClient.get<{ models: ModelPlazaItem[] }>("/model-plaza/models").then(r => r.data) }
export function getKeyUsage(key: string) { return httpClient.get<{ usage: unknown }>(`/key-usage`, { params: { key } }).then(r => r.data) }
