#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';

const repo = process.cwd();
const cloudRoot = join(homedir(), 'Library', 'CloudStorage');
const controlCenterName = '00 · IDF CONTROL CENTER';

/**
 * ⚠️ SỬA 28/08 — lane Codex bắt được: bản cũ `entries.find(startsWith('GoogleDrive-'))` lấy
 * **tài khoản Google ĐẦU TIÊN tìm thấy**. Máy có hai tài khoản (một cá nhân, một builder) thì nó
 * xuất nhầm chỗ, và "nhầm chỗ" ở đây nghĩa là **đẩy tài liệu quản trị vào Drive chứa tài liệu
 * khách hàng**. Nay: nhiều hơn một tài khoản ⇒ **DỪNG**, đòi khai tường minh. Đoán mò một lần
 * đúng chín lần không bù được một lần sai.
 */
async function findDriveRoot() {
  const explicit = process.env.IDF_DRIVE_ROOT;
  if (explicit) return explicit;
  const entries = await readdir(cloudRoot, { withFileTypes: true });
  const tatCa = entries.filter((e) => e.isDirectory() && e.name.startsWith('GoogleDrive-'));
  const chon = process.env.IDF_DRIVE_ACCOUNT;
  const google = chon ? tatCa.find((e) => e.name.includes(chon)) : tatCa[0];
  if (chon && !google) {
    throw new Error(`Không thấy tài khoản Drive khớp IDF_DRIVE_ACCOUNT="${chon}". Đang có: ${tatCa.map((e) => e.name).join(', ')}`);
  }
  if (!chon && tatCa.length > 1) {
    throw new Error(
      `Có ${tatCa.length} tài khoản Google Drive trên máy — KHÔNG đoán.\n` +
        tatCa.map((e) => `   · ${e.name}`).join('\n') +
        `\nKhai tường minh: IDF_DRIVE_ACCOUNT=<phần email> hoặc IDF_DRIVE_ROOT=<đường dẫn đầy đủ>.`,
    );
  }
  if (!google) throw new Error('Không thấy Google Drive sync trong ~/Library/CloudStorage.');
  const account = join(cloudRoot, google.name);
  const children = await readdir(account, { withFileTypes: true });
  const myDrive = children.find((entry) => entry.isDirectory() && /^(Drive|My Drive)/u.test(entry.name));
  if (!myDrive) throw new Error(`Không thấy thư mục Drive chính trong ${account}.`);
  return join(account, myDrive.name, controlCenterName);
}

const bam = (b) => createHash('sha256').update(b).digest('hex');

/**
 * ⚠️ SỬA 28/08 — lane Codex bắt được: bản cũ băm **tệp NGUỒN** rồi ghi vào receipt. Nó chứng
 * minh *"đã chép cái gì"*, KHÔNG chứng minh *"trên Drive đang có cái gì"*. Hai câu đó khác nhau
 * đúng ở chỗ đáng lo: chép hỏng, đồng bộ cắt ngang, ai đó sửa tay bản mirror.
 *
 * Nay đọc lại **tệp ĐÍCH** sau khi ghi và băm nó. `sha256Source !== sha256Destination` ⇒ người
 * đọc receipt biết ngay bản mirror **không còn là bản đã ký**.
 */
async function atomicCopy(source, destination) {
  await mkdir(join(destination, '..'), { recursive: true });
  const temporary = `${destination}.syncing`;
  await cp(source, temporary, { force: true });
  await rename(temporary, destination);
  const nguon = await readFile(source);
  const dich = await readFile(destination); // ← đọc LẠI tệp đích, không tin lượt ghi
  return {
    source: source.replace(`${repo}/`, ''),
    destination: destination.split(`${controlCenterName}/`)[1],
    bytes: nguon.length,
    sha256Source: bam(nguon),
    sha256Destination: bam(dich),
    // giữ `sha256` cho bản đọc cũ trong một vòng tương thích — nó BẰNG sha256Source
    sha256: bam(nguon),
  };
}

const drive = await findDriveRoot();
await stat(drive);

