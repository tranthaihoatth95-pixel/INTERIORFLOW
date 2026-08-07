#!/usr/bin/env node
/**
 * check-chot.mjs — CỬA KIỂM "quyết định đã chốt ↔ code thi công".
 *
 * VÌ SAO CÓ TỆP NÀY (07/08):
 * Trong một buổi tối, chủ dự án chỉ ra ba lỗi. Cả ba đều CÙNG MỘT DẠNG:
 *   · logo tím sai        → `IFLogo.tsx` (19/07) đã ghi "đơn sắc, KHÔNG gradient",
 *                           mà `public/icon.svg` vẫn gradient tím→hồng
 *   · phễu AI tên "Mẫu"   → `CHOT-TACH-AI-VA-CHINH-TAY.md` (01/08) đã chốt đổi thành "Magic"
 *   · chặng 3 chỉ có deck → 5 spec loại hồ sơ đã đủ, màn chọn (H4) bị hoãn
 * Tức: **quyết định đã ghi trong `docs/`, thi công đi lệch, không ai rà lại.**
 * Đó là lỗ hổng QUY TRÌNH, không phải ba lỗi lẻ — nên vá bằng một cửa kiểm chạy được,
 * không vá bằng lời nhắc.
 *
 * NGUYÊN TẮC:
 *  ① Chỉ kiểm thứ MÁY KIỂM ĐƯỢC (chuỗi, màu, đường dẫn, hằng số). Không kiểm "đẹp/hợp lý".
 *  ② Mỗi luật PHẢI dẫn NGUỒN — tệp `docs/` nào, ngày nào. Luật không dẫn nguồn = luật bịa.
 *  ③ Luật nào có ngoại lệ hợp lệ thì khai `allow` NGAY TẠI CHỖ, không giấu trong code.
 *  ④ Thêm luật mới khi có chốt mới — đây là tệp SỐNG, không phải viết một lần.
 *
 * Chạy: node scripts/check-chot.mjs      (thoát 1 nếu có luật ĐỎ)
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOT = process.cwd()
const SKIP_DIR = new Set(['node_modules', '.next', '.git', 'dist', 'dist-installer', '.worktrees', 'coverage'])
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.svg', '.css'])

/** Duyệt cây tệp, bỏ thư mục sinh ra tự động. */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIR.has(name)) continue
    const p = join(dir, name)
    let st
    try { st = statSync(p) } catch { continue }
    if (st.isDirectory()) walk(p, out)
    else if (CODE_EXT.has(extname(name))) out.push(p)
  }
  return out
}

// Loại CHÍNH TỆP NÀY khỏi tập quét: các dòng khai luật buộc phải nhắc nguyên văn chuỗi cấm
// (hex logo cũ, chữ cấm…) — quét vào chính mình là dương tính giả vĩnh viễn (đã dính 07/08:
// LOGO-KHONG-ACCENT tự bắt 2 dòng khai luật của nó).
const FILES = walk(ROOT).filter((f) => !f.endsWith('scripts/check-chot.mjs'))
const read = (p) => { try { return readFileSync(p, 'utf8') } catch { return '' } }
const rel = (p) => p.replace(ROOT + '/', '')

/**
 * Mỗi luật:
 *   id      — mã ngắn, hiện trong bảng kết quả
 *   nguon   — BẮT BUỘC: tệp docs + ngày chốt
 *   muc     — câu mô tả điều đã chốt (tiếng người, không jargon)
 *   do      — true = ĐỎ (chặn), false = VÀNG (cảnh báo)
 *   quet    — hàm trả mảng { file, dong, doan } các chỗ VI PHẠM
 */
