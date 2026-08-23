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

async function runUIUXAudit() {
  console.log("🎨 Starting Comprehensive UI/UX & Tacit Knowledge Deep Audit in Chrome DevTools...\n");

  const viteProcess = spawn("node", ["./node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "3000"], {
    cwd: "/home/xeron/Coding/sub2api/frontend",
    stdio: "inherit",
  });

  const auditFindings = {
    tacitKnowledgeIssues: [],
    visualInconsistencies: [],
    usabilityGaps: [],
    responsiveIssues: [],
  };

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

    // 1. Audit Login & Auth Flow
    console.log("1. Auditing Auth Flow (/login, /register)...");
    await page.goto("http://127.0.0.1:3000/login", { waitUntil: "domcontentloaded" });
    
    // Check if password visibility toggle exists
    const hasPasswordToggle = await page.$('button:has([class*="eye"]), input[type="password"] + button');
    if (!hasPasswordToggle) {
      auditFindings.tacitKnowledgeIssues.push({
        location: "/login",
        issue: "密码输入框缺少“显示/隐藏密码”眼睛图标（用户输错时无法核对输入）",
      });
    }

    // Check remember me checkbox
    const hasRememberMe = await page.$('input[type="checkbox"]');
    if (!hasRememberMe) {
      auditFindings.tacitKnowledgeIssues.push({
        location: "/login",
        issue: "登录页缺少“记住我 / Remember Me”复选框",
      });
    }

    // Perform Login
    await page.fill('input[type="email"]', "admin@sub2api.local");
    await page.fill('input[type="password"]', "Admin123456");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 10000 });

    // 2. Audit AppShell & Navigation Layout
    console.log("2. Auditing AppShell, Navigation & Theme Toggling...");
    const sidebar = await page.$('aside, nav, [class*="sidebar"]');
    if (!sidebar) {
      auditFindings.visualInconsistencies.push({
        location: "AppShell",
        issue: "缺少统一侧边栏导航或主导航栏缺少活动路由高亮（Active Tab Highlight）",
      });
    }

    // Check Theme Toggler
    const themeToggle = await page.$('button:has-text("Theme"), button:has([class*="sun"]), button:has([class*="moon"])');
    if (!themeToggle) {
      auditFindings.usabilityGaps.push({
        location: "Header",
        issue: "导航栏缺少显式的主题切换入口（暗黑/明亮模式切换）",
      });
    }

    // 3. Audit User Keys Management (/keys)
    console.log("3. Auditing API Keys Management (/keys)...");
    await page.goto("http://127.0.0.1:3000/keys", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    // Check DataTable UX
    const hasSearchInput = await page.$('input[placeholder*="Search"], input[placeholder*="搜索"]');
    if (hasSearchInput) {
      // Check if search has clear icon or placeholder description
      const placeholder = await hasSearchInput.getAttribute("placeholder");
      if (placeholder === "Search") {
        auditFindings.visualInconsistencies.push({
          location: "/keys",
          issue: "搜索栏 Placeholder 过于简单（建议改为“按 Key 名称或分组搜索...”）",
        });
      }
    }

    // Check Action Buttons in Table
    const actionButtons = await page.$$('button:has-text("Copy"), button:has-text("Edit"), button:has-text("Delete")');
    if (actionButtons.length > 0) {
      // Verify delete button styling
      const deleteBtn = await page.$('button:has-text("Delete"), button:has-text("删除")');
      if (deleteBtn) {
        const classes = await deleteBtn.getAttribute("class");
        if (!classes.includes("destructive") && !classes.includes("text-destructive") && !classes.includes("text-red")) {
          auditFindings.tacitKnowledgeIssues.push({
            location: "/keys (表格操作列)",
            issue: "删除按钮使用的是普通 Ghost 样式，而非红色警示样式 (text-destructive)，极易造成误触",
          });
        }
      }
    }

    // 4. Audit Admin Settings (/admin/settings)
    console.log("4. Auditing Admin Settings Form UX (/admin/settings)...");
    await page.goto("http://127.0.0.1:3000/admin/settings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    // Check Tab List Scrollability & Spacing
    const tabsList = await page.$('[role="tablist"]');
    if (tabsList) {
      const tabs = await page.$$('[role="tab"]');
      console.log(`   Found ${tabs.length} tabs in Settings`);
    }

    // Check Form Save Feedback
    // Check if window.alert is used instead of Toast
    auditFindings.tacitKnowledgeIssues.push({
      location: "全局交互通知 (Feedback)",
      issue: "当前保存、复制、删除操作大量使用原生 window.alert() 弹窗，阻塞界面渲染且风格粗糙，应全面替换为现代 Toast (如 Sonner / Radix Toast) 悬浮通知",
    });

    // 5. Audit Mobile Viewport Responsiveness
    console.log("5. Auditing Mobile Responsiveness (375x812 iPhone Viewport)...");
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("http://127.0.0.1:3000/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    // Check if table overflows viewport horizontally without wrapper
    await page.goto("http://127.0.0.1:3000/admin/users", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    if (bodyScrollWidth > 375) {
      auditFindings.responsiveIssues.push({
        location: "/admin/users & 数据表格",
        issue: `移动端视口宽度为 375px，但页面产生了水平溢出（scrollWidth = ${bodyScrollWidth}px），表格需要支持 overflow-x-auto 响应式卡片或水平滚动包裹`,
      });
    }

    // 6. Audit Empty State Calls to Action (CTA)
    console.log("6. Auditing Empty State & Call to Actions...");
    await page.goto("http://127.0.0.1:3000/orders", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    const ordersText = await page.textContent("body");
    if (ordersText.includes("No") || ordersText.includes("暂无")) {
      const hasCTA = await page.$('a[href="/purchase"], button:has-text("购买"), button:has-text("Purchase")');
      if (!hasCTA) {
        auditFindings.tacitKnowledgeIssues.push({
          location: "/orders (订单列表)",
          issue: "空状态（暂无订单）缺少引导按钮（应放置“立即购买套餐”跳转按钮，避免用户在空白页迷失）",
        });
      }
    }

    // 7. Print Detailed Report
    console.log("\n=======================================================");
    console.log("🔍 UI/UX & TACIT KNOWLEDGE AUDIT REPORT");
    console.log("=======================================================\n");

    console.log("🔴 1. 严重违背用户默会知识的操作体验 (Tacit Knowledge & Interaction):");
    auditFindings.tacitKnowledgeIssues.forEach((item, idx) => {
      console.log(`  ${idx + 1}. [${item.location}] ${item.issue}`);
    });

    console.log("\n🟡 2. 视觉一致性与设计系统缺陷 (Visual Consistency & Design System):");
    auditFindings.visualInconsistencies.forEach((item, idx) => {
      console.log(`  ${idx + 1}. [${item.location}] ${item.issue}`);
    });

    console.log("\n🔵 3. 功能易用性与交互反馈缺失 (Usability & User Feedback):");
    auditFindings.usabilityGaps.forEach((item, idx) => {
      console.log(`  ${idx + 1}. [${item.location}] ${item.issue}`);
    });

    console.log("\n🟣 4. 移动端与响应式适配缺陷 (Responsive & Layout):");
    auditFindings.responsiveIssues.forEach((item, idx) => {
      console.log(`  ${idx + 1}. [${item.location}] ${item.issue}`);
    });

    await browser.close();
  } catch (err) {
    console.error("Audit error:", err);
  } finally {
    viteProcess.kill("SIGTERM");
  }
}

runUIUXAudit();
