/**
 * lib/ui/trang-thai-tai.test.ts — P0-2 mục 1: bốn trạng thái phải TÁCH BẠCH.
 *
 * Lane `IF-UXUI-RUNTIME-001` chứng minh trục này đã sập trên app thật:
 *   · `/projects` khi 401 và khi server chết hẳn in **chữ y hệt, pixel y hệt**;
 *   · `/materials` và `/tasks` in thẳng `HTTP 401` cạnh câu "chưa có gì".
 *
 * Ca xương sống của tệp này là **CA 5**: hai lý do khác nhau **không được** ra cùng một câu.
 * Tách ở tầng kiểu mà câu chữ vẫn trùng thì việc tách là vô nghĩa — đó đúng là bệnh đang chữa.
 */
import assert from 'assert';
import { phanLoaiHong, nhan, type LyDoHong } from './trang-thai-tai';

let pass = 0;
const ok = (ten: string, dk: boolean) => {
  assert.ok(dk, `THẤT BẠI: ${ten}`);
  pass++;
};

const DT = { vi: 'dự án', en: 'projects' };

/* ═══ CA 1 · mất mạng đứng TRƯỚC mọi thứ ═══ */
{
  ok('offline + không có phản hồi → ngoai-tuyen', phanLoaiHong(null, false).lyDo === 'ngoai-tuyen');
  // Ngay cả khi có một phản hồi 500 cũ trong tay: mất mạng thì đổ cho máy chủ là đổ oan.
  ok('offline + phản hồi 500 → VẪN ngoai-tuyen', phanLoaiHong({ ok: false, status: 500 }, false).lyDo === 'ngoai-tuyen');
  ok('offline + 401 → VẪN ngoai-tuyen', phanLoaiHong({ ok: false, status: 401 }, false).lyDo === 'ngoai-tuyen');
}

/* ═══ CA 2 · có mạng — phân biệt quyền vs máy chủ ═══ */
{
  ok('401 → khong-quyen', phanLoaiHong({ ok: false, status: 401 }, true).lyDo === 'khong-quyen');
  ok('403 → khong-quyen', phanLoaiHong({ ok: false, status: 403 }, true).lyDo === 'khong-quyen');
  ok('500 → may-chu-loi', phanLoaiHong({ ok: false, status: 500 }, true).lyDo === 'may-chu-loi');
  ok('502 → may-chu-loi', phanLoaiHong({ ok: false, status: 502 }, true).lyDo === 'may-chu-loi');
  ok('404 → may-chu-loi (không phải chuyện quyền)', phanLoaiHong({ ok: false, status: 404 }, true).lyDo === 'may-chu-loi');
  // fetch NÉM (server chết hẳn) trong khi máy vẫn có mạng.
  ok('có mạng + fetch ném → may-chu-loi', phanLoaiHong(null, true).lyDo === 'may-chu-loi');
}

/* ═══ CA 3 · mã kỹ thuật giữ lại để TRA, không để HIỆN ═══ */
{
  ok('401 giữ ma=401', phanLoaiHong({ ok: false, status: 401 }, true).ma === 401);
  ok('ngoai-tuyen KHÔNG kèm mã (không có phản hồi nào để mà kèm)',
    phanLoaiHong({ ok: false, status: 500 }, false).ma === undefined);
}

/* ═══ CA 4 · câu chữ KHÔNG được chứa mã kỹ thuật ═══ */
{
  const moiLyDo: LyDoHong[] = ['khong-quyen', 'ngoai-tuyen', 'may-chu-loi', 'khong-doc-duoc'];
  for (const l of moiLyDo) {
    for (const en of [false, true]) {
      const n = nhan(l, DT, en);
      const chuoi = `${n.tieuDe} ${n.moTa} ${n.hanhDong ?? ''}`;
      ok(`${l}/${en ? 'en' : 'vi'} — không lọt "HTTP"`, !/HTTP/i.test(chuoi));
      ok(`${l}/${en ? 'en' : 'vi'} — không lọt mã 3 chữ số`, !/\b[45]\d\d\b/.test(chuoi));
      ok(`${l}/${en ? 'en' : 'vi'} — có tiêu đề và mô tả thật`, n.tieuDe.length > 4 && n.moTa.length > 20);
    }
  }
}

/* ═══ CA 5 · XƯƠNG SỐNG — bốn lý do, bốn câu KHÁC NHAU ═══ */
{
  for (const en of [false, true]) {
    const cau = (['khong-quyen', 'ngoai-tuyen', 'may-chu-loi', 'khong-doc-duoc'] as LyDoHong[])
      .map((l) => JSON.stringify(nhan(l, DT, en)));
    ok(`${en ? 'en' : 'vi'} — 4 lý do ra 4 câu khác nhau, không trùng đôi nào`,
      new Set(cau).size === 4);
  }
  // Và cụ thể hai ca đã trùng nhau trên app thật.
  const q = nhan('khong-quyen', DT, false);
  const s = nhan('may-chu-loi', DT, false);
  ok('401 và server-lỗi KHÔNG còn cùng tiêu đề (ca đã sập trên runtime)', q.tieuDe !== s.tieuDe);
  ok('…và không cùng mô tả', q.moTa !== s.moTa);
  ok('…và không cùng nhãn hành động', q.hanhDong !== s.hanhDong);
}

/* ═══ CA 6 · hành động phải ĐÚNG VIỆC PHẢI LÀM ═══ */
{
  ok('mất mạng KHÔNG có nút thử lại (nối mạng là nó tự về)', nhan('ngoai-tuyen', DT, false).hanhDong === null);
  ok('không quyền → nhãn nói ĐĂNG NHẬP, không nói thử lại',
    /đăng nhập/i.test(nhan('khong-quyen', DT, false).hanhDong ?? ''));
  ok('máy chủ lỗi → nhãn nói THỬ LẠI', /thử lại/i.test(nhan('may-chu-loi', DT, false).hanhDong ?? ''));
  ok('en: offline vẫn null', nhan('ngoai-tuyen', DT, true).hanhDong === null);
}

/* ═══ CA 7 · câu chữ nói đúng ĐỐI TƯỢNG đang thiếu ═══ */
{
  ok('vi — nhắc "vật liệu" khi đối tượng là vật liệu',
    /vật liệu/.test(nhan('khong-quyen', { vi: 'vật liệu', en: 'materials' }, false).moTa));
  ok('en — nhắc "materials"',
    /materials/.test(nhan('khong-quyen', { vi: 'vật liệu', en: 'materials' }, true).moTa));
}

/* ═══ CA 8 · "không quyền" phải TRẤN AN về dữ liệu ═══ */
{
  // Người dùng thấy màn trống rất dễ tưởng mất dữ liệu. Đây là khác biệt lớn nhất giữa
  // `khong-quyen` và `rong`, và nó phải nằm trong câu chữ.
  ok('vi — nói rõ dữ liệu vẫn còn', /vẫn còn nguyên/.test(nhan('khong-quyen', DT, false).moTa));
  ok('en — nói rõ dữ liệu vẫn còn', /untouched/i.test(nhan('khong-quyen', DT, true).moTa));
  ok('máy chủ lỗi — nói rõ tệp trên máy không bị đụng', /không bị đụng/.test(nhan('may-chu-loi', DT, false).moTa));
}

console.log(`trang-thai-tai: ${pass}/${pass} PASS`);
