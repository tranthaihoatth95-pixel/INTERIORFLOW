'use client';

/**
 * components/present-editor/CongThietLapTrang.tsx — CỬA nhận tờ từ 2D/3D và mở Thiết lập trang.
 *
 * Vai: nhận tờ qua cầu `lib/present-editor/to-ban-ve.ts` (consume-once, cùng pattern handoff.ts),
 * giữ tờ trong state của chặng Trình chiếu, và bày nút mở panel `ThietLapTrang`.
 *
 * ⭐ LUẬT NỀN THI HÀNH Ở ĐÂY: **2D/3D SÁNG TÁC NỘI DUNG · TRÌNH CHIẾU DÀN TRANG VÀ PHÁT HÀNH.**
 * Tờ đi qua cầu `to-ban-ve.ts` mang theo **tỉ lệ · khổ · lề · khung tên · neo nguồn** — KHÔNG
 * phải một tấm ảnh.
 *
 * ⛔ §HAI ĐƯỜNG — phân biệt cho phiên sau khỏi gộp nhầm:
 *   · ĐƯỜNG ẢNH  `interiorflow.cadPresentHandoff`  → PresentEditor chèn MỘT SLIDE ảnh vào deck.
 *     Đầu ra là NỘI DUNG trong deck; sửa xong là hết dây, không biết nguồn đổi.
 *   · ĐƯỜNG TỜ   `interiorflow.toBanVeHandoff`     → component NÀY giữ, không chèn slide nào.
 *     Đầu ra là MỘT TỜ có neo nguồn; nguồn đổi thì tờ tự đánh dấu "Có bản mới".
 *   Hai khoá riêng, hai kho riêng, hai bề mặt riêng ⇒ bấm "Đưa sang Present" (ảnh) và bấm
 *   "Gửi sang Trình chiếu" (tờ) trong cùng một phiên KHÔNG giẫm nhau.
 *
 * 🔴 VIỆC 7 — NGUỒN ĐỔI KHÔNG TỰ SỬA ĐẦU RA: component này CHỈ ĐỌC sổ dấu vết (`docDauVetNguon`)
 * để tính trạng thái và ĐÁNH DẤU. Không có nhánh nào tự ghi lại tờ khi nguồn đổi — người bấm
 * "Cập nhật" thì mới cập nhật, và tờ ĐÃ PHÁT HÀNH thì nút đó mờ hẳn (`coTheTuCapNhat`).
 *
 * Chưa có tờ nào ⇒ trả `null`: không bày cửa rỗng ở chặng Trình chiếu khi chưa ai gửi gì (luật
 * §9 — ô trống là bằng chứng còn việc, nhưng cửa KHÔNG DẪN ĐI ĐÂU thì đừng bày).
 */

import { useEffect, useRef, useState } from 'react';
import { FileText, ArrowLeft } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { getLastUserId, saveResume } from '@/lib/resume';
import { loadSheets, saveSheets, clearSheets, type PersistedSheet } from '@/lib/sheets-persist';
import ThietLapTrang from './ThietLapTrang';
import ThietLapTrangDayDu, { type KhaNang } from './ThietLapTrangDayDu';
import {
  nhanToTuChang,
  docDauVetNguon,
  trangThaiNguon,
  coTheTuCapNhat,
  nhanTyLe,
  NHAN_TRANG_THAI,
  type ToBanVe,
  type LoiXuNguonDoi,
} from '@/lib/present-editor/to-ban-ve';

/**
 * Năng lực THẬT của đường xuất đang nối ở chặng Trình chiếu (đo 20/08 tại nguồn).
 * Mục nào là chuỗi = CHƯA làm được ⇒ panel bày mờ kèm đúng lý do này. Cấm đổi thành `false`
 * (nghĩa là "có thật") trước khi thực sự nối được đường chạy.
 */
