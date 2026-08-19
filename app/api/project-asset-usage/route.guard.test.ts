/**
 * app/api/project-asset-usage/route.guard.test.ts — gọi THẲNG handler thật (GET/POST/DELETE)
 * với session giả lập, khoá hai thứ:
 *   ① BẤT BIẾN: handler KHÔNG BAO GIỜ ném lỗi ra ngoài — luôn trả Response có body JSON.
 *   ② PHÂN LOẠI LỖI: 401 chưa/hết phiên · 403 thiếu quyền · 404 không tồn tại · 500 CÓ body.
 *
 * VÌ SAO CÓ (ca thật 20/08, báo cáo docs/bao-cao-phien/2026-08-20-FIX500-project-asset-usage.md):
 * bản đầu dùng `errResponse()` với `throw e` cho mọi lỗi non-AccessError, và `getSessionUser()`
 * nằm NGOÀI try → trên browser thật `GET ?assetId=` trả **500 body RỖNG, không log gì**.
 * `route.test.ts` 10/10 PASS mà không bắt được, vì nó mô phỏng logic Prisma chứ KHÔNG gọi handler.
 * ⇒ Test này là loại test còn thiếu: chạy ĐÚNG đường đi của route.
 *
 * Chạy: node_modules/.bin/sucrase-node app/api/project-asset-usage/route.guard.test.ts
 */
import assert from 'node:assert';
import path from 'node:path';

/* ══════════════ Giàn giáo nạp module ══════════════
 * sucrase-node không hiểu alias `@/…` (route.ts import `@/lib/server/db`), và `jose`/
 * `next/headers` không dùng được ngoài request-scope của Next. Vá tại chỗ — KHÔNG đụng hạ
 * tầng chung, KHÔNG thêm gói. Chỉ ba định danh này bị đổi hướng, mọi đường khác giữ nguyên. */
const Module = require('node:module');
const REPO = path.resolve(__dirname, '../../..');
const resolveGoc = Module._resolveFilename;
Module._resolveFilename = function (yeuCau: string, ...rest: unknown[]) {
  return resolveGoc.call(this, yeuCau.startsWith('@/') ? path.join(REPO, yeuCau.slice(2)) : yeuCau, ...rest);
};

/** Phiên giả — điều khiển được từ test. `null` = KHÔNG có cookie (khách vãng lai). */
let cookiePhien: string | null = null;
/** `jwtVerify` giả trả sub này. `null` = token hỏng/hết hạn (ném, như jose thật). */
let subCuaToken: string | null = null;

const loadGoc = Module._load;
Module._load = function (yeuCau: string, ...rest: unknown[]) {
  if (yeuCau === 'jose')
    return {
      SignJWT: class {},
      jwtVerify: async () => {
        if (!subCuaToken) throw Object.assign(new Error('token hỏng'), { code: 'ERR_JWT_INVALID' });
        return { payload: { sub: subCuaToken } };
      },
    };
  if (yeuCau === 'next/headers')
    return {
      cookies: () => ({
        get: (ten: string) => (cookiePhien ? { name: ten, value: cookiePhien } : undefined),
        set: () => {},
        delete: () => {},
      }),
    };
  return loadGoc.call(this, yeuCau, ...rest);
};

const { GET, POST } = require('./route') as typeof import('./route');
const { DELETE } = require('./[id]/route') as typeof import('./[id]/route');
const { prisma } = require('../../../lib/server/db') as typeof import('../../../lib/server/db');

let pass = 0;
function ok(label: string) {
  pass += 1;
  console.log(`  ✓ ${label}`);
}

const BASE = 'http://localhost/api/project-asset-usage';

/** Đăng nhập giả bằng userId thật trong DB. `null` = đăng xuất. */
function dangNhap(userId: string | null) {
  cookiePhien = userId ? 'token-gia' : null;
  subCuaToken = userId;
}

/**
 * Gọi handler và KHẲNG ĐỊNH nó trả Response chứ không ném, body không rỗng và là JSON.
 * Đây là bất biến ①: mọi nhánh, mọi input, không ngoại lệ.
 */
async function goi(nhan: string, chay: () => Promise<Response>) {
  let res: Response;
  try {
    res = await chay();
  } catch (e) {
    assert.fail(`${nhan}: handler NÉM lỗi ra ngoài (${e}) — đây chính là bug 500-body-rỗng`);
  }
  assert.ok(res instanceof Response, `${nhan}: phải trả Response`);
  const text = await res.text();
  assert.notEqual(text.trim(), '', `${nhan}: body KHÔNG được rỗng (status ${res.status})`);
  const json = JSON.parse(text); // không phải JSON → ném ở đây → test đỏ, đúng ý
  return { status: res.status, json } as { status: number; json: any };
}

