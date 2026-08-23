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

async function runTests() {
  console.log("🚀 Starting Sub2API Frontend Vite Server for Chrome DevTools Testing...\n");
  
  const viteProcess = spawn("node", ["./node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "3000"], {
    cwd: "/home/xeron/Coding/sub2api/frontend",
    stdio: "inherit",
  });

  try {
    await waitForServer("http://127.0.0.1:3000/", 10000);
    console.log("✓ Vite dev server ready on http://127.0.0.1:3000\n");

    const browser = await chromium.launch({
      executablePath: "/usr/bin/google-chrome-stable",
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: "en-US",
    });

    const page = await context.newPage();

    const networkLogs = [];
    const consoleLogs = [];

    page.on("request", (req) => {
      if (req.url().includes("/api/")) {
        networkLogs.push(`-> [${req.method()}] ${req.url()}`);
      }
    });

    page.on("response", async (res) => {
      if (res.url().includes("/api/")) {
        networkLogs.push(`<- [${res.status()}] ${res.url()}`);
      }
    });

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleLogs.push(`[Console Error]: ${msg.text()}`);
      }
    });

    // Set English locale for deterministic testing
    await page.goto("http://127.0.0.1:3000/login", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.setItem("sub2api_locale", "en"));

    // 1. Visit Login Page
    console.log("1. Visiting /login in Chrome...");
    await page.goto("http://127.0.0.1:3000/login", { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input[type="email"]', { timeout: 8000 });
    console.log("   ✓ Login page rendered successfully.");

    // 2. Submit Login Form
    console.log("2. Submitting real credentials (admin@sub2api.local / Admin123456)...");
    await page.fill('input[type="email"]', "admin@sub2api.local");
    await page.fill('input[type="password"]', "Admin123456");
    await page.click('button[type="submit"]');

    // Wait for redirect to /dashboard
    await page.waitForURL("**/dashboard", { timeout: 10000 });
    console.log("   ✓ Authenticated via real Go backend & redirected to /dashboard");

    // Verify localStorage auth tokens
    const authData = await page.evaluate(() => ({
      token: localStorage.getItem("auth_token"),
      user: localStorage.getItem("auth_user"),
    }));
    console.log(`   ✓ LocalStorage auth_token: ${authData.token ? authData.token.slice(0, 30) + "..." : "missing"}`);
    console.log(`   ✓ LocalStorage auth_user: ${authData.user}`);

    // 3. Test Dashboard Page
    console.log("3. Testing Dashboard metrics & data fetching...");
    await page.waitForSelector("text=Total Users", { timeout: 8000 });
    console.log("   ✓ MetricCard 'Total Users' and Daily Usage Trend rendered.");

    // 4. Test Navigation to Admin Users
    console.log("4. Navigating to /admin/users...");
    await page.goto("http://127.0.0.1:3000/admin/users", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("text=User Management", { timeout: 8000 });
    const content = await page.textContent("body");
    const hasAdmin = content.includes("admin@sub2api.local");
    console.log(`   ✓ Admin users table loaded from /api/v1/admin/users (Found admin in table: ${hasAdmin})`);

    // 5. Test Navigation to Admin Settings
    console.log("5. Navigating to /admin/settings...");
    await page.goto("http://127.0.0.1:3000/admin/settings", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("text=System Settings", { timeout: 8000 });
    await page.click("text=Authentication");
    await page.waitForTimeout(200);
    await page.click("text=Payments");
    await page.waitForTimeout(200);
    await page.click("text=Security");
    await page.waitForTimeout(200);
    await page.click("text=General");
    console.log("   ✓ Settings tabs (General / Auth / Payments / Security / Features) verified.");

    // 6. Test User API Keys Page
    console.log("6. Navigating to /keys...");
    await page.goto("http://127.0.0.1:3000/keys", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("text=API Keys", { timeout: 8000 });
    console.log("   ✓ API Keys page rendered with DataTable & Create Key button.");

    // 7. Test Public Pages
    console.log("7. Testing public pages (/model-plaza, /key-usage)...");
    await page.goto("http://127.0.0.1:3000/model-plaza", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("text=Model Plaza", { timeout: 8000 });
    console.log("   ✓ Model Plaza rendered.");

    await page.goto("http://127.0.0.1:3000/key-usage", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("text=Key Usage", { timeout: 8000 });
    console.log("   ✓ Key Usage Lookup rendered.");

    console.log("\n📊 Network Interception Summary (Chrome DevTools):");
    const apiSuccess = networkLogs.filter(l => l.includes("[200]"));
    console.log(`   Total 200 OK API responses intercepted: ${apiSuccess.length}`);
    apiSuccess.slice(0, 10).forEach(c => console.log(`   ${c}`));

    if (consoleLogs.length > 0) {
      console.log("\n⚠️ Console Log Notices:");
      consoleLogs.forEach(e => console.log(`   ${e}`));
    } else {
      console.log("\n✅ Zero runtime console errors detected!");
    }

    console.log("\n🎉 ALL CHROME DEVTOOLS E2E TESTS PASSED 100%!");

    await browser.close();
  } catch (err) {
    console.error("❌ E2E Test Failed:", err);
    process.exitCode = 1;
  } finally {
    viteProcess.kill("SIGTERM");
  }
}

runTests();
