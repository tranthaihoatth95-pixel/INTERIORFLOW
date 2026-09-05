'use client';

/**
 * components/materials/MauVatLieu.tsx — MẪU VẬT của một dòng kho vật liệu, nấc **SCAN**.
 *
 * ⛔ VÌ SAO TỒN TẠI (đo sống 05/09 trên `/materials`, tài khoản mới): `tongImg = 0 · tongCanvas = 0`
 * — **không một pixel vật liệu nào** trên màn duy nhất có nhiệm vụ *bày vật liệu*. Cả ba ô đều
 * rơi về **biểu tượng ảnh-hỏng 14 px**, tệ hơn để trống vì nó trông như lỗi trong khi dữ liệu
 * hoàn toàn lành lặn. Gốc: ô đi tìm `imageUrlOf()` — một **ảnh đã tải lên** — mà vật liệu của IF
 * **ship THAM SỐ, không ship ẢNH**.
 *
 * ⭐ BA LỚP, KHÔNG BAO GIỜ CÓ KHOẢNH KHẮC Ô TRỐNG (spec §5.4, ràng buộc kiến trúc):
 *   ① **màu phẳng thật** — có ngay ở frame đầu, kể cả SSR. Không bao giờ là ô trắng.
 *   ② **vân procedural** (`materialTextureDataUrl`) — đồng bộ, rẻ, **không WebGL**, có cache
 *      sẵn theo `id+size`. Cuộn nhanh thì đây là thứ người dùng thấy, và nó đã ra "chất".
 *   ③ **quả cầu PBR** (`MaterialSphere` → `renderMaterialPreviewAsync`) — nâng lên **khi ô lọt
 *      vào mắt** và **khi trình duyệt rảnh**, qua van ≤4 lượt đồng thời.
 * Ba lớp chồng lên nhau nên nâng nấc là **thay lớp trên cùng**, không phải xoá rồi vẽ lại ⇒ mắt
 * không thấy nhấp nháy.
 *
 * 🔴 KHÔNG TÁI HIỆN `AdPreviewGenerator` CỦA REVIT (mở thư viện vật liệu = 30 giây, 100% CPU).
 * Đó là lý do lớp ③ **bắt buộc** đi qua `hoanLaiToiKhiThay` + hàng đợi, và **không được** đổi
 * sang render thẳng lúc mount cho "đơn giản".
 *
 * ⚠️ `aria-hidden` là CỐ Ý: mẫu vật là kênh THỊ GIÁC, không mang tin mới cho trình đọc màn hình —
 * tên · mã · ba mặt đều đã là chữ thật ở các cột bên cạnh. Đọc thêm "ảnh gỗ sồi" là lặp.
 */
import { useMemo, useState } from 'react';
import MaterialSphere from '@/components/three/MaterialSphere';
import { materialTextureDataUrl } from '@/lib/cad/material-texture';
import { SAN_PX } from '@/lib/materials/nac-xem-truoc';
import { loiOMau } from '@/lib/materials/o-an-toan';
import type { XemTruocO } from '@/lib/materials/xem-truoc-o';

/** Cạnh ô ở nấc SCAN. Bằng đúng sàn nhận dạng của hợp đồng ba nấc — **đọc từ đó, không gõ lại**:
 * gõ lại là dựng một con số thứ hai sẽ lặng lẽ lệch khi ngưỡng được chỉnh sau phép thử mắt N1. */
export const CANH_O_SCAN = SAN_PX.scan;

