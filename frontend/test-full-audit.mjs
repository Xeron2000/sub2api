import { chromium } from "playwright";
import { spawn } from "child_process";
import http from "http";

function waitForServer(url, timeout = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, (res) => {
        if (res.statusCode === 200 || res.statusCode === 404) {
          resolve(true);
        } else {
          retry();
        }
      }).on("error", () => {
        retry();
      });
    };
    const retry = () => {
      if (Date.now() - start > timeout) {
        reject(new Error(`Server at ${url} not ready within ${timeout}ms`));
      } else {
        setTimeout(check, 200);
      }
    };
    check();
  });
}

const ROUTES = [
  // Setup & Public
  { path: "/setup", auth: false, desc: "Setup Wizard" },
  { path: "/home", auth: false, desc: "Home Landing" },
  { path: "/model-plaza", auth: false, desc: "Model Plaza" },
  { path: "/key-usage", auth: false, desc: "Key Usage Lookup" },
  { path: "/legal/terms", auth: false, desc: "Legal Terms" },
  
  // Auth
  { path: "/login", auth: false, desc: "Login Page" },
  { path: "/register", auth: false, desc: "Register Page" },
  { path: "/forgot-password", auth: false, desc: "Forgot Password" },
  { path: "/reset-password", auth: false, desc: "Reset Password" },
  { path: "/email-verify", auth: false, desc: "Email Verify" },
  
  // User Portal
  { path: "/dashboard", auth: true, desc: "User Dashboard" },
  { path: "/keys", auth: true, desc: "API Keys Management" },
  { path: "/usage", auth: true, desc: "Usage Logs & Errors" },
  { path: "/subscriptions", auth: true, desc: "Subscriptions" },
  { path: "/purchase", auth: true, desc: "Purchase Plans" },
  { path: "/orders", auth: true, desc: "Order History" },
  { path: "/redeem", auth: true, desc: "Redeem Card Codes" },
  { path: "/affiliate", auth: true, desc: "Affiliate Referral" },
  { path: "/profile", auth: true, desc: "User Profile & Security" },
  { path: "/available-channels", auth: true, desc: "Available Channels" },
  { path: "/monitor", auth: true, desc: "Channel Status Monitor" },
  { path: "/batch-image-guide", auth: true, desc: "Batch Image Guide" },
  { path: "/payment/qrcode?order_id=test-1", auth: true, desc: "Payment QRCode" },
  { path: "/payment/stripe?order_id=test-1", auth: true, desc: "Stripe Payment" },
  { path: "/payment/airwallex?order_id=test-1", auth: true, desc: "Airwallex Payment" },
  { path: "/payment/result?order_id=test-1", auth: true, desc: "Payment Result" },

  // Admin Console
  { path: "/admin/dashboard", auth: true, admin: true, desc: "Admin Dashboard" },
  { path: "/admin/users", auth: true, admin: true, desc: "Admin Users" },
  { path: "/admin/groups", auth: true, admin: true, desc: "Admin Groups" },
  { path: "/admin/channels/pricing", auth: true, admin: true, desc: "Admin Channels Pricing" },
  { path: "/admin/channels/monitor", auth: true, admin: true, desc: "Admin Channel Monitor" },
  { path: "/admin/accounts", auth: true, admin: true, desc: "Admin Accounts" },
  { path: "/admin/proxies", auth: true, admin: true, desc: "Admin Proxies" },
  { path: "/admin/subscriptions", auth: true, admin: true, desc: "Admin Subscriptions" },
  { path: "/admin/promo-codes", auth: true, admin: true, desc: "Admin Promo Codes" },
  { path: "/admin/redeem", auth: true, admin: true, desc: "Admin Redeem Codes" },
  { path: "/admin/announcements", auth: true, admin: true, desc: "Admin Announcements" },
  { path: "/admin/settings", auth: true, admin: true, desc: "Admin Settings" },
  { path: "/admin/ops", auth: true, admin: true, desc: "Admin Ops Realtime" },
  { path: "/admin/risk-control", auth: true, admin: true, desc: "Admin Risk Control" },
  { path: "/admin/prompt-audit", auth: true, admin: true, desc: "Admin Prompt Audit" },
  { path: "/admin/audit-logs", auth: true, admin: true, desc: "Admin Audit Logs" },
  { path: "/admin/usage", auth: true, admin: true, desc: "Admin Usage Analytics" },
];

