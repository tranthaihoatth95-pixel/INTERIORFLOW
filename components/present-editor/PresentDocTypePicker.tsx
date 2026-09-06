'use client';

/**
 * Cửa vào Trình chiếu — MÀN CHỜ.
 *
 * 🔴 ĐỔI VAI 20/08 (Hoà bác bản cũ): trước đây vào Present là gặp NGAY một bức tường thẻ mẫu
 * (dải 6 tab có số đếm + lưới 4 cột ảnh lớn) cộng bốn thẻ nguồn to. Nó đọc ra *"phải làm xong
 * mấy bước này Present mới cho làm việc"* — đúng thứ cửa nghiệm thu bắt trượt.
 *
 * Nay: **~80% thở · 20% hành động**. Một hành động CHÍNH, vài LỐI TẮT là **cửa vào chứ không
 * phải bước**, tín hiệu dự án nói khẽ một dòng. Thư viện mẫu KHÔNG mất — nó lùi về sau một lối
 * tắt (`moThuVien`), giữ nguyên 100% lưới cũ bên dưới. Không xoá năng lực nào, chỉ đổi thứ tự
 * gặp mặt.
 *
 * ⛔ Ba thứ bị cấm đích danh, khoá tại đây: không thẻ nguồn to · không "BOQ 0 dòng" · không số
 * đếm giả (xem `NguonLienKet.tsx`).
 * ⛔ Màn chờ phải TĨNH — không thanh chạy, không đếm ngược, không gì tự nhúc nhích.
 *
 * Chốt 10/08 (bốn ô ngang hàng, ô cuối luôn là tạo-trống) vẫn đúng — nhưng nó là luật của THƯ
 * VIỆN MẪU, và thư viện nay nằm sau lối tắt chứ không còn là mặt tiền.
 */

import { useState } from 'react';
import { ArrowLeft, FileSpreadsheet, FileText, Film, Layers3, LayoutTemplate, ListTree, LockKeyhole, Plus, Presentation, Sparkles, BookOpen } from 'lucide-react';
import { useT } from '@/lib/i18n';
import NguonLienKet from './NguonLienKet';

export interface PresentDocTypePickerProps {
  onChooseBlankDeck: () => void;
  onChooseMagicDeck: () => void;
  onChooseMaterialBoard: () => void;
  onChooseBoq: () => void;
  /** [storySet] Hero output — nạp deck "Bộ hồ sơ kể chuyện" 8 trang (lib/present-editor/story-set). */
  onChooseStorySet?: () => void;
  /**
   * Đợt 4 (`docs/phieu-giao/editor-bang-bieu-mau.md`) — mở màn `schedule` (Bảng thống kê), đi
   * đường RIÊNG giống `onChooseBoq` (KHÔNG qua deck/slide). Bỏ trống = thẻ "Bảng thống kê" không
   * hiện (tránh nút giả — luật §9, cùng lý do `onRequestBoq` optional ở `PresentSheets`).
   */
  onChooseSchedule?: () => void;
}

type Kind = 'deck' | 'material' | 'boq' | 'schedule' | 'text' | 'video';

type Template = {
  title: [string, string];
  caption: [string, string];
  image?: string;
  tone?: string;
  enabled: boolean;
  /** Khả năng chưa có editor riêng phải nói thật ngay tại chỗ, không hứa CTA mơ hồ. */
  unavailableReason?: [string, string];
  /** [storySet] thẻ hero — bấm nạp buildStorySetDeck thay vì deck trống. */
  storySet?: boolean;
  /** Đợt 4 — thẻ mở màn `schedule` (Bảng thống kê, đi đường riêng như `boq`). */
  schedule?: boolean;
};

