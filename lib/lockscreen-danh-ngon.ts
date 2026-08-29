/**
 * lib/lockscreen-danh-ngon.ts — CÂU THẬT CỦA NGƯỜI THẬT, cho mặt sau thẻ khoá.
 *
 * Hoà chốt 29/08: *"mặt sau là 1 câu ngẫu nhiên về thiết kế — câu của người nổi tiếng, KHÔNG BỊA.
 * Câu nói thể hiện to rõ, đẹp."*
 *
 * 🔴 ĐÈ MỘT LUẬT CŨ, CÓ CHỦ Ý. `components/studio/LockScreen.tsx` từng ghi trong chú thích:
 * *"CẤM khẩu hiệu năng suất, quảng cáo, **trích dẫn gán tên tác giả**"*. Luật đó sinh ra để chặn
 * việc **bịa câu rồi gán bừa một cái tên** — bệnh thật, và là họ hàng của `F-NHAN-BIA` (bịa
 * danh tính). Nó KHÔNG cấm trích dẫn có thật, có nguồn. Nay đổi cách chặn: thay vì cấm cả loại,
 * **bắt mỗi câu phải khai nguồn** — `scripts/../lockscreen-danh-ngon.test.ts` chặn nếu thiếu.
 *
 * BA LUẬT CHO BẢNG NÀY, ai thêm câu phải theo:
 *   ① **Không bịa.** Thêm câu = phải biết ai nói và nói ở đâu. Không chắc thì KHÔNG thêm.
 *   ② **Trích ngắn, có tên.** Một câu, dưới ~25 chữ, luôn kèm tên + vai. Không trích cả đoạn.
 *   ③ **Câu hay bị gán nhầm thì phải ghi rõ ai mới là người nói** (trường `luuY`) — bảng này
 *      chữa nhầm lẫn chứ không nhân bản nó.
 */

export type DanhNgon = {
  /** Nguyên văn tiếng Anh (hoặc bản Anh phổ biến nếu gốc là tiếng khác). */
  en: string;
  /** Bản tiếng Việt — DỊCH, không diễn giải thêm ý không có trong nguyên văn. */
  vi: string;
  /** Ai nói. Bắt buộc. */
  ai: string;
  /** Vai — để người đọc biết vì sao câu này đáng nghe. Bắt buộc. */
  vai: string;
  /** Nguồn / xuất xứ. Bắt buộc — đây là cái chặn việc bịa. */
  nguon: string;
  /** Chỉ điền khi câu này hay bị gán nhầm cho người khác. */
  luuY?: string;
};

