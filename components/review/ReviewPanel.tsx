'use client';

/**
 * components/review/ReviewPanel.tsx — BẢNG KIỂM BA CHẶNG (p3c 08/08 · hai chế độ hiển thị P-B 16/08).
 * Đồng hồ cho động cơ `lib/review/` (khung hai lớp + `hien-thi-luat.ts`).
 *
 * VẼ ĐÚNG SPEC trong docstring `lib/review/index.ts` — KHÔNG thiết kế lại:
 *   phần trên  LUẬT  — đỏ/vàng · dẫn `nguon` · nút "Sửa" khi có `cachSua`
 *   ─── vạch ngăn ───
 *   phần dưới  GỢI Ý — dấu Magic tím + glyph · chữ "gợi ý" · nút "Bỏ qua" · KHÔNG chặn
 *
 * Hai lớp KHÔNG trộn trên màn: hai khối riêng, tiêu đề riêng, và dữ liệu đã TÁCH SẴN từ
 * `ReviewResult` (types.ts khoá ở compile-time) — component này không phân loại gì cả.
 *
 * ── P-B (16/08) · HAI CHẾ ĐỘ HIỂN THỊ, mock `docs/mocks/mock-the-vi-pham-2-che-do.html` ──
 * NGẮN (mặc định) = lúc chạy deadline: mức + nhãn mức + một câu + số hiệu + nút.
 * ĐẦY ĐỦ = lúc bảo vệ hồ sơ: thêm nguyên văn điều khoản + trục nguồn + cách sửa + ngày hiệu lực
 * + cờ "số liệu chưa đối chiếu bản gốc". Nhớ theo máy (localStorage), đổi bất cứ lúc nào.
 * Núm đổi là SEGMENTED 2 nấc đặt ngay đầu khối LUẬT — chế độ đổi liên tục theo tình huống,
 * giấu sau menu là mất.
 *
 * ⛔ Component này KHÔNG quyết định chế độ nào hiện gì — `dungTheLuat()` quyết, nó chỉ VẼ.
 * Lý do: ba mặt tiền (2D · 3D · deck) mà mỗi nơi tự diễn dịch thì rào chống-bịa-nguyên-văn có
 * ba bản, hỏng một bản là hỏng thật. Nguyên văn chưa có ⇒ hiện đúng câu `THIEU_NGUYEN_VAN`.
 *
 * A11Y (NT-8 + design:accessibility-review): mức KHÔNG bao giờ chỉ phân biệt bằng màu —
 * mỗi mức có HÌNH DẠNG riêng (bát giác/tam giác/tia) + NHÃN CHỮ riêng (Bắt buộc/Khuyến nghị/
 * gợi ý). Bỏ hết màu (in trắng đen, mù màu đỏ-lục) vẫn đọc ra được ba loại.
 *
 * MỘT chỗ ngồi cho cả ba chặng (CHOT-TACH-AI §4 luật ① "chỗ ngồi cố định"): mount DUY NHẤT ở
 * `AppShell` (ổ mép phải, ngoài Inspector), panel tự đọc chặng đang mở qua prop `stage` rồi gọi
 * đúng hàm — không mount 3 bản ở 3 màn.
 *
 * Tay cầm thu/mở = `PanelFlank` dùng chung (Hoà chốt 07/08 — không chế dải thứ hai); mặc định
 * THU (defaultOpen=false) để không chiếm 300px mọi màn, PanelFlank tự nhớ lựa chọn theo panel.
 *
 * Nhảy-tới-đối-tượng — BA MẶT TIỀN, một cho mỗi chặng (GOTO-3D 19/08 đóng nốt mặt tiền cuối):
 *   2D    → `select([entityId])` của useCadStore + sự kiện `cad:goto-box` (`CadCanvas.tsx` —
 *           fit camera vào box, cùng đường CadSheets dùng).
 *   3D    → sự kiện `render:goto-entity` (`Viewport3D.tsx` nghe — chọn qua `useTree3DUi` +
 *           `Scene3DCameraApi.fit(entityId)` khung camera quanh riêng khối đó).
 *   deck  → sự kiện `present:goto-slide` (R7 19/08, `PresentEditor.tsx` nghe).
 *
 * G2: nền đặc `var(--panel)` 100% · G4: mọi chữ line-height ≥1.5 · G6: nút hành động có CHỮ ·
 * G8: PanelFlank là nút bấm, không kéo thả. Bo góc: thang duyệt 12/08 qua `lib/geometry`.
 */

