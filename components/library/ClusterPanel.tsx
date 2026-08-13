'use client';

/**
 * components/library/ClusterPanel.tsx — KỆ "VĂN PHÒNG · CỤM BÀN" trong sheet Thư viện.
 *
 * ▸ VÌ SAO CÓ FILE NÀY (phiếu S3 VIỆC 1): `lib/cad/workstation-clusters.ts` có 6 hàm sinh cụm
 * viết xong từ trước nhưng **0 nơi gọi** (`grep -rn "workstation-clusters" app/ components/` →
 * rỗng). File này là mặt tiền đưa chúng ra tay kiến trúc sư.
 *
 * ▸ §0b SEARCH — thứ ĐÃ CÓ, không viết lại:
 *   · 6 hàm sinh cụm + `checkMeetingArea()` + hằng số công thái học: `workstation-clusters.ts`.
 *   · Bảng khai núm chỉnh `CLUSTER_SPECS` + `clusterDefaults()`: cũng ở file đó (khai MỘT chỗ,
 *     panel chỉ đọc — nếu panel tự khai dải min/max thì trị số sống ở hai nơi và sẽ lệch).
 *   · `Prim[]` → `Entity[]`: `clusterPrimsToEntities()` (`lib/cad/block-library.ts`), dùng lại
 *     đúng quy ước transform của block DXF thư viện.
 *   · Thả vào bản vẽ: `useCadStore.addEntities()` (`lib/cad/store.ts:520`) — 1 nấc Undo cho cả
 *     cụm, và tự `syncHostedOpenings`. KHÔNG gọi `addEntity` từng cái (n nấc Undo, sai thói quen).
 *
 * ▸ §0e QUYỀN KIỂM SOÁT — đi qua KHUÔN CHUNG `components/studio/Checkpoint.tsx` (S5 dựng 05/08),
 * KHÔNG tự đẻ checkpoint riêng:
 *   KS1 dạng trung gian → `preview` = **SVG dựng từ CHÍNH hình học sắp thả** + số kiểm thật.
 *        Không phải ảnh minh hoạ, không phải câu "đã tạo xong N đối tượng". `params` = bộ núm
 *        máy vừa chạy, đọc được.
 *   KS2 cùng vào → cùng ra → `seed = clusterSeed(specId, values)`. Cụm là hàm TẤT ĐỊNH (không có
 *        random), nên seed ở đây là DẤU VÂN THAM SỐ: ghi lại seed là dựng lại y hệt.
 *   KS3 duyệt theo phần → 2 `items`: **Bàn + vách** / **Ghế**. `onAccept(ids)` chỉ ghi phần đã
 *        tick — bỏ tick ghế thì entity ghế KHÔNG vào `Doc`. Đây là thao tác nghề thật (bản vẽ bố
 *        trí kỹ thuật hay vẽ bàn mà bỏ ghế), không phải chia nhỏ cho có.
 *   KS4 lùi về đâu → `undoLabel` nêu ĐÚNG số entity bản vẽ đang có trước khi thả; `addEntities`
 *        gộp cả cụm vào 1 nấc nên ⌘Z một lần là sạch.
 *   KS5 vì sao → `CheckpointItem.why` + `why` của từng núm (nguồn của trị số mặc định).
 *
 * ▸ `onRetry` CỐ TÌNH KHÔNG TRUYỀN → `Checkpoint` tự hiện nút disabled kèm lý do (§9 cấm nút giả).
 * Lý do: cụm là hàm tất định, "làm lại nguyên tham số cũ" cho ra ĐÚNG hình cũ ⇒ nút bấm-không-đổi-gì
 * chính là nút giả. Muốn khác thì sửa núm — đó là việc của `onEditParams`.
 *
 * ▸ §0f ĐÚNG TRƯỚC KHI ĐẸP — TB1 kích thước: sau khi dựng, panel hiện **bao ngoài · bao bàn ·
 * số chỗ · m²/chỗ**, và với bàn họp thì đối chiếu TCVN 4601 bằng `checkMeetingArea()`. Số đo LẤY
 * TỪ HÌNH HỌC THẬT (`primsBBox`), không phải số khai tay.
 *
 * ▸ LUẬT NÉT: `Prim` không mang bề dày ⇒ **một cấp nét trong một block** tự đúng. Entity sinh ra
 * KHÔNG gán `color`/`lineweight` override — thừa hưởng layer `l-furniture`, nên phân cấp 4:2:1
 * chỉ xuất hiện ở tầng bản vẽ (tường/dim), không nội bộ cụm. Đúng điều 1
 * `docs/00-PHAN-TICH-NGUON-THAM-CHIEU.md`.
 *
 * ⛔ KHÔNG đụng `scripts/cad-library/**` và `public/cad-library/**` (mảng phiên COWORK VẼ) — cụm
 * KHÔNG đi qua `manifest.json`, nó sinh lúc chạy nên không có file .dxf tĩnh nào để thêm vào.
 */