export const DANH_NGON: DanhNgon[] = [
  {
    en: 'Good design is as little design as possible.',
    vi: 'Thiết kế tốt là thiết kế càng ít càng tốt.',
    ai: 'Dieter Rams',
    vai: 'thiết kế công nghiệp, Braun',
    nguon: 'Nguyên tắc thứ mười trong “Mười nguyên tắc của thiết kế tốt”, thập niên 1970',
  },
  {
    en: 'Less, but better.',
    vi: 'Ít hơn, nhưng tốt hơn.',
    ai: 'Dieter Rams',
    vai: 'thiết kế công nghiệp, Braun',
    nguon: 'Nguyên văn tiếng Đức “Weniger, aber besser”',
    luuY: 'Khác với “Less is more” của Mies van der Rohe — Rams nói về CHẤT, Mies nói về LƯỢNG.',
  },
  {
    en: 'The details are not the details. They make the design.',
    vi: 'Chi tiết không phải là tiểu tiết. Chính chúng làm nên thiết kế.',
    ai: 'Charles Eames',
    vai: 'kiến trúc sư & nhà thiết kế nội thất',
    nguon: 'Phát biểu được ghi lại nhiều lần, phổ biến qua Eames Office',
  },
  {
    en: 'Styles come and go. Good design is a language, not a style.',
    vi: 'Phong cách đến rồi đi. Thiết kế tốt là một ngôn ngữ, không phải một phong cách.',
    ai: 'Massimo Vignelli',
    vai: 'nhà thiết kế đồ hoạ & nội thất',
    nguon: '“The Vignelli Canon”, 2010',
  },
  {
    en: 'Perfection is attained not when there is nothing more to add, but when there is nothing more to remove.',
    vi: 'Sự hoàn hảo đạt được không phải khi không còn gì để thêm, mà khi không còn gì để bớt.',
    ai: 'Antoine de Saint-Exupéry',
    vai: 'phi công & nhà văn',
    nguon: '“Terre des hommes” (Đất người), 1939 — viết về thiết kế máy bay',
    luuY: 'Câu này nói về KỸ THUẬT HÀNG KHÔNG trước khi nó thành châm ngôn thiết kế.',
  },
  {
    en: 'God is in the details.',
    vi: 'Thượng đế nằm trong chi tiết.',
    ai: 'Ludwig Mies van der Rohe',
    vai: 'kiến trúc sư, giám đốc Bauhaus cuối cùng',
    nguon: 'Câu nói gắn liền với Mies suốt sự nghiệp',
    luuY: 'Có bản “The devil is in the details” — nghĩa ngược hẳn, và không phải của Mies.',
  },
  {
    en: 'Form ever follows function.',
    vi: 'Hình thức luôn đi theo công năng.',
    ai: 'Louis Sullivan',
    vai: 'kiến trúc sư, “cha đẻ nhà chọc trời”',
    nguon: '“The Tall Office Building Artistically Considered”, 1896',
    luuY: 'Thường bị gán nhầm cho Frank Lloyd Wright — Wright là học trò ông, và còn phản đối cách hiểu máy móc của câu này.',
  },
  {
    en: 'Space and light and order. Those are the things that men need just as much as they need bread or a place to sleep.',
    vi: 'Không gian, ánh sáng và trật tự. Con người cần chúng chẳng kém gì cần bánh mì hay chỗ ngủ.',
    ai: 'Le Corbusier',
    vai: 'kiến trúc sư & nhà quy hoạch',
    nguon: 'Phát biểu được trích rộng rãi trong các tuyển tập về ông',
  },
  {
    en: 'Always design a thing by considering it in its next larger context.',
    vi: 'Luôn thiết kế một vật bằng cách đặt nó vào bối cảnh lớn hơn liền kề.',
    ai: 'Eero Saarinen',
    vai: 'kiến trúc sư & nhà thiết kế đồ nội thất',
    nguon: 'Time, 2/7/1956 — “a chair in a room, a room in a house, a house in an environment”',
  },
  {
    en: 'Design is not just what it looks like and feels like. Design is how it works.',
    vi: 'Thiết kế không chỉ là trông thế nào và chạm vào ra sao. Thiết kế là nó vận hành thế nào.',
    ai: 'Steve Jobs',
    vai: 'đồng sáng lập Apple',
    nguon: 'Phỏng vấn The New York Times Magazine, 30/11/2003',
  },
  {
    en: 'There are three responses to a piece of design — yes, no, and WOW! Wow is the one to aim for.',
    vi: 'Có ba phản ứng trước một thiết kế — có, không, và WOW! Wow mới là cái đáng nhắm tới.',
    ai: 'Milton Glaser',
    vai: 'nhà thiết kế đồ hoạ, tác giả logo I ♥ NY',
    nguon: 'Câu nói gắn với ông, được trích rộng rãi trong giới thiết kế',
  },
  {
    en: 'When I am working on a problem, I never think about beauty. But when I have finished, if the solution is not beautiful, I know it is wrong.',
    vi: 'Khi đang giải một bài toán, tôi không bao giờ nghĩ đến cái đẹp. Nhưng khi xong, nếu lời giải không đẹp, tôi biết là mình sai.',
    ai: 'Buckminster Fuller',
    vai: 'kiến trúc sư & nhà phát minh mái vòm trắc địa',
    nguon: 'Câu nói được trích rộng rãi, gắn với ông trong nhiều tuyển tập',
  },
  {
    en: 'You cannot simply put something new into a place. You have to absorb what you see around you.',
    vi: 'Không thể chỉ đặt một thứ mới vào một chỗ. Anh phải thấm lấy những gì đang có quanh nó.',
    ai: 'Tadao Ando',
    vai: 'kiến trúc sư, giải Pritzker 1995',
    nguon: 'Phát biểu được trích rộng rãi trong các bài về phương pháp của ông',
  },
  {
    en: 'There are 360 degrees, so why stick to one?',
    vi: 'Có tới 360 độ, cớ gì phải bám lấy một độ?',
    ai: 'Zaha Hadid',
    vai: 'kiến trúc sư, nữ giải Pritzker đầu tiên',
    nguon: 'Câu nói gắn liền với bà, trích trong nhiều bài phỏng vấn và hồ sơ',
  },
  {
    en: 'We should work for simple, good, undecorated things.',
    vi: 'Ta nên làm ra những thứ giản dị, tốt, và không cần trang trí.',
    ai: 'Alvar Aalto',
    vai: 'kiến trúc sư & nhà thiết kế đồ nội thất Phần Lan',
    nguon: 'Phát biểu được trích trong các tuyển tập về Aalto',
  },
  {
    en: 'Never design anything that cannot be made.',
    vi: 'Đừng bao giờ thiết kế thứ không làm ra được.',
    ai: 'Jean Prouvé',
    vai: 'thợ nguội kiêm nhà thiết kế kết cấu',
    nguon: 'Nguyên tắc nghề gắn với ông, trích rộng rãi trong tài liệu về xưởng Prouvé',
  },
];

/**
 * Câu cho lần khoá này. Ngẫu nhiên THẬT (mỗi lần khoá một câu khác) — khác `dailyLine()` ở mặt
 * trước, vốn cố định theo NGÀY. Cố ý khác nhau: mặt trước là nền tĩnh, mặt sau là phần thưởng
 * cho việc lật thẻ. Tránh lặp lại ngay câu vừa hiện.
 */
let cauTruoc = -1;
export function danhNgonNgauNhien(): DanhNgon {
  if (DANH_NGON.length < 2) return DANH_NGON[0];
  let i = cauTruoc;
  while (i === cauTruoc) i = Math.floor(Math.random() * DANH_NGON.length);
  cauTruoc = i;
  return DANH_NGON[i];
}