const KHA_NANG: KhaNang = {
  bangNetIn: false, // có thật: components/print/LineweightTable.tsx
  khoTuyChinh: 'Đường xuất hiện chỉ dựng được khổ ISO A0–A4 — khổ tự do chưa có trong engine PDF.',
  tranLe: 'Engine PDF hiện cắt đúng mép khổ, chưa có vùng tràn lề để nhà in xén.',
  luoiDuongDan: 'Lưới và đường dẫn mới có trong khung dàn trang, chưa đưa được vào file xuất.',
  vungIn: 'Chưa có cách khoanh vùng in riêng — hiện luôn xuất trọn tờ.',
  mauInHoacXam: 'Engine PDF xuất đúng màu tài liệu; chưa có đường chuyển xám/đơn sắc lúc xuất.',
  vectorHoacRaster: 'Chưa cho chọn: PDF theo tờ luôn xuất vector, bản 300dpi luôn xuất raster.',
  dpi: 'DPI hiện gắn cứng theo lối xuất đã chọn (bản in 300dpi), chưa tách thành núm riêng.',
  mayIn: 'App chưa nói chuyện với máy in/máy vẽ — hiện chỉ xuất ra file để bạn tự in.',
  daiTrang: 'Chưa chọn được dải trang — hiện chỉ có "cả bộ" hoặc "tờ đang mở".',
  soBan: 'Số bản là việc của hộp in hệ điều hành, app chưa cầm được khâu này.',
};

/**
 * Tờ đã nhận trong phiên này, giữ ở mức module.
 *
 * 🐛 Bug thật bắt được lúc nghiệm thu 20/08: cầu là CONSUME-ONCE, mà chặng Trình chiếu dựng
 * component này hai lần (StrictMode chạy effect → dọn → chạy lại; và `PresentEditor` còn remount
 * THẬT khi đổi `key={activeId}` hoặc khi người dùng tạt sang màn BOQ rồi quay lại). Lần dựng thứ
 * nhất tiêu thụ mất tờ rồi bị vứt; lần sau gọi vào cầu thì đã rỗng ⇒ tờ vừa gửi BIẾN MẤT, nút
 * "Thiết lập trang" không bao giờ hiện. Biến này sống ngoài vòng đời component nên
 * lần dựng thứ hai nhặt lại đúng tờ đó. (Cùng họ bẫy với fallback bộ nhớ của `handoff.ts`.)
 */
let toDaNhan: ToBanVe | null = null;

/**
 * BẢN LƯU TỜ ĐÃ NHẬN (21/08 · **mở rộng 06/09**) — vá lỗi cùng họ với vụ mất deck.
 * TRƯỚC 21/08: tờ gửi từ 2D chỉ sống ở biến module `toDaNhan` ⇒ TẢI LẠI TRANG là mất sạch — chip
 * "Thiết lập trang" lẫn nút "Quay lại 2D" biến mất, người dùng phải sang 2D gửi lại.
 *
 * 🔴 LỖ ĐO ĐƯỢC 06/09 (vòng nghề thật, `scripts/nghiem-thu-ban-lam-viec/luong-trinh-chieu.mjs`
 * mắt xích **M6b**): bản 21/08 soi gương xuống `sessionStorage` ⇒ tờ sống qua F5 nhưng **CHẾT khi
 * đóng hẳn trình duyệt**. Chạy trọn vòng nghề thì hỏng đúng chỗ đắt nhất: gửi tờ → tắt máy → hôm
 * sau sửa bản vẽ → quay lại Trình chiếu thì **không còn tờ nào để đánh dấu "Có bản mới"**, và
 * không một lời nào nói vì sao. Ba mắt xích cuối của vòng (thấy tác động · người xác nhận lại ·
 * phát hành) đứt theo. Đo thật: M6b/M8/M9 KHÔNG ĐẠT trước lượt vá này.
 *
 * NAY — HAI TẦNG, KHÔNG ĐẺ CƠ CHẾ THỨ BA:
 *  · `sessionStorage` GIỮ NGUYÊN làm tầng NHANH (đọc đồng bộ ngay lúc dựng ⇒ không nháy chip,
 *    và đỡ đúng ca StrictMode dựng hai lần mà cầu là consume-once).
 *  · **IndexedDB qua `lib/sheets-persist.ts`** làm tầng BỀN — CHÍNH cỗ máy deck Present đang dùng
 *    (`userId::route::projectId`), lý do chọn nó đã ghi sẵn ở đầu tệp đó: *"deck Present có thể
 *    chứa ảnh dataURL hàng MB — localStorage trần ~5MB là vỡ; IDB trần theo đĩa"*. Tờ mang `anh`
 *    xem trước ~1400px nên rơi đúng vào lý lẽ ấy ⇒ localStorage là đường SAI, IDB là đường ĐÚNG.
 *
 * ⚖️ VÌ SAO TỜ ĐÁNG ĐƯỢC LƯU BỀN (không phải chuyện tiện tay): luật lưu **CHUNG ↔ MÁY** (Hoà chốt
 * 16/08) xếp *"cách bày trên màn"* vào máy, còn **VẬT** và **CẤU TRÚC VIỆC** thì lưu chung. Một tờ
 * mang **khổ giấy · tỉ lệ · lề · khung tên · neo nguồn** — đó là QUYẾT ĐỊNH HỒ SƠ, không phải
 * cách bày. Chú thích 21/08 xếp nó là *"ngữ cảnh của MỘT phiên làm việc"* — chỗ đó đọc sai bản
 * chất của tờ, và vòng nghề đã trả giá bằng ba mắt xích đứt.
 *
 * Hỏng/hết hạn mức ở CẢ HAI tầng thì im lặng bỏ qua: đây là tiện nghi, không được phép làm gãy
 * editor (cùng luật `sheets-persist`).
 */
