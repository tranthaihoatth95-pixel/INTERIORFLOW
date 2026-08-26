#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';

const repo = process.cwd();
const cloudRoot = join(homedir(), 'Library', 'CloudStorage');
const controlCenterName = '00 · IDF CONTROL CENTER';

async function findDriveRoot() {
  const explicit = process.env.IDF_DRIVE_ROOT;
  if (explicit) return explicit;
  const entries = await readdir(cloudRoot, { withFileTypes: true });
  const google = entries.find((entry) => entry.isDirectory() && entry.name.startsWith('GoogleDrive-'));
  if (!google) throw new Error('Không thấy Google Drive sync trong ~/Library/CloudStorage.');
  const account = join(cloudRoot, google.name);
  const children = await readdir(account, { withFileTypes: true });
  const myDrive = children.find((entry) => entry.isDirectory() && /^(Drive|My Drive)/u.test(entry.name));
  if (!myDrive) throw new Error(`Không thấy thư mục Drive chính trong ${account}.`);
  return join(account, myDrive.name, controlCenterName);
}

async function atomicCopy(source, destination) {
  await mkdir(join(destination, '..'), { recursive: true });
  const temporary = `${destination}.syncing`;
  await cp(source, temporary, { force: true });
  await rename(temporary, destination);
  const bytes = await readFile(source);
  return {
    source: source.replace(`${repo}/`, ''),
    destination: destination.split(`${controlCenterName}/`)[1],
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
}

const drive = await findDriveRoot();
await stat(drive);

const mappings = [
  ['docs/control/IF-CURRENT-STATE.md', '01-CURRENT-STATE/IF/IF-CURRENT-STATE.md'],
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
for (const [relativeSource, relativeDestination] of mappings) {
  published.push(await atomicCopy(join(repo, relativeSource), join(drive, relativeDestination)));
}

const receipt = {
  schema: 'IDF-SYNC-RECEIPT-v1',
  direction: 'IF-REPO_TO_DRIVE',
  generatedAt: new Date().toISOString(),
  repo,
  drive,
  files: published,
};
const receiptPath = join(drive, '01-CURRENT-STATE', 'IF', 'SYNC-RECEIPT.json');
const receiptTemporary = `${receiptPath}.syncing`;
await writeFile(receiptTemporary, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
await rename(receiptTemporary, receiptPath);

console.log(`Đã xuất ${published.length} nguồn IF sang ${drive}`);
console.log(`Receipt: ${receiptPath}`);
