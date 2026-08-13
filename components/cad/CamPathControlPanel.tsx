'use client';

/**
 * components/cad/CamPathControlPanel.tsx — panel chỉnh tay đường cam (V2.1, 02/08, C4 —
 * `docs/SPEC-VIDEO-MAT-BANG.md` §2 phần B, trước đây ghi "CHƯA làm" trong `CamPathPreview.tsx`).
 *
 * Controlled hoàn toàn (props vào/callback ra) — CÙNG khuôn `Toolbar.tsx`/`ZonePanel.tsx` gần
 * nhất phù hợp: component này KHÔNG có state riêng ngoài giao diện thuần tuý, cha giữ mọi giá trị
 * (tốc độ/ống kính/tỉ lệ khung/chế độ ngắm/zone đang chọn) rồi truyền xuống `CamPathPreview` qua
 * `speedMmPerSec`/`lensMm`/`lookAt`. CHƯA nối vào `useCadStore` — không có field campath speed/
 * lens/lookAt trong store hiện tại, và CHƯA có trang host thật gọi cả 2 component lại với nhau
 * (cùng tình trạng "B rút gọn" ghi trong STATUS.md — xem báo cáo C4, `docs/BAO-CAO-CHINH.md`).
 *
 * Ống kính/tỉ lệ khung TÁI DÙNG `CAMERA_LENSES`/`CAMERA_RATIOS` (`lib/three/camera.ts`) — đúng
 * yêu cầu Hoà, không tự đặt danh sách riêng lệch với node "Góc máy ảnh".
 */
import { CAMERA_LENSES, CAMERA_RATIOS } from '@/lib/three/camera';
import { CINEMATIC_SHOT_PRESETS, type CinematicShotIntent } from '@/lib/cad/cinematic-shot';
import type { PreviewLookAt } from './CamPathPreview';

export type LookAtChoice = PreviewLookAt['kind'];

const panel: React.CSSProperties = {
  background: 'color-mix(in srgb, var(--panel) 92%, transparent)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)', // K3: thiếu prefix = tablet không blur
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};
const rowLabel: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 650, color: 'var(--t4)' };
const segmentWrap: React.CSSProperties = { display: 'flex', gap: 4, background: 'var(--field)', borderRadius: 10, padding: 3 };
const selectStyle: React.CSSProperties = {
  background: 'var(--field)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  color: 'var(--t1)',
  fontSize: 12,
  padding: '5px 8px',
  flex: 1,
};

function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: '5px 8px',
        borderRadius: 6,
        border: 'none',
        fontSize: 11.5,
        cursor: 'pointer',
        background: active ? 'var(--accent-strong, #6a57f5)' : 'transparent',
        color: active ? '#fff' : 'var(--t2)',
      }}
    >
      {children}
    </button>
  );
}

export interface ZoneOption {
  id: string;
  label: string;
}

export interface CamPathControlPanelProps {
  intent: CinematicShotIntent;
  onIntentChange: (intent: CinematicShotIntent) => void;
  lookAtMode: LookAtChoice;
  onLookAtModeChange: (mode: LookAtChoice) => void;
  /** danh sách zone trong doc — chỉ dùng khi `lookAtMode==='zone'` (dropdown chọn). Rỗng/thiếu →
   * hiện dòng nhắc "chưa có zone", không throw. */
  zoneOptions?: ZoneOption[];
  zoneId?: string;
  onZoneIdChange?: (id: string) => void;
  speedMmPerSec: number;
  onSpeedChange: (v: number) => void;
  lensMm: number;
  onLensChange: (v: number) => void;
  ratio: string;
  onRatioChange: (v: string) => void;
  cameraHeightM: number;
  onCameraHeightChange: (v: number) => void;
  safetyWarnings?: string[];
  onApply: () => void;
  className?: string;
}

const LOOKAT_LABEL: Record<LookAtChoice, string> = {
  tangent: 'Tiếp tuyến',
  point: 'Khoá điểm',
  zone: 'Khoá zone',
};

/** mm/s → mốc quen thuộc (đi bộ chậm/thường/nhanh) — CHỈ hiển thị, không ảnh hưởng giá trị lưu. */
function speedHint(mmPerSec: number): string {
  if (mmPerSec <= 900) return 'chậm';
  if (mmPerSec <= 1400) return 'đi bộ';
  if (mmPerSec <= 2000) return 'nhanh';
  return 'rất nhanh';
}