import { useMemo, useRef, useState } from 'react';
import { useT } from '@/lib/i18n';
import { useCadStore } from '@/lib/cad/store';
import { screenToWorld } from '@/lib/cad/model';
import { clusterPrimsToEntities } from '@/lib/cad/block-library';
import type { Prim } from '@/lib/cad/furniture';
import { Checkpoint, type CheckpointItem } from '@/components/studio/Checkpoint';
import {
  CLUSTER_SPECS,
  clusterDefaults,
  clusterSeed,
  checkMeetingArea,
  primsBBox,
  type ClusterParamValue,
  type ClusterResult,
  type ClusterSpec,
} from '@/lib/cad/workstation-clusters';

/* ───────────────────────── xem trước: Prim[] → SVG ───────────────────────── */

/** Cung → chuỗi điểm. Cụm hiện không sinh 'arc', giữ nhánh này để preview không câm nếu sau có. */
function arcPts(c: { x: number; y: number }, r: number, a1: number, a2: number): { x: number; y: number }[] {
  const span = a2 - a1;
  const steps = Math.max(6, Math.ceil(Math.abs(span) / 0.25));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = a1 + (span * i) / steps;
    return { x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r };
  });
}

function PrimSvg({ prims, stroke, dash }: { prims: Prim[]; stroke: string; dash?: string }) {
  return (
    <g fill="none" stroke={stroke} strokeWidth={1} vectorEffect="non-scaling-stroke" strokeDasharray={dash}>
      {prims.map((p, i) => {
        if (p.k === 'circle') return <circle key={i} cx={p.c.x} cy={p.c.y} r={p.r} />;
        const pts = p.k === 'line' ? [p.a, p.b] : p.k === 'poly' ? p.pts : arcPts(p.c, p.r, p.a1, p.a2);
        const d = pts.map((q) => `${q.x},${q.y}`).join(' ');
        return p.k === 'poly' && p.closed ? <polygon key={i} points={d} /> : <polyline key={i} points={d} />;
      })}
    </g>
  );
}

/**
 * Ô xem trước. Trục Y lật (`scale(1,-1)`) vì SVG đi xuống còn bản vẽ CAD đi lên — không lật thì
 * cụm hiện ngược, ghế nằm sai phía so với lúc thả xuống canvas.
 */
