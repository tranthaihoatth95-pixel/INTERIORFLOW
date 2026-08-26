'use client';

/**
 * app/files/_components/HaiTang.tsx — [marker: filesHaiTang] VỎ **HAI TẦNG** của Files.
 *
 * 📐 **PORT TỪ BẢN VẼ ĐÃ DUYỆT** `docs/mocks/mock-files-hai-tang.html` (617 dòng) — bản vẽ là
 * HỢP ĐỒNG THỊ GIÁC, không phải gợi ý. Port đúng: lưới thẻ `minmax(260px,1fr)` gap 14 · thẻ có
 * *ô xem trước 16/9 → tên → vai → chân thẻ (tình trạng + huy hiệu QUYỀN)* · huy hiệu *Chỉ đọc*
 * dùng **viền nét đứt** (hình dạng, đọc được khi in đen trắng) · nút nhảy `↓ Đến Collection+`
 * hình capsule ở đầu trang · **không nơi nào đọc `--accent`**.
 * ⚠️ Bản vẽ cũ `mock-files-hai-ngan.html` là bản HIỂU SAI (hai NGĂN) — Hoà đổi sang hai TẦNG
 * tối 17/08. Đừng dựng theo nó.
 *
 * 🔎 **CHỖ BẢN VẼ KHÔNG NÓI — TÔI SUY, khai rõ để Hoà bác được:**
 *  ⓐ *Bấm vào một thẻ thì gì xảy ra.* Bản vẽ chỉ vẽ mức DUYỆT (nấc vừa). Ở đây: bấm thẻ = **mở
 *     thư mục ngay dưới lưới**, lưới vẫn nằm nguyên trên (không rời trang, không modal) — thẻ
 *     đang mở nhận `aria-expanded` + viền đậm. Chọn cách này vì nó giữ được đúng thứ bản vẽ vẽ
 *     (lưới duyệt) mà vẫn có chỗ cho nội dung thật chạy.
 *  ⓑ *Ô xem trước.* Bản vẽ dựng SVG tại chỗ và tự khai *"bản build sẽ thay bằng thumbnail THẬT"*.
 *     Chưa có nguồn thumbnail ⇒ ở đây là **ô trung tính mang biểu tượng loại**, KHÔNG vẽ tay giả
 *     nội dung (Hoà bác đồ-vẽ-tay-làm-hình-sản-phẩm 20/08). Có kho thumbnail thì thay đúng chỗ này.
 *  ⓒ *Dãy avatar + số "24 thư mục · cập nhật hôm nay".* Bản vẽ có, nhưng đó là **số của mock**.
 *     Chưa có nguồn thật cho 3/5 thư mục ⇒ hiện tình trạng thật (`đã nối kho` / `chưa nối kho`),
 *     **cấm bịa số**. Avatar bỏ hẳn cho tới khi có presence thật.
 *  ⓓ *Thanh công cụ đầu trang của bản vẽ* (ô tìm ⌘K · Nhập tệp · Tạo thư mục · chuông · avatar)
 *     KHÔNG port: trong app thật những thứ đó là của vỏ `AppShell`, dựng lại là **hai bản cùng
 *     một việc**. Chỉ giữ nút nhảy — thứ riêng của màn này.
 *
 * ⭐ VÌ SAO HAI TẦNG **KHÔNG PHẢI MỘT BỘ LỌC** — nhìn mặt là ra: hai tầng **xếp chồng, cùng thấy
 * được** (cuộn là gặp), mỗi tầng có tiêu đề + một câu **tự khai TRỤC** của mình (*quyền* ↔ *loại
 * vật*), và thẻ tầng ① khai **AI ĐƯỢC ĐỘNG VÀO** — thứ một bộ lọc không bao giờ có.
 *
 * 🎨 Không token màu mới, không đụng `--accent*` (Hoà chưa chốt màu nhấn thứ hai). Thư mục đang
 * mở nhận diện bằng **viền đậm + chữ đậm + `aria-expanded`** — đọc được khi bỏ hết màu.
 * ⌨️ Mỗi thẻ là một `<button>` thật (Tab tới được, Enter/Space mở). Thư mục đang mở **NHỚ theo
 * MÁY** (§6.1 nhớ giữa các phiên · §6.4 không vào `.idf`). Cấm auto-hide.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { FolderOpen, Building2, Truck, ShieldCheck, Archive, ArrowDown, ChevronDown } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { RawStyle } from '@/components/filemanager/RawStyle';
import { THU_MUC_HE_THONG, type ThuMucDef, type ThuMucKey } from '../_lib/hai-tang';
import { CollectionPlus } from './CollectionPlus';

const THU_MUC_ICON: Record<ThuMucKey, typeof FolderOpen> = {
  duAn: FolderOpen,
  studio: Building2,
  nhaCungCap: Truck,
  daDuyet: ShieldCheck,
  luuTru: Archive,
};

/* Vòng focus KHÔNG khai được bằng style nội tuyến (`:focus-visible` là lớp giả) — bơm qua
   `RawStyle`, đúng cách repo đã dùng.
   🔴 KHÔNG dùng `var(--focus-ring)`: token đó **KHÔNG TỒN TẠI** trong `app/globals.css`.
   `grep -- '--focus-ring' app components lib` trước lượt này chỉ ra đúng một nơi dùng —
   `HaiNgan.tsx:38` — tức nó chưa bao giờ chạy: `outline: <rỗng>` là khai không hợp lệ, trình
   duyệt bỏ qua cả dòng, nên vòng focus "đã sửa" thật ra vẫn là vòng mặc định. Bản vẽ có khai
   `--focus-ring` trong khối token của nó, nhưng app thì chưa — thêm token là việc của lane MÀU
   (`app/globals.css` cấm đụng). Ở đây khai bằng token CÓ THẬT (`--t1`), không tự chế hex. */
