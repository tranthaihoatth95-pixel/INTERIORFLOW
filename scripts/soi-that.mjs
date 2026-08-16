#!/usr/bin/env node
/**
 * soi-that.mjs — ĐỐI CHIẾU VĂN BẢN ↔ CODE THẬT. Chạy TRƯỚC khi soạn bất kỳ phiếu nào.
 *   npm run soi:that
 *
 * VÌ SAO CÓ TỆP NÀY (08/08) — Hoà hỏi thẳng: "cái lỗi gì mà lặp lại hoài vậy, không khám à?"
 *
 * Đúng. Trong MỘT đêm, TỔNG giao việc-đã-xong BỐN lần:
 *   ① "27 chỗ trần 5 sheet"   → thật ra 2 comment, MAX_SHEETS gỡ từ 04/08
 *   ② "10 mock còn lại"        → thật ra 60
 *   ③ "114 lệnh dựng ❌"       → tầng ③ đủ 8/8, tầng ① đủ 12/12, nằm sẵn trong build-ops.ts
 *   ④ "xây camera tham số"     → 5 mảnh đã xong CÓ TEST (SPEC-DUNG-CAMERA §0.2 liệt kê đủ)
 *
 * GỐC BỆNH — không phải bốn lỗi lẻ, mà MỘT lỗ hổng quy trình:
 *   Sổ GAP-IF ghi ❌  ·  SPEC ghi "đã có, chỉ thiếu dây nối"  ·  KHÔNG AI ĐỐI CHIẾU
 * Sổ là ảnh chụp cũ (§0ab). Spec là hợp đồng. Code là sự thật.
 * Đọc sổ mà không đọc spec ⇒ đi xây lại thứ đã có ⇒ đẻ ra HAI bản của cùng một thứ.
 *
 * Vá bằng lời nhắc thì lần sau vẫn quên. Vá bằng cửa kiểm chạy được thì không quên nổi.
 * (Cùng lý do đã dựng scripts/check-chot.mjs 07/08.)
 *
 * ─── 17/08 (P-S2): VÁ MỘT LỖI CHẾT NGƯỜI + NỚI TỪ MỘT CHIỀU LÊN BA ────────────
 *
 * 🔴 VÁ. Máy này nằm im 9 ngày vì hai lẽ, cả hai đều tầm thường và cả hai đều đủ giết nó:
 *   ① KHÔNG CÓ LỐI CHẠY — vắng mặt trong `package.json`. Máy không có nút bấm thì không tồn tại.
 *   ② QUÉT NHẦM CÂY — xem chú thích ở `laDuongWorktree`. Lần chạy 17/08: **27/27 dòng ✅ trỏ
 *      vào `.claude/worktrees/`**, 0 dòng trỏ vào cây chính. Nó vẫn in xanh, chỉ là xanh về
 *      một cây khác. Bài học: *"chạy được" và "trả lời đúng câu mình hỏi" là hai chuyện.*
 *
 * ⭐ NỚI. Bản cũ chỉ có MỘT chiều và chỉ đọc `SPEC-*`. Ba ca đắt nhất của IF đều lọt:
 *   ① VĂN BẢN NÓI CÓ · CODE KHÔNG THẤY   (cũ) — sổ nói dối về code
 *   ② MẢNG CÂM: CODE CÓ · SỔ KHÔNG BIẾT  (mới) — sổ không biết code tồn tại. Im lặng hơn ①
 *      nên sống lâu hơn: `lib/materials/resolve.ts` có từ 07/08 mà sổ ghi "0 code" suốt 10 ngày.
 *   ③ KHÁI NIỆM MA: SỔ NHẮC NHIỀU · CODE 0 (mới) — thứ chưa bao giờ tồn tại mà cả hệ tin là có.
 *      `master tool` 26 lần trong sổ / 0 trong code đã ngốn **6 phiếu**.
 *
 * CÁCH DÙNG:
 *   npm run soi:that                          ← quét toàn bộ, in bảng tổng
 *   node scripts/soi-that.mjs camera          ← chỉ tệp văn bản có chữ "camera" trong đường dẫn
 *   node scripts/soi-that.mjs --do            ← chỉ chiều ①, chỉ dòng ĐỎ
 *
 * CÁCH ĐỌC KẾT QUẢ:
 *   ✅ văn bản nói có · code CÓ THẬT    → đừng giao lại, chỉ nối UI nếu chưa mount
 *   🟡 code có · 0 NƠI GỌI              → "kho chưa mở cửa"
 *   ❌ văn bản nói có · code KHÔNG THẤY → hoặc đã xoá, hoặc ĐỔI TÊN → phải người kiểm
 *   🔇 mảng CÂM                         → thiếu BẢN ĐỒ, không phải thiếu code
 *   👻 khái niệm MA                     → dựng hoặc khai tử, đừng để đó
 *
 * ⚠️ MÁY NÀY KHÔNG CHẶN (exit 0). Cố ý: ba chiều mới đều cần người phán, và một máy soi báo
 *    đỏ thứ không sửa ngay được thì chết theo cách tệ nhất — người ta học cách bỏ qua nó.
 *    (Cùng lý do `soi-tu-dien.mjs` để 🟡 không chặn.) Siết dần theo họ, khi từng họ xong.
 *
 * GIỚI HẠN THÀNH THẬT (N5): chiều ① tìm theo TÊN HÀM/HẰNG SỐ. Văn bản viết bằng văn xuôi
 * không nêu định danh thì máy MÙ — lần chạy 17/08 mù **399/503 tệp**. Con số đó in ra ở cuối
 * bảng, cố ý: nó là phần việc PHẢI ĐỌC TAY. Máy này thu hẹp việc đọc tay, không thay thế.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { execFileSync } from 'node:child_process';

const GOC = process.cwd();
const LOC = process.argv.find((a) => !a.startsWith('-') && !a.endsWith('.mjs') && !a.endsWith('node'));
const CHI_DO = process.argv.includes('--do');

/* ── gom toàn bộ mã nguồn một lần, tránh grep 57×N lần ─────────────────────── */
const BO_QUA = new Set(['node_modules', '.next', '.git', 'dist', 'dist-installer', '.worktrees', 'coverage', 'docs']);
const DUOI = new Set(['.ts', '.tsx', '.mjs']);

