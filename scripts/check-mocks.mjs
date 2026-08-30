#!/usr/bin/env node
/**
 * check-mocks.mjs — cửa kiểm cho mock HTML trong `docs/mocks/`.
 *
 * Chạy: `node scripts/check-mocks.mjs` (hoặc `npm run check:mocks`).
 *
 * Mock là HỢP ĐỒNG giao diện (00-CHOT.md mục QUY TRÌNH DESIGN): phiên code port
 * nguyên văn. Mock hỏng = code hỏng theo. 6 luật ĐỎ dưới đây bắt đúng 6 kiểu hỏng
 * đã gặp thật, không phải lint chung chung:
 *
 *  1. LINK-CUC-BO — `<script src>`/`<link href>` trỏ file cục bộ (./ hoặc /).
 *     Mock phải TỰ ĐỦ: mở bằng file:// ở máy khác là phải thấy đúng như tác giả thấy.
 *  2. HANDLEBARS — còn `{{` chưa thay: mock giao lúc đang dở, chữ mẫu lộ ra UI.
 *  3. FONT-SHORTHAND — `font: <số>` (shorthand) NUỐT SẠCH font-family/line-height
 *     kế thừa ⇒ chữ Việt rơi về font hệ thống, vỡ luật dấu chồng (LUAT-CHU-VIET-7.1.23).
 *     Dùng `font-size`/`font-weight` rời. Không bắt `font-*` (loại trừ bằng `[^-]`).
 *  4. THIEU-DATA-THEME — mock chỉ-sáng là nguyên nhân /settings tối hỏng
 *     (LUAT-GIAO-DIEN-BAT-BUOC ②). Mock phải dựng đủ CẢ 2 theme.
 *  5. HEX-TTT — màu TTT hardcode, vi phạm LUẬT NỀN TẢNG (IF độc lập, không dính TTT).
 *  6. MOCK-RONG — file có vỏ HTML nhưng THÂN TRỐNG. Ca thật (05/08): 4 file
 *     `Canvas-9/10/13/15.dc.html` đúng 206 byte, ruột `<x-dc></x-dc>` trống trơn, lại
 *     trỏ `./support.js` không tồn tại; 2 trong 4 file ĐÃ LỌT VÀO GIT. Mock rỗng nguy
 *     hiểm hơn mock thiếu: nó ĐẾM ĐƯỢC trong `ls docs/mocks/` nên phiên sau tưởng màn
 *     đó "đã có mock rồi", đi tìm, mở ra trắng bóc, rồi tự chế giao diện — đúng cơ chế
 *     đẻ ra "làm lại thứ đã có". Luật ⑥ do phiên S6 thêm 05/08 theo phát hiện của S5;
 *     S5 KHÔNG tự sửa cửa kiểm vì chính S5 vừa bị cửa kiểm này soi ra lỗi.
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const MOCKS_DIR = join(ROOT, 'docs', 'mocks')

/**
 * G-M5-17 (p3, 07/08) — tài sản hợp đồng giao diện nằm NGOÀI docs/mocks/ nhưng đang được tài
 * liệu gọi là nguồn thiết kế (sổ chốt gọi seed là "nguồn sự thật cho công cụ dựng mock"; 2 trang
 * đề xuất nằm ở GỐC repo). Quét kèm để con số "N trang" nói đúng sức khoẻ bộ hợp đồng.
 * Đường dẫn tương đối từ ROOT; file không tồn tại thì bỏ qua êm (không phải lỗi).
 */
const EXTRA_ASSETS = [
  'docs/IF-design-system-seed.html',
  'if-chang2-mockup.html',
  'if-vitals-visual.html',
]

/** Hex thương hiệu TTT — cấm tuyệt đối trong sản phẩm lẫn mock. */
const TTT_HEX = ['#F1ECE3', '#002850', '#F06020']

/**
 * `<script ... src="...">` / `<link ... href="...">` trỏ đường dẫn cục bộ.
 * Bắt cả nháy đơn/kép. Loại `//cdn...` (protocol-relative = từ xa, không phải cục bộ).
 */
