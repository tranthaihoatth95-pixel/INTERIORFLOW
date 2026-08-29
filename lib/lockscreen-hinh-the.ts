/**
 * lib/lockscreen-hinh-the.ts — HÌNH CHO MẶT THẺ KHOÁ, sinh bằng hình học, không dùng ảnh.
 *
 * Hoà 29/08: *"cần card có hình được thiết kế đẹp thay vì trắng thấy gớm vậy."*
 *
 * VÌ SAO SINH RA CHỨ KHÔNG DÙNG ẢNH — ba ràng buộc cứng của dự án, cái nào cũng đủ để loại ảnh:
 *   ① **Luật trung tính.** IF là sản phẩm bán ra toàn cầu. Ảnh render của khách (`public/covers`,
 *      `public/wallpapers/ttt-*`) là tài sản của MỘT studio — nhét vào mặt mặc định là đúng lỗi
 *      đã phải dọn 24/07.
 *   ② **Local-first.** Không tải ảnh từ dịch vụ ngoài. Mọi thứ phải chạy khi rút mạng.
 *   ③ **Kích thước bộ cài.** Mười sáu tấm ảnh đẹp là vài chục MB, cho một mặt hiện ra 15 phút
 *      một lần. Hình sinh bằng hình học nặng **0 byte**.
 *
 * NGÔN NGỮ HÌNH — mượn đúng nghề: **mặt cắt kiến trúc**. Một đường chân trời, một vầng tròn,
 * vài lớp mặt phẳng chồng nhau lùi dần về sau. Đây không phải hoạ tiết trang trí ngẫu hứng: nó
 * là thứ người trong nghề nhìn phát ra ngay, và nó nói đúng cái app này làm.
 *
 * TẤT ĐỊNH THEO CÂU: cùng một câu luôn cho cùng một hình. Không phải để tiết kiệm — mà để
 * **hình trở thành dấu nhận của câu**: nhìn lần thứ hai là nhớ "à, câu này". Ảnh đổi mỗi lần
 * hiện thì nó chỉ là nhiễu.
 */

export type HinhThe = {
  /** Nền trời — dải trên cùng. */
  troi: string;
  /** Mặt đất/nước — dải dưới. */
  dat: string;
  /** Vầng tròn (mặt trời / mặt trăng). */
  vang: string;
  /** Nét mảnh — đường chân trời, đường gióng. */
  net: string;
  /** Các lớp mặt phẳng lùi dần, mỗi lớp: [cao 0..1, lệch trái 0..1, màu]. */
  lop: { cao: number; lech: number; mau: string }[];
  /** Vị trí vầng tròn theo chiều ngang, 0..1. */
  vangX: number;
  /** Vầng tròn nằm trên hay lặn sau lớp đầu. */
  vangY: number;
};

/**
 * Bốn bảng màu, đều **trầm và đục** — cố ý không dùng màu bão hoà cao. Mặt khoá là thứ hiện ra
 * khi người ta vừa rời bàn về; nó phải dịu mắt, không phải nổi bật. Mỗi bảng lấy cảm hứng từ
 * một thời điểm trong ngày, vì đó là điều mặt khoá vốn đang nói (nó có cái đồng hồ).
 */
const BANG: { troi: string; dat: string; vang: string; net: string; lop: string[] }[] = [
  // rạng sáng — xanh mực pha hồng đất
  { troi: '#DCE3E6', dat: '#B9C4C6', vang: '#E0A183', net: '#7C8A8E', lop: ['#8C9A9C', '#6E7D80', '#556367'] },
  // giữa trưa — xanh lục nhạt, nắng cao
  { troi: '#E3E7DC', dat: '#C2CBB8', vang: '#D9C06B', net: '#7E8A75', lop: ['#96A388', '#77856B', '#5B6752'] },
  // chiều muộn — đất nung
  { troi: '#EBE2D8', dat: '#D2BFAC', vang: '#C4714F', net: '#8B7A69', lop: ['#A8907A', '#8A7360', '#6B5A4B'] },
  // đêm — chàm sâu
  { troi: '#2C3742', dat: '#1E2730', vang: '#C9CFD4', net: '#5A6874', lop: ['#3A4653', '#2E3945', '#242D37'] },
];

/** Băm nhỏ, tất định — không dùng `Math.random`, hình phải trả về y hệt mỗi lần. */
function bam(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function hinhChoCau(khoa: string): HinhThe {
  const h = bam(khoa);
  const b = BANG[h % BANG.length];
  const soLop = 2 + ((h >> 3) % 2); // 2 hoặc 3 lớp
  const lop = Array.from({ length: soLop }, (_, i) => ({
    // Lớp sau thấp hơn lớp trước — đúng luật phối cảnh: càng xa càng lùi xuống chân trời.
    cao: 0.5 - i * 0.12 + (((h >> (5 + i * 3)) % 7) - 3) * 0.018,
    lech: (((h >> (11 + i * 4)) % 100) / 100) * 0.6 - 0.3,
    mau: b.lop[i % b.lop.length],
  }));
  return {
    troi: b.troi,
    dat: b.dat,
    vang: b.vang,
    net: b.net,
    lop,
    vangX: 0.24 + (((h >> 17) % 100) / 100) * 0.52,
    // Vầng tròn không bao giờ chạm mép trên, cũng không lặn hẳn — giữ nó ở khoảng thở.
    vangY: 0.26 + (((h >> 23) % 100) / 100) * 0.2,
  };
}
