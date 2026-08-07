/**
 * lib/review/types.ts — HỢP ĐỒNG DỮ LIỆU của bảng kiểm dùng chung 3 chặng (p3, 07/08).
 *
 * Nền: `docs/CHOT-TACH-AI-VA-CHINH-TAY.md` §1 — *"AI đoán, chỉnh tay chắc chắn — trộn hai thứ
 * vào cùng một chỗ là lừa người dùng."* Có HAI loại kiểm khác nhau về BẢN CHẤT:
 *
 *   LỚP LUẬT (tất định)              LỚP GÓP Ý (AI)
 *   cửa thoát ≥800mm                 bố cục lệch, ánh sáng không hợp
 *   đúng/sai, có số                  "theo nghề thì thường…"
 *   chạy 10 lần giống nhau           mỗi lần một khác
 *   dẫn được điều khoản              chỉ dẫn được thông lệ
 *   máy thuần, 0đ                    cần AI
 *
 * Nếu app nói "thiếu lối thoát hiểm" và "màu hơi lỗi mốt" cùng một giọng đỏ, người dùng sẽ học
 * cách BỎ QUA CẢ HAI. ⇒ Cùng một bảng, KHÁC dấu — tách bằng KIỂU DỮ LIỆU (discriminated union),
 * không tách bằng lời dặn: lớp góp ý KHÔNG CÓ CHỖ để khai mức đỏ/vàng, không có chỗ khai điểm
 * số, không có cờ chặn — muốn phạm luật phải sửa type này trước, và diff đó sẽ bị soi.
 *
 * File THUẦN (không React/DOM/fetch) — test bằng sucrase-node như lib/boq/model.ts.
 */

/** Vị trí để click-zoom tới. `mm` = toạ độ world CAD (chặng 2D/3D) · `slide` = số slide (deck). */
export interface ViTri {
  mm?: { x: number; y: number };
  slide?: number;
  /** id entity/element liên quan — UI tô sáng được đúng vật. */
  entityId?: string;
}

/**
 * LỚP LUẬT — tất định: cùng một Doc chạy 10 lần ra 10 lần y hệt (có test chứng minh,
 * `rules-3d.test.ts` case [tất định]). Mỗi finding PHẢI dẫn được nguồn (điều khoản/chuẩn/ngưỡng
 * số) — không dẫn được nguồn thì nó KHÔNG PHẢI luật, đưa xuống lớp góp ý hoặc bỏ.
 */
export interface FindingLuat {
  lop: 'luat';
  /** đỏ = sai chuẩn bắt buộc, chặn nghiệm thu · vàng = khuyến nghị/tiện nghi, nên sửa. */
  muc: 'do' | 'vang';
  /** Điều khoản/chuẩn dẫn được — vd "QCVN 06:2022 §3.2" · "DECK_STANDARDS.whitespace" ·
   * "r3d-khoi-ho (hình học thuần)". BẮT BUỘC — khác lớp góp ý. */
  nguon: string;
  /** id rule ổn định để "đã bỏ qua" nhớ được theo rule. */
  ruleId: string;
  moTa: string;
  viTri?: ViTri;
  /** Có cách sửa cụ thể ⇒ UI hiện nút "Sửa". Không có thì chỉ mô tả. */
  cachSua?: string;
  /** Số liệu CHƯA kiểm chứng với văn bản gốc (mang từ `StandardRule.verified=false` qua) —
   * UI phải hiện rõ, người dùng tự cân nhắc. */
  chuaKiemChung?: boolean;
}

/**
 * LỚP GÓP Ý — AI, xác suất. BA CẤM (phiếu p3, khoá bằng type):
 *  ① KHÔNG CHẤM ĐIỂM — không có field điểm số nào; góp ý là CÂU QUAN SÁT CỤ THỂ nói được lý do
 *    và sửa được ngay (vd "ba phối cảnh liền nhau cùng góc ngang tầm mắt; một góc từ trên xuống
 *    sẽ cho khách thấy tổng thể mặt bằng").
 *  ② KHÔNG XU HƯỚNG đợt này — xu hướng đổi theo năm và mọi bảng xu hướng đều có chủ sở hữu
 *    (IF vừa dọn Pantone đúng vì chuyện này, LICENSE-NOTES §9). Muốn nói phải có `nguonCongKhai`.
 *  ③ KHÔNG BAO GIỜ CHẶN — không có field mức đỏ/vàng, không cờ block; UI lớp này luôn mang dấu
 *    Magic tím + glyph Vitals + chữ "gợi ý" + nút "Bỏ qua" (CHOT-TACH-AI §2: tách bằng DẤU).
 */
export interface FindingGopy {
  lop: 'gopy';
  /** Câu quan sát cụ thể — lý do + hướng sửa nằm NGAY TRONG câu, không phải điểm số. */
  moTa: string;
  viTri?: ViTri;
  /** Chỉ dùng khi góp ý dựa trên nguồn công bố công khai (bắt buộc nếu nói về xu hướng —
   * đợt đầu chưa dùng vì xu hướng bị cấm hẳn). */
  nguonCongKhai?: string;
}

export type Finding = FindingLuat | FindingGopy;

/** Chặng đang kiểm — quyết định bộ luật nào được cắm (luat/cad · luat/rules-3d · luat/deck). */
export type ReviewChang = '2d' | '3d' | 'deck';

/** Kết quả một lượt kiểm: hai lớp TÁCH SẴN từ tầng dữ liệu — UI không bao giờ phải tự phân loại
 * (tự phân loại là chỗ dễ trộn nhất). */
export interface ReviewResult {
  chang: ReviewChang;
  luat: FindingLuat[];
  gopy: FindingGopy[];
  /** Lớp góp ý không chạy được thì nói lý do (vd "chưa có đề bài đã ghi") — không im lặng. */
  gopyBiChan?: string;
}
