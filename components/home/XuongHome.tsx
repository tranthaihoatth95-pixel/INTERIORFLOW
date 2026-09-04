'use client';

/**
 * components/home/XuongHome.tsx — THÂN HOME, bản khoá 04/09.
 *
 * Nguồn sự thật giao diện: `docs/mocks/mock-home-lock-{co-viec,day-du,rong}.html`
 * Hợp đồng thiết kế:        `docs/delivery/DESIGN-LOCK-HOME.md`
 * Bàn giao thi công:        `docs/delivery/HOME-IMPLEMENTATION-SPEC.md`
 *
 * ⭐ CƠ CHẾ — một câu:
 *   THANG CHÚ Ý bốn bậc (NGAY BÂY GIỜ · KỀ BÊN · NỀN · KHI GỌI), trong đó **bậc do TRẠNG THÁI
 *   tính ra** (`lib/home/thang-chu-y.ts`, hàm thuần có test) và **bậc quyết định một vật được
 *   cấp bao nhiêu thân**: một thân đầy đủ · một mặt nhìn · một dòng có số · một con số đếm.
 *
 *   ⇒ Hệ quả sống còn: MẬT ĐỘ TĂNG THÌ VẬT **TỤT BẬC**, KHÔNG ĐÒI THÊM CHỖ. Khung 14 dự án
 *     và khung 3 việc có **hình học y hệt**. Component này KHÔNG được có nhánh nào nới chỗ
 *     theo số lượng — mọi trần nằm ở `xepThang`, không nằm ở JSX.
 *
 * ⭐ BẤT BIẾN KHOÁ (luật ⑤ của bản vẽ): **bỏ hẳn dải môi trường đi thì KHÔNG chữ nào mất đọc**
 *   — chỉ mất không khí. Vì thế: mọi chữ hoặc nằm trên nền APP (`--panel`/`--bg`, dùng
 *   `--t1/--t2/--t3`), hoặc nằm trên nền NỘI DUNG riêng của hiện vật (`--nen-sang`/`--canh-0`).
 *   ĐÚNG HAI nhãn được đặt lên ảnh, và cả hai có **scrim ĐẶC** riêng nên tương phản là HẰNG SỐ
 *   do cấu trúc, không phụ thuộc tấm ảnh. Đừng bao giờ đặt chữ thứ ba thẳng lên dải.
 *
 * ⛔ KHÔNG dựng lại rail và mép trên: `AppShell` đã cấp `RailDieuHuong` + `AppChrome` cho mọi
 *   màn (chốt 16/08 "sidebar là hệ router toàn app"). Khẩu độ Vitals ở mép trên là việc của
 *   lane Vitals (D-DR1) — Home chỉ CHỪA CHỖ.
 *
 * ⛔ Bố cục bento cũ (`DongStudioHome`) SUPERSEDED bởi D-DR2 + N-10. NO-REBUILD §B25 bảo vệ
 *   NĂNG LỰC · HỢP ĐỒNG · DỮ LIỆU, **không** bảo vệ bố cục thị giác lỗi thời. Năng lực được
 *   giữ và dùng lại ở đây: `SystemWallpaper` · `loadResume`/`buildResumeCard`/`resumeHref` ·
 *   `/api/home/summary` (`lib/home/aggregate.ts`) · đường vào dự án.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RawStyle } from '@/components/filemanager/RawStyle';
import SystemWallpaper from '@/components/wallpaper/SystemWallpaper';
import { useFlowStore } from '@/lib/store';
import { loadResume, type ResumeState } from '@/lib/resume';
import { buildResumeCard, resumeHref } from './widgets/resume-card';
import type { HomeSummary } from './widgets/types';
import { xepThang, cauKhiGoi, type VatHome } from '@/lib/home/thang-chu-y';
import {
  boDemo,
  laCanhDemo,
  type BoDuLieuHome,
  type HienVat,
  type NutMach,
  type OWidget,
} from '@/lib/home/xuong-demo';
import { docKe, ghiKe, apDung, doiCho, an as anWidget, hien as hienWidget, type BayKe, KE_RONG } from '@/lib/home/ke-widget-store';
import { HOME_LOCK_CSS } from './home-lock-css';
import { MatVat, kieuMatTuTen, CanhBangVatLieu, KhungPhoiCanh } from './mat-vat';
import { PHASE_MAP, type Phase } from '@/lib/phases';

/* ══════════════════════════ NGUỒN THẬT ══════════════════════════ */

