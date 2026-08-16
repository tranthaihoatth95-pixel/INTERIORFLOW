'use client';

/**
 * components/render-studio/CameraExportTab.tsx — phiếu `capture-nut` (14/08): nối kho chờ-dây
 * `captureSequence()` (lib/three/capture.ts, viết xong 03/08 nhưng 0 nút UI gọi) vào tab Camera
 * của `Command3DPanel` — đúng chỗ chú thích tab đã hứa từ trước: "Thiết lập khung hình, ống kính
 * và đường đi TRƯỚC KHI XUẤT". Thay câu placeholder "sắp có" bằng flow xuất thật.
 *
 * PHẠM VI (biên phiếu): CHỈ xuất CHUỖI KHUNG HÌNH PNG dọc đường cam — KHÔNG phải trình dựng video
 * (video tạo+dựng là master node chặng 2 theo chốt 13/08; dãy PNG này là tầng ① 0-credit của
 * SPEC-TRINH-VIDEO-EDITOR: người dùng dựng phim ở công cụ ngoài).
 *
 * Nguồn đường cam: entity polyline cờ `campath:true` (công cụ "Đường cam" chặng 2D, layer
 * IF_CAMPATH) — ưu tiên đường ĐANG chọn, không thì đường vẽ gần nhất (CÙNG logic
 * `components/cad/CamPathPanel.tsx`, không chế cách chọn thứ hai). Thiếu điều kiện → nút MỜ kèm
 * lý do (luật hiện-mờ-kèm-lý-do §9), không ẩn.
 *
 * Đường tải về: gói .zip qua jszip (đã có sẵn trong dep — tiền lệ lib/ho-so-song/pack.ts,
 * lib/boq/xlsx.ts). Chọn zip thay vì bắn N file rời vì trình duyệt chặn tải-nhiều-file tự động
 * liên tiếp (>1 download không user-gesture) — 1 cú tải là đường RẺ và chắc nhất. PNG đã nén sẵn
 * → zip mức STORE, không tốn CPU nén lần 2.
 *
 * Tiến độ: LightArc determinate (khung i/n THẬT từ onFrame stream) + nút Huỷ nối AbortSignal —
 * dùng `captureSequenceAsync` (export additive cùng phiếu) vì bản sync chặn main thread, thanh
 * tiến độ/nút Huỷ chết cứng.
 */

import { useMemo, useRef, useState } from 'react';
import { Images, Square } from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import { useFlowStore } from '@/lib/store';
import type { PolylineEntity } from '@/lib/cad/model';
import { planCamPath, type CamPathResult } from '@/lib/cad/campath';
import type { Scene3DData } from '@/lib/three/cad-to-obj';
// Import TĨNH (không next/dynamic): Command3DPanel vốn đã kéo three tĩnh qua MaterialSphere nên
// ranh giới "không tải three lúc mở app" ở đây đã do nơi mount panel lo; capture.ts module-scope
// không đụng document/canvas (chỉ chạm khi GỌI hàm) — SSR không vỡ. Tĩnh còn để máy soi
// (soi:contract, entry capture-sequence, pattern `import {…captureSequence`) thấy được dây.
import { captureSequenceAsync } from '@/lib/three/capture';
import { useT } from '@/lib/i18n';
import LightArc from '@/components/ui/LightArc';
import { tuPhanSo } from '@/lib/ui/tien-trinh';
import { hoSoSongSlug } from '@/lib/ho-so-song/pack';

/** fps kế hoạch khung — cùng con số bench 3D-2 (`app/dev-bench-3d-2`), đủ mượt cho dựng phim ngoài. */
const FPS = 15;
/** khổ khung 16:9 chuẩn video. */
const FRAME_W = 1920;
const FRAME_H = 1080;
/** trần số khung một lần xuất — chống người dùng gõ 10000 rồi treo RAM (mỗi khung PNG 1080p
 * base64 giữ trong zip trước khi generateAsync; xem cảnh báo RAM ở CaptureSequenceOptions). */
const MAX_FRAMES = 600;

type XuatTrangThai =
  | { kind: 'nghi' }
  | { kind: 'dang-chay'; done: number; total: number }
  | { kind: 'xong'; total: number }
  | { kind: 'da-huy'; done: number; total: number }
  | { kind: 'loi'; msg: string };