const LUAT = [
  {
    id: 'LOGO-DON-SAC',
    nguon: 'components/entry/IFLogo.tsx (Hoà chốt 19/07) — "Đơn sắc tuyệt đối · KHÔNG gradient · KHÔNG bo tròn"',
    muc: 'Icon ứng dụng / favicon phải đơn sắc, không gradient',
    do: true,
    quet: () => {
      const hits = []
      for (const f of FILES.filter((f) => f.endsWith('.svg') && rel(f).startsWith('public/'))) {
        const src = read(f)
        if (/linearGradient|radialGradient/i.test(src)) {
          hits.push({ file: rel(f), dong: src.split('\n').findIndex((l) => /Gradient/i.test(l)) + 1, doan: 'có gradient trong icon' })
        }
      }
      return hits
    },
  },
  {
    id: 'LOGO-KHONG-ACCENT',
    nguon: 'CHOT 07/08 mục 9 — "Logo IF màu tím là SAI, logo không đi theo accent giao diện"',
    muc: 'Không dùng cặp màu tím/hồng cũ của icon (#8b5cf6 / #c026d3) ở bất kỳ đâu',
    do: true,
    quet: () => {
      const hits = []
      for (const f of FILES) {
        const src = read(f)
        src.split('\n').forEach((l, i) => {
          if (/#8b5cf6|#c026d3/i.test(l)) hits.push({ file: rel(f), dong: i + 1, doan: l.trim().slice(0, 70) })
        })
      }
      return hits
    },
  },
  {
    id: 'TEN-CHANG',
    nguon: 'docs/00-CHOT.md (Hoà chốt 07/08) — concept→"Thiết kế 2D" · render→"Thiết kế 3D" · present→"Trình chiếu"; BỎ chữ "CAD" khỏi NHÃN',
    muc: 'Chữ "CAD" không được hiện cho người dùng (tên code lib/cad/, route /cad giữ nguyên)',
    do: true,
    quet: () => {
      const hits = []
      // chỉ soi CHUỖI HIỂN THỊ: nhãn trong dấu nháy đứng cạnh label/title/tr(
      const RE = /(?:label|labelEn|title|placeholder)\s*[:=]\s*['"`][^'"`]*\bCAD\b[^'"`]*['"`]/g
      for (const f of FILES.filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f))) {
        const src = read(f)
        src.split('\n').forEach((l, i) => {
          if (RE.test(l)) hits.push({ file: rel(f), dong: i + 1, doan: l.trim().slice(0, 70) })
          RE.lastIndex = 0
        })
      }
      return hits
    },
  },
  {
    id: 'AI-CAM-TU-TU-DONG',
    nguon: 'docs/CHOT-TACH-AI-VA-CHINH-TAY.md §2a (Hoà chốt 01/08) — "Chỉ cấm đúng một từ: tự động. Nó ĐỤNG HÀNG với dàn lại (reflow) vốn KHÔNG AI"',
    muc: 'Nhãn hành động AI không được dùng chữ "tự động"',
    do: false, // vàng: còn nhiều chỗ "tự động" hợp lệ (không phải AI) — cần rà tay
    quet: () => {
      // ALLOW-LIST — rà tay 07/08 (phiên p2, phiếu M-CHOT): 4 chỗ dưới KHÔNG phải nhãn hành
      // động AI nên chữ "tự động" hợp lệ theo đúng câu chốt §2a (chỉ cấm khi là nhãn AI):
      //   · Inspector.tsx "Danh sách đánh số tự động" + TextToolbar.tsx "Đánh số tự động"
      //     — đánh số danh sách văn bản, thuần trình bày, 0 AI.
      //   · LibraryPanel.tsx "Tự động phân loại / Tự động: app tự nhận" — phân loại theo
      //     mime/đuôi tệp (lib/refingest.ts classify/guessUsage, heuristic thuần), 0 AI.
      //   · Inspector.tsx "(thủ công, không tự động)" — chữ dùng để PHỦ ĐỊNH, mô tả thao tác tay.
      // Khoá theo (file, chuỗi con) chứ không theo số dòng — số dòng trôi khi file đổi (§0i).
      const ALLOW = [
        ['components/present-editor/Inspector.tsx', 'Danh sách đánh số tự động'],
        ['components/present-editor/TextToolbar.tsx', 'Đánh số tự động'],
        ['components/LibraryPanel.tsx', 'Tự động: app tự nhận'],
        ['components/present-editor/Inspector.tsx', 'thủ công, không tự động'],
      ]
      const hits = []
      const RE = /(?:label|labelEn|title)\s*[:=]\s*['"`][^'"`]*tự động[^'"`]*['"`]/gi
      for (const f of FILES.filter((f) => /\.tsx$/.test(f) && !/\.test\./.test(f))) {
        const src = read(f)
        src.split('\n').forEach((l, i) => {
          const line = l.normalize('NFC')
          const allowed = ALLOW.some(([af, chunk]) => rel(f) === af && line.includes(chunk))
          if (RE.test(line) && !allowed) hits.push({ file: rel(f), dong: i + 1, doan: l.trim().slice(0, 70) })
          RE.lastIndex = 0
        })
      }
      return hits
    },
  },
  {
    id: 'PHEU-AI-TEN-MAGIC',
    nguon: 'docs/CHOT-TACH-AI-VA-CHINH-TAY.md §2a/§3c (Hoà chốt 01/08) — phễu AI tên "Magic", KHÔNG được gọi là "Mẫu"',
    muc: 'Thanh công cụ chặng Trình chiếu không còn nút tên "Mẫu"',
    do: true,
    quet: () => {
      const hits = []
      const RE = /['"`]Mẫu['"`]/
      for (const f of FILES.filter((f) => /components\/present-editor\/.*\.tsx$/.test(rel(f)) && !/\.test\./.test(f))) {
        const src = read(f).normalize('NFC')
        src.split('\n').forEach((l, i) => {
          if (RE.test(l.normalize('NFC'))) hits.push({ file: rel(f), dong: i + 1, doan: l.trim().slice(0, 70) })
        })
      }
      return hits
    },
  },
  {
    id: 'VAT-LIEU-KHONG-TRON',
    nguon: 'lib/cad/materials.ts luật 2.1.9.i (Hoà chốt 30/07) — MaterialDef = thị giác · ProductSpec = thương mại, CỐ Ý KHÔNG TRỘN',
    muc: 'Kiểu vật liệu thị giác (MaterialPbr) không được chứa giá / nhà cung cấp / hao hụt',
    do: true,
    quet: () => {
      const f = join(ROOT, 'lib/materials/schema.ts')
      if (!existsSync(f)) return []
      const hits = []
      const src = read(f)
      const block = src.match(/export interface MaterialPbr \{[\s\S]*?\n\}/)
      if (!block) return []
      block[0].split('\n').forEach((l, i) => {
        if (/\b(price|gia|cost|supplier|vendor|ncc|wastage|haohut)\b/i.test(l) && !l.trim().startsWith('*') && !l.trim().startsWith('//')) {
          hits.push({ file: 'lib/materials/schema.ts', dong: i + 1, doan: l.trim().slice(0, 70) })
        }
      })
      return hits
    },
  },
  {
    id: 'KHONG-NUOT-LOI',
    nguon: 'Luật K5 (docs/00-BAT-DAU-DOC-DAY.md) — cấm bắt lỗi rỗng: hoặc hiện cho người dùng, hoặc ghi log kèm lý do',
    muc: 'Không có khối catch rỗng',
    do: true,
    quet: () => {
      const hits = []
      const RE = /catch\s*(\([^)]*\))?\s*\{\s*\}/
      for (const f of FILES.filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f))) {
        const src = read(f)
        src.split('\n').forEach((l, i) => {
          if (RE.test(l)) hits.push({ file: rel(f), dong: i + 1, doan: l.trim().slice(0, 70) })
        })
      }
      return hits
    },
  },
  {
    id: 'TRUNG-TINH',
    nguon: 'CLAUDE.md LUẬT NỀN TẢNG (Hoà chốt 24/07) — IF là sản phẩm global, 0 tên khách / brand studio nhúng cứng',
    muc: 'Không nhúng cứng tên khách hàng hay studio vào code sản phẩm',
    do: true,
    quet: () => {
      const hits = []
      // Tên đã biết từ AUDIT-BRAND-PII. Thêm tên mới khi phát hiện.
      const CAM = /\b(DETECH|TTT\s*Architects|com\.ttt\b|com\.tttarchitects)\b/i
      for (const f of FILES.filter((f) => /\.(tsx?|json)$/.test(f) && !/\.test\./.test(f))) {
        const r = rel(f)
        if (r.startsWith('docs/') || r.startsWith('scripts/')) continue // tài liệu được phép nhắc
        const src = read(f)
        src.split('\n').forEach((l, i) => {
          if (CAM.test(l)) hits.push({ file: r, dong: i + 1, doan: l.trim().slice(0, 70) })
        })
      }
      return hits
    },
  },
  {
    id: 'KHONG-DU-AN-MAU',
    nguon: 'docs/00-CHOT.md mục 7-8 (Hoà chốt 07/08) — "bỏ hết dự án mẫu, app xuất ra trung tính, chưa ai xài thì có mẫu đó chi trời"',
    muc: 'Sản phẩm không kèm dự án mẫu / deck mẫu / ảnh render của ai',
    do: false, // vàng cho tới khi G-EMPTY-01 xong; xong rồi thì đổi thành do:true
    quet: () => {
      const hits = []
      for (const p of ['lib/demos', 'lib/present-demo.ts', 'lib/demo-seeds.ts',
                       'lib/present-editor/akh-sample.ts', 'lib/present-editor/demo-enso-sample.ts',
                       'public/detech']) {
        if (existsSync(join(ROOT, p))) hits.push({ file: p, dong: 0, doan: 'còn tồn tại' })
      }
      return hits
    },
  },
]