const KHOA_TO = 'interiorflow.toBanVe.';
function khoaTo(): string {
  const m = /\/projects\/([^/]+)/.exec(typeof location === 'undefined' ? '' : location.pathname);
  return KHOA_TO + (m?.[1] ?? 'chung');
}
function docToDaLuu(): ToBanVe | null {
  try {
    const raw = sessionStorage.getItem(khoaTo());
    return raw ? (JSON.parse(raw) as ToBanVe) : null;
  } catch {
    return null;
  }
}
function ghiToDaLuu(t: ToBanVe | null): void {
  try {
    if (t) sessionStorage.setItem(khoaTo(), JSON.stringify(t));
    else sessionStorage.removeItem(khoaTo());
  } catch {
    /* hết hạn mức / chế độ riêng tư — bỏ qua, tờ vẫn sống trong phiên qua biến module */
  }
  void ghiToVaoIdb(t);
}

/* ── TẦNG BỀN: IndexedDB, dùng LẠI `sheets-persist` (không mở kho thứ hai) ─────────────── */

/** Route riêng của tờ trong kho chung — tách khỏi `/present-editor` (deck) để hai thứ không đè
 *  nhau, nhưng vẫn CÙNG một `objectStore`, cùng luật khoá `userId::route::projectId`. */
const ROUTE_TO = '/present-to-ban-ve' as const;

/** Dự án đang mở, đọc từ chính đường đang đứng — cùng nguồn `khoaTo()` đã dùng. */
function duAnHienTai(): string {
  return /\/projects\/([^/]+)/.exec(typeof location === 'undefined' ? '' : location.pathname)?.[1] ?? '';
}

/** `ToBanVe` mặc `PersistedSheet` (đòi `id` + `name`) mà không đổi hình hài của chính nó. */
interface ToDaLuu extends PersistedSheet {
  to: ToBanVe;
}

async function ghiToVaoIdb(t: ToBanVe | null): Promise<void> {
  const uid = getLastUserId();
  const pid = duAnHienTai();
  if (!uid || !pid) return;
  try {
    if (!t) {
      await clearSheets(uid, ROUTE_TO, pid);
      return;
    }
    const ban: ToDaLuu = { id: t.id, name: t.nhan, to: t };
    await saveSheets(uid, ROUTE_TO, { v: 1, activeId: t.id, sheets: [ban], ts: Date.now() }, pid);
  } catch {
    /* IDB hỏng/đầy — tờ vẫn sống trong phiên qua sessionStorage + biến module */
  }
}

