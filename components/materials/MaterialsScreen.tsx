'use client';

/**
 * components/materials/MaterialsScreen.tsx — VIỆC 3 (`docs/PHIEU-CODE-IF-KHO-VAT-LIEU-V1.md`):
 * màn quản lý vật liệu — thêm/sửa/xoá/tìm/lọc/gắn ảnh + cửa nhập Excel/CSV (VIỆC 4). Đọc/ghi qua
 * API sẵn có `GET/POST /api/specs`, `PATCH/DELETE /api/specs/:id` — không route riêng.
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileSpreadsheet, Search, Loader2, Palette } from 'lucide-react';
import { useT } from '@/lib/i18n';
import type { MaterialSpecDto } from '@/lib/materials/warehouse/dto';
import { IMPORT_KIND_LABEL } from '@/lib/materials/warehouse/dto';
import { MaterialTable } from './MaterialTable';
import { MaterialFormModal } from './MaterialFormModal';
import { MaterialPbrEditor } from './MaterialPbrEditor';
import { MaterialImportWizard } from './MaterialImportWizard';
import { EmptyState } from '@/components/ui/EmptyState';

export function MaterialsScreen() {
  const tr = useT();
  const router = useRouter();
  const [items, setItems] = useState<MaterialSpecDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  /** '' = mọi loại. Khoá dùng đúng `ProductSpec.kind` ('material' | 'furniture' | …), nhãn lấy từ
   * `IMPORT_KIND_LABEL` — cùng nguồn chữ với ô chọn ngăn của cửa nhập, không chép tay lần hai. */
  const [kindFilter, setKindFilter] = useState('');
  const [editing, setEditing] = useState<MaterialSpecDto | null | 'new'>(null);
  const [importing, setImporting] = useState(false);
  /** VIỆC 5 PHẦN B — món đang mở lớp chỉnh chất liệu render (4 núm, `MaterialPbrEditor`). */
  const [pbrEditing, setPbrEditing] = useState<MaterialSpecDto | null>(null);

  /**
   * 06/08 VÒNG 2 — BỎ `?kind=material` HARD-CODE. Bắt được khi nghiệm thu G-M3-07: cửa nhập cho
   * chọn ngăn "Nội thất rời"/"Đèn"/"Đồ gỗ đóng"… (và tự đoán đúng), nhập xong báo "Đã thêm 2 nội
   * thất rời" — nhưng màn kho này chỉ hỏi `kind=material` nên **hàng vừa nhập biến mất khỏi màn
   * hình duy nhất xem được kho**. Người dùng thấy đúng cảnh "nhập xong không thấy đâu", tưởng mất.
   * Nay nạp MỌI loại rồi lọc phía client bằng ô "Loại" (mặc định: tất cả) — cùng lối với ô "Hãng"
   * đã có, không thêm vòng gọi API mỗi lần đổi bộ lọc.
   */
  const load = async () => {
    setError(null);
    try {
      const res = await fetch('/api/specs');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      setItems(j.specs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  useEffect(() => { void load(); }, []);

  const brands = useMemo(() => {
    const set = new Set<string>();
    for (const m of items ?? []) if (m.brand) set.add(m.brand);
    return [...set].sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? []).filter((m) => {
      if (kindFilter && m.kind !== kindFilter) return false;
      if (brandFilter && m.brand !== brandFilter) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        (m.sku ?? '').toLowerCase().includes(q) ||
        (m.brand ?? '').toLowerCase().includes(q)
      );
    });
  }, [items, query, brandFilter, kindFilter]);

  const onDelete = async (m: MaterialSpecDto) => {
    if (!window.confirm(tr(`Xoá "${m.name}"? Không hoàn tác được.`, `Delete "${m.name}"? This cannot be undone.`))) return;
    try {
      const res = await fetch(`/api/specs/${m.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      setItems((prev) => (prev ? prev.filter((x) => x.id !== m.id) : prev));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 46, padding: '0 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>{tr('Kho vật liệu', 'Materials warehouse')}</span>
        <span style={{ fontSize: 11.5, color: 'var(--t4)' }}>{items ? tr(`${items.length} mục`, `${items.length} item(s)`) : ''}</span>

        <div style={{ marginLeft: 16, display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--field)', minWidth: 200 }}>
          <Search size={13} style={{ color: 'var(--t4)' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr('Tìm tên, mã, hãng…', 'Search name, SKU, brand…')}
            style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', fontSize: 12.5, color: 'var(--t1)' }}
          />
        </div>

        {/* Ô LOẠI — đứng trước ô Hãng vì nó quyết định "đang xem ngăn nào của kho". Luôn hiện
            (không ẩn theo dữ liệu như ô Hãng): người vừa nhập nội thất rời phải nhìn thấy ngay có
            đường xem chúng, không phải đoán. */}
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          aria-label={tr('Lọc theo loại', 'Filter by type')}
          style={{ height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t2)', fontSize: 12.5, padding: '0 8px' }}
        >
          <option value="">{tr('Tất cả loại', 'All types')}</option>
          {Object.entries(IMPORT_KIND_LABEL).map(([k, label]) => (
            <option key={k} value={k}>{tr(label.vi, label.en)}</option>
          ))}
        </select>

        {brands.length > 0 && (
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            style={{ height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t2)', fontSize: 12.5, padding: '0 8px' }}
          >
            <option value="">{tr('Tất cả hãng', 'All brands')}</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {/* Lối vào `/colors` (05/08) — kho vật liệu và bảng màu là hai ngăn cùng một tủ vật tư. */}
          <button type="button" onClick={() => router.push('/colors')} style={btnStyle(false)}>
            <Palette size={13} /> {tr('Bảng màu', 'Colour libraries')}
          </button>
          <button type="button" onClick={() => setImporting(true)} style={btnStyle(false)}>
            <FileSpreadsheet size={13} /> {tr('Nhập Excel/CSV', 'Import Excel/CSV')}
          </button>
          <button type="button" onClick={() => setEditing('new')} style={btnStyle(true)}>
            <Plus size={13} /> {tr('Thêm vật liệu', 'Add material')}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ margin: '10px 14px 0', padding: '8px 12px', borderRadius: 10, background: 'color-mix(in srgb, var(--danger) 14%, var(--panel))', fontSize: 13, color: 'var(--t1)' }}>
          {error}
        </div>
      )}

      {items === null && !error ? (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--t4)' }}>
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : items !== null && items.length === 0 ? (
        /* P5 (04/08) — kho RỖNG THẬT (khác "lọc không khớp", nhánh đó vẫn ở MaterialTable):
           khuôn EmptyState chung (mock mock-if-thu-vien-trong) — hàng bảng ghost + 2 nút làm
           được việc NGAY TẠI ĐÂY (mở form thêm tay / mở wizard nhập file), không đá đi đâu. */
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', minHeight: 0, overflow: 'auto' }}>
          <EmptyState
            ghost="rows"
            icon={<FileSpreadsheet size={18} />}
            title={tr('Kho vật liệu đang trống', 'The materials warehouse is empty')}
            desc={tr(
              'Mỗi dòng là một vật liệu thương mại: mã, hãng, kích thước, giá, đơn vị. Thêm tay từng món hoặc nhập cả bảng Excel/CSV — IF tự ghép cột.',
              'Each row is one commercial material: SKU, brand, size, price, unit. Add items by hand or import a whole Excel/CSV sheet — IF maps the columns.',
            )}
            actions={[
              { label: tr('Nhập Excel/CSV', 'Import Excel/CSV'), primary: true, icon: <FileSpreadsheet size={13} />, onClick: () => setImporting(true) },
              { label: tr('Thêm vật liệu đầu tiên', 'Add the first material'), icon: <Plus size={13} />, onClick: () => setEditing('new') },
            ]}
          />
        </div>
      ) : (
        <MaterialTable items={filtered} onEdit={setEditing} onDelete={(m) => void onDelete(m)} onEditPbr={setPbrEditing} />
      )}

      {pbrEditing?.sku && (
        <MaterialPbrEditor
          matId={pbrEditing.sku}
          name={pbrEditing.name}
          /* gợi ý loại khi chưa từng chỉnh: ghép note + tên — nguồn chữ duy nhất mô tả món có sẵn */
          categoryHint={[pbrEditing.note, pbrEditing.name].filter(Boolean).join(' ')}
          onClose={() => setPbrEditing(null)}
        />
      )}

      {editing !== null && (
        <MaterialFormModal
          editing={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); void load(); }}
        />
      )}

      {importing && (
        <MaterialImportWizard onClose={() => setImporting(false)} onImported={() => { setImporting(false); void load(); }} />
      )}
    </div>
  );
}

function btnStyle(primary: boolean): React.CSSProperties {
  return {
    height: 30, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
    border: primary ? 0 : '1px solid var(--border)', borderRadius: 8, fontSize: 12, fontWeight: 600,
    background: primary ? 'var(--accent)' : 'var(--field)', color: primary ? '#fff' : 'var(--t2)',
  };
}
