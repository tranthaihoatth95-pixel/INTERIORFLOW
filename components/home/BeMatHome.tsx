'use client';

/**
 * components/home/BeMatHome.tsx — [marker: beMatHome] **BỀ MẶT HOME CÓ TRẠNG THÁI** (chốt Hoà
 * 23/08, `docs/design-campaign/dna/HOME-SPEC-2026-08-23.md`).
 *
 * Nó bày ra thứ `./nam-trang-thai.ts` đã TÍNH. Ranh giới cố ý: tệp kia không biết JSX, tệp này
 * không biết luật. Mọi câu hỏi *"lúc này Home nên dày hay thoáng"* trả lời ở tệp kia và **test
 * được không cần trình duyệt**; ở đây chỉ còn việc vẽ.
 *
 * ─── VÌ SAO KHÔNG PHẢI "LƯỚI BENTO ĐỀU" ────────────────────────────────────────────────────
 * Chữ *bento* dễ bị đọc thành *lưới thẻ đều nhau*, mà đó đúng là thứ đã bị đánh trượt HAI LẦN:
 *   · 20/08 — *"TRƯỢT nếu Home vẫn trông như dashboard SaaS"* ⇒ cấm lưới thẻ đều.
 *   · 22/08 — bản bốn-dải bị FAIL vì *"thẻ khổng lồ, tường widget"*.
 * Và chính bản chốt 23/08 viết: *"KHÔNG lưới đồng đều. Editorial có trọng lượng."*
 * ⇒ Lưới ở đây là **lưới Ô**, không phải lưới THẺ: các mục nhận số ô KHÁC NHAU (`2x2`/`2x1`/
 * `1x1`) nên hình ra là editorial có trọng lượng. Ô là ĐƠN VỊ ĐO, không phải khuôn đúc.
 *
 * ─── BA CỠ, KHÔNG KÉO GIÃN ─────────────────────────────────────────────────────────────────
 * Widget khai bằng SỐ Ô, cấm px. Đây không phải gu: khai theo ô thì lưới hẹp lại trên tablet /
 * điện thoại là chúng **tự xếp lại**. Lý do đầy đủ ở `nam-trang-thai.ts` (`CoO`).
 *
 * ─── STATE B: SNAPSHOT CHƯA CÓ, VÀ TỆP NÀY KHÔNG GIẢ VỜ CÓ ────────────────────────────────
 * Bản chốt muốn ảnh chụp phiên dở làm TOÀN BỘ nền. Đo 23/08: **không có đường chụp nào** —
 * `grep -rn "snapshot" lib components/home` chỉ ra `snapshotFlow()` (ghi FlowVersion lên máy
 * chủ) và `store.snapshot()` (undo-stack). Cả hai KHÔNG sinh ảnh.
 * ⇒ Thi hành đúng **cổng FAIL-CLOSED** mà chốt A4 đã đặt: *nghi ngờ thì không chụp*, và
 * *"không đạt thì rơi về nền môi trường theo giờ"*. Nền môi trường (`SystemWallpaper`, do
 * `DongStudioHome` mount) là mặc định; khi nào có đường chụp thì cắm vào prop `anhPhien`.
 * Không có ảnh ⇒ B vẫn đúng tinh thần: **rất ít chữ, một đích, trên môi trường sống**.
 *
 * ─── CHỮ TRÊN NỀN: ĐO TẠI CHÂN CHỮ ─────────────────────────────────────────────────────────
 * Nền để **NÉT** (chốt A2 16/08 — không bôi mờ cả ảnh). Thứ làm chữ đọc được là **lớp phủ
 * chuyển sắc CỤC BỘ** đúng dải có chữ, nhạt dần về không ở phần còn lại ⇒ tương phản là hằng
 * số không phụ thuộc nền. Đó là `PhuChanChu` bên dưới.
 */