const getUrl = (qs: string) => goi(`GET ?${qs}`, () => GET(new Request(`${BASE}?${qs}`)));

async function withFixture<T>(
  fn: (ctx: { userId: string; nguoiNgoai: string; projectId: string; assetId: string }) => Promise<T>,
): Promise<T> {
  const rnd = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const user = await prisma.user.create({
    data: { email: `guard-${rnd()}@test.local`, name: 'Guard', passwordHash: 'x' },
  });
  // Người NGOÀI dự án — dùng để chứng minh where-used không rò rỉ project của người khác.
  const nguoiNgoai = await prisma.user.create({
    data: { email: `guard-out-${rnd()}@test.local`, name: 'Guard ngoài', passwordHash: 'x' },
  });
  const project = await prisma.project.create({ data: { userId: user.id, name: 'Dự án guard' } });
  await prisma.projectMember.create({
    data: { projectId: project.id, userId: user.id, role: 'owner' },
  });
  const asset = await prisma.libraryAsset.create({
    data: {
      userId: user.id,
      name: 'asset guard',
      category: 'material',
      mime: 'image/png',
      path: '/tmp/guard.png',
    },
  });
  try {
    return await fn({ userId: user.id, nguoiNgoai: nguoiNgoai.id, projectId: project.id, assetId: asset.id });
  } finally {
    dangNhap(null);
    await prisma.projectAssetUsage.deleteMany({ where: { projectId: project.id } });
    await prisma.projectMember.deleteMany({ where: { projectId: project.id } });
    await prisma.libraryAsset.delete({ where: { id: asset.id } }).catch(() => {});
    await prisma.project.delete({ where: { id: project.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: nguoiNgoai.id } }).catch(() => {});
  }
}