export default function CamPathControlPanel({
  intent,
  onIntentChange,
  lookAtMode,
  onLookAtModeChange,
  zoneOptions,
  zoneId,
  onZoneIdChange,
  speedMmPerSec,
  onSpeedChange,
  lensMm,
  onLensChange,
  ratio,
  onRatioChange,
  cameraHeightM,
  onCameraHeightChange,
  safetyWarnings,
  onApply,
  className,
}: CamPathControlPanelProps) {
  return (
    <div style={panel} className={className}>
      <div>
        <p style={rowLabel}>Ý đồ quay</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 4 }}>
          {(Object.keys(CINEMATIC_SHOT_PRESETS) as CinematicShotIntent[]).map((key) => (
            <SegBtn key={key} active={intent === key} onClick={() => onIntentChange(key)}>
              {CINEMATIC_SHOT_PRESETS[key].label}
            </SegBtn>
          ))}
        </div>
        <p style={{ fontSize: 10.5, color: 'var(--t4)', marginTop: 5 }}>
          Chỉ xem trước; bấm Áp dụng mới đổi đường thật.
        </p>
      </div>

      <div>
        <p style={rowLabel}>Điểm ngắm</p>
        <div style={{ ...segmentWrap, marginTop: 4 }}>
          {(Object.keys(LOOKAT_LABEL) as LookAtChoice[]).map((k) => (
            <SegBtn key={k} active={lookAtMode === k} onClick={() => onLookAtModeChange(k)}>
              {LOOKAT_LABEL[k]}
            </SegBtn>
          ))}
        </div>
        {lookAtMode === 'point' && <p style={{ fontSize: 10.5, color: 'var(--t4)', marginTop: 4 }}>Kéo chốt trên mặt bằng để đổi điểm khoá.</p>}
        {lookAtMode === 'zone' && (
          <select
            style={{ ...selectStyle, marginTop: 6, width: '100%' }}
            value={zoneId ?? ''}
            onChange={(e) => onZoneIdChange?.(e.target.value)}
            disabled={!zoneOptions?.length}
          >
            {!zoneOptions?.length && <option value="">Chưa có zone nào trong bản vẽ</option>}
            {zoneOptions?.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <p style={rowLabel}>Cao độ camera — {cameraHeightM.toFixed(2)}m</p>
        <input
          type="range"
          min={0.15}
          max={2.2}
          step={0.05}
          value={cameraHeightM}
          onChange={(e) => onCameraHeightChange(Number(e.target.value))}
          style={{ width: '100%', marginTop: 4 }}
        />
      </div>

      <div>
        <p style={rowLabel}>
          Tốc độ đi — {speedMmPerSec}mm/s ({speedHint(speedMmPerSec)})
        </p>
        <input
          type="range"
          min={400}
          max={2800}
          step={50}
          value={speedMmPerSec}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          style={{ width: '100%', marginTop: 4 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <p style={rowLabel}>Ống kính</p>
          <select style={{ ...selectStyle, marginTop: 4, width: '100%' }} value={String(lensMm)} onChange={(e) => onLensChange(Number(e.target.value))}>
            {CAMERA_LENSES.map((l) => (
              <option key={l} value={parseInt(l, 10)}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <p style={rowLabel}>Tỉ lệ khung</p>
          <select style={{ ...selectStyle, marginTop: 4, width: '100%' }} value={ratio} onChange={(e) => onRatioChange(e.target.value)}>
            {CAMERA_RATIOS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!!safetyWarnings?.length && (
        <div role="status" style={{ border: '1px solid color-mix(in srgb, #e8a23a 50%, var(--border))', borderRadius: 10, padding: 8, color: 'var(--t2)', fontSize: 11, lineHeight: 1.45 }}>
          {safetyWarnings.map((warning) => <div key={warning}>• {warning}</div>)}
        </div>
      )}

      <button
        type="button"
        onClick={onApply}
        style={{ minHeight: 36, border: 'none', borderRadius: 10, background: 'var(--accent-strong, #6a57f5)', color: '#fff', fontWeight: 650, cursor: 'pointer' }}
      >
        Áp vào đường cam
      </button>
    </div>
  );
}