import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
// 🔴 KHÔNG dùng được `<Icon glyph={...}>` ở đây, và lý do là một LỖI KIỂU của chính primitive
// (`components/ui/Icon.tsx:42`), không phải lựa chọn của tệp này: `IconProps.glyph` khai
// `ComponentType<SVGProps & {strokeWidth?: number}>`, còn lucide xuất
// `ForwardRefExoticComponent<LucideProps>` với `strokeWidth?: string | number` ⇒ `tsc` ĐỎ với
// MỌI icon lucide. `grep 'glyph={' components` = 0 nơi dùng ⇒ primitive chưa từng chạy thật.
// `components/ui/` thuộc lane khác nên KHÔNG sửa ở lượt này (đã khai trong báo cáo). Trong lúc
// chờ: lấy `ICON_STROKE` TỪ CHÍNH primitive để luật nét vẫn có MỘT nguồn, không gõ 1.5 tại chỗ.
import { ICON_STROKE } from '@/components/ui/Icon';
import { useT } from '@/lib/i18n';
import {
  keHoachHome,
  nhipO,
  type DuKienHome,
  type KeHoachHome,
  type MaWidget,
  type VaiO,
} from './nam-trang-thai';
import { VaiOProvider } from './widgets/WidgetCard';

/**
 * Chiều cao một hàng ô — **88px, số của bản vẽ** `mocks/mock-exs-c-home-work-os.html` H1
 * (`grid-auto-rows:88px`).
 * ⚠️ `minmax(88, auto)` chứ không phải `88px` cứng: bản vẽ là khung tĩnh nên nội dung tràn thì
 * nó cắt, còn app thật thì cắt = mất chữ. Giữ đúng NHỊP của bản vẽ, bỏ đúng phần khiến nó hỏng.
 */
const CAO_O = 'minmax(88px, auto)';

export interface BeMatHomeProps {
  /** Dữ kiện thô — bề mặt tự tính kế hoạch để nơi gọi không phải nhớ gọi hai hàm. */
  duKien: DuKienHome;
  /** Trường ánh sáng + lời chào. Truyền vào để tệp này không tự dựng nguồn giờ. */
  ambient: ReactNode;
  /** Ba cửa vào của Ngày-Số-Không (trạng thái A). */
  ngaySoKhong: ReactNode;
  /** Nội dung từng mục — nơi gọi mount widget thật. Thiếu khoá nào ⇒ mục đó không vẽ. */
  noiDung: Partial<Record<MaWidget, ReactNode>>;
  /** Dữ liệu tối thiểu cho trạng thái B. `null` ⇒ B không dựng được (nơi gọi tự tránh). */
  vietDangDo: {
    tenDuAn: string | null;
    /** Nhãn chặng đang dở — "2D Kỹ thuật"… Nơi gọi dịch, tệp này không tra bảng chặng. */
    nhanChang: string | null;
    /** "Hoạt động gần nhất …" — null = bản ghi cũ không mang dấu thời gian, KHÔNG đoán. */
    nhanLuc: string | null;
    href: string;
    /** Vài tín hiệu ngắn, ĐÃ có thật. Rỗng ⇒ không vẽ hàng tín hiệu (không hiện "0"). */
    tinHieu: readonly string[];
  } | null;
  /** Ảnh phiên dở đã QUA CỔNG "khoảnh khắc đẹp". Chưa có đường chụp ⇒ luôn `null` hôm nay. */
  anhPhien?: string | null;
}

/**
 * Lớp phủ chuyển sắc CỤC BỘ dưới chân chữ — không bôi mờ nền.
 * `pointer-events-none` để nó không nuốt cú bấm của thứ nằm dưới.
 */
