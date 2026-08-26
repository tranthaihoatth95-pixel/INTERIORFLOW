'use client';

/**
 * components/nav/NguCanhDuAn.tsx — KHỐI NGỮ CẢNH đầu thanh trái (Hoà chốt 22/08).
 *
 * 🔴 ĐỔI BẢN CHẤT KHỐI ĐẦU SIDEBAR: trước đây bản vẽ đề xuất đóng đinh DANH TÍNH CÁ NHÂN
 * ("TH · Trần Thái Hoà · Chủ trì thiết kế"). Hoà BÁC: ảnh đại diện cá nhân đã có chỗ ở
 * **góc phải trên cùng của app** (`AppChrome`), nhắc lại ở đầu thanh trái là nói cùng một điều
 * hai lần — và nó trả lời sai câu hỏi. Thanh trái là BẢN ĐỒ, nên khối đầu phải trả lời
 * *"tôi đang ở KHÔNG GIAN LÀM VIỆC nào"*, không phải *"tôi là ai"*.
 *
 * ⭐ SOLO VÀ TEAM DÙNG CHUNG MỘT KIẾN TRÚC — đây là ràng buộc, không phải tiện tay:
 * KHÔNG có nhánh `if (solo) …` vẽ ra một khối khác. Cùng một component, cùng một chỗ đứng,
 * cùng một thứ tự đọc (tên → số người → dãy ảnh). Một mình thì dãy có ĐÚNG MỘT ảnh; thêm người
 * là dãy dài ra rồi gom "+N". Nhờ vậy người dùng đi từ làm-một-mình sang làm-nhóm KHÔNG phải
 * học lại giao diện, và ta không nuôi hai đường vẽ dễ phân kỳ.
 *
 * [Đ2] KHÔNG dựng dãy avatar thứ hai: dùng lại `PresenceRow` (đã lo online/offline + gom "+N"
 * + chữ cái đầu khi thiếu ảnh). Ở đây chỉ lo LẤY dữ liệu và XẾP CHỖ.
 *
 * Nguồn: `/api/projects/<id>/members` (đã có, lọc chặt theo id). Thiếu dữ liệu thì ẨN dòng đó,
 * KHÔNG bịa số 0 hay avatar giả (luật X4/"không bịa").
 */

import { useEffect, useState } from 'react';
import PresenceRow, { type PresenceMember } from '@/components/ui/PresenceRow';
import { useT } from '@/lib/i18n';

interface ThanhVienApi {
  userId: string;
  name: string;
  role: string;
}

/** Cache theo id — rail remount nhiều lần (đổi nấc, đổi route) không bắn lại request. */
const kho = new Map<string, PresenceMember[]>();

export interface NguCanhDuAnProps {
  /** Dự án đang mở — null thì khối KHÔNG render (không có ngữ cảnh thì không bịa ra một cái). */
  duAnId: string | null;
  /** Tên dự án/không gian làm việc đã tra được ở nơi gọi. */
  ten: string | null;
  /** Nấc chi tiết của rail — quyết định bày bao nhiêu, KHÔNG phải bày to nhỏ. */
  hienChu: boolean;
}

export default function NguCanhDuAn({ duAnId, ten, hienChu }: NguCanhDuAnProps) {
  const tr = useT();
  const [thanhVien, setThanhVien] = useState<PresenceMember[]>(() =>
    duAnId ? kho.get(duAnId) ?? [] : [],
  );

  useEffect(() => {
    if (!duAnId) { setThanhVien([]); return; }
    const sanCo = kho.get(duAnId);
    if (sanCo) { setThanhVien(sanCo); return; }
    let huy = false;
    fetch(`/api/projects/${encodeURIComponent(duAnId)}/members`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (huy || !Array.isArray(d?.members)) return;
        // `online` chưa có nguồn thật ở đường này ⇒ khai FALSE cho mọi người, KHÔNG bịa "đang
        // online" để dãy trông sống động. Dãy vẫn đúng việc của nó: cho biết CÓ AI trong này.
        const ds: PresenceMember[] = (d.members as ThanhVienApi[]).map((m) => ({
          id: m.userId,
          name: m.name,
          online: false,
        }));
        kho.set(duAnId, ds);
        if (!huy) setThanhVien(ds);
      })
      .catch(() => {});
    return () => { huy = true; };
  }, [duAnId]);

  if (!duAnId) return null;

  const soNguoi = thanhVien.length;

  /* NẤC ĐỊNH VỊ (52px) — chỉ còn chỗ cho DÃY ẢNH. Đó là đúng thứ nên giữ lại: ở nấc hẹp nhất,
     câu hỏi còn lại là "đang ở không gian có ai", và một dãy ảnh trả lời được mà không cần chữ. */
  if (!hienChu) {
    if (!soNguoi) return null;
    return (
      <div
        className="flex justify-center px-1 pb-1.5 pt-0.5"
        aria-label={tr(`${ten ?? 'Dự án'} — ${soNguoi} thành viên`, `${ten ?? 'Project'} — ${soNguoi} members`)}
      >
        <PresenceRow members={thanhVien} max={2} />
      </div>
    );
  }

  return (
    <div className="px-3 pb-2 pt-0.5">
      {/* TÊN — serif, cỡ lớn nhất của thanh trái. Đây là thứ DUY NHẤT ở đây được phép to:
          nó là danh tính của không gian, mọi mục bên dưới chỉ là đường đi bên trong nó. */}
      {ten && (
        <div
          className="truncate font-[family-name:var(--font-serif,Georgia)] text-[15px] leading-tight text-[var(--t1)]"
          title={ten}
        >
          {ten}
        </div>
      )}
      {soNguoi > 0 && (
        <div className="mt-1.5 flex items-center gap-2">
          <PresenceRow members={thanhVien} max={4} />
          {/* Số người đi KÈM dãy ảnh chứ không thay nó: dãy trả lời "ai", số trả lời "bao nhiêu".
              Một mình cũng vẫn hiện "1 thành viên" — cùng một khuôn đọc, không có ca đặc biệt. */}
          <span className="text-[length:var(--fs-2xs)] text-[var(--t3)]">
            {tr(`${soNguoi} thành viên`, `${soNguoi} member${soNguoi > 1 ? 's' : ''}`)}
          </span>
        </div>
      )}
    </div>
  );
}
