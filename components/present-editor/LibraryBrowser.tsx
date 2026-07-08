'use client';

/**
 * components/present-editor/LibraryBrowser.tsx — Bảng REFERENCE trong trình dàn trang.
 *
 * User (round 2) muốn ở chặng Present:
 *   - Cột Reference GỌN GÀNG (grid đều, không tràn) — cột trái đã cho kéo dãn ở ngoài.
 *   - Có NÚT XOÁ ảnh Reference.
 *   - GOM ảnh theo TAG hoặc theo DỰ ÁN (nhóm gọn, không đổ đống).
 *   - Bấm ảnh để ĐƯA VÀO slide đang dàn (thêm image element) — hoặc kéo-thả.
 *
 * Nguồn ảnh (2 rổ, tách rõ):
 *   - SERVER Reference (/api/library) — thư viện team, có thật khi đăng nhập. Xoá = DELETE.
 *   - LOCAL (phiên editor) — user tải ảnh tham khảo tại chỗ (khi chưa đăng nhập / muốn
 *     dùng nhanh). Lưu trong state cha, xoá tại chỗ. Giúp tính năng chạy & test được ngay.
 *
 * Nhóm: theo "project" (chuỗi trước dấu — / _ trong tên hoặc tag đầu) HOẶC theo "tag".
 */

import { useMemo, useRef, useState } from 'react';
import { Trash2, Upload, FolderTree, Tag as TagIcon, ImagePlus, Loader2 } from 'lucide-react';

/** Ảnh reference chuẩn hoá (server + local). */
export interface RefImage {
  id: string;
  name: string;
  url: string;
  tags: string; // chuỗi tag tự do, phân tách bằng , hoặc khoảng trắng
  source: 'server' | 'local';
  /** local mới xoá được vô điều kiện; server chỉ khi mình upload (mine). */
  mine?: boolean;
}

type GroupBy = 'project' | 'tag';

interface Props {
  images: RefImage[];
  loading?: boolean;
  /** thêm ảnh vào slide đang dàn (click hoặc nút). */
  onUseImage: (url: string) => void;
  /** xoá ảnh (server: gọi API; local: xoá state). */
  onDelete: (img: RefImage) => void;
  /** tải ảnh tham khảo LOCAL lên (data URL + tên + tag). */
  onUploadLocal: (files: { name: string; dataUrl: string }[], tags: string) => void;
}

/** Bóc "dự án" từ tên/tag: phần trước dấu — _ · hoặc tag đầu tiên. */
function projectOf(img: RefImage): string {
  const firstTag = img.tags.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean)[0];
  if (firstTag) return firstTag;
  const m = img.name.split(/[—\-_·|]/)[0]?.trim();
  return m || 'Khác';
}

/** Bóc danh sách tag của một ảnh (đã tách + trim). */
function tagsOf(img: RefImage): string[] {
  const t = img.tags.split(/[,]+/).map((s) => s.trim()).filter(Boolean);
  return t.length ? t : ['Chưa gắn thẻ'];
}

