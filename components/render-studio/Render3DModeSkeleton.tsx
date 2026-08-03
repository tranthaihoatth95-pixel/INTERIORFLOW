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

import { useCallback, useEffect, useRef, useState } from 'react';
import { Boxes, Check, Hammer, Sparkles, X } from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import { useStageMode } from '@/lib/stage-mode';
import { useT } from '@/lib/i18n';
import { wallSegment } from '@/lib/cad/commands';
import { useScene3D } from '@/lib/render-studio/use-scene3d';
import { useTree3DUi } from '@/lib/render-studio/tree3d-ui';
import { Viewport3D, EMPTY_SCENE_3D } from '@/components/three/Viewport3D';
import ModeSwitchBar from '@/components/render-studio/ModeSwitchBar';
import Command3DPanel, { type Command3DTab } from '@/components/render-studio/Command3DPanel';

const GUIDE_HIDDEN_KEY = 'if.ve3d.guide_hidden_v1';
const WELCOME_HIDDEN_KEY = 'if.ve3d.welcome_hidden_v1';

/** Tường mẫu 4m khi bấm "Dựng khối đầu tiên" — dùng ĐÚNG hàm engine `wallSegment()` của chặng Vẽ
 * (không tự chế hình học), dày 220mm, đặt ở gốc toạ độ để camera đang khung sẵn nhìn thấy ngay. */
const FIRST_WALL = { from: { x: 0, y: 0 }, to: { x: 4000, y: 0 }, thicknessMm: 220 };