/**
 * VÁ 17/08 (P-S2) — CÂY SAI. `BO_QUA` chỉ có chuỗi `.worktrees` (có dấu chấm), nhưng đường
 * THẬT mà Claude Code đặt worktree là `.claude/worktrees/` (KHÔNG dấu chấm ở tên thư mục).
 * Không tên nào trên đường đó khớp `BO_QUA` ⇒ máy bò vào và quét **3.390** tệp bản sao cũ,
 * so với ~1.100 tệp của cây chính. Vì `.claude` xếp trước `app/`·`components/`·`lib/` theo
 * thứ tự đọc thư mục, **bản sao luôn được tìm thấy trước** ⇒ lần chạy 17/08 có **27/27 dòng
 * ✅ trỏ vào worktree**, 0 dòng trỏ vào cây chính. Máy vẫn "chạy được" và vẫn in xanh — nó
 * chỉ trả lời về MỘT CÂY KHÁC. Đây là dạng hỏng tệ nhất: im lặng và trông như đúng.
 *
 * VÁ CHO BỀN, KHÔNG VÁ ĐÚNG MỘT CHUỖI: loại theo *"tên thư mục có chứa chữ `worktrees`"*.
 * Đổi chỗ đặt worktree (`.worktrees` · `.claude/worktrees` · `x/y/worktrees`) đều thủng như
 * nhau nếu so chuỗi cứng — đúng bug `package.json` đã phải vá 16/08 (mẫu loại trừ của
 * `npm test` chỉ có nhánh `.worktrees` mà sót nhánh `.claude/worktrees`, làm `npm test`
 * LUÔN exit 1 mỗi khi có agent chạy song song). Lần đó không ai soi chỗ khác cùng mắc.
 *
 * NAY SOI THÌ THẤY — nói cho đúng mức, đừng nói quá:
 *   · **7 tệp** có cùng chuỗi `.worktrees` thiếu sót trong danh sách bỏ qua
 *     (`grep -n worktrees scripts/*.mjs`), NHƯNG
 *   · chỉ tệp nào **đi từ GỐC REPO** mới thật sự dính. `soi-frontier`·`soi-thao-tac`·
 *     `soi-contract` chỉ đi vào thư mục khai trong sổ; `soi-hinh-hoc` chỉ đi `components/`;
 *     `soi-tu-dien` chỉ đi các thư mục khai trong `pham_vi` ⇒ **năm tệp này KHÔNG dính**.
 *   · 🔴 **`scripts/check-chot.mjs` DÍNH THẬT** — `walk(ROOT)` từ gốc, danh sách bỏ qua cũng
 *     chỉ có `.worktrees`. Đo 17/08: **6.043 / 10.097 tệp nó đọc là bản sao worktree (60%)**.
 *     Và nó chạy **bên trong `npm test`**. NGOÀI vùng ghi của phiếu P-S2 — đã ghi vào báo cáo
 *     `docs/bao-cao-phien/2026-08-17-P-S2-va-noi-soi-that.md` để mở phiếu riêng.
 */
