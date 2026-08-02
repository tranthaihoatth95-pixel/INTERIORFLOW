'use client';

/**
 * components/render-studio/Render3DModeSkeleton.tsx — nội dung mode "Vẽ 3D" của chặng Render
 * (`docs/SPEC-MODE-PER-STAGE.md` §1). Đúng luật "mode = đổi CẢ shell": thay hẳn node canvas 2D
 * bằng khung nhìn 3D toàn màn.
 *
 * 🔴 DỰNG LẠI TRẢI NGHIỆM MỞ MÀN 04/08 (Hoà chê "rối rắm, không hệ thống"):
 *  1. SÂN KHẤU LUÔN HIỆN — `Viewport3D` (lưới sàn · chân trời · trục XYZ · ViewCube) render NGAY
 *     CẢ KHI 0 khối, thay cho câu chữ "chưa có bản vẽ" nhìn như màn hỏng. Chuẩn: mở Blender/
 *     SketchUp file trống vẫn thấy mình đang đứng trong không gian.
 *  2. Không còn ghi chú dev trên UI (B2-B4/"việc riêng") — chuyện nội bộ nằm ở comment code này.
 *  3. EMPTY STATE có 2 NÚT LÀM ĐƯỢC VIỆC TẠI CHỖ: đùn từ bản vẽ · dựng khối đầu tiên (mở tab Tạo
 *     + nháy nút Tường). Không đá người dùng sang chặng khác rồi bảo quay lại.
 *  4. TRÌNH TỰ 3 BƯỚC (dựng khối → gán vật liệu → đặt máy quay) mờ ở góc — xương sống của mode,
 *     tự đánh dấu theo dữ liệu THẬT trong Doc, ẩn được và nhớ lựa chọn.
 *
 * Nguồn dữ liệu vẫn là Doc chặng 1 (`docToObjScene`) — luật một nguồn, mode KHÔNG giữ bản 3D riêng.
 */

import { useEffect, useMemo, useState } from 'react';
import { Boxes, Check, Hammer, X } from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import { docToObjScene, toScene3DData } from '@/lib/three/cad-to-obj';
import { wallSegment } from '@/lib/cad/commands';
import { Viewport3D, EMPTY_SCENE_3D } from '@/components/three/Viewport3D';
import ModeSwitchBar from '@/components/render-studio/ModeSwitchBar';
import Command3DPanel, { type Command3DTab } from '@/components/render-studio/Command3DPanel';

const GUIDE_HIDDEN_KEY = 'if.ve3d.guide_hidden_v1';

/** Tường mẫu 4m khi bấm "Dựng khối đầu tiên" — dùng ĐÚNG hàm engine `wallSegment()` của chặng Vẽ
 * (không tự chế hình học), dày 220mm, đặt ở gốc toạ độ để camera đang khung sẵn nhìn thấy ngay. */
const FIRST_WALL = { from: { x: 0, y: 0 }, to: { x: 4000, y: 0 }, thicknessMm: 220 };

