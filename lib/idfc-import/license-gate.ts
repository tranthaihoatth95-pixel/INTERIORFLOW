/**
 * lib/idfc-import/license-gate.ts — CỬA PHÁP LÝ của mọi đường nhập tài sản (Slice 8, 09/2026).
 *
 * VÌ SAO CÓ TỆP NÀY: bài học GPL/libredwg (docs/LICENSE-NOTES.md §7) — miễn trừ "tool nội bộ"
 * CHẾT với định vị sản phẩm bán ra. Tài sản 3D/texture nhập vào kho cũng vậy: model hãng, model
 * marketplace, model "free" trên mạng — mỗi thứ một điều khoản, và một khi đã đóng vào bộ cài hay
 * kho chung thì không rút lại được. ⇒ Quyết định pháp lý phải là MỘT HÀM THUẦN, chạy TRƯỚC khi
 * byte nào được ghi, có test, có lý do từng dòng.
 *
 * BỐN BẬC (tier) — mỗi bậc một chính sách lưu hình học:
 *   `redistributable` — được đóng vào kho chung/bộ cài: chỉ khi giấy phép ĐÃ XÁC MINH THEO TỪNG
 *                        asset (có người ký + URL bằng chứng) và loại giấy phép cho phép, HOẶC
 *                        hãng cho phép TƯỜNG MINH (kèm bằng chứng), HOẶC fixture tự dựng của IF.
 *   `user-import`      — người dùng tự tải lên tài sản của họ: dùng trong phạm vi user/dự án của
 *                        họ (LibraryAsset mang userId), IF KHÔNG phân phối lại.
 *   `reference-only`   — model hãng/ứng viên chưa xác minh: chỉ giữ METADATA + THUMB + CON TRỎ
 *                        về nguồn; hình học nặng tải theo yêu cầu, cache có trần, KHÔNG đóng gói.
 *   `blocked`          — điều khoản CẤM tái đóng gói (marketplace) hoặc cấm dùng: không lưu byte
 *                        nào ngoài con trỏ + lý do — vẫn HIỆN, không biến mất (luật "open/invalid
 *                        remains visible").
 *
 * LUẬT CỨNG (không có tham số tắt):
 *  ① `termsForbidRebundle === true` ⇒ blocked, bất kể giấy phép khai là gì.
 *  ② Không bao giờ "đoán" giấy phép: `unknown` ⇒ reference-only. Xác minh là việc của người
 *     (verifiedBy + evidenceUrl), máy chỉ đọc kết quả.
 *  ③ Giấy phép NC (phi thương mại) KHÔNG được vào kho phân phối của sản phẩm bán ra ⇒ reference-only.
 *  ④ Share-alike (SA) được phép nhưng cờ `shareAlike` phải theo asset ra tới derivative — caller
 *     xuất file phải đọc cờ này (không xử lý ở đây, chỉ khai).
 *
 * THUẦN — không DOM/FS/network. Test: license-gate.test.ts.
 */

/** Nguồn tài sản — bốn cửa vào đang có/đang mở. Không đẻ loại thứ năm khi chưa có nơi tiêu thụ. */
export type AssetSourceKind = 'user-upload' | 'manufacturer-reference' | 'open-candidate' | 'if-seed';

export const ASSET_SOURCE_KINDS: readonly AssetSourceKind[] = ['user-upload', 'manufacturer-reference', 'open-candidate', 'if-seed'];

/** SPDX id cho các giấy phép app biết cách xử; `proprietary` = hãng/tác giả giữ mọi quyền; `unknown` = chưa ai xác minh. */
export type LicenseId =
  | 'CC0-1.0'
  | 'CC-BY-4.0'
  | 'CC-BY-SA-4.0'
  | 'CC-BY-NC-4.0'
  | 'CC-BY-NC-SA-4.0'
  | 'MIT'
  | 'Apache-2.0'
  | 'proprietary'
  | 'unknown';