const laDuongWorktree = (ten) => ten.includes('worktrees');

function quet(thuMuc, ra = []) {
  let ds;
  try { ds = readdirSync(thuMuc); } catch { return ra; }
  for (const ten of ds) {
    if (BO_QUA.has(ten) || laDuongWorktree(ten)) continue;
    const p = join(thuMuc, ten);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) quet(p, ra);
    else if (DUOI.has(extname(ten)) && !ten.includes('.test.')) ra.push(p);
  }
  return ra;
}

const TEP_MA = quet(GOC);
const MA = TEP_MA.map((p) => {
  try {
    const src = readFileSync(p, 'utf8');
    // Tách dòng MỘT LẦN lúc nạp. Trước đây `timDinhDanh` split lại cho MỖI định danh; với 68
    // spec thì chịu được, với 505 tệp văn bản thì không.
    return { p: p.replace(GOC + '/', ''), src, dong: src.split('\n') };
  } catch { return { p: p.replace(GOC + '/', ''), src: '', dong: [] }; }
});

/* ── NGUỒN VĂN BẢN — nới từ 68 SPEC ra toàn bộ VĂN BẢN SỐNG (P-S2, 17/08) ───── */
/**
 * Vì sao nới: bệnh "sổ nói một đằng, code một nẻo" KHÔNG chỉ sống trong tệp tên `SPEC-*`.
 * Ba ca đắt nhất đều nằm ngoài SPEC — `master tool` (26 lần trong sổ / 0 trong code, ngốn 6
 * phiếu) · bản đồ kiến trúc mồ côi 19 ngày · `.idfnotes`+`KB-5` (khái niệm ma, chưa bao giờ
 * có code). Quét đúng `SPEC-*` là soi đúng chỗ ÍT bệnh nhất.
 *
 * LOẠI TRỪ TƯỜNG MINH + LÝ DO (khuôn của `soi-tu-dien.mjs` MD_LOAI_TRU): thứ bị loại đều là
 * NHẬT KÝ — nó ghi *"cái gì được quyết, khi nào"*, không điều khiển việc nào đang chạy. Sửa
 * nhật ký cũ là **viết lại lịch sử**, không phải sửa lỗi. Máy soi mà báo đỏ vào nhật ký thì
 * người ta chỉ có một cách đóng cửa: học cách bỏ qua nó.
 */
