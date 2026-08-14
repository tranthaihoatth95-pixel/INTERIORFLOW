'use client';

/**
 * components/library/Object3DWindow.tsx — cửa sổ nổi xem một cấu kiện 3D (GLB hoặc OBJ+MTL),
 * phiếu `docs/phieu-giao/ghe-3d-window-app.md`. Cùng KHUÔN `ToolWindow.tsx` (T5: window LÀ lớp
 * hiển thị, không phải màn riêng — portal thẳng `document.body`, tránh `overflow:hidden` của
 * ancestor bất kỳ) và cùng LUẬT "kính là VỎ, RUỘT sắc nét" (N1 tội ①): vỏ (header + viền) kính mờ
 * backdrop-blur, RUỘT (canvas three.js) không blur/phủ màu.
 *
 * Ánh sáng scene dựng Y KHUÔN `components/three/material-preview.ts` (RoomEnvironment PMREM 0.04 +
 * NeutralToneMapping — không ACES, không kéo màu vật liệu lệch đi) nhưng đây là viewer TƯƠNG TÁC
 * (OrbitControls, vòng lặp render liên tục khi mở), khác MaterialSphere (render 1 khung → PNG tĩnh).
 *
 * Component THUẦN — không gắn cứng vào bất kỳ asset nào (Lincoln 327 hay bất kỳ món 3D sau này),
 * chỉ nhận URL qua props. `glbUrl` chấp cả `.glb`/`.gltf` (GLTFLoader) lẫn `.obj` (OBJLoader,
 * kèm `mtlUrl` companion) — đuôi file tự quyết loader, không cần cờ riêng.
 *
 * Loader ESM nặng — CHỈ nạp động lúc cửa sổ thật sự MỞ (cùng lý do `lib/three/glb-import.ts`).
 */

import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { Minus, X } from 'lucide-react';
import { useT } from '@/lib/i18n';

export interface Object3DWindowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** URL model — `.glb`/`.gltf` (GLTFLoader) hoặc `.obj` (OBJLoader). */
  glbUrl: string;
  /** Companion `.mtl` khi `glbUrl` là `.obj` — bỏ trống thì OBJ dùng màu trung tính mặc định. */
  mtlUrl?: string;
  title: string;
  /** dòng phụ dưới tiêu đề (vd. "AI-sinh · nguồn: fal:trellis"). */
  subtitle?: string;
}

type LoadStatus = 'loading' | 'ready' | 'error';

