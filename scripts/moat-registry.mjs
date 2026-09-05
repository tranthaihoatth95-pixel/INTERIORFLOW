/**
 * ═══ SỔ TUYÊN BỐ MOAT — máy đọc được ══════════════════════════════════════════
 *
 * VÌ SAO CÓ SỔ NÀY. Ngày 05/09 đào cụm vị trí/thiên văn, tìm ra một thứ không cổng nào bắt được:
 * chốt 15/08 của Hoà tuyên bố *"vị trí công trình nằm đâu thì áp quy chuẩn tiêu chuẩn đồng bộ tại
 * đó"* — một trong những câu định vị sản phẩm mạnh nhất. Mã có `getRulesByRegion()`. Nhưng:
 *      getRulesByRegion  ← chỉ được getMandatoryRules gọi
 *      getMandatoryRules ← 0 nơi gọi
 * ⇒ cả nhánh lọc luật theo vùng là MÃ CHẾT. Tuyên bố sống trong sổ, không sống trong app.
 *
 * 🔴 Đây là BẪY BẬC HAI mà dự án đã đặt tên: *"có người gọi, nhưng người gọi ấy không còn sống"*.
 * Đếm caller một bậc thì thấy "1 nơi gọi" và yên tâm. Phải dò tới CỬA VÀO THẬT mới lộ.
 *
 * SỔ NÀY GHI GÌ: mỗi tuyên bố moat ↔ ký hiệu mã phải SỐNG (có đường từ `app/` hoặc `components/`
 * tới nó). Chốt một moat mới thì THÊM MỘT DÒNG ngay lúc chốt — cùng kỷ luật `frontier-registry`.
 * Tuyên bố không vào sổ coi như chưa chốt; tuyên bố vào sổ mà mã chết thì `soi:moat` báo ĐỎ.
 *
 * ⚠️ `kyHieu` phải là TÊN THẬT trong mã. Bài học cùng ngày: tôi từng báo "boqFromDoc 0 nơi gọi"
 * trong khi hàm đó KHÔNG TỒN TẠI — tên thật là `computeBoq`. Đếm nhầm tên thì ra số nhầm, và số
 * nhầm còn tệ hơn không đếm. Vì vậy máy soi TỰ KIỂM ký hiệu có tồn tại không trước khi đếm.
 */
export const TUYEN_BO_MOAT = [
  {
    id: 'vi-tri-quyet-quy-chuan',
    chot: '15/08 — "vị trí dự án nằm đâu thì áp quy chuẩn tiêu chuẩn đồng bộ tại đó"',
    kyHieu: 'getMandatoryRules',
    khaiTrong: 'lib/cad/standards/registry.ts',
    // W2 05/09 — NỐI: `giuBoBatBuoc()` (lib/cad/standards/vung-tu-vi-tri.ts) gọi, và panel Kiểm
    // chuẩn (components/cad/CadEditor.tsx) dùng để bộ lọc "loại vận hành" không làm rơi luật bắt
    // buộc của vùng. Đo được là KHÔNG tautology: `rulesForOperator('generic')` vứt sạch nhóm
    // `vn-fire` (toàn luật PCCC mandatory) — test [3] `vi-tri-quy-chuan.test.ts` chứng minh.
    trangThai: 'song',
  },
  {
    id: 'vi-tri-loc-luat-theo-vung',
    chot: '15/08 — thang bậc A nền công thái học → B chuẩn quốc gia → C biến số ngữ cảnh',
    kyHieu: 'getRulesByRegion',
    khaiTrong: 'lib/cad/standards/registry.ts',
    // W2 05/09 — NỐI: `nenLuatTheoVung()` (lib/cad/standards/vung-tu-vi-tri.ts) gọi HAI lượt, và
    // panel Kiểm chuẩn dùng làm nền. Hai lượt vì thang bậc A→B: `getRulesByRegion('INTL')` giữ
    // tầng A (nhân trắc) rồi `getRulesByRegion(vung)` chồng tầng B lên — gọi một lượt về 'VN' sẽ
    // vứt mất 12 rule Neufert, tức phá câu "A lấp chỗ B im lặng".
    // ⛔ Cửa an toàn: chỉ lọc khi NGƯỜI DÙNG đã khai quốc gia (`VungSuyRa.apDuocNgay`). Đoán vùng
    // rồi lọc là làm biến mất cả bộ luật quốc gia mà không ai thấy.
    trangThai: 'song',
  },
  {
    id: 'nang-that-tu-vi-tri',
    chot: '10/08 — chiếu sáng dùng chung Doc.lighting; lux trước IES phải ghi rõ là ước tính',
    kyHieu: 'trangThaiNang',
    khaiTrong: 'lib/site/solar.ts',
    trangThai: 'song',
  },
  {
    id: 'goc-nang-vao-3d',
    chot: '10/08 — góc nắng thật chảy vào tab Chiếu sáng chặng 3D',
    kyHieu: 'gocNangTuHoSo',
    khaiTrong: 'components/site/nang-tu-ho-so.ts',
    trangThai: 'song',
  },
  {
    id: 'vat-lieu-mot-vat',
    chot: '16/08 — "đồng bộ là KHÔNG TÁCH chúng ra ngay từ đầu"; một matId, ba mặt',
    kyHieu: 'getMaterial',
    khaiTrong: 'lib/materials/resolve.ts',
    trangThai: 'song',
  },
  {
    id: 'boq-tu-mot-nguon',
    chot: '15/08 — "BOQ chỉ lấy giá trị chính xác đến từ con số"',
    kyHieu: 'computeBoq',
    khaiTrong: 'lib/boq/compute.ts',
    trangThai: 'song',
  },
  {
    id: 'cong-thuc-khoi-khong-pha-huy',
    chot: '11/08 — BuildRecipe: BuildOp thành stack non-destructive',
    kyHieu: 'evalRecipe',
    khaiTrong: 'lib/three/build-recipe.ts',
    trangThai: 'song',
  },
  {
    id: 'kiem-chuan-bang-may',
    chot: '15/08 — "kiểm tiêu chuẩn là việc của MÁY, không phải của AI"',
    kyHieu: 'checkStandards',
    khaiTrong: 'lib/cad/standards/checker.ts',
    trangThai: 'song',
  },
  {
    id: 'mot-doc-2d-len-3d',
    chot: '03/08 luật X1 — dựng ở đâu cũng ghi vào MỘT Doc',
    kyHieu: 'docToObjScene',
    khaiTrong: 'lib/three/cad-to-obj.ts',
    trangThai: 'song',
  },
];