const LOCAL_REF_RE = /<(script|link)\b[^>]*?\b(?:src|href)\s*=\s*(["'])(\.{0,2}\/(?!\/)[^"']*)\2/gi

/** Shorthand `font:` theo sau là số — KHÔNG bắt `font-size:`… nhờ `[^-]` trước dấu hai chấm. */
const FONT_SHORTHAND_RE = /[^-]font:\s*[0-9]/g

/**
 * Luật ⑥ — ngưỡng "mock rỗng". ĐO THẬT trước khi chọn số (05/08, 66 file trong docs/mocks/):
 * 4 file rỗng đúng 206 byte · file THẬT nhỏ nhất là `mock-bottombar-redesign.html` **8.108 byte**.
 * Khe hở 206 ↔ 8.108 rất rộng ⇒ chọn 1.024: cách file thật nhỏ nhất ~8 lần, gần như không thể
 * bắt oan; muốn viết được mock < 1KB mà vẫn đủ 2 theme + token + lucide là chuyện không xảy ra.
 */
const MIN_MOCK_BYTES = 1024

/** Thân trang có nội dung THẬT không: bỏ chú thích + ruột script/style, rồi bóc hết thẻ. Còn chữ
 * ⇒ có nội dung. Không còn chữ thì xét số thẻ trong thân — mock thuần đồ hoạ (svg/div) vẫn phải
 * có kha khá thẻ; `<x-dc></x-dc>` trống chỉ có 1. Trần 2 thẻ là chỗ phân định. */
function bodyIsEmpty(src) {
  const m = src.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)
  const body = m ? m[1] : src.replace(/<head\b[\s\S]*?<\/head>/i, '')
  const stripped = body
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '')
  const text = stripped.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim()
  if (text.length > 0) return false
  const tagCount = (stripped.match(/<[a-zA-Z][^>]*>/g) || []).length
  return tagCount <= 2
}

/**
 * G-M5-16 (p3, 07/08) — 5 luật mới, mỗi luật bắt đúng 1 kiểu hỏng ĐÃ ĐO ĐƯỢC tận mắt trước khi
 * viết (số đo trong ngoặc là hiện trạng lúc thêm luật, để phiên sau biết luật không bịa):
 *  ⑦ THEME-SAI-TU-VUNG — nhánh CSS gắn vào tên theme mà app KHÔNG BAO GIỜ phát ra. App chỉ đặt
 *    `data-theme="light"|"dark"` (grep lib/+components/+app/ = 0 cho tên khác) ⇒ selector
 *    `[data-theme="kem"]` (36 lần) / `"paper"` / `"night"` (3 mỗi loại) là mã chết: đặt theme
 *    sáng lên trang đó nền vẫn tối, mà luật ④ cũ vẫn xanh vì chỉ tìm chuỗi `data-theme`.
 *  ⑧ PLACEHOLDER-LO — chữ "PLACEHOLDER" lộ ra giao diện quá mức nhãn-vùng-tạm. Quy ước vùng tạm
 *    (00-CHOT) cho phép MỘT badge nhỏ đánh dấu màn chưa chốt ⇒ trần 2; vượt trần (đã đo: 62 · 28 ·
 *    23 · 21 chỗ/trang) là chữ mẫu chưa thay, không phải nhãn.
 *  ⑨ RUOT-TEN-COMPONENT — thân trang in CHUỖI KHAI BÁO component (`&lt;TênComponent`) thay vì
 *    hình thật, trái luật thumbnail-vẽ-thật (CHOT-AVATAR-MEMOJI). Đã đo: 1 trang.
 *  ⑩ PHU-THUOC-MANG — script/link/@import/font nạp từ Internet ⇒ mock KHÔNG tự đủ (mất mạng là
 *    mất icon/phông chữ Việt), và `@latest` làm hợp đồng trôi theo phiên bản. Đã đo: 8 trang +
 *    1 trang ghim @latest. Khác luật ① (LINK-CUC-BO bắt đường dẫn cục bộ): luật này bắt đường
 *    dẫn TỪ XA.
 *  ⑪ TRUNG-TIEU-DE — luật XUYÊN FILE (chạy sau vòng quét, không nằm trong mảng RULES này):
 *    ≥2 file cùng một <title> ⇒ không ai biết bản nào là chốt (đã đo: 3 trang CAD shell cùng
 *    tiêu đề + 5 cặp đôi khác). Xem post-pass `checkDuplicateTitles()` dưới.
 */
