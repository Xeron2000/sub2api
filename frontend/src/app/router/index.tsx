import { createBrowserRouter, Navigate } from "react-router-dom"
import { AppShell } from "@/app/layouts/AppShell"
import { Protected } from "./Protected"

// Public
import { HomePage } from "@/pages/public/HomePage"
import { LegalDocumentPage } from "@/pages/public/LegalDocumentPage"
import { ModelPlazaPage } from "@/pages/public/ModelPlazaPage"
import { KeyUsagePage } from "@/pages/public/KeyUsagePage"
import { SetupPage } from "@/pages/setup/SetupPage"

// Auth
import { LoginPage } from "@/pages/auth/LoginPage"
import { RegisterPage } from "@/pages/auth/RegisterPage"
import { EmailVerifyPage } from "@/pages/auth/EmailVerifyPage"
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage"
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage"
import { OAuthCallbackPage } from "@/pages/auth/OAuthCallbackPage"
import { LinuxDoCallbackPage } from "@/pages/auth/LinuxDoCallbackPage"
import { WechatCallbackPage } from "@/pages/auth/WechatCallbackPage"
import { WechatPaymentCallbackPage } from "@/pages/auth/WechatPaymentCallbackPage"
import { DingTalkCallbackPage } from "@/pages/auth/DingTalkCallbackPage"
import { DingTalkEmailCompletionPage } from "@/pages/auth/DingTalkEmailCompletionPage"
import { OidcCallbackPage } from "@/pages/auth/OidcCallbackPage"

// User
import { DashboardPage as UserDashboardPage } from "@/pages/user/DashboardPage"
import { KeysPage } from "@/pages/user/KeysPage"
import { BatchImageGuidePage } from "@/pages/user/BatchImageGuidePage"
import { UsagePage as UserUsagePage } from "@/pages/user/UsagePage"
import { RedeemPage as UserRedeemPage } from "@/pages/user/RedeemPage"
import { AffiliatePage } from "@/pages/user/AffiliatePage"
import { AvailableChannelsPage } from "@/pages/user/AvailableChannelsPage"
import { ProfilePage } from "@/pages/user/ProfilePage"
import { SubscriptionsPage as UserSubscriptionsPage } from "@/pages/user/SubscriptionsPage"
import { PurchasePage } from "@/pages/user/PurchasePage"
import { OrdersPage } from "@/pages/user/OrdersPage"
import { PaymentQRCodePage } from "@/pages/user/PaymentQRCodePage"
import { PaymentResultPage } from "@/pages/user/PaymentResultPage"
import { StripePaymentPage } from "@/pages/user/StripePaymentPage"
import { AirwallexPaymentPage } from "@/pages/user/AirwallexPaymentPage"
import { StripePopupPage } from "@/pages/user/StripePopupPage"
import { CustomPage } from "@/pages/user/CustomPage"
import { ChannelStatusPage } from "@/pages/user/ChannelStatusPage"

// Admin
import { DashboardPageAdmin as AdminDashboardPage } from "@/pages/admin/DashboardPage"
import { OpsPage } from "@/pages/admin/OpsPage"
import { AuditLogsPage } from "@/pages/admin/AuditLogsPage"
import { UsersPage as AdminUsersPage } from "@/pages/admin/UsersPage"
import { GroupsPage } from "@/pages/admin/GroupsPage"
import { ChannelsPage as AdminChannelsPage } from "@/pages/admin/ChannelsPage"
import { ChannelMonitorPage } from "@/pages/admin/ChannelMonitorPage"
import { SubscriptionsAdminPage } from "@/pages/admin/SubscriptionsAdminPage"
import { AccountsPage } from "@/pages/admin/AccountsPage"
import { AnnouncementsPage } from "@/pages/admin/AnnouncementsPage"
import { ProxiesPage } from "@/pages/admin/ProxiesPage"
import { RedeemPage as AdminRedeemPage } from "@/pages/admin/RedeemPage"
import { PromoCodesPage } from "@/pages/admin/PromoCodesPage"
import { SettingsPage } from "@/pages/admin/SettingsPage"
import { RiskControlPage } from "@/pages/admin/RiskControlPage"
import { PromptAuditPage } from "@/pages/admin/PromptAuditPage"
import { UsagePage as AdminUsagePage } from "@/pages/admin/UsagePage"

function NotFound() { return <div className="p-8 text-sm">Not Found</div> }