const VB_LOAI_TRU = [
  ['docs/memory/', 'ký ức phiên đã nén — BẢN GHI của quá khứ, không điều khiển việc nào'],
  ['docs/bao-cao-phien/', 'báo cáo đã nộp — sửa là sửa lời khai của một phiên đã đóng'],
  ['docs/00-CHOT.md', 'sổ chốt append-only — sửa dòng cũ là viết lại quyết định của Hoà'],
  ['docs/archive/', 'đã tự khai là kho lưu — văn bản nghỉ hưu, theo định nghĩa không còn sống'],
  ['CHANGELOG.md', 'nhật ký append-only — luật cấm xoá lịch sử cũ'],
];
const laVanBanSong = (rel) => !VB_LOAI_TRU.some(([m]) => rel === m || rel.startsWith(m));

function quetVanBan(thuMuc, ra = []) {
  let ds;
  try { ds = readdirSync(thuMuc); } catch { return ra; }
  for (const ten of ds) {
    if (ten === 'node_modules' || ten === '.git' || laDuongWorktree(ten)) continue;
    const p = join(thuMuc, ten);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) quetVanBan(p, ra);
    else if (extname(ten) === '.md') ra.push(p);
  }
  return ra;
}

const VAN_BAN = quetVanBan(join(GOC, 'docs'))
  .map((p) => p.replace(GOC + '/', ''))
  .filter(laVanBanSong)
  .sort()
  .map((rel) => ({ rel, src: readFileSync(join(GOC, rel), 'utf8') }));

/* ── DANH SÁCH THA ─────────────────────────────────────────────────────────── */
/**
 * Tha = máy VẪN THẤY nhưng CỐ Ý không báo, kèm lý do đọc được. Khác hẳn "nới điều kiện cho
 * qua cửa": mỗi dòng dưới đây là một phán đoán ĐÃ KIỂM, ghi ra để phiên sau bác được.
 */
const THA = [
  // ① MA ĐÃ KHAI TỬ — có kết luận rồi, báo đỏ mãi chỉ làm người ta quen với màu đỏ.
  ['master tool', 'KHAI TỬ 16/08. Hoà làm rõ *"master tool mà tôi nói chính là window tool"* ⇒ một tên: `cửa sổ công cụ`, khoá code `ToolWindow`. 4 chỗ còn lại trong code là docstring CHỐNG-MA, cố ý giữ.'],
  // ② TÊN KIỂU Ô, KHÔNG PHẢI ĐỊNH DANH — `SPEC-DUNG-3D-THONG-NHAT.md:353` tự khai chúng là
  //    "định dạng số/đơn vị/widget" của ô bảng thông số. Chúng chưa bao giờ là hàm/hằng số,
  //    nên "0 chỗ trong code" là ĐÚNG, không phải thiếu. Đây là 3/5 dòng ❌ ảo của bản cũ.
  ['AREA_M2', 'tên KIỂU Ô bảng thông số (SPEC-DUNG-3D-THONG-NHAT §353), không phải định danh'],
  ['MATERIAL_ID', 'tên KIỂU Ô — định danh thật cạnh nó là `matId` / `MaterialSphere`'],
  ['MONEY_VND', 'tên KIỂU Ô — định danh thật cạnh nó là `lib/boq/compute.ts`'],
  ['FACTOR', 'tên KIỂU Ô bảng thông số'],
  ['ENUM', 'từ chung của ngôn ngữ, spec dùng để tả kiểu ô — không phải định danh'],
  // ③ TIỀN TỐ QUY ƯỚC, và câu spec là câu PHỦ ĐỊNH.
  ['NEXT_PUBLIC_', 'TIỀN TỐ env, không phải định danh. Câu spec khẳng định thứ này KHÔNG ĐƯỢC có ("token chỉ ở server") — máy đọc ngược ý. Code vẫn dùng `NEXT_PUBLIC_*` có hậu tố ở 11 chỗ.'],
  // ④ THỨ CÓ THẬT NHƯNG KHÔNG SỐNG TRONG .ts — "0 code" ở đây là đúng, không phải thiếu.
  ['.dmg', 'đuôi bộ cài macOS do electron-builder sinh ra — sản phẩm của quy trình đóng gói, không phải khái niệm trong sản phẩm'],
  ['.gitignore', 'tệp cấu hình git CÓ THẬT ở gốc repo; nó chỉ không phải mã .ts/.tsx/.mjs'],
  ['internal tool', 'cụm tiếng Anh trong bàn luận giấy phép GPL ("tool nội bộ, không phát hành") — một lập luận pháp lý, không phải tên một thứ trong sản phẩm'],
];
const THA_TEN = new Set(THA.map(([t]) => t));

