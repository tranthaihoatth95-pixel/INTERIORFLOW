/**
 * scripts/chup-visual-review.mjs — chụp đúng BỘ 5 ẢNH cho `artifacts/visual-review/`.
 *
 * [Đ2] KHÔNG dựng máy chụp thứ hai: dùng lại ĐÚNG cơ chế của `chup-man-duyet-mat.mjs` —
 * `launchPersistentContext` trên hồ sơ `~/.if-phien-chup-man`. Nhờ đó **không cần mật khẩu**:
 * phiên đã được ghi nhớ từ lần đăng nhập tay trước đó.
 * Phiên hết hạn thì chạy: `node scripts/chup-man-duyet-mat.mjs --dang-nhap` (đăng nhập tay 1 lần).
 *
 * Chụp NGUYÊN VIEWPORT 1440×900, KHÔNG cắt vỏ app, cùng một cỡ cho cả 5 ảnh.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const URL_GOC = process.env.IF_URL ?? 'http://localhost:3000';
const PHIEN = join(homedir(), '.if-phien-chup-man');
const OUT = join(process.cwd(), 'artifacts', 'visual-review');
const DU_AN = process.env.IF_PROJECT ?? 'cmsqu517r0001w9axbunx9m7m';
/** Dự án có bản vẽ TRỐNG — dùng riêng cho ảnh 01 (empty state). */
const DU_AN_RONG = process.env.IF_PROJECT_EMPTY ?? 'cmt10d9lg0016w9rbvnkt9xh3';