const CSS_TANG = `
.if-tm:focus-visible{outline:2px solid var(--t1);outline-offset:2px}
.if-tang-nhay:focus-visible{outline:2px solid var(--t1);outline-offset:2px}
.if-tang-moc:focus-visible{outline:2px solid var(--t1);outline-offset:4px;border-radius:var(--r-1)}
.if-tm{transition:border-color var(--nhip-bam) var(--ease-apple),transform var(--nhip-bam) var(--ease-apple)}
.if-tm:hover{border-color:var(--border-strong);transform:translateY(-1px)}
@media (prefers-reduced-motion: reduce){.if-tm{transition:none}.if-tm:hover{transform:none}}
`;

/** Nhớ theo MÁY, không vào `.idf` (§6.4: nấc và cách bày là chuyện của từng máy). */
const NHO_KEY = 'if.files.thumuc_v1';
const KEYS = THU_MUC_HE_THONG.map((t) => t.khoa);

function docThuMuc(): ThuMucKey {
  try {
    const raw = window.localStorage.getItem(NHO_KEY);
    return KEYS.includes(raw as ThuMucKey) ? (raw as ThuMucKey) : 'duAn';
  } catch {
    return 'duAn';
  }
}

/** Huy hiệu QUYỀN — port `.quy` của bản vẽ. `ro` = **nét đứt** (hình dạng, không phải màu). */
function HuyHieuQuyen({ dinh, chu }: { dinh: ThuMucDef; chu: string }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '1px 8px',
        fontSize: 'var(--fs-2xs)', borderRadius: 'var(--r-full)',
        background: 'var(--field)',
        border: dinh.dangQuyen === 'ro' ? '1px dashed var(--border)' : '1px solid var(--border)',
        borderColor: dinh.dangQuyen === 'admin' ? 'var(--border-strong)' : undefined,
        color: dinh.dangQuyen === 'admin' ? 'var(--t1)' : 'var(--t2)',
      }}
    >
      {chu}
    </span>
  );
}

/** Màn trống của thư mục CHƯA NỐI KHO — nói *chưa có gì* + *cái gì sẽ vào đây*, không phải câu lỗi.
 *  ⛔ Cấm nhồi dữ liệu mẫu cho đỡ trống: ô trống là bằng chứng còn việc (§9). */
