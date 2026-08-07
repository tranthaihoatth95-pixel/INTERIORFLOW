'use client';

/**
 * components/library/ItemThumb.tsx — ô xem trước 1 món trong Thư viện, theo đúng BẬC THANG chốt
 * sau khi Hoà chê 12 gradient giả (xem đầu `lib/library/thumb-kinds.ts`):
 *
 *   c) `imageUrl` (ATLAS sync có ảnh thật)  → ảnh thật            ← ưu tiên cao nhất
 *   a) loại là vật liệu + kệ vật liệu       → quả cầu render thật (`MaterialSphere`)
 *   b) còn lại                              → vân procedural theo LOẠI + icon loại
 *
 * Bậc b cũng là fallback của bậc a khi WebGL tắt — `MaterialSphere` nhận `fallback` là chính vân
 * procedural, nên không bao giờ rơi về ô trơn.
 *
 * Hatch 2D của chặng Vẽ CỐ TÌNH không lên quả cầu: `SPEC-VAT-LIEU-PBR-IF` §2 chốt "chặng Vẽ 2D
 * giữ swatch phẳng (đúng ngữ cảnh bản vẽ)" — vân procedural đúng tinh thần đó hơn ảnh cầu 3D.
 */

import { Aperture, Armchair, AppWindow, Cloud, Cuboid, DoorOpen, Droplets, FileText, Gem, LayoutTemplate, Moon, PaintRoller, Ruler, Shirt, Sun, Sunrise, TreePine } from 'lucide-react';
import MaterialSphere from '@/components/three/MaterialSphere';
import { sceneForKind, type PreviewKind } from '@/components/three/material-preview';
import { KIND_LABEL, isMaterialKind, thumbTexture, tintFor, type ThumbKind } from '@/lib/library/thumb-kinds';
import type { SheetItem } from '@/lib/library/shelves';
import { useT } from '@/lib/i18n';

const ICON: Record<ThumbKind, typeof TreePine> = {
  wood: TreePine,
  stone: Gem,
  metal: Cuboid,
  paint: PaintRoller,
  fabric: Shirt,
  glass: AppWindow,
  block: DoorOpen,
  furniture: Armchair,
  sanitary: Droplets,
  misc: Ruler,
  page: FileText,
  sheet: LayoutTemplate, // "bố cục", rõ nghĩa hơn Frame (nhìn ra dấu # vô nghĩa khi verify)
  // VIỆC 7b (07/08) — icon RIÊNG cho từng preset ánh sáng, cùng lý do vân riêng ở thumbTexture:
  // nhìn icon cũng phải đoán được đây là ánh sáng gì, không chỉ đoán qua vân nền.
  'light-gold': Sun,
  'light-overcast': Cloud,
  'light-night': Moon,
  'light-dawn': Sunrise,
  'light-studio': Aperture,
};

/** Chỉ KỆ VẬT LIỆU mới lên quả cầu. Kệ khác dù món có loại vật liệu (vd. "Bảng màu ấm" loại sơn
 * ở kệ Phông·màu·nền, "Texture rời" loại vải ở kệ Ảnh & tài sản) thì món đó KHÔNG phải một vật
 * liệu gán được — render cầu ở đó là nói dối về thứ người dùng sắp kéo ra. Hatch 2D cũng nằm
 * ngoài danh sách này theo SPEC-VAT-LIEU §2 ("chặng Vẽ 2D giữ swatch phẳng"). */
const SPHERE_SHELVES = new Set(['common-atlas']);

export function ItemThumb({ item, children }: { item: SheetItem; children?: React.ReactNode }) {
  const tr = useT();
  const kind = item.kind;
  const texture = thumbTexture(kind);
  const Icon = ICON[kind];
  const title = tr(KIND_LABEL[kind][0], KIND_LABEL[kind][1]);

  // (c) ảnh thật từ ATLAS — có ảnh thì không cần đoán gì nữa
  if (item.imageUrl) {
    return (
      <span
        className="th"
        title={title}
        style={{ backgroundImage: `url(${item.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {children}
      </span>
    );
  }

  // (a) quả cầu vật liệu render thật
  if (isMaterialKind(kind) && SPHERE_SHELVES.has(item.shelfId)) {
    const [colorA, colorB] = tintFor(kind);
    const previewKind = kind as PreviewKind; // 6 loại vật liệu trùng tên với PreviewKind
    // MỌI vật liệu cùng MỘT kiểu xem trước (Hoà 04/08): `sceneForKind` nay chỉ trả cầu — kính
    // thêm thẻ checker sau lưng để đọc độ trong, KHÔNG còn đoán "sàn" theo tên món.
    const scene = sceneForKind(previewKind);
    return (
      <MaterialSphere
        className="th"
        title={title}
        spec={{ id: item.code, colorA, colorB, kind: previewKind, scene }}
        fallback={texture}
        // nền xám trung tính khớp rìa nền đã bake trong PNG (fit=contain nên hai bên
        // còn hở) — KHÔNG dùng --field: nền sáng theo theme làm cầu trắng biến mất.
        backdrop="#4a4a4a"
        size={120}
        resolution={0.5}
        fit="contain"
      >
        {children}
      </MaterialSphere>
    );
  }

  // (b) vân procedural theo loại + icon loại
  return (
    <span className="th" title={title} style={texture}>
      <Icon size={22} strokeWidth={1.5} className="kicon" aria-hidden />
      {children}
    </span>
  );
}