export default function Render3DModeSkeleton() {
  const doc = useCadStore((s) => s.doc);
  const { setMode } = useStageMode('render');
  const tr = useT();
  const [tab, setTab] = useState<Command3DTab>('vatlieu');
  const [nhayNutTuong, setNhayNutTuong] = useState(false);
  const [matDangCam, setMatDangCam] = useState<string | null>(null);
  // VIỆC "MỘT THƯ VIỆN" (`PHIEU-CODE-IF-DOT6`, 05/08) — cây đối tượng + panel thuộc tính dời sang
  // Navigator/Inspector (`Object3DTree.tsx`/`Object3DInspector.tsx`, ổ SIBLING của AppShell, xem
  // `HomeScreen.tsx`) — tên group ẩn/đang chọn nay sống ở store chia sẻ `useTree3DUi`, không phải
  // `useState` cục bộ (2 ổ kia không chung cây React cha gần để nhận props).
  const hiddenGroupNames = useTree3DUi((s) => s.hiddenNames);
  const selectedGroupName = useTree3DUi((s) => s.selectedName);
  const [guideHidden, setGuideHidden] = useState(false);
  const [welcomeHidden, setWelcomeHidden] = useState(false);
  const welcomeRef = useRef<HTMLDivElement>(null);
  const soKhoiRef = useRef(0);

  useEffect(() => {
    try {
      setGuideHidden(localStorage.getItem(GUIDE_HIDDEN_KEY) === '1');
      setWelcomeHidden(localStorage.getItem(WELCOME_HIDDEN_KEY) === '1');
    } catch {
      /* localStorage bị chặn — cứ hiện, không phải lỗi chặn việc */
    }
  }, []);

  /** Đóng card chào + NHỚ lựa chọn. Gọi được từ 4 đường: nút ✕, Esc, bấm ra ngoài card, và
   * (gián tiếp) khi dựng xong khối đầu tiên — lúc đó card tự biến mất vì `soKhoi > 0`. */
  const dongCardChao = useCallback(() => {
    setWelcomeHidden(true);
    try {
      localStorage.setItem(WELCOME_HIDDEN_KEY, '1');
    } catch {
      /* không lưu được thì phiên sau hiện lại — không chặn việc */
    }
  }, []);

  const moLaiCardChao = useCallback(() => {
    setWelcomeHidden(false);
    try {
      localStorage.removeItem(WELCOME_HIDDEN_KEY);
    } catch {
      /* bỏ qua */
    }
  }, []);

  // Esc đóng card chào (đường thoát #2). Chỉ gắn khi card đang hiện — không để listener rác.
  useEffect(() => {
    if (welcomeHidden || soKhoiRef.current > 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dongCardChao();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [welcomeHidden, dongCardChao]);

  // Bấm RA NGOÀI card thì đóng (đường thoát #3) — pha BẮT, cùng họ sự kiện `pointerdown` mà
  // `lib/useDismissable` dùng cho mọi lớp nổi của app (00-CHOT "hạ tầng đóng lớp").
  useEffect(() => {
    if (welcomeHidden) return;
    const onDown = (e: PointerEvent) => {
      const card = welcomeRef.current;
      if (card && !card.contains(e.target as Node)) dongCardChao();
    };
    window.addEventListener('pointerdown', onDown, true);
    return () => window.removeEventListener('pointerdown', onDown, true);
  }, [welcomeHidden, dongCardChao]);

  const scene = useScene3D();

  const soKhoi = scene?.groups.length ?? 0;
  soKhoiRef.current = soKhoi;
  const coBanVe = doc.entities.length > 0;

  // Lọc THẬT khỏi cảnh đưa vào Viewport3D theo tên group đang ẩn (state chia sẻ `useTree3DUi`,
  // xem trên) — không phải cờ trang trí. Không dùng useMemo riêng vì `hiddenGroupNames` đổi ít
  // (bấm tay), phép lọc rẻ, tính lại mỗi render cũng không đáng lo.
  const visibleScene = !scene || hiddenGroupNames.size === 0
    ? scene
    : { ...scene, groups: scene.groups.filter((g) => !hiddenGroupNames.has(g.name)) };

  // Chỉ group có entityId (hôm nay = tường, xem cảnh báo `cad-to-obj.ts`) mới đẩy tiếp thành
  // Viewport3D.selectedId — group khác chọn được để XEM thuộc tính (ở Object3DInspector) nhưng
  // chưa có gizmo thật.
  const selectedGroup = scene?.groups.find((g) => g.name === selectedGroupName) ?? null;
  const viewportSelectedId = selectedGroup?.entityId ?? null;

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
    setTab('tao');
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
          scene={visibleScene ?? EMPTY_SCENE_3D}
          selectedId={viewportSelectedId}
          mode="massing"
          onPushPull={handlePushPull}
          ground
          label={soKhoi > 0 ? 'Khối xám · chưa vật liệu' : 'Không gian trống'}
        >
          {soKhoi === 0 && !welcomeHidden && (
            <div
              // pointer-events:none ⇒ overlay KHÔNG chặn orbit/pan; chỉ CARD bắt chuột (đường
              // thoát #4). Bấm ra ngoài card đóng được nhờ listener pointerdown ở dưới, không
              // phải nhờ overlay hứng sự kiện.
              style={{
                position: 'absolute', inset: 0, zIndex: 6, display: 'grid', placeItems: 'center',
                pointerEvents: 'none', padding: 24,
              }}
            >
              <div
                ref={welcomeRef}
                style={{
                  position: 'relative', pointerEvents: 'auto', textAlign: 'center', maxWidth: 360, padding: '18px 20px 20px',
                  borderRadius: 'var(--radius-lg)', border: '1px solid var(--mat-hairline)',
                  background: 'color-mix(in srgb, var(--panel) 88%, transparent)',
                  backdropFilter: 'blur(var(--blur))', WebkitBackdropFilter: 'blur(var(--blur))',
                  boxShadow: 'var(--shadow-pop)',
                }}
              >
                <button
                  type="button"
                  onClick={dongCardChao}
                  title="Đóng"
                  aria-label="Đóng"
                  style={{
                    position: 'absolute', top: 8, right: 8, width: 24, height: 24, display: 'grid',
                    placeItems: 'center', border: 0, background: 'none', color: 'var(--t4)',
                    borderRadius: 7, cursor: 'pointer',
                  }}
                >
                  <X size={13} />
                </button>
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

          {/* Nút gọi lại card chào sau khi đã đóng (đường thoát #3 nói "nhớ", nên phải có lối
              quay lại — SPEC-NGON-NGU: đóng thứ gì cũng phải mở lại được). */}
          {soKhoi === 0 && welcomeHidden && (
            <button
              type="button"
              onClick={moLaiCardChao}
              title="Hiện lại gợi ý bắt đầu"
              aria-label="Hiện lại gợi ý bắt đầu"
              style={{
                position: 'absolute', right: 14, bottom: 74, zIndex: 6, width: 26, height: 26,
                borderRadius: 999, border: '1px solid var(--mat-hairline)',
                background: 'color-mix(in srgb, var(--panel) 82%, transparent)',
                backdropFilter: 'blur(var(--blur))', WebkitBackdropFilter: 'blur(var(--blur))',
                color: 'var(--t3)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              ?
            </button>
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

        {/* VIỆC 2 (SPEC-DUNG-3D-THONG-NHAT §7.1, 05/08) — nút "Dựng ảnh" tím nổi, góc phải-dưới,
            trên ModeSwitchBar. Tên đúng CHỮ spec dùng ("Dựng ảnh", không phải "Dựng ảnh AI" —
            mock còn ghi kiểu cũ, xem BAO-CAO-G4 mục 4 chỗ nhãn chặng cũ đã sửa khi port).
            §7.2 chốt hành vi ĐẦY ĐỦ là gạt mode + dựng SẴN chuỗi 3 node đã nối dây (camera →
            cad2fbx → ai.clay2render) — nhưng chính spec tự ghi "⚠️ CHƯA VERIFY: chưa có hàm dựng-
            sẵn-node-graph từ ngoài (addNodes với dây nối sẵn)". KHÔNG bịa phần đó. Nút hôm nay
            làm ĐÚNG phần đã xác nhận có thật: gạt sang mode `node` CÙNG chặng qua `useStageMode`
            (không đổi chặng, không mất ngữ cảnh — đúng luật "một sổ, nhiều mặt hiện") — người
            dùng tự kéo 3 khối có sẵn trong Thư viện. Dựng-sẵn-chuỗi là việc kế tiếp, có chủ. */}
        <button
          type="button"
          onClick={() => setMode('render')}
          title={tr(
            'Sang bảng dựng (Node) để lắp chuỗi camera → khối 3D → render AI. Dựng sẵn dây nối — việc kế tiếp, chưa làm.',
            'Switch to the Node board to assemble camera → 3D block → render AI. Pre-wired chain — not built yet.',
          )}
          style={{
            position: 'absolute', right: 18, bottom: 76, zIndex: 6,
            height: 38, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 9,
            border: 0, borderRadius: 'var(--radius-md)', background: 'var(--accent)', color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 10px 30px -10px var(--accent-ring), var(--shadow-pop)',
          }}
        >
          <Sparkles size={16} strokeWidth={2} />
          {tr('Dựng ảnh', 'Render')}
        </button>

        <ModeSwitchBar />
      </div>
    </div>
  );
}
