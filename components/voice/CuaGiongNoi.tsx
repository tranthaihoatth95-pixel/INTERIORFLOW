'use client';

/**
 * components/voice/CuaGiongNoi.tsx — MẶT TIỀN của đầu vào giọng nói.
 *
 * ⭐ Nó CỐ Ý mỏng. Toàn bộ nghĩa nằm ở `lib/voice/giai-y-dinh.ts` (thuần, test được); component
 * này chỉ làm ba việc: bật/tắt máy nghe · bày bản chữ · dựng PHIẾU XEM TRƯỚC khi ý định chạm
 * vào sự thật. Không có bảng lệnh, không có kho, không có lịch sử hội thoại — nếu thấy một
 * trong ba thứ đó mọc ra ở đây thì tính năng đã trượt thành "app trợ lý giọng nói riêng".
 *
 * ⛔ Không nút giả: máy không nghe được thì nút để `aria-disabled` (KHÔNG dùng `disabled` — nút
 *    disabled bị Tab bỏ qua, lý do sẽ không bao giờ tới bàn phím/trình đọc màn hình) và lý do
 *    THẬT nằm ở phần tử `aria-describedby`, không nằm trong `title` (title câm trên cảm ứng).
 * ⛔ Không giả vờ nghe: khi không có micro, cửa vẫn nhận chữ GÕ — cùng một hợp đồng, cùng một
 *    đường đi (đó là điểm của cả lane này), và nói thẳng đang dùng đường nào.
 */

import React from 'react';
import { useT } from '@/lib/i18n';
import { giaiBanChu, nhanThuocTinh } from '@/lib/voice/giai-y-dinh';
import { taoMayNghe, khaNangNghe, type MayNghe } from '@/lib/voice/nhan-dang';
import { thiHanh, type CuaNhan, type KetQuaThiHanh } from '@/lib/voice/thi-hanh';
import { lyDoXacNhan } from '@/lib/voice/rui-ro';
import type { BanChu, DauVaoNguNghia, NguCanhHienTai, NguonDauVao } from '@/lib/voice/types';
import { GIONG_NOI_CSS } from './giong-noi-css';

export interface CuaGiongNoiProps {
  /** Ngữ cảnh lúc nói — host truyền, bộ giải KHÔNG tự đoán "chỗ này" là chỗ nào. */
  nguCanh: NguCanhHienTai;
  /** Cửa nhận của host. Ngữ cảnh nào host chưa khai thì cửa nói thẳng, không nuốt câu. */
  cuaNhan: CuaNhan;
  /**
   * Cho bàn thử / nghiệm thu bơm bản chữ vào ĐÚNG cửa `bản chữ → ngữ nghĩa` mà không cần micro.
   * Trả về hàm nạp; trình duyệt headless không có micro thật nên đây là đường duy nhất chạy
   * được hết đường thật trong máy kiểm.
   */
  onSanSang?: (napBanChu: (b: BanChu) => void) => void;
}

interface ChoDuyet {
  readonly dauVao: DauVaoNguNghia;
  readonly lyDo: [string, string];
}