/** Khoá nấc rail + khoá thu/mở bảng trái — đặt TRƯỚC khi tải trang để chụp đúng trạng thái. */
async function datNac(page, nac, navCollapsed) {
  await page.addInitScript(
    ([n, c]) => {
      try {
        localStorage.setItem('interiorflow.rail.nac_v1', n);
        if (c === null) localStorage.removeItem('interiorflow.navigator.collapsed_v1');
        else localStorage.setItem('interiorflow.navigator.collapsed_v1', c);
      } catch {}
    },
    [nac, navCollapsed],
  );
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const ctx = await chromium.launchPersistentContext(PHIEN, {
    headless: true,
    viewport: { width: 1440, height: 900 },
    locale: 'vi-VN',
  });
  const page = ctx.pages()[0] ?? (await ctx.newPage());

  await page.goto(URL_GOC, { waitUntil: 'domcontentloaded' }).catch(() => {});
  const me = await page.request.get(`${URL_GOC}/api/auth/me`).catch(() => null);
  if (!me || !me.ok()) {
    console.error(
      '\n⛔ PHIÊN CHỤP CHƯA ĐĂNG NHẬP — không chụp được bên trong app.\n' +
        '   Chạy MỘT LẦN, đăng nhập tay rồi đóng cửa sổ:\n' +
        '     node scripts/chup-man-duyet-mat.mjs --dang-nhap\n' +
        '   Rồi chạy lại lệnh này.\n',
    );
    await ctx.close();
    process.exit(1);
  }
  console.log('✅ Phiên hợp lệ — bắt đầu chụp\n');

  const canh = [
    // tên tệp                  đường                              nấc rail      bảng trái
    // Bản vẽ RỖNG thật nằm ở dự án khác (dự án mặc định đã có tường) — chụp đúng chỗ rỗng,
    // KHÔNG tạo dữ liệu mới chỉ để có ảnh.
    ['01-2d-empty.png',        `/projects/${DU_AN_RONG}/cad`,      'dieuHuong',  null],
    ['02-sidebar-collapsed.png', `/projects/${DU_AN}/cad`,         'dinhVi',     null],
    ['03-sidebar-expanded.png', `/projects/${DU_AN}/cad`,          'duyet',      null],
    ['04-2d-full.png',         `/projects/${DU_AN}/cad`,           'dieuHuong',  null],
    ['05-home.png',            `/`,                                'dieuHuong',  null],
  ];

  for (const [ten, duong, nac, nav] of canh) {
    const p = await ctx.newPage();
    await datNac(p, nac, nav);
    await p.setViewportSize({ width: 1440, height: 900 });
    await p.goto(URL_GOC + duong, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await p.waitForTimeout(3500); // chờ canvas/ảnh vẽ xong — chụp sớm ra khung trắng
    const tep = join(OUT, ten);
    await p.screenshot({ path: tep, timeout: 30000, animations: 'disabled' });
    console.log(`  ✓ ${ten}  ←  ${duong}  (rail=${nac})`);
    await p.close();
  }

  /* ── 06–09 · KHỐI NGỮ CẢNH + ICON (Hoà soi 22/08) ─────────────────────────────────────
     ⚠️ ẢNH 07 DÙNG DỮ LIỆU GIẢ LẬP CÓ KHAI BÁO: mọi dự án trên máy này đều SOLO (đo thật:
     3 dự án × 1 thành viên). Không có dữ liệu team thì không có gì để chụp — nhưng T KHÔNG
     ghi thành viên giả vào CSDL. Thay vào đó chặn ĐÚNG MỘT lời gọi mạng
     lời gọi lấy danh sách thành viên và trả về một payload nhiều người. Component, đường dữ liệu và
     cách vẽ đều là THẬT — chỉ payload là dựng. Ảnh 07 vì thế chứng minh đúng một điều:
     *cùng một component đó xử được trạng thái team*. Nó KHÔNG phải ảnh chụp trạng thái thật. */
  const NHOM = {
    myRole: 'owner', canManage: true, currentStage: 'concept', stageLocked: false,
    members: [
      { userId: 'u1', name: 'Trần Thái Hoà', role: 'owner' },
      { userId: 'u2', name: 'Nguyễn Minh Anh', role: 'editor' },
      { userId: 'u3', name: 'Lê Quốc Bảo', role: 'editor' },
      { userId: 'u4', name: 'Phạm Thu Hà', role: 'viewer' },
      { userId: 'u5', name: 'Đỗ Gia Khiêm', role: 'viewer' },
      { userId: 'u6', name: 'Vũ Hải Yến', role: 'viewer' },
    ],
  };

  const them = [
    ['06-sidebar-solo.png',  `/projects/${DU_AN}/cad`, 'dieuHuong', false],
    ['07-sidebar-team.png',  `/projects/${DU_AN}/cad`, 'dieuHuong', true],
    ['08-library-icon.png',  `/projects/${DU_AN}/cad`, 'dieuHuong', false],
    ['09-sidebar-full.png',  `/projects/${DU_AN}/cad`, 'duyet',     false],
  ];

  for (const [ten, duong, nac, gia] of them) {
    const p = await ctx.newPage();
    if (gia) {
      await p.route('**/api/projects/*/members', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(NHOM) }),
      );
    }
    await datNac(p, nac, null);
    await p.setViewportSize({ width: 1440, height: 900 });
    await p.goto(URL_GOC + duong, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await p.waitForTimeout(3500);
    await p.screenshot({ path: join(OUT, ten), timeout: 30000, animations: 'disabled' });
    console.log(`  ✓ ${ten}  ←  ${duong}  (rail=${nac}${gia ? ', members GIẢ LẬP' : ''})`);
    await p.close();
  }

  /* ── 10 · MỘT ẢNH ĐẠI DIỆN DUY NHẤT (hotfix 22/08) ────────────────────────────────────
     Chụp Tổng quan dự án — màn TRƯỚC ĐÂY đứng ngoài vỏ app nên có 0 ảnh đại diện toàn cục. */
  const p10 = await ctx.newPage();
  await datNac(p10, 'dieuHuong', null);
  await p10.setViewportSize({ width: 1440, height: 900 });
  await p10.goto(`${URL_GOC}/projects/${DU_AN}/overview`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await p10.waitForTimeout(3000);
  await p10.screenshot({ path: join(OUT, '10-project-overview-shell.png'), timeout: 30000, animations: 'disabled' });
  console.log('  ✓ 10-project-overview-shell.png');
  await p10.close();

  await ctx.close();
  console.log(`\n📂 Xong. Ảnh nằm ở: ${OUT}`);
}

main().catch((e) => {
  console.error(String(e?.stack || e));
  process.exit(1);
});
