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

import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const MOCKS_DIR = join(ROOT, 'docs', 'mocks')

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
]

function listMocks() {
  let names
  try {
    names = readdirSync(MOCKS_DIR)
  } catch {
    console.error(`✖ Không đọc được thư mục: ${relative(ROOT, MOCKS_DIR)}`)
    process.exit(1)
  }
  return names.filter((n) => n.toLowerCase().endsWith('.html')).sort()
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

for (const name of files) {
  const src = readFileSync(join(MOCKS_DIR, name), 'utf8')
  for (const rule of RULES) {
    const n = rule.count(src)
    if (n > 0) {
      const label = typeof rule.label === 'function' ? rule.label(src) : rule.label
      rows.push([name, `${rule.id} — ${label}`, n])
      badFiles.add(name)
      totalHits += n
    }
  }
}

console.log(`\ncheck-mocks — quét ${files.length} file trong docs/mocks/\n`)

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
process.exit(1)
