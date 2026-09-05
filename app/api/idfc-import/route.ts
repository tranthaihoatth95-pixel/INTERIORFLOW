import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { saveLibraryAssetFromBuffer } from '@/lib/server/library-save';
import { nhanDienCauKien } from '@/lib/idfc-import/nhan-dien-cau-kien';
import { REPRESENTATION_DB_KIND } from '@/lib/idfc-import/asset-family';
import { docDauVao, THIEU_KHOA_MANG, type NhanhChay } from './_lib/doc-dau-vao';

export const dynamic = 'force-dynamic';

/**
 * POST /api/idfc-import — CỬA NHẬN DIỆN CẤU KIỆN. Đây là **mặt tiền đầu tiên** của dây chuyền
 * `lib/idfc-import/` (bốn module engine, 64 test, proof ghế Lincoln 327 14/08) — trước lượt này
 * `grep importFromPhoto` toàn repo trả về **0 nơi gọi ngoài test**: engine chạy được mà không
 * người dùng nào chạm tới. Báo cáo GI 14/08 §8 tự khai *"Chưa có mặt tiền UI … phiếu sau"* ⇒
 * mặt tiền CHƯA BAO GIỜ tồn tại, không phải bị gỡ.
 *
 * ── HAI NHÁNH, MỘT LÕI (một cỗ máy nhiều mặt tiền [T2]) ────────────────────────────────────────
 *  · `nhanh: 'khoi'` — người đưa **tệp .glb** sẵn có. THUẦN, TẤT ĐỊNH, **0 credit, 0 gọi mạng**.
 *  · `nhanh: 'anh'`  — người đưa **ảnh**; máy gọi vision (NVIDIA) + fal TRELLIS sinh mesh rồi
 *    chạy tiếp đúng lõi trên. **TỐN CREDIT**, và cần `NVIDIA_API_KEY` + `FAL_KEY`.
 * Thiếu khoá ⇒ **503 kèm lý do đọc được**, KHÔNG im lặng, KHÔNG giả vờ chạy được. Đúng luật
 * "không làm nút giả": mặt tiền hiện nhánh đó ở trạng thái mờ + nêu thẳng thiếu gì.
 *
 * ── GHI GÌ, GHI ĐÂU ────────────────────────────────────────────────────────────────────────────
 *  ① ẢNH của món → `saveLibraryAssetFromBuffer` (cửa ghi Thư viện DUY NHẤT, chỉ nhận ảnh raster)
 *    ⇒ một `LibraryAsset` = **DANH TÍNH** của món.
 *  ② `.idfc` · `.obj` · `.mtl` · texture → tệp cạnh nhau trong `uploads/`, KHÔNG vào cột DB.
 *  ③ Mỗi tệp dẫn xuất → một hàng `AssetRepresentation` (schema.prisma:347 — *"MỘT món đồ, NHIỀU
 *    cách thể hiện"*, dựng đúng cho ca này: *"trước bảng này, khối 3D dựng từ ảnh không có chỗ
 *    lưu ⇒ mất khi đóng phiên"*). **KHÔNG nhân bản LibraryAsset** để chứa khối 3D.
 * ⇒ 0 cột DB mới, 0 migration (schema cảnh báo rõ: `node_modules` dùng chung symlink, thêm cột
 * rồi regenerate là làm gãy phiên khác).
 *
 * `truthLevel` luôn `inferred` khi máy sinh — lên `verified` CHỈ qua `PATCH /api/asset-representation/[id]`
 * (cửa duyệt 03: máy không tự nâng cấp sự thật của chính nó).
 */

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

function loiJson(e: unknown) {
  console.error('[idfc-import] lỗi không lường trước:', e);
  const detail = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  return NextResponse.json(
    { error: 'Lỗi máy chủ khi nhận diện cấu kiện.', ...(process.env.NODE_ENV === 'production' ? {} : { detail }) },
    { status: 500 },
  );
}

/** Khoá nào còn thiếu cho nhánh mạng — dùng chung cho GET (báo trạng thái) và POST (chặn). */
function khoaThieu(): string[] {
  const thieu: string[] = [];
  if (!process.env.NVIDIA_API_KEY) thieu.push('NVIDIA_API_KEY');
  if (!process.env.FAL_KEY) thieu.push('FAL_KEY');
  return thieu;
}