async function main() {
  console.log('project-asset-usage — canh bất biến "không ném" + phân loại lỗi');
  const truoc = await prisma.projectAssetUsage.count();

  /* ══════════ ① CHƯA ĐĂNG NHẬP → 401, KHÔNG phải 500 ══════════ */
  dangNhap(null);
  for (const qs of ['assetId=abc', 'projectId=abc', '']) {
    const r = await getUrl(qs || 'x=1');
    assert.equal(r.status, 401, `khách vãng lai ?${qs} phải 401`);
    assert.equal(r.json.error, 'unauthorized');
  }
  ok('Chưa đăng nhập → 401 + body JSON ở mọi nhánh GET (không 500, không body rỗng)');

  /* ══════════ ② PHIÊN CHẾT (user trong cookie không còn trong DB) → 401 ══════════
     Ca này Hoà chỉ đích danh: test tích hợp tạo/xoá user tạm, cookie có thể trỏ user đã mất.
     Đúng cách xử là 401 (bắt đăng nhập lại) — TUYỆT ĐỐI không nới auth cho qua. */
  dangNhap('user-khong-ton-tai-trong-db');
  const chet = await getUrl('assetId=abc');
  assert.equal(chet.status, 401, 'user đã bị xoá → 401');
  ok('Phiên chết (user không còn trong DB) → 401, không rò thành 500');

  /* ══════════ ③ TOKEN HỎNG/HẾT HẠN → 401 ══════════ */
  cookiePhien = 'token-hong';
  subCuaToken = null; // jwtVerify giả sẽ ném, như jose thật
  const hong = await getUrl('assetId=abc');
  assert.equal(hong.status, 401, 'token hỏng → 401');
  ok('Token hỏng/hết hạn → 401');

  /* ══════════ ④ ĐĂNG NHẬP THẬT — các nhánh nghiệp vụ ══════════ */
  await withFixture(async ({ userId, nguoiNgoai, projectId, assetId }) => {
    dangNhap(userId);

    /* 400 — thiếu param / thừa param. */
    assert.equal((await getUrl('x=1')).status, 400);
    assert.equal((await getUrl('projectId=a&assetId=b')).status, 400);
    ok('Thiếu param / truyền cả hai → 400 + body JSON');

    /* 404 — project không tồn tại (AccessError giữ status của nó, không bị đè thành 500). */
    const khongCo = await getUrl('projectId=khong-ton-tai');
    assert.equal(khongCo.status, 404, 'project không tồn tại → 404');
    assert.ok(typeof khongCo.json.error === 'string');
    ok('projectId không tồn tại → 404 (AccessError giữ nguyên status)');

    /* where-used với assetId HỢP LỆ nhưng CHƯA ai dùng → 200 + mảng RỖNG.
       CHỐT NHẤT QUÁN: where-used là truy vấn DANH SÁCH, không phải tra một thực thể ⇒
       không tồn tại/không ai dùng đều là "danh sách rỗng", KHÔNG 404 (404 ở đây còn làm
       lộ việc assetId nào có thật). Test này KHOÁ lựa chọn đó. */
    const rong = await getUrl(`assetId=${assetId}`);
    assert.equal(rong.status, 200);
    assert.deepEqual(rong.json.usages, []);
    ok('where-used, asset chưa ai dùng → 200 + mảng rỗng (KHÔNG 404) — nhất quán, đã khoá');

    const bia = await getUrl('assetId=assetId-hoan-toan-bia');
    assert.equal(bia.status, 200);
    assert.deepEqual(bia.json.usages, []);
    ok('where-used, assetId không tồn tại → 200 + mảng rỗng (cùng một quy ước)');

    /* POST gắn asset vào project → where-used thấy đúng 1 project. */
    const gan = await goi('POST gắn usage', () =>
      POST(
        new Request(BASE, {
          method: 'POST',
          body: JSON.stringify({ projectId, assetId, usage: 'material' }),
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );
    assert.equal(gan.status, 200);
    const usageId: string = gan.json.usage.id;

    const thay = await getUrl(`assetId=${assetId}`);
    assert.equal(thay.status, 200);
    assert.equal(thay.json.usages.length, 1, 'where-used phải thấy đúng 1 project');
    assert.equal(thay.json.usages[0].project.id, projectId);
    ok('where-used với cookie hợp lệ → 200 + mảng có đúng project đang dùng');

    /* GET ?projectId= của chính mình → 200 + list. */
    const cuaDuAn = await getUrl(`projectId=${projectId}`);
    assert.equal(cuaDuAn.status, 200);
    assert.equal(cuaDuAn.json.usages.length, 1);
    ok('GET ?projectId= (là member) → 200 + list usage sống');

    /* KHÔNG RÒ RỈ: người ngoài dự án hỏi where-used cùng asset → mảng rỗng. */
    dangNhap(nguoiNgoai);
    const ngoai = await getUrl(`assetId=${assetId}`);
    assert.equal(ngoai.status, 200);
    assert.deepEqual(ngoai.json.usages, [], 'người ngoài không được thấy project của người khác');
    ok('Người ngoài dự án → where-used trả rỗng (lọc theo membership, không rò rỉ)');

    /* Người ngoài mở thẳng project → 404 (không tiết lộ project có tồn tại). */
    const ngoaiProject = await getUrl(`projectId=${projectId}`);
    assert.equal(ngoaiProject.status, 404);
    ok('Người ngoài mở ?projectId= của người khác → 404, không lộ sự tồn tại');

    /* DELETE soft-delete rồi where-used phải KHÔNG còn thấy. */
    dangNhap(userId);
    const xoa = await goi('DELETE usage', () =>
      DELETE(new Request(`${BASE}/${usageId}`, { method: 'DELETE' }), { params: { id: usageId } }),
    );
    assert.equal(xoa.status, 200);
    assert.equal(xoa.json.ok, true);

    const sauXoa = await getUrl(`assetId=${assetId}`);
    assert.equal(sauXoa.status, 200);
    assert.deepEqual(sauXoa.json.usages, [], 'usage đã xoá mềm KHÔNG được xuất hiện');
    ok('Usage đã soft-delete → biến mất khỏi where-used (deletedAt: null lọc đúng)');

    /* DELETE id không tồn tại → 404, không 500. */
    const xoaBia = await goi('DELETE id bịa', () =>
      DELETE(new Request(`${BASE}/bia`, { method: 'DELETE' }), { params: { id: 'bia' } }),
    );
    assert.equal(xoaBia.status, 404);
    ok('DELETE id không tồn tại → 404 + body JSON');

    /* POST body JSON hỏng / thiếu trường → 400, không 500 câm. */
    const bodyHong = await goi('POST body hỏng', () =>
      POST(new Request(BASE, { method: 'POST', body: '{khong-phai-json', headers: { 'content-type': 'application/json' } })),
    );
    assert.equal(bodyHong.status, 400);
    const thieuTruong = await goi('POST thiếu trường', () =>
      POST(new Request(BASE, { method: 'POST', body: '{}', headers: { 'content-type': 'application/json' } })),
    );
    assert.equal(thieuTruong.status, 400);
    ok('POST body hỏng / thiếu trường → 400 + body JSON (không ném, không 500)');

    /* POST asset không tồn tại → 404. */
    const assetBia = await goi('POST asset bịa', () =>
      POST(
        new Request(BASE, {
          method: 'POST',
          body: JSON.stringify({ projectId, assetId: 'khong-ton-tai', usage: 'material' }),
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );
    assert.equal(assetBia.status, 404);
    ok('POST assetId không tồn tại → 404');
  });

  /* ══════════ ⑤ CA THẬT ĐÃ GÂY 500-BODY-RỖNG: Prisma Client THIẾU delegate ══════════
     Tái hiện chính xác trạng thái server 3001 (tiến trình khởi động trước `prisma generate`
     nên `prisma.projectAssetUsage === undefined`). Trước khi sửa: TypeError thoát ra ngoài →
     Next trả 500 body rỗng, không log. Sau khi sửa: 503 CÓ body nói rõ phải khởi động lại. */
  await withFixture(async ({ userId, projectId, assetId }) => {
    dangNhap(userId);
    // PrismaClient khai delegate là thuộc tính RIÊNG của instance ⇒ `delete` xoá vĩnh viễn
    // (không có prototype để tra ngược). Vì vậy: giữ lại giá trị thật, che bằng `undefined`,
    // rồi ĐẶT LẠI đúng giá trị cũ ở finally — không dùng `delete` để khôi phục.
    const delegateThat = (prisma as any).projectAssetUsage;
    Object.defineProperty(prisma, 'projectAssetUsage', { value: undefined, configurable: true, writable: true });
    assert.equal(typeof (prisma as any).projectAssetUsage, 'undefined', 'giả lập phải thật sự che được delegate');
    assert.equal(typeof (prisma as any).projectAssetUsage, 'undefined', 'giả lập phải thật sự che được delegate');
    try {
      for (const [nhan, goiHam] of [
        [`GET ?assetId=`, () => GET(new Request(`${BASE}?assetId=${assetId}`))],
        [`GET ?projectId=`, () => GET(new Request(`${BASE}?projectId=${projectId}`))],
        [
          'POST',
          () =>
            POST(
              new Request(BASE, {
                method: 'POST',
                body: JSON.stringify({ projectId, assetId, usage: 'material' }),
                headers: { 'content-type': 'application/json' },
              }),
            ),
        ],
        ['DELETE', () => DELETE(new Request(`${BASE}/x`, { method: 'DELETE' }), { params: { id: 'x' } })],
      ] as [string, () => Promise<Response>][]) {
        const r = await goi(`thiếu delegate — ${nhan}`, goiHam);
        assert.equal(r.status, 503, `${nhan}: phải 503, không phải 500 câm`);
        assert.ok(
          /ProjectAssetUsage/.test(r.json.error) && /KHỞI ĐỘNG LẠI/.test(r.json.error),
          `${nhan}: thông điệp phải nói rõ cách chữa, nhận: ${r.json.error}`,
        );
      }
      ok('Prisma Client thiếu delegate (ca thật 20/08) → 503 CÓ body chỉ rõ cách chữa, KHÔNG ném');
    } finally {
      Object.defineProperty(prisma, 'projectAssetUsage', {
        value: delegateThat,
        configurable: true,
        writable: true,
        enumerable: true,
      });
      assert.notEqual(typeof (prisma as any).projectAssetUsage, 'undefined', 'phải khôi phục được delegate');
    }
  });

  /* ══════════ ⑥ BẤT BIẾN NGUỒN — khoá lại hình dạng của bug cũ bằng máy ══════════ */
  const fs = require('node:fs') as typeof import('node:fs');
  for (const f of ['app/api/project-asset-usage/route.ts', 'app/api/project-asset-usage/[id]/route.ts']) {
    const src = fs.readFileSync(f, 'utf8');
    assert.ok(
      !/^\s*throw e;?\s*$/m.test(src),
      `${f}: còn \`throw e\` — lỗi sẽ lại thoát ra thành 500 body rỗng`,
    );
  }
  ok('Nguồn sạch: không còn `throw e` ném lỗi ra ngoài handler ở cả 2 route file');

  const sau = await prisma.projectAssetUsage.count();
  assert.equal(truoc, sau, 'dev.db phải sạch sau test');
  ok(`dev.db sạch: ${truoc} hàng trước === ${sau} hàng sau`);

  console.log(`\n${pass} assertions PASS`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('FAIL', e);
    process.exit(1);
  });
