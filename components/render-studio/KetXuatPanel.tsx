'use client';

/**
 * components/render-studio/KetXuatPanel.tsx — MẶT TIỀN của hai năng lực `render` (P0) và `motion`
 * (P1) trong chặng 3D, cộng CẦU sang Trình chiếu.
 *
 * ── DÙNG LẠI, KHÔNG DỰNG MỚI (B25) ─────────────────────────────────────────────────────────────
 *   · Hàng đợi: `render-queue-store` (đã nghiệm thu 15/08) — panel này KHÔNG có vòng chạy riêng,
 *     không có timer, không có tiến trình tự sinh. Số phần trăm đọc thẳng từ job của hàng đợi.
 *   · Tiến trình: `components/ui/LightBar` + `lib/ui/tien-trinh.ts`. Job đang XẾP HÀNG chưa có số
 *     nào đo được ⇒ truyền `null` ⇒ LightBar tự rơi về nhánh KHÔNG-ĐO-ĐƯỢC (không có con số).
 *     Bịa % là `tsc` đỏ, theo thiết kế của chính lõi đó.
 *   · Cầu Trình chiếu: `lib/present-editor/handoff.ts` (`stashPresentHandoffWithIds`) — cầu ĐÃ CÓ
 *     từ trước, id ổn định `renderImageId(nodeId,…)` chính là `assetId` bên Present.
 *   · Chụp khung nhìn: `components/three/capture-live.ts` (nạp động — kéo theo `three`).
 *
 * ── BA ĐIỀU PANEL NÀY KHÔNG LÀM ────────────────────────────────────────────────────────────────
 *  ⛔ Không tự sinh lại khi cảnh đổi — chỉ đóng dấu CŨ. Sinh lại là tiền thật, người bấm.
 *  ⛔ Không hiện tiến trình giả khi provider chết — lỗi hiện nguyên văn engine đã dịch
 *     (`friendlyAiError`) kèm nút Thử lại.
 *  ⛔ Không gọi thứ gì là "dò tia/ray tracing". Xem `CHE_DO_RENDER.giaiThich`.
 */

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Camera, Clapperboard, ExternalLink, Check, X, RotateCw, AlertTriangle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import type * as THREE from 'three';
import { useT } from '@/lib/i18n';
import LightBar from '@/components/ui/LightBar';
import { checkProviders } from '@/lib/ai/client';
import { stashPresentHandoffWithIds, renderImageId } from '@/lib/present-editor/handoff';
import type { Scene3DData } from '@/lib/three/cad-to-obj';
import type { Scene3DCameraApi } from '@/components/three/Scene3DViewer';
import {
  CHE_DO_RENDER,
  bamSceneRev,
  chayRender,
  cheDoTheoId,
  idBanGhi,
  ketQuaCuaNode,
  laBanCu,
  lyDoKhongBamDuoc,
  useKhoKetQua,
  type BanGhiKetQua,
  type CheDoRenderId,
} from '@/lib/capabilities/render';
import {
  CHAT_LUONG_VIDEO,
  THOI_LUONG,
  Y_DINH_CHUYEN_DONG,
  chayChuyenDong,
  type ChatLuongVideo,
  type ThoiLuong,
  type YDinhChuyenDongId,
} from '@/lib/capabilities/motion';
import { useRenderQueue } from '@/components/render-studio/render-queue-store';
import { stageHrefFrom } from '@/lib/project-scope';

/** Phong cách — đúng `STYLE_OPTIONS` của `ai.clay2render` (registry.ts:164). Không thêm giá trị
 * node không nhận. */
const PHONG_CACH = ['Scandinavian', 'Japandi', 'Indochine', 'Modern Luxury', 'Wabi-sabi', 'Industrial'];

/** Tỉ lệ khung — núm THẬT: nó quyết định khung chụp offscreen, nên ảnh AI và clip kế thừa theo. */
const TY_LE: { nhan: string; v: number }[] = [
  { nhan: '16:9', v: 16 / 9 },
  { nhan: '4:3', v: 4 / 3 },
  { nhan: '1:1', v: 1 },
  { nhan: '9:16', v: 9 / 16 },
];