const mappings = [
  ['docs/control/IF-CURRENT-STATE.md', '01-CURRENT-STATE/IF/IF-CURRENT-STATE.md'],
  // 27/08 — ADR là DÃY DUY NHẤT của IF và nay mang cả Q14 (local-first + opt-in selective sync).
  // Nó KHÔNG nằm trong danh sách này cho tới lượt đó: quyết định canonical không tới được Drive,
  // trong khi mọi gói candidate trỏ về nó thì tới. Thiếu đúng cái được trỏ tới.
  ['docs/ADR-Q0-ARCHITECTURE-DECISIONS-2026-08-19.md', '01-CURRENT-STATE/IF/ADR-Q0-ARCHITECTURE-DECISIONS.md'],
  ['docs/control/IF-CANONICAL.md', '01-CURRENT-STATE/IF/IF-CANONICAL.md'],
  ['docs/control/IF-UXUI-OPERATING-MEMORY.md', '03-TOPICS/IF-UXUI/IF-UXUI-OPERATING-MEMORY.md'],
  ['docs/control/IF-TOOLING-RECEIPT.md', '03-TOPICS/IF-TOOLING/IF-TOOLING-RECEIPT.md'],
  ['docs/control/IF-UI-REVIEW-BOARD.md', '06-REVIEW/IF-UI-REVIEW/IF-UI-REVIEW-BOARD.md'],
  ['docs/mocks/IF-UI-Review-Board.html', '06-REVIEW/IF-UI-REVIEW/IF-UI-Review-Board.html'],

  // ── GÓI CANDIDATE TTT-PROFILE-UX-001 (People & Organization) ──────────────
  // Thêm 26/08. Gói này sensitivity = INTERNAL: bảng luật có nêu tên khách hàng.
  // Mirror để Hoà và các phiên khác đọc được, KHÔNG phải để đăng công khai.
  ['docs/design-candidate/TTT-PROFILE-UX-001/MANIFEST.json',
   '06-REVIEW/TTT-PROFILE-UX-001/MANIFEST.json'],
  ['docs/design-candidate/TTT-PROFILE-UX-001/00-RECEIPT.md',
   '06-REVIEW/TTT-PROFILE-UX-001/00-RECEIPT.md'],
  ['docs/design-candidate/TTT-PROFILE-UX-001/IF-PO-14-ProjectPresenceStack.md',
   '06-REVIEW/TTT-PROFILE-UX-001/IF-PO-14-ProjectPresenceStack.md'],
  ['docs/design-candidate/TTT-PROFILE-UX-001/artifacts/IF-PO-01.dc.html',
   '06-REVIEW/TTT-PROFILE-UX-001/artifacts/IF-PO-01.dc.html'],
  ['docs/design-candidate/TTT-PROFILE-UX-001/artifacts/IF-PO-14.dc.html',
   '06-REVIEW/TTT-PROFILE-UX-001/artifacts/IF-PO-14.dc.html'],
  ['docs/design-candidate/TTT-PROFILE-UX-001/artifacts/po-canvas.json',
   '06-REVIEW/TTT-PROFILE-UX-001/artifacts/po-canvas.json'],
  // canvas độc lập — mở thẳng bằng trình duyệt từ Drive, không cần repo
  ['people-and-organization.html',
   '06-REVIEW/TTT-PROFILE-UX-001/people-and-organization.html'],


  // ── ARCHITECTURE PACKET IF-ARCH-LOCAL-FIRST-LARK-001 ──────────────────────
  // Thêm 26/08. sensitivity = INTERNAL: mô tả lỗ hổng CHƯA VÁ (R1·R2·R3).
  // Mirror để Codex MAIN và các phiên khác định tuyến. KHÔNG đăng công khai.
  ['docs/design-candidate/IF-ARCH-LOCAL-FIRST-LARK-001/00-RECEIPT.md',
   '06-REVIEW/IF-ARCH-LOCAL-FIRST-LARK-001/00-RECEIPT.md'],
  ['docs/design-candidate/IF-ARCH-LOCAL-FIRST-LARK-001/01-OBSERVED-BACKEND-MAP.md',
   '06-REVIEW/IF-ARCH-LOCAL-FIRST-LARK-001/01-OBSERVED-BACKEND-MAP.md'],
  ['docs/design-candidate/IF-ARCH-LOCAL-FIRST-LARK-001/02-LOCAL-FIRST-BOUNDARY.md',
   '06-REVIEW/IF-ARCH-LOCAL-FIRST-LARK-001/02-LOCAL-FIRST-BOUNDARY.md'],
  ['docs/design-candidate/IF-ARCH-LOCAL-FIRST-LARK-001/03-LARK-CONNECTOR-EVIDENCE.md',
   '06-REVIEW/IF-ARCH-LOCAL-FIRST-LARK-001/03-LARK-CONNECTOR-EVIDENCE.md'],
  ['docs/design-candidate/IF-ARCH-LOCAL-FIRST-LARK-001/04-NEUTRAL-CONTRACT.md',
   '06-REVIEW/IF-ARCH-LOCAL-FIRST-LARK-001/04-NEUTRAL-CONTRACT.md'],
  ['docs/design-candidate/IF-ARCH-LOCAL-FIRST-LARK-001/05-DATA-CLASSIFICATION.md',
   '06-REVIEW/IF-ARCH-LOCAL-FIRST-LARK-001/05-DATA-CLASSIFICATION.md'],
  ['docs/design-candidate/IF-ARCH-LOCAL-FIRST-LARK-001/06-SYNC-OPTIONS.md',
   '06-REVIEW/IF-ARCH-LOCAL-FIRST-LARK-001/06-SYNC-OPTIONS.md'],
  ['docs/design-candidate/IF-ARCH-LOCAL-FIRST-LARK-001/07-RISKS-AND-UNKNOWN.md',
   '06-REVIEW/IF-ARCH-LOCAL-FIRST-LARK-001/07-RISKS-AND-UNKNOWN.md'],
  ['docs/design-candidate/IF-ARCH-LOCAL-FIRST-LARK-001/08-ADR-CANDIDATE.md',
   '06-REVIEW/IF-ARCH-LOCAL-FIRST-LARK-001/08-ADR-CANDIDATE.md'],
  ['docs/design-candidate/IF-ARCH-LOCAL-FIRST-LARK-001/09-IMPLEMENTATION-BACKLOG.md',
   '06-REVIEW/IF-ARCH-LOCAL-FIRST-LARK-001/09-IMPLEMENTATION-BACKLOG.md'],
  ['docs/design-candidate/IF-ARCH-LOCAL-FIRST-LARK-001/10-TEST-RUNTIME-GATE.md',
   '06-REVIEW/IF-ARCH-LOCAL-FIRST-LARK-001/10-TEST-RUNTIME-GATE.md'],
  ['docs/design-candidate/IF-ARCH-LOCAL-FIRST-LARK-001/MANIFEST.json',
   '06-REVIEW/IF-ARCH-LOCAL-FIRST-LARK-001/MANIFEST.json'],

  // ── IDF-IF-PACKET-003 · bootstrap + GAP-MAP + Smartboard (26/08) ───────────
  ['docs/design-candidate/IDF-IF-PACKET-003/00-MEMORY-RECEIPT.md',
   '06-REVIEW/IDF-IF-PACKET-003/00-MEMORY-RECEIPT.md'],
  ['docs/design-candidate/IDF-IF-PACKET-003/01-IF-CORE-GAP-MAP.md',
   '06-REVIEW/IDF-IF-PACKET-003/01-IF-CORE-GAP-MAP.md'],
  ['docs/design-candidate/IDF-IF-PACKET-003/02-SMARTBOARD.md',
   '06-REVIEW/IDF-IF-PACKET-003/02-SMARTBOARD.md'],
  ['docs/design-candidate/IDF-IF-PACKET-003/MANIFEST.json',
   '06-REVIEW/IDF-IF-PACKET-003/MANIFEST.json'],
  ['docs/design-candidate/IDF-IF-PACKET-003/PACKET-003-SOURCE.md',
   '06-REVIEW/IDF-IF-PACKET-003/PACKET-003-SOURCE.md'],
];