export default function CuaGiongNoi({ nguCanh, cuaNhan, onSanSang }: CuaGiongNoiProps) {
  const t = useT();
  const [dangNghe, setDangNghe] = React.useState(false);
  const [banChu, setBanChu] = React.useState<BanChu | null>(null);
  const [ketQua, setKetQua] = React.useState<string | null>(null);
  const [loi, setLoi] = React.useState<string | null>(null);
  const [choDuyet, setChoDuyet] = React.useState<ChoDuyet | null>(null);
  const mayRef = React.useRef<MayNghe | null>(null);

  // Máy này nghe được không — tính MỘT lần lúc mount (client), không đoán lúc render server.
  const [kha, setKha] = React.useState<ReturnType<typeof khaNangNghe> | null>(null);
  React.useEffect(() => setKha(khaNangNghe()), []);

  /** CỬA DUY NHẤT: bản chữ → ngữ nghĩa → thi hành (hoặc dựng phiếu xác nhận). */
  /**
   * 🔴 SỬA 22/08 — `nguon` TỪNG GÕ CỨNG `'giong-noi'`. Docstring đầu tệp hứa *"không có micro thì
   * cửa vẫn nhận chữ GÕ — cùng một hợp đồng, cùng một đường đi"*, nhưng đo được: component KHÔNG
   * có một ô nhập nào (`grep input` = 0) và `nap()` không nhận nổi nguồn khác. Lời hứa nằm trong
   * docstring, không nằm trong mã — cùng họ bài học 16/08 *"có trong mã ≠ tới được người dùng"*,
   * ở đây còn sớm hơn một nấc: *có trong docstring ≠ có trong mã*.
   * Nay `nap()` nhận `nguon`; câu NÓI và câu GÕ đi CHUNG đúng những dòng dưới đây — khác đúng
   * một tham số, không rẽ nhánh. Đó chính là điều test của lane V khoá bằng `deepStrictEqual`.
   */
  const [goChu, setGoChu] = React.useState('');

  /* Cửa nhận của HOST ghi hỏng (401 · mất mạng) thì phải nói ra ĐÂY — `CuaNhan.ghiChu` là
     `(d) => void` nên không có đường trả về; sự kiện là kênh duy nhất không phải đổi hợp đồng. */
  React.useEffect(() => {
    const f = (e: Event) => setLoi(String((e as CustomEvent).detail ?? ''));
    window.addEventListener('if:voice-loi', f);
    return () => window.removeEventListener('if:voice-loi', f);
  }, []);

  const nap = React.useCallback(
    (b: BanChu, nguon: NguonDauVao = 'giong-noi') => {
      setBanChu(b);
      if (b.tamThoi) return; // bản tạm: thấy được, KHÔNG thi hành được
      const kq = giaiBanChu(b, nguCanh, nguon);
      if (!kq.ok) {
        setKetQua(null);
        setLoi(kq.goiY ?? t('Chưa hiểu câu này.', 'Did not understand that.'));
        return;
      }
      setLoi(null);
      const ly = lyDoXacNhan(kq.dauVao.yDinh);
      if (kq.dauVao.doiSuThat && ly) {
        // ⛔ KHÔNG chạy. Dựng phiếu xem trước — người bấm mới đổi.
        setChoDuyet({ dauVao: kq.dauVao, lyDo: ly });
        setKetQua(null);
        return;
      }
      bao(thiHanh(kq.dauVao, cuaNhan), kq.dauVao);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nguCanh, cuaNhan, t],
  );

  /**
   * Báo kết quả bằng TIẾNG NGƯỜI. `KetQuaThiHanh.daLam` là ID DỮ LIỆU (`cad.dim.measure`,
   * `y-dinh-thiet-ke`) — in thẳng nó ra màn là chữ nghề lọt vào giao diện, đúng lỗi bắt được
   * bằng mắt ở hai ảnh chụp đầu (22/08). Câu nói lấy từ NHÃN trong sổ lệnh, không tự chế.
   */
  function bao(r: KetQuaThiHanh, d: DauVaoNguNghia) {
    if (r.ok) {
      const y = d.yDinh;
      setKetQua(
        y.nguCanh === 'lenh'
          ? t(`Đã chạy: ${y.nhan}`, `Ran: ${y.nhan}`)
          : y.nguCanh === 'ghi-chu'
            ? t('Đã lưu ghi chú.', 'Note saved.')
            : y.nguCanh === 'soat-duyet'
              ? t('Đã ghim để soát lại.', 'Pinned for review.')
              : y.nguCanh === 'tim-kiem'
                ? t(`Đang tìm "${y.tuKhoa}".`, `Searching "${y.tuKhoa}".`)
                : t(
                    `Đã đổi ${nhanThuocTinh(y.truong)[0].toLowerCase()} thành ${y.giaTri} ${y.donVi}.`,
                    `Changed ${nhanThuocTinh(y.truong)[1].toLowerCase()} to ${y.giaTri} ${y.donVi}.`,
                  ),
      );
      setLoi(null);
      return;
    }
    setKetQua(null);
    setLoi(
      r.vuong === 'chua-co-cua'
        ? t(`Màn này chưa nhận được "${r.nguCanh}".`, `This screen cannot take "${r.nguCanh}" yet.`)
        : r.vuong === 'khong-thay-lenh'
          ? t('Lệnh này không còn trong sổ lệnh.', 'That command is no longer in the registry.')
          : t('Cần bấm đồng ý trước.', 'Needs confirmation first.'),
    );
  }

  React.useEffect(() => {
    onSanSang?.(nap);
  }, [onSanSang, nap]);

  function batTat() {
    if (!kha?.co) return;
    if (dangNghe) {
      mayRef.current?.dung();
      return;
    }
    const may = taoMayNghe({
      ngonNgu: 'vi', // tiếng Việt là đường chính
      onBanChu: nap,
      onLoi: (ma) =>
        setLoi(
          ma === 'not-allowed'
            ? t('Chưa được cấp quyền micro.', 'Microphone permission was denied.')
            : t(`Micro gặp lỗi (${ma}).`, `Microphone error (${ma}).`),
        ),
      onDung: () => setDangNghe(false),
    });
    if (!may) return;
    mayRef.current = may;
    setLoi(null);
    setKetQua(null);
    may.bat();
    setDangNghe(true);
  }

  const nghengDuoc = kha?.co === true;
  const lyDoId = 'if-thoai-ly-do';

  return (
    <div className="if-thoai" data-thoai>
      <style dangerouslySetInnerHTML={{ __html: GIONG_NOI_CSS }} />

      <div className="if-thoai-hang">
        <button
          type="button"
          className="if-thoai-nut"
          data-nghe={dangNghe ? 'true' : 'false'}
          aria-disabled={nghengDuoc ? undefined : true}
          aria-describedby={nghengDuoc ? undefined : lyDoId}
          aria-pressed={dangNghe}
          onClick={batTat}
        >
          {dangNghe && <span className="if-thoai-cham" aria-hidden />}
          {/* Nhãn CHỮ luôn có — trạng thái không bao giờ chỉ nói bằng màu/ánh sáng. */}
          {dangNghe ? t('Đang nghe — bấm để dừng', 'Listening — tap to stop') : t('Nói', 'Speak')}
        </button>
        {!nghengDuoc && kha && (
          <span id={lyDoId} className="if-thoai-loi">
            {t(kha.noiThang?.[0] ?? '', kha.noiThang?.[1] ?? '')}
          </span>
        )}
      </div>

      {/* Ô GÕ — ĐƯỜNG BÌNH ĐẲNG, KHÔNG PHẢI ĐƯỜNG THOÁI LUI (22/08).
          Máy không nghe được (headless · chưa cấp quyền micro · máy không có mic) thì đây là cửa
          DUY NHẤT còn lại; và kể cả khi nghe được, gõ vẫn là cách người dùng sửa lại câu máy nghe
          nhầm. Nó đi CHUNG `nap()` với giọng nói, chỉ khác `nguon: 'chu-go'` — nên mọi luật đã
          khoá cho giọng nói (phiếu xem trước · fail-closed · không kho riêng) tự động áp cho nó,
          không phải viết lại lần hai. */}
      <form
        className="if-thoai-hang"
        onSubmit={(e) => {
          e.preventDefault();
          const van = goChu.trim();
          if (!van) return;
          nap({ van, ngonNgu: 'vi', tamThoi: false }, 'chu-go');
          setGoChu('');
        }}
      >
        <input
          value={goChu}
          onChange={(e) => setGoChu(e.target.value)}
          className="if-thoai-o"
          placeholder={t('…hoặc gõ câu', '…or type it')}
          aria-label={t('Gõ câu thay cho nói', 'Type instead of speaking')}
        />
      </form>

      <div
        className="if-thoai-banchu"
        data-tam={banChu?.tamThoi ? 'true' : 'false'}
        data-rong={banChu ? 'false' : 'true'}
        aria-live="polite"
        aria-label={t('Máy nghe được', 'Transcript')}
      >
        {banChu?.van || t('Chưa nghe được gì.', 'Nothing heard yet.')}
      </div>

      {choDuyet && <Phieu cho={choDuyet} onDongY={() => {
        bao(thiHanh(choDuyet.dauVao, cuaNhan, true), choDuyet.dauVao);
        setChoDuyet(null);
      }} onHuy={() => {
        setChoDuyet(null);
        setKetQua(null);
        setLoi(t('Đã bỏ qua — bản vẽ không đổi.', 'Discarded — the drawing is unchanged.'));
      }} />}

      {ketQua && <div className="if-thoai-ket" role="status">{ketQua}</div>}
      {loi && !choDuyet && <div className="if-thoai-loi" role="status">{loi}</div>}
    </div>
  );
}

