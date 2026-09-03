#!/usr/bin/env node
/**
 * Chặn dữ liệu demo/test/khách và DB nguồn lọt vào bộ cài.
 *
 * Chạy trước electron-builder: kiểm hợp đồng build.files.
 * Chạy sau electron-builder: quét ruột thư mục app đã bung nếu nó hiện diện.
 * Không đọc, sửa hay xoá userData của người dùng.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const chan = process.argv.includes('--chan');
const chiHopDong = process.argv.includes('--hop-dong');
const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const files = pkg.build?.files ?? [];
const extra = pkg.build?.extraResources ?? [];
const failures = [];

const REQUIRED_EXCLUDES = [
  '!prisma/*.db*',
  '!public/test-assets/**',
  '!public/__testcases/**',
  '!public/__lincoln.glb',
  '!public/__lincoln-viewer.html',
  '!public/demo/**',
  '!public/detech/**',
  '!public/wallpapers/ttt-*/**',
  '!public/covers/**',
  '!public/library-uploads/**',
  '!public/comments-images/**',
  '!public/library-assets/lincoln-327/**',
  '!public/anh-khoa/**',
];

for (const rule of REQUIRED_EXCLUDES) {
  if (!files.includes(rule)) failures.push(`build.files thiếu luật loại: ${rule}`);
}

for (const resource of extra) {
  const filters = resource?.filter ?? [];
  if (String(resource?.from ?? '').includes('.prisma') && !filters.some((x) => /^!.*\.db/.test(x))) {
    failures.push(`extraResources ${resource.from} chưa loại tệp .db`);
  }
}

// Chỉ quét dữ liệu first-party dưới resources/app; không kết tội fixture nội bộ của dependency.
const ARTIFACT_ROOTS = [
  'dist-installer/win-unpacked/resources/app',
  'dist-installer/mac-arm64/InteriorFlow.app/Contents/Resources/app',
  'dist-installer/mac/InteriorFlow.app/Contents/Resources/app',
].map((p) => path.join(ROOT, p)).filter(existsSync);

const forbidden = [
  /(^|\/)prisma\/[^/]*(?:\.db(?:-|\.|$)|\.sqlite(?:-|\.|$))/i,
  /(^|\/)public\/(?:test-assets|__testcases|demo|detech|covers|library-uploads|comments-images|anh-khoa)(\/|$)/i,
  /(^|\/)public\/library-assets\/lincoln-327(\/|$)/i,
  /(^|\/)public\/wallpapers\/ttt-[^/]+(\/|$)/i,
  /(^|\/)public\/__lincoln[^/]*(\/|$)/i,
];

function walk(dir, base = dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    const relative = path.relative(base, absolute).split(path.sep).join('/');
    if (entry.isDirectory()) walk(absolute, base);
    else if (forbidden.some((re) => re.test(relative))) failures.push(`artifact chứa dữ liệu cấm: ${relative}`);
  }
}

if (!chiHopDong) for (const root of ARTIFACT_ROOTS) walk(root);

const soArtifact = chiHopDong ? 0 : ARTIFACT_ROOTS.length;
console.log(`── dữ liệu đóng gói: ${REQUIRED_EXCLUDES.length} luật loại · ${soArtifact} artifact đã quét`);
if (failures.length) {
  for (const failure of failures) console.error(`🔴 ${failure}`);
  if (chan) process.exit(1);
} else {
  console.log(soArtifact
    ? '✅ Hợp đồng và ruột artifact không chứa DB/demo/test/customer assets đã biết.'
    : '✅ Hợp đồng đóng gói đã chặn DB/demo/test/customer assets đã biết; chưa có artifact để quét ruột.');
}