const reviewImages = [
  'G3-vao-xuong-truoc-sau.png',
  'L1-ke-co-hang.png',
  'MOCK-home-sua-4-loi.png',
  'MOCK-home-work-os.png',
  'V-D-E-peek-chi-tiet.png',
  'W1-hai-cua-so-noi-day.png',
  'W2-ba-nac.png',
  'files-tang1-du-an.png',
  'master-completion/audit/2D.png',
  'master-completion/audit/3D.png',
  'ui-authority/home-production/real-home-1440.png',
  'ui-authority/login-redesign/opt-a.png',
  'ui-authority/login-redesign/opt-b.png',
  'ui-authority/login-redesign/opt-c.png',
  'ui-authority/production/p2-sidebar-TARGET.png',
  'ui-authority/production/sidebar-after-collapsed.png',
  'ui-authority/production/sidebar-after-expanded.png',
];

for (const relativeImage of reviewImages) {
  mappings.push([
    `artifacts/visual-review/${relativeImage}`,
    `artifacts/visual-review/${relativeImage}`,
  ]);
}

const published = [];
/**
 * Thư mục cần mirror NGUYÊN CỤM (không liệt kê từng tệp).
 *
 * ⚠️ VÌ SAO ẢNH RUNTIME KHÔNG NẰM TRONG GIT — quyết định 27/08, có lý do, không phải tiện tay:
 * `.gitignore:85-90` chặn `docs/**` ảnh dưới nhãn *"luật trung tính + repo nhẹ (chốt 01/08)"*.
 * Hai lý do, và lý do thứ hai là lý do chặn:
 *   ① repo nhẹ — mỗi lượt audit ~4 MB, cộng dồn theo thời gian;
 *   ② **TRUNG TÍNH** — ảnh runtime chụp app với **dữ liệu dự án THẬT**, mang tên khách hàng.
 *      Đưa chúng vào repo là đưa tên khách của một studio vào sản phẩm bán ra toàn cầu — đúng
 *      thứ mà LUẬT NỀN TẢNG (`CLAUDE.md`) cấm.
 * ⇒ Ảnh đi Drive (kho riêng của Hoà), **hash nằm trong `ux/MANIFEST.md` đã commit** để đối chiếu
 * được. Bằng chứng vẫn tái lập được, mà repo vẫn trung tính.
 */