/**
 * PHIẾU XEM TRƯỚC — bày ĐÚNG thứ sắp đổi, bằng con số, trước khi đổi.
 * Đồng ý ↔ Huỷ phân biệt bằng CHỮ + VỊ TRÍ + nền (không chỉ bằng màu); Huỷ đứng trước để tay
 * không quen bấm nhầm sang Đồng ý.
 */
function Phieu({ cho, onDongY, onHuy }: { cho: ChoDuyet; onDongY: () => void; onHuy: () => void }) {
  const t = useT();
  const y = cho.dauVao.yDinh;
  return (
    <div className="if-thoai-phieu" role="group" aria-label={t('Xác nhận thay đổi', 'Confirm change')}>
      <div className="if-thoai-phieu-tieu">{t('Xem lại trước khi đổi', 'Review before changing')}</div>
      <div className="if-thoai-phieu-ly">{t(cho.lyDo[0], cho.lyDo[1])}</div>
      <dl className="if-thoai-bang">
        <dt>{t('Máy nghe được', 'Heard')}</dt>
        <dd>{cho.dauVao.banChu.van}</dd>
        {y.nguCanh === 'y-dinh-thiet-ke' && (
          <>
            <dt>{t('Thuộc tính', 'Property')}</dt>
            {/* Chữ cho NGƯỜI, không in thẳng khoá dữ liệu `y.truong`. */}
            <dd>{t(...nhanThuocTinh(y.truong))}</dd>
            <dt>{t('Giá trị mới', 'New value')}</dt>
            <dd>
              {y.giaTri} {y.donVi}
            </dd>
            <dt>{t('Gắn vào', 'Anchored to')}</dt>
            <dd>{y.neo.entityId ?? t('chưa chọn vật nào', 'no object selected')}</dd>
          </>
        )}
        {y.nguCanh === 'lenh' && (
          <>
            <dt>{t('Lệnh', 'Command')}</dt>
            <dd>
              {y.nhan} ({y.alias})
            </dd>
            {y.arg && (
              <>
                <dt>{t('Đối số', 'Argument')}</dt>
                <dd>{y.arg}</dd>
              </>
            )}
          </>
        )}
      </dl>
      <div className="if-thoai-nutdoc">
        <button type="button" className="if-thoai-btn" onClick={onHuy}>
          {t('Huỷ', 'Cancel')}
        </button>
        <button type="button" className="if-thoai-btn" data-chinh="true" onClick={onDongY}>
          {t('Đồng ý', 'Confirm')}
        </button>
      </div>
      <div className="if-thoai-canh">
        {t('Đổi rồi vẫn hoàn tác được bằng ⌘Z.', 'You can still undo with ⌘Z.')}
      </div>
    </div>
  );
}
