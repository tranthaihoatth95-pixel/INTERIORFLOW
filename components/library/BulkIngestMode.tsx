'use client';

import { useRef, useState } from 'react';
import { UploadCloud, FileText, Box, X } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { pushLibraryToast } from './LibraryToast';
import { kiemToanVenIdfc } from '@/lib/cad/idfc-integrity';
import { importIdfc, lastImportIdfcError, type ParsedIdfc } from '@/lib/cad/idfc';
import { saveIdfcItems } from '@/lib/library/idfc-store';

interface Dropped {
  id: string;
  name: string;
  size: number;
  kind: string;
  /** VIỆC 1 M-IDFC (07/08) — riêng tệp `.idfc` được ĐỌC THẬT ngay lúc thả: parse qua
   * `importIdfc`, hợp lệ thì giữ dữ liệu chờ "Đưa vào kho", hỏng thì mang thông báo lỗi CỤ THỂ
   * (`lastImportIdfcError`) hiện ngay trên dòng — không đợi tới lúc bấm nút mới báo. Các loại tệp
   * khác giữ hành vi cũ (chỉ nhận diện loại). */
  idfc?: ParsedIdfc;
  error?: string;
  /** IDFC-MANIFEST-INTEGRITY-001 (26/08) — cảnh báo toàn vẹn. Khác `error` một cách CÓ CHỦ Ý:
   * `error` = không nhập được; `canhBao` = **nhập được nhưng đừng tin ngay**. Gộp hai thứ này
   * là hoặc chặn oan một tệp còn cứu được, hoặc im lặng cho qua một tệp đã bị sửa. */
  canhBao?: string[];
}

const KIND_BY_EXT: Record<string, string> = {
  jpg: 'Ảnh', jpeg: 'Ảnh', png: 'Ảnh', webp: 'Ảnh', gif: 'Ảnh',
  dwg: 'Bản vẽ', dxf: 'Bản vẽ', idf: 'Dự án IF', idfc: 'Cấu kiện IF',
  pdf: 'Tài liệu', docx: 'Tài liệu', pptx: 'Trình chiếu',
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
    for (const f of Array.from(list)) {
      const base: Dropped = {
        id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 7)}`,
        name: f.name,
        size: f.size,
        kind: kindOf(f.name),
      };
      if (base.kind === 'Cấu kiện IF') {
        // đọc + parse ngay — lỗi báo tại dòng, kèm lý do thật từ importIdfc
        void f.text().then(async (txt) => {
          const parsed = importIdfc(txt);
          // IDFC-MANIFEST-INTEGRITY-001 — kiểm dấu toàn vẹn. Ngữ nghĩa CẢNH BÁO, KHÔNG CHẶN
          // (cùng lối `restoreIfpack`): tệp lệch dấu vẫn nhập được, nhưng người dùng PHẢI biết.
          // Tệp chưa ký (`khong-co`) thì im lặng — mọi `.idfc` sinh trước lát này đều thế, báo
          // động ở đó là dạy người dùng bỏ qua cảnh báo.
          const toanVen = parsed ? await kiemToanVenIdfc(txt) : null;
          setFiles((prev) => [
            ...prev,
            parsed
              ? { ...base, idfc: parsed, ...(toanVen?.canhBao.length ? { canhBao: toanVen.canhBao } : {}) }
              : { ...base, error: lastImportIdfcError() ?? tr('File .idfc không đọc được.', 'Cannot read this .idfc file.') },
          ]);
        });
      } else {
        setFiles((prev) => [...prev, base]);
      }
    }
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
        <UploadCloud size={20} strokeWidth={1.5} />
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
              {f.idfc ? <Box size={16} strokeWidth={1.5} /> : <FileText size={16} strokeWidth={1.5} />}
              <span className="n">
                {f.name}
                {f.idfc && (
                  <span style={{ color: 'var(--success)', marginLeft: 6, fontSize: 11 }}>
                    ✓ {f.idfc.meta.name} · {f.idfc.meta.code}
                  </span>
                )}
                {f.canhBao?.length ? (
                  // Cảnh báo toàn vẹn — KHÔNG chặn nhập, nhưng phải đọc được ngay tại dòng, cùng
                  // chỗ với lỗi. Đặt ở nơi khác là đặt ở nơi không ai nhìn.
                  <span style={{ color: 'var(--warning)', marginLeft: 6, fontSize: 11 }}>
                    ⚠ {f.canhBao.join(' ')}
                  </span>
                ) : null}
                {f.error && (
                  <span style={{ color: 'var(--warning)', marginLeft: 6, fontSize: 11 }}>{f.error}</span>
                )}
              </span>
              <span className="k">{f.kind}</span>
              <span className="s">{fmt(f.size)}</span>
              <button
                type="button"
                className="rm"
                aria-label={tr('Bỏ khỏi danh sách', 'Remove')}
                onClick={() => setFiles((p) => p.filter((x) => x.id !== f.id))}
              >
                <X size={14} />
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
            // .idfc hợp lệ vào kho cấu kiện THẬT (idfc-store → kệ "Cấu kiện"); tệp hỏng KHÔNG
            // vào; loại khác giữ hành vi mock cũ (đường ingest thật của chúng chưa có backend).
            const good = files.filter((f) => f.idfc).map((f) => f.idfc!);
            if (good.length) {
              saveIdfcItems(good);
              pushLibraryToast(tr(
                `Đã nhập ${good.length} cấu kiện .idfc vào kệ Cấu kiện`,
                `Imported ${good.length} .idfc component(s) to the Components shelf`,
              ));
            }
            const rest = files.length - good.length - files.filter((f) => f.error).length;
            if (rest > 0) {
              // R9a (19/08) nhãn-nói-thật: trước hứa "Đã đưa vào kho — chờ chủ studio duyệt"
              // trong khi code KHÔNG lưu gì và KHÔNG có luồng duyệt nào cho loại ngoài .idfc.
              pushLibraryToast(tr(
                `${rest} tệp chưa nhập được — loại này chưa có đường nhập`,
                `${rest} file(s) not imported — no import path for this type yet`,
              ));
            }
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