/**
 * GET — mặt tiền hỏi TRƯỚC khi vẽ nút: nhánh nào đang chạy được. Nhờ vậy nút "từ ảnh" hiện MỜ
 * KÈM LÝ DO thay vì bấm vào mới báo lỗi (luật: không làm nút giả).
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const thieu = khoaThieu();
  return NextResponse.json({
    nhanh: {
      khoi: { chay: true, credit: 0, moTa: 'Máy đọc tệp khối 3D — không gọi dịch vụ ngoài.' },
      anh: {
        chay: thieu.length === 0,
        credit: 6,
        lyDo: thieu.length ? THIEU_KHOA_MANG(thieu) : undefined,
        moTa: 'Máy nhìn ảnh rồi dựng khối — gọi dịch vụ ngoài, tốn lượt.',
      },
    },
  });
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const kiem = docDauVao(await req.json().catch(() => null));
    if (!kiem.ok) return NextResponse.json({ error: kiem.error }, { status: 400 });
    const v = kiem.dauVao;

    if (typeof (prisma as { assetRepresentation?: unknown }).assetRepresentation === 'undefined')
      return NextResponse.json(
        { error: 'Prisma Client thiếu model AssetRepresentation — khởi động lại dev server.' },
        { status: 503 },
      );

    // ── lấy MESH ────────────────────────────────────────────────────────────────────────────────
    let glb: Uint8Array;
    let nguonMesh: string;
    let creditDaTieu = 0;
    let phanLoai = v.phanLoai;

    if (v.nhanh === ('anh' satisfies NhanhChay)) {
      const thieu = khoaThieu();
      if (thieu.length)
        return NextResponse.json({ error: THIEU_KHOA_MANG(thieu), thieuKhoa: thieu }, { status: 503 });
      // Nạp ĐỘNG: bộ này đụng khoá mạng, đường 0-credit không được kéo nó vào.
      // ⭐ GỌI ĐÚNG BỘ ĐIỀU PHỐI ĐÃ CÓ (`importFromPhoto`, 26 test) thay vì tự xâu lại
      // `classifyPhoto` + `generateMesh` trong route — xâu lại là chép một trình tự đã được kiểm
      // sang chỗ không ai kiểm. Nó trả về cả bản ghi thô; ở đây ta dùng phần **phân loại + mesh**,
      // rồi cho mesh đi tiếp qua bước chuẩn nét. Bản ghi thô của nó KHÔNG được ghi ra đĩa: món chỉ
      // có MỘT `.idfc`, và bản ship là bản đã qua chuẩn nét (số tam giác thật, không phải số thô).
      const { importFromPhoto } = await import('@/lib/idfc-import/from-photo');
      const goc = await importFromPhoto({
        imageDataUri: v.anhDataUri,
        sourceImageUrl: v.spec.sourceUrl,
        spec: v.spec,
        group: v.group,
      });
      phanLoai = goc.classification;
      creditDaTieu = 6;
      nguonMesh = `fal:${goc.mesh.falModel}${goc.mesh.requestId ? `#${goc.mesh.requestId}` : ''}`;
      const tai = await fetch(goc.mesh.glbUrl);
      if (!tai.ok) return NextResponse.json({ error: `Không tải được mesh đã sinh (${tai.status}).` }, { status: 502 });
      glb = new Uint8Array(await tai.arrayBuffer());
    } else {
      glb = Uint8Array.from(Buffer.from(v.glbBase64, 'base64'));
      nguonMesh = `tệp người dùng đưa: ${v.tenTepKhoi}`;
    }

    // ── LÕI TẤT ĐỊNH: chuẩn nét → diện → cấu kiện → .idfc ──────────────────────────────────────
    let kq;
    try {
      kq = nhanDienCauKien({
        glb,
        spec: v.spec,
        phanLoai,
        mesh: { glbUrl: nguonMesh, falModel: '-', nguon: nguonMesh },
        sourceImageUrl: v.spec.sourceUrl,
        group: v.group,
      });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : 'Không đọc được khối 3D.' }, { status: 422 });
    }

    // ── ① DANH TÍNH: ảnh vào Thư viện ───────────────────────────────────────────────────────────
    const anhBuf = Buffer.from(v.anhDataUri.split(',')[1] ?? '', 'base64');
    const luu = await saveLibraryAssetFromBuffer({
      userId: user.id,
      name: v.spec.name,
      category: 'Cấu kiện',
      tags: ['co3d', `nguon:${v.nhanh}`, ...(v.spec.brand ? [`hang:${v.spec.brand}`] : [])].join(','),
      buf: anhBuf,
      usage: 'furniture',
      caption: phanLoai.caption,
    });
    if (!luu.ok) return NextResponse.json({ error: luu.error }, { status: luu.status });

    // ── ② tệp dẫn xuất cạnh nhau, tên tương đối để MTL trỏ được sang texture ───────────────────
    await mkdir(UPLOAD_DIR, { recursive: true });
    const nen = `idfc-${luu.id}`;
    const ghi = async (ten: string, noiDung: string | Uint8Array) => {
      await writeFile(path.join(UPLOAD_DIR, `${nen}-${ten}`), noiDung);
      return ten;
    };
    const tenObj = await ghi('mon.obj', kq.chuanNet.obj);
    await ghi('mon.mtl', kq.chuanNet.mtl);
    if (kq.chuanNet.texture) await ghi('mon-basecolor.png', kq.chuanNet.texture.bytes);
    const tenIdfc = await ghi('mon.idfc', kq.idfcJson);
    const tenCauKien = await ghi(
      'cau-kien.json',
      JSON.stringify({ parts: kq.partLock.parts, lienKet: kq.partLock.lienKet, ghiChu: kq.partLock.ghiChu }, null, 1),
    );

    // ── ③ BIỂU DIỄN: mỗi tệp một hàng, cùng MỘT danh tính ───────────────────────────────────────
    const hang = [
      { kind: REPRESENTATION_DB_KIND.model3d, ten: tenObj, ghiChu: 'hình học chuẩn-nét (.obj + .mtl)' },
      { kind: REPRESENTATION_DB_KIND.spec, ten: tenIdfc, ghiChu: 'bản ghi .idfc — tham số + cờ 3 nấc' },
      { kind: REPRESENTATION_DB_KIND.lod, ten: tenCauKien, ghiChu: 'cây cấu kiện đặt tên nghề' },
    ];
    const bieuDien: { id: string; kind: string; payloadRef: string }[] = [];
    for (const h of hang) {
      const row = await prisma.assetRepresentation.create({
        data: {
          assetId: luu.id,
          kind: h.kind,
          payloadRef: `${nen}-${h.ten}`,
          truthLevel: 'inferred',
          provenance: JSON.stringify({
            pipeline: 'nhanDienCauKien',
            nhanh: v.nhanh,
            nguonMesh,
            ghiChu: h.ghiChu,
            soLieu: kq.soLieu,
          }),
          createdBy: user.id,
        },
        select: { id: true, kind: true, payloadRef: true },
      });
      bieuDien.push(row);
    }

    // Gắn con trỏ 3D vào chính hàng asset: tấm Thư viện đọc tag này để biết món CÓ khối xem được.
    // Trước lượt này việc đó do một bảng TÊN gõ cứng lo (`lib/library/object-3d-models.ts` tự khai
    // *"nhận diện bằng TÊN món là bản tạm cho đúng MỘT proof"*) ⇒ món thứ hai không bao giờ hiện.
    await prisma.libraryAsset.update({
      where: { id: luu.id },
      data: { tags: `co3d,mo3d:${bieuDien[0].id},nguon:${v.nhanh}${v.spec.brand ? `,hang:${v.spec.brand}` : ''}` },
    });

    const xf = (JSON.parse(kq.idfcJson) as { xFromPhoto?: Record<string, unknown> }).xFromPhoto ?? {};
    return NextResponse.json({
      assetId: luu.id,
      anhUrl: luu.url,
      bieuDien,
      objUrl: `/api/idfc-import/tep/${bieuDien[0].id}/mon.obj`,
      mtlUrl: `/api/idfc-import/tep/${bieuDien[0].id}/mon.mtl`,
      soLieu: kq.soLieu,
      cauKien: kq.partLock.parts.map((p) => ({ id: p.id, ten: p.tenNghe, matHex: p.matHex, provenance: p.provenance })),
      ghiChu: kq.ghiChu,
      coCua: xf,
      creditDaTieu,
    });
  } catch (e) {
    return loiJson(e);
  }
}