function ManTrong({ chu }: { chu: string }) {
  return (
    <p
      style={{
        margin: 0, padding: '22px 16px', textAlign: 'center',
        border: '1px dashed var(--border)', borderRadius: 'var(--r-3)',
        fontSize: 'var(--fs-2xs)', color: 'var(--t3)', lineHeight: 1.6,
      }}
    >
      {chu}
    </p>
  );
}

export function HaiTang({ duAn, nhaCungCap }: { duAn: ReactNode; nhaCungCap: ReactNode }) {
  const tr = useT();
  /* Mặc định 'duAn' ở lượt render đầu (kể cả SSR) rồi mới đọc lựa chọn đã nhớ — đọc localStorage
     ngay lúc khởi tạo state sẽ lệch giữa server và client. */
  const [thuMuc, setThuMuc] = useState<ThuMucKey>('duAn');
  const tang2Ref = useRef<HTMLDivElement | null>(null);
  const thanRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setThuMuc(docThuMuc()); }, []);

  const chon = useCallback((k: ThuMucKey) => {
    setThuMuc(k);
    try { window.localStorage.setItem(NHO_KEY, k); } catch { /* private-mode: mất trí nhớ, không gãy */ }
  }, []);

  const emDiu = () =>
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Nhảy xuống tầng ②. Giữ `href` để nó là một LIÊN KẾT thật (bàn phím, chuột giữa, trình đọc màn
     hình đều dùng được); chỉ chặn mặc định để cuộn êm trong khung này, và **chuyển focus** sang
     tiêu đề tầng ② — thiếu bước đó thì Tab tiếp sẽ quay lại đầu trang. */
  const nhayXuong = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const dich = tang2Ref.current;
    if (!dich) return;
    e.preventDefault();
    dich.scrollIntoView({ behavior: emDiu() ? 'auto' : 'smooth', block: 'start' });
    dich.querySelector<HTMLElement>('h2')?.focus();
  };

  const dinh = THU_MUC_HE_THONG.find((t) => t.khoa === thuMuc)!;

  return (
    <div style={{ display: 'flex', minHeight: 0, flex: 1, flexDirection: 'column', overflowY: 'auto' }}>
      <RawStyle css={CSS_TANG} />

      {/* ══ TẦNG ① · THƯ MỤC HỆ THỐNG ══════════════════════════════════════════ */}
      <section aria-labelledby="tang1-tieu-de" style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <h2 id="tang1-tieu-de" style={{ margin: 0, fontSize: 'var(--fs-lg)', letterSpacing: '-.01em', color: 'var(--t1)' }}>
            <span style={{ fontSize: 'var(--fs-2xs)', fontWeight: 700, color: 'var(--t4)', letterSpacing: '.06em', textTransform: 'uppercase', marginRight: 8, verticalAlign: 2 }}>
              {tr('Tầng ①', 'Tier ①')}
            </span>
            {tr('Thư mục hệ thống', 'System folders')}
          </h2>
          <a
            href="#collection-plus"
            onClick={nhayXuong}
            className="if-tang-nhay"
            style={{
              marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6,
              minHeight: 'var(--tap)', padding: '0 12px', borderRadius: 'var(--r-full)',
              border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t2)',
              fontSize: 'var(--fs-2xs)', textDecoration: 'none',
            }}
          >
            <ArrowDown size={18} strokeWidth={1.8} aria-hidden />
            {tr('Đến Collection+', 'Go to Collection+')}
          </a>
        </div>
        {/* Câu tự khai TRỤC của tầng này — tầng ② khai trục khác, đó là chỗ hai tầng khác BẢN CHẤT. */}
        <p style={{ margin: '4px 0 14px', maxWidth: '88ch', fontSize: 'var(--fs-2xs)', color: 'var(--t3)', lineHeight: 1.6 }}>
          {tr(
            '5 thư mục cấp studio, gom theo QUYỀN truy cập — ai được động vào cái gì. Ngăn “phần thô” cũ đã gộp vào Nhà cung cấp.',
            'Five studio-level folders grouped by ACCESS RIGHT — who may touch what. The old “raw stock” drawer now lives inside Suppliers.',
          )}
        </p>

        <div
          role="list"
          aria-label={tr('5 thư mục hệ thống', 'Five system folders')}
          style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
        >
          {THU_MUC_HE_THONG.map((t) => {
            const on = t.khoa === thuMuc;
            const Icon = THU_MUC_ICON[t.khoa];
            return (
              <div key={t.khoa} role="listitem">
                <button
                  type="button"
                  className="if-tm"
                  aria-expanded={on}
                  aria-controls="thumuc-than"
                  onClick={() => {
                    chon(t.khoa);
                    if (!on) {
                      window.requestAnimationFrame(() =>
                        thanRef.current?.scrollIntoView({ behavior: emDiu() ? 'auto' : 'smooth', block: 'nearest' }),
                      );
                    }
                  }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: 0, cursor: 'pointer',
                    borderRadius: 'var(--r-3)', overflow: 'hidden', background: 'var(--card)',
                    border: on ? '1px solid var(--border-strong)' : '1px solid var(--border)',
                  }}
                >
                  {/* Ô xem trước — bản vẽ để dành cho THUMBNAIL THẬT (nó tự khai vậy). Chưa có kho
                      thumbnail ⇒ ô trung tính mang biểu tượng loại, không vẽ tay giả nội dung. */}
                  <span
                    aria-hidden
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      aspectRatio: '16 / 9', background: 'var(--field)',
                      borderBottom: '1px solid var(--vien-mo)', color: 'var(--t4)',
                    }}
                  >
                    {/* soi-mien-tru: F-ICON-SIZE — glyph TRANG TRÍ lấp ô xem trước 16:9,
                        aria-hidden, không gắn với hạng điều khiển nào; ép về 14-20 là bóp
                        một hình minh hoạ xuống cỡ icon giao diện. */}
                    <Icon size={30} strokeWidth={1.2} />
                  </span>
                  <span style={{ display: 'grid', gap: 6, padding: '10px 12px 12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-ui)', fontWeight: on ? 'var(--fw-semi)' : 'var(--fw-normal)', color: 'var(--t1)' }}>
                      <Icon size={14} strokeWidth={1.8} aria-hidden />
                      {tr(t.ten.vi, t.ten.en)}
                      <ChevronDown
                        size={14}
                        strokeWidth={1.8}
                        aria-hidden
                        style={{ marginLeft: 'auto', color: 'var(--t4)', transform: on ? 'rotate(180deg)' : undefined }}
                      />
                    </span>
                    <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--t3)' }}>{tr(t.vai.vi, t.vai.en)}</span>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 }}>
                      {/* Bản vẽ để "24 thư mục · cập nhật hôm nay" — số của mock. Chưa có nguồn
                          thật cho 3/5 thư mục ⇒ nói TÌNH TRẠNG thật thay vì bịa số. */}
                      <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--t3)' }}>
                        {t.daNoiKho ? tr('đã nối kho', 'connected') : tr('chưa nối kho', 'not connected')}
                      </span>
                      <HuyHieuQuyen dinh={t} chu={tr(t.quyen.vi, t.quyen.en)} />
                    </span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* THÂN — nội dung của thư mục đang mở, nằm NGAY DƯỚI lưới (lưới không biến mất). */}
      <div
        id="thumuc-than"
        ref={thanRef}
        style={{ display: 'flex', flexDirection: 'column', padding: '14px 16px 8px' }}
      >
        <p style={{ margin: '0 0 8px', fontSize: 'var(--fs-2xs)', color: 'var(--t3)' }}>
          {tr('Đang mở', 'Open')}: <strong style={{ color: 'var(--t2)' }}>{tr(dinh.ten.vi, dinh.ten.en)}</strong>
          {' · '}{tr(dinh.vai.vi, dinh.vai.en)}
        </p>
        {thuMuc === 'duAn' && duAn}
        {thuMuc === 'nhaCungCap' && nhaCungCap}
        {!dinh.daNoiKho && <ManTrong chu={tr(dinh.khiTrong.vi, dinh.khiTrong.en)} />}
      </div>

      {/* ══ TẦNG ② · COLLECTION+ ═══════════════════════════════════════════════ */}
      <div ref={tang2Ref}>
        <CollectionPlus />
      </div>
    </div>
  );
}
