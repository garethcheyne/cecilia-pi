// Previews of the console sign-in banner (/etc/issue) and the welcome after
// signing in (update-motd), drawn from the real files with sample values.
// The Pi's console font is approximated with a monospace web font.
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, "..")
const require = createRequire(import.meta.url)
const pwPath = process.argv[2] ?? join(root, "..", "Organ Assist", "web", "node_modules", "playwright")
const pw = await import(pathToFileURL(require.resolve(pwPath)).href)
const chromium = pw.chromium ?? pw.default.chromium

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
const COLORS = { lightgray: "#c8ccd4", darkgray: "#6b7280", bold: null, reset: null }

// /etc/issue with agetty's escapes filled in.
function issueHtml() {
  let text = readFileSync(join(root, "stage-cecilia/01-branding/files/issue"), "utf8")
  text = esc(text).replace(/\\n/g, "cecilia").replace(/\\4/g, "192.168.1.42")
  let open = 0
  text = text.replace(/\\e\{(\w+)\}/g, (_, name) => {
    let out = "</span>".repeat(open)
    open = 0
    if (name === "reset") return out
    open = 1
    return out + (name === "bold" ? '<span style="font-weight:700;color:#fff">' : `<span style="color:${COLORS[name]}">`)
  })
  return text + "</span>".repeat(open) + 'cecilia login: <span class="cursor">&nbsp;</span>'
}

// The welcome, as 10-cecilia prints it.
function motdHtml() {
  const g = (s) => `<span style="color:#d0d0d0">${s}</span>`
  const d = (s) => `<span style="color:#6b7280">${s}</span>`
  const b = (s) => `<span style="font-weight:700;color:#fff">${s}</span>`
  return [
    `${g("        ▄")}`,
    `${g("      ▄ █ ▄")}`,
    `${g("    ▄ █ █ █ ▄")}     ${b("Cecilia 0.2.0")}, running`,
    `${g("    █ █ █ █ █")}     Open http://cecilia.local:7070  or  http://192.168.1.42:7070`,
    `${d("    ▀▀▀▀▀▀▀▀▀")}`,
    "",
    `  ${d("Cecilia keeps itself up to date (Settings, Updates). Useful commands:")}`,
    `    sudo systemctl restart cecilia     ${d("restart it")}`,
    `    journalctl -u cecilia -f           ${d("watch what it's doing")}`,
    `    sudo nano /etc/default/cecilia     ${d("its settings")}`,
    "",
    'organist@cecilia:~ $ <span class="cursor">&nbsp;</span>',
  ].join("\n")
}

const page = (body, title) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;background:#000}
  .screen{width:1280px;height:720px;box-sizing:border-box;padding:28px 34px;background:#000;color:#c8ccd4;
    font:400 20px/1.35 "IBM Plex Mono",monospace;white-space:pre;overflow:hidden}
  .cursor{background:#c8ccd4}
  .label{position:fixed;right:16px;bottom:12px;font:12px system-ui;color:#555}
</style></head><body><div class="screen">${body}</div><div class="label">${title}</div></body></html>`

const out = join(root, "branding", "out")
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? "msedge" })
const p = await browser.newPage({ viewport: { width: 1280, height: 720 } })
for (const [html, file, title] of [
  [issueHtml(), "console-signin.png", "Preview: the sign-in screen on a monitor plugged into the Pi"],
  [motdHtml(), "console-welcome.png", "Preview: after signing in (screen or SSH)"],
]) {
  await p.setContent(page(html, title), { waitUntil: "networkidle" })
  await p.evaluate(() => document.fonts.ready)
  await p.screenshot({ path: join(out, file) })
}
await browser.close()
console.log("Drew the console previews into", out)