// ─────────────────────────────────────────────────────────────────────────────
let soDo = 0
let soVang = 0
const bang = []

for (const luat of LUAT) {
  let hits = []
  try { hits = luat.quet() } catch (e) { hits = [{ file: '(lỗi chạy luật)', dong: 0, doan: String(e.message).slice(0, 60) }] }
  if (hits.length) {
    if (luat.do) soDo += hits.length
    else soVang += hits.length
  }
  bang.push({ luat, hits })
}

console.log('\n═══ CỬA KIỂM: QUYẾT ĐỊNH ĐÃ CHỐT ↔ CODE THI CÔNG ═══\n')

for (const { luat, hits } of bang) {
  const dau = hits.length === 0 ? '✅' : luat.do ? '🔴' : '🟡'
  console.log(`${dau} ${luat.id}  ·  ${hits.length} chỗ`)
  console.log(`   điều đã chốt: ${luat.muc}`)
  console.log(`   nguồn: ${luat.nguon}`)
  for (const h of hits.slice(0, 6)) {
    console.log(`     ${h.file}${h.dong ? ':' + h.dong : ''}  ${h.doan}`)
  }
  if (hits.length > 6) console.log(`     … còn ${hits.length - 6} chỗ nữa`)
  console.log()
}

console.log('─'.repeat(70))
console.log(`TỔNG: ${LUAT.length} luật · 🔴 ${soDo} vi phạm chặn · 🟡 ${soVang} cảnh báo`)
console.log('Thêm luật mới mỗi khi có chốt mới — tệp này là tệp SỐNG (xem đầu tệp, nguyên tắc ④).')

process.exit(soDo > 0 ? 1 : 0)