export default function CameraExportTab({ scene }: { scene: Scene3DData | null }) {
  const tr = useT();
  const doc = useCadStore((s) => s.doc);
  const selection = useCadStore((s) => s.selection);
  const flowName = useFlowStore((s) => s.flowName);

  const [frameCountStr, setFrameCountStr] = useState('');
  const [trangThai, setTrangThai] = useState<XuatTrangThai>({ kind: 'nghi' });
  const abortRef = useRef<AbortController | null>(null);

  // Ưu tiên đường cam ĐANG chọn, không thì đường VẼ GẦN NHẤT — chép logic CamPathPanel.tsx
  // (một cách chọn duy nhất toàn app, không đẻ cách thứ hai).
  const campathEntity = useMemo(() => {
    const selected = selection.length === 1 ? doc.entities.find((e) => e.id === selection[0] && e.campath) : undefined;
    const found = selected ?? [...doc.entities].reverse().find((e) => e.campath);
    return found && found.type === 'polyline' ? (found as PolylineEntity) : undefined;
  }, [doc.entities, selection]);

  const path: CamPathResult | null = useMemo(() => {
    if (!campathEntity || campathEntity.points.length < 2) return null;
    try {
      return planCamPath(campathEntity.points);
    } catch {
      return null; // đường thoái hoá (điểm trùng nhau…) — coi như chưa có đường cam dùng được
    }
  }, [campathEntity]);

  const coKhoi = (scene?.groups.length ?? 0) > 0;
  const defaultFrames = path ? Math.min(MAX_FRAMES, Math.max(1, Math.round(path.totalDurationSec * FPS))) : 0;
  const parsed = parseInt(frameCountStr, 10);
  const frameCount = Number.isFinite(parsed) && parsed >= 1 ? Math.min(MAX_FRAMES, parsed) : defaultFrames;

  // Lý do nút mờ — nói thẳng thiếu gì + làm ở đâu, KHÔNG ẩn nút (luật hiện-mờ-kèm-lý-do).
  const lyDoMo = !coKhoi
    ? tr('Chưa có khối nào trong cảnh — dựng khối hoặc đùn từ bản vẽ trước.', 'No blocks in the scene yet — build or extrude from the drawing first.')
    : !path
      ? tr('Chưa có đường cam — vẽ bằng công cụ "Đường cam" ở chặng Thiết kế 2D.', 'No camera path yet — draw one with the "Cam path" tool in 2D Design.')
      : null;

  const dangChay = trangThai.kind === 'dang-chay';
  // Đọc qua lõi chung `lib/ui/tien-trinh` để LUẬT "chưa biết tổng thì không có phần trăm" chỉ khai
  // MỘT chỗ — chép lại điều kiện `total > 0` ở đây là đẻ nguồn thứ hai, đúng bệnh [Đ2] cấm.
  const phanTramXuat = (() => {
    if (trangThai.kind !== 'dang-chay') return undefined;
    const tt = tuPhanSo(trangThai.done, trangThai.total);
    return tt.doDuoc ? tt.pct : undefined;
  })();

  const batDauXuat = async () => {
    if (!scene || !path || dangChay || frameCount < 1) return;
    const ac = new AbortController();
    abortRef.current = ac;
    setTrangThai({ kind: 'dang-chay', done: 0, total: frameCount });
    try {
      // jszip import lười theo tiền lệ pptx-zip-fonts.ts (chỉ trả giá khi thật sự bấm xuất).
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const slug = hoSoSongSlug(flowName);
      const result = await captureSequenceAsync(scene, path, {
        fps: FPS,
        frameCount,
        w: FRAME_W,
        h: FRAME_H,
        signal: ac.signal,
        onFrame: (f) => {
          const base64 = f.dataUrl.split(',')[1] ?? '';
          zip.file(`${slug}-khung-${String(f.index + 1).padStart(3, '0')}.png`, base64, { base64: true });
          setTrangThai({ kind: 'dang-chay', done: f.index + 1, total: frameCount });
        },
      });
      if (result.aborted) {
        setTrangThai({ kind: 'da-huy', done: result.frameCount, total: frameCount });
        return;
      }
      // PNG đã nén sẵn — STORE, không nén chồng.
      const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}-chuoi-anh.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setTrangThai({ kind: 'xong', total: result.frameCount });
    } catch (e) {
      setTrangThai({ kind: 'loi', msg: e instanceof Error ? e.message : String(e) });
    } finally {
      abortRef.current = null;
    }
  };

  return (
    <div className="space-y-3">
      <section className="rounded-[10px] border border-[var(--nen-mo-hairline)] bg-[var(--field)] p-2.5" aria-label={tr('Xuất chuỗi ảnh', 'Export image sequence')}>
        <b className="block text-[11px] font-semibold text-[var(--t1)]">{tr('Xuất chuỗi ảnh (PNG)', 'Export image sequence (PNG)')}</b>
        <span className="mt-0.5 block text-[10px] leading-[1.5] text-[var(--t4)]">
          {tr(
            'Chụp dãy khung hình dọc đường cam đã vẽ — dựng phim ở công cụ ngoài.',
            'Captures frames along the drawn camera path — assemble the film in an external tool.',
          )}
        </span>

        {path && (
          <label className="mt-2 flex items-center justify-between gap-2 text-[10px] text-[var(--t3)]">
            {tr('Số khung', 'Frames')}
            <input
              type="number"
              min={1}
              max={MAX_FRAMES}
              value={frameCountStr === '' ? defaultFrames : frameCountStr}
              onChange={(e) => setFrameCountStr(e.target.value)}
              disabled={dangChay}
              className="h-7 w-20 rounded-[6px] border border-[var(--border)] bg-transparent px-2 text-right text-[11px] text-[var(--t1)] tabular-nums"
            />
          </label>
        )}
        {path && (
          <span className="mt-1 block text-[10px] text-[var(--t4)] tabular-nums">
            {tr(
              `Đường cam ${path.totalDurationSec.toFixed(1)}s · ${FRAME_W}×${FRAME_H}px · tối đa ${MAX_FRAMES} khung`,
              `Camera path ${path.totalDurationSec.toFixed(1)}s · ${FRAME_W}×${FRAME_H}px · up to ${MAX_FRAMES} frames`,
            )}
          </span>
        )}

        {!dangChay ? (
          <button
            type="button"
            onClick={batDauXuat}
            disabled={!!lyDoMo}
            className="mt-2 flex h-7 w-full items-center justify-center gap-1.5 rounded-[6px] border border-[var(--border)] bg-transparent px-2 text-[10px] font-semibold text-[var(--t2)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
          >
            <Images size={12} strokeWidth={1.8} />
            {tr('Xuất chuỗi ảnh (PNG)', 'Export image sequence (PNG)')}
          </button>
        ) : (
          <div className="mt-2 flex items-center gap-2">
            {/* 16/08 — SỬA BỊA SỐ (T audit đợt thanh-tien-trinh): `done / Math.max(1, total)` cho ra
                0% khi `total === 0`, tức KHAI MỘT CON SỐ mà thật ra chưa biết gì. Đúng loại lỗi mà
                đợt này sinh ra để diệt. `tuPhanSo` trả "không đo được" khi `total ≤ 0` ⇒ LightArc
                tự chuyển sang cung quay, KHÔNG có `aria-valuenow`, không có con số nào. */}
            <LightArc value={phanTramXuat} size={22} strokeWidth={2.5} label={tr('Tiến độ xuất chuỗi ảnh', 'Sequence export progress')} />
            <span className="flex-1 text-[10px] text-[var(--t3)] tabular-nums">
              {tr(`Khung ${trangThai.done}/${trangThai.total}`, `Frame ${trangThai.done}/${trangThai.total}`)}
            </span>
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="flex h-6 items-center gap-1 rounded-[6px] border border-[var(--border)] bg-transparent px-2 text-[10px] font-semibold text-[var(--t2)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)]"
            >
              <Square size={10} strokeWidth={2} />
              {tr('Huỷ', 'Cancel')}
            </button>
          </div>
        )}

        {lyDoMo && <span className="mt-1.5 block text-[10px] leading-[1.5] text-[var(--t4)]">{lyDoMo}</span>}
        {trangThai.kind === 'xong' && (
          <span className="mt-1.5 block text-[10px] text-[var(--t3)] tabular-nums">{tr(`Đã tải về ${trangThai.total} khung (.zip).`, `Downloaded ${trangThai.total} frames (.zip).`)}</span>
        )}
        {trangThai.kind === 'da-huy' && (
          <span className="mt-1.5 block text-[10px] text-[var(--t3)] tabular-nums">{tr(`Đã huỷ — dừng ở khung ${trangThai.done}/${trangThai.total}, không tải file.`, `Cancelled — stopped at frame ${trangThai.done}/${trangThai.total}, nothing downloaded.`)}</span>
        )}
        {trangThai.kind === 'loi' && (
          <span className="mt-1.5 block text-[10px] leading-[1.5] text-[var(--t2)]">{tr('Xuất lỗi: ', 'Export failed: ')}{trangThai.msg}</span>
        )}
      </section>

      {/* Phần còn lại của tab Camera (đặt camera trong cảnh, ống kính) — vẫn chưa có model camera
          thật trong Doc (spec §6.2). GIỮ câu chờ trung thực, không bịa ô nhập vô chủ (§9). */}
      <div className="rounded-[10px] border border-dashed border-[var(--border)] px-2.5 py-3 text-center text-[11px] leading-relaxed text-[var(--t4)]">
        {tr('Đặt camera trong cảnh · ống kính — sắp có.', 'Place camera in scene · lens — coming soon.')}
      </div>
    </div>
  );
}
