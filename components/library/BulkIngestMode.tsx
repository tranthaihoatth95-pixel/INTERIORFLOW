'use client';

import { useRef, useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { pushLibraryToast } from './LibraryToast';

interface Dropped {
  id: string;
  name: string;
  size: number;
  kind: string;
}

const KIND_BY_EXT: Record<string, string> = {
  jpg: 'Ảnh', jpeg: 'Ảnh', png: 'Ảnh', webp: 'Ảnh', gif: 'Ảnh',
  dwg: 'Bản vẽ', dxf: 'Bản vẽ', idf: 'Dự án IF',
  pdf: 'Tài liệu', docx: 'Tài liệu', pptx: 'Trình bày',
  xlsx: 'Bảng tính', csv: 'Bảng tính',
  mp4: 'Video', mov: 'Video', zip: 'Gói', ifpack: 'Gói dự án',
};

function kindOf(name: string): string {
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : '';
  return KIND_BY_EXT[ext] ?? 'Khác';
}

function fmt(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * "Nạp hàng loạt" — MỘT CHẾ ĐỘ của Thư viện sheet, không phải trang riêng
 * (`docs/SPEC-NAVIGATION-MODEL.md` §1: `/library/ingest` tràn full màn, không rõ thuộc lớp nào).
 *
 * ⚠️ PHẠM VI CÓ CHỦ Ý — xem `docs/BAO-CAO-G4-LIB.md`: chế độ này làm phần LÕI (thả nhiều tệp →
 * nhận loại → đưa vào kho). Bộ công cụ nâng cao của trang cũ (chưng cất manifest · AI Content
 * Strategist) VẪN Ở TRANG `/library/ingest`, CHƯA gộp, vì gộp trọn đòi xoá trang đó + bỏ popover
 * `[+]` trong `components/LibraryPanel.tsx` — đúng chỗ `PLAN-LIBRARY-GATEWAY` mục 0.1 cảnh báo là
 * ĐẢO NGƯỢC kiến trúc đã chốt tháng 7, và cũng NGOÀI vùng code G4. Chờ Hoà quyết, không tự chọn.
 */
export function BulkIngestMode({ onDone }: { onDone: () => void }) {
  const tr = useT();
  const [files, setFiles] = useState<Dropped[]>([]);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (list: FileList) => {
    setFiles((prev) => [
      ...prev,
      ...Array.from(list).map((f) => ({
        id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 7)}`,
        name: f.name,
        size: f.size,
        kind: kindOf(f.name),
      })),
    ]);
  };

  return (
    <div className="ingest">
      <div
        className={drag ? 'drop over' : 'drop'}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setDrag(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files?.length) add(e.dataTransfer.files);
        }}
      >
        <UploadCloud size={26} strokeWidth={1.5} />
        <b>{tr('Thả nhiều tệp vào đây', 'Drop multiple files here')}</b>
        <span>{tr('Ảnh · bản vẽ · PDF · bảng tính — tự nhận loại, không cần chọn trước', 'Images · drawings · PDF · sheets — type detected automatically')}</span>
        <button type="button" className="pickbtn" onClick={() => inputRef.current?.click()}>
          {tr('Chọn tệp từ máy', 'Choose files')}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          data-testid="lib-ingest-input"
          onChange={(e) => {
            if (e.target.files) add(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {files.length > 0 && (
        <div className="droplist">
          {files.map((f) => (
            <div className="droprow" key={f.id}>
              <FileText size={13} strokeWidth={1.75} />
              <span className="n">{f.name}</span>
              <span className="k">{f.kind}</span>
              <span className="s">{fmt(f.size)}</span>
              <button
                type="button"
                className="rm"
                aria-label={tr('Bỏ khỏi danh sách', 'Remove')}
                onClick={() => setFiles((p) => p.filter((x) => x.id !== f.id))}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="ingestft">
        <span>{files.length > 0 ? tr(`${files.length} tệp sẵn sàng`, `${files.length} file(s) ready`) : tr('Chưa có tệp nào', 'No files yet')}</span>
        <button
          type="button"
          className="pub"
          disabled={files.length === 0}
          onClick={() => {
            pushLibraryToast(tr(`Đã đưa ${files.length} tệp vào kho — chờ chủ studio duyệt`, `Sent ${files.length} file(s) to the store — awaiting approval`));
            setFiles([]);
            onDone();
          }}
        >
          {tr('Đưa vào kho', 'Add to store')}
        </button>
      </div>
    </div>
  );
}
