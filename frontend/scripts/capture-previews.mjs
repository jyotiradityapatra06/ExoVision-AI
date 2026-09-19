import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const origin = "http://localhost:3000";
const outputDir = path.resolve("..", "redesign-preview");
const token = process.env.EXOVISION_PREVIEW_TOKEN;
const resultId = process.env.EXOVISION_RESULT_ID;
const pendingId = process.env.EXOVISION_PENDING_ID;

if (!token || !resultId || !pendingId) {
  throw new Error("EXOVISION_PREVIEW_TOKEN, EXOVISION_RESULT_ID, and EXOVISION_PENDING_ID are required.");
}

await mkdir(outputDir, { recursive: true });

const created = await fetch("http://127.0.0.1:9222/json/new?about:blank", { method: "PUT" }).then((response) => response.json());
const socket = new WebSocket(created.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 0;
const pending = new Map();
const browserIssues = [];

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  }
  if (message.method === "Runtime.exceptionThrown") {
    browserIssues.push(message.params.exceptionDetails?.text ?? "Runtime exception");
  }
  if (message.method === "Log.entryAdded" && ["error", "warning"].includes(message.params.entry.level)) {
    browserIssues.push(`${message.params.entry.level}: ${message.params.entry.text}`);
  }
});

function command(method, params = {}) {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function delay(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function navigate(url, wait = 1500) {
  await command("Page.navigate", { url });
  await delay(wait);
}

async function capture(filename, url, width, height, wait = 1800) {
  await command("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
    screenWidth: width,
    screenHeight: height,
  });
  await navigate(url, wait);
  const screenshot = await command("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  await writeFile(path.join(outputDir, filename), Buffer.from(screenshot.data, "base64"));
  const title = await command("Runtime.evaluate", { expression: "document.title", returnByValue: true });
  process.stdout.write(`${filename}\t${title.result.value}\n`);
}

await command("Page.enable");
await command("Runtime.enable");
await command("Log.enable");

if (process.env.EXOVISION_CAPTURE_PROCESSING === "1") {
  await navigate(origin, 150);
  await command("Runtime.evaluate", {
    expression: `localStorage.setItem("exovision_access_token", ${JSON.stringify(token)})`,
  });
  await capture("05-processing-desktop.png", `${origin}/results/${pendingId}`, 1440, 900, 1500);
  socket.close();
  process.exit(0);
}

if (process.env.EXOVISION_CAPTURE_DASHBOARD === "1") {
  await navigate(origin, 150);
  await command("Runtime.evaluate", {
    expression: `localStorage.setItem("exovision_access_token", ${JSON.stringify(token)})`,
  });
  await capture("02-dashboard-desktop.png", `${origin}/dashboard`, 1440, 900, 1500);
  await capture("11-dashboard-mobile.png", `${origin}/dashboard`, 390, 844, 1500);
  socket.close();
  process.exit(0);
}

await capture("01-landing-desktop.png", `${origin}/`, 1440, 900);
await capture("09-login-desktop.png", `${origin}/auth/login`, 1440, 900);
await navigate(origin, 700);
await command("Runtime.evaluate", {
  expression: `localStorage.setItem("exovision_access_token", ${JSON.stringify(token)})`,
});

const desktop = [
  ["02-dashboard-desktop.png", "/dashboard"],
  ["03-analysis-intake-desktop.png", "/upload"],
  ["04-datasets-desktop.png", "/datasets"],
  ["05-processing-desktop.png", `/results/${pendingId}`],
  ["06-results-desktop.png", `/results/${resultId}`],
  ["07-archive-desktop.png", "/reports"],
  ["08-demo-desktop.png", "/demo"],
];

for (const [filename, route] of desktop) {
  await capture(filename, `${origin}${route}`, 1440, 900, route.startsWith("/results/") ? 2600 : 1700);
}

const mobile = [
  ["10-landing-mobile.png", "/"],
  ["11-dashboard-mobile.png", "/dashboard"],
  ["12-analysis-intake-mobile.png", "/upload"],
  ["13-results-mobile.png", `/results/${resultId}`],
  ["14-archive-mobile.png", "/reports"],
];

for (const [filename, route] of mobile) {
  await capture(filename, `${origin}${route}`, 390, 844, route.startsWith("/results/") ? 2600 : 1700);
}

process.stdout.write(`BROWSER_ISSUES=${JSON.stringify([...new Set(browserIssues)])}\n`);
socket.close();