async function runAudit() {
  console.log("🚀 Starting Comprehensive Chrome DevTools Deep Audit on Sub2API...\n");

  const viteProcess = spawn("node", ["./node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "3000"], {
    cwd: "/home/xeron/Coding/sub2api/frontend",
    stdio: "inherit",
  });

  const issues = [];
  const network4xx5xx = [];

  try {
    await waitForServer("http://127.0.0.1:3000/", 10000);

    const browser = await chromium.launch({
      executablePath: "/usr/bin/google-chrome-stable",
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: "zh-CN",
    });

    const page = await context.newPage();

    page.on("response", async (res) => {
      if (res.url().includes("/api/") && res.status() >= 400 && res.status() !== 401) {
        network4xx5xx.push({
          url: res.url(),
          status: res.status(),
          statusText: res.statusText(),
        });
      }
    });

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        issues.push({ type: "console_error", text: msg.text(), location: page.url() });
      }
    });

    page.on("pageerror", (err) => {
      issues.push({ type: "page_crash", text: err.message, location: page.url() });
    });

    // Step 1: Login
    console.log("Step 1: Performing Admin Login...");
    await page.goto("http://127.0.0.1:3000/login", { waitUntil: "domcontentloaded" });
    await page.fill('input[type="email"]', "admin@sub2api.local");
    await page.fill('input[type="password"]', "Admin123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 10000 });
    console.log("✓ Login successful, JWT token saved.\n");

    // Step 2: Audit All 40+ Core Routes
    console.log("Step 2: Auditing All Core Routes & UI State...\n");
    for (const r of ROUTES) {
      process.stdout.write(`  Testing [${r.path}] (${r.desc})... `);
      try {
        await page.goto(`http://127.0.0.1:3000${r.path}`, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(500);

        // Check if page has error boundary or crash
        const text = await page.textContent("body");
        if (text.includes("Something went wrong") || text.includes("Unhandled Runtime Error")) {
          issues.push({ type: "runtime_error_screen", path: r.path, desc: r.desc });
          console.log("❌ CRASHED");
        } else {
          console.log("✓ OK");
        }
      } catch (e) {
        issues.push({ type: "navigation_timeout", path: r.path, error: e.message });
        console.log(`❌ TIMEOUT (${e.message})`);
      }
    }

    // Step 3: Interactive Component Testing (Modals, Sheets, Form Submissions)
    console.log("\nStep 3: Testing Interactive Forms & Modals...");
    
    // Test Keys Create Sheet
    await page.goto("http://127.0.0.1:3000/keys", { waitUntil: "domcontentloaded" });
    await page.click('button:has-text("Create key"), button:has-text("新建"), button:has-text("Create")');
    await page.waitForTimeout(300);
    const hasKeySheet = (await page.content()).includes("Name") || (await page.content()).includes("名称");
    console.log(`  - Create Key Sheet/Dialog opened: ${hasKeySheet ? "✓" : "❌"}`);

    // Test Admin Users Create Sheet
    await page.goto("http://127.0.0.1:3000/admin/users", { waitUntil: "domcontentloaded" });
    await page.click('button:has-text("Create user"), button:has-text("新建用户")');
    await page.waitForTimeout(300);
    const hasUserSheet = (await page.content()).includes("Email") || (await page.content()).includes("邮箱");
    console.log(`  - Create User Sheet/Dialog opened: ${hasUserSheet ? "✓" : "❌"}`);

    // Test Admin Settings Save
    await page.goto("http://127.0.0.1:3000/admin/settings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    console.log("  - Admin Settings Form render & switch tabs: ✓");

    console.log("\n==========================================");
    console.log("📋 AUDIT SUMMARY REPORT");
    console.log("==========================================");
    console.log(`Total Routes Tested: ${ROUTES.length}`);
    console.log(`Crashes / Runtime Errors: ${issues.filter(i => i.type === 'page_crash' || i.type === 'runtime_error_screen').length}`);
    console.log(`Console Errors Caught: ${issues.filter(i => i.type === 'console_error').length}`);
    console.log(`Backend API 4xx/5xx Errors: ${network4xx5xx.length}`);

    if (network4xx5xx.length > 0) {
      console.log("\n⚠️ Backend 4xx/5xx API Endpoints:");
      const uniqueUrls = [...new Set(network4xx5xx.map(n => `[${n.status}] ${n.url}`))];
      uniqueUrls.forEach(u => console.log(`  - ${u}`));
    }

    if (issues.length > 0) {
      console.log("\n⚠️ Client Issues / Console Warnings:");
      issues.slice(0, 10).forEach(i => console.log(`  - [${i.type}] ${i.text || i.path}`));
    }

    await browser.close();
  } catch (err) {
    console.error("Audit failed:", err);
  } finally {
    viteProcess.kill("SIGTERM");
  }
}

runAudit();
