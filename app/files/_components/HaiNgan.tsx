'use client';

/**
 * ⛔ **LỖI THỜI 17/08 tối — KHÔNG CÒN AI MOUNT FILE NÀY.** Hoà đổi Files từ *hai NGĂN* sang
 * **hai TẦNG** (thư mục hệ thống 5 loại + Collection+ 8 gói). Vỏ đang chạy là
 * `./HaiTang.tsx`; bản vẽ hợp đồng là `docs/mocks/mock-files-hai-tang.html`.
 * Giữ lại làm dấu vết (đúng luật *văn bản bị thay phải đóng dấu tại chỗ, không bỏ hoang*) —
 * **cấm mount lại, cấm chép cách bố cục ở đây sang màn khác.** Lõi `../_lib/ngan-tho.ts` thì
 * VẪN SỐNG: nó là ruột của thư mục *Nhà cung cấp* (`./NganPhanTho.tsx`).
 * MAIN quyết có xoá hẳn hay không — xoá thì mất luôn phần đối chiếu "vì sao đổi".
 *
 * app/files/_components/HaiNgan.tsx — [marker: filesHaiNgan] VỎ HAI NGĂN của Files.
 *
 * Hoà chốt 17/08 (`docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md` §3): *"Khác bản chất ⇒ phải THẤY ĐƯỢC
 * trên giao diện. **Cấm rút thành một bộ lọc trong cùng danh sách.**"*
 *
 * ⭐ VÌ SAO ĐÂY KHÔNG PHẢI BỘ LỌC — và làm sao nhìn ra được điều đó:
 *  ① mỗi ngăn khai **AI THẤY** ngay dưới tên (*người trong dự án* ↔ *ai cũng thấy · nhiều người
 *     góp*). Bộ lọc không bao giờ đổi tập người xem — đây mới là chỗ khác BẢN CHẤT, và nó nằm
 *     trên mặt chứ không nằm trong tài liệu;
 *  ② hai ngăn có **nội dung khác loại** (tệp ↔ vật liệu chưa đủ định nghĩa), không phải hai lát
 *     của một danh sách;
 *  ③ đổi ngăn là đổi cả vùng nội dung, không phải rút gọn danh sách đang xem.
 *
 * 🎨 **ĐỌC ĐƯỢC KHI BỎ HẾT MÀU** (đích nghiệm thu của phiếu): ngăn đang mở nhận diện bằng **chữ
 * đậm + dải mực 2px đáy + `aria-selected`**, không bằng sắc độ. Bỏ toàn bộ màu vẫn phân biệt được.
 * Không token màu mới, không đụng `--accent*` — Hoà chưa chốt màu nhấn thứ hai.
 *
 * ⌨️ Bàn phím: `role="tablist"` + mũi tên trái/phải + Home/End (khuôn tab chuẩn). Ngăn đang mở
 * **NHỚ giữa các phiên** (§6.1 hợp đồng) — cấm auto-hide, cấm quên lựa chọn.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { FolderOpen, Boxes } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { RawStyle } from '@/components/filemanager/RawStyle';
import { NGAN_LABEL, NGAN_MOTA, type NganKey } from '../_lib/ngan-tho';

const NGAN_KEYS: NganKey[] = ['duAn', 'thoChung'];
const NGAN_ICON = { duAn: FolderOpen, thoChung: Boxes } as const;

/* Vòng focus KHÔNG khai được bằng style nội tuyến (`:focus-visible` là lớp giả). Bơm qua
   `RawStyle` — đúng cách repo đã dùng cho lib G4, và là lý do nó tồn tại. Nút đây `border:none;
   background:transparent` nên vòng mặc định của trình duyệt mờ trên nền tối; khai tường minh để
   người dùng bàn phím luôn thấy mình đang ở đâu (WCAG 2.4.7). */
/* SỬA 05/09 — bản cũ ghi "outline: var(--focus-ring)", tức CHỈ đặt MÀU: outline-style vẫn là
   none nên trình duyệt KHÔNG vẽ gì, dù luật trông như đã có ring. Đo bằng Tab thật: nút này là
   chỗ DUY NHẤT trong 183 chặng dừng mất hẳn vòng focus. Máy soi không bắt được (tệp có
   focus-visible, lại có outline:var) — chỉ bàn phím thật mới lộ. Nay khai đủ BA phần
   (dày · kiểu · màu), giống 15 chỗ khác trong repo. */
const CSS_NGAN = `
.if-ngan:focus-visible{outline:var(--stroke-focus) solid var(--focus-ring);outline-offset:-2px;border-radius:var(--r-1)}
`;

/** Nhớ theo MÁY, không vào `.idf` (§6.4 hợp đồng: nấc và cách bày là chuyện của từng máy). */
const NHO_KEY = 'if.files.ngan_v1';

function docNgan(): NganKey {
  try {
    const raw = window.localStorage.getItem(NHO_KEY);
    return raw === 'thoChung' || raw === 'duAn' ? raw : 'duAn';
  } catch {
    return 'duAn';
  }
}

