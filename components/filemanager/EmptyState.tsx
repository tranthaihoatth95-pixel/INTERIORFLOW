'use client';

import { FM } from './fm-tokens';

/**
 * Khuôn "Trống" — VẬT MẪU mock-files-polished.html `.empty`/`.fan`/`.cta` (ref #6), làm giống hệt:
 * fan 3 ảnh xoay lệch viền trắng 4px, CTA capsule ĐEN cao 48.
 */
export function EmptyState({ onUpload, canUpload, folderName }: { onUpload: () => void; canUpload: boolean; folderName: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="relative mb-[26px] h-[150px] w-[200px]">
        <div
          className="absolute h-[104px] w-[104px] rounded-[20px] border-4 border-white"
          style={{ background: 'linear-gradient(135deg,#b89b7a,#8a6f52)', boxShadow: '0 10px 26px rgba(40,38,35,.16)', left: 8, top: 14, transform: 'rotate(-10deg)' }}
        />
        <div
          className="absolute h-[104px] w-[104px] rounded-[20px] border-4 border-white"
          style={{ background: 'linear-gradient(135deg,#8a9a8f,#5f6f66)', boxShadow: '0 10px 26px rgba(40,38,35,.16)', right: 8, top: 8, transform: 'rotate(7deg)' }}
        />
        <div
          className="absolute z-[2] h-[104px] w-[104px] rounded-[20px] border-4 border-white"
          style={{ background: 'linear-gradient(135deg,#d9c7b8,#a9987f)', boxShadow: '0 10px 26px rgba(40,38,35,.16)', left: '50%', top: 26, transform: 'translateX(-50%) rotate(-1deg)' }}
        />
      </div>

      <h2 className="m-0 mb-1.5 text-[19px]" style={{ color: FM.ink, letterSpacing: '-0.01em' }}>
        {canUpload ? `Chưa có file trong ${folderName}` : 'Chưa có gì ở đây'}
      </h2>
      <p className="m-0 mb-5 text-[13px]" style={{ color: FM.mut }}>
        {canUpload ? 'Kéo file vào đây — bản vẽ, ảnh khảo sát, brief của khách.' : 'Thư mục chỉ đọc — chưa có nội dung.'}
      </p>

      {canUpload && (
        <button
          type="button"
          onClick={onUpload}
          className="flex h-[48px] items-center rounded-[26px] px-[26px] text-[14px] font-semibold text-white"
          style={{ background: FM.ink, boxShadow: '0 6px 18px rgba(38,38,43,.28)' }}
        >
          Chọn file từ máy
          <small className="ml-2 text-[11px] font-normal" style={{ opacity: 0.65 }}>hoặc kéo thả</small>
        </button>
      )}
    </div>
  );
}