/** Tha theo HỌ, cho thứ sẽ đẻ thêm thành viên mới — tha từng cái thì lần sau lại kêu. */
const THA_MAU = [
  [/^(NC|NT|KB|G|A|B|P|V|L|M|F|T|D|E|H|K|N|R|S)-\d{1,2}$/, 'MÃ VĂN BẢN (bài nghiên cứu · nguyên tắc · khuôn · dòng sổ). `docs/nc/` và các sổ là VĂN BẢN — theo định nghĩa không có code, nên "0 code" không nói lên điều gì. ⚠️ NGOẠI LỆ CỐ Ý: `KB-5` KHÔNG được tha — nó là ca ma THẬT (khuôn chỉ có KB-1..4, xem `docs/nc/NC-SOI-3-CHANG-2026-08-16.md:29`), và là bài tự kiểm của máy này.'],
];
const THA_KB5 = 'KB-5';
const duocTha = (ten) =>
  THA_TEN.has(ten) || (ten !== THA_KB5 && THA_MAU.some(([re]) => re.test(ten)));

/** Tìm một định danh trong toàn bộ mã. Trả về file:dòng đầu tiên khai nó, hoặc null. */
function timDinhDanh(ten) {
  const re = new RegExp(`\\b(function|const|let|class|interface|type|enum)\\s+${ten}\\b`);
  const reGoi = new RegExp(`\\b${ten}\\b`);
  let noiGoi = null;
  for (const { p, src, dong } of MA) {
    if (!reGoi.test(src)) continue;
    for (let i = 0; i < dong.length; i++) {
      if (re.test(dong[i])) return { file: p, dong: i + 1, khai: true };
      if (!noiGoi && reGoi.test(dong[i])) noiGoi = { file: p, dong: i + 1, khai: false };
    }
  }
  return noiGoi;
}

/** Đếm số nơi GỌI một định danh, ngoài chính tệp khai nó — để biết đã mount chưa (N6). */
function demNoiGoi(ten, fileKhai) {
  let n = 0;
  const re = new RegExp(`\\b${ten}\\b`, 'g');
  for (const { p, src } of MA) {
    if (p === fileKhai) {
      // VÁ 08/08 (2 agent đối chiếu cùng bắt): hàm khai VÀ gọi trong cùng file từng bị đếm là
      // "0 nơi gọi" (drawSnap CadCanvas:2360, DRAG_ACTIVE_THRESHOLD_PX Element:205 = báo động
      // giả). Heuristic: xuất hiện >1 lần trong chính file khai = có nơi dùng nội bộ.
      const m = src.match(re);
      if (m && m.length > 1) n++;
      continue;
    }
    if (re.test(src)) n++;
  }
  return n;
}

/* ── rút định danh từ mỗi spec ─────────────────────────────────────────────── */
/**
 * Spec trong repo này hay viết `file.ts:123` hoặc `` `tenHam()` `` trong bảng đối chiếu.
 * Rút hai dạng đó — chúng là thứ spec CAM KẾT là đã có.
 */
function rutDinhDanh(src) {
  const ra = new Map(); // ten → dòng spec nói gì
  const dong = src.split('\n');
  for (const d of dong) {
    // chỉ soi dòng có dấu hiệu KHẲNG ĐỊNH đã có
    const noiDaCo = /✅|ĐÃ CÓ|đã có|xong|có test|sẵn có|SẴN/.test(d);
    if (!noiDaCo) continue;
    // VÁ N5 (08/08): dòng bảng nhiều cột có thể vừa chứa ✅ (cột khác) vừa chứa ⬜ THÊM
    // cho chính định danh đó ⇒ 17/20 ❌ lần chạy đầu là báo động giả. Dòng nào còn dấu
    // CHƯA-CÓ thì bỏ qua — không được tính là spec cam kết "đã có".
    const noiChuaCo = /⬜|❌|THÊM/.test(d);
    if (noiChuaCo) continue;
    for (const m of d.matchAll(/`([A-Za-z_$][A-Za-z0-9_$]{2,})\(\)`/g)) ra.set(m[1], d.trim());
    for (const m of d.matchAll(/`([A-Z][A-Z0-9_]{3,})`/g)) ra.set(m[1], d.trim());
  }
  return ra;
}

