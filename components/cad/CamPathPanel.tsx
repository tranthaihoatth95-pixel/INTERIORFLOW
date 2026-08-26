'use client';

/**
 * components/cad/CamPathPanel.tsx — D5 (`docs/BAO-CAO-CHINH.md`, gap để lại từ C4): nối
 * `CamPathPreview` + `CamPathControlPanel` lại với nhau trong trang `/cad-editor` thật. Cả 2
 * component đã controlled hoàn toàn (không state riêng ngoài UI) — panel này là nơi GIỮ state
 * (tốc độ/ống kính/tỉ lệ khung/chế độ ngắm) vì chưa có field tương ứng trong `useCadStore`
 * (đúng ghi chú "CHƯA nối vào store" ở đầu `CamPathControlPanel.tsx`) — thêm field mới vào store
 * cho vài giá trị chỉ dùng lúc XEM THỬ (không phải dữ liệu bền của Doc) là quá tay, giữ cục bộ ở
 * đây đúng mức cần.
 *
 * Nguồn đường cam: entity polyline có cờ `campath:true` (vẽ bằng công cụ "Đường cam" trong
 * `CadToolbar.tsx`, layer hệ thống `IF_CAMPATH`) — panel tự chọn đường ĐANG chọn nếu khớp, không
 * thì rơi về đường campath MỚI VẼ GẦN NHẤT trong Doc (không bắt user phải click chọn lại ngay sau
 * khi vừa vẽ xong).
 */

import { useMemo, useState } from 'react';
import { X, Video } from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import { docBox, type Pt, type PolylineEntity, type ZoneEntity } from '@/lib/cad/model';
import CamPathPreview, { type PreviewLookAt } from './CamPathPreview';
import CamPathControlPanel, { type LookAtChoice, type ZoneOption } from './CamPathControlPanel';
import { analyzeShotSafety, CINEMATIC_SHOT_PRESETS, createCinematicShot, type CinematicShotIntent } from '@/lib/cad/cinematic-shot';

// `right:12,top:70` đã bị chiếm bởi `LayerPanel` (luôn hiện, không điều kiện — xem CadEditor.tsx
// `<LayerPanel />`) — neo panel này từ ĐÁY thay vì đỉnh để không đè lên nhau, dùng góc phải-dưới
// đang trống (thanh lệnh dưới cùng chỉ chiếm giữa màn, 2 góc rảnh).
const panel: React.CSSProperties = {
  position: 'absolute',
  right: 12,
  bottom: 90,
  zIndex: 22,
  width: 320,
  maxHeight: 'calc(100vh - 180px)',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};
const headStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: 'color-mix(in srgb, var(--panel) 92%, transparent)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)', // K3: thiếu prefix = tablet không blur
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: '8px 10px',
  fontSize: 10.5,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  fontWeight: 650,
  color: 'var(--t3)',
};
const miniBtn: React.CSSProperties = { display: 'grid', placeItems: 'center', width: 22, height: 22, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--t3)', cursor: 'pointer' };
const emptyHint: React.CSSProperties = {
  background: 'color-mix(in srgb, var(--panel) 92%, transparent)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)', // K3: thiếu prefix = tablet không blur
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 12,
  fontSize: 11.5,
  color: 'var(--t3)',
  lineHeight: 1.5,
};

