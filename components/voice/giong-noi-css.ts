/**
 * components/voice/giong-noi-css.ts — CSS của cửa giọng nói, khai một chỗ (khuôn đã có ở
 * `components/library/library-sheet-css.ts`).
 *
 * ⛔ KHÔNG hex tự chế: mọi màu đọc token từ `app/globals.css`. ⛔ Không glow trang trí — ánh sáng
 *    trong IF chỉ mang TRẠNG THÁI (LightState). Ở đây đúng MỘT tín hiệu có nghĩa: chấm tròn cạnh
 *    nút micro **chỉ đập khi đang thật sự nghe**, tắt hẳn ngay khi thôi nghe.
 * ⛔ Màu không phải kênh duy nhất: trạng thái nghe luôn kèm NHÃN CHỮ ("Đang nghe") và
 *    `aria-live`, để người mù màu / để độ sáng thấp / dùng trình đọc màn hình vẫn biết.
 * · Bo góc theo thang token 6/10/14/20 + `--r-full`; bo đồng tâm: trong = ngoài − đệm.
 * · `prefers-reduced-motion` thắng tất cả — chấm thôi đập nhưng VẪN HIỆN, không tắt mất trạng thái.
 */

export const GIONG_NOI_CSS = `
.if-thoai {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-radius: var(--radius-lg, 14px);
  background: var(--panel);
  border: 1px solid var(--vien-mo, var(--border));
  color: var(--t1);
  font-size: var(--fs-ui, 13px);
  max-width: 460px;
}

.if-thoai-hang { display: flex; align-items: center; gap: 10px; }

/* Nút micro — capsule, cỡ chạm tối thiểu theo token mật độ. */
.if-thoai-nut {
  position: relative;
  display: inline-flex; align-items: center; gap: 8px;
  min-height: var(--tap, 36px);
  padding: 0 14px;
  border-radius: var(--r-full, 999px);
  border: 1px solid var(--border-strong, var(--border));
  background: var(--card);
  color: var(--t1);
  cursor: pointer;
  font: inherit;
}
.if-thoai-nut:hover { background: var(--hover); }
.if-thoai-nut:focus-visible { outline: 2px solid var(--accent-ring); outline-offset: 2px; }

/* Ô GÕ — cùng nhịp với nút Nói (22/08). Dùng token, không hex: nền --field là nền ô nhập chuẩn
   của app, bo theo thang token nên nằm đúng hệ hình học chung.
   (Không dùng dấu huyền trong khối này — cả tệp là một template literal.) */
.if-thoai-o {
  flex: 1 1 auto;
  min-width: 0;
  background: var(--field);
  color: var(--t1);
  border: 1px solid var(--vien-mo);
  border-radius: var(--r-2);
  padding: 4px 10px;
  font-size: var(--fs-xs);
  outline: none;
}
.if-thoai-o::placeholder { color: var(--t4); }
.if-thoai-o:focus-visible { outline: 2px solid var(--accent-ring); outline-offset: 2px; }

/* Nút mờ — độ mờ đọc TOKEN theo theme (không gõ 0.5 tại chỗ), và dùng aria-disabled
   chứ không dùng thuộc tính disabled: nút disabled bị Tab bỏ qua nên lý do không tới được
   bàn phím và trình đọc màn hình (bài học 16/08). */
.if-thoai-nut[aria-disabled='true'] {
  opacity: var(--mo-vo-hieu, 0.62);
  cursor: not-allowed;
}

/* TÍN HIỆU ĐANG NGHE — viền nút sáng lên + CHẤM TRÒN đập theo nhịp. CHỈ tồn tại khi đang nghe.
   🔴 BÀI HỌC 22/08, ghi lại để không ai "sửa cho đẹp" theo hướng cũ: bản đầu dùng vòng chạy
   ::after xoay quanh nút. Nút là CAPSULE RỘNG — xoay một capsule quanh tâm thì nó quét ra một
   vệt chéo dài cắt ngang cả thẻ. Máy soi không bắt được, mắt bắt ngay ở ảnh chụp đầu tiên.
   ⇒ Vòng chạy chỉ đúng với hình TRÒN. Ở đây tín hiệu động đặt lên CHẤM tròn (nở/thu, không
   xoay), còn nút chỉ đổi màu viền. */
.if-thoai-nut[data-nghe='true'] { border-color: var(--accent); }

.if-thoai-cham {
  width: 9px; height: 9px; border-radius: var(--r-full, 999px);
  background: var(--accent); flex: 0 0 auto;
  animation: if-thoai-dap 1100ms ease-in-out infinite;
}
@keyframes if-thoai-dap {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.62); opacity: 0.45; }
}

/* Giảm chuyển động THẮNG: chấm đứng yên nhưng KHÔNG biến mất — trạng thái vẫn phải đọc được. */
@media (prefers-reduced-motion: reduce) {
  .if-thoai-cham { animation: none; }
}

/* Bản chữ — bản TẠM nhạt hơn và nghiêng, để mắt phân biệt được "máy còn đang nghe". */
.if-thoai-banchu {
  min-height: 40px;
  padding: 8px 10px;
  border-radius: var(--radius-md, 10px);
  background: var(--field, var(--card));
  border: 1px solid var(--vien-mo, var(--border));
  color: var(--t1);
  line-height: 1.5;
}
.if-thoai-banchu[data-tam='true'] { color: var(--t3); font-style: italic; }
.if-thoai-banchu[data-rong='true'] { color: var(--t4); }

/* PHIẾU XEM TRƯỚC — cửa chặn "đổi sự thật lặng lẽ". */
.if-thoai-phieu {
  border-radius: var(--radius-md, 10px);
  border: 1px solid var(--border-strong, var(--border));
  background: var(--card);
  padding: 12px;
  display: flex; flex-direction: column; gap: 10px;
}
.if-thoai-phieu-tieu { font-weight: 600; color: var(--t1); }
.if-thoai-phieu-ly { color: var(--t2); }
.if-thoai-bang { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; }
.if-thoai-bang dt { color: var(--t3); }
.if-thoai-bang dd { margin: 0; color: var(--t1); font-variant-numeric: tabular-nums; }

.if-thoai-nutdoc { display: flex; gap: 8px; }
.if-thoai-btn {
  min-height: var(--tap, 36px);
  padding: 0 14px;
  border-radius: var(--radius-md, 10px);
  border: 1px solid var(--border-strong, var(--border));
  background: var(--card); color: var(--t1); cursor: pointer; font: inherit;
}
.if-thoai-btn:focus-visible { outline: 2px solid var(--accent-ring); outline-offset: 2px; }
/* Đồng ý ↔ Huỷ phân biệt bằng CHỮ + VỊ TRÍ + nền, không chỉ bằng màu. */
.if-thoai-btn[data-chinh='true'] { background: var(--accent); border-color: var(--accent); color: #fff; }

.if-thoai-loi { color: var(--t2); }
.if-thoai-ket { color: var(--t2); }
.if-thoai-canh {
  color: var(--t2);
  border-left: 2px solid var(--warning, var(--border-strong));
  padding-left: 8px;
}

/* Phần chỉ dành cho trình đọc màn hình — lý do nút mờ sống ở đây, không sống trong title. */
.if-thoai-a11y {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
`;