/** Nhãn chặng cho người đọc — đọc từ `lib/phases.ts`, KHÔNG gõ tay (từ điển máy canh chỗ này). */
function nhanChang(p: Phase): string {
  return PHASE_MAP[p]?.label ?? p;
}

/**
 * Dựng danh sách vật từ dữ liệu THẬT. Không có nhánh nào gán bậc — chỉ gán TRẠNG THÁI, còn
 * bậc thì `xepThang` tính. Đó là lý do hàm này không biết gì về "kề bên" hay "nền".
 */
function vatTuThat(s: HomeSummary | null, resumeId: string | null): VatHome[] {
  if (!s) return [];
  const out: VatHome[] = [];
  const nay = Date.now();

  // Dự án gần đây → CẦN TÔI (người dùng vừa sờ tới, và nó chờ chính người dùng làm tiếp).
  s.recentProjects.forEach((p, i) => {
    if (p.id === resumeId) return; // vật đang dở đã là bậc 1, không đứng hai chỗ
    const mo = s.openTasksByProject[p.id] ?? 0;
    out.push({
      id: `p:${p.id}`,
      ten: p.name,
      loai: 'du-an',
      trangThai: 'can-toi',
      // recentProjects đã xếp sẵn theo Flow.updatedAt giảm dần ⇒ giữ đúng thứ tự đó.
      lucCuoi: nay - i * 60_000,
      soSong: mo > 0 ? `${mo} việc mở` : 'chưa có việc mở',
      href: `/projects/${encodeURIComponent(p.id)}/overview`,
    });
  });

  // Việc sắp tới → ĐANG CHỜ. Có ngày đến hạn thì nói bằng SỐ NGÀY, không có thì im lặng.
  for (const ngay of s.upcoming) {
    for (const t of ngay.items) {
      const han = t.dueAt ? new Date(t.dueAt).getTime() : NaN;
      const conLai = Number.isNaN(han) ? null : Math.max(0, Math.ceil((han - nay) / 86_400_000));
      out.push({
        id: `t:${t.id}`,
        ten: t.projectName ? `${t.title} · ${t.projectName}` : t.title,
        loai: 'viec',
        trangThai: 'dang-cho',
        lucCuoi: Number.isNaN(han) ? nay - 86_400_000 : han,
        soSong: conLai === null ? undefined : conLai === 0 ? 'hôm nay' : `${conLai} ngày`,
        href: `/projects/${encodeURIComponent(t.projectId)}/overview`,
      });
    }
  }
  return out;
}

/** Widget bậc KHI GỌI dựng từ số THẬT. Thiếu nguồn thì KHÔNG dựng ô — không độn chữ cho đầy. */
function widgetTuThat(s: HomeSummary | null): OWidget[] {
  if (!s) return [];
  const w: OWidget[] = [];
  const tongViec = s.stageChart.reduce((a, c) => a + c.openTasks, 0);
  const tongDuAn = s.stageChart.reduce((a, c) => a + c.projects, 0);
  if (tongDuAn > 0) w.push({ nh: 'dự án trong xưởng', gt: String(tongDuAn), kem: `${tongViec} việc mở`, rong2: true });
  if (s.today.tasksDoneToday > 0) w.push({ nh: 'xong hôm nay', gt: String(s.today.tasksDoneToday) });
  if (s.today.online.length > 0) w.push({ nh: 'đang trong xưởng', gt: String(s.today.online.length) });
  return w;
}

/* ══════════════════════════ CÁC BẬC ══════════════════════════ */

