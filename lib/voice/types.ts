/**
 * lib/voice/types.ts — HỢP ĐỒNG ĐẦU VÀO GIỌNG NÓI (Lane V, 22/08).
 *
 * ⭐ LUẬT NỀN CỦA CẢ THƯ MỤC NÀY — đọc trước khi sửa bất cứ dòng nào:
 *
 *     tiếng nói → BẢN CHỮ → ĐẦU VÀO NGỮ NGHĨA → đúng hệ thống mà CHỮ GÕ đang dùng
 *
 * Giọng nói **ngang hàng** chữ gõ / bút / chạm / ảnh / PDF. Nó là một NGUỒN, không phải một
 * TÍNH NĂNG. Hệ quả bắt buộc, cả hai đều khoá được bằng máy:
 *   ⛔ CẤM đẻ kho sự thật riêng cho giọng nói. `DauVaoNguNghia` KHÔNG mang kho, không mang
 *      hàm ghi — nó chỉ MÔ TẢ điều người dùng muốn; nơi nhận (host) mới quyết ghi vào đâu, và
 *      phải là ĐÚNG chỗ chữ gõ đang ghi vào.
 *   ⛔ CẤM dựng app trợ lý giọng nói riêng. Không có "phiên hội thoại", không có lịch sử chat,
 *      không có kho câu lệnh riêng. Ngữ cảnh `lenh` giải qua `lib/commands/registry.ts` —
 *      SỔ LỆNH CHUNG, đúng cái mà ⌘K và thanh công cụ đang đọc (bằng chứng: `giai-y-dinh.ts`
 *      không có một bảng ánh xạ lời-nói→hành-động nào; nó tra `COMMANDS`).
 *
 * 🔴 LUẬT CỨNG NHẤT: nhận dạng giọng nói KHÔNG BAO GIỜ được lặng lẽ đổi hình học/spec/sự thật
 *    dự án. Nhận nhầm một chữ mà tường đổi dày là hỏng chí mạng. Cửa chặn là `rui-ro.ts`, và
 *    nó **fail-closed**: mặc định MỌI ý định đều phải xem trước + xác nhận; chỉ một danh sách
 *    an toàn rất ngắn được chạy thẳng. Thêm lệnh mới vào sổ ⇒ nó tự động rơi vào nhánh "phải
 *    xác nhận", không lọt qua được.
 *
 * File THUẦN (không React/DOM/fetch), import TƯƠNG ĐỐI — test bằng sucrase-node.
 */

/* ════════════════════════════════════════════════════════════════════════════════════════════
   ① NGUỒN — giọng nói chỉ là một trong sáu, và mọi nguồn dựng ra CÙNG một hợp đồng
   ════════════════════════════════════════════════════════════════════════════════════════════ */

/**
 * Nguồn sinh ra đầu vào. Liệt kê đủ SÁU ngay từ đầu là cố ý: nó ghi vào kiểu dữ liệu cái điều
 * mà lời dặn hay bị quên — giọng nói không có đường đi riêng, nó dùng chung đường với chữ gõ.
 * Nơi nhận `DauVaoNguNghia` KHÔNG được rẽ nhánh theo `nguon` để làm việc khác đi; `nguon` chỉ
 * dùng cho hai việc: ghi vết (ai/cái gì tạo ra) và quyết định ngưỡng thận trọng (giọng nói có
 * `doTinCay`, chữ gõ thì không).
 */
export type NguonDauVao = 'giong-noi' | 'chu-go' | 'but' | 'cham' | 'anh' | 'pdf';

/** Ngôn ngữ nhận dạng. Tiếng Việt là ĐƯỜNG CHÍNH (mặc định mọi nơi trong thư mục này). */
export type NgonNguNoi = 'vi' | 'en';

/**
 * BẢN CHỮ — thứ DUY NHẤT mà tầng nhận dạng được phép trao ra ngoài. Mọi thứ sau đây trong hệ
 * chỉ nhìn thấy chữ, không nhìn thấy âm thanh. Đó là lý do bơm một `BanChu` giả vào
 * `giaiBanChu()` là nghiệm thu ĐÚNG cửa, không phải nghiệm thu giả.
 */
export interface BanChu {
  /** Nguyên văn nghe được. Không sửa lỗi hộ, không viết hoa hộ. */
  readonly van: string;
  /**
   * 0..1 nếu bộ nhận dạng có nói; `undefined` = KHÔNG BIẾT.
   * ⛔ CẤM bịa 0.9 cho đẹp — cùng luật với `lib/ui/tien-trinh.ts` (không đo được thì không có số).
   */
  readonly doTinCay?: number;
  readonly ngonNgu: NgonNguNoi;
  /** `true` = engine còn đang nghe, câu có thể đổi. Bản tạm KHÔNG được đem đi thi hành. */
  readonly tamThoi: boolean;
}

/* ════════════════════════════════════════════════════════════════════════════════════════════
   ② NĂM NGỮ CẢNH
   ════════════════════════════════════════════════════════════════════════════════════════════ */

export type NguCanh = 'lenh' | 'y-dinh-thiet-ke' | 'ghi-chu' | 'soat-duyet' | 'tim-kiem';