import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Crosshair, Wrench, ShieldCheck, OctagonAlert, TriangleAlert, Landmark, Ruler, TrendingUp, HelpCircle } from 'lucide-react';
import PanelFlank from '@/components/ui/PanelFlank';
import { useCadStore } from '@/lib/cad/store';
import { entityBox } from '@/lib/cad/model';
import { RADIUS, concentricRadius } from '@/lib/geometry';
import {
  review2d, review3d, reviewDeck,
  dungTheLuat, dungTheGopy, layCheDoHienThi, datCheDoHienThi, THIEU_NGUYEN_VAN,
  type FindingLuat, type FindingGopy, type ReviewChang, type CheDoHienThi, type HinhDangMuc, type Nhan,
} from '@/lib/review';
import { useT, useLang } from '@/lib/i18n';
import type { EditorSlide } from '@/lib/present-editor/model';

export type ReviewPanelStage = 'cad' | 'render' | 'present';

const CHANG_OF_STAGE: Record<ReviewPanelStage, ReviewChang> = { cad: '2d', render: '3d', present: 'deck' };

/** Bo góc: thẻ = --r-2 (10) · chip/nút nằm SÂU trong thẻ nên lấy nấc của chính nó = --r-1 (6). */
const R_THE = RADIUS.r2;
const R_NHO = RADIUS.r1;

export default function ReviewPanel({ stage }: { stage: ReviewPanelStage }) {
  const tr = useT();
  return (
    <PanelFlank side="right" storageKey={`review.${stage}`} label={tr('bảng kiểm', 'review board')} defaultOpen={false}>
      <ReviewBody stage={stage} />
    </PanelFlank>
  );
}

/** Ruột tách riêng để chỉ TÍNH khi panel đang mở — PanelFlank không render children lúc thu,
 * nên checkStandards (đo hình học cả Doc) không chạy nền trên mọi màn. */