function ClusterPreview({
  result,
  meeting,
}: {
  result: ClusterResult;
  meeting: { ok: boolean; m2PerPerson: number; requiredM2: number } | null;
}) {
  const b = primsBBox(result.prims);
  // Nới khung theo vùng chờ để KTS thấy luôn chỗ cụm THẬT SỰ chiếm, không chỉ phần có nét.
  let [x0, y0, x1, y1] = [b.minX, b.minY, b.maxX, b.maxY];
  for (const c of result.clearance) {
    x0 = Math.min(x0, c.x - c.w / 2);
    x1 = Math.max(x1, c.x + c.w / 2);
    y0 = Math.min(y0, c.y - c.h / 2);
    y1 = Math.max(y1, c.y + c.h / 2);
  }
  const pad = Math.max(200, (x1 - x0) * 0.04);
  const w = Math.max(1, x1 - x0 + pad * 2);
  const h = Math.max(1, y1 - y0 + pad * 2);

  const clearancePrims: Prim[] = result.clearance.map((c) => ({
    k: 'poly',
    closed: true,
    pts: [
      { x: c.x - c.w / 2, y: c.y - c.h / 2 },
      { x: c.x + c.w / 2, y: c.y - c.h / 2 },
      { x: c.x + c.w / 2, y: c.y + c.h / 2 },
      { x: c.x - c.w / 2, y: c.y + c.h / 2 },
    ],
  }));

  return (
    <div>
      <svg
        viewBox={`${x0 - pad} ${-(y1 + pad)} ${w} ${h}`}
        style={{ width: '100%', height: 230, display: 'block', background: 'var(--s2, rgba(127,127,127,0.06))', borderRadius: 10 }}
        role="img"
        aria-label="Xem trước cụm"
      >
        <g transform="scale(1,-1)">
          {/* vùng chờ vẽ TRƯỚC để nằm dưới, nét đứt mảnh — đây là thông tin, không phải trang trí */}
          <PrimSvg prims={clearancePrims} stroke="var(--t4)" dash="120 90" />
          <PrimSvg prims={result.prims} stroke="var(--t1)" />
        </g>
      </svg>

      {/* Đối chiếu quy chuẩn nằm NGAY TRONG ô xem trước — người ký hồ sơ thấy con số trước khi
         bấm Nhận, không phải sau. */}
      {meeting && (
        <p
          style={{
            margin: '8px 0 0', fontSize: 11.5, lineHeight: 1.6, padding: '6px 9px', borderRadius: 10,
            border: `1px solid ${meeting.ok ? 'var(--border)' : 'var(--danger)'}`,
            color: meeting.ok ? 'var(--t2)' : 'var(--danger)',
          }}
        >
          {meeting.ok
            ? `Đạt TCVN 4601 — ${meeting.m2PerPerson} m²/người ≥ ${meeting.requiredM2} m²/người (phòng họp có bàn).`
            : `CHƯA đạt TCVN 4601 — ${meeting.m2PerPerson} m²/người, cần ≥ ${meeting.requiredM2}. Nới lối đi hoặc bớt chỗ.`}
        </p>
      )}
    </div>
  );
}

/* ───────────────────────── panel ───────────────────────── */

const mm = (n: number) => `${Math.round(n).toLocaleString('vi-VN')}`;