/* ── CHIỀU ③ MA: rút KHÁI NIỆM (không phải hàm/hằng số) ─────────────────────── */
/**
 * Ba ca đắt nhất của IF đều KHÔNG phải tên hàm — `master tool` · `.idfnotes` · `KB-5`. Hai
 * mẫu của `rutDinhDanh` bỏ sót cả ba: mẫu ①  đòi `()`, mẫu ② đòi CHỮ HOA TOÀN PHẦN.
 *
 * ⚠️ VÀ CỬA VÀO PHẢI KHÁC: chiều ① chỉ soi dòng có dấu ✅ ("spec cam kết đã có"). Con ma thì
 * nguy hiểm ở chỗ **được nhắc như thể có thật** — nó gần như không bao giờ đứng cạnh dấu ✅.
 * Nên phép thử của chiều ③ đơn giản hơn và tất định hơn: *"tên này lan ≥2 tệp văn bản SỐNG,
 * mà code có 0 chỗ"*.
 */
const thoat = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const MAU_MA = [
  /`(\.[a-z][a-z0-9]{2,12})`/g,              // đuôi tệp:  `.idfnotes` · `.idfc`
  /`([A-Z]{2,5}-\d{1,2})`/g,                 // mã khuôn:  `KB-5` · `NT-18`
  /"([a-z]+ tool)"|\*"?([a-z]+ tool)"?\*/g,  // cụm 2 chữ: "master tool"
];
function rutKhaiNiem(src) {
  const ra = new Set();
  for (const mau of MAU_MA) for (const m of src.matchAll(mau)) ra.add(m[1] || m[2]);
  return ra;
}
/**
 * Có mặt trong mã nguồn không? Dùng so chuỗi thoát — tên ma có `.` và `-`, `\b` không dùng được.
 *
 * 🔴 BẪY TỰ THAM CHIẾU (vòng 3, 17/08): máy này quét `scripts/`, tức quét CHÍNH NÓ. Docstring
 * ở trên nêu đích danh `.idfnotes` và `KB-5` làm ví dụ ⇒ `coTrongMa` tìm thấy chúng **trong
 * chính tệp máy soi** ⇒ kết luận "code có" ⇒ hai con ma thật lọt lưới, bài tự kiểm ⑥b hỏng
 * mà bảng tổng vẫn xanh. Đây đúng dạng hỏng mà cả phiếu này sinh ra để diệt: im lặng, trông
 * như đúng.
 *
 * Loại chính mình ra khỏi cây bằng chứng: máy NÓI VỀ căn bệnh không phải là căn bệnh. Cùng lý
 * do `soi-tu-dien.mjs` loại `NC-TU-DA-NGHIA` ("chính là nơi ĐỊNH NGHĨA các từ này").
 */
const TEP_MAY_SOI = 'scripts/soi-that.mjs';
const coTrongMa = (ten) => {
  const re = new RegExp(thoat(ten));
  return MA.some(({ p, src }) => p !== TEP_MAY_SOI && re.test(src));
};

/* ── chạy ──────────────────────────────────────────────────────────────────── */
let vanBan = VAN_BAN;
if (LOC) vanBan = vanBan.filter((v) => v.rel.toLowerCase().includes(LOC.toLowerCase()));

console.log(`Đối chiếu ${vanBan.length} tệp văn bản SỐNG ↔ ${MA.length} tệp mã nguồn\n`);

