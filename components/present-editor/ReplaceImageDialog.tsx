'use client';

/**
 * components/present-editor/ReplaceImageDialog.tsx — hộp thoại "Thay ảnh…" (VIỆC 2d, 28/07).
 * 2 lựa chọn: từ thư viện Reference (đóng dialog, báo parent mở tab Reference ở chế độ chọn)
 * hoặc từ máy tính (file picker tại chỗ, đọc dataURL rồi báo parent luôn).
 */

import { useRef } from 'react';
import { FolderOpen, Upload } from 'lucide-react';

interface Props {
  onPickFromLibrary: () => void;
  onPickFromDisk: (dataUrl: string) => void;
  onClose: () => void;
}

export default function ReplaceImageDialog({ onPickFromLibrary, onPickFromDisk, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const dataUrl = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = () => rej(r.error);
      r.readAsDataURL(f);
    });
    onPickFromDisk(dataUrl);
  }

  return (
    <div
      role="dialog"
      aria-label="Thay ảnh"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'rgba(0,0,0,.45)',
        display: 'grid',
        placeItems: 'center',
      }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 320,
          maxWidth: '90vw',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 18,
          boxShadow: '0 24px 70px rgba(0,0,0,.5)',
          color: 'var(--t1)',
        }}
      >
        <strong style={{ display: 'block', fontSize: 14.5, marginBottom: 4 }}>Thay ảnh</strong>
        <p style={{ fontSize: 12, color: 'var(--t4)', margin: '0 0 14px' }}>
          Giữ nguyên vị trí, kích thước và crop của ảnh cũ.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button type="button" onClick={onPickFromLibrary} style={choiceBtn}>
            <FolderOpen size={15} /> Từ thư viện
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} style={choiceBtn}>
            <Upload size={15} /> Từ máy tính
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 14,
            width: '100%',
            padding: '8px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--t3)',
            fontSize: 12.5,
            cursor: 'pointer',
          }}
        >
          Huỷ
        </button>
      </div>
    </div>
  );
}

const choiceBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid var(--accent)',
  background: 'var(--accent-soft)',
  color: 'var(--accent)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};