export function ClusterPanel({ onInserted }: { onInserted?: () => void }) {
  const tr = useT();
  const [specId, setSpecId] = useState(CLUSTER_SPECS[0].id);
  const [values, setValues] = useState<Record<string, Record<string, ClusterParamValue>>>(() =>
    Object.fromEntries(CLUSTER_SPECS.map((s) => [s.id, clusterDefaults(s)])),
  );
  // KS3 — mặc định tick CẢ HAI phần; người dùng bỏ tick "Ghế" thì ghế không vào bản vẽ.
  const [items, setItems] = useState<CheckpointItem[]>([]);
  const paramsRef = useRef<HTMLDivElement>(null);
  // KS4 — số đối tượng hiện có, ĐỌC QUA HOOK để `undoLabel` cập nhật theo bản vẽ. Gọi
  // `useCadStore.getState()` thẳng trong thân render thì con số đứng im khi bản vẽ đổi, và
  // "lùi về đâu" mà nói sai số thì tệ hơn không nói.
  const entityCount = useCadStore((s) => s.doc.entities.length);

  const spec = CLUSTER_SPECS.find((s) => s.id === specId) as ClusterSpec;
  const v = values[spec.id];

  // Dựng lại mỗi khi đổi tham số — đây chính là phép thử §0f TB4 "đổi dữ liệu, hình có tự cập
  // nhật không". Có, vì cụm sinh bằng hàm chứ không phải toạ độ gõ tay.
  const result = useMemo(() => spec.build(v), [spec, v]);
  const meeting = spec.isMeeting ? checkMeetingArea(result) : null;
  const seed = useMemo(() => clusterSeed(spec.id, v), [spec.id, v]);

  // Hai phần duyệt riêng, dựng lại theo kết quả hiện tại nhưng GIỮ lựa chọn tick cũ (đổi bề rộng
  // bàn không được âm thầm tick lại "Ghế" mà người dùng vừa bỏ).
  const shownItems = useMemo<CheckpointItem[]>(() => {
    const keep = (id: string) => items.find((i) => i.id === id)?.selected ?? true;
    return [
      {
        id: 'desks',
        label: tr('Bàn + vách', 'Desks + partitions'),
        detail: `${result.deskPrims.length} ${tr('nét', 'shapes')} · ${mm(result.deskEnvelopeMm.w)}×${mm(result.deskEnvelopeMm.h)}mm`,
        why: tr('Bao ngoài này là số các bản vẽ bố trí thường ghi dim (ghế bị xê dịch nên không ai lấy làm kích thước cụm).', 'This envelope is what layout drawings dimension — chairs move, so they are not the cluster size.'),
        selected: keep('desks'),
      },
      {
        id: 'chairs',
        label: tr('Ghế', 'Chairs'),
        detail: `${result.chairPrims.length} ${tr('nét', 'shapes')} · ${result.seats} ${tr('chỗ', 'seats')}`,
        why: tr('Ghế vẽ tiết chế: mâm + lưng + 2 tay. Bỏ tick nếu bản vẽ kỹ thuật không cần ghế.', 'Chairs are drawn sparingly: seat + back + 2 arms. Untick if the technical drawing does not need them.'),
        selected: keep('chairs'),
      },
    ];
  }, [result, items, tr]);

  const setParam = (id: string, val: ClusterParamValue) =>
    setValues((prev) => ({ ...prev, [spec.id]: { ...prev[spec.id], [id]: val } }));

  /** ③ QUYẾT — CHỈ ghi phần đã tick. Không có đường ghi cả mẻ. */
  const accept = (ids: string[]) => {
    const chosen: Prim[] = [
      ...(ids.includes('desks') ? result.deskPrims : []),
      ...(ids.includes('chairs') ? result.chairPrims : []),
    ];
    if (!chosen.length) return;
    const st = useCadStore.getState();
    // Thả vào GIỮA khung nhìn hiện tại — không thả vào gốc toạ độ (dễ chồng lên bản vẽ có sẵn và
    // nằm ngoài màn hình). `screenToWorld` là hàm sẵn có của model.ts, không tự tính lại ma trận.
    const at = screenToWorld(st.viewport, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
    st.addEntities(clusterPrimsToEntities(chosen, at, { layer: 'l-furniture' }));
    const partLabel = ids.length === 2 ? tr('cả bàn lẫn ghế', 'desks and chairs') : ids.includes('desks') ? tr('chỉ bàn + vách', 'desks + partitions only') : tr('chỉ ghế', 'chairs only');
    st.setStatus(
      tr(
        `Đã thả "${spec.label[0]}" (${partLabel}) — ${mm(result.sizeMm.w)}×${mm(result.sizeMm.h)}mm · ${result.seats} chỗ · ${result.areaPerSeatWithClearanceM2} m²/chỗ cả lối đi · seed ${seed}. ⌘Z để lùi.`,
        `Placed "${spec.label[1]}" (${partLabel}) — ${mm(result.sizeMm.w)}×${mm(result.sizeMm.h)}mm · ${result.seats} seats · ${result.areaPerSeatWithClearanceM2} m²/seat incl. circulation · seed ${seed}. ⌘Z to undo.`,
      ),
    );
    onInserted?.();
  };

  const lbl: React.CSSProperties = { fontSize: 11, color: 'var(--t3)', display: 'block', marginBottom: 3 };
  const field: React.CSSProperties = {
    width: '100%', padding: '5px 7px', borderRadius: 6, border: '1px solid var(--border)',
    background: 'transparent', color: 'var(--t1)', fontSize: 12,
  };

  return (
    /* `.libmain` là flex-column CAO CỐ ĐỊNH và `overflow:visible` — con của nó phải tự claim
       `flex:1 + minHeight:0 + overflow` mới cuộn được, đúng cách `.grid` đang làm
       (`library-sheet-css.ts:96`). Không làm vậy thì phần dưới checkpoint (ô tick + nút Nhận)
       tràn khỏi sheet và KHÔNG BẤM ĐƯỢC — đã dính đúng lỗi này lúc nghiệm thu. */
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'grid',
        gridTemplateColumns: 'minmax(180px, 220px) 1fr',
        gap: 14,
        padding: '12px 14px 16px',
      }}
    >
      {/* ── cột trái: 6 cụm ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: 0, overflowY: 'auto' }}>
        {CLUSTER_SPECS.map((s) => {
          const on = s.id === spec.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSpecId(s.id)}
              aria-pressed={on}
              style={{
                textAlign: 'left', padding: '7px 9px', borderRadius: 10, cursor: 'pointer',
                border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                background: on ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : 'transparent',
                color: 'var(--t1)',
              }}
            >
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 500 }}>{tr(s.label[0], s.label[1])}</span>
              <span style={{ display: 'block', fontSize: 10.5, color: 'var(--t4)', marginTop: 2, lineHeight: 1.5 }}>
                {tr(s.desc[0], s.desc[1])}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── cột phải: núm chỉnh + CHECKPOINT (xem trước · duyệt phần · quyết) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, minHeight: 0, overflowY: 'auto' }}>
        <div ref={paramsRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
          {spec.params.map((p) => (
            <label key={p.id} title={p.why} style={{ minWidth: 0 }}>
              <span style={lbl}>
                {tr(p.label[0], p.label[1])}
                {p.unit ? <span style={{ color: 'var(--t4)' }}> ({p.unit})</span> : null}
              </span>
              {p.kind === 'select' ? (
                <select style={field} value={String(v[p.id])} onChange={(e) => setParam(p.id, e.target.value)}>
                  {(p.options ?? []).map((o) => (
                    <option key={o.value} value={o.value}>{tr(o.label[0], o.label[1])}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  style={field}
                  value={Number(v[p.id])}
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  onChange={(e) => setParam(p.id, Number(e.target.value))}
                />
              )}
            </label>
          ))}
        </div>

        {/* KHUÔN CHUNG S5 — KHÔNG tự đẻ checkpoint riêng. `phase` luôn 'preview': cụm dựng tức
           thì (hàm thuần, không I/O) nên KHÔNG có pha 'running' — bịa ra thanh tiến độ cho việc
           chạy xong trong 1ms mới là giả. */}
        <Checkpoint
          phase="preview"
          title={tr(`Thả cụm "${spec.label[0]}" vào bản vẽ`, `Place "${spec.label[1]}" into the drawing`)}
          preview={<ClusterPreview result={result} meeting={meeting} />}
          items={shownItems}
          onItemsChange={setItems}
          params={[
            ...spec.params.map((p) => ({ label: tr(p.label[0], p.label[1]), value: `${v[p.id]}${p.unit ? ` ${p.unit}` : ''}` })),
            { label: tr('Bao ngoài kể cả ghế', 'Envelope incl. chairs'), value: `${mm(result.sizeMm.w)}×${mm(result.sizeMm.h)} mm` },
            { label: tr('Riêng bàn + vách', 'Desks + partitions only'), value: `${mm(result.deskEnvelopeMm.w)}×${mm(result.deskEnvelopeMm.h)} mm` },
            { label: tr('Số chỗ', 'Seats'), value: String(result.seats) },
            { label: tr('m²/chỗ — riêng bàn', 'm²/seat — desks only'), value: `${result.areaPerSeatM2}` },
            { label: tr('m²/chỗ — cả lối đi', 'm²/seat — incl. circulation'), value: `${result.areaPerSeatWithClearanceM2}` },
          ]}
          seed={seed}
          undoLabel={tr(
            `bản vẽ trước khi thả cụm (${entityCount} đối tượng)`,
            `the drawing before placing this cluster (${entityCount} objects)`,
          )}
          onAccept={accept}
          onEditParams={() => paramsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}
        />
      </div>
    </div>
  );
}