function ReviewBody({ stage }: { stage: ReviewPanelStage }) {
  const tr = useT();
  const lang = useLang();
  const doc = useCadStore((s) => s.doc);
  const chang = CHANG_OF_STAGE[stage];
  // "Bỏ qua" của lớp GỢI Ý — state phiên (không persist): gợi ý là chuyện của lần nhìn này.
  const [boQua, setBoQua] = useState<Set<number>>(new Set());

  // Chế độ hiển thị lớp LUẬT — nhớ per-user. Đọc trong effect chứ không lúc khởi tạo state:
  // localStorage không tồn tại khi render trên server, đọc thẳng là lệch hydrate.
  const [cheDo, setCheDo] = useState<CheDoHienThi>('ngan');
  useEffect(() => { setCheDo(layCheDoHienThi()); }, []);
  const doiCheDo = (m: CheDoHienThi) => { setCheDo(m); datCheDoHienThi(m); };

  /* R7 (19/08) — SLIDES THẬT từ trình dàn trang, đóng nợ p3c "chờ mở cửa đọc slides".
   * Truth deck vẫn của useEditor trong PresentEditor; đây chỉ giữ THAM CHIẾU mảng slides nhận
   * qua cầu CustomEvent (PresentEditor.tsx cùng ngày) — không clone, không persist, không mutate.
   * `null` = KHÔNG có hồ sơ nào đang mở (PresentEditor chưa mount / đã unmount) — trạng thái
   * khác hẳn "deck 0 vi phạm", UI phải nói khác nhau (N5). */
  const [deckSlides, setDeckSlides] = useState<EditorSlide[] | null>(null);
  useEffect(() => {
    if (chang !== 'deck') return;
    const onState = (ev: Event) => {
      const slides = (ev as CustomEvent<{ slides?: EditorSlide[] | null }>).detail?.slides;
      setDeckSlides(Array.isArray(slides) ? slides : null);
    };
    window.addEventListener('present:deck-review-state', onState);
    // Panel mặc định THU — mở ra mới mount ReviewBody, nên phải HỎI bản hiện tại (editor đã
    // phát state từ trước khi mình nghe). Nghe trước, hỏi sau: trả lời là dispatch đồng bộ.
    window.dispatchEvent(new CustomEvent('present:deck-review-request'));
    return () => window.removeEventListener('present:deck-review-state', onState);
  }, [chang]);

  /** Chọn nhãn theo ngôn ngữ giao diện — mọi nhãn từ engine đều song ngữ sẵn. */
  const n = (x: Nhan) => (lang === 'en' ? x.en : x.vi);

  const result = useMemo(() => {
    if (chang === '2d') return review2d({ doc, deBai: null });
    if (chang === '3d') return review3d({ doc, deBai: null });
    // DECK (R7 19/08): slides thật nhận qua cầu event ở trên. `null` (chưa có hồ sơ mở) thì
    // reviewDeck nhận undefined → luat=[] — nhưng UI phân biệt bằng `deckSlides === null`,
    // KHÔNG được đọc thành "0 vi phạm" (N5).
    return reviewDeck({ slides: deckSlides ?? undefined, deBai: null });
  }, [chang, doc, deckSlides]);

  const nhayToi = (f: FindingLuat) => {
    // Deck: ViTri.slide (1-index) → chuyển slide đang mở trong PresentEditor (listener R7).
    if (chang === 'deck') {
      if (typeof f.viTri?.slide === 'number') {
        window.dispatchEvent(new CustomEvent('present:goto-slide', { detail: { slide: f.viTri.slide } }));
      }
      return;
    }
    // GOTO-3D (19/08): 3D KHÔNG dùng đường CadStore/`cad:goto-box` bên dưới — đó là kênh của
    // CadCanvas (2D), ở 3D nó không có ai nghe nên trước bản vá này bấm 1 finding 3D không làm
    // gì cả. `Viewport3D.tsx` nghe `render:goto-entity` riêng (chọn qua `useTree3DUi` + khung
    // camera qua `Scene3DCameraApi.fit(entityId)`).
    if (chang === '3d') {
      const id = f.viTri?.entityId;
      if (id) window.dispatchEvent(new CustomEvent('render:goto-entity', { detail: { entityId: id } }));
      return;
    }
    const st = useCadStore.getState();
    const id = f.viTri?.entityId;
    const e = id ? st.doc.entities.find((x) => x.id === id) : undefined;
    if (e) {
      st.select([e.id]);
      const b = entityBox(e);
      const PAD = 1200;
      window.dispatchEvent(new CustomEvent('cad:goto-box', { detail: { minX: b.minX - PAD, minY: b.minY - PAD, maxX: b.maxX + PAD, maxY: b.maxY + PAD } }));
      return;
    }
    if (f.viTri?.mm) {
      const { x, y } = f.viTri.mm;
      window.dispatchEvent(new CustomEvent('cad:goto-box', { detail: { minX: x - 1500, minY: y - 1500, maxX: x + 1500, maxY: y + 1500 } }));
    }
  };

  const sua = (f: FindingLuat) => {
    nhayToi(f);
    if (f.cachSua) useCadStore.getState().setStatus(`${tr('Sửa', 'Fix')}: ${f.cachSua}`);
  };

  const doCount = result.luat.filter((f) => f.muc === 'do').length;
  const vangCount = result.luat.length - doCount;
  const goiYConLai = result.gopy.map((g, i) => ({ g, i })).filter(({ i }) => !boQua.has(i));

  return (
    <div
      style={{
        width: 300, flex: '0 0 300px', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column',
        borderLeft: '1px solid var(--border)', background: 'var(--panel)', // G2 — nền đặc 100%
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
        <ShieldCheck size={14} color="var(--t3)" />
        <span style={{ fontSize: 12, lineHeight: 1.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t3)' }}>
          {tr('Bảng kiểm', 'Review board')}
        </span>
        {/* Bộ đếm: mỗi số đi kèm ĐÚNG hình dạng của mức nó đếm. Trước 16/08 hai số đứng cạnh
            nhau trần trụi — "2" đỏ và "1" vàng đọc lướt thành "21". Hình dạng vừa tách hai số,
            vừa là kênh a11y thứ hai (không chỉ dựa vào màu). */}
        <span
          style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, lineHeight: 1.5, color: 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}
          aria-label={tr(`${doCount} bắt buộc, ${vangCount} khuyến nghị`, `${doCount} mandatory, ${vangCount} advisory`)}
        >
          {doCount > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--danger)', fontWeight: 700 }}>
              <OctagonAlert size={14} strokeWidth={1.5} aria-hidden />{doCount}
            </span>
          )}
          {vangCount > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--warning)', fontWeight: 700 }}>
              <TriangleAlert size={14} strokeWidth={1.5} aria-hidden />{vangCount}
            </span>
          )}
          {/* R7: deck chưa nối hồ sơ nào thì header nói "chưa kiểm" — "0 vi phạm" ở trạng thái
              đó là nói dối (không có gì được kiểm cả). Hai trạng thái phải phân biệt được. */}
          {result.luat.length === 0 &&
            (chang === 'deck' && deckSlides === null ? tr('chưa kiểm', 'not checked') : tr('0 vi phạm', '0 issues'))}
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* ───────────────── KHỐI LUẬT — tất định, dẫn điều khoản ───────────────── */}
        <div style={{ padding: '10px 12px 4px', fontSize: 11, lineHeight: 1.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t3)' }}>
          {tr('Luật — theo chuẩn, dẫn được điều khoản', 'Rules — standards, citable')}
        </div>

        {/* Núm đổi chế độ — capsule ngoài r-full, nút trong r-full, đệm 3 (bo đồng tâm §2d). */}
        <div
          role="group"
          aria-label={tr('Chế độ hiển thị luật', 'Rule display mode')}
          style={{ display: 'inline-flex', gap: 3, margin: '0 12px 8px', padding: 3, border: '1px solid var(--border)', borderRadius: RADIUS.full, background: 'var(--field)' }}
        >
          {(['ngan', 'dayDu'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={cheDo === m}
              onClick={() => doiCheDo(m)}
              title={m === 'ngan'
                ? tr('Chỉ mức, một câu và số hiệu điều khoản', 'Level, one line, clause number only')
                : tr('Thêm nguyên văn điều khoản, cách sửa và ngày hiệu lực', 'Adds clause text, how to fix and effective date')}
              style={{
                height: 26, padding: '0 12px', border: 0, borderRadius: RADIUS.full, cursor: 'pointer',
                background: cheDo === m ? 'var(--card)' : 'transparent',
                color: cheDo === m ? 'var(--t1)' : 'var(--t3)',
                fontFamily: 'inherit', fontSize: 11, lineHeight: 1.5, fontWeight: 600,
              }}
            >
              {m === 'ngan' ? tr('Ngắn', 'Brief') : tr('Đầy đủ', 'Full')}
            </button>
          ))}
        </div>

        {/* R7 (19/08) — deck ĐÃ nối slides thật; câu "chưa nối" cũ chỉ còn cho đúng trạng thái
            KHÔNG có hồ sơ nào đang mở (PresentEditor chưa mount: màn chọn loại hồ sơ / BOQ /
            chưa vào chặng). Vẫn không phải "0 vi phạm" — không có gì được kiểm. */}
        {chang === 'deck' && deckSlides === null && (
          <p style={{ margin: '2px 12px 10px', fontSize: 12, lineHeight: 1.5, color: 'var(--t4)' }}>
            {tr(
              'Không có hồ sơ nào đang mở trong trình dàn trang — mở một hồ sơ để kiểm. Không có gì được kiểm; đây không phải "0 vi phạm".',
              'No deck is open in the layout editor — open one to run checks. Nothing was checked; this is not "0 issues".',
            )}
          </p>
        )}
        {chang === 'deck' && deckSlides !== null && deckSlides.length === 0 && (
          <p style={{ margin: '2px 12px 10px', fontSize: 12, lineHeight: 1.5, color: 'var(--t4)' }}>
            {tr('Hồ sơ đang mở chưa có trang nào — chưa có gì để kiểm.', 'The open deck has no pages yet — nothing to check.')}
          </p>
        )}
        {chang === 'deck' && deckSlides !== null && deckSlides.length > 0 && result.luat.length === 0 && (
          <p style={{ margin: '2px 12px 10px', fontSize: 12, lineHeight: 1.5, color: 'var(--t4)' }}>
            {tr('Không phát hiện vi phạm nào trên hồ sơ đang mở.', 'No violations found in the open deck.')}
          </p>
        )}
        {chang !== 'deck' && result.luat.length === 0 && (
          <p style={{ margin: '2px 12px 10px', fontSize: 12, lineHeight: 1.5, color: 'var(--t4)' }}>
            {tr('Không phát hiện vi phạm nào trên bản vẽ hiện tại.', 'No violations found in the current drawing.')}
          </p>
        )}

        {result.luat.map((f, i) => {
          const t = dungTheLuat(f, cheDo);
          const mauMuc = t.muc === 'do' ? 'var(--danger)' : 'var(--warning)';
          return (
            <div
              key={`${t.ruleId}-${i}`}
              style={{
                position: 'relative', margin: '0 10px 8px', padding: '9px 10px 9px 12px',
                borderRadius: R_THE, border: '1px solid var(--border)', background: 'var(--card)',
              }}
            >
              {/* Vạch mức bên trái — kênh MÀU, đi kèm hình dạng + chữ bên dưới, không đứng một mình. */}
              <span aria-hidden style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: '0 2px 2px 0', background: mauMuc }} />

              {/* Hàng nhãn: HÌNH DẠNG + CHỮ (a11y) · chip trục NGUỒN (chỉ chế độ Đầy đủ) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '1px 7px 1px 5px', borderRadius: R_NHO, border: `1px solid ${mauMuc}`, color: mauMuc, fontSize: 10, lineHeight: 1.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                  <IconMuc hinhDang={t.hinhDang} />
                  {n(t.nhanMuc)}
                </span>
                {cheDo === 'dayDu' && (
                  <span
                    title={t.chipNguon.phanLoaiRoi ? undefined : tr('Bộ luật chưa khai nguồn cho điều khoản này', 'This rule has not declared its source')}
                    /* Cả hai trạng thái đều --t3: "chưa phân loại" bị làm mờ đi thì nó thành chữ
                       trang trí, trong khi đó chính là thông tin người biên tập bộ luật cần thấy.
                       Phân biệt bằng KIỂU VIỀN (liền ↔ đứt), không bằng độ mờ. */
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '1px 7px', borderRadius: R_NHO, border: `1px ${t.chipNguon.phanLoaiRoi ? 'solid' : 'dashed'} var(--border-strong)`, color: 'var(--t3)', fontSize: 10, lineHeight: 1.5, fontWeight: 600 }}
                  >
                    <IconNguon loai={f.loaiNguon} />
                    {n(t.chipNguon.nhan)}
                  </span>
                )}
              </div>

              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--t1)' }}>{t.moTa}</p>
              {/* Số hiệu điều khoản dùng --t3 chứ KHÔNG --t4: đo 16/08, --t4 trên --card chỉ đạt
                  3,44:1 (tối) / 3,04:1 (sáng), trượt WCAG 1.4.3 (cần 4,5:1). Và đây không phải
                  chữ phụ — chính số hiệu làm cho thẻ này là "luật"; đọc không ra là mất luôn
                  thứ phân biệt nó với lớp góp ý. --t3 đạt 6,53 / 5,20. */}
              <p style={{ margin: '4px 0 0', fontSize: 10, lineHeight: 1.5, color: 'var(--t3)', wordBreak: 'break-word', fontVariantNumeric: 'tabular-nums' }}>{t.nguon}</p>

              {/* ── Khối chỉ có ở chế độ ĐẦY ĐỦ ── */}
              {cheDo === 'dayDu' && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
                  <p style={nhanNho}>{tr('Nguyên văn điều khoản', 'Clause text')}</p>
                  <p
                    style={{
                      margin: '0 0 8px', padding: '7px 9px', borderRadius: R_NHO, background: 'var(--field)',
                      borderLeft: `2px ${t.thieuNguyenVan ? 'dashed' : 'solid'} var(--border-strong)`,
                      fontSize: 11, lineHeight: 1.5,
                      // Câu "chưa có nguyên văn" là câu QUAN TRỌNG NHẤT của tính năng này — nó
                      // ngăn người dùng tưởng app đã trích luật cho mình. Làm mờ nó (--t4 trên
                      // --field chỉ 2,69:1 ở theme sáng) là tự bịt cảnh báo của chính mình.
                      color: t.thieuNguyenVan ? 'var(--t3)' : 'var(--t2)',
                      fontStyle: t.thieuNguyenVan ? 'italic' : 'normal',
                    }}
                  >
                    {/* ⛔ Thiếu thì nói THIẾU. Không đắp `moTa`/`nguon` vào đây, không để AI viết thay. */}
                    {t.thieuNguyenVan ? THIEU_NGUYEN_VAN : t.nguyenVan}
                  </p>

                  {t.dongPhu.map((d) => (
                    <p key={d.nhan.en} style={{ margin: '0 0 6px', fontSize: 11, lineHeight: 1.5, color: 'var(--t2)' }}>
                      <b style={{ color: 'var(--t3)', fontWeight: 700 }}>{n(d.nhan)}: </b>
                      {d.giaTri}
                    </p>
                  ))}

                  {t.chuaKiemChung && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 2, padding: '1px 7px', borderRadius: R_NHO, border: '1px solid var(--warning)', color: 'var(--warning)', fontSize: 10, lineHeight: 1.5, fontWeight: 700 }}>
                      <TriangleAlert size={14} strokeWidth={1.5} aria-hidden />
                      {tr('Số liệu chưa đối chiếu bản gốc', 'Figure not checked against source text')}
                    </span>
                  )}

                  {t.canhBaoNhatQuan && (
                    <p style={{ margin: '6px 0 0', fontSize: 10, lineHeight: 1.5, color: 'var(--warning)' }}>
                      {n(t.canhBaoNhatQuan)}
                    </p>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 6, marginTop: 7, flexWrap: 'wrap' }}>
                {t.coNutToiCho && (
                  <button type="button" onClick={() => nhayToi(f)} style={btnNho}>
                    <Crosshair size={14} strokeWidth={1.5} aria-hidden />
                    {tr('Tới chỗ này', 'Go there')}
                  </button>
                )}
                {/* Nhãn là "Cách sửa", KHÔNG phải "Sửa". Nút này nhảy tới chỗ lỗi rồi HIỆN CHỈ
                    DẪN — nó không đụng vào bản vẽ. `checker.ts:5-7` là hiến pháp: *"CHỈ ĐỌC doc
                    và TRẢ VỀ đề xuất, KHÔNG BAO GIỜ tự sửa entity; không có nút tự-sửa nào"*.
                    Nhãn "Sửa" hứa một hành động mà hệ cố ý không có — bấm xong thấy bản vẽ y
                    nguyên thì người dùng nghĩ nút hỏng, chứ không nghĩ mình hiểu sai. */}
                {t.coNutSua && (
                  <button type="button" onClick={() => sua(f)} title={f.cachSua} style={btnNho}>
                    <Wrench size={14} strokeWidth={1.5} aria-hidden />
                    {tr('Cách sửa', 'How to fix')}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* ─── vạch ngăn — hai lớp là hai bản chất, không trộn ─── */}
        <div style={{ height: 1, background: 'var(--border)', margin: '6px 0 0' }} />

        {/* ───────────────── KHỐI GỢI Ý — Magic, không màu cảnh báo, không chặn ───────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px 4px' }}>
          {/* Dấu Magic tím sống ở GLYPH và ở viền đứt của thẻ, KHÔNG ở màu chữ: đo 16/08,
              --accent trên --card chỉ 3,55:1 (theme tối) — trượt WCAG 1.4.3 cho chữ 11-12px.
              Đây là nợ cấp TOKEN (xem báo cáo), ở đây chỉ né đúng chỗ chữ. */}
          <Sparkles size={14} color="var(--accent)" aria-hidden />
          <span style={{ fontSize: 11, lineHeight: 1.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t3)' }}>
            {tr('Gợi ý — Magic, chỉ là ý kiến', 'Suggestions — Magic, opinions only')}
          </span>
        </div>

        {result.gopyBiChan && (
          <p style={{ margin: '2px 12px 12px', fontSize: 12, lineHeight: 1.5, color: 'var(--t4)' }}>{result.gopyBiChan}</p>
        )}
        {goiYConLai.map(({ g, i }: { g: FindingGopy; i: number }) => {
          const t = dungTheGopy(g);
          return (
            // Viền ĐỨT NÉT + không vạch mức — kênh phân biệt thứ tư với thẻ luật.
            <div key={i} style={{ margin: '0 10px 8px', padding: '9px 10px', borderRadius: R_THE, border: '1px dashed color-mix(in srgb, var(--accent) 45%, transparent)', background: 'var(--card)' }}>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--t2)' }}>
                <Sparkles size={14} strokeWidth={1.5} color="var(--accent)" style={{ verticalAlign: '-1px', marginRight: 3 }} aria-hidden />
                <span style={{ fontWeight: 700 }}>{n(t.nhanDau)} · </span>
                {t.moTa}
              </p>
              {t.nguonCongKhai && (
                <p style={{ margin: '4px 0 0', fontSize: 10, lineHeight: 1.5, color: 'var(--t3)' }}>{t.nguonCongKhai}</p>
              )}
              {/* Nói thẳng là không chặn — người dùng khỏi phải đoán xem gợi ý có cản mình không. */}
              <p style={{ margin: '6px 0 0', fontSize: 10, lineHeight: 1.5, color: 'var(--t3)' }}>{n(t.nhanKhongChan)}</p>
              <button type="button" onClick={() => setBoQua((s) => new Set(s).add(i))} style={{ ...btnNho, marginTop: 6 }}>
                {tr('Bỏ qua', 'Dismiss')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Hình dạng mức — kênh phân biệt KHÔNG dựa vào màu (bát giác = bắt buộc · tam giác = khuyến nghị). */
function IconMuc({ hinhDang }: { hinhDang: HinhDangMuc }) {
  if (hinhDang === 'batGiac') return <OctagonAlert size={14} strokeWidth={1.5} aria-hidden />;
  if (hinhDang === 'tamGiac') return <TriangleAlert size={14} strokeWidth={1.5} aria-hidden />;
  return <Sparkles size={14} strokeWidth={1.5} aria-hidden />;
}

/** Icon trục NGUỒN — luôn đi kèm nhãn chữ (NT-8), không bao giờ đứng một mình. */
function IconNguon({ loai }: { loai?: FindingLuat['loaiNguon'] }) {
  if (loai === 'luat') return <Landmark size={14} strokeWidth={1.5} aria-hidden />;
  if (loai === 'tieuChuan') return <Ruler size={14} strokeWidth={1.5} aria-hidden />;
  if (loai === 'xuHuong') return <TrendingUp size={14} strokeWidth={1.5} aria-hidden />;
  return <HelpCircle size={14} strokeWidth={1.5} aria-hidden />;
}

const nhanNho: React.CSSProperties = {
  margin: '0 0 3px', fontSize: 10, lineHeight: 1.5, fontWeight: 700,
  letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t3)', // --t4 trượt 4,5:1
};

const btnNho: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4, height: 24, padding: '0 9px',
  borderRadius: concentricRadius(R_THE, 4), border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t2)',
  fontSize: 11, lineHeight: 1.5, fontWeight: 600, cursor: 'pointer',
};