function PhuChanChu({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          inset: '-18px -26px -22px -26px',
          borderRadius: 'var(--r-4)',
          // Đặc ở giữa (nơi có chữ), nhạt dần ra rìa ⇒ nền vẫn hiện nguyên ở phần không có chữ.
          background:
            'radial-gradient(120% 100% at 20% 50%, var(--nen-mo-card, var(--card)) 0%, color-mix(in srgb, var(--nen-mo-card, var(--card)) 72%, transparent) 55%, transparent 100%)',
          backdropFilter: 'blur(var(--blur-strong))',
          WebkitBackdropFilter: 'blur(var(--blur-strong))',
        }}
      />
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  );
}

/**
 * TRẠNG THÁI B — *"KHÔNG dùng Resume card nhỏ."*
 * Rất ít chữ trên môi trường sống: tên dự án · vị trí · lần cuối · **Tiếp tục** · vài tín hiệu.
 * Không thẻ, không viền, không lưới. Đây là chỗ DUY NHẤT của Home không đi qua lưới ô.
 */
function BeMatTiepTuc({
  data,
  anhPhien,
}: {
  data: NonNullable<BeMatHomeProps['vietDangDo']>;
  anhPhien: string | null;
}) {
  const tr = useT();
  return (
    <div className="relative flex h-full w-full items-center" data-home-trang-thai="B">
      {/* Ảnh phiên dở — CHỈ mount khi đã qua cổng "khoảnh khắc đẹp". Không có ⇒ nền môi trường
          theo giờ (do `DongStudioHome` mount) làm nền, đúng đường lui fail-closed của chốt A4. */}
      {anhPhien && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url(${anhPhien})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: 'var(--r-4)',
          }}
        />
      )}
      <div style={{ maxWidth: 'min(100%, 560px)', paddingLeft: 'clamp(0px, 2vw, 40px)' }}>
        <PhuChanChu>
          {data.nhanChang && (
            <div
              // 🔴 23/08 — bỏ `textTransform:'uppercase'` + hạ `letterSpacing`:
              // `LUAT-CHU-VIET-7.1.23` cấm hoa toàn phần với tiếng Việt (dấu chồng mang nghĩa;
              // "THIẾT KẾ 2D" đọc mất dấu). Tách khỏi dòng tên dự án bằng CỠ + MÀU, không bằng
              // chữ hoa. `--t3` thay `--t4`: `--t4` đo 3,26:1 ở theme sáng, dưới ngưỡng.
              style={{
                fontSize: 12,
                letterSpacing: '.02em',
                color: 'var(--t3)',
                marginBottom: 10,
              }}
            >
              {data.nhanChang}
            </div>
          )}
          <div
            style={{
              fontSize: 'clamp(30px, 3.4vw, 46px)',
              lineHeight: 1.15,
              letterSpacing: '-.02em',
              color: 'var(--t1)',
            }}
          >
            {/* `null` = CHƯA BIẾT TÊN, không phải "không có tên" — nói đúng thế, không bịa. */}
            {data.tenDuAn ?? tr('Dự án gần nhất', 'Your last project')}
          </div>
          {data.nhanLuc && (
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--t4)' }}>{data.nhanLuc}</div>
          )}

          <a
            href={data.href}
            className="group mt-6 inline-flex items-center gap-2"
            style={{
              height: 'var(--tap, 44px)',
              padding: '0 18px',
              borderRadius: 'var(--r-full)',
              background: 'var(--accent)',
              color: 'var(--on-accent, #fff)',
              textDecoration: 'none',
              fontSize: 15,
              transition: 'transform var(--nhip-bam) var(--ease-apple)',
            }}
          >
            {tr('Tiếp tục', 'Continue')}
            <ArrowRight
              size={16}
              strokeWidth={ICON_STROKE}
              aria-hidden
              className="transition-transform group-hover:translate-x-0.5"
            />
          </a>

          {/* Tín hiệu — CHỈ khi có thật. Rỗng ⇒ hàng này không tồn tại (không hiện "0 bình luận"). */}
          {data.tinHieu.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1" style={{ listStyle: 'none', padding: 0 }}>
              {data.tinHieu.map((s) => (
                <li key={s} style={{ fontSize: 13, color: 'var(--t3)' }}>
                  {s}
                </li>
              ))}
            </ul>
          )}
        </PhuChanChu>
      </div>
    </div>
  );
}