export default function Render3DModeSkeleton() {
  const doc = useCadStore((s) => s.doc);
  const [tab, setTab] = useState<Command3DTab>('material');
  const [nhayNutTuong, setNhayNutTuong] = useState(false);
  const [matDangCam, setMatDangCam] = useState<string | null>(null);
  const [guideHidden, setGuideHidden] = useState(false);

  useEffect(() => {
    try {
      setGuideHidden(localStorage.getItem(GUIDE_HIDDEN_KEY) === '1');
    } catch {
      /* localStorage bị chặn — cứ hiện trình tự, không phải lỗi chặn việc */
    }
  }, []);

  const scene = useMemo(() => {
    if (!doc.entities.length) return null;
    try {
      return toScene3DData(docToObjScene(doc, { wallHeightMm: 2700, theme: 'warm' }));
    } catch {
      return null; // Doc lỗi hình học — vẫn giữ sân khấu, không sập cả mode
    }
  }, [doc]);

  const soKhoi = scene?.groups.length ?? 0;
  const coBanVe = doc.entities.length > 0;
  // Doc CAD chưa có field vật liệu (grep matId trong lib/cad = 0) ⇒ tín hiệu khả dụng duy nhất
  // hôm nay là "người dùng đã chọn vật liệu trong panel". Khi gán-lên-mặt (raycast) xong thì đổi
  // tín hiệu này sang dữ liệu Doc, đừng để nó mãi là state phiên.
  const daGanVatLieu = matDangCam !== null;
  const daDatMayQuay = doc.entities.some((e) => e.layer === 'IF_CAMPATH' || Boolean(e.campath));

  // `updateEntities`/`addEntities` tạo Doc MỚI trong store → `doc` đổi reference → `scene` tự tính
  // lại → viewer dựng lại. Không ép remount tay (luật một nguồn).
  function handlePushPull(entityId: string, newHeightMm: number) {
    const store = useCadStore.getState();
    const entity = store.doc.entities.find((e) => e.id === entityId);
    if (!entity) return;
    store.updateEntities([{ ...entity, heightMm: newHeightMm }]);
  }

  /** Đùn từ bản vẽ: cảnh 3D vốn tự suy từ Doc, nên việc thật ở đây là ĐẶT CAO ĐỘ cho các nét
   * tường chưa có `heightMm` — đúng nghĩa "đùn", và ghi thẳng vào Doc (một nguồn). */
  function dunTuBanVe() {
    const store = useCadStore.getState();
    const canDun = store.doc.entities.filter((e) => e.heightMm === undefined && (e.type === 'hatch' || e.type === 'polyline'));
    if (!canDun.length) return;
    store.updateEntities(canDun.map((e) => ({ ...e, heightMm: 2700 })));
  }

  /** Dựng khối đầu tiên: mở tab Tạo + nháy nút Tường (SPEC-NGON-NGU: chỉ đúng MỘT việc kế tiếp). */
  function dungKhoiDauTien() {
    setTab('create');
    setNhayNutTuong(true);
  }

  function taoTuongMau() {
    useCadStore.getState().addEntities(
      wallSegment(FIRST_WALL.from, FIRST_WALL.to, FIRST_WALL.thicknessMm, useCadStore.getState().currentLayer),
    );
    setNhayNutTuong(false);
  }

  function anTrinhTu() {
    setGuideHidden(true);
    try {
      localStorage.setItem(GUIDE_HIDDEN_KEY, '1');
    } catch {
      /* không lưu được thì thôi, phiên sau hiện lại — không chặn việc */
    }
  }

  const buoc = [
    { xong: soKhoi > 0, chu: 'Dựng khối' },
    { xong: daGanVatLieu, chu: 'Gán vật liệu' },
    { xong: daDatMayQuay, chu: 'Đặt máy quay' },
  ];

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', minHeight: 0, background: 'var(--bg)' }}>
      <Command3DPanel
        tab={tab}
        onTabChange={setTab}
        nhayNutTuong={nhayNutTuong}
        onTaoTuong={taoTuongMau}
        onPickMaterial={setMatDangCam}
      />

      <div style={{ position: 'relative', flex: 1, minWidth: 0, height: '100%' }}>
        <Viewport3D
          scene={scene ?? EMPTY_SCENE_3D}
          mode="massing"
          onPushPull={handlePushPull}
          ground
          label={soKhoi > 0 ? 'Khối xám · chưa vật liệu' : 'Không gian trống'}
        >
          {soKhoi === 0 && (
            <div
              style={{
                position: 'absolute', inset: 0, zIndex: 6, display: 'grid', placeItems: 'center',
                pointerEvents: 'none', padding: 24,
              }}
            >
              <div
                style={{
                  pointerEvents: 'auto', textAlign: 'center', maxWidth: 360, padding: '18px 20px 20px',
                  borderRadius: 'var(--radius-lg)', border: '1px solid var(--mat-hairline)',
                  background: 'color-mix(in srgb, var(--panel) 88%, transparent)',
                  backdropFilter: 'blur(var(--blur))', WebkitBackdropFilter: 'blur(var(--blur))',
                  boxShadow: 'var(--shadow-pop)',
                }}
              >
                <p style={{ margin: 0, fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-semi)', color: 'var(--t1)' }}>
                  Bắt đầu dựng không gian
                </p>
                <p style={{ margin: '5px 0 14px', fontSize: 'var(--fs-2xs)', color: 'var(--t4)', lineHeight: 1.5 }}>
                  Đùn khối lên từ bản vẽ có sẵn, hoặc dựng thẳng ở đây.
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={dunTuBanVe}
                    disabled={!coBanVe}
                    title={coBanVe ? 'Đặt cao độ 2700mm cho nét tường chưa đùn' : 'Chưa có nét nào ở bản vẽ để đùn'}
                    style={{
                      height: 32, padding: '0 14px', borderRadius: 999, cursor: coBanVe ? 'pointer' : 'not-allowed',
                      border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)',
                      fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-semi)', opacity: coBanVe ? 1 : 0.45,
                    }}
                  >
                    Đùn từ bản vẽ
                  </button>
                  <button
                    type="button"
                    onClick={dungKhoiDauTien}
                    style={{
                      height: 32, padding: '0 14px', borderRadius: 999, cursor: 'pointer', border: '1px solid var(--accent)',
                      background: 'var(--accent)', color: '#fff', fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-semi)',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <Hammer size={13} strokeWidth={1.9} />
                    Dựng khối đầu tiên
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TRÌNH TỰ 3 BƯỚC — xương sống của mode, góc dưới trái ── */}
          {!guideHidden && (
            <div
              style={{
                // bottom 156 = 54 (chỗ trục XYZ đứng) + 90 (chiều cao trục) + 12 thở. Đo bằng
                // getBoundingClientRect lúc verify: để 74 là trình tự ĐÈ LÊN trục, mất luôn XYZ.
                position: 'absolute', left: 12, bottom: 156, zIndex: 6, padding: '9px 10px 9px 11px',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--mat-hairline)',
                background: 'color-mix(in srgb, var(--panel) 82%, transparent)',
                backdropFilter: 'blur(var(--blur))', WebkitBackdropFilter: 'blur(var(--blur))',
                display: 'flex', flexDirection: 'column', gap: 5, minWidth: 156,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Boxes size={12} color="var(--t4)" />
                <span style={{ fontSize: 'var(--fs-3xs, 10px)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t4)', fontWeight: 700 }}>
                  Trình tự
                </span>
                <button
                  type="button"
                  onClick={anTrinhTu}
                  title="Ẩn trình tự"
                  aria-label="Ẩn trình tự"
                  style={{
                    marginLeft: 'auto', width: 18, height: 18, display: 'grid', placeItems: 'center', border: 0,
                    background: 'none', color: 'var(--t4)', cursor: 'pointer', borderRadius: 5,
                  }}
                >
                  <X size={11} />
                </button>
              </div>
              {buoc.map((b, i) => (
                <div key={b.chu} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span
                    style={{
                      width: 15, height: 15, flexShrink: 0, borderRadius: 999, display: 'grid', placeItems: 'center',
                      fontSize: 9, fontWeight: 700,
                      background: b.xong ? 'var(--accent)' : 'var(--field)',
                      color: b.xong ? '#fff' : 'var(--t4)',
                      border: b.xong ? '1px solid var(--accent)' : '1px solid var(--border)',
                    }}
                  >
                    {b.xong ? <Check size={9} strokeWidth={3} /> : i + 1}
                  </span>
                  <span style={{ fontSize: 'var(--fs-2xs)', color: b.xong ? 'var(--t3)' : 'var(--t2)', textDecoration: b.xong ? 'line-through' : 'none' }}>
                    {b.chu}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Viewport3D>

        <ModeSwitchBar />
      </div>
    </div>
  );
}
