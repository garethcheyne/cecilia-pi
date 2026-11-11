// Draws Cecilia's boot artwork: the Plymouth splash frames (the five pipes
// light up one by one as the Pi starts), the wordmark, the background, an
// icon for Raspberry Pi Imager, and full-screen previews.
//
//   node branding/render.mjs [playwright module path]
//
// Needs Playwright with Edge or Chrome (the app's web folder has it).
import { mkdirSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, "..")
const require = createRequire(import.meta.url)
const pwPath = process.argv[2] ?? join(root, "..", "Organ Assist", "web", "node_modules", "playwright")
const pw = await import(pathToFileURL(require.resolve(pwPath)).href)
const chromium = pw.chromium ?? pw.default.chromium

const theme = join(root, "stage-cecilia", "01-branding", "files", "plymouth", "cecilia")
const out = join(root, "branding", "out")
mkdirSync(theme, { recursive: true })
mkdirSync(out, { recursive: true })

// Brand colours (the app's "Nave" console theme).
const C = {
  bg: "#0f1117",
  glow: "76, 95, 213", // ultramarine
  pipeOff: "#1c2030",
  pipeOffEdge: "#323a52",
  ivory: "#fbf7ee",
  ivoryLow: "#e6ddc8",
  text: "#eceef3",
  muted: "#8b93a6",
}

// The mark's geometry, in a 32-unit box: [x, top] for each pipe.
const PIPES = [
  [4.5, 13],
  [10.25, 8],
  [16, 3],
  [21.75, 8],
  [27.5, 13],
]

function markSvg(lit, size) {
  const pipe = ([x, top], i) => {
    const on = i < lit
    const body = `<rect x="${x - 2.5}" y="${top}" width="5" height="${21 - top}" rx="0.8"
      fill="${on ? "url(#ivory)" : C.pipeOff}" stroke="${on ? "none" : C.pipeOffEdge}" stroke-width="0.25"/>`
    const mouth = `<path d="M${x - 2.5} 21 h5 l-1.7 6 h-1.6 z" fill="${on ? C.ivoryLow : C.pipeOff}"
      stroke="${on ? "none" : C.pipeOffEdge}" stroke-width="0.25"/>`
    const lip = on ? `<rect x="${x - 1.6}" y="${top + 1.2}" width="0.7" height="${19.8 - top - 1.2}" rx="0.35" fill="#fff" opacity="0.55"/>` : ""
    return `<g ${on ? 'filter="url(#halo)"' : ""}>${body}${mouth}${lip}</g>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 36 36" width="${size}" height="${size}">
    <defs>
      <linearGradient id="ivory" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.ivory}"/><stop offset="1" stop-color="${C.ivoryLow}"/>
      </linearGradient>
      <filter id="halo" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.9" result="b"/>
        <feColorMatrix in="b" type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.61  0 0 0 0 1  0 0 0 0.75 0" result="g"/>
        <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    ${PIPES.map(pipe).join("")}
    <rect x="2" y="27.6" width="28" height="1.6" rx="0.5" fill="${lit === 5 ? C.ivoryLow : C.pipeOffEdge}" opacity="${lit === 5 ? 0.8 : 0.9}"/>
  </svg>`
}

const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@500;600&display=swap" rel="stylesheet">`

const page = (body, bg = "transparent") => `<!doctype html><html><head><meta charset="utf-8">${fonts}
<style>html,body{margin:0;background:${bg}} body{font-family:"Instrument Sans",system-ui,sans-serif}</style>
</head><body>${body}</body></html>`

const wordmark = `<div id="w" style="display:inline-flex;flex-direction:column;align-items:center;gap:14px;padding:8px 24px">
  <div style="font-weight:600;font-size:88px;letter-spacing:-1.5px;color:${C.text};line-height:1">Cecilia</div>
  <div style="font-weight:500;font-size:22px;letter-spacing:4px;color:${C.muted};text-transform:none">organ recorder and player</div>
</div>`

const background = (w, h) =>
  `<div style="width:${w}px;height:${h}px;background:
    radial-gradient(ellipse 48% 60% at 50% 44%, rgba(${C.glow},0.26) 0%, rgba(${C.glow},0.17) 22%, rgba(${C.glow},0.09) 45%, rgba(${C.glow},0.035) 68%, rgba(${C.glow},0) 92%),
    radial-gradient(ellipse 110% 80% at 50% 125%, rgba(${C.glow},0.08), rgba(${C.glow},0) 80%), ${C.bg}"></div>`

/** The whole splash, as Plymouth will draw it, for previews. */
const splash = (lit, w, h, message = "") => `<div style="position:relative;width:${w}px;height:${h}px;overflow:hidden">
  ${background(w, h)}
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;padding-bottom:${h * 0.06}px">
    ${markSvg(lit, Math.round(h * 0.3))}
    ${wordmark}
  </div>
  <div style="position:absolute;left:0;right:0;bottom:${h * 0.08}px;text-align:center;font-size:22px;color:${C.muted}">${message}</div>
</div>`

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? "msedge" })
const ctx = await browser.newContext({ deviceScaleFactor: 1 })
const p = await ctx.newPage()

async function shot(html, file, clipSel, opts = {}) {
  await p.setContent(page(html, opts.bg), { waitUntil: "networkidle" })
  await p.evaluate(() => document.fonts.ready)
  const el = clipSel ? await p.$(clipSel) : null
  if (el) await el.screenshot({ path: file, omitBackground: !opts.bg })
  else await p.screenshot({ path: file, omitBackground: !opts.bg, fullPage: true })
}

// Plymouth theme parts.
await p.setViewportSize({ width: 1920, height: 1080 })
for (let lit = 0; lit <= 5; lit++) {
  await shot(`<div id="m" style="display:inline-block">${markSvg(lit, 324)}</div>`, join(theme, `pipes-${lit}.png`), "#m")
}
await shot(wordmark, join(theme, "wordmark.png"), "#w")
await shot(background(1920, 1080), join(theme, "background.png"), null, { bg: C.bg })

// Raspberry Pi Imager icon (shown at 40 px; drawn at 128 for sharp screens).
await p.setViewportSize({ width: 128, height: 128 })
await shot(
  `<div id="i" style="width:128px;height:128px;border-radius:28px;background:${C.bg};display:flex;align-items:center;justify-content:center">${markSvg(5, 112)}</div>`,
  join(out, "imager-icon.png"),
  "#i"
)
// The same icon inside the repository, for the Imager list.
await shot(
  `<div id="i" style="width:128px;height:128px;border-radius:28px;background:${C.bg};display:flex;align-items:center;justify-content:center">${markSvg(5, 112)}</div>`,
  join(root, "imager", "icon.png"),
  "#i"
)

// Previews: part way through starting, finished, and during an update.
await p.setViewportSize({ width: 1920, height: 1080 })
await shot(splash(2, 1920, 1080, "Starting…"), join(out, "splash-starting.png"), null, { bg: C.bg })
await shot(splash(5, 1920, 1080, ""), join(out, "splash.png"), null, { bg: C.bg })
await shot(splash(3, 1920, 1080, "Updating Cecilia to 0.2.0…"), join(out, "splash-updating.png"), null, { bg: C.bg })
// The small 7" touchscreen many consoles use.
await p.setViewportSize({ width: 800, height: 480 })
await shot(splash(4, 800, 480, "Starting…"), join(out, "splash-800x480.png"), null, { bg: C.bg })

await browser.close()
console.log("Drew the boot artwork into", theme, "and previews into", out)