export const LICENSE_IDS: readonly LicenseId[] = [
  'CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'CC-BY-NC-4.0', 'CC-BY-NC-SA-4.0', 'MIT', 'Apache-2.0', 'proprietary', 'unknown',
];

/** Giấy phép cho phép PHÂN PHỐI LẠI trong sản phẩm thương mại (khi đã xác minh). */
const REDISTRIBUTABLE_LICENSES: ReadonlySet<LicenseId> = new Set<LicenseId>(['CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'MIT', 'Apache-2.0']);
/** Bắt buộc ghi công tác giả khi phân phối lại. */
const ATTRIBUTION_LICENSES: ReadonlySet<LicenseId> = new Set<LicenseId>(['CC-BY-4.0', 'CC-BY-SA-4.0', 'CC-BY-NC-4.0', 'CC-BY-NC-SA-4.0', 'MIT', 'Apache-2.0']);
const SHARE_ALIKE_LICENSES: ReadonlySet<LicenseId> = new Set<LicenseId>(['CC-BY-SA-4.0', 'CC-BY-NC-SA-4.0']);

/**
 * Lời khai giấy phép ĐI THEO TỪNG ASSET (không theo nguồn — một site có thể trộn CC0 với CC-BY-NC).
 * `verifiedBy`/`verifiedAt`/`evidenceUrl` là biên lai xác minh của NGƯỜI; thiếu một trong ba thì
 * coi là CHƯA xác minh dù `id` có là CC0.
 */
export interface LicenseClaim {
  id: LicenseId;
  /** trang nguồn của asset (trang sản phẩm hãng / trang asset trên kho mở). */
  sourceUrl?: string;
  /** URL/đường dẫn tới bằng chứng giấy phép (trang license, file LICENSE, mail cho phép). */
  evidenceUrl?: string;
  verifiedBy?: string;
  verifiedAt?: string; // ISO 8601
  /** Hãng/tác giả cho phép phân phối lại TƯỜNG MINH (mail/hợp đồng) — chỉ có nghĩa khi có evidenceUrl. */
  redistributionPermission?: 'explicit' | 'none';
  /** Điều khoản nguồn CẤM tái đóng gói/scrape (marketplace: TurboSquid, CGTrader, 3dsky…). */
  termsForbidRebundle?: boolean;
  /** Chuỗi ghi công (tác giả · tiêu đề · giấy phép) — bắt buộc khi `mustAttribute`. */
  attribution?: string;
}

export type AcquisitionTier = 'redistributable' | 'user-import' | 'reference-only' | 'blocked';

/** Chính sách LƯU hình học nặng theo bậc — caller ghi byte phải đọc trường này. */
export type GeometryPolicy =
  | 'store-derivatives' // giữ gốc + dẫn xuất chuẩn hoá
  | 'metadata-and-thumb-first' // chỉ metadata + thumb; hình học nặng tải theo yêu cầu, cache có trần
  | 'reference-pointer-only'; // không lưu byte nào, chỉ con trỏ + lý do

export interface AcquisitionDecision {
  tier: AcquisitionTier;
  geometryPolicy: GeometryPolicy;
  /** giấy phép đã được xác minh theo asset (đủ 3 vế người/ngày/bằng chứng). */
  licenseVerified: boolean;
  mustAttribute: boolean;
  shareAlike: boolean;
  /** lý do từng dòng — hiện ra cho người, không giấu trong log. */
  reasons: string[];
}

/** Biên lai đủ ba vế ⇒ xác minh. Không nới: thiếu một vế là chưa. */
export function isLicenseVerified(claim: LicenseClaim): boolean {
  return Boolean(claim.verifiedBy && claim.verifiedAt && claim.evidenceUrl);
}

export function isLicenseId(v: unknown): v is LicenseId {
  return typeof v === 'string' && (LICENSE_IDS as readonly string[]).includes(v);
}

export function isAssetSourceKind(v: unknown): v is AssetSourceKind {
  return typeof v === 'string' && (ASSET_SOURCE_KINDS as readonly string[]).includes(v);
}

const POLICY_OF_TIER: Record<AcquisitionTier, GeometryPolicy> = {
  redistributable: 'store-derivatives',
  'user-import': 'store-derivatives',
  'reference-only': 'metadata-and-thumb-first',
  blocked: 'reference-pointer-only',
};

/**
 * Quyết định bậc thu nhận. THUẦN, tất định, không throw.
 * Thứ tự luật cố ý: cấm (①) → nguồn (user/seed) → xác minh giấy phép → loại giấy phép.
 */
export function decideAcquisition(source: AssetSourceKind, claim: LicenseClaim): AcquisitionDecision {
  const reasons: string[] = [];
  const verified = isLicenseVerified(claim);
  const mustAttribute = ATTRIBUTION_LICENSES.has(claim.id);
  const shareAlike = SHARE_ALIKE_LICENSES.has(claim.id);

  const finish = (tier: AcquisitionTier): AcquisitionDecision => ({
    tier,
    geometryPolicy: POLICY_OF_TIER[tier],
    licenseVerified: verified,
    mustAttribute,
    shareAlike,
    reasons,
  });

  // ① Điều khoản cấm tái đóng gói thắng mọi thứ khác.
  if (claim.termsForbidRebundle) {
    reasons.push('Điều khoản nguồn cấm tái đóng gói/scrape — chỉ giữ con trỏ về nguồn, không lưu hình học.');
    return finish('blocked');
  }

  if (source === 'user-upload') {
    reasons.push('Người dùng tự tải lên — dùng trong phạm vi tài khoản/dự án của họ, IF không phân phối lại.');
    return finish('user-import');
  }

  if (source === 'if-seed') {
    if (claim.id === 'CC0-1.0' && verified) {
      reasons.push('Fixture tự dựng của IF, CC0 có biên lai — được đóng vào kho.');
      return finish('redistributable');
    }
    reasons.push('Fixture của IF nhưng thiếu biên lai CC0 đủ ba vế (người/ngày/bằng chứng) — chỉ tham chiếu.');
    return finish('reference-only');
  }

  if (source === 'manufacturer-reference') {
    if (claim.redistributionPermission === 'explicit' && claim.evidenceUrl && verified) {
      reasons.push('Hãng cho phép phân phối lại TƯỜNG MINH, có bằng chứng và người xác minh.');
      return finish('redistributable');
    }
    reasons.push(
      claim.redistributionPermission === 'explicit'
        ? 'Khai "hãng cho phép" nhưng thiếu bằng chứng/người xác minh — giữ ở mức tham chiếu cho tới khi đủ biên lai.'
        : 'Model hãng — mặc định chỉ tham chiếu (metadata + thumb + link), không tái phân phối khi chưa có cho phép tường minh.',
    );
    return finish('reference-only');
  }

  // open-candidate
  if (!verified) {
    reasons.push(`Giấy phép "${claim.id}" CHƯA xác minh theo asset (cần verifiedBy + verifiedAt + evidenceUrl) — chỉ tham chiếu.`);
    return finish('reference-only');
  }
  if (claim.id === 'unknown' || claim.id === 'proprietary') {
    reasons.push(`Giấy phép "${claim.id}" không cho phép phân phối lại — chỉ tham chiếu.`);
    return finish('reference-only');
  }
  if (!REDISTRIBUTABLE_LICENSES.has(claim.id)) {
    reasons.push(`Giấy phép "${claim.id}" (phi thương mại) không được vào kho phân phối của sản phẩm bán ra — chỉ tham chiếu.`);
    return finish('reference-only');
  }
  if (mustAttribute && !claim.attribution) {
    reasons.push(`Giấy phép "${claim.id}" đòi ghi công nhưng thiếu chuỗi attribution — chỉ tham chiếu cho tới khi bổ sung.`);
    return finish('reference-only');
  }
  reasons.push(`Giấy phép "${claim.id}" đã xác minh theo asset${mustAttribute ? ' (kèm ghi công)' : ''} — được đóng vào kho.`);
  return finish('redistributable');
}