let tongCo = 0, tongMat = 0, tongMoCoi = 0, tongTha = 0;
const vbKhongDoc = [];
/** tên khái niệm ứng viên (rút từ dạng có nháy ngược — chỗ văn bản CHỦ Ý gọi tên một thứ) */
const ungVienMa = new Set();

for (const { rel, src } of vanBan) {
  for (const kn of rutKhaiNiem(src)) ungVienMa.add(kn);

  const dd = rutDinhDanh(src);
  if (dd.size === 0) { vbKhongDoc.push(rel); continue; }

  const dongIn = [];
  for (const [id, cauSpec] of dd) {
    if (duocTha(id)) { tongTha++; continue; }
    const vt = timDinhDanh(id);
    if (!vt) {
      tongMat++;
      dongIn.push(`  ❌ ${id.padEnd(26)} văn bản nói CÓ · code KHÔNG THẤY`);
      dongIn.push(`     văn bản: ${cauSpec.slice(0, 100)}`);
      continue;
    }
    tongCo++;
    const goi = demNoiGoi(id, vt.file);
    const moCoi = goi === 0;
    if (moCoi) tongMoCoi++;
    if (CHI_DO && !moCoi) continue;
    dongIn.push(
      `  ${moCoi ? '🟡' : '✅'} ${id.padEnd(26)} ${vt.file}:${vt.dong}` +
      (moCoi ? '   ⚠️ 0 NƠI GỌI — code có, chưa ai dùng (N6)' : `   ${goi} nơi gọi`),
    );
  }
  if (dongIn.length) {
    console.log(`── ${rel}`);
    dongIn.forEach((l) => console.log(l));
    console.log('');
  }
}

/* ── CHIỀU ③ MA — in ────────────────────────────────────────────────────────── */
const MA_TOI_THIEU = 2; // lan ≥2 tệp = đã thành từ vựng chung, không còn là chữ viết vội một lần
/**
 * ⚠️ TÌM ứng viên bằng dạng có nháy ngược, nhưng ĐẾM ĐỘ LAN bằng chuỗi trần — hai việc khác
 * nhau, cố ý tách. Vòng 1 đếm luôn bằng dạng có nháy ngược ⇒ `.idfnotes` chỉ ra **1** tệp
 * (vì 4 chỗ còn lại viết `<project>.idfnotes.json`, không phải `` `.idfnotes` ``) ⇒ trượt
 * ngưỡng 2 ⇒ **bài tự kiểm ⑥b hỏng**. Con ma lan bằng văn xuôi chứ không lan bằng nháy ngược.
 */
const demTepNhac = (ten) => {
  const re = new RegExp(thoat(ten));
  return VAN_BAN.filter(({ src }) => re.test(src)).map(({ rel }) => rel);
};
const conMa = [...ungVienMa]
  .filter((ten) => !duocTha(ten) && !coTrongMa(ten))
  .map((ten) => [ten, demTepNhac(ten)])
  .filter(([, tep]) => tep.length >= MA_TOI_THIEU)
  .sort((a, b) => b[1].length - a[1].length);

if (conMa.length && !CHI_DO) {
  console.log('─'.repeat(70));
  console.log('👻 KHÁI NIỆM MA — văn bản nhắc nhiều, code 0 chỗ (chiều ③, thêm 17/08)\n');
  for (const [ten, tep] of conMa) {
    console.log(`  👻 ${ten.padEnd(20)} ${String(tep.length).padStart(2)} tệp sổ · 0 code`);
    console.log(`     ${tep.slice(0, 3).join(' · ')}${tep.length > 3 ? ` … +${tep.length - 3}` : ''}`);
  }
  console.log('');
}