export default function CamPathPanel({ onClose }: { onClose: () => void }) {
  const doc = useCadStore((s) => s.doc);
  const selection = useCadStore((s) => s.selection);
  const updateEntities = useCadStore((s) => s.updateEntities);

  const [intent, setIntent] = useState<CinematicShotIntent>('follow');
  const [lookAtMode, setLookAtMode] = useState<LookAtChoice>('tangent');
  const [zoneId, setZoneId] = useState<string>('');
  const [lookAtPoint, setLookAtPoint] = useState<Pt | null>(null);
  const [speedMmPerSec, setSpeedMmPerSec] = useState(1200);
  const [lensMm, setLensMm] = useState(35);
  const [ratio, setRatio] = useState('16:9');
  const [cameraHeightM, setCameraHeightM] = useState(CINEMATIC_SHOT_PRESETS.follow.cameraHeightM);
  const [appliedMessage, setAppliedMessage] = useState('');
  // Điểm ngắm mặc định lúc mới chuyển sang "Khoá điểm" (chưa kéo lần nào) — tâm mặt bằng, chắc
  // chắn nằm trong khung nhìn thay vì đoán bừa toạ độ (0,0) có thể ở ngoài bản vẽ.
  const box = useMemo(() => docBox(doc), [doc]);
  const defaultLookAtPoint: Pt = useMemo(() => (box ? { x: (box.minX + box.maxX) / 2, y: (box.minY + box.maxY) / 2 } : { x: 0, y: 0 }), [box]);

  // Ưu tiên đường cam ĐANG chọn (đúng 1 entity, có cờ campath) — không thì rơi về đường VẼ GẦN
  // NHẤT trong Doc (entities push vào cuối mảng — xem CadCanvas.tsx addEntity), để panel có ích
  // ngay sau khi vừa vẽ xong mà chưa kịp bấm chọn lại.
  const campathEntityId = useMemo(() => {
    const selectedCampath = selection.length === 1 ? doc.entities.find((e) => e.id === selection[0] && e.campath) : undefined;
    if (selectedCampath) return selectedCampath.id;
    for (let i = doc.entities.length - 1; i >= 0; i--) {
      if (doc.entities[i].campath) return doc.entities[i].id;
    }
    return null;
  }, [doc.entities, selection]);

  const zoneOptions: ZoneOption[] = useMemo(
    () => doc.entities.filter((e): e is ZoneEntity => e.type === 'zone').map((z) => ({ id: z.id, label: z.label })),
    [doc.entities],
  );

  const campathEntity = useMemo(
    () => doc.entities.find((e): e is PolylineEntity => e.id === campathEntityId && e.type === 'polyline'),
    [doc.entities, campathEntityId],
  );

  const lookAt: PreviewLookAt = useMemo(() => {
    if (lookAtMode === 'point') return { kind: 'point', at: lookAtPoint ?? defaultLookAtPoint };
    if (lookAtMode === 'zone') return { kind: 'zone', zoneId };
    return { kind: 'tangent' };
  }, [lookAtMode, lookAtPoint, zoneId, defaultLookAtPoint]);

  const target = lookAt.kind === 'point' ? lookAt.at : defaultLookAtPoint;
  const draftShot = useMemo(() => {
    if (!campathEntity) return null;
    const needsTarget = intent === 'reveal' || intent === 'push-in' || intent === 'orbit';
    return createCinematicShot(intent, campathEntity.points, {
      target: needsTarget ? target : undefined,
      speedMmPerSec,
    });
  }, [campathEntity, intent, target, speedMmPerSec]);
  const safety = useMemo(
    () => draftShot ? analyzeShotSafety(draftShot.path, cameraHeightM) : null,
    [draftShot, cameraHeightM],
  );

  function chooseIntent(next: CinematicShotIntent) {
    const preset = CINEMATIC_SHOT_PRESETS[next];
    setIntent(next);
    setCameraHeightM(preset.cameraHeightM);
    setLensMm(preset.lensMm);
    setSpeedMmPerSec(preset.speedMmPerSec);
    if (next === 'reveal' || next === 'push-in' || next === 'orbit') {
      setLookAtMode('point');
      setLookAtPoint((p) => p ?? defaultLookAtPoint);
    } else {
      setLookAtMode('tangent');
    }
    setAppliedMessage('');
  }

  function applyShot() {
    if (!campathEntity || !draftShot) return;
    const preset = CINEMATIC_SHOT_PRESETS[intent];
    updateEntities([{
      ...campathEntity,
      points: draftShot.controlPoints,
      cameraShot: {
        intent,
        cameraHeightM,
        lensMm,
        speedMmPerSec,
        easing: preset.easing,
        stabilization: preset.stabilization,
        ratio,
        ...((intent === 'reveal' || intent === 'push-in' || intent === 'orbit') ? { target } : {}),
      },
    }]);
    setAppliedMessage('Đã lưu vào đường cam · có thể Hoàn tác.');
  }

  return (
    <div style={panel}>
      <div style={headStyle}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Video size={16} /> Đường cam — xem thử
        </span>
        <button type="button" onClick={onClose} style={miniBtn} aria-label="Đóng">
          <X size={14} />
        </button>
      </div>

      {!campathEntityId ? (
        <p style={emptyHint}>
          Chưa có đường cam nào — chọn công cụ &ldquo;Đường cam&rdquo; ở toolbar (phím CAM) rồi vẽ 1 tuyến trên mặt bằng, panel sẽ tự hiện xem thử ở đây.
        </p>
      ) : (
        <>
          <div
            style={{
              height: 220,
              borderRadius: 14,
              border: '1px solid var(--border)',
              background: 'var(--field)',
              overflow: 'hidden',
              color: 'var(--t2)',
            }}
          >
            <CamPathPreview
              doc={doc}
              campathEntityId={campathEntityId}
              controlPoints={draftShot?.controlPoints}
              lensMm={lensMm}
              speedMmPerSec={speedMmPerSec}
              lookAt={lookAt}
              onLookAtPointChange={setLookAtPoint}
            />
          </div>
          <CamPathControlPanel
            intent={intent}
            onIntentChange={chooseIntent}
            lookAtMode={lookAtMode}
            onLookAtModeChange={setLookAtMode}
            zoneOptions={zoneOptions}
            zoneId={zoneId}
            onZoneIdChange={setZoneId}
            speedMmPerSec={speedMmPerSec}
            onSpeedChange={setSpeedMmPerSec}
            lensMm={lensMm}
            onLensChange={setLensMm}
            ratio={ratio}
            onRatioChange={setRatio}
            cameraHeightM={cameraHeightM}
            onCameraHeightChange={setCameraHeightM}
            safetyWarnings={safety?.warnings}
            onApply={applyShot}
          />
          <p aria-live="polite" style={{ margin: 0, padding: '0 4px', color: 'var(--t4)', fontSize: 10.5 }}>
            {appliedMessage || 'Va chạm tường/đồ sẽ được kiểm khi mở scene 3D.'}
          </p>
        </>
      )}
    </div>
  );
}