async function docToTuIdb(): Promise<ToBanVe | null> {
  const uid = getLastUserId();
  const pid = duAnHienTai();
  if (!uid || !pid) return null;
  try {
    const rec = await loadSheets<ToDaLuu>(uid, ROUTE_TO, pid);
    const t = rec?.sheets?.[0]?.to;
    return t && typeof t.id === 'string' ? t : null;
  } catch {
    return null;
  }
}

export default function CongThietLapTrang({ onMoBangNet }: { onMoBangNet?: () => void }) {
  const [to, setTo] = useState<ToBanVe | null>(toDaNhan);
  const router = useRouter();
  const pathname = usePathname();
  const [mo, setMo] = useState(false);
  // Hai bề mặt, HAI vai — không phải một panel to/nhỏ. `mo` = inspector NHANH bên cạnh;
  // `dayDu` = chế độ toàn không gian làm việc. Mở đầy đủ thì thu NHANH lại: hai bề mặt cùng
  // nói về một tờ, bày cả hai là nói hai lần.
  const [dayDu, setDayDu] = useState(false);
  const nutRef = useRef<HTMLButtonElement | null>(null);

  // Consume-ONCE ngay khi chặng Trình chiếu dựng xong. Không có tờ ⇒ y hệt trước, không đổi gì.
  useEffect(() => {
    const nhan = nhanToTuChang();
    if (nhan.length) {
      toDaNhan = nhan[0];
      setTo(nhan[0]);
      setMo(true); // vừa gửi sang thì mở luôn — người dùng đang ở giữa một việc
      ghiToDaLuu(nhan[0]);
    } else if (toDaNhan) {
      setTo(toDaNhan); // lần dựng thứ hai của StrictMode — nhặt lại tờ lần đầu đã tiêu thụ
    } else {
      // Không có tờ mới VÀ biến module trống ⇒ đây là lần TẢI LẠI TRANG. Nhặt bản đã lưu.
      const cu = docToDaLuu();
      if (cu) {
        toDaNhan = cu;
        setTo(cu);
      } else {
        // sessionStorage cũng trống ⇒ đây là PHIÊN TRÌNH DUYỆT MỚI (đã đóng hẳn rồi mở lại).
        // Tầng bền IDB là nơi duy nhất còn tờ. Bất đồng bộ nên đặt sau cùng: hai tầng trên đã
        // trả lời được thì không đụng tới đĩa.
        let song = true;
        void docToTuIdb().then((ben) => {
          if (!song || !ben) return;
          toDaNhan = ben;
          setTo(ben);
          ghiToDaLuu(ben); // soi lại xuống sessionStorage để phiên này đọc đồng bộ như thường
        });
        return () => { song = false; };
      }
    }
  }, []);

  if (!to) return null;

  const trangThai = trangThaiNguon(to.neo, docDauVetNguon(to.neo.docId));

  /** Ghi cả state LẪN biến module — tờ đã sửa phải sống qua lần dựng lại của StrictMode. */
  const capNhat = (t: ToBanVe) => {
    toDaNhan = t;
    ghiToDaLuu(t); // đổi khổ/tỉ lệ/khung tên phải sống qua tải lại, không chỉ qua StrictMode
    setTo(t);
  };

  const xuLy = (loi: LoiXuNguonDoi) => {
    if (loi === 'giu-ban-hien-tai') {
      // Ghim dấu vết hiện tại làm mốc mới: người dùng đã biết nguồn đổi và CHỌN giữ bản này.
      const hienTai = docDauVetNguon(to.neo.docId);
      if (hienTai) capNhat({ ...to, neo: { ...to.neo, dauVet: hienTai } });
      return;
    }
    if (loi === 'cap-nhat') {
      // ⛔ Cổng duy nhất: tờ đã phát hành thì không đường nào cập nhật được.
      if (!coTheTuCapNhat(to)) return;
      const hienTai = docDauVetNguon(to.neo.docId);
      if (hienTai) capNhat({ ...to, neo: { ...to.neo, dauVet: hienTai, luc: Date.now() } });
      return;
    }
    // 'so-sanh' — chưa có màn so sánh; không giả vờ làm gì (nút đã mờ khi chưa nối).
  };

  const mauTrangThai =
    trangThai === 'hien-hanh' ? 'var(--success)' : trangThai === 'cu' ? 'var(--warning)' : 'var(--t3)';

  /**
   * ĐƯỜNG VỀ 2D (21/08) — cấm ngõ cụt: vào sâu bằng đường nào thì phải ra được bằng đường đó.
   * Tờ này mang sẵn `neo = {chang:'cad2d', docId, sheetId}` do CadSheets ghi lúc "Gửi sang Trình
   * chiếu" — mọi thứ cần để về ĐÚNG tờ đã có, chỉ chưa ai dùng.
   * Cách về dùng LẠI cơ chế sẵn có, không đẻ đường điều hướng thứ hai: ghi `resume.sheetId` rồi
   * đi tới chặng 2D — `CadSheets` lúc mount vốn đã ưu tiên `resume.sheetId` để chọn tờ (dòng
   * ~432), y hệt cách `PresentSheets` khôi phục tờ trình bày.
   */
  const veLai2D = () => {
    const uid = getLastUserId();
    if (uid) saveResume(uid, { route: '/cad-editor', sheetId: to.neo.sheetId });
    // Cùng dự án: đổi đuôi chặng trên chính đường đang đứng (…/present → …/cad). Không đoán id
    // dự án từ nơi khác — đường hiện tại LÀ nguồn đúng nhất.
    const duong = (pathname ?? '').replace(/\/present(?:\/.*)?$/, '/cad');
    router.push(duong && duong !== pathname ? duong : '/');
  };

  return (
    <>
      <button
        ref={nutRef}
        type="button"
        onClick={() => setMo((v) => !v)}
        aria-expanded={mo}
        title={`Thiết lập trang — ${to.nhan}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 10px',
          minHeight: 28,
          borderRadius: 'var(--r-2)',
          border: '1px solid var(--vien-mo)',
          background: 'var(--card)',
          color: 'var(--t1)',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        <FileText size={14} />
        Thiết lập trang
        <span
          style={{
            fontFamily: 'ui-monospace, Menlo, monospace',
            fontSize: 10,
            color: 'var(--t3)',
          }}
        >
          {to.khoGiay} · {nhanTyLe(to.tyLe)}
        </span>
        {/* chấm + chữ, không chỉ màu — màu không bao giờ là kênh duy nhất */}
        <span
          aria-hidden
          style={{ width: 7, height: 7, borderRadius: 'var(--r-full)', background: mauTrangThai }}
        />
        <span style={{ fontSize: 10, color: 'var(--t3)' }}>{NHAN_TRANG_THAI[trangThai]}</span>
      </button>
      {/* ĐƯỜNG VỀ — chỉ hiện khi tờ này ĐẾN TỪ 2D (`neo.chang === 'cad2d'`). Đứng ngay cạnh nút
          Thiết lập trang vì đó là chỗ người dùng đang nhìn khi làm việc với tờ bản vẽ. Không có
          neo 2D thì không vẽ nút — không hứa đường về mà không về được. */}
      {to.neo.chang === 'cad2d' && (
        <button
          type="button"
          onClick={veLai2D}
          title={`Về đúng tờ "${to.nhan}" ở chặng Thiết kế 2D`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 9px',
            minHeight: 28,
            borderRadius: 'var(--r-2)',
            border: '1px solid var(--vien-mo)',
            background: 'transparent',
            color: 'var(--t2)',
            fontSize: 11.5,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} /> Quay lại 2D
        </button>
      )}
      <ThietLapTrang
        mo={mo && !dayDu}
        onDong={() => setMo(false)}
        to={to}
        onDoiTo={(patch) => capNhat({ ...to, ...patch })}
        trangThai={trangThai}
        onXuLyNguonDoi={xuLy}
        onMoDayDu={() => setDayDu(true)}
      />
      <ThietLapTrangDayDu
        mo={dayDu}
        onDong={() => setDayDu(false)}
        to={to}
        khaNang={KHA_NANG}
        onMoBangNet={onMoBangNet}
      />
    </>
  );
}
