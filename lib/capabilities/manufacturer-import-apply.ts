/**
 * lib/capabilities/manufacturer-import-apply.ts — **NỬA GHI** của đường NGUỒN HÃNG → IDFC.
 *
 * Tách khỏi `manufacturer-import.ts` vì file kia phải THUẦN để chạy được dưới `sucrase-node`
 * (cùng lối `external-ref.ts` ↔ `external-ref-core.ts`). Ở đây mới chạm Prisma.
 *
 * ══ 🔴 CỬA NGƯỜI DUYỆT — KHÔNG CÓ ĐƯỜNG GHI IM LẶNG ═════════════════════════════════════════
 * Hàm này CHỈ chạy khi có `QuyetDinhDuyet` do người bấm: **Nhận · Sửa · Giữ một phần · Huỷ**.
 * `huy` ⇒ 0 dòng ghi. Không có nhánh nào tự nhận. Route dựng phiếu (`POST /api/manufacturer-import`)
 * **không ghi gì cả** — hai cửa tách hẳn để không thể nhầm.
 *
 * ══ ĐƯỜNG GHI — DÙNG LẠI, KHÔNG ĐẺ CỬA THỨ HAI ══════════════════════════════════════════════
 *   ① `promoteProjectFile()` — tệp chính của gói vào Thư viện. Đây là **cửa ghi LibraryAsset duy
 *      nhất**; nó lo sẵn dedupe theo `contentHash`, idempotent, transaction, provenance tag.
 *   ② `ProductSpec` — bản ghi sản phẩm (brand·sku·vendor·w/d/hUp·materials). KHÔNG thêm cột:
 *      `boSuuTap`/`bienThe`/nguồn/giấy phép nằm trong `raw` (JSON gốc — đúng vai của nó, chốt ②).
 *   ③ `AssetRepresentation` — MỘT hàng cho MỖI cách thể hiện, `truthLevel` + `provenance` thật.
 *      ⛔ KHÔNG nhân bản `LibraryAsset` để chứa mặt bằng/khối 3D (luật ở `schema.prisma`).
 *   ④ `linkExternalRef` — neo danh tính hãng. Chỉ khi CÓ hãng + CÓ mã thật.
 *
 * ══ CHỐNG NHẬP TRÙNG — chỗ `ExternalRef` trả công ══════════════════════════════════════════
 * Cùng `(hãng, mã)` nhập lần hai ⇒ **dùng lại `ProductSpec` cũ**, không đẻ bản ghi thứ hai. Đó
 * là thứ `@@unique([system, externalId])` sinh ra để làm; nếu không có mã thì KHÔNG có khoá nào
 * để chống trùng, và ta **khai thẳng điều đó** thay vì bịa một khoá từ tên.
 */

import { prisma } from '../server/db';
import { promoteProjectFile } from '../server/promote';
import { findCoreEntity, linkExternalRef } from '../integrations/external-ref';
import {
  dungRepGoc,
  khoaDanhTinhHang,
  type PhieuUngVien,
  type RepGhi,
  type TepDaPhanLoai,
} from './manufacturer-import';

/** Bốn nút của cửa duyệt — không có nút thứ năm, và không có mặc định. */
export type HanhDongDuyet = 'nhan' | 'sua' | 'giu-mot-phan' | 'huy';

export interface QuyetDinhDuyet {
  hanhDong: HanhDongDuyet;
  /** `sua`: người duyệt gõ lại ô nào thì ô đó thắng phiếu máy dựng. */
  sua?: Partial<Pick<PhieuUngVien, 'hang' | 'ten' | 'ma' | 'boSuuTap' | 'bienThe' | 'kind' | 'vatLieu'>> & {
    w?: number;
    d?: number;
    hUp?: number;
  };
  /** `giu-mot-phan`: danh sách `projectFileId` ĐƯỢC GIỮ. Bỏ trống ⇒ giữ hết. */
  giuTep?: string[];
  note?: string;
}

export type KetQuaApDung =
  | {
      ok: true;
      daGhi: boolean;
      huy?: true;
      specId?: string;
      specDaCo?: boolean;
      assetId?: string;
      repIds?: string[];
      daNeoDanhTinh?: boolean;
      canhBao: string[];
    }
  | { ok: false; error: string; status: number };

