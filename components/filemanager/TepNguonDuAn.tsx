'use client';

/**
 * components/filemanager/TepNguonDuAn.tsx — khu **Tệp nguồn dự án**: mặt người dùng của chuỗi
 * contract `ProjectFile → xem bằng mắt → Promote → LibraryAsset (+ ProjectAssetUsage)`.
 *
 * Vị trí trong dòng chảy (`docs/IF-KIEN-TRUC.md` §5): đây là MẮT XÍCH ĐẦU — tệp thô thuộc ĐÚNG
 * MỘT dự án; bấm "Đưa vào Thư viện" là bước Promote sinh vật dùng-lại-được ở tầng Thư viện và
 * nối ngược về dự án bằng usage. Mount trong ngăn ① *Tệp dự án* của `/files`
 * (`app/files/page.tsx`), ĐỨNG TRÊN `FileManagerShell` — shell đó là cây thư mục đĩa/mock,
 * còn khu này là dữ liệu server thật (`/api/project-files`, live 20/08).
 *
 * ĐỌC TỪ CODE ROUTE, KHÔNG TIN MÔ TẢ: POST nhận **JSON {projectId, name, dataUrl}** (route.ts:53
 * — không phải multipart); 415 trả kèm lý do từ sniff magic-bytes — UI hiện NGUYÊN VĂN, không
 * nuốt. Promote idempotent: `daCo: true` là 200 lặng lẽ, UI nói "đã có, không nhân bản".
 *
 * ══ 20/08 · ĐỢT COHERENCE — NHÌN LÀ HIỂU ═══════════════════════════════════════════════════
 * Trước đợt này khu chỉ có MỘT hình hài cho mọi hàng: nhìn vào không biết tệp nào còn thô, tệp
 * nào đã thành tài sản Thư viện, tệp nào đang được dự án dùng. Nay:
 *   ① **BA VẬT hiện song song bằng huy hiệu** (□ tệp nguồn · ◆ tài sản Thư viện · ⇄ đang dùng) —
 *      vì `LibraryAsset` KHÔNG mang `projectId`, vẽ chung một huy hiệu là nói sai contract.
 *   ② **BẢY NẤC TRẠNG THÁI** (`tinhTrangThai`) — ký hiệu + chữ, màu chỉ là kênh phụ.
 *   ③ **BA HÀNH ĐỘNG** mỗi hàng, nút chưa đủ điều kiện thì `aria-disabled` + `aria-describedby`
 *      kèm lý do THẬT (khuôn ToolbarChip 16/08 — cấm `title` câm, cấm nút giả).
 *   ④ **NGỮ PHÁP BÊN PHẢI ba nấc** lướt → kỹ → sâu; nấc `sâu` là lớp tin hai nấc kia KHÔNG THỂ
 *      có (phải hỏi máy chủ): đi tới nguồn · đang dùng ở đâu.
 * Lõi thuần + test: `tep-nguon-trang-thai.ts` / `.test.ts`.
 *
 * 🔴 **ĐƯỜNG VÒNG PHẢI KHAI**: `GET /api/project-files` (FILE_SELECT — `_lib/guard.ts:48`) KHÔNG
 * trả trạng thái promote, và `ProjectFile` không có cột `promotedAt`/`assetId`. Muốn hàng còn
 * nhớ "đã vào Thư viện" sau khi TẢI LẠI TRANG thì chỉ còn cách khớp **tag provenance** bên phía
 * tài sản (`GET /api/library` → `nguon:projectfile:<id>`, xem `timAssetTheoTep`). Cái giá: một
 * lượt tải cả kho tài sản. Đường sạch là thêm cờ vào FILE_SELECT — NGOÀI vùng ghi của phiếu này.
 *
 * 🔴 **KHÔNG GIẢ VỜ HỖ TRỢ DWG/DXF**: server sniff magic-bytes và trả **415** cho chúng. Lần thử
 * hỏng KHÔNG sinh `ProjectFile` ⇒ không có hàng nào để gắn trạng thái. Nên chúng sống trong
 * **danh sách lượt thử** (`choList`) ngay trên danh sách tệp, mang nấc `Không hỗ trợ` + NGUYÊN
 * VĂN câu server. Xoá chúng đi cho gọn mắt là giấu mất câu trả lời (luật §9 cấm xoá ô trống).
 *
 * XEM TRƯỚC: `GET /api/project-files/[id]/file` đã live ⇒ ảnh hiện được cho MỌI tệp ảnh, kể cả
 * sau khi tải lại trang. PDF vẫn là badge loại tệp. Chi tiết ở `OXemTruoc` bên dưới.
 *
 * projectId: đọc `useFlowStore(s => s.currentProjectId)` (cùng nguồn `LibrarySheet.tsx:381`).
 * `/files` vào thẳng bằng URL thì store chưa có dự án ⇒ hiện <select> chọn từ `fetchFlows()`
 * (API thật, lib/workspace) — chọn ở đây là state CỤC BỘ của khu này, KHÔNG ghi ngược vào store
 * (currentProjectId còn điều khiển điều hướng chặng — lib/store.ts:107, không mượn tay đổi).
 *
 * Sau promote thành công: bắn `window` event `if:library-db-refresh` — `LibrarySheet` nghe và
 * gọi `refreshDb()` sẵn có (không store mới, cùng khuôn event `if:navigator-toggle`).
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { FileUp, RefreshCw, Trash2, Eye, Library, Link2, X } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useFlowStore } from '@/lib/store';
import { fetchFlows, type ProjectMeta } from '@/lib/workspace';
import { openLibrarySheet } from '@/lib/library/use-library-sheet';
import PanelFlank from '@/components/ui/PanelFlank';
import LightBar from '@/components/ui/LightBar';
import {
  USAGE_HIEN_THI,
  USAGE_LIST,
  usageMacDinh,
  loaiTep,
  kiemKichThuoc,
  lyDoChuaGui,
  nhanKetQua,
  type ChuHaiThu,
} from './tep-nguon';
import {
  VAT_NHAN,
  huyHieuVat,
  TRANG_THAI_NHAN,
  tinhTrangThai,
  chuPhu,
  lyDoChuaMoTaiSan,
  lyDoChuaXemDangDung,
  timAssetTheoTep,
  NAC_LIST,
  NAC_NHAN,
  type NacXem,
  type TrangThaiTep,
  type AssetToiThieu,
} from './tep-nguon-trang-thai';

/** Bản ghi `ProjectFile` như GET trả (FILE_SELECT — app/api/project-files/_lib/guard.ts:48). */
interface TepDuAn {
  id: string;
  projectId: string;
  name: string;
  mime: string;
  path: string;
  contentHash: string;
  uploadedBy: string;
  uploadedAt: string;
}