export const router = createBrowserRouter([
  // Setup
  { path: "/setup", element: <SetupPage /> },

  // Public
  { path: "/home", element: <HomePage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/email-verify", element: <EmailVerifyPage /> },
  { path: "/auth/callback", element: <OAuthCallbackPage /> },
  { path: "/auth/oauth/callback", element: <OAuthCallbackPage /> },
  { path: "/auth/linuxdo/callback", element: <LinuxDoCallbackPage /> },
  { path: "/auth/wechat/callback", element: <WechatCallbackPage /> },
  { path: "/auth/wechat/payment/callback", element: <WechatPaymentCallbackPage /> },
  { path: "/auth/dingtalk/callback", element: <DingTalkCallbackPage /> },
  { path: "/auth/dingtalk/email-completion", element: <DingTalkEmailCompletionPage /> },
  { path: "/auth/oidc/callback", element: <OidcCallbackPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/key-usage", element: <KeyUsagePage /> },
  { path: "/legal/:documentId", element: <LegalDocumentPage /> },
  { path: "/model-plaza", element: <ModelPlazaPage /> },

  // User (protected)
  { path: "/", element: <Navigate to="/home" replace /> },
  { path: "/dashboard", element: <Protected><AppShell><UserDashboardPage /></AppShell></Protected> },
  { path: "/keys", element: <Protected><AppShell><KeysPage /></AppShell></Protected> },
  { path: "/batch-image", element: <Protected><AppShell><BatchImageGuidePage /></AppShell></Protected> },
  { path: "/docs/batch-image", element: <Protected><AppShell><BatchImageGuidePage /></AppShell></Protected> },
  { path: "/usage", element: <Protected><AppShell><UserUsagePage /></AppShell></Protected> },
  { path: "/redeem", element: <Protected><AppShell><UserRedeemPage /></AppShell></Protected> },
  { path: "/affiliate", element: <Protected><AppShell><AffiliatePage /></AppShell></Protected> },
  { path: "/available-channels", element: <Protected><AppShell><AvailableChannelsPage /></AppShell></Protected> },
  { path: "/profile", element: <Protected><AppShell><ProfilePage /></AppShell></Protected> },
  { path: "/subscriptions", element: <Protected><AppShell><UserSubscriptionsPage /></AppShell></Protected> },
  { path: "/purchase", element: <Protected><AppShell><PurchasePage /></AppShell></Protected> },
  { path: "/orders", element: <Protected><AppShell><OrdersPage /></AppShell></Protected> },
  { path: "/payment/qrcode", element: <Protected><AppShell><PaymentQRCodePage /></AppShell></Protected> },
  { path: "/payment/result", element: <PaymentResultPage /> },
  { path: "/payment/stripe", element: <StripePaymentPage /> },
  { path: "/payment/airwallex", element: <AirwallexPaymentPage /> },
  { path: "/payment/stripe-popup", element: <StripePopupPage /> },
  { path: "/custom/:id", element: <Protected><AppShell><CustomPage /></AppShell></Protected> },
  { path: "/monitor", element: <Protected><AppShell><ChannelStatusPage /></AppShell></Protected> },

  // Admin (protected admin)
  { path: "/admin", element: <Navigate to="/admin/dashboard" replace /> },
  { path: "/admin/dashboard", element: <Protected admin><AppShell><AdminDashboardPage /></AppShell></Protected> },
  { path: "/admin/ops", element: <Protected admin><AppShell><OpsPage /></AppShell></Protected> },
  { path: "/admin/audit-logs", element: <Protected admin><AppShell><AuditLogsPage /></AppShell></Protected> },
  { path: "/admin/users", element: <Protected admin><AppShell><AdminUsersPage /></AppShell></Protected> },
  { path: "/admin/groups", element: <Protected admin><AppShell><GroupsPage /></AppShell></Protected> },
  { path: "/admin/channels", element: <Navigate to="/admin/channels/pricing" replace /> },
  { path: "/admin/channels/pricing", element: <Protected admin><AppShell><AdminChannelsPage /></AppShell></Protected> },
  { path: "/admin/channels/monitor", element: <Protected admin><AppShell><ChannelMonitorPage /></AppShell></Protected> },
  { path: "/admin/subscriptions", element: <Protected admin><AppShell><SubscriptionsAdminPage /></AppShell></Protected> },
  { path: "/admin/accounts", element: <Protected admin><AppShell><AccountsPage /></AppShell></Protected> },
  { path: "/admin/announcements", element: <Protected admin><AppShell><AnnouncementsPage /></AppShell></Protected> },
  { path: "/admin/proxies", element: <Protected admin><AppShell><ProxiesPage /></AppShell></Protected> },
  { path: "/admin/redeem", element: <Protected admin><AppShell><AdminRedeemPage /></AppShell></Protected> },
  { path: "/admin/promo-codes", element: <Protected admin><AppShell><PromoCodesPage /></AppShell></Protected> },
  { path: "/admin/settings", element: <Protected admin><AppShell><SettingsPage /></AppShell></Protected> },
  { path: "/admin/risk-control", element: <Protected admin><AppShell><RiskControlPage /></AppShell></Protected> },
  { path: "/admin/prompt-audit", element: <Protected admin><AppShell><PromptAuditPage /></AppShell></Protected> },
  { path: "/admin/usage", element: <Protected admin><AppShell><AdminUsagePage /></AppShell></Protected> },

  { path: "*", element: <NotFound /> },
])