export function HaiNgan({ duAn, thoChung }: { duAn: ReactNode; thoChung: ReactNode }) {
  const tr = useT();
  /* Mặc định 'duAn' ở lượt render đầu (kể cả SSR) rồi mới đọc lựa chọn đã nhớ — đọc localStorage
     lúc khởi tạo state sẽ lệch giữa server và client. */
  const [ngan, setNgan] = useState<NganKey>('duAn');
  const nutRef = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => { setNgan(docNgan()); }, []);

  const chon = useCallback((k: NganKey) => {
    setNgan(k);
    try { window.localStorage.setItem(NHO_KEY, k); } catch { /* private-mode: mất trí nhớ, không gãy */ }
  }, []);

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const i = NGAN_KEYS.indexOf(ngan);
    let tiep: NganKey | null = null;
    if (e.key === 'ArrowRight') tiep = NGAN_KEYS[(i + 1) % NGAN_KEYS.length];
    else if (e.key === 'ArrowLeft') tiep = NGAN_KEYS[(i - 1 + NGAN_KEYS.length) % NGAN_KEYS.length];
    else if (e.key === 'Home') tiep = NGAN_KEYS[0];
    else if (e.key === 'End') tiep = NGAN_KEYS[NGAN_KEYS.length - 1];
    if (!tiep) return;
    e.preventDefault();
    chon(tiep);
    nutRef.current[tiep]?.focus();
  };

  return (
    <div style={{ display: 'flex', minHeight: 0, flex: 1, flexDirection: 'column' }}>
      <RawStyle css={CSS_NGAN} />
      <div
        role="tablist"
        aria-label={tr('Hai ngăn của Files', 'The two Files drawers')}
        onKeyDown={onKey}
        style={{
          display: 'flex', gap: 4, padding: '8px 14px 0',
          borderBottom: '1px solid var(--border)', background: 'var(--panel)',
        }}
      >
        {NGAN_KEYS.map((k) => {
          const on = k === ngan;
          const Icon = NGAN_ICON[k];
          const nhan = NGAN_LABEL[k];
          return (
            <button
              key={k}
              ref={(el) => { nutRef.current[k] = el; }}
              type="button"
              role="tab"
              id={`ngan-tab-${k}`}
              aria-selected={on}
              aria-controls={`ngan-panel-${k}`}
              tabIndex={on ? 0 : -1}
              onClick={() => chon(k)}
              className="if-ngan"
              style={{
                display: 'grid', gap: 1, justifyItems: 'start', textAlign: 'left',
                minHeight: 'var(--tap-lg)', padding: '6px 12px 8px', cursor: 'pointer',
                border: 'none', background: 'transparent',
                /* dải mực 2px đáy = định danh ngăn đang mở; HÌNH DẠNG chứ không phải màu, nên nó
                   sống sót khi bỏ hết màu — đúng đích nghiệm thu của phiếu. */
                borderBottom: on ? '2px solid var(--t1)' : '2px solid transparent',
                color: on ? 'var(--t1)' : 'var(--t3)',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-ui)', fontWeight: on ? 'var(--fw-semi)' : 'var(--fw-normal)' }}>
                <Icon size={14} strokeWidth={1.5} aria-hidden />
                {tr(nhan.ten.vi, nhan.ten.en)}
              </span>
              {/* Dòng AI THẤY — thứ phân biệt BẢN CHẤT. Một bộ lọc không bao giờ có dòng này.
                  Màu `--t3` chứ KHÔNG phải `--t4`: đo được `--t4` chỉ đạt 3,65:1 (nền tối) và
                  **2,86:1** (nền sáng) trên `--panel` — trượt ngưỡng chữ 4,5:1 của WCAG 1.4.3. Đây
                  là dòng mang nghĩa nặng nhất của cả vỏ, không phải chữ trang trí, nên không được
                  để nó mờ. `--t3` đo 6,93:1 / 4,90:1 — đạt cả hai nền. */}
              <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--t3)' }}>
                {tr(nhan.aiThay.vi, nhan.aiThay.en)}
              </span>
            </button>
          );
        })}
      </div>

      <p
        style={{
          margin: 0, padding: '8px 14px', fontSize: 'var(--fs-2xs)', color: 'var(--t3)',
          borderBottom: '1px solid var(--vien-mo)', background: 'var(--panel)',
        }}
      >
        {tr(NGAN_MOTA[ngan].vi, NGAN_MOTA[ngan].en)}
      </p>

      {NGAN_KEYS.map((k) => (
        <div
          key={k}
          role="tabpanel"
          id={`ngan-panel-${k}`}
          aria-labelledby={`ngan-tab-${k}`}
          hidden={k !== ngan}
          style={k === ngan ? { display: 'flex', minHeight: 0, flex: 1, flexDirection: 'column' } : undefined}
        >
          {k === 'duAn' ? duAn : thoChung}
        </div>
      ))}
    </div>
  );
}