export interface KetXuatPanelProps {
  scene: Scene3DData | null;
  cameraApiRef: React.MutableRefObject<Scene3DCameraApi | null>;
  soKhoi: number;
}

export default function KetXuatPanel({ scene, cameraApiRef, soKhoi }: KetXuatPanelProps) {
  const tr = useT();
  const router = useRouter();
  const pathname = usePathname();
  const items = useKhoKetQua((s) => s.items);
  const jobs = useRenderQueue((s) => s.jobs);

  const [cheDoId, setCheDoId] = useState<CheDoRenderId>('xemTruocThietKe');
  const [phongCach, setPhongCach] = useState(PHONG_CACH[0]);
  const [tyLe, setTyLe] = useState(TY_LE[0].v);
  const [coProvider, setCoProvider] = useState<boolean | null>(null);
  const [providerTen, setProviderTen] = useState('khong-ai');
  const [loi, setLoi] = useState<string | null>(null);
  const [dangChup, setDangChup] = useState(false);

  // Ý định chuyển động (P1) — mở theo từng ảnh đã Nhận.
  const [moChuyenDong, setMoChuyenDong] = useState<string | null>(null);
  const [yDinh, setYDinh] = useState<YDinhChuyenDongId>('toiTruoc');
  const [thoiLuong, setThoiLuong] = useState<ThoiLuong>('5s');
  const [chatLuong, setChatLuong] = useState<ChatLuongVideo>(CHAT_LUONG_VIDEO[0]);

  /** Provider hỏi MỘT lần (client cache sẵn trong `checkProviders`) — dùng cho nút mờ kèm lý do
   * THẬT, và để ghi đúng tên nhà cung cấp vào gia phả. */
  useEffect(() => {
    let huy = false;
    checkProviders()
      .then((p) => {
        if (huy) return;
        const ten = p.fal ? 'fal' : p.comfyui ? 'comfyui' : p.sd ? 'sd' : 'khong-ai';
        setProviderTen(ten);
        setCoProvider(p.fal || p.comfyui || p.sd);
      })
      .catch(() => !huy && setCoProvider(false));
    return () => {
      huy = true;
    };
  }, []);

  /** id của hai ô LÝ DO — nối vào nút mờ bằng `aria-describedby` (xem chỗ dùng). */
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const idLyDoKetXuat = `ketxuat-lydo-${uid}`;
  const idLyDoVideo = `motion-lydo-${uid}`;

  const sceneRev = useMemo(() => (scene ? bamSceneRev(scene) : null), [scene]);
  const cheDo = cheDoTheoId(cheDoId);
  const canTro = lyDoKhongBamDuoc(cheDo, coProvider !== false, soKhoi);

  /**
   * Bản ghi đang chờ kết quả: khi job của nó xong, đọc cổng ra THẬT của node rồi điền `url`.
   * Không polling — chạy lại mỗi khi mảng `jobs` đổi (zustand đã đẩy sự kiện đó).
   */
  useEffect(() => {
    for (const bg of items) {
      if (bg.url || !bg.nodeId) continue;
      const url = ketQuaCuaNode(bg.nodeId, bg.loai === 'phim' ? 'video' : 'image');
      if (url) useKhoKetQua.getState().capNhat(bg.id, { url });
    }
  }, [jobs, items]);

  const jobCuaBanGhi = useCallback(
    (bg: BanGhiKetQua) =>
      bg.nodeId
        ? [...jobs].reverse().find((j) => j.source.kind === 'node' && j.source.nodeId === bg.nodeId)
        : undefined,
    [jobs],
  );

  /* ─────────────────────────────── KẾT XUẤT ─────────────────────────────── */

  const ketXuat = useCallback(async () => {
    setLoi(null);
    const cam = cameraApiRef.current?.camera as THREE.PerspectiveCamera | undefined;
    if (!scene || !cam) {
      setLoi(tr('Khung nhìn 3D chưa sẵn sàng — chờ cảnh dựng xong rồi bấm lại.', '3D view not ready yet — wait for the scene, then retry.'));
      return;
    }
    setDangChup(true);
    try {
      // `three` chỉ nạp khi thật sự bấm — không kéo vào bundle lúc mở app.
      const { chupKhungNhinSong } = await import('@/components/three/capture-live');
      const chup = chupKhungNhinSong(scene, cam, cheDo.rongPx, tyLe);
      const rev = sceneRev ?? bamSceneRev(scene);
      const ten = `${cheDo.ten[0]} · ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

      if (cheDo.lenhNoiBo.length === 0) {
        // Chế độ 1: bản chụp tất định, có ngay, 0 credit, KHÔNG qua hàng đợi (không có gì để đợi).
        useKhoKetQua.getState().them({
          id: idBanGhi('kq'),
          loai: 'anh',
          url: chup.dataUrl,
          ten,
          cheDo: cheDoId,
          camera: chup.camera,
          sceneRev: rev,
          provider: 'khong-ai',
          credit: 0,
          thamSo: { rongPx: chup.camera.rongPx, caoPx: chup.camera.caoPx },
          trangThai: 'xemTruoc',
          luc: Date.now(),
        });
      } else {
        chayRender({
          anhKhoi: chup.dataUrl,
          cheDo: cheDoId,
          phongCach,
          camera: chup.camera,
          sceneRev: rev,
          ten,
          provider: providerTen,
          goc: { x: 80, y: 80 + items.length * 40 },
        });
      }
    } catch (e) {
      setLoi(e instanceof Error ? e.message : String(e));
    } finally {
      setDangChup(false);
    }
  }, [scene, cameraApiRef, cheDo, cheDoId, tyLe, sceneRev, phongCach, providerTen, items.length, tr]);

  /* ─────────────────────────────── CẦU SANG TRÌNH CHIẾU ─────────────────────────────── */

  /**
   * Đưa một ảnh ĐÃ NHẬN sang Trình chiếu qua cầu SẴN CÓ. Quan hệ nguồn giữ được vì id chuyển đi
   * là `renderImageId(nodeId…)` — Present dùng chính chuỗi đó làm `assetId`, và kho kết quả bên
   * này tra ngược được bằng cùng chuỗi (xem `nguonTheoAssetId`).
   */
  const sangTrinhChieu = useCallback(
    (bg: BanGhiKetQua) => {
      if (!bg.url) return;
      const id = bg.nodeId ? renderImageId(bg.nodeId, 0, 1) : bg.id;
      useKhoKetQua.getState().capNhat(bg.id, { thamSo: { ...bg.thamSo, assetId: id } });
      stashPresentHandoffWithIds([{ src: bg.url, id }]);
      router.push(stageHrefFrom(pathname, 'present'));
    },
    [pathname, router],
  );

  /* ─────────────────────────────── GIAO DIỆN ─────────────────────────────── */

  const nhan = { fontSize: 'var(--fs-2xs)', color: 'var(--t3)', lineHeight: 1.6 } as const;
  const oChon: React.CSSProperties = {
    width: '100%', height: 28, borderRadius: 6, padding: '0 8px',
    border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)',
    fontSize: 'var(--fs-2xs)',
  };

  return (
    <div
      style={{
        width: 268, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column',
        gap: 12, padding: 12, background: 'var(--panel)', borderLeft: '1px solid var(--vien-mo)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Camera size={14} strokeWidth={2} color="var(--t2)" />
        <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-semi)', color: 'var(--t1)' }}>
          {tr('Kết xuất', 'Render')}
        </span>
      </div>

      {/* ── Chế độ: ba nấc NGHĨA khác nhau, mỗi nấc nói thật cái nó làm ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={nhan}>{tr('Chế độ', 'Mode')}</span>
        {CHE_DO_RENDER.map((c) => {
          const chon = c.id === cheDoId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCheDoId(c.id)}
              aria-pressed={chon}
              style={{
                // Thang bo token 6/10/14/20 (`hinh-hoc-ap-thang`) — 8 nằm NGOÀI thang, `soi:hinh-hoc` bắt.
                textAlign: 'left', padding: '7px 9px', borderRadius: 10, cursor: 'pointer',
                border: `1px solid ${chon ? 'var(--accent)' : 'var(--border)'}`,
                background: chon ? 'color-mix(in srgb, var(--accent) 12%, var(--field))' : 'var(--field)',
                color: 'var(--t1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'baseline' }}>
                <span style={{ fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-semi)' }}>{tr(c.ten[0], c.ten[1])}</span>
                <span style={{ fontSize: 10.5, color: 'var(--t4)', fontVariantNumeric: 'tabular-nums' }}>
                  {c.credit === 0 ? tr('0 credit', 'free') : `${c.credit} credit`}
                </span>
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--t4)', lineHeight: 1.6, marginTop: 2 }}>
                {tr(c.giaiThich[0], c.giaiThich[1])}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={nhan}>{tr('Tỉ lệ khung', 'Aspect ratio')}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {TY_LE.map((t) => (
            <button
              key={t.nhan}
              type="button"
              onClick={() => setTyLe(t.v)}
              aria-pressed={t.v === tyLe}
              style={{
                flex: 1, height: 26, borderRadius: 6, cursor: 'pointer', fontSize: 10.5,
                border: `1px solid ${t.v === tyLe ? 'var(--accent)' : 'var(--border)'}`,
                background: t.v === tyLe ? 'color-mix(in srgb, var(--accent) 12%, var(--field))' : 'var(--field)',
                color: 'var(--t1)', fontVariantNumeric: 'tabular-nums',
              }}
            >
              {t.nhan}
            </button>
          ))}
        </div>
      </div>

      {cheDo.lenhNoiBo.length > 0 && (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={nhan}>{tr('Phong cách', 'Style')}</span>
          <select style={oChon} value={phongCach} onChange={(e) => setPhongCach(e.target.value)}>
            {PHONG_CACH.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {/* Nút mờ KÈM LÝ DO TỚI ĐƯỢC NGƯỜI DÙNG (khuôn `ToolbarChip` 16/08): dùng `aria-disabled`
            chứ KHÔNG `disabled` — nút `disabled` thật bị Tab bỏ qua nên lý do không bao giờ tới
            bàn phím/trình đọc màn hình (bài học 16/08: "có trong mã" ≠ "tới được người dùng").
            Chặn hành vi bằng nhánh `if` trong onClick. */}
        <button
          type="button"
          onClick={() => { if (canTro || dangChup) return; void ketXuat(); }}
          aria-disabled={!!canTro || dangChup}
          aria-describedby={canTro ? idLyDoKetXuat : undefined}
          style={{
            height: 32, borderRadius: 999, border: 0, cursor: canTro ? 'not-allowed' : 'pointer',
            background: canTro ? 'var(--field)' : 'var(--accent)',
            color: canTro ? 'var(--t4)' : 'var(--on-accent)',
            opacity: canTro ? 'var(--mo-vo-hieu)' : 1,
            fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-semi)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <Camera size={18} strokeWidth={1.9} />
          {dangChup ? tr('Đang chụp khung nhìn…', 'Capturing view…') : tr('Kết xuất khung nhìn này', 'Render this view')}
        </button>
        {canTro && (
          <span id={idLyDoKetXuat} style={{ fontSize: 10.5, lineHeight: 1.6, color: 'var(--warning)' }}>
            {tr(canTro[0], canTro[1])}
          </span>
        )}
        {loi && (
          <span style={{ fontSize: 10.5, lineHeight: 1.6, color: 'var(--danger, #e5484d)' }}>{loi}</span>
        )}
      </div>

      <div style={{ height: 1, background: 'var(--vien-mo)' }} />

      {/* ── Dải kết quả ── */}
      {items.length === 0 && (
        <p style={{ margin: 0, fontSize: 10.5, lineHeight: 1.6, color: 'var(--t4)' }}>
          {tr(
            'Chưa có bản kết xuất nào. Đặt góc nhìn rồi bấm Kết xuất — bản xem trước hiện ở đây, bấm Nhận mới thành tài sản.',
            'No renders yet. Frame a view then hit Render — previews land here; only Accept makes them assets.',
          )}
        </p>
      )}

      {[...items].reverse().map((bg) => {
        const job = jobCuaBanGhi(bg);
        const dangChay = job?.status === 'running';
        const dangCho = job?.status === 'queued';
        const loiJob = job?.status === 'error' ? job.error : null;
        const cu = laBanCu(bg, sceneRev);
        return (
          <div
            key={bg.id}
            style={{
              display: 'flex', flexDirection: 'column', gap: 6, padding: 8, borderRadius: 10,
              border: `1px solid ${cu ? 'var(--warning)' : 'var(--border)'}`, background: 'var(--card, var(--field))',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'baseline' }}>
              <span style={{ fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-semi)', color: 'var(--t1)' }}>{bg.ten}</span>
              <span style={{ fontSize: 10, color: 'var(--t4)' }}>
                {bg.loai === 'phim' ? tr('Phim', 'Clip') : tr('Ảnh', 'Image')}
              </span>
            </div>

            {/* Gia phả — nói thật nhà cung cấp nào chạy và tốn bao nhiêu. */}
            <div style={{ fontSize: 10, color: 'var(--t4)', lineHeight: 1.6, fontVariantNumeric: 'tabular-nums' }}>
              {bg.provider === 'khong-ai' ? tr('không qua AI', 'no AI') : bg.provider} · {bg.credit} credit ·{' '}
              {tr('bản cảnh', 'scene rev')} {bg.sceneRev}
              {bg.camera && ` · ${bg.camera.rongPx}×${bg.camera.caoPx}`}
            </div>

            {cu && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--warning)', lineHeight: 1.6 }}>
                <AlertTriangle size={14} strokeWidth={2} />
                {tr('Nguồn đã đổi — bản này CŨ. Muốn mới thì bấm Kết xuất lại (tốn credit).', 'Source changed — this is stale. Re-render if you want it current (costs credit).')}
              </div>
            )}

            {(dangChay || dangCho) && (
              <LightBar
                /* Xếp hàng = CHƯA CÓ SỐ NÀO ĐO ĐƯỢC ⇒ `undefined` để LightBar rơi về nhánh
                   không-đo-được (không con số, không %). Đang chạy mới có số thật của engine. */
                value={dangChay ? job!.progress : undefined}
                label={dangChay ? tr('Đang kết xuất', 'Rendering') : tr('Đang xếp hàng', 'Queued')}
                height={8}
                soVach={32}
              />
            )}

            {loiJob && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 10.5, lineHeight: 1.6, color: 'var(--danger, #e5484d)' }}>{loiJob}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (!bg.nodeId) return;
                    useRenderQueue.getState().enqueue({
                      viewName: bg.ten,
                      source: { kind: 'node', nodeId: bg.nodeId },
                    });
                  }}
                  style={{
                    height: 26, borderRadius: 999, border: '1px solid var(--border)', background: 'var(--field)',
                    color: 'var(--t1)', fontSize: 10.5, cursor: 'pointer', display: 'inline-flex',
                    alignItems: 'center', justifyContent: 'center', gap: 5,
                  }}
                >
                  <RotateCw size={16} /> {tr('Thử lại', 'Retry')}
                </button>
              </div>
            )}

            {bg.url && bg.loai === 'anh' && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={bg.url} alt={bg.ten} style={{ width: '100%', borderRadius: 6, display: 'block' }} />
            )}
            {bg.url && bg.loai === 'phim' && (
              <video src={bg.url} controls style={{ width: '100%', borderRadius: 6, display: 'block' }} />
            )}

            {bg.url && (
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {bg.trangThai === 'xemTruoc' ? (
                  <>
                    <button type="button" onClick={() => useKhoKetQua.getState().nhan(bg.id)} style={btnChinh}>
                      <Check size={16} /> {tr('Nhận', 'Accept')}
                    </button>
                    <button type="button" onClick={() => useKhoKetQua.getState().bo(bg.id)} style={btnPhu}>
                      <X size={16} /> {tr('Bỏ', 'Discard')}
                    </button>
                  </>
                ) : (
                  <>
                    {bg.loai === 'anh' && (
                      <button
                        type="button"
                        onClick={() => setMoChuyenDong(moChuyenDong === bg.id ? null : bg.id)}
                        style={btnPhu}
                      >
                        <Clapperboard size={16} /> {tr('Chuyển động', 'Motion')}
                      </button>
                    )}
                    {bg.loai === 'anh' && (
                      <button type="button" onClick={() => sangTrinhChieu(bg)} style={btnPhu}>
                        <ExternalLink size={16} /> {tr('Sang Trình chiếu', 'To Presenting')}
                      </button>
                    )}
                    {bg.loai === 'phim' && (
                      <span style={{ fontSize: 10, color: 'var(--t4)', lineHeight: 1.6 }}>
                        {tr('Trình chiếu chưa có ô phim — clip ở lại đây.', 'Presenting has no video element yet — the clip stays here.')}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── P1: núm nhanh chuyển động (chỉ mở trên ảnh đã Nhận) ── */}
            {moChuyenDong === bg.id && bg.trangThai === 'daNhan' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 6, borderTop: '1px solid var(--vien-mo)' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={nhan}>{tr('Ý định chuyển động', 'Motion intent')}</span>
                  <select style={oChon} value={yDinh} onChange={(e) => setYDinh(e.target.value as YDinhChuyenDongId)}>
                    {Y_DINH_CHUYEN_DONG.map((y) => (
                      <option key={y.id} value={y.id}>{tr(y.ten[0], y.ten[1])}</option>
                    ))}
                  </select>
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={nhan}>{tr('Thời lượng', 'Duration')}</span>
                    <select style={oChon} value={thoiLuong} onChange={(e) => setThoiLuong(e.target.value as ThoiLuong)}>
                      {THOI_LUONG.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={nhan}>{tr('Chất lượng', 'Quality')}</span>
                    <select style={oChon} value={chatLuong} onChange={(e) => setChatLuong(e.target.value as ChatLuongVideo)}>
                      {CHAT_LUONG_VIDEO.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                </div>
                {/* Tỉ lệ khung KHÔNG phải núm ở bước này — nói rõ nó đến từ đâu, thay vì bịa một
                    ô chọn mà node không nhận. */}
                <span style={{ fontSize: 10, color: 'var(--t4)', lineHeight: 1.6 }}>
                  {tr('Tỉ lệ khung theo ảnh nguồn', 'Aspect ratio follows the source image')}
                  {bg.camera ? ` · ${bg.camera.rongPx}×${bg.camera.caoPx}` : ''}
                </span>
                <button
                  type="button"
                  aria-disabled={coProvider === false}
                  aria-describedby={coProvider === false ? idLyDoVideo : undefined}
                  onClick={() => {
                    if (coProvider === false) return;
                    setLoi(null);
                    try {
                      chayChuyenDong({
                        nguon: bg,
                        yDinh,
                        thoiLuong,
                        chatLuong,
                        provider: providerTen,
                        goc: { x: 80, y: 420 + items.length * 40 },
                      });
                      setMoChuyenDong(null);
                    } catch (e) {
                      setLoi(e instanceof Error ? e.message : String(e));
                    }
                  }}
                  style={{
                    height: 30, borderRadius: 999, border: 0,
                    cursor: coProvider === false ? 'not-allowed' : 'pointer',
                    opacity: coProvider === false ? 'var(--mo-vo-hieu)' : 1,
                    background: coProvider === false ? 'var(--field)' : 'var(--accent)',
                    color: coProvider === false ? 'var(--t4)' : 'var(--on-accent)',
                    fontSize: 10.5, fontWeight: 'var(--fw-semi)',
                  }}
                >
                  {tr('Cho chuyển động', 'Animate')} · 8 credit
                </button>
                {coProvider === false && (
                  <span id={idLyDoVideo} style={{ fontSize: 10, color: 'var(--warning)', lineHeight: 1.6 }}>
                    {tr('Video chỉ chạy trên nhà cung cấp đám mây (fal) — chưa cấu hình.', 'Video only runs on the cloud provider (fal) — not configured.')}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const btnChung: React.CSSProperties = {
  height: 26, padding: '0 10px', borderRadius: 999, fontSize: 10.5, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 'var(--fw-semi)',
};
const btnChinh: React.CSSProperties = { ...btnChung, border: 0, background: 'var(--accent)', color: 'var(--on-accent)' };
const btnPhu: React.CSSProperties = {
  ...btnChung, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)',
};