export default function LibraryBrowser({ images, loading, onUseImage, onDelete, onUploadLocal }: Props) {
  const [groupBy, setGroupBy] = useState<GroupBy>('project');
  const [query, setQuery] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      images.filter(
        (i) => !q || i.name.toLowerCase().includes(q) || i.tags.toLowerCase().includes(q),
      ),
    [images, q],
  );

  // Gom nhóm theo project hoặc tag (1 ảnh nhiều tag → xuất hiện ở nhiều nhóm khi group=tag).
  const groups = useMemo(() => {
    const map = new Map<string, RefImage[]>();
    for (const img of filtered) {
      const keys = groupBy === 'project' ? [projectOf(img)] : tagsOf(img);
      for (const k of keys) {
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(img);
      }
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'vi'));
  }, [filtered, groupBy]);

  async function handleFiles(files: FileList | null) {
    const list = [...(files ?? [])];
    if (!list.length) return;
    setUploading(true);
    try {
      const out: { name: string; dataUrl: string }[] = [];
      for (const f of list) {
        const dataUrl = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(String(r.result));
          r.onerror = () => rej(r.error);
          r.readAsDataURL(f);
        });
        out.push({ name: f.name.replace(/\.[^.]+$/, ''), dataUrl });
      }
      onUploadLocal(out, tagInput.trim());
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
      {/* tải ảnh tham khảo local + tag */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="Thẻ khi tải: tên dự án, style…"
          style={inp}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={uploadBtn}>
            {uploading ? <Loader2 size={13} className="pe-spin" /> : <Upload size={13} />} Tải ảnh tham khảo
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
        </div>
      </div>

      {/* tìm + chọn cách gom nhóm */}
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo tên / thẻ…" style={inp} />
      <div style={{ display: 'flex', gap: 6 }}>
        <GroupBtn active={groupBy === 'project'} onClick={() => setGroupBy('project')} icon={<FolderTree size={12} />}>
          Theo dự án
        </GroupBtn>
        <GroupBtn active={groupBy === 'tag'} onClick={() => setGroupBy('tag')} icon={<TagIcon size={12} />}>
          Theo thẻ
        </GroupBtn>
      </div>

      {loading && (
        <p style={{ fontSize: 11, color: 'var(--t4)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Loader2 size={12} className="pe-spin" /> Đang nạp thư viện…
        </p>
      )}
      {!loading && !images.length && (
        <p style={{ fontSize: 11, color: 'var(--t4)', lineHeight: 1.5 }}>
          Chưa có ảnh tham khảo. Tải ảnh lên (nút trên) để gom theo dự án / thẻ, rồi bấm để đưa vào slide.
        </p>
      )}
      {!loading && images.length > 0 && !filtered.length && (
        <p style={{ fontSize: 11, color: 'var(--t4)' }}>Không có ảnh khớp “{query}”.</p>
      )}

      {/* các nhóm — mỗi nhóm 1 lưới đều 2 cột (gọn, không tràn) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', paddingRight: 2 }}>
        {groups.map(([name, imgs]) => (
          <section key={name}>
            <div style={groupHead}>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {name}
              </span>
              <span style={{ color: 'var(--t4)' }}>{imgs.length}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {imgs.map((img) => (
                <div
                  key={`${name}_${img.id}`}
                  className="pe-ref-cell"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/uri-list', img.url);
                    e.dataTransfer.setData('application/interiorflow-ref', img.url);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  title={`${img.name}${img.tags ? ` · ${img.tags}` : ''} — bấm để đưa vào slide, hoặc kéo ra sân khấu`}
                  style={cell}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.name}
                    loading="lazy"
                    onClick={() => onUseImage(img.url)}
                    style={{ display: 'block', width: '100%', height: 62, objectFit: 'cover', cursor: 'pointer' }}
                  />
                  {/* lớp nút hiện khi hover */}
                  <div className="pe-ref-actions" style={actions}>
                    <button type="button" title="Đưa vào slide" onClick={() => onUseImage(img.url)} style={miniBtn}>
                      <ImagePlus size={12} />
                    </button>
                    {(img.source === 'local' || img.mine) && (
                      <button
                        type="button"
                        title="Xoá ảnh reference"
                        onClick={() => onDelete(img)}
                        style={{ ...miniBtn, color: '#e5674f' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  <p style={caption}>{img.name}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- UI bits ------------------------------- */
function GroupBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        padding: '6px 4px',
        borderRadius: 7,
        border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
        background: active ? 'var(--accent-soft)' : 'var(--field)',
        color: active ? 'var(--accent)' : 'var(--t3)',
        fontSize: 11,
        cursor: 'pointer',
      }}
    >
      {icon}
      {children}
    </button>
  );
}

const inp: React.CSSProperties = {
  width: '100%',
  padding: '7px 9px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--field)',
  color: 'var(--t1)',
  fontSize: 12,
};

const uploadBtn: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '8px',
  borderRadius: 8,
  border: '1px solid var(--accent)',
  background: 'var(--accent-soft)',
  color: 'var(--accent)',
  fontSize: 12,
  cursor: 'pointer',
};

const groupHead: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 10.5,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  color: 'var(--t3)',
  margin: '0 0 6px',
};

const cell: React.CSSProperties = {
  position: 'relative',
  borderRadius: 8,
  overflow: 'hidden',
  border: '1px solid var(--border)',
  background: 'var(--field)',
};

const actions: React.CSSProperties = {
  position: 'absolute',
  top: 4,
  right: 4,
  display: 'flex',
  gap: 3,
};

const miniBtn: React.CSSProperties = {
  width: 22,
  height: 22,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'rgba(20,20,24,.72)',
  color: '#fff',
  cursor: 'pointer',
};

const caption: React.CSSProperties = {
  margin: 0,
  padding: '3px 6px',
  fontSize: 10,
  color: 'var(--t3)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