export default function Object3DWindow({ open, onOpenChange, glbUrl, mtlUrl, title, subtitle }: Object3DWindowProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const tr = useT();

  useEffect(() => {
    if (!open) return undefined;
    const containerOrNull = containerRef.current;
    if (!containerOrNull) return undefined;
    // Chốt kiểu non-null cho closure `run()` (async function declaration) — TS không giữ narrowing
    // của `const` xuyên qua nested async function declaration, khác arrow function đơn giản.
    const container: HTMLDivElement = containerOrNull;
    let cancelled = false;
    let renderer: import('three').WebGLRenderer | undefined;
    let raf = 0;
    let ro: ResizeObserver | undefined;
    let disposeScene: (() => void) | undefined;
    setStatus('loading');

    async function run() {
      const THREE = await import('three');
      const [{ OrbitControls }, { RoomEnvironment }] = await Promise.all([
        import('three/examples/jsm/controls/OrbitControls.js'),
        import('three/examples/jsm/environments/RoomEnvironment.js'),
      ]);
      if (cancelled) return;

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      // Y KHUÔN material-preview.ts: NeutralToneMapping (KHÔNG ACES — không kéo màu vật liệu lệch).
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      // "nền kem/token app" (phiếu ②) — đọc thẳng --bg đang áp (kem ở theme sáng, tối ở theme tối),
      // không hardcode hex riêng cho viewer.
      const bgToken = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
      scene.background = new THREE.Color(bgToken || '#f2efe9');

      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;
      pmrem.dispose();

      const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 200);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.minDistance = 0.2;
      controls.maxDistance = 50;

      const group = new THREE.Group();
      scene.add(group);

      const isObj = /\.obj(\?|$)/i.test(glbUrl);
      try {
        if (isObj) {
          const [{ OBJLoader }, mtlMod] = await Promise.all([
            import('three/examples/jsm/loaders/OBJLoader.js'),
            mtlUrl ? import('three/examples/jsm/loaders/MTLLoader.js') : Promise.resolve(null),
          ]);
          if (cancelled) return;
          const loader = new OBJLoader();
          if (mtlUrl && mtlMod) {
            const dir = mtlUrl.slice(0, mtlUrl.lastIndexOf('/') + 1);
            const file = mtlUrl.slice(dir.length);
            const materials = await new mtlMod.MTLLoader().setPath(dir).loadAsync(file);
            materials.preload();
            loader.setMaterials(materials);
          }
          const obj = await loader.loadAsync(glbUrl);
          if (cancelled) return;
          obj.traverse((o) => {
            const mesh = o as import('three').Mesh;
            if ((mesh as unknown as { isMesh?: boolean }).isMesh) {
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          });
          group.add(obj);
          // Bản chuẩn-nét xuất ĐƠN VỊ MM (ghi rõ trong header .obj) — quy về mét cho nhất quán với
          // GLB (mét) và với camera/bóng tiếp đất tính theo mét bên dưới.
          group.scale.setScalar(0.001);
        } else {
          const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
          if (cancelled) return;
          const gltf = await new GLTFLoader().loadAsync(glbUrl);
          if (cancelled) return;
          gltf.scene.traverse((o) => {
            const mesh = o as import('three').Mesh;
            if ((mesh as unknown as { isMesh?: boolean }).isMesh) {
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          });
          group.add(gltf.scene);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[Object3DWindow] Không tải được model:', err);
        if (!cancelled) setStatus('error');
        return;
      }
      if (cancelled) return;

      // Đặt khối đứng trên "sàn" y=0, camera lùi theo đường chéo bbox — cùng công thức
      // `fitCameraToScene` của Scene3DViewer (rút gọn, viewer này không có scene CAD để đọc bboxMm).
      const box = new THREE.Box3().setFromObject(group);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      group.position.x -= center.x;
      group.position.z -= center.z;
      group.position.y -= box.min.y;
      const maxDim = Math.max(size.x, size.y, size.z, 0.2);
      camera.position.set(maxDim * 1.15, size.y / 2 + maxDim * 0.75, maxDim * 1.35);
      controls.target.set(0, size.y / 2, 0);
      camera.near = Math.max(0.001, maxDim / 200);
      camera.far = maxDim * 60;
      camera.updateProjectionMatrix();
      controls.update();

      // Bóng tiếp đất nhẹ — đĩa gradient bake 1 lần, cùng tinh thần contactShadowTexture
      // (material-preview.ts) chứ không phải shadowMap thật (viewer nhẹ, không cần depth pass).
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = shadowCanvas.height = 128;
      const sctx = shadowCanvas.getContext('2d')!;
      const grad = sctx.createRadialGradient(64, 64, 4, 64, 64, 62);
      grad.addColorStop(0, 'rgba(0,0,0,.30)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 128, 128);
      const shadowTex = new THREE.CanvasTexture(shadowCanvas);
      const groundGeo = new THREE.PlaneGeometry(maxDim * 2.6, maxDim * 2.6);
      const groundMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = 0.0005;
      scene.add(ground);

      function resize() {
        if (!container || !renderer) return;
        const w = container.clientWidth || 1;
        const h = container.clientHeight || 1;
        // updateStyle=TRUE (mặc định) — khác Scene3DViewer (canvas phủ full viewport nên lệch không
        // lộ ra): ở đây canvas SỐNG TRONG khung cố định min(760px,94vw)×min(600px,…), thiếu bước
        // này thì canvas không có `style.width/height` ⇒ trình duyệt vẽ nó ở đúng KÍCH THƯỚC THUỘC
        // TÍNH (w×devicePixelRatio, vd 1446px trên máy DPR=2) thay vì kích thước CSS thật — quả cầu
        // ghế bị phóng to gấp đôi rồi cắt cụt bởi `overflow:hidden` của khung. Bắt được lúc verify
        // browser thật (canvas.style rỗng, getBoundingClientRect() = 1446×826 thay vì 723×413).
        renderer.setSize(w, h, true);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
      resize();
      ro = new ResizeObserver(resize);
      ro.observe(container);

      function tick() {
        controls.update();
        renderer!.render(scene, camera);
        raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);
      if (!cancelled) setStatus('ready');

      disposeScene = () => {
        controls.dispose();
        envTex.dispose();
        groundGeo.dispose();
        groundMat.dispose();
        shadowTex.dispose();
        group.traverse((o) => {
          const mesh = o as import('three').Mesh;
          if (!(mesh as unknown as { isMesh?: boolean }).isMesh) return;
          mesh.geometry?.dispose();
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const m of mats) {
            if (!m) continue;
            const withMaps = m as unknown as Record<string, { dispose?: () => void } | undefined>;
            for (const key of ['map', 'roughnessMap', 'metalnessMap', 'normalMap', 'aoMap', 'bumpMap']) {
              withMaps[key]?.dispose?.();
            }
            m.dispose();
          }
        });
      };
    }

    void run();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      disposeScene?.();
      if (renderer) {
        renderer.dispose();
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      }
    };
    // glbUrl/mtlUrl đổi (nơi gọi truyền asset khác) → dựng lại toàn bộ scene, giống Scene3DViewer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, glbUrl, mtlUrl]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        left: '50%',
        top: 78,
        transform: 'translateX(-50%)',
        // Mở TỪ BÊN TRONG tấm Thư viện (z-index 91, library-sheet-css.ts:68) — phải đứng cao hơn nó
        // để không bị tấm đè mất RUỘT (đã bắt được lúc verify browser: chỉ header nổi lên, thân
        // cửa sổ bị sheet vẽ đè). Dưới z-index 1000 của tooltip hệ thống (globals.css:1533).
        zIndex: 95,
        width: 'min(760px, 94vw)',
        height: 'min(600px, calc(100vh - 110px))',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid var(--border-strong)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
        // VỎ kính — cùng công thức ToolWindow.tsx (K3: luôn kèm prefix -webkit-).
        background: 'color-mix(in srgb, var(--panel) 82%, transparent)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{title}</p>
          {subtitle && <p style={{ fontSize: 11, color: 'var(--t3)' }}>{subtitle}</p>}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            title={tr('Thu lại', 'Collapse')}
            aria-label={tr('Thu lại', 'Collapse')}
            style={{ padding: 6, borderRadius: 10, color: 'var(--t3)' }}
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            title={tr('Đóng', 'Close')}
            aria-label={tr('Đóng', 'Close')}
            style={{ padding: 6, borderRadius: 10, color: 'var(--t3)' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>
      {/* RUỘT — sắc nét, không kính (N1 tội ①). */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0, background: 'var(--bg)' }}>
        <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
        {status === 'loading' && (
          <p style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--t3)', pointerEvents: 'none' }}>
            {tr('Đang tải mô hình 3D…', 'Loading 3D model…')}
          </p>
        )}
        {status === 'error' && (
          <p style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--danger, #c0392b)', textAlign: 'center', padding: 24 }}>
            {tr('Không tải được mô hình 3D — kiểm tra file nguồn.', "Couldn't load the 3D model — check the source file.")}
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
