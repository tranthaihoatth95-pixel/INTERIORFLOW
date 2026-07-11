/**
 * lib/report-deck.ts — Deck BÁO CÁO NGHIÊN CỨU dựng bằng CHẶNG PRESENT của app.
 *
 * Nội dung: đánh giá chiến lược độc lập "ID Flow & hệ sinh thái EFC — .idf có nên là
 * nền móng?" (rút gọn trung thực từ báo cáo 51 nguồn ~/Downloads/EFC-idf-Danh-gia-chien-luoc.html).
 * Dùng CHÍNH renderSlide (lib/slides) + buildDeckPdf (lib/present-demo) — chứng minh chặng
 * Present xuất được bản trình bày quiet-luxury editorial. Font 'Editorial' (serif thanh),
 * text-forward (không ảnh), tông đá ấm. 0 AI, 0 mạng.
 *
 * Đây là nội dung SHOWCASE nội bộ (về chính sản phẩm), tách khỏi deck khách (Detech).
 */
import type { PresentDeck } from '@/lib/present-demo';
import { PRESENT_DARK, PRESENT_LIGHT } from '@/lib/present-demo';

export const RESEARCH_DECK: PresentDeck = {
  id: 'efc-idf-research',
  brand: 'InteriorFlow · Nghiên cứu chiến lược',
  project: 'ID Flow & hệ sinh thái EFC — Đánh giá định dạng .idf',
  fonts: 'Editorial',
  slides: [
    {
      layout: 'Cover',
      theme: PRESENT_DARK,
      kicker: 'Báo cáo nghiên cứu chiến lược · 2026',
      title: 'ID Flow & hệ sinh thái EFC: định dạng .idf có nên là nền móng?',
      body: ['Đánh giá độc lập kiến trúc kỹ thuật & định vị thị trường', '51 nguồn · SWOT · 5 khuyến nghị ưu tiên'],
    },
    {
      layout: 'Quote',
      theme: PRESENT_DARK,
      kicker: '',
      title: 'Lõi ý tưởng đúng hướng — nhưng ba giả định nền phải sửa trước khi xây tiếp.',
      body: ['Kết luận cốt lõi'],
    },
    {
      layout: 'Nội dung + ảnh',
      theme: PRESENT_LIGHT,
      kicker: 'Bối cảnh',
      title: 'Autodesk mất thiện cảm, đúng lúc thế hệ AI-native xuất hiện',
      body: [
        'Autodesk tăng giá liên tục, bỏ chiết khấu gia hạn, ép subscription-only.',
        'BSA và Nghị quyết 397 siết bản quyền phần mềm — tạo áp lực tìm lựa chọn hợp pháp, rẻ hơn.',
        'Một cụm startup AI-native (Motif, Arcol, Qonic, Snaptrude) nổi lên thách thức Revit.',
      ],
    },
    {
      layout: 'Nội dung + ảnh',
      theme: PRESENT_LIGHT,
      kicker: 'Kiến trúc',
      title: 'Container đúng chỗ, lõi hình học lệch chỗ',
      body: [
        '.idf nên là container nội bộ — đừng đặt cược thành chuẩn ngành sớm (bài học DWG, IFC, USD, dotbim).',
        'SQLite làm container có tiền lệ chính thống: Library of Congress, Adobe Lightroom.',
        'Nhưng SQLite single-writer là giới hạn thật cho cộng tác đa người viết đồng thời.',
      ],
    },
    {
      layout: 'Quote',
      theme: PRESENT_DARK,
      kicker: '',
      title: 'glTF + Draco làm lõi hình học là rủi ro chí tử — không phải chi tiết kỹ thuật.',
      body: ['Rủi ro nền tảng'],
    },
    {
      layout: 'Nội dung + ảnh',
      theme: PRESENT_LIGHT,
      kicker: 'Hình học',
      title: 'Vì sao glTF không thể là kernel',
      body: [
        'glTF là định dạng biểu diễn hiển thị (vis-rep), không phải mô hình chính xác (B-rep).',
        'Mọi module chỉnh sửa dựng trên nó sẽ kế thừa sai số nền tảng.',
        'Cần kernel hình học thật (Open Cascade) cho mọi thao tác đo–vẽ–sửa.',
      ],
    },
    {
      layout: 'Nội dung + ảnh',
      theme: PRESENT_LIGHT,
      kicker: 'AI on-device',
      title: 'Module AI lạc hậu, nhưng thực dụng',
      body: [
        'RNN / Markov / ARM lạc hậu so với SLM on-device 2026.',
        'Đổi lại: chạy được trên máy yếu, offline — đúng ràng buộc thực tế của studio.',
        'Data flywheel chưa có bằng chứng thực nghiệm nào trong ngành AEC — đừng dựa vào nó để định giá.',
      ],
    },
    {
      layout: 'Nội dung + ảnh',
      theme: PRESENT_LIGHT,
      kicker: 'Nguyên tắc',
      title: 'Quản trị AI đang đi đúng chuẩn ngành',
      body: [
        '“AI chỉ đề xuất, không tự ghi” khớp chuẩn đã kiểm chứng: Figma, UpCodes, Solibri.',
        'Human-in-the-loop: người quyết định cuối, máy dọn đường.',
        'Minh bạch nguồn dữ liệu — nền cho niềm tin của kiến trúc sư.',
      ],
    },
    {
      layout: 'Nội dung + ảnh',
      theme: PRESENT_LIGHT,
      kicker: 'Thị trường',
      title: 'Khe hở có thật, đang được luật mở rộng',
      body: [
        'Hiểu đúng pain point Việt Nam: giá license cao, cần tốc độ và ngôn ngữ bản địa.',
        'enjiCAD, VinaCAD đã chứng minh ngách nội địa giá rẻ khả thi.',
        'Chính sách công nghiệp (NQ 52, 68, Luật CNCNS 2025) thuận cho phần mềm trong nước.',
      ],
    },
    {
      layout: 'Nội dung + ảnh',
      theme: PRESENT_LIGHT,
      kicker: 'Cạnh tranh',
      title: 'Đối thủ vốn lớn, nhưng cùng đứng ngoài ngách Việt',
      body: [
        'Motif (46 triệu USD, cựu Co-CEO Autodesk) và cụm Arcol/Qonic/Snaptrude định vị gần y hệt.',
        'Lợi thế của ta không phải công nghệ — mà là ngách VN: giá, tiếng Việt, quy trình bản địa.',
        'Lịch sử cho thấy “định dạng mở + SDK” chưa từng đủ để tự tạo chuẩn ngành mới.',
      ],
    },
    {
      layout: 'Nội dung + ảnh',
      theme: PRESENT_LIGHT,
      kicker: 'Tổng hợp — SWOT',
      title: 'Bốn mặt của ván cược',
      body: [
        'Mạnh: hiểu pain point VN; nguyên tắc AI đọc–đề-xuất đúng chuẩn ngành.',
        'Yếu: lõi hình học glTF; SQLite single-writer; kiến trúc ML lạc hậu.',
        'Cơ hội: luật siết bản quyền; chính sách công nghệ trong nước.',
        'Nguy: đối thủ vốn vượt trội; rủi ro sở hữu trí tuệ chưa được luật sư rà.',
      ],
    },
    {
      layout: 'Nội dung + ảnh',
      theme: PRESENT_DARK,
      kicker: 'Khuyến nghị',
      title: 'Năm hành động ưu tiên',
      body: [
        'Đổi lõi hình học sang kernel B-rep thật — bỏ glTF khỏi vai trò mô hình.',
        'Giữ .idf là container nội bộ; đừng theo đuổi chuẩn ngành khi chưa có người dùng.',
        'Hoãn connector trả phí tới khi có tập user thật (bài học food4Rhino).',
        'Cắm rễ ngách Việt Nam: giá minh bạch, tiếng Việt, tuân thủ luật bản quyền.',
        'Rà soát sở hữu trí tuệ với luật sư trong nước trước khi mở rộng.',
      ],
    },
    {
      layout: 'Quote',
      theme: PRESENT_DARK,
      kicker: '',
      title: 'Ba điểm không được sai: lõi hình học, đối thủ vốn lớn, và sở hữu trí tuệ.',
      body: ['Sai ở đây, phần còn lại không cứu được'],
    },
    {
      layout: 'Cover',
      theme: PRESENT_DARK,
      kicker: 'InteriorFlow · 2026',
      title: 'Đánh giá độc lập, để quyết định tỉnh táo',
      body: ['51 nguồn tham khảo · SWOT · lộ trình ưu tiên', 'Dựng bằng chặng Present của InteriorFlow'],
    },
  ],
};