export function MauVatLieu({
  ten,
  xemTruoc,
  anhDaTai,
  mauPhang,
  canh = CANH_O_SCAN,
}: {
  ten: string;
  /** ba mặt đã tra sẵn của dòng này; `null` = món chưa có mã ⇒ chỉ còn màu phẳng. */
  xemTruoc: XemTruocO | null;
  /** ảnh người dùng ĐÃ TẢI LÊN cho món này (`imageUrlOf`). Có thì nó THẮNG — ảnh thật của một
   * món cụ thể bao giờ cũng đúng hơn tham số suy ra. */
  anhDaTai?: string | null;
  /** màu của bản ghi thương mại, dùng khi không tra được mặt nào. */
  mauPhang?: string | null;
  canh?: number;
}) {
  const nen = mauPhang ?? xemTruoc?.mauA ?? 'var(--field)';
  /* 05/09 — lượt vẽ quả cầu ngã thì ô này phải tự nói, không để người dùng đoán. */
  const [lyDo, setLyDo] = useState<string | null>(null);

  /* Vân procedural — đồng bộ và ĐÃ CÓ CACHE trong `material-texture.ts` theo `id+size`, nên
     `useMemo` ở đây chỉ để khỏi gọi qua lớp cache mỗi lần render lại hàng. Không có preset 2D
     (món chưa gắn mã) ⇒ chuỗi rỗng ⇒ tự rơi về màu phẳng, KHÔNG vẽ vân bịa. */
  const van = useMemo(
    () => (xemTruoc?.def ? materialTextureDataUrl(xemTruoc.def, 96) : ''),
    [xemTruoc?.def],
  );

  const khung: React.CSSProperties = {
    width: canh,
    height: canh,
    borderRadius: 6,
    overflow: 'hidden',
    background: nen,
    /* Viền mảnh: mẫu vật sáng màu trên nền sáng thì mép ô biến mất và người dùng không biết
       đang nhìn MỘT mẫu hay một mảng nền. */
    boxShadow: 'inset 0 0 0 1px var(--vien-mo, rgba(0,0,0,.12))',
  };

  // Ảnh thật người dùng tải lên — đường ưu tiên, giữ nguyên hành vi trước lượt này.
  if (anhDaTai) {
    return (
      <div style={khung} title={ten}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={anhDaTai} alt="" aria-hidden style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }

  /* Không tra được mặt nào (món chưa có mã) HOẶC chưa khai họ bề mặt ⇒ **màu phẳng thật**.
     Dựng một quả cầu gỗ cho thứ chưa ai nói là gỗ thì đẹp hơn nhưng là bịa. */
  if (!xemTruoc || !xemTruoc.ho) {
    return <div style={khung} title={ten} aria-hidden />;
  }

  const nenCho: React.CSSProperties = van
    ? { backgroundImage: `url(${van})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: nen };

  /* CÒN VÂN thì ô vẫn là mẫu vật thật, chỉ mất mặt bóng ⇒ nói ở chỗ người dùng đang soi (panel
     ba mặt), không dán cờ lên bảng. TRỐNG TRƠN mới là ca phải kêu ngay tại ô: người dùng đang
     nhìn một mảng màu và không có cách nào biết đó không phải màu của vật liệu. */
  const loi = loiOMau(!!van, lyDo);

  return (
    /* 🔴 DẤU BÁO PHẢI NẰM NGOÀI `MaterialSphere`. Thân quả cầu mang `aria-hidden` (cố ý — nó là
       kênh thị giác, chữ đã có ở các cột bên), mà `aria-hidden` che TRỌN cây con: đặt dấu vào
       trong thì `aria-label` của nó **không bao giờ tới trình đọc màn hình**. Đúng cái bẫy
       "có trong mã nhưng không tới được người dùng" (16/08) — lần này bắt được lúc đọc lại mã,
       trước khi nó thành một dòng khai sai trong báo cáo. */
    /* `block`, KHÔNG `inline-block`: nhánh không-có-quả-cầu trả về một `div` (block), nên vỏ
       inline sẽ ngồi trên đường chân chữ và đẩy ô lệch ~2 px so với hàng bên cạnh — đo được bằng
       cách so hai ảnh chụp trước/sau, không thấy được bằng cách đọc mã. */
    <span style={{ position: 'relative', display: 'block', lineHeight: 0 }}>
    <MaterialSphere
      title={ten}
      style={khung}
      fit="contain"
      size={canh}
      onLoi={setLyDo}
      /* Nấc SCAN = 0.25 (spec §5.4 P3). Máy render có SÀN 96 px nguồn nên ảnh vẫn nét trên
         màn Retina; mở màn ở nấc 1 là đúng thứ P3 cấm. */
      resolution={0.25}
      /* ĐÂY là thứ chặn ca Revit. Bỏ prop này đi thì 200 dòng render cùng lúc. */
      hoanLaiToiKhiThay
      fallback={nenCho}
      /* Nền phía sau quả cầu SAU khi render xong: giữ vân procedural, không phủ màu trơn —
         ô 44 px thì quả cầu bé, phần nền chính là chỗ mắt đọc ra "chất". */
      backdrop={undefined}
      spec={{ id: xemTruoc.id, colorA: xemTruoc.mauA, colorB: xemTruoc.mauB, kind: xemTruoc.ho, pbr: xemTruoc.pbr ?? undefined }}
    />
      {loi.nang === 'nang' && loi.cau && (
        /* CHỮ chứ không phải chấm màu: dấu `!` đọc được cả khi bỏ hết màu, và `aria-label` mang
           trọn câu cho trình đọc màn hình — `title` một mình thì câm trên cảm ứng (bài học 16/08). */
        <span
          role="img"
          aria-label={loi.cau}
          title={loi.cau}
          style={{
            position: 'absolute', right: 2, bottom: 2, width: 12, height: 12, display: 'grid',
            placeItems: 'center', borderRadius: 'var(--r-1)', background: 'var(--card)',
            color: 'var(--warning)', fontSize: 10, fontWeight: 700, lineHeight: 1,
          }}
        >
          !
        </span>
      )}
    </span>
  );
}