/* ── CHIỀU ② CÂM — code có, bản đồ không biết ───────────────────────────────── */
/**
 * Chiều ngược của ①. Ca đẻ ra nó: `lib/materials/resolve.ts` viết 07/08, không văn bản nào
 * nhắc ⇒ sổ vẫn ghi *"lib/materials = 0 code"* suốt 10 ngày, và 17/08 T đem con số sai đó đi
 * soạn phiếu. Một chiều thì chỉ bắt được *sổ nói dối về code*; bệnh kia là *sổ không biết
 * code tồn tại* — im lặng hơn, nên sống lâu hơn.
 *
 * ĐƠN VỊ LÀ THƯ MỤC, KHÔNG PHẢI TỆP — cố ý. Xét từng tệp thì hàng trăm tệp phụ chưa bao giờ
 * đáng lên bản đồ cũng kêu, và một máy soi kêu nhiều thì chết. Cả một THƯ MỤC mà không tệp
 * nào, không tên xuất nào được nhắc ⇒ đó là *một mảng* bản đồ không biết. Đó mới là tin.
 */
const GOC_MA = ['lib', 'components', 'app'];
const vbGop = VAN_BAN.map((v) => v.src).join('\n');
const thuMucMa = new Map(); // thư mục → {tep, xuat}
for (const { p, src } of MA) {
  const goc = p.split('/')[0];
  if (!GOC_MA.includes(goc) || p.split('/').length < 3) continue;
  const thuMuc = p.split('/').slice(0, 2).join('/');
  if (!thuMucMa.has(thuMuc)) thuMucMa.set(thuMuc, { tep: [], xuat: new Set() });
  const o = thuMucMa.get(thuMuc);
  o.tep.push(p);
  for (const m of src.matchAll(/export\s+(?:async\s+)?(?:function|const|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g)) o.xuat.add(m[1]);
}
const camDs = [...thuMucMa.entries()]
  .filter(([thuMuc, o]) => {
    if (vbGop.includes(thuMuc)) return false;                       // đường dẫn thư mục được nhắc
    if (o.tep.some((t) => vbGop.includes(t))) return false;         // tệp nào đó được nhắc
    for (const x of o.xuat) if (new RegExp(`\\b${x}\\b`).test(vbGop)) return false; // tên xuất được nhắc
    return true;
  })
  .sort((a, b) => b[1].tep.length - a[1].tep.length);

if (camDs.length && !CHI_DO) {
  console.log('─'.repeat(70));
  console.log('🔇 MẢNG CÂM — code có, không văn bản SỐNG nào nhắc (chiều ②, thêm 17/08)\n');
  for (const [thuMuc, o] of camDs) console.log(`  🔇 ${thuMuc.padEnd(34)} ${String(o.tep.length).padStart(3)} tệp · ${String(o.xuat.size).padStart(3)} tên xuất · 0 lần được nhắc`);
  console.log('');
}

console.log('─'.repeat(70));
console.log(`✅ văn bản nói có · code CÓ THẬT & đã dùng : ${tongCo - tongMoCoi}`);
console.log(`🟡 code CÓ nhưng 0 NƠI GỌI                : ${tongMoCoi}   ← đây là "kho chưa mở cửa"`);
console.log(`❌ văn bản nói có · code KHÔNG THẤY       : ${tongMat}   ← phải người kiểm`);
console.log(`👻 khái niệm MA (≥${MA_TOI_THIEU} tệp sổ · 0 code)      : ${conMa.length}   ← dựng hoặc khai tử, đừng để đó`);
console.log(`🔇 mảng CÂM (code có · sổ không biết)     : ${camDs.length}   ← bản đồ thiếu, không phải code thiếu`);
console.log(`⚪ tha có lý do trong mã                  : ${tongTha}`);
console.log(`\n   Phạm vi văn bản: docs/ đệ quy, ${VAN_BAN.length} tệp .md`);
console.log(`   Loại trừ (nhật ký — sửa là viết lại lịch sử): ${VB_LOAI_TRU.map(([m]) => m).join(' · ')}`);
if (vbKhongDoc.length) {
  console.log(`\n⚠️ ${vbKhongDoc.length}/${vanBan.length} tệp văn bản KHÔNG rút được định danh (viết bằng văn xuôi) — máy MÙ ở đó, phải đọc tay.`);
}
console.log('\nLuật §0ae: đọc văn bản trước khi tin sổ. Sổ là ảnh chụp cũ, code là sự thật.');