const LIBRARY: Record<Kind, { label: [string, string]; count: string; lead: [string, string]; templates: Template[] }> = {
  deck: {
    label: ['Deck', 'Deck'], count: '04',
    lead: ['Tạo một câu chuyện thiết kế rõ ràng, phù hợp cho từng buổi duyệt.', 'Create a clear design story for every review.'],
    templates: [
      // [storySet] Hero output (chốt 11/08): thẻ ĐẦU danh mục Deck. Ảnh minh hoạ Unsplash
      // (Unsplash License, đã verify 200 image/jpeg 12/08) — người dùng thay bằng ảnh dự án.
      { title: ['Bộ hồ sơ kể chuyện', 'The Story Set'], caption: ['Bộ hồ sơ kể chuyện · 8 trang', 'Story Set · 8 pages'], image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=75', enabled: true, storySet: true },
      // 31/08 — QĐ-1 "demo sạch": ba thẻ này từng lấy thumbnail từ `public/demo/mood*.jpg`.
      // Bộ ảnh đó đã rời bản ship, nên chúng chuyển sang `tone` — đúng khuôn mà các thẻ
      // khác trong chính tệp này vẫn dùng, không đẻ khái niệm mới.
      { title: ['Không gian có câu chuyện', 'A space with a story'], caption: ['Concept tối giản', 'Minimal concept'], tone: '#bcae9e', enabled: true },
      { title: ['Mộc Residence', 'Moc Residence'], caption: ['Hồ sơ khách hàng', 'Client presentation'], tone: '#829aa0', enabled: true },
      { title: ['Phương án 02', 'Option 02'], caption: ['So sánh phương án', 'Option comparison'], tone: '#e2ddce', enabled: true },
    ],
  },
  material: {
    // 06/09 nhãn-nói-thật (lane ĐẦU RA NÓI THẬT). Hai chỗ nói sai, sửa cả hai:
    //  · `count` ghi '04' trong khi bên dưới đúng 3 thẻ — số đếm sai ngay trên nhãn.
    //  · `lead` cũ *"Ghép vật liệu, mã hàng và vùng sử dụng trên một tấm rõ ràng"* đọc ra như
    //    app tự ghép. Đo 06/09: bấm vào ra **trang A3 TRẮNG TRƠN** (17.389.760 px, đúng 1 màu
    //    trắng) — `PresentSheets.tsx` dựng nó từ khuôn `'blank'` và tự khai đúng rằng
    //    `material-a3` "không hứa một editor vật liệu riêng". Trang trắng là ĐÚNG THIẾT KẾ;
    //    thứ sai là câu dẫn hứa nhiều hơn thứ giao ra.
    label: ['Bảng vật liệu', 'Material board'], count: '03',
    lead: ['Mở một khổ A3 trống để bạn tự dàn vật liệu. App chưa tự ghép bảng từ dự án.', 'Opens a blank A3 sheet for you to lay out finishes. The app does not compose the board for you yet.'],
    templates: [
      { title: ['Palette hoàn thiện', 'Finish palette'], caption: ['Mở khổ A3 để tự dàn', 'Open an A3 workspace'], tone: '#e5dfd1', enabled: true },
      { title: ['Bảng mẫu dự án', 'Project sample board'], caption: ['Mở khổ A3 để tự dàn', 'Open an A3 workspace'], tone: '#bcae9e', enabled: true },
      { title: ['Bề mặt & sắc độ', 'Surface & tone'], caption: ['Mở khổ A3 để tự dàn', 'Open an A3 workspace'], tone: '#829aa0', enabled: true },
    ],
  },
  boq: {
    label: ['Bảng tính BOQ', 'BOQ spreadsheet'], count: '03',
    lead: ['Dự toán và khối lượng được đọc cùng nhịp với dự án.', 'Quantities and estimates remain in step with your project.'],
    templates: [
      { title: ['Khối lượng tổng', 'Total quantities'], caption: ['Mở bảng tính BOQ', 'Open BOQ spreadsheet'], tone: '#e5dfd1', enabled: true },
      { title: ['Dự toán hoàn thiện', 'Finishes estimate'], caption: ['Đang bổ sung mẫu', 'Templates in progress'], tone: '#d7d1c4', enabled: false },
      { title: ['Đối chiếu vật tư', 'Procurement check'], caption: ['Đang bổ sung mẫu', 'Templates in progress'], tone: '#cbc4b5', enabled: false },
    ],
  },
  // Đợt 4 (`docs/phieu-giao/editor-bang-bieu-mau.md`) — họ ENGINE BẢNG (`TableDocEngine`):
  // schedule → spec-sheet → approval-form là 3 mặt tiền CÙNG một cỗ máy. v1: chỉ `schedule` sống
  // thật, 2 thẻ còn lại khoá kèm lý do năng lực thật (không CTA giả, luật §9).
  schedule: {
    label: ['Bảng & biểu mẫu', 'Tables & forms'], count: '03',
    lead: ['Đếm và trình bày số liệu đọc thẳng từ bản vẽ — sửa tay không lo bị ghi đè.', 'Tally and present figures read straight from the drawing — hand edits are never overwritten.'],
    templates: [
      { title: ['Bảng thống kê cửa & phòng', 'Door & room schedule'], caption: ['Đếm cửa, phòng từ bản vẽ 2D', 'Counts doors and rooms from the 2D drawing'], tone: '#e2ddce', enabled: true, schedule: true },
      { title: ['Bảng thông số kỹ thuật', 'Specification sheet'], caption: ['Chưa có trình soạn bảng thông số', 'No spec-sheet editor yet'], tone: '#d7d1c4', enabled: false, unavailableReason: ['Chưa có bảng thông số kỹ thuật riêng cho từng cấu kiện.', 'There is no per-item specification sheet yet.'] },
      { title: ['Phiếu trình duyệt', 'Approval form'], caption: ['Chưa có trình soạn phiếu trình duyệt', 'No approval-form editor yet'], tone: '#cbc4b5', enabled: false, unavailableReason: ['Chưa có phiếu trình duyệt lưu được vào dự án.', 'There is no project-backed approval form yet.'] },
    ],
  },
  text: {
    label: ['Văn bản', 'Documents'], count: '05',
    lead: ['Văn bản có cấu trúc riêng, không bị nhét vào trang slide.', 'Documents have their own structure, never squeezed into slides.'],
    templates: [
      { title: ['Thuyết minh thiết kế', 'Design narrative'], caption: ['Chưa có trình soạn thảo văn bản', 'No document editor yet'], tone: '#ece8df', enabled: false, unavailableReason: ['Chưa thể tạo hoặc xuất văn bản trong app.', 'Documents cannot be created or exported in the app yet.'] },
      { title: ['Biểu mẫu nghiệm thu', 'Inspection form'], caption: ['Chưa có trình soạn thảo biểu mẫu', 'No form editor yet'], tone: '#ddd7cb', enabled: false, unavailableReason: ['Chưa có biểu mẫu lưu được vào dự án.', 'There is no project-backed form editor yet.'] },
      { title: ['Hợp đồng song ngữ', 'Bilingual agreement'], caption: ['Chưa có trình soạn thảo hợp đồng', 'No agreement editor yet'], tone: '#cfc8bb', enabled: false, unavailableReason: ['Không dùng slide thay cho hợp đồng.', 'Slides are not used as a substitute for agreements.'] },
    ],
  },
  video: {
    label: ['Video', 'Video'], count: '03',
    lead: ['Dựng footage từ chặng 3D thành một nhịp xem có chủ đích.', 'Shape footage from 3D into an intentional viewing rhythm.'],
    templates: [
      { title: ['Walkthrough 60 giây', '60-second walkthrough'], caption: ['Chưa có dựng, xem footage ở 3D', 'No timeline editor; view footage in 3D'], tone: '#d7d1c4', enabled: false, unavailableReason: ['Chưa có cắt, ghép hoặc xuất phim.', 'Trimming, editing, and video export are not available yet.'] },
      { title: ['Phương án ánh sáng', 'Lighting study'], caption: ['Chưa có dựng, xem footage ở 3D', 'No timeline editor; view footage in 3D'], tone: '#cbc4b5', enabled: false, unavailableReason: ['Chưa có dựng phim trong Trình chiếu.', 'There is no video editor in Presenting yet.'] },
      { title: ['Tổng hợp dự án', 'Project reel'], caption: ['Chưa có dựng, xem footage ở 3D', 'No timeline editor; view footage in 3D'], tone: '#cfc8bb', enabled: false, unavailableReason: ['Dữ liệu video chưa có đường xuất tin cậy.', 'Video data has no reliable export path yet.'] },
    ],
  },
};

const KIND_ICON: Record<Kind, typeof Presentation> = {
  deck: Presentation,
  material: Layers3,
  boq: FileSpreadsheet,
  schedule: ListTree,
  text: FileText,
  video: Film,
};

export function PresentDocTypePicker({ onChooseBlankDeck, onChooseMagicDeck, onChooseMaterialBoard, onChooseBoq, onChooseStorySet, onChooseSchedule }: PresentDocTypePickerProps) {
  const tr = useT();
  const [kind, setKind] = useState<Kind>('deck');
  /** Thư viện mẫu là LỐI TẮT, không phải mặt tiền — mặc định đóng, người dùng chủ động mở. */
  const [moThuVien, setMoThuVien] = useState(false);
  const current = LIBRARY[kind];
  const canCreateBlank = kind === 'deck' || kind === 'material';

  const openTemplate = (template: Template) => {
    if (!template.enabled) return;
    if (template.storySet && onChooseStorySet) onChooseStorySet();
    else if (template.schedule && onChooseSchedule) onChooseSchedule();
    else if (kind === 'boq') onChooseBoq();
    else if (kind === 'material') onChooseMaterialBoard();
    else onChooseMagicDeck();
  };

  /* ── MÀN CHỜ (mặc định) ────────────────────────────────────────────────────────────
     80% thở / 20% hành động. Thứ tự đọc: một câu → MỘT hành động chính → tín hiệu khẽ →
     lối tắt nhỏ. Không có bước nào phải làm xong trước. */
  if (!moThuVien) {
    const loiTat: {
      khoa: string;
      nhan: [string, string];
      icon: React.ReactNode;
      chay?: () => void;
      ly?: [string, string];
    }[] = [
      // 06/09 — nhãn cũ 'Bảng vật liệu A3' hứa một bảng đã dựng sẵn; thứ mở ra là trang A3
      // trắng. Cửa vào phải nói đúng thứ nằm sau nó (luật "nút không được nói dối").
      { khoa: 'material', nhan: ['Trang A3 trống để dàn vật liệu', 'Blank A3 for finishes'], icon: <Layers3 size={18} strokeWidth={1.5} />, chay: onChooseMaterialBoard },
      { khoa: 'boq', nhan: ['Khối lượng (BOQ)', 'Bill of quantities'], icon: <FileSpreadsheet size={18} strokeWidth={1.5} />, chay: onChooseBoq },
      { khoa: 'schedule', nhan: ['Bảng thống kê', 'Schedule table'], icon: <ListTree size={18} strokeWidth={1.5} />, chay: onChooseSchedule,
        ly: ['Màn bảng thống kê chưa nối ở chỗ này.', 'The schedule screen is not wired here yet.'] },
      { khoa: 'story', nhan: ['Bộ hồ sơ kể chuyện', 'Story set'], icon: <BookOpen size={18} strokeWidth={1.5} />, chay: onChooseStorySet,
        ly: ['Mẫu bộ hồ sơ kể chuyện chưa nối ở chỗ này.', 'The story set template is not wired here yet.'] },
      { khoa: 'magic', nhan: ['Dựng nhanh bằng Magic', 'Draft with Magic'], icon: <Sparkles size={18} strokeWidth={1.5} />, chay: onChooseMagicDeck },
      { khoa: 'thu-vien', nhan: ['Thư viện mẫu', 'Template library'], icon: <LayoutTemplate size={18} strokeWidth={1.5} />, chay: () => setMoThuVien(true) },
    ];

    return (
      <div style={{ height: '100%', overflowY: 'auto', display: 'grid', placeItems: 'center', padding: '32px 26px 64px' }}>
        <section style={{ width: '100%', maxWidth: 640, textAlign: 'center' }}>
          {/* 06/09 — HẠ VỀ THANG CHỮ WORKSPACE. Đo trước: 36px trong khi thân là 14-16px, tức
              nhịp chữ của Home (thoáng · cá nhân · biểu cảm) đặt vào một bàn làm việc. §11.6 tách
              rõ hai mật độ: workspace nghề là dày · chính xác · theo ngữ cảnh. Vẫn giữ `clamp`
              (co theo khổ màn) và vẫn là chữ LỚN NHẤT màn — thứ hạ xuống là biên độ, không phải
              thứ bậc. */}
          <h1 style={{ margin: 0, color: 'var(--t1)', fontSize: 'clamp(20px, 2.2vw, 28px)', lineHeight: 1.15, letterSpacing: '-.03em', fontWeight: 600 }}>
            {tr('Trình bày dự án này.', 'Present this project.')}
          </h1>
          <p style={{ maxWidth: 430, margin: '10px auto 0', color: 'var(--t3)', fontSize: 14, lineHeight: 1.55 }}>
            {tr('Bắt đầu từ một trang trắng, hoặc mở thẳng thứ bạn cần.',
                'Start from a blank page, or open exactly what you need.')}
          </p>

          {/* MỘT hành động chính — mờ đục, rõ, không tranh chỗ với gì khác. */}
          <button
            type="button"
            onClick={onChooseBlankDeck}
            style={{
              marginTop: 26, padding: '0 22px', height: 44, borderRadius: 'var(--r-3)', border: 0,
              background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 14, fontWeight: 650,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            <Presentation size={16} strokeWidth={1.5} aria-hidden="true" />
            {tr('Bắt đầu trình bày', 'Start presenting')}
          </button>

          {/* Tín hiệu gọn — vai phụ, im lặng khi dự án chưa có gì thật. */}
          <NguonLienKet />

          {/* Lối tắt = CỬA VÀO, không phải bước. Nhỏ, kính mỏng, không đánh số, không thứ tự. */}
          <ul style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, margin: '30px 0 0', padding: 0 }}>
            {loiTat.map((l) => {
              const khoa = !l.chay;
              const lyId = `loi-tat-ly-${l.khoa}`;
              return (
                <li key={l.khoa}>
                  <button
                    type="button"
                    className="kinh-noi kinh-noi--mong"
                    aria-disabled={khoa || undefined}
                    aria-describedby={khoa ? lyId : undefined}
                    onClick={khoa ? undefined : l.chay}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: '0 13px', height: 36, borderRadius: 'var(--r-3)',
                      border: '1px solid var(--vien-mo)', color: 'var(--t1)', fontSize: 12.5,
                      cursor: khoa ? 'default' : 'pointer', opacity: khoa ? 'var(--mo-vo-hieu)' : 1,
                    }}
                  >
                    <span aria-hidden="true" style={{ color: 'var(--t3)', display: 'inline-flex' }}>{l.icon}</span>
                    {tr(...l.nhan)}
                  </button>
                  {khoa && (
                    <span id={lyId} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
                      {tr(...(l.ly ?? ['Chưa nối ở chỗ này.', 'Not wired here yet.']))}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 'clamp(34px, 7vh, 76px) 26px 96px' }}>
      <section style={{ width: '100%', maxWidth: 1120, margin: '0 auto' }}>
        <button
          type="button"
          onClick={() => setMoThuVien(false)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 18, padding: '0 11px', height: 32, borderRadius: 'var(--r-2)', border: '1px solid var(--vien-mo)', background: 'var(--card)', color: 'var(--t2)', fontSize: 12, cursor: 'pointer' }}
        >
          <ArrowLeft size={14} aria-hidden="true" /> {tr('Về màn chờ', 'Back')}
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 750, letterSpacing: '.09em' }}>
            <span aria-hidden="true" style={{ display: 'inline-block', width: 7, height: 7, marginRight: 7, borderRadius: '50%', background: 'currentColor' }} />
            {tr('THƯ VIỆN HỒ SƠ', 'DOCUMENT LIBRARY')}
          </div>
          <h1 style={{ margin: '10px 0 7px', color: 'var(--t1)', fontSize: 'clamp(30px, 4vw, 43px)', lineHeight: 1.08, letterSpacing: '-.045em' }}>
            {tr('Bắt đầu từ một mẫu phù hợp.', 'Start with a fitting template.')}
          </h1>
          <p style={{ maxWidth: 540, margin: '0 auto', color: 'var(--t3)', fontSize: 14.5, lineHeight: 1.55 }}>{tr(...current.lead)}</p>
        </div>

        {/* [marker: nguonLienKet] ⚠️ ĐÃ DỜI (20/08) — `<NguonLienKet/>` trước đây đứng NGAY ĐÂY,
            dưới đầu đề thư viện mẫu. Nay nó ở MÀN CHỜ (đầu tệp), dạng một dòng tín hiệu khẽ.
            Không bày lại ở đây: cùng một tin nói hai chỗ là nói hai lần, và thư viện mẫu là nơi
            người dùng đã BIẾT mình muốn gì rồi. Ghi lại tại chỗ thay vì xoá lặng, để phiên sau
            đi tìm marker này không tưởng nó biến mất. */}
        <nav aria-label={tr('Loại hồ sơ', 'Document type')} style={{ display: 'flex', justifyContent: 'center', gap: 5, margin: '32px 0 24px', paddingBottom: 12, borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
          {(Object.keys(LIBRARY) as Kind[]).map((key) => {
            const item = LIBRARY[key];
            const selected = key === kind;
            const Icon = KIND_ICON[key];
            return <button key={key} type="button" onClick={() => setKind(key)} style={{ flex: 'none', height: 34, padding: '0 12px', border: 0, borderRadius: 10, cursor: 'pointer', background: selected ? 'var(--accent-soft)' : 'transparent', color: selected ? 'var(--accent)' : 'var(--t3)', fontSize: 12, fontWeight: selected ? 650 : 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon size={14} strokeWidth={1.5} aria-hidden="true" />
              {tr(...item.label)} <small style={{ marginLeft: 2, opacity: .68 }}>{item.count}</small>
            </button>;
          })}
        </nav>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 18 }} className="present-template-grid">
          {current.templates.map((template, index) => (
            <button key={template.title[0]} type="button" onClick={() => openTemplate(template)} disabled={!template.enabled} title={!template.enabled ? tr(...(template.unavailableReason ?? ['Chưa khả dụng', 'Not available yet'])) : undefined} style={{ minWidth: 0, padding: 0, border: 0, background: 'transparent', color: 'inherit', textAlign: 'left', cursor: template.enabled ? 'pointer' : 'not-allowed', opacity: template.enabled ? 1 : .56 }}>
              <div style={{ position: 'relative', height: 185, overflow: 'hidden', borderRadius: 14, background: template.tone ?? '#292733', boxShadow: '0 14px 32px -24px rgba(0,0,0,.8)' }}>
                {template.image ? <img src={template.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'saturate(.74) contrast(.94)' }} /> : null}
                {kind === 'boq' ? <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent 0 26px, rgba(63,54,40,.22) 27px 28px), repeating-linear-gradient(90deg, transparent 0 59px, rgba(63,54,40,.18) 60px 61px)' }} /> : null}
                <div style={{ position: 'absolute', inset: 0, background: template.image ? 'linear-gradient(180deg, transparent 34%, rgba(0,0,0,.66))' : 'linear-gradient(145deg, rgba(255,255,255,.12), rgba(0,0,0,.24))' }} />
                {template.storySet ? <span style={{ position: 'absolute', top: 12, left: 12, padding: '4px 9px', borderRadius: 10, background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '.07em' }}>{tr('MẪU ĐẶC TRƯNG', 'SIGNATURE')}</span> : null}
                {!template.enabled ? <span aria-label={tr('Chưa khả dụng', 'Not available')} style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 10, background: 'rgba(15,15,18,.65)', color: '#fff' }}><LockKeyhole size={14} aria-hidden="true" /></span> : null}
                <strong style={{ position: 'absolute', left: 16, right: 16, bottom: 15, color: kind === 'boq' || kind === 'text' ? '#312c26' : '#fff', fontSize: 17, lineHeight: 1.08, letterSpacing: '-.025em' }}>{tr(...template.title)}</strong>
              </div>
              <div style={{ marginTop: 11, color: 'var(--t1)', fontSize: 13.5, fontWeight: 650 }}>{tr(...template.caption)}</div>
              {!template.enabled ? <div style={{ marginTop: 3, color: 'var(--t4)', fontSize: 11 }}>{tr(...(template.unavailableReason ?? ['Chưa khả dụng', 'Not available yet']))}</div> : null}
            </button>
          ))}

          <button type="button" onClick={canCreateBlank ? (kind === 'material' ? onChooseMaterialBoard : onChooseBlankDeck) : undefined} disabled={!canCreateBlank} aria-label={tr('Tạo hồ sơ trống', 'Create blank document')} style={{ height: 185, border: '1px dashed var(--border)', borderRadius: 14, background: 'transparent', color: canCreateBlank ? 'var(--t3)' : 'var(--t4)', cursor: canCreateBlank ? 'pointer' : 'not-allowed', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 11 }}>
            <span style={{ width: 42, height: 42, borderRadius: '50%', border: '1px solid currentColor', display: 'grid', placeItems: 'center' }}><Plus size={20} strokeWidth={1.5} /></span>
            <span style={{ fontSize: 12, fontWeight: 650 }}>{kind === 'material' ? tr('Tạo bảng A3 trống', 'Create blank A3 board') : tr('Tạo hồ sơ trống', 'Create blank document')}</span>
            {!canCreateBlank ? <span style={{ fontSize: 10 }}>{tr('Chưa khả dụng', 'Not available yet')}</span> : null}
          </button>
        </div>
      </section>
      <style jsx>{`@media (max-width: 780px) { .present-template-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 16px 12px !important; } } @media (max-width: 420px) { .present-template-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

export default PresentDocTypePicker;