/** Một LƯỢT THỬ tải lên chưa (hoặc không bao giờ) thành `ProjectFile`. Xem docstring đầu file. */
interface LuotThu {
  key: string;
  name: string;
  dangTaiLen?: boolean;
  lyDoKhongHoTro?: string | null;
  loi?: string | null;
}

/** Nơi một tài sản đang được dùng — `GET /api/project-asset-usage?assetId=` (where-used). */
interface DungO {
  dangTai: boolean;
  loi?: string | null;
  rows?: { id: string; usage: string; project: { id: string; name: string } }[];
}

/** Đọc lỗi JSON của API — route LUÔN trả body JSON có `error` (guard.ts), nhưng vẫn phòng thân. */
async function docLoi(res: Response): Promise<string> {
  try {
    const j = await res.json();
    if (typeof j?.error === 'string') return j.error;
  } catch {
    // body không phải JSON — rơi xuống mã HTTP trần
  }
  return `HTTP ${res.status}`;
}

function docFileDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Không đọc được tệp từ máy.'));
    r.readAsDataURL(file);
  });
}

/* ══ MẢNH DÙNG CHUNG TRONG KHU ═══════════════════════════════════════════════════════════════ */

const nutNho: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 'var(--tap)',
  padding: '0 12px', borderRadius: 'var(--r-2)', border: '1px solid var(--border)',
  background: 'var(--field)', color: 'var(--t2)', fontSize: 'var(--fs-2xs)', cursor: 'pointer',
};

const the: React.CSSProperties = {
  padding: 'var(--pad-card)', borderRadius: 'var(--r-3)',
  border: '1px solid var(--border)', background: 'var(--card)',
};

/**
 * Huy hiệu — **ký hiệu hình học + CHỮ**, không bao giờ chỉ có màu. `hong` chỉ TÔ THÊM `--danger`
 * lên cái đã đọc được; bỏ hết màu vẫn phân biệt được nhờ ký hiệu.
 */
function HuyHieu({ ky, chu, hong, tone }: { ky: string; chu: string; hong?: boolean; tone?: 'nhat' }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 'var(--fs-2xs)', lineHeight: 1.6, whiteSpace: 'nowrap',
        color: hong ? 'var(--danger)' : tone === 'nhat' ? 'var(--t3)' : 'var(--t2)',
        border: `1px solid ${hong ? 'var(--danger)' : 'var(--border)'}`,
        borderRadius: 'var(--r-full)', padding: '1px 9px',
      }}
    >
      <span aria-hidden style={{ fontSize: 12, lineHeight: 1 }}>{ky}</span>
      {chu}
    </span>
  );
}

/** Nút có thể MỜ — một khuôn duy nhất cho cả khu, để không chỗ nào lỡ tay quay về `title` câm. */
function NutLyDo({
  lyDo, idLyDo, onClick, children, style, testid,
}: {
  lyDo: ChuHaiThu | null;
  idLyDo: string;
  onClick: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
  testid?: string;
}) {
  const tr = useT();
  return (
    <>
      <button
        type="button"
        data-testid={testid}
        style={{ ...nutNho, ...style, ...(lyDo ? { opacity: 'var(--mo-vo-hieu)', cursor: 'default' } : {}) }}
        aria-disabled={lyDo ? true : undefined}
        aria-describedby={lyDo ? idLyDo : undefined}
        onClick={lyDo ? undefined : onClick}
      >
        {children}
      </button>
      {lyDo && <span id={idLyDo} className="if-tooltip-a11y">{tr(lyDo.vi, lyDo.en)}</span>}
    </>
  );
}

/**
 * Ô xem trước 48px — ảnh THẬT, còn lại là badge loại tệp. Không bịa hình (cùng luật `FileThumb`).
 *
 * Ba nguồn ảnh, xếp theo độ tươi: ① `dataUrl` của tệp vừa upload trong phiên ② `assetUrl` sau khi
 * promote ③ **`/api/project-files/[id]/file`** — route đọc nội dung, live 20/08.
 *
 * ⚠️ `onError` BẮT BUỘC (bài học D5: asset chết làm VỠ KHUNG + spam console). Ảnh hỏng — file mất
 * trên đĩa (410), mất mạng, hết phiên (401) — thì **rơi về badge loại tệp**, không để khung vỡ.
 */
