/**
 * lib/ui/vung-lam-viec.ts — LÕI THUẦN tính TÂM VÙNG LÀM VIỆC cho ổ Vitals ở mép trên.
 * Chạy test: `node_modules/.bin/sucrase-node lib/ui/vung-lam-viec.test.ts`
 *
 * 🔴 VÌ SAO KHÔNG DÙNG TÂM CỬA SỔ: cột trái biến hình — rail 52 → thềm ~240 → bảng 320-440 —
 * và cột phải có thể mọc thêm inspector. Neo vào tâm cửa sổ thì Vitals **trôi khỏi canvas** mỗi
 * lần người dùng đổi nấc sidebar, dù không ai đụng vào Vitals. Neo vào tâm VÙNG LÀM VIỆC thì nó
 * đứng yên so với thứ người dùng đang nhìn — đó mới là "gắn vật lý vào hệ", không phải toạ độ.
 *
 * ⭐ [Đ2] CONNECT, KHÔNG NEW: bề rộng cột trái đã có sẵn hai nguồn — sự kiện `if:navigator-width`
 * (`CadEditor.tsx:1468` phát · `Navigator.tsx:121` nghe) và chính hộp DOM của cột canvas. File
 * này KHÔNG đẻ cơ chế đo mới; nó chỉ nhận số đã đo rồi trả về một con số.
 *
 * ⛔ VA CHẠM — THỨ TỰ NHƯỜNG CỐ ĐỊNH (Hoà chốt), và nó nằm ở đây chứ không nằm trong CSS:
 *   ① nén/cắt phần đầu đề dự án TRƯỚC
 *   ② GIỮ NEO VITALS ĐỨNG YÊN
 *   ③ co bề rộng Peek
 *   ④ chỉ khi đó mới dịch, và dịch trong vùng an toàn CÓ BIÊN
 * ⇒ Hàm này trả về cả `phaiNhuongDauDe` để nơi dùng thi hành bước ① — không cho Vitals đi lang
 * thang ngang header rồi gọi đó là "responsive".
 */

export interface DoVungLamViec {
  /** Mép trái của cột canvas theo viewport (px). */
  trai: number;
  /** Bề rộng cột canvas (px). */
  rong: number;
  /** Bề rộng khung nhìn (px). */
  khungRong: number;
  /** Bề rộng ổ Vitals (px). */
  oRong: number;
  /** Mép trái của cụm phải-trên (px) — ổ KHÔNG BAO GIỜ được chạm vào nó. */
  cumPhaiTrai: number;
  /** Mép phải của cụm trái (logo + đầu đề dự án) khi chưa nén (px). */
  cumTraiPhai: number;
}

export interface OViTri {
  /** Toạ độ trái của ổ, theo viewport. */
  trai: number;
  /** Tâm ổ — chỗ Peek/Engage mọc ra. */
  tam: number;
  /** ① Đầu đề dự án phải nén/cắt vì ổ đã tới sát nó. */
  phaiNhuongDauDe: boolean;
  /** ④ Đã phải dịch khỏi tâm thật vì hết chỗ (biên đã chạm). */
  daDich: boolean;
  /** Bề rộng tối đa còn lại cho cụm trái sau khi ổ đã giữ chỗ. */
  tranCumTrai: number;
}

/** Khe an toàn hai bên ổ — dưới mức này thì mắt đọc ra là hai vật dính nhau. */
export const KHE_O = 12;

/**
 * Tâm vùng làm việc, kẹp trong dải an toàn.
 * Bậc thang nhường đúng thứ tự ①→④; ② (neo đứng yên) thể hiện ở chỗ hàm này KHÔNG dịch ổ cho
 * tới khi biên thật sự chạm — không có nhánh nào "dịch cho đẹp".
 */
export function viTriO(d: DoVungLamViec): OViTri {
  const tamThat = d.trai + d.rong / 2;
  const traiLyTuong = tamThat - d.oRong / 2;

  // Biên: không chạm cụm phải-trên, không tràn mép trái khung nhìn.
  const bienPhai = d.cumPhaiTrai - KHE_O - d.oRong;
  const bienTrai = KHE_O;

  const trai = Math.min(Math.max(traiLyTuong, bienTrai), Math.max(bienTrai, bienPhai));
  const daDich = Math.abs(trai - traiLyTuong) > 0.5;

  // ① cụm trái phải nhường khi ổ đã lấn tới chỗ nó đang đứng.
  const tranCumTrai = Math.max(0, trai - KHE_O);
  const phaiNhuongDauDe = d.cumTraiPhai > tranCumTrai;

  return {
    trai: Math.round(trai),
    tam: Math.round(trai + d.oRong / 2),
    phaiNhuongDauDe,
    daDich,
    tranCumTrai: Math.round(tranCumTrai),
  };
}

/**
 * Chỗ Peek/Engage rơi xuống. **Khe hở neo↔Peek phải = 0**: nó là mép trên HÉ MỞ, không phải một
 * popover hiện lên cạnh một cái nút. `day` là mép DƯỚI của ổ (= mép dưới header).
 */
export function viTriTamXo(
  o: { tam: number; day: number },
  tamRong: number,
  khungRong: number,
): { trai: number; tren: number } {
  const trai = Math.min(Math.max(KHE_O, o.tam - tamRong / 2), Math.max(KHE_O, khungRong - tamRong - KHE_O));
  return { trai: Math.round(trai), tren: Math.round(o.day) };
}