const folderMappings = [
  ['docs/design-candidate/IDF-IF-PACKET-003/ux/anh', '06-REVIEW/IF-UXUI-RUNTIME/anh'],
];

for (const [relativeSource, relativeDestination] of mappings) {
  published.push(await atomicCopy(join(repo, relativeSource), join(drive, relativeDestination)));
}

for (const [relSrcDir, relDstDir] of folderMappings) {
  const srcDir = join(repo, relSrcDir);
  let names = [];
  try {
    names = (await readdir(srcDir, { withFileTypes: true })).filter((e) => e.isFile()).map((e) => e.name);
  } catch {
    continue; // thư mục chưa tồn tại ⇒ bỏ qua, không phải lỗi
  }
  for (const name of names.sort()) {
    published.push(await atomicCopy(join(srcDir, name), join(drive, relDstDir, name)));
  }
}

/**
 * ⚠️ SỬA 28/08 — hai lỗ nữa lane Codex bắt được:
 *
 * ① **Rò đường dẫn máy cá nhân.** Bản cũ ghi `repo` và `drive` là đường TUYỆT ĐỐI
 *    (`/Users/tranben/…`, kèm email trong tên thư mục CloudStorage). Tệp này **nằm trên Drive**
 *    — nơi sẽ chia sẻ cho người khác. Bỏ hẳn; đường dẫn tương đối trong `files[]` là đủ để đối
 *    chiếu, và không nói gì về máy ai.
 *
 * ② **Không có mốc thời gian/phiên bản.** Người đọc bản mirror không biết nó cũ hay mới, nên
 *    một tác nhân đọc Drive sẽ phát biểu "trạng thái hiện tại" trên một ảnh chụp đã cũ — đúng ca
 *    vừa xảy ra: một báo cáo đo ở `c7f3ac8` được đọc như đang đúng, trong khi HEAD đã đi 54
 *    commit. `sourceHead`/`sourceBranch`/`generationId`/`expiresAt` là thứ chặn được điều đó.
 */
const git = (args) => {
  try {
    return execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
};
const sourceHead = git(['rev-parse', 'HEAD']);
const sourceBranch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
const cayBan = (git(['status', '--porcelain']) ?? '').split('\n').filter(Boolean).length;
const publishedAt = new Date();
const HAN_NGAY = 7;

const receipt = {
  schema: 'IDF-SYNC-RECEIPT-v2',
  direction: 'IF-REPO_TO_DRIVE',
  // Định danh DUY NHẤT của lượt xuất: thời điểm + HEAD. Hai lượt cùng HEAD vẫn khác generation.
  generationId: `${publishedAt.toISOString()}_${(sourceHead ?? 'unknown').slice(0, 12)}`,
  namespace: 'IF',
  sourceHead,
  sourceBranch,
  // Cây bẩn ⇒ bản mirror KHÔNG tái lập được từ HEAD. Phải nói ra, không im.
  sourceDirtyFiles: cayBan,
  publishedAt: publishedAt.toISOString(),
  expiresAt: new Date(publishedAt.getTime() + HAN_NGAY * 864e5).toISOString(),
  generatedAt: publishedAt.toISOString(), // giữ tên cũ một vòng cho bản đọc cũ
  files: published,
};
const receiptPath = join(drive, '01-CURRENT-STATE', 'IF', 'SYNC-RECEIPT.json');
const receiptTemporary = `${receiptPath}.syncing`;
await writeFile(receiptTemporary, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
await rename(receiptTemporary, receiptPath);

const lech = published.filter((f) => f.sha256Source !== f.sha256Destination);
console.log(`Đã xuất ${published.length} nguồn IF sang ${basename(drive)}`);
console.log(`  generation : ${receipt.generationId}`);
console.log(`  HEAD       : ${sourceHead?.slice(0, 12)} · nhánh ${sourceBranch} · cây bẩn ${cayBan} tệp`);
console.log(`  hết hạn    : ${receipt.expiresAt.slice(0, 10)} (${HAN_NGAY} ngày)`);
console.log(lech.length ? `  🔴 ${lech.length} tệp LỆCH nguồn↔đích` : '  ✅ mọi tệp: hash nguồn = hash đích');
if (cayBan > 0) {
  console.log(`  🟡 cây bẩn ${cayBan} tệp — bản mirror này KHÔNG tái lập được từ HEAD ${sourceHead?.slice(0, 8)}`);
}
console.log(`Receipt: ${receiptPath}`);