export interface DauVaoApDung {
  phieu: PhieuUngVien;
  quyetDinh: QuyetDinhDuyet;
  userId: string;
  projectId: string;
}

function jsonMang(v: string[]): string {
  return v.length ? JSON.stringify(v) : '';
}

/**
 * Áp phiếu đã duyệt. Trả về những thứ ĐÃ GHI THẬT — không hứa hẹn.
 * ⚠️ KHÔNG kiểm quyền (cùng quy ước `promoteProjectFile`/`saveLibraryAssetFromBuffer`): route lo.
 */
export async function apDungPhieuDuyet(i: DauVaoApDung): Promise<KetQuaApDung> {
  const { phieu, quyetDinh, userId, projectId } = i;
  const canhBao: string[] = [];

  if (quyetDinh.hanhDong === 'huy') {
    return { ok: true, daGhi: false, huy: true, canhBao: ['Người duyệt bấm Huỷ — không ghi dòng nào.'] };
  }

  // ── Trộn phần người duyệt gõ lại. Người GÕ LẠI thì người thắng. ────────────────────────────
  const sua = quyetDinh.hanhDong === 'sua' ? (quyetDinh.sua ?? {}) : {};
  const hang = (sua.hang ?? phieu.hang) || null;
  const ten = (sua.ten ?? phieu.ten) || phieu.ten;
  const ma = (sua.ma ?? phieu.ma) || null;
  const kind = sua.kind ?? phieu.kind;
  const vatLieu = sua.vatLieu ?? phieu.vatLieu;
  const w = sua.w ?? phieu.kichThuoc?.w ?? null;
  const d = sua.d ?? phieu.kichThuoc?.d ?? null;
  const hUp = sua.hUp ?? phieu.kichThuoc?.hUp ?? null;

  // ── Giữ một phần: lọc cách thể hiện. ───────────────────────────────────────────────────────
  const giu = quyetDinh.hanhDong === 'giu-mot-phan' && quyetDinh.giuTep?.length ? new Set(quyetDinh.giuTep) : null;
  const tepGiu: TepDaPhanLoai[] = giu
    ? phieu.cachTheHien.filter((t) => giu.has(t.projectFileId))
    : phieu.cachTheHien;
  if (!tepGiu.length) return { ok: false, error: 'Không còn tệp nào được giữ — không có gì để đưa vào Thư viện.', status: 400 };
  if (giu && tepGiu.length < phieu.cachTheHien.length) {
    canhBao.push(`Giữ ${tepGiu.length}/${phieu.cachTheHien.length} cách thể hiện — phần bỏ KHÔNG bị xoá khỏi Files, chỉ không vào Thư viện.`);
  }

  // ── Tệp thật còn sống và ĐÚNG dự án? (id do client gửi — không tin, tra lại.) ───────────────
  const rows = await prisma.projectFile.findMany({
    where: { id: { in: tepGiu.map((t) => t.projectFileId) }, deletedAt: null },
    select: { id: true, projectId: true, name: true },
  });
  const hopLe = new Set(rows.filter((r) => r.projectId === projectId).map((r) => r.id));
  const thieu = tepGiu.filter((t) => !hopLe.has(t.projectFileId));
  if (thieu.length) {
    return {
      ok: false,
      error: `${thieu.length} tệp không thuộc dự án này hoặc đã bị xoá: ${thieu.map((t) => t.name).join(', ')}`,
      status: 400,
    };
  }

  // ── ① Danh tính hãng: đã nhập bao giờ chưa? ────────────────────────────────────────────────
  const khoa = hang && ma ? khoaDanhTinhHang(hang, ma) : null;
  if (!khoa) {
    canhBao.push(
      'Không neo được danh tính hãng (thiếu hãng hoặc mã thật) ⇒ KHÔNG có khoá chống nhập trùng cho vật này. Nhập lại gói tương tự sẽ sinh bản ghi thứ hai.',
    );
  }
  let specId: string | null = null;
  let specDaCo = false;
  if (khoa) {
    const cu = await findCoreEntity(khoa);
    if (cu && cu.entityType === 'productspec') {
      specId = cu.entityId;
      specDaCo = true;
      canhBao.push(`Mã "${khoa.externalId}" của hãng "${khoa.system}" đã có trong kho ⇒ dùng lại bản ghi cũ, không sinh bản thứ hai.`);
    }
  }

  // ── ② Tệp CHÍNH của gói → Thư viện, qua cửa promote sẵn có. ────────────────────────────────
  // Ưu tiên ảnh (thứ Thư viện hiển thị được), rồi tới tệp đầu — KHÔNG copy tệp, promote dùng lại
  // đúng file đã nằm trên đĩa.
  const tepChinh = tepGiu.find((t) => t.repKind === 'image') ?? tepGiu[0];
  const kq = await promoteProjectFile({
    projectFileId: tepChinh.projectFileId,
    userId,
    name: ten,
    category: kind,
    note: quyetDinh.note,
  });
  if (!kq.ok) return { ok: false, error: kq.error, status: kq.status };
  if (kq.dungLai) canhBao.push('Tệp chính trùng nội dung với một tài sản đã có ⇒ dùng lại tài sản đó, chỉ gắn thêm nguồn gốc.');

  // ── ③ ProductSpec + AssetRepresentation trong MỘT transaction. ─────────────────────────────
  const raw = JSON.stringify({
    nguon: { kieu: 'goi-tep', moTa: phieu.nguon.moTa, giayPhep: phieu.nguon.giayPhep, soTep: phieu.nguon.soTep },
    boSuuTap: sua.boSuuTap ?? phieu.boSuuTap,
    bienThe: sua.bienThe ?? phieu.bienThe,
    importedAt: new Date().toISOString(),
    importedBy: userId,
    xuatXu: phieu.xuatXu,
    canhBaoLucDuyet: phieu.canhBao,
    // Người duyệt GÕ LẠI ô nào thì ô đó ghi rõ — cửa duyệt 03: chỉ chiều gõ lại mới lên `verified`.
    nguoiGoLai: Object.keys(sua),
  });

  const repInputs: RepGhi[] = tepGiu.map((t) => dungRepGoc(t, { hang, goi: phieu.nguon.moTa }));

  const out = await prisma.$transaction(async (tx) => {
    let id = specId;
    if (id) {
      await tx.productSpec.update({
        where: { id },
        data: { name: ten, brand: hang, sku: ma, imageAssetId: kq.assetId, raw, syncedAt: new Date() },
      });
    } else {
      const spec = await tx.productSpec.create({
        data: {
          kind,
          name: ten,
          brand: hang,
          // ⛔ KHÔNG bịa SKU: không có mã thật thì cột này để NULL, không gán tên/hash thay thế.
          sku: ma,
          vendor: hang,
          w: w ?? null,
          d: d ?? null,
          hUp: hUp ?? null,
          materials: jsonMang(vatLieu),
          imageAssetId: kq.assetId,
          scope: 'studio',
          ownerId: userId,
          raw,
          note: quyetDinh.note ?? null,
        },
        select: { id: true },
      });
      id = spec.id;
    }

    // Idempotent theo (assetId, kind, payloadRef): nhập lại cùng gói không đẻ hàng thể hiện thứ hai.
    const daCo = await tx.assetRepresentation.findMany({
      where: { assetId: kq.assetId, deletedAt: null },
      select: { id: true, kind: true, payloadRef: true },
    });
    const cu = new Set(daCo.map((r) => `${r.kind}|${r.payloadRef}`));
    const repIds: string[] = daCo.filter((r) => repInputs.some((x) => x.kind === r.kind && x.payloadRef === r.payloadRef)).map((r) => r.id);
    for (const rep of repInputs) {
      if (cu.has(`${rep.kind}|${rep.payloadRef}`)) continue;
      const row = await tx.assetRepresentation.create({
        data: {
          assetId: kq.assetId,
          kind: rep.kind,
          payloadRef: rep.payloadRef,
          truthLevel: rep.truthLevel,
          provenance: rep.provenance,
          createdBy: userId,
        },
        select: { id: true },
      });
      repIds.push(row.id);
    }
    return { specId: id as string, repIds };
  });

  // ── ④ Neo danh tính hãng. Sau cùng: chỉ neo thứ ĐÃ ghi thật. ───────────────────────────────
  let daNeo = false;
  if (khoa) {
    await linkExternalRef(khoa, { entityType: 'productspec', entityId: out.specId });
    daNeo = true;
  }

  return {
    ok: true,
    daGhi: true,
    specId: out.specId,
    specDaCo,
    assetId: kq.assetId,
    repIds: out.repIds,
    daNeoDanhTinh: daNeo,
    canhBao,
  };
}
