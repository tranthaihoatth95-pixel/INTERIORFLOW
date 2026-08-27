'use client';

/**
 * components/materials/MaterialsScreen.tsx — VIỆC 3 (`docs/PHIEU-CODE-IF-KHO-VAT-LIEU-V1.md`):
 * màn quản lý vật liệu — thêm/sửa/xoá/tìm/lọc/gắn ảnh + cửa nhập Excel/CSV (VIỆC 4). Đọc/ghi qua
 * API sẵn có `GET/POST /api/specs`, `PATCH/DELETE /api/specs/:id` — không route riêng.
 *
 * ⚡ [marker: vatLieuBaMat] 17/08 — ĐÂY LÀ NƠI CẮM ĐIỆN. `getMaterial()` (`lib/materials/
 * resolve.ts`, viết 07/08) nối ba mảnh vật liệu nhưng suốt 10 ngày **0 nơi gọi ngoài test của
 * chính nó** — tsc xanh, test xanh, người dùng không thấy gì. Màn này đã sẵn mặt ② (thương mại,
 * `/api/specs`); nay thêm ① PBR (`loadPbrMap()`) + ③ hoạ tiết 2D (`MATERIALS`) rồi đưa cả ba vào
 * `getMaterial` ⇒ mỗi dòng kho nói được nó **đủ mặt nào, thiếu mặt nào, và làm sao có mặt thiếu**.
 * ⛔ Chỉ ĐỌC hợp ba mặt để hiển thị — không đường ghi nào chép giá sang bên thị giác (luật 2.1.9.i).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileSpreadsheet, Search, Loader2, Palette, LogIn, WifiOff, RefreshCw } from 'lucide-react';
import { useT, useLang } from '@/lib/i18n';
import { phanLoaiHong, nhan, HONG_KHONG_DOC_DUOC, type LyDoHong } from '@/lib/ui/trang-thai-tai';
import { useTrangThaiMang } from '@/lib/home/trang-thai';
import type { MaterialSpecDto } from '@/lib/materials/warehouse/dto';
import { IMPORT_KIND_LABEL } from '@/lib/materials/warehouse/dto';
import { getMaterial } from '@/lib/materials/resolve';
import { loadPbrMap, ensurePbrCanonicalKeys } from '@/lib/materials/pbr-store';
import { baMatChuaCoMa, baMatCuaVatLieu, type BaMat } from '@/lib/materials/ba-mat';
import type { MaterialPbr } from '@/lib/materials/schema';
import { MATERIALS } from '@/lib/cad/materials';
import { MaterialTable } from './MaterialTable';
import { MaterialFormModal } from './MaterialFormModal';
import { MaterialPbrEditor } from './MaterialPbrEditor';
import { MaterialImportWizard } from './MaterialImportWizard';
import { BaMatPanel } from './BaMatPanel';
import { EmptyState } from '@/components/ui/EmptyState';

export function MaterialsScreen() {
  const tr = useT();
  const en = useLang() === 'en';
  const router = useRouter();
  const [items, setItems] = useState<MaterialSpecDto[] | null>(null);
  /** ⚙️ P0-2 — thay chuỗi lỗi thô bằng LÝ DO. Xem `lib/ui/trang-thai-tai.ts`. */
  const [lyDoHong, setLyDoHong] = useState<{ lyDo: LyDoHong; ma?: number } | null>(null);
  const trucTuyen = useTrangThaiMang();
  const [query, setQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  /** '' = mọi loại. Khoá dùng đúng `ProductSpec.kind` ('material' | 'furniture' | …), nhãn lấy từ
   * `IMPORT_KIND_LABEL` — cùng nguồn chữ với ô chọn ngăn của cửa nhập, không chép tay lần hai. */
  const [kindFilter, setKindFilter] = useState('');
  const [editing, setEditing] = useState<MaterialSpecDto | null | 'new'>(null);
  const [importing, setImporting] = useState(false);
  /** VIỆC 5 PHẦN B — món đang mở lớp chỉnh chất liệu render (4 núm, `MaterialPbrEditor`). */
  const [pbrEditing, setPbrEditing] = useState<MaterialSpecDto | null>(null);
  /** [marker: vatLieuBaMat] mặt ① THỊ GIÁC — kho PBR cục bộ, chỉ đọc được ở client. */
  const [pbrMap, setPbrMap] = useState<Record<string, MaterialPbr>>({});
  /** món đang mở panel "một vật, ba mặt". */
  const [baMatCua, setBaMatCua] = useState<MaterialSpecDto | null>(null);

  /**
   * 06/08 VÒNG 2 — BỎ `?kind=material` HARD-CODE. Bắt được khi nghiệm thu G-M3-07: cửa nhập cho
   * chọn ngăn "Nội thất rời"/"Đèn"/"Đồ gỗ đóng"… (và tự đoán đúng), nhập xong báo "Đã thêm 2 nội
   * thất rời" — nhưng màn kho này chỉ hỏi `kind=material` nên **hàng vừa nhập biến mất khỏi màn
   * hình duy nhất xem được kho**. Người dùng thấy đúng cảnh "nhập xong không thấy đâu", tưởng mất.
   * Nay nạp MỌI loại rồi lọc phía client bằng ô "Loại" (mặc định: tất cả) — cùng lối với ô "Hãng"
   * đã có, không thêm vòng gọi API mỗi lần đổi bộ lọc.
   */
  const load = async () => {
    setLyDoHong(null);
    /**
     * ⚙️ P0-2 (27/08) — KHÔNG in mã kỹ thuật ra mặt người dùng.
     * Bản cũ: `throw new Error(\`HTTP ${res.status}\`)` rồi hiện thẳng chuỗi đó trong một thanh
     * đỏ. Lane `IF-UXUI-RUNTIME-001` đo được trên app thật: **`HTTP 401` in ra cạnh câu "kho
     * đang trống"** — người dùng hết phiên bị bảo là kho rỗng. Hai chuyện khác hẳn nhau.
     * Từ vựng chung: `lib/ui/trang-thai-tai.ts` (dùng chung với `/projects`, `/tasks`).
     */
    let res: Response;
    try {
      res = await fetch('/api/specs');
    } catch {
      setLyDoHong(phanLoaiHong(null, trucTuyen));
      return;
    }
    if (!res.ok) {
      setLyDoHong(phanLoaiHong(res, trucTuyen));
      return;
    }
    try {
      const j = await res.json();
      const specs: MaterialSpecDto[] = j.specs ?? [];
      /* ⭐ W0.2 (19/08) — "đoạn dây cuối" PBR legacy→canonical (xem docstring
         `ensurePbrCanonicalKeys`): spec nào đã backfill `matId` mà PBR còn nằm dưới khoá SKU cũ
         thì copy sang khoá UUID, để bước 2B đổi callsite đọc sang UUID không làm mất công người
         dùng đã đặt thông số. Idempotent, chỉ ghi localStorage khi có gì đổi; migrate xong nạp
         lại pbrMap để chỉ báo "ba mặt" phản ánh ngay. */
      const pbrReport = ensurePbrCanonicalKeys(specs);
      if (pbrReport && pbrReport.migrated > 0) napPbr();
      setItems(specs);
    } catch {
      // Thân về được nhưng không đọc nổi — KHÁC máy chủ lỗi, và câu chữ phải khác.
      setLyDoHong(HONG_KHONG_DOC_DUOC);
    }
  };

  useEffect(() => { void load(); }, []);

  /* [marker: vatLieuBaMat] kho PBR sống trong localStorage ⇒ chỉ đọc sau khi đã lên client (SSR
     `loadPbrMap()` trả {}). Nạp lại sau mỗi lần đóng cửa sổ chất liệu render, nếu không thì người
     dùng vừa đặt xong thông số mà chỉ báo vẫn nói "chưa có" — đúng kiểu lỗi khiến người ta thôi
     tin cả bảng. */
  const napPbr = useCallback(() => setPbrMap(loadPbrMap()), []);
  useEffect(() => { napPbr(); }, [napPbr]);

  /**
   * ⚡ NƠI GỌI THẬT của `getMaterial()`. Ba nguồn: ① `pbrMap` (thị giác) · ② `items` (thương mại,
   * đã fetch ở trên) · ③ `MATERIALS` (hoạ tiết 2D). Món CHƯA CÓ MÃ thì không có khoá nối — nói
   * thẳng bằng `baMatChuaCoMa()`, KHÔNG tra bừa rồi hiện ba ô trống.
   */
  const baMatTheoId = useMemo(() => {
    const bang = new Map<string, BaMat>();
    for (const m of items ?? []) {
      bang.set(m.id, m.sku
        ? baMatCuaVatLieu(getMaterial(m.sku, { pbrMap, specs: items ?? [], defs: MATERIALS }))
        : baMatChuaCoMa());
    }
    return bang;
  }, [items, pbrMap]);

  const layBaMat = useCallback(
    (m: MaterialSpecDto): BaMat => baMatTheoId.get(m.id) ?? baMatChuaCoMa(),
    [baMatTheoId],
  );

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

        <div style={{ marginLeft: 16, display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--field)', minWidth: 200 }}>
          <Search size={18} style={{ color: 'var(--t4)' }} />
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
          style={{ height: 30, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t2)', fontSize: 12.5, padding: '0 8px' }}
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
            style={{ height: 30, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t2)', fontSize: 12.5, padding: '0 8px' }}
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
            <Palette size={18} /> {tr('Bảng màu', 'Colour libraries')}
          </button>
          <button type="button" onClick={() => setImporting(true)} style={btnStyle(false)}>
            <FileSpreadsheet size={18} /> {tr('Nhập Excel/CSV', 'Import Excel/CSV')}
          </button>
          <button type="button" onClick={() => setEditing('new')} style={btnStyle(true)}>
            <Plus size={18} /> {tr('Thêm vật liệu', 'Add material')}
          </button>
        </div>
      </div>

      {lyDoHong ? (
        /* Trạng thái HỎNG chiếm CHỖ CỦA NỘI DUNG, không phải một thanh mỏng đứng trên một bảng
           rỗng. Bản cũ để cả hai cùng hiện ⇒ "không có quyền" và "chưa có gì" đọc như một. */
        (() => {
          const n = nhan(lyDoHong.lyDo, { vi: 'vật liệu', en: 'materials' }, en);
          return (
            <div style={{ flex: 1, display: 'grid', placeItems: 'center', minHeight: 0, padding: 24 }}>
              <EmptyState
                icon={
                  lyDoHong.lyDo === 'khong-quyen' ? <LogIn size={18} />
                    : lyDoHong.lyDo === 'ngoai-tuyen' ? <WifiOff size={18} />
                    : <RefreshCw size={18} />
                }
                title={n.tieuDe}
                desc={n.moTa}
                actions={
                  n.hanhDong
                    ? [{
                        label: n.hanhDong,
                        primary: true,
                        onClick: lyDoHong.lyDo === 'khong-quyen'
                          ? () => { window.location.href = '/'; }
                          : () => { void load(); },
                      }]
                    : []
                }
              />
            </div>
          );
        })()
      ) : items === null ? (
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
              { label: tr('Nhập Excel/CSV', 'Import Excel/CSV'), primary: true, icon: <FileSpreadsheet size={18} />, onClick: () => setImporting(true) },
              { label: tr('Thêm vật liệu đầu tiên', 'Add the first material'), icon: <Plus size={18} />, onClick: () => setEditing('new') },
            ]}
          />
        </div>
      ) : (
        <MaterialTable
          items={filtered}
          onEdit={setEditing}
          onDelete={(m) => void onDelete(m)}
          onEditPbr={setPbrEditing}
          baMatCua={layBaMat}
          onMoBaMat={setBaMatCua}
        />
      )}

      {baMatCua && (
        <BaMatPanel
          baMat={layBaMat(baMatCua)}
          ten={baMatCua.name}
          onClose={() => setBaMatCua(null)}
          /* món chưa có mã thì KHÔNG mở được cửa chất liệu render (matId = mã vật liệu) — không
             truyền hàm ⇒ panel không mọc nút giả bấm không ra gì. */
          onMoChatLieu={baMatCua.sku ? () => { setPbrEditing(baMatCua); setBaMatCua(null); } : undefined}
          onMoSuaThuongMai={() => { setEditing(baMatCua); setBaMatCua(null); }}
        />
      )}

      {pbrEditing?.sku && (
        <MaterialPbrEditor
          matId={pbrEditing.sku}
          name={pbrEditing.name}
          /* gợi ý loại khi chưa từng chỉnh: ghép note + tên — nguồn chữ duy nhất mô tả món có sẵn */
          categoryHint={[pbrEditing.note, pbrEditing.name].filter(Boolean).join(' ')}
          onClose={() => { setPbrEditing(null); napPbr(); }}
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
    border: primary ? 0 : '1px solid var(--border)', borderRadius: 10, fontSize: 12, fontWeight: 600,
    background: primary ? 'var(--accent)' : 'var(--field)', color: primary ? '#fff' : 'var(--t2)',
  };
}
