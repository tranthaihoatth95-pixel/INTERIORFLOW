'use client';

/**
 * components/ui/StageToolbelt.tsx — mặt tiền của **NĂNG LỰC GỘP** trên thanh công cụ chặng,
 * và cửa duyệt của lát cắt dọc `SOURCE → VISUAL GENERATE → PREVIEW → COMPARE → ACCEPT`.
 *
 * ── DÙNG LẠI, KHÔNG VẼ MỚI (luật B25) ──────────────────────────────────────────────────────────
 *  · nút     → `ToolbarChip` / `ToolbarBar` (đã có; tự bọc Tooltip, tự lo `aria-disabled` +
 *              `aria-describedby` cho nút mờ). KHÔNG tự dựng `<button>` công cụ nào.
 *  · icon    → `CommandIcon` (bảng tra danh sách trắng đã có).
 *  · danh sách → `workingSetChips()` của `lib/commands/toolbar-source.ts` — CỬA DUY NHẤT đọc sổ.
 *                Component này KHÔNG khai tên/icon/thứ tự năng lực nào.
 *  · tiến trình → `LightBar` + lõi `lib/ui/tien-trinh.ts`.
 *  · chạy    → `chayDungHinhAnh()` → `runNode()` (hàng đợi + credit + cache SẴN CÓ).
 *
 * ── HAI LUẬT NHÌN THẤY ĐƯỢC TRÊN MÀN ───────────────────────────────────────────────────────────
 *  ⛔ KHÔNG BỊA %. Thanh trên = **bước i/n**, đếm thật. Thanh dưới = trong-một-bước, `value`
 *     BỎ TRỐNG ⇒ `LightBar` tự chuyển sang hình thái không-đếm-được và không in con số nào.
 *  ⛔ KHÔNG GHI ĐÈ IM LẶNG. Ảnh máy sinh nằm ở khay **Đề xuất**; chỉ nút "Nhận" mới đổi ảnh
 *     nguồn. Đóng cửa duyệt giữa chừng thì đề xuất vẫn còn nguyên trong khay, không mất, không tự áp.
 *
 * ── AN TOÀN DEMO (§27) ─────────────────────────────────────────────────────────────────────────
 * Nhà cung cấp chết ⇒ `chayDungHinhAnh` trả `{ok:false, loi}` với câu đã dịch từ
 * `friendlyAiError`. Cửa duyệt hiện đúng câu đó + nút "Thử lại". KHÔNG có nhánh nào dựng ảnh giả
 * để trông như thành công; và cả app không sập — lỗi ở đây là state cục bộ của một panel.
 */