/**
 * Một ô của lưới — chỉ cấp CHỖ và khai VAI; ruột là widget thật do nơi gọi truyền vào.
 *
 * `VaiOProvider` là cách vai đi xuống tới `WidgetCard` mà không phải xâu prop qua 10 tệp widget
 * (lý do đầy đủ ở `widgets/WidgetCard.tsx`). Ô ở đây **không tự vẽ vỏ** — nếu nó vẽ thì sẽ có
 * hai nơi cùng định nghĩa nền/viền/bo, đúng bệnh "cùng một thứ khai nhiều chỗ".
 */
function O({
  co,
  vai,
  children,
}: {
  co: KeHoachHome['bay'][number]['co'];
  vai: VaiO;
  children: ReactNode;
}) {
  const { cot, hang } = nhipO(co);
  const st: CSSProperties = {
    gridColumn: `span ${cot}`,
    gridRow: `span ${hang}`,
    minHeight: 0,
    minWidth: 0,
  };
  return (
    <div style={st} data-o-co={co} data-o-vai={vai}>
      <VaiOProvider vai={vai}>{children}</VaiOProvider>
    </div>
  );
}

export default function BeMatHome({
  duKien,
  ambient,
  ngaySoKhong,
  noiDung,
  vietDangDo,
  anhPhien = null,
}: BeMatHomeProps) {
  const kh = keHoachHome(duKien);
  const gap = `calc(var(--gap) * ${kh.nhip.heSoGap})`;

  // ── B ── không đi qua lưới. Thiếu dữ liệu B thì rơi xuống nhánh lưới bên dưới (không màn trắng).
  if (kh.trangThai === 'B' && vietDangDo) {
    return (
      <div
        className="flex h-full w-full justify-center"
        data-home-trang-thai="B"
        data-home-mat-do={kh.matDo}
      >
        {/* `h-full` BẮT BUỘC: dải Tiếp tục dùng `flex-1` để chiếm phần còn lại, mà `flex-1`
            không có chiều cao nếu chuỗi cha đứt. Thiếu nó thì B sập về cao-đúng-nội-dung và
            chữ dồn lên mép trên thay vì đứng giữa môi trường. */}
        <div className="flex h-full w-full flex-col" style={{ maxWidth: 'min(100%, 1120px)', gap }}>
          <section data-home-dai="khong-khi">{ambient}</section>
          <div className="min-h-0 flex-1">
            <BeMatTiepTuc data={vietDangDo} anhPhien={anhPhien} />
          </div>
        </div>
      </div>
    );
  }

  const laA = kh.trangThai === 'A';

  /* ─── LƯỚI CO THEO SỐ Ô THẬT (sửa 23/08 — lỗi ⑩ *"khoảng chết lớn ở đáy và mép phải"*) ───
   *
   * 🔴 GỐC BỆNH: số cột là HẰNG SỐ 4 (`nhip.cot`), lấy từ bản vẽ EXS-C — bản vẽ vẽ sẵn 11 ô nên
   * 4 cột luôn kín. App thật thì widget TỰ ẨN khi thiếu dữ liệu (đúng luật), nên đo 23/08 trên
   * máy Hoà: kế hoạch D có 11 mục, **chỉ 3 mục có dữ liệu** ⇒ 3 ô nằm trên một lưới 4 cột ⇒ cột
   * thứ tư là một **lỗ thủng 234px** ở mép phải, và cả lưới cao đúng 105px trong màn 720px.
   * Tức khoảng chết không phải lỗi căn lề — nó là **lưới cứng gặp nội dung mềm**.
   *
   * Sửa đúng luật 20/08 (*"màn càng rộng thì KHOẢNG ÂM càng lớn, không phải thẻ càng dãn"*):
   * cột thu về đúng số cột cần, và bề ngang khung thu theo CÙNG tỉ lệ ⇒ **ô giữ nguyên bề
   * ngang**, phần dư trả cho nền chứ không bơm vào ruột thẻ. Đây là lý do phải thu cả hai thứ:
   * chỉ thu cột thì ba ô sẽ phình ra 319px mỗi cái — hết lỗ thủng nhưng thành thẻ kéo dãn, tức
   * đổi lỗi này lấy lỗi khác.
   */
  const cotCanDung = kh.bay.reduce((s, m) => s + nhipO(m.co).cot, 0);
  const cotDung = Math.max(1, Math.min(kh.nhip.cot, cotCanDung));
  const RONG_DAY = 1280;
  const rongKhung = laA
    ? 'min(100%, 900px)'
    : `min(100%, ${Math.round((RONG_DAY * cotDung) / kh.nhip.cot)}px)`;

  /* Đứng GIỮA chiều dọc thay vì dồn lên mép trên. Đo 23/08: kế hoạch D thưa dữ liệu chỉ cao
     ~105px trong màn 720 ⇒ toàn bộ 480px dồn xuống đáy thành một khoảng chết, đúng chỗ Hoà chỉ
     (*"bố cục lệch hẳn về trái trên"*). Căn giữa thì khoảng âm chia đều trên/dưới và đọc ra CỐ Ý.
     ⚠️ `safe` là bắt buộc, không phải trang trí: `center` trần trong flex + `overflow-y-auto`
     **cắt mất phần trên** khi nội dung cao hơn khung — bẫy kinh điển, và nó sẽ chỉ lộ ra ở
     trạng thái D dày (11 ô) là lúc khó thử nhất. Nội dung dày ⇒ `safe` tự cư xử như `start`.
     Không đặt ngưỡng "ít ô thì mới căn giữa": ngưỡng là một con số phải đoán, còn `safe center`
     đúng ở CẢ HAI đầu mà không cần đoán gì. */
  const canGiuaDoc = !laA;

  return (
    <div
      className="flex h-full w-full justify-center overflow-y-auto"
      data-home-trang-thai={kh.trangThai}
      data-home-mat-do={kh.matDo}
    >
      <div
        className="flex w-full flex-col"
        style={{
          // Thoáng thì hẹp lại — khoảng âm về cho NỀN thay vì kéo thẻ ra rộng (luật 20/08:
          // "màn càng rộng thì khoảng âm càng lớn, không phải thẻ càng dãn").
          maxWidth: rongKhung,
          gap,
          paddingTop: laA ? 'clamp(24px, 6vh, 80px)' : 'clamp(16px, 3vh, 40px)',
          paddingBottom: 40,
          ...(canGiuaDoc ? { justifyContent: 'safe center' as const } : null),
        }}
        data-home-cot={cotDung}
      >
        <section data-home-dai="khong-khi">{ambient}</section>

        {/* A — HERO là BA CỬA VÀO, không phải một thẻ dữ liệu. *"CẤM giả lập dashboard."* */}
        {laA && <section data-home-dai="ngay-so-khong">{ngaySoKhong}</section>}

        {kh.bay.length > 0 && (
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${cotDung}, minmax(0, 1fr))`,
              gridAutoRows: CAO_O,
              gap,
            }}
          >
            {kh.bay.map((m) => {
              const node = noiDung[m.ma];
              // Nơi gọi không cấp nội dung ⇒ KHÔNG vẽ ô rỗng. Kế hoạch nói "được phép bày",
              // không nói "phải bày cho bằng được".
              if (!node) return null;
              return (
                <O key={m.ma} co={m.co} vai={m.vai}>
                  {node}
                </O>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** Xuất lại để nơi gọi/soi đọc được kế hoạch mà không phải render. */
export { keHoachHome };
export type { KeHoachHome };
