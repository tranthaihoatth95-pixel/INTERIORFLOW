'use client';

/**
 * components/cad/CadToolbelt.tsx — DOCK KÍNH ổ ⑤ của chặng Vẽ (`SPEC-HA-TANG-UI-IF` Trụ 1,
 * hàng đợi CHINH việc a): gộp `CadToolbar` (pill công cụ, trước tự nổi top-giữa canvas — tràn
 * phải ĐÈ Inspector khi mở, bug ghi nhiều lần) + `CadTouchDock` (cụm cảm ứng Sketch, trước nổi
 * góc dưới-trái) vào MỘT khối kính giữa-dưới Stage, mount qua prop `toolbelt` của `AppShell`.
 *
 * Hình khối theo §2c "một-khối-một-bóng" (SPEC-DESIGN-SYSTEM-IF): một nền kính, một bóng.
 * 1 hàng (Pro/Revit) → capsule 999; 2 hàng (Sketch có cụm cảm ứng) → bo 24, hairline ngăn hàng.
 *
 * Vị trí: slot ⑤ của AppShell đặt `bottom-4` của Stage — Stage chặng Vẽ còn `CommandLine` 34px
 * in-flow ở đáy (CadEditor), nên dock tự cộng marginBottom 34 để nổi TRÊN ô lệnh, không đè.
 *
 * Nút "Nội thất"/"Vật liệu" cần state panel nằm sâu trong CadEditor → bắc cầu CustomEvent
 * `cad:toggle-furniture`/`cad:toggle-material` (cùng idiom `cad:zoom-extents`/`cad:cmd-focus`
 * đã dùng khắp chặng Vẽ), CadEditor nghe và toggle — không có bản logic thứ hai.
 */

import CadToolbar from './CadToolbar';
import CadTouchDock from './CadTouchDock';
import { useCadStore } from '@/lib/cad/store';

function fire(name: string) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(name));
}

export default function CadToolbelt() {
  const cadMode = useCadStore((s) => s.cadMode);
  const twoRows = cadMode === 'sketch';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '100%',
        marginBottom: 34,
        borderRadius: twoRows ? 24 : 999,
        background: 'color-mix(in srgb, var(--panel) 78%, transparent)',
        backdropFilter: 'blur(18px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 30px rgba(0,0,0,.22)',
      }}
    >
      <CadToolbar
        onToggleFurniture={() => fire('cad:toggle-furniture')}
        onToggleMaterial={() => fire('cad:toggle-material')}
      />
      {twoRows && (
        <div style={{ borderTop: '1px solid var(--mat-hairline)' }}>
          <CadTouchDock />
        </div>
      )}
    </div>
  );
}