import { useCallback, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { CSSProperties, DragEvent } from 'react';
import { ASSET_MIME } from '@/components/LibraryPanel';
import { RADIUS } from '@/lib/geometry';
import { ToolbarBar, ToolbarChip } from './ToolbarChip';
import { CommandIcon } from './command-icon';
import LightBar from './LightBar';
import CuaAnhThanhSpec from './CuaAnhThanhSpec';
import { workingSetChips, type NangLucCtx } from '@/lib/commands/toolbar-source';
import type { Stage } from '@/lib/commands/registry';
import {
  NHAN_KIEU_NGUON,
  sanSangDung,
  tienTrinhCaLuot,
  type DeXuatHinhAnh,
  type KieuNguon,
  type TienDoDung,
  type YeuCauDung,
} from '@/lib/capabilities/visual-generate';
import { chayDungHinhAnh } from '@/lib/capabilities/visual-generate-run';
import {
  boDeXuat,
  datAnhNguon,
  datKieuNguon,
  getNguonAnh,
  nhanDeXuat,
  subscribeNguonAnh,
  themDeXuat,
} from '@/lib/capabilities/nguon-anh';

const ANH_SANG = ['', 'Daylight', 'Sunset', 'Đèn vàng ấm ban đêm', 'Studio soft light'] as const;

/* ─────────────────────────── NGUỒN CÓ DANH TÍNH (W1-6b) ─────────────────────────── */

/**
 * `/api/library/<id>/file` ⇒ `<id>` — **id thật của một `LibraryAsset`**, không phải id bịa.
 *
 * ── VÌ SAO ĐÂY LÀ ID ĐÚNG, VÀ VÌ SAO KHÔNG CÓ ID NÀO KHÁC ─────────────────────────────────────
 * Tầng bền xuyên máy (`xuat-xu-ben.ts` → `POST /api/asset-representation`) đòi `assetId` là một
 * `LibraryAsset` **đang tồn tại** — route cố ý không bao giờ tạo asset. Trong repo hôm nay chỉ có
 * MỘT nơi phát ra danh tính đó ra ngoài: `LibraryPanel` gắn `item.url = /api/library/{a.id}/file`
 * vào `dataTransfer` khi kéo một món trên kệ (`components/LibraryPanel.tsx:302`), và chính URL đó
 * đã được `FlowCanvas` đọc từ trước. Nên id ở đây **được đọc lại từ nguồn phát**, không tự chế.
 *
 * ⛔ Ảnh chọn bằng hộp thoại tệp (`<input type=file>`) KHÔNG có id: nó chưa bao giờ lên máy chủ,
 *    không có hàng `LibraryAsset` nào để gắn vào. Ca đó **cố ý** trả `undefined` — bịa một id cho
 *    nó là tạo một xuất xứ trỏ vào hư không, tệ hơn hẳn việc để trống (route sẽ trả 404, và
 *    `ghiXuatXuBen` ghi lại sự cố `tu-choi` thay vì im lặng).
 */
export function idAssetTuUrl(url: string): string | undefined {
  const m = /^\/api\/library\/([^/?#]+)\/file(?:[?#]|$)/.exec(url.trim());
  return m ? m[1] : undefined;
}

export interface ThamSoYeuCau {
  readonly anhNguon?: string;
  readonly kieuNguon: KieuNguon;
  /** Danh tính vật nguồn — CHỈ có khi nguồn đến từ Thư viện. Xem `idAssetTuUrl`. */
  readonly nguonId?: string;
  readonly yDinh: string;
  readonly anhSang: string;
  readonly nangCap: boolean;
}

/**
 * Dựng `YeuCauDung` cho một lượt bấm "Dựng". Tách ra khỏi `CuaDuyet` **cố ý**: đây là ĐƯỜNG NỐI
 * `nguonId` — thứ quyết định tầng bền xuyên máy có nổ hay không — nên nó phải là hàm thuần,
 * gọi được từ proof runtime, chứ không nằm chôn trong một closure React chỉ chạy trong trình duyệt.
 */
export function dungYeuCau(p: ThamSoYeuCau): YeuCauDung {
  return {
    anhNguon: p.anhNguon,
    nguonId: p.nguonId,
    kieuNguon: p.kieuNguon,
    yDinh: p.yDinh,
    nac: 'nhanh',
    doiAnhSang: p.anhSang || undefined,
    nangCap: p.nangCap,
  };
}

/** Trạng thái rỗng dùng cho lần render trên máy chủ — sổ nguồn là bộ nhớ của MÁY người dùng. */
const RONG = getNguonAnh();

function useNguonAnh() {
  return useSyncExternalStore(subscribeNguonAnh, getNguonAnh, () => RONG);
}

export interface StageToolbeltProps {
  stage: Stage;
  /** Chặng tự biết đang có chọn gì không — Toolbelt không đoán hộ. */
  coDoiTuongChon?: boolean;
}

export default function StageToolbelt({ stage, coDoiTuongChon = false }: StageToolbeltProps) {
  const nguon = useNguonAnh();
  const [mo, setMo] = useState(false);
  const [moKhoi, setMoKhoi] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const ctx: NangLucCtx = useMemo(
    () => ({ stage, coAnhNguon: Boolean(nguon.anhNguon), coDoiTuongChon }),
    [stage, nguon.anhNguon, coDoiTuongChon],
  );
  const chips = useMemo(() => workingSetChips(ctx), [ctx]);

  /**
   * Nguồn ĐÃ ĐỊNH DANH: cặp `{url, id}` của món kéo từ Thư viện. Giữ ở đây, KHÔNG nhét vào sổ
   * `nguon-anh.ts` — sổ đó có proof riêng của lát trước, và `nguonId` chỉ là một thuộc tính của
   * lần chọn nguồn này, không phải một trạng thái mới của sổ.
   */
  const [nguonKho, setNguonKho] = useState<{ url: string; id: string } | null>(null);
  /**
   * ⚠️ Chỉ nhận id khi ảnh nguồn HIỆN TẠI đúng là món đã kéo. `nhanDeXuat()` thay `anhNguon` bằng
   * kết quả máy dựng — lúc đó id cũ KHÔNG còn mô tả thứ đang cầm, giữ lại là khai sai xuất xứ.
   */
  const nguonId = nguonKho && nguon.anhNguon === nguonKho.url ? nguonKho.id : undefined;

  const chonTep = useCallback((file: File | undefined) => {
    if (!file) return;
    // Tệp cục bộ chưa bao giờ lên máy chủ ⇒ KHÔNG có `LibraryAsset` nào để gắn. Xoá id cũ.
    setNguonKho(null);
    const reader = new FileReader();
    reader.onload = () => datAnhNguon(String(reader.result), file.name);
    reader.readAsDataURL(file);
  }, []);

  const keVao = useCallback((e: DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes(ASSET_MIME)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const thaTuThuVien = useCallback((e: DragEvent<HTMLDivElement>) => {
    const url = e.dataTransfer.getData(ASSET_MIME);
    if (!url) return;
    e.preventDefault();
    const id = idAssetTuUrl(url);
    // URL lạ khuôn ⇒ vẫn nhận ảnh (có còn hơn không) nhưng KHÔNG gắn id — xem `idAssetTuUrl`.
    setNguonKho(id ? { url, id } : null);
    datAnhNguon(url, 'Ảnh trong Thư viện');
  }, []);

  return (
    /* 🔀 HOÀ NHÁNH (`187a7cac`) — `pointerEvents:'none'`, cùng luật với ổ toolbelt của `AppShell`
       (04/09): hộp chỉ để BỐ TRÍ thì không bắt chuột, phần tử nhìn thấy được tự bật lại. Hộp này
       nằm đè lên mặt vẽ 2D và rộng/cao hơn thanh nút bên trong (đo được: 2 điểm hở ở mép phải),
       nên phần thừa của nó đang NUỐT cú bấm xuống mặt vẽ — 7,9% mặt vẽ mất vì một hộp trong suốt.
       ⚠️ Mỗi vật nhìn thấy được bên trong PHẢI tự bật lại `pointerEvents:'auto'`; quên một chỗ là
       chỗ đó thành câm. Đã bật: `ToolbarBar` (dưới), ô thả kéo-từ-Thư-viện, và `panel` của cửa
       duyệt (xem hằng `panel` cuối tệp). */
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', pointerEvents: 'none' }}>
      {mo && <CuaDuyet nguonId={nguonId} onDong={() => setMo(false)} />}
      {moKhoi && <CuaAnhThanhSpec onDong={() => setMoKhoi(false)} />}

      <ToolbarBar style={{ pointerEvents: 'auto' }}>
        {/* Bước SOURCE — nút này KHÔNG phải năng lực gộp (không nằm trong `compound.ts`): nó chỉ
            đưa nguyên liệu vào tay. Đặt trước dấu ngăn để đọc đúng thứ tự dây chuyền. */}
        {/* Ô THẢ: kéo một món từ Thư viện vào đây thì nguồn có DANH TÍNH (`nguonId`) — đó là điều
            kiện để xuất xứ ghi được xuống DB, tức sống qua đổi máy. Bấm vẫn mở hộp thoại tệp như
            cũ (nguồn không danh tính, chỉ bền trong localStorage của máy này). */}
        {/* `pointerEvents:'auto'` — hộp cha thôi bắt chuột (xem trên); ô thả là vật THẬT, phải tự
            bật lại, nếu không thì vừa không bấm được vừa không thả được món kéo từ Thư viện. */}
        <div onDragOver={keVao} onDragEnter={keVao} onDrop={thaTuThuVien} style={{ pointerEvents: 'auto' }}>
          <ToolbarChip
            icon={<CommandIcon name="ImagePlus" size={18} />}
            label={nguon.anhNguon ? `Nguồn: ${nguon.tenNguon ?? 'ảnh đã chọn'}` : 'Chọn ảnh nguồn'}
            desc={
              nguonId
                ? 'Nguồn từ Thư viện — có danh tính, xuất xứ lưu được xuyên máy'
                : 'Ảnh/phác thảo/khung nhìn làm nguyên liệu — bấm để chọn tệp, hoặc kéo một ảnh từ Thư viện vào đây'
            }
            active={Boolean(nguon.anhNguon)}
            onClick={() => fileRef.current?.click()}
          />
        </div>
        <ToolbarBar.Sep />
        {chips.map((c) => (
          <ToolbarChip
            key={c.id}
            icon={<CommandIcon name={c.icon} size={18} />}
            label={c.label[0]}
            desc={c.desc[0]}
            disabled={!c.enabled}
            disabledReason={c.disabledReason}
            // Hai năng lực đã có tay thi hành thật; các năng lực còn lại vẫn MỜ kèm lý do thật ở
            // `workingSetChips` — không gắn `onClick` giả cho chúng (§9 cấm nút giả).
            onClick={
              c.id === 'visual-generate'
                ? () => setMo(true)
                : c.id === 'image-to-3d'
                  ? () => setMoKhoi(true)
                  : undefined
            }
          />
        ))}
      </ToolbarBar>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        aria-label="Chọn ảnh nguồn"
        style={{ display: 'none' }}
        onChange={(e) => {
          chonTep(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}

/* ─────────────────────────── cửa duyệt ─────────────────────────── */

function CuaDuyet({ nguonId, onDong }: { nguonId?: string; onDong: () => void }) {
  const nguon = useNguonAnh();
  const [yDinh, setYDinh] = useState('');
  const [anhSang, setAnhSang] = useState('');
  const [nangCap, setNangCap] = useState(false);
  const [tienDo, setTienDo] = useState<TienDoDung | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const dangChay = tienDo?.trangThai === 'queued' || tienDo?.trangThai === 'running';
  const idLyDo = useId();
  const congNguon = sanSangDung({ coAnhNguon: Boolean(nguon.anhNguon) });
  const lyDoNut = dangChay
    ? 'Đang dựng — chờ lượt này xong rồi bấm tiếp'
    : congNguon.sanSang
      ? undefined
      : congNguon.lyDo?.[0];

  const chay = useCallback(async () => {
    setLoi(null);
    setTienDo({ trangThai: 'queued', soBuocXong: 0, tongBuoc: 1 });
    const kq = await chayDungHinhAnh(
      dungYeuCau({
        anhNguon: nguon.anhNguon,
        kieuNguon: nguon.kieuNguon,
        // ĐƯỜNG NỐI W1-6b: `nguonId` chảy tới `dungXuatXu()` ⇒ `XuatXu.nguon.id` ⇒ tầng bền
        // xuyên máy của `xuat-xu-ben.ts` mới nổ. Bỏ dòng này là app quay lại "F5 sống, đổi máy chết".
        nguonId,
        yDinh,
        anhSang,
        nangCap,
      }),
      { onTienDo: setTienDo },
    );
    if (kq.ok && kq.deXuat) themDeXuat(kq.deXuat);
    else setLoi(kq.loi ?? 'Không rõ nguyên nhân.');
  }, [nguon.anhNguon, nguon.kieuNguon, nguonId, yDinh, anhSang, nangCap]);

  const tCaLuot = tienDo ? tienTrinhCaLuot(tienDo) : null;

  return (
    <div style={panel} role="dialog" aria-label="Dựng hình ảnh">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <CommandIcon name="Sparkles" size={16} />
        <strong style={{ fontSize: 12.5 }}>Dựng hình ảnh</strong>
        <span style={{ marginLeft: 'auto' }}>
          <button type="button" onClick={onDong} style={nutPhu} aria-label="Đóng cửa duyệt">
            Đóng
          </button>
        </span>
      </div>

      {/* ── SOURCE ── */}
      <div style={{ display: 'flex', gap: 10 }}>
        {nguon.anhNguon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={nguon.anhNguon} alt="Ảnh nguồn" style={anhNho} />
        ) : (
          <div style={{ ...anhNho, display: 'grid', placeItems: 'center', fontSize: 10.5, color: 'var(--t3)' }}>
            chưa có nguồn
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
          <label style={nhan}>
            Nguồn này là gì
            <select
              value={nguon.kieuNguon}
              onChange={(e) => datKieuNguon(e.target.value as KieuNguon)}
              style={oNhap}
            >
              {(Object.keys(NHAN_KIEU_NGUON) as KieuNguon[]).map((k) => (
                <option key={k} value={k}>
                  {NHAN_KIEU_NGUON[k][0]}
                </option>
              ))}
            </select>
          </label>
          <label style={nhan}>
            Muốn ra thế nào
            <input
              value={yDinh}
              onChange={(e) => setYDinh(e.target.value)}
              placeholder="phòng khách gỗ sồi, ánh sáng chiều…"
              style={oNhap}
            />
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ ...nhan, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          Ánh sáng
          <select value={anhSang} onChange={(e) => setAnhSang(e.target.value)} style={oNhap}>
            {ANH_SANG.map((a) => (
              <option key={a} value={a}>
                {a || 'giữ nguyên'}
              </option>
            ))}
          </select>
        </label>
        <label style={{ ...nhan, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={nangCap} onChange={(e) => setNangCap(e.target.checked)} />
          Phóng to để in
        </label>
        {/* §26 + "cấm nút giả": nút mờ PHẢI nói vì sao, và HAI ca là HAI lý do khác hẳn nhau —
            "chưa có nguyên liệu" là việc người dùng phải làm gì đó, "đang chạy" là việc chỉ cần
            chờ. Gộp một câu thì người dùng không biết mình đang phải hành động hay đang phải đợi.
            Lý do thiếu-nguồn lấy từ `sanSangDung()`, KHÔNG chép câu — nút trên thanh và nút này
            phải nói y hệt nhau. Dùng `aria-disabled` + `aria-describedby` (không dùng thuộc tính
            `disabled`) vì nút `disabled` bị Tab bỏ qua ⇒ lý do thành thứ chỉ chuột mới đọc nổi. */}
        <button
          type="button"
          aria-disabled={lyDoNut ? true : undefined}
          aria-describedby={lyDoNut ? idLyDo : undefined}
          onClick={lyDoNut ? undefined : chay}
          style={{
            ...nutChinh,
            opacity: lyDoNut ? 'var(--mo-vo-hieu)' : 1,
            cursor: lyDoNut ? 'not-allowed' : 'pointer',
          }}
        >
          {dangChay ? 'Đang dựng…' : 'Dựng'}
        </button>
        {lyDoNut && (
          <span id={idLyDo} style={{ fontSize: 10.5, color: 'var(--t3)' }}>
            {lyDoNut}
          </span>
        )}
      </div>

      {/* ── TIẾN TRÌNH: hai thanh, hai loại. Không thanh nào bịa số. ── */}
      {tienDo && dangChay && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <LightBar
            value={tCaLuot?.doDuoc ? tCaLuot.pct : undefined}
            soVach={24}
            label={`Dựng hình ảnh — bước ${tienDo.soBuocXong + 1}/${tienDo.tongBuoc}`}
          />
          {/* Trong MỘT bước: nhà cung cấp không trả % thật (`lib/ai/client.ts:95` ngoại suy thời
              gian) ⇒ KHÔNG truyền `value`. Đây là chỗ dễ bịa nhất và cố ý để trống. */}
          <LightBar soVach={24} label="Đang chờ nhà cung cấp trả kết quả" />
        </div>
      )}

      {loi && (
        <div style={hopLoi} role="alert">
          <div style={{ fontWeight: 700, marginBottom: 3 }}>Không dựng được</div>
          {/* Câu lỗi là thứ QUAN TRỌNG NHẤT trong hộp này — trước đây `opacity: .9` làm nó mờ hơn
              cái tiêu đề nó đang giải thích. Bỏ hẳn: hạ độ đọc của một thông báo lỗi không đổi
              lại được gì. Màu đi theo token mực của theme. */}
          <div style={{ color: 'var(--t2)' }}>{loi}</div>
          <button type="button" onClick={chay} style={{ ...nutPhu, marginTop: 6 }}>
            Thử lại
          </button>
        </div>
      )}

      {/* ── PREVIEW → COMPARE → ACCEPT ── */}
      {nguon.deXuat.map((d) => (
        <TheDeXuat key={d.id} d={d} />
      ))}

      {nguon.daNhan.length > 0 && (
        <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>
          Đã nhận {nguon.daNhan.length} kết quả — mỗi kết quả mang xuất xứ riêng.
        </div>
      )}
    </div>
  );
}

/** Một đề xuất: xem trước · so trước/sau · nhận hoặc bỏ. Ba việc, một thẻ. */
function TheDeXuat({ d }: { d: DeXuatHinhAnh }) {
  const [viTri, setViTri] = useState(50);
  const x = d.xuatXu;
  return (
    <div style={theDeXuat}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
        <strong>Đề xuất</strong>
        <span style={cheDeXuat}>máy sinh · chờ bạn duyệt</span>
      </div>

      {/* SO SÁNH: hai ảnh chồng nhau, thanh trượt cắt ngang. Có nguồn thì so; không có thì chỉ xem. */}
      <div style={khungSo}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={d.anh} alt="Kết quả đề xuất" style={{ width: '100%', display: 'block' }} />
        {d.anhTruoc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={d.anhTruoc}
            alt="Ảnh nguồn (trước)"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              clipPath: `inset(0 ${100 - viTri}% 0 0)`,
            }}
          />
        )}
      </div>
      {d.anhTruoc && (
        <input
          type="range"
          min={0}
          max={100}
          value={viTri}
          onChange={(e) => setViTri(Number(e.target.value))}
          aria-label="So sánh trước / sau"
          style={{ width: '100%' }}
        />
      )}

      {/* XUẤT XỨ — đi kèm kết quả, không giấu trong log. */}
      <div style={{ fontSize: 10, color: 'var(--t3)', lineHeight: 1.5 }}>
        Chuỗi: {x.chuoiLenh.join(' → ')}
        <br />
        Nguồn: {NHAN_KIEU_NGUON[x.nguon.kieu][0]}
        {x.nguon.id ? ` · ${x.nguon.id}` : ''} · credit ước tính {x.creditUocTinh}
        <br />
        Mức sự thật: {x.mucSuThat === 'khongPhaiSoDo' ? 'ảnh — không mang con số nào' : x.mucSuThat}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button type="button" onClick={() => nhanDeXuat(d.id)} style={nutChinh}>
          Nhận
        </button>
        <button type="button" onClick={() => boDeXuat(d.id)} style={nutPhu}>
          Bỏ
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── hình thức ─────────────────────────── */

const panel: CSSProperties = {
  width: 'min(420px, calc(100vw - 32px))',
  maxHeight: 'min(62vh, 560px)',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: 12,
  borderRadius: RADIUS.r4,
  // Kính là VỎ, ruột đặc (luật 16/08): panel là lớp bọc nổi trên Stage nên được là kính;
  // các thẻ đề xuất bên trong dùng nền đặc, không kính chồng kính.
  background: 'color-mix(in srgb, var(--panel) 88%, transparent)',
  backdropFilter: 'blur(18px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
  border: '1px solid var(--border)',
  boxShadow: '0 8px 30px rgba(0,0,0,.22)',
  color: 'var(--t2)',
  fontSize: 11.5,
  // Hộp cha (`StageToolbelt`) cố ý KHÔNG bắt chuột để trả mặt vẽ lại cho người dùng; cửa duyệt
  // là vật nhìn thấy được nên tự bật lại cho mình — quên dòng này là cả cửa duyệt thành câm.
  pointerEvents: 'auto',
};

const anhNho: CSSProperties = {
  width: 92,
  height: 68,
  flex: 'none',
  objectFit: 'cover',
  borderRadius: RADIUS.r2,
  border: '1px solid var(--border)',
  background: 'var(--field)',
};

const nhan: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 10.5, color: 'var(--t3)' };

const oNhap: CSSProperties = {
  minHeight: 28,
  padding: '0 7px',
  borderRadius: RADIUS.r1,
  border: '1px solid var(--border)',
  background: 'var(--field)',
  color: 'var(--t1)',
  fontFamily: 'inherit',
  fontSize: 11.5,
};

const nutChinh: CSSProperties = {
  minHeight: 30,
  padding: '0 14px',
  borderRadius: RADIUS.r2,
  border: '1px solid transparent',
  background: 'var(--accent)',
  // Token, không hex: `--on-accent` (globals.css:160) đã đo 4,89:1 trên `--accent` và sẽ đi theo
  // khi màu nhấn thứ hai được chốt. Gõ `#fff` ở đây là ghim một con số sẽ sai sau đợt đổi màu.
  color: 'var(--on-accent)',
  fontFamily: 'inherit',
  fontSize: 11.5,
  fontWeight: 700,
  cursor: 'pointer',
};

const nutPhu: CSSProperties = {
  minHeight: 30,
  padding: '0 12px',
  borderRadius: RADIUS.r2,
  border: '1px solid var(--border)',
  background: 'var(--field)',
  color: 'var(--t2)',
  fontFamily: 'inherit',
  fontSize: 11.5,
  fontWeight: 600,
  cursor: 'pointer',
};

const hopLoi: CSSProperties = {
  padding: 9,
  borderRadius: RADIUS.r2,
  // `--danger` có thật trong `globals.css` ⇒ bỏ fallback hex tự chế (luật: không chế màu tại chỗ).
  border: '1px solid color-mix(in srgb, var(--danger) 45%, transparent)',
  background: 'color-mix(in srgb, var(--danger) 12%, transparent)',
  fontSize: 11,
};

const theDeXuat: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 7,
  padding: 9,
  borderRadius: RADIUS.r2,
  border: '1px solid var(--border)',
  background: 'var(--card, var(--field))',
};

/** Nhãn "đề xuất" — CHỮ, không chỉ màu (màu không được là kênh duy nhất). */
const cheDeXuat: CSSProperties = {
  padding: '2px 6px',
  borderRadius: RADIUS.r1,
  border: '1px solid var(--accent-ring)',
  color: 'var(--accent)',
  fontSize: 9.5,
  fontWeight: 700,
};

const khungSo: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: RADIUS.r1,
  border: '1px solid var(--border)',
  background: 'var(--field)',
};