/**
 * NEO — "chỗ này" trong câu nói là chỗ nào. Ghi chú nói bằng miệng gần như luôn có chữ "chỗ
 * này"; không có neo thì nó rơi vào hư không và tuần sau không ai biết nó nói về cái gì.
 *
 * Trường nào cũng tuỳ chọn vì ngữ cảnh thật có thể thiếu (đứng ở Home thì không có entity).
 * Cố ý ĐẶT TRÙNG TÊN TRƯỜNG với `ViTri` của `lib/review/types.ts` (`entityId`) — cùng khái niệm,
 * không đặt tên thứ hai.
 */
export interface Neo {
  readonly stage?: string;
  readonly workspaceId?: string;
  readonly projectId?: string;
  /** id vật đang chọn — cùng nghĩa `ViTri.entityId` của lib/review. */
  readonly entityId?: string;
}

/** Ngữ cảnh lúc nói — host truyền vào, bộ giải KHÔNG tự đoán. */
export interface NguCanhHienTai extends Neo {
  /** Dựng `WhenCtx` cho sổ lệnh: 'cad' | 'render' | 'present'. */
  readonly stage: string;
  readonly mode?: string;
  readonly proToolsAllowed?: boolean;
}

/**
 * Ý ĐỊNH — union phân biệt theo `nguCanh`. Mỗi nhánh chỉ mang đúng thứ nó cần; không nhánh nào
 * có chỗ để nhét "hàm ghi" hay "kho" (đó là cách kiểu dữ liệu khoá luật cấm-đẻ-kho-riêng).
 */
export type YDinh =
  /** A · LỆNH — đã tra được trong SỔ LỆNH CHUNG. `commandId` là id thật của `CommandDef`. */
  | {
      readonly nguCanh: 'lenh';
      readonly commandId: string;
      /** Alias sổ lệnh khớp được (HOA) — để mặt tiền hiện đúng thứ người dùng gõ tay sẽ gõ. */
      readonly alias: string;
      readonly nhan: string;
      readonly arg?: string;
      readonly arg2?: string;
    }
  /** B · Ý ĐỊNH THIẾT KẾ — đổi SỰ THẬT. Luôn phải qua cửa xem trước + xác nhận. */
  | {
      readonly nguCanh: 'y-dinh-thiet-ke';
      /** Thuộc tính nói tới, dạng khoá ổn định (vd 'day' = độ dày). */
      readonly truong: string;
      readonly giaTri: number;
      /** ⛔ KHÔNG mặc định hộ đơn vị ở chỗ khác — đơn vị/tỉ lệ là chuyện cấp toàn app. */
      readonly donVi: string;
      readonly neo: Neo;
    }
  /** C · GHI CHÚ — neo vào vật/ngữ cảnh hiện tại, KHÔNG đổi sự thật dự án. */
  | {
      readonly nguCanh: 'ghi-chu';
      readonly noiDung: string;
      readonly neo: Neo;
    }
  /** D · SOÁT DUYỆT — ghi chú GHIM, đi vào đường checklist của `lib/review`. */
  | {
      readonly nguCanh: 'soat-duyet';
      readonly noiDung: string;
      readonly neo: Neo;
    }
  /** E · TÌM KIẾM — chỉ đọc, không đổi gì. */
  | {
      readonly nguCanh: 'tim-kiem';
      readonly tuKhoa: string;
      /** Kho được nói tên trong câu; `undefined` = tìm khắp nơi (host quyết). */
      readonly kho?: 'thu-vien' | 'gallery' | 'du-an';
    };

/* ════════════════════════════════════════════════════════════════════════════════════════════
   ③ HỢP ĐỒNG DÙNG CHUNG — thứ đi ra khỏi thư mục này
   ════════════════════════════════════════════════════════════════════════════════════════════ */

/**
 * ĐẦU VÀO NGỮ NGHĨA — hợp đồng dùng chung cho MỌI nguồn. Chữ gõ dựng được cái này y hệt (chỉ
 * khác `nguon: 'chu-go'` và không có `banChu.doTinCay`), nên nơi nhận không cần biết người dùng
 * đã nói hay đã gõ.
 */
export interface DauVaoNguNghia {
  readonly nguon: NguonDauVao;
  readonly yDinh: YDinh;
  /** Bản chữ gốc — giữ để ghi vết và để người dùng soi lại máy đã nghe ra gì. */
  readonly banChu: BanChu;
  /**
   * `true` ⇒ nơi nhận BẮT BUỘC xem trước + xác nhận + hoàn tác được trước khi ghi.
   * Giá trị do `canXacNhan()` (`rui-ro.ts`) tính, KHÔNG do nơi gọi tự khai — để không ai
   * "tiện tay" đặt `false`. Xem test `rui-ro.test.ts`.
   */
  readonly doiSuThat: boolean;
}

/** Vì sao không giải được — nói thẳng, không im lặng nuốt câu. */
export type LyDoTruot =
  /** Bản tạm, engine còn đang nghe. */
  | 'ban-tam'
  /** Câu rỗng. */
  | 'rong'
  /** Nghe ra chữ nhưng không khớp lệnh nào trong SỔ LỆNH CHUNG ở ngữ cảnh này. */
  | 'khong-co-trong-so-lenh'
  /** Có vẻ là ý định thiết kế nhưng thiếu con số. */
  | 'thieu-so'
  /** Không đoán nổi người dùng muốn ngữ cảnh nào. */
  | 'khong-hieu';

export type KetQuaGiai =
  | { readonly ok: true; readonly dauVao: DauVaoNguNghia }
  | { readonly ok: false; readonly lyDo: LyDoTruot; readonly goiY?: string };