function OXemTruoc({ tep, anhSan, kichCo = 48 }: { tep: TepDuAn; anhSan: string | null; kichCo?: number }) {
  const laAnh = loaiTep(tep.mime) === 'anh';
  // Nguồn ③ chỉ dùng khi hai nguồn trong bộ nhớ không có. `id` là khoá ⇒ đổi tệp là reset.
  const src = anhSan ?? (laAnh ? `/api/project-files/${encodeURIComponent(tep.id)}/file` : null);
  const [hong, setHong] = useState(false);
  useEffect(() => { setHong(false); }, [src]);

  const khung: React.CSSProperties = {
    width: kichCo, height: kichCo, flexShrink: 0, borderRadius: 'var(--r-2)',
    border: '1px solid var(--border)', background: 'var(--field)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  };
  if (src && laAnh && !hong) {
    return (
      <span style={khung}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src} alt="" data-testid={`tepnguon-anh-${tep.id}`}
          onError={() => setHong(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </span>
    );
  }
  const badge = loaiTep(tep.mime) === 'pdf' ? 'PDF' : (tep.mime.split('/')[1] ?? 'FILE').toUpperCase().slice(0, 4);
  return (
    <span style={khung} aria-hidden data-testid={`tepnguon-badge-${tep.id}`}>
      <span style={{ fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-semi)', color: 'var(--t3)', letterSpacing: '.04em' }}>{badge}</span>
    </span>
  );
}

/* ══ NGỮ PHÁP BÊN PHẢI — ba nấc, ba CÔNG NĂNG ════════════════════════════════════════════════ */

/**
 * Panel chi tiết. Ba nấc KHÔNG phải ba cỡ chữ của cùng một nội dung (Hoà chốt 16/08 —
 * *"size to là BỔ SUNG CHI TIẾT cho size nhỏ"*):
 *   lướt = *nó là gì*      → huy hiệu vật + nấc trạng thái, đọc trong một giây
 *   kỹ   = *nó là tệp nào* → thông số ĐO ĐƯỢC: MIME · ngày · người tải · vân tay nội dung
 *   sâu  = *nó dính vào đâu* → QUAN HỆ, phải hỏi máy chủ mới biết (đi tới nguồn · đang dùng ở đâu)
 * Nấc `lướt` phải **đứng được một mình**: che hai nấc kia đi vẫn nói đủ món này là gì.
 */
function ChiTietTep({
  tep, anhSan, asset, dungO, nac, doiNac, xemDungO, idNhan, trangThai,
}: {
  tep: TepDuAn | null;
  anhSan: string | null;
  asset: AssetToiThieu | null;
  dungO: DungO | undefined;
  nac: NacXem;
  doiNac: (n: NacXem) => void;
  xemDungO: () => void;
  idNhan: string;
  trangThai: TrangThaiTep;
}) {
  const tr = useT();
  const khung: React.CSSProperties = {
    width: 264, flexShrink: 0, display: 'grid', gap: 10, alignContent: 'start',
    padding: '10px 12px', background: 'var(--panel)',
  };

  if (!tep) {
    return (
      <div style={khung} data-testid="tepnguon-chitiet-trong">
        <p style={{ margin: 0, fontSize: 'var(--fs-2xs)', color: 'var(--t3)', lineHeight: 1.6 }}>
          {tr('Chọn một tệp để xem chi tiết — danh tính, thông số, và nó đang dính vào đâu.',
            'Pick a file to see its detail — identity, parameters, and what it is wired to.')}
        </p>
      </div>
    );
  }

  const nhanTT = TRANG_THAI_NHAN[trangThai];
  const vats = huyHieuVat({ coAsset: !!asset, dangDung: !!dungO?.rows?.length });

  return (
    <div style={khung} data-testid="tepnguon-chitiet">
      {/* Bộ chọn nấc — mỗi nút NÓI CÂU HỎI nó trả lời, không chỉ nói tên nấc. */}
      <div role="tablist" aria-label={tr('Nấc xem chi tiết', 'Detail depth')} style={{ display: 'flex', gap: 4 }}>
        {NAC_LIST.map((n) => {
          const on = n === nac;
          return (
            <button
              key={n} type="button" role="tab" aria-selected={on}
              data-testid={`tepnguon-nac-${n}`}
              onClick={() => doiNac(n)}
              style={{
                flex: 1, minHeight: 'var(--tap)', padding: '0 6px', cursor: 'pointer',
                borderRadius: 'var(--r-1)', fontSize: 'var(--fs-2xs)',
                border: `1px solid ${on ? 'var(--t3)' : 'var(--border)'}`,
                background: on ? 'var(--card)' : 'transparent',
                color: on ? 'var(--t1)' : 'var(--t3)',
                fontWeight: on ? 'var(--fw-semi)' : undefined,
              }}
            >
              {tr(NAC_NHAN[n].vi, NAC_NHAN[n].en)}
            </button>
          );
        })}
      </div>
      <p style={{ margin: 0, fontSize: 'var(--fs-2xs)', color: 'var(--t3)' }}>
        {tr(NAC_NHAN[nac].hoi.vi, NAC_NHAN[nac].hoi.en)}
      </p>

      {/* ── LƯỚT — danh tính. Nấc nào cũng giữ phần này: nó là mỏ neo. ───────────────────────── */}
      <div style={{ ...the, display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <OXemTruoc tep={tep} anhSan={anhSan} kichCo={nac === 'luot' ? 64 : 40} />
          <span style={{ fontSize: 'var(--fs-ui)', fontWeight: 'var(--fw-semi)', color: 'var(--t1)', overflowWrap: 'anywhere' }}>
            {tep.name}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {vats.map((v) => <HuyHieu key={v} ky={VAT_NHAN[v].ky} chu={tr(VAT_NHAN[v].vi, VAT_NHAN[v].en)} />)}
          <HuyHieu ky={nhanTT.ky} chu={tr(nhanTT.vi, nhanTT.en)} hong={nhanTT.hong} />
        </div>
        {/* Câu ranh giới của TỪNG vật — chỉ ở nấc lướt, đúng vai "dạy nghĩa" của nấc nhập môn. */}
        {nac === 'luot' && (
          <ul style={{ margin: 0, paddingLeft: 16, display: 'grid', gap: 4 }}>
            {vats.map((v) => (
              <li key={v} style={{ fontSize: 'var(--fs-2xs)', color: 'var(--t3)', lineHeight: 1.6 }}>
                {tr(VAT_NHAN[v].y.vi, VAT_NHAN[v].y.en)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── KỸ — thông số đo được. Không suy diễn, không làm tròn. ───────────────────────────── */}
      {(nac === 'ky' || nac === 'sau') && (
        <dl style={{ ...the, margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '5px 10px', fontSize: 'var(--fs-2xs)' }}>
          {([
            [tr('Loại', 'Type'), tep.mime],
            [tr('Tải lên', 'Uploaded'), new Date(tep.uploadedAt).toLocaleString('vi-VN')],
            [tr('Người tải', 'By'), tep.uploadedBy],
            [tr('Vân tay', 'Hash'), tep.contentHash.slice(0, 16) + '…'],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} style={{ display: 'contents' }}>
              <dt style={{ color: 'var(--t3)' }}>{k}</dt>
              <dd style={{ margin: 0, color: 'var(--t2)', overflowWrap: 'anywhere' }}>{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* ── SÂU — QUAN HỆ. Lớp tin hai nấc kia không thể có: phải hỏi máy chủ. ───────────────── */}
      {nac === 'sau' && (
        <div style={{ ...the, display: 'grid', gap: 8 }}>
          <span style={{ fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-semi)', color: 'var(--t1)' }}>
            {tr('Đi tới nguồn', 'Go to source')}
          </span>
          <a
            href={`/api/project-files/${encodeURIComponent(tep.id)}/file`}
            target="_blank" rel="noreferrer" data-testid="tepnguon-di-nguon-tep"
            style={{ fontSize: 'var(--fs-2xs)', color: 'var(--t2)', textDecoration: 'underline', overflowWrap: 'anywhere' }}
          >
            {tr('Bản thô của dự án', 'The project’s raw file')}
          </a>
          {asset ? (
            <a
              href={asset.url} target="_blank" rel="noreferrer" data-testid="tepnguon-di-nguon-asset"
              style={{ fontSize: 'var(--fs-2xs)', color: 'var(--t2)', textDecoration: 'underline', overflowWrap: 'anywhere' }}
            >
              {tr('Tài sản Thư viện: ', 'Library asset: ')}{asset.name}
            </a>
          ) : (
            <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--t3)' }}>
              {tr('Chưa có tài sản Thư viện — tệp chưa được đưa vào.', 'No Library asset yet — the file has not been promoted.')}
            </span>
          )}

          <span style={{ marginTop: 4, fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-semi)', color: 'var(--t1)' }}>
            {tr('Đang dùng ở đâu', 'Where it is used')}
          </span>
          {!asset && (
            <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--t3)' }}>
              {tr('Quan hệ sử dụng chỉ có sau khi đưa vào Thư viện.',
                'Usage links only exist after the file is promoted.')}
            </span>
          )}
          {asset && !dungO && (
            <NutLyDo lyDo={null} idLyDo={`${idNhan}-lydo-dungo`} onClick={xemDungO} testid="tepnguon-tra-dungo">
              <Link2 size={13} strokeWidth={1.8} aria-hidden />{tr('Tra quan hệ sử dụng', 'Look up usage')}
            </NutLyDo>
          )}
          {dungO?.dangTai && (
            <LightBar label={tr('Đang tra quan hệ sử dụng', 'Looking up usage')} height={6} soVach={20} />
          )}
          {dungO?.loi && (
            <p role="alert" style={{ margin: 0, fontSize: 'var(--fs-2xs)', color: 'var(--danger)' }}>{dungO.loi}</p>
          )}
          {dungO?.rows && dungO.rows.length === 0 && (
            <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--t3)' }}>
              {tr('Chưa dự án nào dùng tài sản này.', 'No project uses this asset yet.')}
            </span>
          )}
          {dungO?.rows && dungO.rows.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 16, display: 'grid', gap: 4 }} data-testid="tepnguon-dungo-list">
              {dungO.rows.map((r) => (
                <li key={r.id} style={{ fontSize: 'var(--fs-2xs)', color: 'var(--t2)' }}>
                  {r.project.name}
                  <span style={{ color: 'var(--t3)' }}>
                    {' · '}{tr(USAGE_HIEN_THI[r.usage]?.vi ?? r.usage, USAGE_HIEN_THI[r.usage]?.en ?? r.usage)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ══ KHU CHÍNH ═══════════════════════════════════════════════════════════════════════════════ */

export function TepNguonDuAn() {
  const tr = useT();
  const storeProjectId = useFlowStore((s) => s.currentProjectId);
  /** Dự án đang thao tác — store thắng khi có; vào thẳng URL thì người dùng tự chọn. */
  const [chonProjectId, setChonProjectId] = useState<string | null>(null);
  const projectId = storeProjectId ?? chonProjectId;

  const [duAnList, setDuAnList] = useState<ProjectMeta[] | null>(null);
  const [tepList, setTepList] = useState<TepDuAn[] | null>(null);
  const [loiChung, setLoiChung] = useState<string | null>(null);
  const [dangTai, setDangTai] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  /** Lượt thử tải lên — sống độc lập với `tepList` vì lượt hỏng KHÔNG sinh `ProjectFile`. */
  const [choList, setChoList] = useState<LuotThu[]>([]);
  /** Tiến trình tải lên — SỐ THẬT (đã xong / tổng tệp trong lượt). Không có số thì không có thanh. */
  const [tienDo, setTienDo] = useState<{ xong: number; tong: number } | null>(null);

  /** dataUrl của tệp upload TRONG PHIÊN — ảnh tươi nhất, khỏi chờ round-trip. */
  const [anhPhien, setAnhPhien] = useState<Record<string, string>>({});
  const [daXem, setDaXem] = useState<Record<string, boolean>>({});
  const [usageChon, setUsageChon] = useState<Record<string, string>>({});
  const [ghiChu, setGhiChu] = useState<Record<string, string>>({});
  const [dangGui, setDangGui] = useState<Record<string, boolean>>({});
  const [loiTheoTep, setLoiTheoTep] = useState<Record<string, string>>({});

  /** tệp → tài sản Thư viện sinh từ nó. Nguồn: kết quả promote (tươi) + khớp tag (sau reload). */
  const [assetTheoTep, setAssetTheoTep] = useState<Record<string, AssetToiThieu>>({});
  const [daCoTheoTep, setDaCoTheoTep] = useState<Record<string, boolean>>({});
  const [dungOTheoTep, setDungOTheoTep] = useState<Record<string, DungO>>({});

  const [chon, setChon] = useState<string | null>(null);
  const [nac, setNac] = useState<NacXem>('luot');

  const inputRef = useRef<HTMLInputElement>(null);
  /** `useId` — KHÔNG `Math.random()`: id ngẫu nhiên lệch giữa server và client ⇒ hydration
   *  mismatch, và `aria-describedby` của nút mờ TRỎ HỤT ở render đầu (ca thật, sửa 20/08). */
  const idNhan = useId().replace(/:/g, '');
  const daDocThuVien = useRef(false);

  // Store chưa có dự án ⇒ tải danh sách thật để chọn (không phải placeholder).
  useEffect(() => {
    if (storeProjectId || duAnList !== null) return;
    let cancelled = false;
    fetchFlows()
      .then(({ projects }) => { if (!cancelled) setDuAnList(projects); })
      .catch((e) => { if (!cancelled) { setDuAnList([]); setLoiChung(e instanceof Error ? e.message : String(e)); } });
    return () => { cancelled = true; };
  }, [storeProjectId, duAnList]);

  const napTep = useCallback(async () => {
    if (!projectId) return;
    setDangTai(true);
    setLoiChung(null);
    try {
      const res = await fetch(`/api/project-files?projectId=${encodeURIComponent(projectId)}`);
      if (!res.ok) throw new Error(await docLoi(res));
      const j = await res.json();
      setTepList(Array.isArray(j.files) ? j.files : []);
    } catch (e) {
      setTepList(null);
      setLoiChung(e instanceof Error ? e.message : String(e));
    } finally {
      setDangTai(false);
    }
  }, [projectId]);

  useEffect(() => { setTepList(null); setChon(null); void napTep(); }, [napTep]);

  /**
   * Khớp tệp ↔ tài sản Thư viện SAU KHI TẢI LẠI TRANG. Chỉ chạy khi thật sự có tệp để khớp, và
   * chỉ MỘT lần mỗi lần mount: `GET /api/library` trả CẢ KHO (đo 20/08: 1.613 hàng) — cái giá của
   * đường vòng đã khai ở docstring đầu file. Hỏng thì **im lặng bỏ qua**: mất trạng thái promote
   * đã-nhớ khó chịu, nhưng chặn cả khu vì một truy vấn phụ thì tệ hơn.
   */
  useEffect(() => {
    if (daDocThuVien.current) return;
    if (!tepList || tepList.length === 0) return;
    daDocThuVien.current = true;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/library');
        if (!res.ok) return;
        const j = await res.json();
        const assets: AssetToiThieu[] = Array.isArray(j.assets) ? j.assets : [];
        if (cancelled) return;
        const map: Record<string, AssetToiThieu> = {};
        for (const t of tepList) {
          const hit = timAssetTheoTep(assets, t.id);
          if (hit) map[t.id] = hit;
        }
        setAssetTheoTep((p) => ({ ...map, ...p })); // kết quả promote trong phiên THẮNG
      } catch {
        // xem docstring — không nâng thành lỗi chặn
      }
    })();
    return () => { cancelled = true; };
  }, [tepList]);

  const upload = useCallback(async (files: FileList | File[]) => {
    if (!projectId) return;
    const ds = Array.from(files);
    if (ds.length === 0) return;
    setLoiChung(null);
    setTienDo({ xong: 0, tong: ds.length });

    for (const file of ds) {
      const key = `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2, 7)}`;
      setChoList((p) => [{ key, name: file.name, dangTaiLen: true }, ...p]);
      const dat = (patch: Partial<LuotThu>) =>
        setChoList((p) => p.map((c) => (c.key === key ? { ...c, dangTaiLen: false, ...patch } : c)));
      const xong = () => setChoList((p) => p.filter((c) => c.key !== key));

      // Fail-fast cùng ngưỡng server (25MB) — đỡ encode base64 một tệp chắc chắn bị 413.
      const qua = kiemKichThuoc(file.size);
      if (qua) { dat({ loi: tr(qua.vi, qua.en) }); setTienDo((p) => (p ? { ...p, xong: p.xong + 1 } : p)); continue; }

      try {
        const dataUrl = await docFileDataUrl(file);
        const res = await fetch('/api/project-files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, name: file.name, dataUrl }),
        });
        if (!res.ok) {
          const chu = await docLoi(res);
          // 415 = server KHÔNG NHẬN loại tệp này (sniff magic-bytes — DWG/DXF rơi vào đây).
          // Câu của server đi thẳng ra mắt người dùng, KHÔNG viết lại bằng lời của UI.
          if (res.status === 415) dat({ lyDoKhongHoTro: chu });
          else dat({ loi: chu });
          continue;
        }
        const j = await res.json();
        const row: TepDuAn = j.file;
        xong();
        setTepList((prev) => [row, ...(prev ?? [])]);
        setAnhPhien((prev) => ({ ...prev, [row.id]: dataUrl }));
      } catch (e) {
        dat({ loi: e instanceof Error ? e.message : String(e) });
      } finally {
        setTienDo((p) => (p ? { ...p, xong: p.xong + 1 } : p));
      }
    }
    setTienDo(null);
  }, [projectId, tr]);

  const promote = useCallback(async (tep: TepDuAn) => {
    setDangGui((p) => ({ ...p, [tep.id]: true }));
    setLoiTheoTep((p) => { const { [tep.id]: _bo, ...con } = p; return con; });
    try {
      const usage = usageChon[tep.id] ?? usageMacDinh(tep.mime);
      const note = (ghiChu[tep.id] ?? '').trim();
      const res = await fetch(`/api/project-files/${tep.id}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usage, ...(note ? { note } : {}) }),
      });
      if (!res.ok) throw new Error(await docLoi(res));
      const j = await res.json();
      setAssetTheoTep((p) => ({ ...p, [tep.id]: { id: j.asset.id, name: tep.name, url: j.asset.url, tags: '' } }));
      setDaCoTheoTep((p) => ({ ...p, [tep.id]: !!j.daCo }));
      // Quan hệ sử dụng vừa đổi ⇒ bỏ kết quả tra cũ, lần sau tra lại từ máy chủ.
      setDungOTheoTep((p) => { const { [tep.id]: _b, ...con } = p; return con; });
      // LibrarySheet đang mở/đã cache thì nạp lại kệ — sheet nghe event này (LibrarySheet.tsx).
      window.dispatchEvent(new Event('if:library-db-refresh'));
    } catch (e) {
      setLoiTheoTep((p) => ({ ...p, [tep.id]: e instanceof Error ? e.message : String(e) }));
    } finally {
      setDangGui((p) => ({ ...p, [tep.id]: false }));
    }
  }, [usageChon, ghiChu]);

  const traDungO = useCallback(async (tepId: string, assetId: string) => {
    setDungOTheoTep((p) => ({ ...p, [tepId]: { dangTai: true } }));
    try {
      const res = await fetch(`/api/project-asset-usage?assetId=${encodeURIComponent(assetId)}`);
      if (!res.ok) throw new Error(await docLoi(res));
      const j = await res.json();
      setDungOTheoTep((p) => ({ ...p, [tepId]: { dangTai: false, rows: Array.isArray(j.usages) ? j.usages : [] } }));
    } catch (e) {
      setDungOTheoTep((p) => ({ ...p, [tepId]: { dangTai: false, loi: e instanceof Error ? e.message : String(e) } }));
    }
  }, []);

  const xoa = useCallback(async (tep: TepDuAn) => {
    // window.confirm — cùng khuôn FileManagerShell/MaterialsScreen, không hộp thoại riêng.
    if (!window.confirm(tr(`Xoá mềm "${tep.name}" khỏi tệp nguồn? Asset đã đưa vào Thư viện (nếu có) vẫn giữ nguyên.`,
      `Soft-delete "${tep.name}" from project sources? Any Library asset created from it stays.`))) return;
    try {
      const res = await fetch(`/api/project-files/${tep.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await docLoi(res));
      setTepList((prev) => (prev ?? []).filter((f) => f.id !== tep.id));
      setChon((c) => (c === tep.id ? null : c));
    } catch (e) {
      setLoiTheoTep((p) => ({ ...p, [tep.id]: e instanceof Error ? e.message : String(e) }));
    }
  }, [tr]);

  const tepChon = (tepList ?? []).find((t) => t.id === chon) ?? null;

  return (
    <section
      aria-label={tr('Tệp nguồn dự án', 'Project source files')}
      style={{ display: 'grid', gap: 10, padding: '12px 14px', borderBottom: '1px solid var(--border)' }}
      onDragOver={(e) => { e.preventDefault(); if (projectId) setDragOver(true); }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOver(false); }}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); if (projectId && e.dataTransfer.files?.length) void upload(e.dataTransfer.files); }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 'var(--fs-ui)', fontWeight: 'var(--fw-semi)', color: 'var(--t1)' }}>
          {tr('Tệp nguồn dự án', 'Project source files')}
        </h2>
        <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--t3)' }}>
          {tr('thô, thuộc dự án — xem rồi đưa vào Thư viện', 'raw, per-project — review, then promote to the Library')}
        </span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 8 }}>
          <button type="button" style={nutNho} onClick={() => void napTep()} data-testid="tepnguon-reload">
            <RefreshCw size={13} strokeWidth={1.8} aria-hidden />{tr('Đọc lại', 'Reload')}
          </button>
          <NutLyDo
            testid="tepnguon-upload-btn"
            idLyDo={`${idNhan}-canduan`}
            lyDo={projectId ? null : {
              vi: 'Chọn một dự án trước — tệp nguồn thuộc đúng một dự án.',
              en: 'Pick a project first — source files belong to exactly one project.',
            }}
            onClick={() => { if (!tienDo) inputRef.current?.click(); }}
          >
            <FileUp size={13} strokeWidth={1.8} aria-hidden />
            {tienDo ? tr('Đang tải lên…', 'Uploading…') : tr('Tải tệp lên', 'Upload file')}
          </NutLyDo>
        </span>
        <input
          ref={inputRef} type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,image/avif,application/pdf"
          style={{ display: 'none' }} data-testid="tepnguon-input"
          onChange={(e) => { if (e.target.files?.length) void upload(e.target.files); e.target.value = ''; }}
        />
      </div>

      {/* Thanh tiến trình chỉ hiện khi CÓ SỐ THẬT (xong/tổng của lượt) — cấm bịa phần trăm. */}
      {tienDo && (
        <LightBar
          value={Math.round((tienDo.xong / Math.max(1, tienDo.tong)) * 100)}
          label={tr(`Đang tải lên ${tienDo.xong}/${tienDo.tong} tệp`, `Uploading ${tienDo.xong}/${tienDo.tong} files`)}
          height={8}
          soVach={28}
        />
      )}

      {/* Chưa có dự án trong store (vào thẳng /files) — chọn dự án THẬT từ /api/flows. */}
      {!storeProjectId && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--fs-2xs)', color: 'var(--t2)' }}>
          {tr('Dự án', 'Project')}
          <select
            value={chonProjectId ?? ''}
            onChange={(e) => setChonProjectId(e.target.value || null)}
            data-testid="tepnguon-project-select"
            style={{ minHeight: 'var(--tap)', borderRadius: 'var(--r-2)', border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)', fontSize: 'var(--fs-2xs)', padding: '0 8px' }}
          >
            <option value="">{duAnList === null ? tr('Đang tải danh sách…', 'Loading…') : tr('— chọn dự án —', '— pick a project —')}</option>
            {(duAnList ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
      )}

      {loiChung && (
        <p role="alert" style={{ margin: 0, padding: '8px 12px', borderRadius: 'var(--r-2)', border: '1px solid var(--danger)', fontSize: 'var(--fs-2xs)', color: 'var(--t1)' }}>
          {loiChung}
        </p>
      )}

      {projectId && dangTai && tepList === null && (
        <p style={{ margin: 0, fontSize: 'var(--fs-2xs)', color: 'var(--t3)' }}>{tr('Đang đọc tệp nguồn…', 'Reading source files…')}</p>
      )}

      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, minWidth: 0 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'grid', gap: 8, alignContent: 'start', paddingRight: 10 }}>
          {/* ── LƯỢT THỬ: đang tải · không hỗ trợ · lỗi. Không có `ProjectFile` nào ở đây. ──── */}
          {choList.length > 0 && (
            <ul style={{ display: 'grid', gap: 8, listStyle: 'none', margin: 0, padding: 0 }} data-testid="tepnguon-cho-list">
              {choList.map((c) => {
                const tt = tinhTrangThai({ dangTaiLen: c.dangTaiLen, lyDoKhongHoTro: c.lyDoKhongHoTro, loi: c.loi });
                const n = TRANG_THAI_NHAN[tt];
                const phu = chuPhu(tt, c);
                return (
                  <li key={c.key} data-testid={`tepnguon-cho-${tt}`}
                    style={{ ...the, display: 'grid', gap: 6, borderColor: n.hong ? 'var(--danger)' : 'var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 'var(--fs-ui)', fontWeight: 'var(--fw-semi)', color: 'var(--t1)', overflowWrap: 'anywhere' }}>{c.name}</span>
                      <HuyHieu ky={n.ky} chu={tr(n.vi, n.en)} hong={n.hong} />
                      {!c.dangTaiLen && (
                        <button type="button" aria-label={tr('Bỏ lượt thử này', 'Dismiss this attempt')}
                          onClick={() => setChoList((p) => p.filter((x) => x.key !== c.key))}
                          style={{ ...nutNho, marginLeft: 'auto', padding: '0 8px' }}>
                          <X size={13} strokeWidth={1.8} aria-hidden />{tr('Bỏ qua', 'Dismiss')}
                        </button>
                      )}
                    </div>
                    {c.dangTaiLen && <LightBar label={tr('Đang tải tệp lên', 'Uploading file')} height={6} soVach={20} />}
                    {/* NGUYÊN VĂN máy chủ — UI không viết lại, không đoán hộ. */}
                    {phu && (
                      <p role="alert" style={{ margin: 0, fontSize: 'var(--fs-2xs)', color: 'var(--t2)', lineHeight: 1.6 }}>{phu}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {projectId && tepList !== null && tepList.length === 0 && choList.length === 0 && (
            <p style={{ margin: 0, padding: '18px 14px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--r-3)', fontSize: 'var(--fs-2xs)', color: 'var(--t3)' }}>
              {dragOver
                ? tr('Thả tệp vào đây', 'Drop files here')
                : tr('Chưa có tệp nguồn nào — kéo ảnh/PDF vào đây hoặc bấm "Tải tệp lên".', 'No source files yet — drop images/PDFs here or click "Upload file".')}
            </p>
          )}

          {projectId && tepList !== null && tepList.length > 0 && (
            <ul style={{ display: 'grid', gap: 8, listStyle: 'none', margin: 0, padding: 0 }}>
              {tepList.map((tep) => {
                const asset = assetTheoTep[tep.id] ?? null;
                const dungO = dungOTheoTep[tep.id];
                const xemRoi = !!daXem[tep.id];
                const guiDangChay = !!dangGui[tep.id];
                const lyDoGui = lyDoChuaGui({ daXem: xemRoi, dangGui: guiDangChay });
                const tt = tinhTrangThai({
                  dangDuaVao: guiDangChay,
                  daVaoThuVien: !!asset,
                  daXem: xemRoi,
                  loi: loiTheoTep[tep.id] ?? null,
                });
                const n = TRANG_THAI_NHAN[tt];
                const anhSan = anhPhien[tep.id] ?? asset?.url ?? null;
                const usage = usageChon[tep.id] ?? usageMacDinh(tep.mime);
                const vats = huyHieuVat({ coAsset: !!asset, dangDung: !!dungO?.rows?.length });
                const dangChon = chon === tep.id;
                return (
                  <li key={tep.id} data-testid={`tepnguon-row-${tep.id}`}
                    onClick={() => setChon(tep.id)}
                    style={{
                      ...the, display: 'grid', gap: 8,
                      // Hàng đang chọn nói bằng VIỀN ĐẬM + nền, không bằng màu nhấn: khu này chưa
                      // được phép đụng `--accent*` (màu nhấn thứ hai chưa chốt).
                      borderColor: dangChon ? 'var(--t3)' : n.hong ? 'var(--danger)' : 'var(--border)',
                      background: dangChon ? 'var(--field)' : 'var(--card)',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <OXemTruoc tep={tep} anhSan={anhSan} />
                      <span style={{ display: 'grid', gap: 4, minWidth: 0 }}>
                        <span style={{ fontSize: 'var(--fs-ui)', fontWeight: 'var(--fw-semi)', color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>{tep.name}</span>
                        {/* HUY HIỆU: ba VẬT trước (danh tính), nấc TRẠNG THÁI sau (việc tới đâu). */}
                        <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }} data-testid={`tepnguon-huyhieu-${tep.id}`}>
                          {vats.map((v) => (
                            <HuyHieu key={v} ky={VAT_NHAN[v].ky} chu={tr(VAT_NHAN[v].vi, VAT_NHAN[v].en)} tone={v === 'tepDuAn' ? 'nhat' : undefined} />
                          ))}
                          <HuyHieu ky={n.ky} chu={tr(n.vi, n.en)} hong={n.hong} />
                        </span>
                      </span>
                      {asset && daCoTheoTep[tep.id] !== undefined && (
                        <span data-testid={`tepnguon-ketqua-${tep.id}`}
                          style={{ marginLeft: 'auto', fontSize: 'var(--fs-2xs)', color: 'var(--t3)' }}>
                          {tr(nhanKetQua(!!daCoTheoTep[tep.id]).vi, nhanKetQua(!!daCoTheoTep[tep.id]).en)}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      {/* HUMAN GATE — xem bằng mắt rồi xác nhận; chưa tick thì nút promote mờ có lý do. */}
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-2xs)', color: 'var(--t2)', cursor: 'pointer' }}>
                        <input type="checkbox" checked={xemRoi} data-testid={`tepnguon-daxem-${tep.id}`}
                          onChange={(e) => setDaXem((p) => ({ ...p, [tep.id]: e.target.checked }))} />
                        <Eye size={13} strokeWidth={1.8} aria-hidden />{tr('Đã xem', 'Reviewed')}
                      </label>

                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-2xs)', color: 'var(--t2)' }}>
                        {tr('Dùng làm', 'Use as')}
                        <select value={usage} data-testid={`tepnguon-usage-${tep.id}`}
                          onChange={(e) => setUsageChon((p) => ({ ...p, [tep.id]: e.target.value }))}
                          style={{ minHeight: 'var(--tap)', borderRadius: 'var(--r-2)', border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)', fontSize: 'var(--fs-2xs)', padding: '0 8px' }}>
                          {USAGE_LIST.map((u) => <option key={u} value={u}>{tr(USAGE_HIEN_THI[u]!.vi, USAGE_HIEN_THI[u]!.en)}</option>)}
                        </select>
                      </label>

                      <input
                        value={ghiChu[tep.id] ?? ''} placeholder={tr('Ghi chú (tuỳ chọn)', 'Note (optional)')}
                        onChange={(e) => setGhiChu((p) => ({ ...p, [tep.id]: e.target.value }))}
                        aria-label={tr('Ghi chú promote', 'Promote note')}
                        style={{ minHeight: 'var(--tap)', borderRadius: 'var(--r-2)', border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)', fontSize: 'var(--fs-2xs)', padding: '0 8px', width: 150 }}
                      />

                      {/* ── BA HÀNH ĐỘNG ────────────────────────────────────────────────────── */}
                      <NutLyDo
                        testid={`tepnguon-promote-${tep.id}`}
                        idLyDo={`${idNhan}-lydo-gui-${tep.id}`}
                        lyDo={lyDoGui}
                        style={{ color: 'var(--t1)' }}
                        onClick={() => void promote(tep)}
                      >
                        <Library size={13} strokeWidth={1.8} aria-hidden />
                        {guiDangChay ? tr('Đang gửi…', 'Sending…') : tr('Đưa vào Thư viện', 'Promote to Library')}
                      </NutLyDo>

                      <NutLyDo
                        testid={`tepnguon-mo-taisan-${tep.id}`}
                        idLyDo={`${idNhan}-lydo-mo-${tep.id}`}
                        lyDo={lyDoChuaMoTaiSan({ coAsset: !!asset })}
                        onClick={() => openLibrarySheet()}
                      >
                        <Library size={13} strokeWidth={1.8} aria-hidden />{tr('Mở tài sản trong Thư viện', 'Open asset in Library')}
                      </NutLyDo>

                      <NutLyDo
                        testid={`tepnguon-dungo-${tep.id}`}
                        idLyDo={`${idNhan}-lydo-dungo-${tep.id}`}
                        lyDo={lyDoChuaXemDangDung({ coAsset: !!asset })}
                        onClick={() => {
                          setChon(tep.id);
                          setNac('sau');
                          if (asset && !dungO) void traDungO(tep.id, asset.id);
                        }}
                      >
                        <Link2 size={13} strokeWidth={1.8} aria-hidden />{tr('Đang dùng ở đâu', 'Where used')}
                      </NutLyDo>

                      <button type="button" style={{ ...nutNho, marginLeft: 'auto' }} data-testid={`tepnguon-xoa-${tep.id}`}
                        onClick={() => void xoa(tep)}>
                        <Trash2 size={13} strokeWidth={1.8} aria-hidden />{tr('Xoá', 'Delete')}
                      </button>
                    </div>

                    {loiTheoTep[tep.id] && (
                      <p role="alert" style={{ margin: 0, fontSize: 'var(--fs-2xs)', color: 'var(--t1)', border: '1px solid var(--danger)', borderRadius: 'var(--r-2)', padding: '6px 10px' }}>
                        {loiTheoTep[tep.id]}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Tay cầm thu/mở dùng chung (`PanelFlank`) — nhớ trạng thái riêng cho panel này. */}
        <PanelFlank side="right" storageKey="files.tepnguon.chitiet" label={tr('Chi tiết tệp nguồn', 'Source file detail')}>
          <ChiTietTep
            tep={tepChon}
            anhSan={tepChon ? (anhPhien[tepChon.id] ?? assetTheoTep[tepChon.id]?.url ?? null) : null}
            asset={tepChon ? (assetTheoTep[tepChon.id] ?? null) : null}
            dungO={tepChon ? dungOTheoTep[tepChon.id] : undefined}
            nac={nac}
            doiNac={setNac}
            idNhan={idNhan}
            xemDungO={() => {
              const a = tepChon ? assetTheoTep[tepChon.id] : null;
              if (tepChon && a) void traDungO(tepChon.id, a.id);
            }}
            trangThai={tepChon ? tinhTrangThai({
              dangDuaVao: !!dangGui[tepChon.id],
              daVaoThuVien: !!assetTheoTep[tepChon.id],
              daXem: !!daXem[tepChon.id],
              loi: loiTheoTep[tepChon.id] ?? null,
            }) : 'canXemLai'}
          />
        </PanelFlank>
      </div>
    </section>
  );
}