/** BẬC 1 — THÂN DUY NHẤT trên màn. Nền của nó là nền NỘI DUNG, nên mọi chữ trong nó máy đo được. */
function BacMotThan({ v, onMo }: { v: HienVat; onMo?: () => void }) {
  const than = v.than;
  const pct = typeof v.tienDo === 'number' ? Math.round(v.tienDo * 100) : null;
  return (
    <section className={`vat len-bac ${v.nen}`} aria-label={v.ten}>
      <div className="vat-dau">
        <span className={`dau ${v.dau}`} aria-hidden="true" />
        <span className="ten">{v.ten}</span>
        <span className="kem">{v.kem}</span>
        {v.chip && (
          <span className="cuoi">
            <span className={v.nen === 'sang' ? 'chip-sang' : 'chip-toi'}>{v.chip}</span>
          </span>
        )}
      </div>

      <div className="vat-than">
        {than.kieu === 'bang-vat-lieu' && (
          <>
            <div className="bang-vl">
              {than.hang.map((h) => (
                <div className="hang-vl" key={h.ma}>
                  <i className="o" style={{ background: h.mau }} aria-hidden="true" />
                  <span className="ten">{h.ten}</span>
                  <span className="ma">{h.ma}</span>
                  {/* ⭐ HỢP ĐỒNG THẬT: thiếu số đo thì "— m · chưa đo được". Luật BOQ 15/08 —
                      chỉ nhận số ĐO ĐƯỢC; ước tính cho đầy bảng là dối, không phải tiện. */}
                  <span className="dm so">{h.dienTich ?? '— m'}</span>
                  <span className="ng">{h.dienTich ? 'đo từ khối 3D' : 'chưa đo được'}</span>
                </div>
              ))}
              <div className="hang-vl">
                <span className="ma">{than.conLai}</span>
              </div>
            </div>
            <CanhBangVatLieu ma={than.hang[0]?.ma ?? ''} boMau={than.boHoanThien} />
          </>
        )}

        {than.kieu === 'khung-anh' && (
          <>
            <KhungPhoiCanh />
            <div className="canh-so">
              <span className="tit">mẻ này gồm gì</span>
              {than.thongSo.map((t) => (
                <div className="ts" key={t.n}>
                  <span className="n">{t.n}</span>
                  <span className="v so">{t.v}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {than.kieu === 'bat-dau' && (
          <>
            <div className="moi">
              <h2>Dựng dự án đầu tiên của bạn</h2>
              <p>
                Khai vị trí công trình là đủ để IF gợi ngay bộ quy chuẩn áp dụng, khí hậu và vật liệu sẵn có
                tại đó. Vẽ 2D, dựng 3D hay dán ảnh tham chiếu — vào cửa nào cũng được, không cửa nào bị khoá.
              </p>
              <div className="loi-vao">
                <button type="button" className="nut-chinh" onClick={onMo}>
                  Tạo dự án mới
                </button>
                <button type="button" className="nut-phu" onClick={onMo}>
                  Mở dự án có sẵn
                </button>
                <button type="button" className="nut-phu" onClick={onMo}>
                  Nhập từ tệp · dwg · pdf · ảnh
                </button>
              </div>
              <span className="loi-ba">
                Chưa muốn bắt đầu? Xem thư viện mẫu hồ sơ và kho vật liệu ở cột bên.
              </span>
            </div>
            <div className="von">
              <span className="tit">xưởng này đã có sẵn</span>
              <div className="dai-mau" aria-hidden="true">
                {than.daiMau.map((c, i) => (
                  <i key={i} style={{ background: c }} />
                ))}
              </div>
              {than.von.map((h) => (
                <div className="von-hang" key={h.n}>
                  <span className="n">{h.n}</span>
                  <span className="v so">{h.v}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {than.kieu === 'tom-tat' && (
          <div className="bang-vl">
            {than.hang.map((h) => (
              <div className="hang-vl" key={h.n}>
                <span className="ten">{h.n}</span>
                <span className="dm so">{h.v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="vat-chan">
        {/* Thanh tiến trình CHỈ dựng khi tiến trình ĐO ĐƯỢC. Không đo được thì không vạch,
            không con số, không aria-valuenow — cùng luật với union `lib/ui/tien-trinh.ts`. */}
        {pct !== null && (
          <span
            className="vach-tt"
            style={{ width: 190 }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Tiến trình · ${v.ten}`}
          >
            <i style={{ width: `${pct}%` }} />
          </span>
        )}
        {v.chan.map((c, i) => (
          <span key={i}>
            <b className="so">{c.manh}</b>
            {c.nhe ? ` ${c.nhe}` : ''}
          </span>
        ))}
        <span className="day2">{v.chanCuoi}</span>
      </div>
    </section>
  );
}

/** DẢI NGỮ CẢNH — CHUỖI THỜI GIAN của chính bậc 1, không phải danh sách thứ phụ ép hàng ngang (§24). */
function DaiNguCanh({ tit, chip, mach }: { tit: string; chip: string; mach: NutMach[] }) {
  return (
    <section className="ngu-canh len-bac" aria-label="Ngữ cảnh của việc đang dở">
      <div className="nc-dau">
        <span className="nhan">{tit}</span>
        <span className="ke2" aria-hidden="true" />
        <span className="chip">{chip}</span>
      </div>
      <div className="mach">
        {mach.map((n) => (
          <div className={`nut-mach${n.cho ? ' cho' : ''}`} key={n.khi + n.cai}>
            <span className="khi">{n.khi}</span>
            <span className="cai">{n.cai}</span>
            <span className="no">{n.no}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════ THÂN CHÍNH ══════════════════════════ */

export default function XuongHome({ onEnter }: { onEnter: () => void }) {
  const router = useRouter();
  const params = useSearchParams();
  const user = useFlowStore((s) => s.user);
  const currentProjectId = useFlowStore((s) => s.currentProjectId);
  const userId = user?.id ?? null;

  const canhDemo = laCanhDemo(params?.get('demo'));
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [daHoi, setDaHoi] = useState(false);
  const [resume, setResume] = useState<ResumeState | null>(null);
  const [khoHep, setKhoHep] = useState(false);

  /* ---------- dữ liệu thật ---------- */
  useEffect(() => {
    if (canhDemo) {
      setDaHoi(true);
      return;
    }
    let huy = false;
    fetch('/api/home/summary')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (huy) return;
        if (j) setSummary(j as HomeSummary);
        setDaHoi(true);
      })
      .catch(() => {
        // ⛔ KHÔNG rơi về bộ demo khi API lỗi. Bịa một xưởng đầy việc lên màn người dùng là
        //    dối, không phải "đỡ trống" — Home nói thẳng là chưa đọc được.
        if (!huy) setDaHoi(true);
      });
    return () => {
      huy = true;
    };
  }, [canhDemo]);

  useEffect(() => {
    setResume(userId ? loadResume(userId) : null);
  }, [userId]);

  /* ---------- khổ hẹp: đổi SỐ NGƯỜI trên bậc, không đổi hệ (bản khoá §6) ---------- */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1400px)');
    const doc = () => setKhoHep(mq.matches);
    doc();
    mq.addEventListener('change', doc);
    return () => mq.removeEventListener('change', doc);
  }, []);

  /* ---------- kệ widget — CÁCH BÀY TRÊN MÀN CỦA TÔI ⇒ lưu theo MÁY (luật chung↔máy) ---------- */
  const [bay, setBay] = useState<BayKe>(KE_RONG);
  useEffect(() => {
    setBay(docKe(userId));
  }, [userId]);
  const luu = useCallback(
    (b: BayKe) => {
      setBay(b);
      ghiKe(userId, b); // GHI XUỐNG ngay tại thao tác — không đợi rời trang (luật PASS)
    },
    [userId],
  );

  /* ---------- dựng bộ dữ liệu ---------- */
  const the = useMemo(() => buildResumeCard(resume, {
    recentProjects: summary?.recentProjects ?? [],
    currentProjectId,
  }), [resume, summary, currentProjectId]);

  const bo: BoDuLieuHome | null = useMemo(() => {
    if (canhDemo) return boDemo(canhDemo);
    if (!daHoi) return null;

    const vat = vatTuThat(summary, the?.routeId ?? null);
    const coGi = vat.length > 0 || the !== null;
    if (!coGi) return { ...boDemo('rong'), vat: [], widget: [], nhanDaiTrai: null, nhanDaiPhai: null };

    const hienVat: HienVat = the
      ? {
          nen: 'sang',
          dau: 'cho',
          ten: the.projectName ?? 'Việc đang dở',
          kem:
            the.daysAgo === null
              ? `bạn đang ở chặng ${nhanChang(the.stage)}`
              : the.daysAgo === 0
                ? `bạn rời khỏi hôm nay · chặng ${nhanChang(the.stage)}`
                : `bạn rời khỏi ${the.daysAgo} ngày trước · chặng ${nhanChang(the.stage)}`,
          chip: 'mở lại chỗ cũ',
          than: {
            kieu: 'tom-tat',
            hang: [
              { n: 'Chặng đang dở', v: nhanChang(the.stage) },
              { n: 'Việc mở trong dự án', v: String(summary?.openTasksByProject[the.routeId ?? ''] ?? 0) },
              { n: 'Việc đến hạn hôm nay', v: String(summary?.greeting.dueTodayCount ?? 0) },
              { n: 'Dự án trong xưởng', v: String(summary?.stageChart.reduce((a, c) => a + c.projects, 0) ?? 0) },
            ],
          },
          chan: [
            { manh: String(summary?.today.tasksDoneToday ?? 0), nhe: 'việc xong hôm nay' },
            { manh: String(summary?.today.online.length ?? 0), nhe: 'người đang trong xưởng' },
          ],
          chanCuoi: 'bấm để về đúng chỗ bạn rời đi',
          href: resumeHref(the),
        }
      : {
          nen: 'sang',
          dau: 'cho',
          ten: 'Chọn việc để bắt đầu',
          kem: 'chưa có việc nào đang dở trên máy này',
          chip: `${vat.length} thứ đang chờ`,
          than: {
            kieu: 'tom-tat',
            hang: [
              { n: 'Dự án trong xưởng', v: String(summary?.stageChart.reduce((a, c) => a + c.projects, 0) ?? 0) },
              { n: 'Việc mở', v: String(summary?.stageChart.reduce((a, c) => a + c.openTasks, 0) ?? 0) },
              { n: 'Đến hạn hôm nay', v: String(summary?.greeting.dueTodayCount ?? 0) },
            ],
          },
          chan: [{ manh: String(vat.length), nhe: 'thứ đang chờ bạn' }],
          chanCuoi: 'chọn một dự án ở cột bên để vào việc',
        };

    return {
      nhanDaiTrai: null,
      nhanDaiPhai: null,
      hienVat,
      nguCanhTit: 'việc này đi từ đâu tới',
      nguCanhChip: 'một nguồn — ba chặng soi vào',
      mach: [
        { khi: 'bước 1', cai: 'Vị trí và đề bài', no: 'một biến kéo theo cả bộ quy chuẩn áp dụng' },
        { khi: 'bước 2', cai: 'Ý tưởng và thẻ DNA', no: 'moodboard · ảnh tham chiếu · quyết định có nguồn' },
        { khi: 'bước 3', cai: 'Bản vẽ · khối · phối cảnh', no: 'ba chặng soi vào cùng một nguồn' },
        { khi: 'bước 4', cai: 'Hồ sơ giao khách', no: 'con số trong hồ sơ truy được về khối đã dựng', cho: true },
      ],
      vat,
      tenBacKeBen: 'kề bên',
      tenBacNen: 'nền',
      widget: widgetTuThat(summary),
    };
  }, [canhDemo, daHoi, summary, the]);

  const thang = useMemo(() => xepThang(bo?.vat ?? [], khoHep), [bo, khoHep]);
  const cauGoi = cauKhiGoi(thang.khiGoi);

  const keWidget = useMemo(() => {
    const co = (bo?.widget ?? []).map((w, i) => ({ ...w, id: `${w.nh}#${i}` }));
    return apDung(co, bay);
  }, [bo, bay]);

  const moVat = useCallback(() => {
    const h = bo?.hienVat.href;
    if (h) router.push(h);
    else onEnter();
  }, [bo, router, onEnter]);

  const moThu = useCallback(
    (v: VatHome) => {
      if (!v.href || v.href === '#') return;
      router.push(v.href);
    },
    [router],
  );

  if (!bo) {
    // Chưa đọc xong — KHÔNG dựng khung giả rồi thay số sau (nhảy bố cục là lỗi, không phải hiệu ứng).
    return (
      <>
        <RawStyle css={HOME_LOCK_CSS} />
        <div className="xuong-home">
          <main className="san">
            <div className="dai" aria-hidden="true">
              <SystemWallpaper />
            </div>
            <section className="vat sang" aria-label="Đang đọc xưởng">
              <div className="vat-dau">
                <span className="dau cho" aria-hidden="true" />
                <span className="ten">Đang đọc xưởng…</span>
              </div>
              <div className="vat-than" />
            </section>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <RawStyle css={HOME_LOCK_CSS} />
      <div className="xuong-home">
        {/* ══════════════ SÂN ══════════════ */}
        <main className="san">
          {/* DẢI MÔI TRƯỜNG — `SystemWallpaper` (5 bộ nền sinh bằng mã, đổi ánh sáng theo giờ,
              chậm dần rồi DỪNG HẲN). Bản khoá đổi nó từ NỀN TOÀN MÀN sang DẢI CÓ BIÊN + tan
              dần ở đáy: nhờ có biên nên nền sáng vẫn đọc ra là nền sáng — đúng chỗ H1 hỏng. */}
          <div className="dai" aria-hidden="true">
            <SystemWallpaper />
          </div>
          {/* ĐÚNG HAI nhãn được đặt lên ảnh, mỗi nhãn một scrim ĐẶC riêng. Đừng thêm cái thứ ba. */}
          {bo.nhanDaiTrai && (
            <div className="nhan-dai trai">
              <b>{bo.nhanDaiTrai.manh}</b>
              <span>{bo.nhanDaiTrai.nhe}</span>
            </div>
          )}
          {bo.nhanDaiPhai && (
            <div className="nhan-dai phai">
              <span>{bo.nhanDaiPhai}</span>
            </div>
          )}

          <BacMotThan v={bo.hienVat} onMo={moVat} />
          <DaiNguCanh tit={bo.nguCanhTit} chip={bo.nguCanhChip} mach={bo.mach} />
        </main>

        {/* ══════════════ THANG CHÚ Ý ══════════════ */}
        <aside className="thang" aria-label="Thang chú ý">
          {/* ── BẬC 2 · KỀ BÊN — một MẶT NHÌN, nhận ra bằng mắt ── */}
          {thang.keBen.length > 0 && (
            <>
              <div className="muc">
                <span className="nhan">{bo.tenBacKeBen}</span>
                <span className="ke2" aria-hidden="true" />
                <span className="dem so">{thang.keBen.length}</span>
              </div>
              {thang.keBen.map((v) => {
                const kieu = kieuMatTuTen(v.ten);
                return (
                  <button type="button" className="ke-ben len-bac" key={v.id} onClick={() => moThu(v)}>
                    <MatVat kieu={kieu} khoa={v.id} />
                    <span className="chu">
                      <span className="ten">{v.ten}</span>
                      {v.soSong && <span className="con-so so">{v.soSong}</span>}
                      <span className="khi">
                        {v.loai === 'du-an' ? 'dự án' : v.loai === 'viec' ? 'việc' : 'vật'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </>
          )}

          {/* ── BẬC 3 · NỀN — một DÒNG có số, không tranh chỗ ── */}
          {thang.nen.length > 0 && (
            <>
              <div className="muc" style={{ marginTop: 18 }}>
                <span className="nhan">{bo.tenBacNen}</span>
                <span className="ke2" aria-hidden="true" />
                <span className="dem so">{thang.nen.length}</span>
              </div>
              {thang.nen.map((v) => {
                const pct = typeof v.tienDo === 'number' ? Math.round(v.tienDo * 100) : null;
                const dau = v.trangThai === 'lech' ? 'lech' : v.trangThai === 'dang-chay' ? 'chay' : 'cho';
                // Dấu có HÌNH DẠNG riêng (tròn/vuông bo/tam giác) nên màu không là kênh duy nhất;
                // và nhãn chữ nằm ngay trong aria-label, không phụ thuộc màu.
                const nhan = v.trangThai === 'lech' ? 'lệch chuẩn' : v.trangThai === 'dang-chay' ? 'đang chạy' : 'đang chờ';
                return (
                  <div className="o-nen" key={v.id}>
                    <span className={`dau ${dau}`} role="img" aria-label={nhan} />
                    <span className="ten">{v.ten}</span>
                    {pct !== null && (
                      <span
                        className="vach-tt"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Tiến trình · ${v.ten}`}
                      >
                        <i style={{ width: `${pct}%` }} />
                      </span>
                    )}
                    {v.soSong && <span className="num so">{v.soSong}</span>}
                  </div>
                );
              })}
            </>
          )}

          {/* ── BẬC 4 · KHI GỌI — tụt khỏi màn nhưng vẫn phải NÓI RA nó còn đó (§30) ── */}
          {cauGoi && (
            <button type="button" className="khi-goi" onClick={() => router.push('/tasks')}>
              <span>{cauGoi}</span>
              <span className="vach-mo" aria-hidden="true" />
              <span className="so">gọi ra</span>
            </button>
          )}

          {/* ── KỆ WIDGET — thứ TÔI tự đặt và hiện đang lặng. Bày lại được BẰNG BÀN PHÍM. ── */}
          {(keWidget.tren.length > 0 || keWidget.daAn.length > 0) && (
            <>
              <div className="muc">
                <span className="nhan">tôi tự đặt</span>
                <span className="ke2" aria-hidden="true" />
                <span className="dem so">{keWidget.tren.length}</span>
              </div>
              <div className="ke-widget">
                {keWidget.tren.map((w) => (
                  <div className={`o-w ${w.rong2 ? 'w2' : 'w1'}`} key={w.id}>
                    <span className="nh">{w.nh}</span>
                    <span className="gt so">
                      {w.gt}
                      {w.kem && <small> {w.kem}</small>}
                    </span>
                    {/* Bày lại bằng BÀN PHÍM — kéo thả không được là kênh duy nhất (bản khoá §8).
                        Cỡ ô ĐỊNH SẴN 1×1 / 2×1, không có tay nắm kéo giãn tự do. */}
                    <span className="o-w-tay">
                      <button
                        type="button"
                        aria-label={`Dời “${w.nh}” sang trái`}
                        onClick={() => luu(doiCho(bay, w.id, -1, keWidget.tren.map((x) => x.id)))}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        aria-label={`Dời “${w.nh}” sang phải`}
                        onClick={() => luu(doiCho(bay, w.id, 1, keWidget.tren.map((x) => x.id)))}
                      >
                        ›
                      </button>
                      <button
                        type="button"
                        aria-label={`Cất “${w.nh}” khỏi kệ`}
                        onClick={() => luu(anWidget(bay, w.id, keWidget.tren.map((x) => x.id)))}
                      >
                        ✕
                      </button>
                    </span>
                  </div>
                ))}
              </div>
              {/* Đã cất thì KHÔNG mất — nó tụt xuống đây và được ĐẾM, gọi ra lại được (§30). */}
              {keWidget.daAn.length > 0 && (
                <button
                  type="button"
                  className="khi-goi"
                  onClick={() => luu(hienWidget(bay, keWidget.daAn[0].id, keWidget.tren.map((x) => x.id)))}
                >
                  <span>đã cất {keWidget.daAn.length} ô khỏi kệ</span>
                  <span className="vach-mo" aria-hidden="true" />
                  <span className="so">gọi ra</span>
                </button>
              )}
            </>
          )}

          <div className="dan" />

          {/* Nhãn DEMO — §28: dùng dữ liệu mẫu thì PHẢI ghi rõ trên màn. Chỉ gỡ khi dữ liệu
              đã thật, và gỡ là một thay đổi phải nêu trong báo cáo. */}
          {canhDemo && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
              <span className="the-demo">demo · dữ liệu mẫu</span>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