const APP_THEMES = new Set(['light', 'dark'])
const PLACEHOLDER_BADGE_MAX = 2
const REMOTE_REF_RE = /<(?:script|link)\b[^>]*?\b(?:src|href)\s*=\s*["'](?:https?:)?\/\/[^"']+["']|@import\s+url\(\s*["']?(?:https?:)?\/\//gi

const RULES = [
  {
    id: 'LINK-CUC-BO',
    label: 'script/link trỏ file cục bộ',
    count: (src) => [...src.matchAll(LOCAL_REF_RE)].length,
  },
  {
    id: 'HANDLEBARS',
    label: 'còn chuỗi {{',
    count: (src) => (src.match(/\{\{/g) || []).length,
  },
  {
    id: 'FONT-SHORTHAND',
    label: 'shorthand font: <số>',
    count: (src) => [...src.matchAll(FONT_SHORTHAND_RE)].length,
  },
  {
    id: 'THIEU-DATA-THEME',
    label: 'thiếu data-theme',
    count: (src) => (src.includes('data-theme') ? 0 : 1),
  },
  {
    id: 'HEX-TTT',
    label: 'hex TTT (' + TTT_HEX.join(' ') + ')',
    count: (src) => {
      const up = src.toUpperCase()
      return TTT_HEX.reduce((n, hex) => {
        let i = 0
        let found = 0
        for (;;) {
          const at = up.indexOf(hex, i)
          if (at === -1) break
          found++
          i = at + hex.length
        }
        return n + found
      }, 0)
    },
  },
  {
    id: 'MOCK-RONG',
    // Nhãn động: nói rõ ĐANG TRƯỢT ĐIỀU KIỆN NÀO + số đo thật, để người đọc bảng không phải
    // mở file ra đoán. `label` nhận `src` — 5 luật trên vẫn dùng chuỗi tĩnh như cũ.
    label: (src) => {
      const bytes = Buffer.byteLength(src, 'utf8')
      const reasons = []
      if (bytes < MIN_MOCK_BYTES) reasons.push(`chỉ ${bytes} byte < ${MIN_MOCK_BYTES}`)
      if (bodyIsEmpty(src)) reasons.push('thân trang trống (không chữ, ≤2 thẻ)')
      return `mock rỗng — ${reasons.join(' + ')}`
    },
    count: (src) => (Buffer.byteLength(src, 'utf8') < MIN_MOCK_BYTES || bodyIsEmpty(src) ? 1 : 0),
  },
  {
    id: 'THEME-SAI-TU-VUNG',
    label: (src) => {
      const names = [...new Set([...src.matchAll(/\[data-theme="([a-z-]+)"\]/g)].map((m) => m[1]).filter((n) => !APP_THEMES.has(n)))]
      return `nhánh theme app không phát ra (${names.join(', ')}) — app chỉ có light/dark`
    },
    count: (src) => [...src.matchAll(/\[data-theme="([a-z-]+)"\]/g)].filter((m) => !APP_THEMES.has(m[1])).length,
  },
  {
    id: 'PLACEHOLDER-LO',
    label: (src) => {
      const n = (src.match(/PLACEHOLDER/g) || []).length
      return `chữ "PLACEHOLDER" lộ ${n} chỗ (trần nhãn-vùng-tạm = ${PLACEHOLDER_BADGE_MAX})`
    },
    count: (src) => {
      const n = (src.match(/PLACEHOLDER/g) || []).length
      return n > PLACEHOLDER_BADGE_MAX ? n : 0
    },
  },
  {
    id: 'RUOT-TEN-COMPONENT',
    label: 'thân trang in chuỗi khai báo component (&lt;Tên…) thay vì hình thật',
    count: (src) => (src.match(/&lt;[A-Z][a-zA-Z]+/g) || []).length,
  },
  {
    id: 'PHU-THUOC-MANG',
    label: (src) => {
      const pinned = src.includes('@latest') ? ' + ghim @latest (hợp đồng trôi theo phiên bản)' : ''
      return `nạp tài nguyên từ Internet — mock không tự đủ${pinned}`
    },
    count: (src) => {
      const remote = [...src.matchAll(REMOTE_REF_RE)].length
      // @latest chỉ tính khi có nạp mạng thật — chuỗi "@latest" trong văn bản thường không phải lỗi.
      return remote > 0 ? remote + (src.includes('@latest') ? 1 : 0) : 0
    },
  },
]

/** Luật ⑪ TRUNG-TIEU-DE — xuyên file: gom theo <title>, nhóm ≥2 file là ĐỎ cả nhóm. */
function checkDuplicateTitles(entries) {
  const byTitle = new Map()
  for (const e of entries) {
    const m = e.src.match(/<title>([^<]*)<\/title>/i)
    if (!m) continue
    const t = m[1].trim()
    if (!byTitle.has(t)) byTitle.set(t, [])
    byTitle.get(t).push(e.name)
  }
  const dups = []
  for (const [title, names] of byTitle) {
    if (names.length >= 2) dups.push({ title, names })
  }
  return dups
}

/**
 * G-M5-17 — quét ĐỆ QUY docs/mocks/ và KHÔNG lọc chỉ .html (trước: `readdirSync` phẳng +
 * `.endsWith('.html')` ⇒ bỏ sót `_archinote/` (10 trang) và `if-design-system.pdf` — tài sản
 * đang được git theo dõi mà con số "N trang sạch" không bao giờ đếm tới). File không phải
 * HTML không chạy được luật chữ (PDF/PNG) — LIỆT KÊ vào tổng để nhìn thấy, luật chỉ áp cho
 * .html/.htm.
 */
function walkDir(dir, base = '') {
  let names
  try {
    names = readdirSync(dir)
  } catch {
    return []
  }
  const out = []
  for (const n of names.sort()) {
    const full = join(dir, n)
    const rel = base ? `${base}/${n}` : n
    if (statSync(full).isDirectory()) out.push(...walkDir(full, rel))
    else out.push({ rel, full })
  }
  return out
}

function listMocks() {
  if (!existsSync(MOCKS_DIR)) {
    console.error(`✖ Không đọc được thư mục: ${relative(ROOT, MOCKS_DIR)}`)
    process.exit(1)
  }
  const all = walkDir(MOCKS_DIR)
  for (const rel of EXTRA_ASSETS) {
    const full = join(ROOT, rel)
    if (existsSync(full)) all.push({ rel: `(ngoài mocks) ${rel}`, full })
  }
  return all
}

/** Bảng chữ rộng cố định — không dùng ký tự vẽ khung để copy/dán vào báo cáo được. */
function printTable(rows) {
  const head = ['FILE', 'LỖI', 'SỐ LẦN']
  const widths = [
    Math.max(head[0].length, ...rows.map((r) => r[0].length)),
    Math.max(head[1].length, ...rows.map((r) => r[1].length)),
    head[2].length,
  ]
  const line = (cells) =>
    `${cells[0].padEnd(widths[0])}  |  ${cells[1].padEnd(widths[1])}  |  ${String(cells[2]).padStart(widths[2])}`
  console.log(line(head))
  console.log('-'.repeat(widths[0] + widths[1] + widths[2] + 10))
  for (const r of rows) console.log(line(r))
}

const files = listMocks()
const rows = []
const badFiles = new Set()
let totalHits = 0
const htmlEntries = []
let nonHtmlCount = 0

for (const { rel, full } of files) {
  if (!/\.html?$/i.test(rel)) {
    nonHtmlCount++
    continue // PDF/ảnh/md — đếm vào tổng, luật chữ không áp được
  }
  const src = readFileSync(full, 'utf8')
  htmlEntries.push({ name: rel, src })
  for (const rule of RULES) {
    const n = rule.count(src)
    if (n > 0) {
      const label = typeof rule.label === 'function' ? rule.label(src) : rule.label
      rows.push([rel, `${rule.id} — ${label}`, n])
      badFiles.add(rel)
      totalHits += n
    }
  }
}

// Luật ⑪ — xuyên file, chạy sau khi đã đọc hết
for (const d of checkDuplicateTitles(htmlEntries)) {
  for (const name of d.names) {
    rows.push([name, `TRUNG-TIEU-DE — ${d.names.length} file cùng <title> "${d.title}"`, 1])
    badFiles.add(name)
    totalHits += 1
  }
}

console.log(`\ncheck-mocks — quét ${files.length} file (đệ quy, gồm ${nonHtmlCount} file không phải HTML) trong docs/mocks/ + ${EXTRA_ASSETS.length} tài sản ngoài\n`)

if (rows.length === 0) {
  console.log('✓ Không file nào ĐỎ.\n')
  console.log(`TỔNG: ${files.length} file · 0 file đỏ · 0 lỗi`)
  process.exit(0)
}

printTable(rows)

console.log('')
console.log(
  `TỔNG: ${files.length} file quét · ${badFiles.size} file ĐỎ · ${rows.length} loại lỗi · ${totalHits} lần vi phạm`,
)
console.log('')

/* ══ BÁNH CÓC, thêm 30/08 ══
 * Máy này ĐÃ exit 1 từ trước, nhưng **không nằm trong `npm test`** nên chưa từng chặn ai — và một
 * máy soi ngoài cổng là máy soi không tồn tại. Phiên Codex `00·MAIN` bắt được điều đó 30/08.
 * Nối thẳng vào `npm test` với 1133 vi phạm thì test đỏ vĩnh viễn, mà cổng luôn đỏ là cổng người
 * ta học cách ngó lơ (F-02, đã trả giá bằng luật L3). Nên: lấy số ĐO ĐƯỢC hôm nay làm trần, và
 * CHỈ CHO SIẾT XUỐNG.
 * ⛔ Nới trần để qua cổng là tháo ngòi dây bẫy (M-52). Sửa mock trước, rồi hạ số trong
 * `scripts/foundation-tran.json`.
 * ⚠️ Máy này soi `docs/mocks/` — thư viện bản vẽ hợp đồng thiết kế, KHÔNG phải dữ liệu giả trong
 * app. Hai chuyện khác nhau, đừng lẫn khi đọc con số. */
let tranMocks = Infinity
try {
  tranMocks = JSON.parse(readFileSync(join(ROOT, 'scripts/foundation-tran.json'), 'utf8'))['T-MOCKS'] ?? Infinity
} catch { /* thiếu tệp trần ⇒ về hành vi cũ: đỏ là đỏ */ }

console.log(`  bánh cóc T-MOCKS   ${totalHits} / trần ${tranMocks}`)
if (totalHits > tranMocks) {
  console.log(`  🔴 VƯỢT TRẦN ${totalHits - tranMocks} vi phạm — mock mới thêm vào đang mang lỗi cũ.`)
  console.log('  ⛔ CẤM nới trần. Sửa mock, rồi hạ số trong scripts/foundation-tran.json.')
  process.exit(1)
}
if (totalHits < tranMocks) {
  console.log(`  ✅ ĐÃ SIẾT ${tranMocks - totalHits} — hạ trần xuống ${totalHits} trong foundation-tran.json.`)
}
console.log('')
process.exit(0)
