'use client';

/**
 * /projects/[id]/present — CHẶNG 3 "Presenting" trong SCOPE DỰ ÁN (Task #21 · ĐỔ NỀN 1B).
 *
 * Nội dung y hệt route cũ `/present-editor` (cùng component `PresentStageScreen`); chỉ thêm
 * lớp scope: `[id]` từ URL là nguồn sự thật, `useProjectScopeSync` ép store về đúng dự án đó.
 * `/present-editor` giữ nguyên làm REDIRECT.
 *
 * 🔴 LỐI VÀO THỨ BA (06/09) — thi hành luật **X3 lối ③**: *"vào thẳng chặng 3 từ ảnh/ý tưởng,
 * không cần mô hình"*. Trước lượt này, dự án chưa có bản vẽ nào thì Trình chiếu trả màn rỗng chỉ
 * mời *"Tạo bản vẽ mới / Nhập bản vẽ có sẵn"* ⇒ mang một PDF tới, chưa vẽ gì, thì **không có cửa
 * nào** vào chặng 3. Đó là một lời từ chối trá hình, trái luật X2 (*"cấm chặn vì chưa làm bước
 * trước"*) — và trái chính vai của chặng 3, vốn nhận được cả ảnh lẫn tệp nhập.
 *
 * ⛔ KHÔNG dựng màn mới: vẫn đúng `ProjectScopeEmptyState` cũ, chỉ truyền thêm một lối đi; và thứ
 * mở ra là `PresentStageScreen` — chính màn chọn loại hồ sơ (`PresentDocTypePicker`) đã có.
 *
 * Lựa chọn được NHỚ theo dự án: chọn xong rồi mà lần sau vào vẫn gặp tường thì hồ sơ vừa dựng bị
 * nhốt sau đúng cái tường đó. Nhớ ở `localStorage` vì đây là *cách vào việc của máy này*, không
 * phải dữ liệu hồ sơ (luật lưu CHUNG ↔ MÁY, 16/08).
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PresentStageScreen from '@/components/present-editor/PresentStageScreen';
import { useProjectScopeSync, useScopeMissingInfo } from '@/lib/project-scope';
import { ProjectScopeEmptyState } from '@/components/studio/ProjectScopeEmptyState';

const KHOA_VAO_THANG = 'interiorflow.trinhChieuKhongCanBanVe.';

export default function ProjectPresentPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const status = useProjectScopeSync(id, 'present');
  const missingInfo = useScopeMissingInfo(id, status);
  const [vaoThang, setVaoThang] = useState(false);

  // Đọc SAU mount (localStorage không có ở SSR) — tránh lệch hydration.
  useEffect(() => {
    if (!id) return;
    try {
      if (localStorage.getItem(KHOA_VAO_THANG + id) === '1') setVaoThang(true);
    } catch {
      /* chế độ riêng tư — coi như chưa chọn, người dùng bấm lại một lần nữa */
    }
  }, [id]);

  const moThang = useCallback(() => {
    setVaoThang(true);
    try {
      localStorage.setItem(KHOA_VAO_THANG + id, '1');
    } catch {
      /* không nhớ được thì thôi — phiên này vẫn vào được */
    }
  }, [id]);

  // `unknown` = đường dẫn hỏng/đã xoá: KHÔNG mở lối thẳng. Không có dự án thật thì hồ sơ dựng ra
  // chẳng thuộc về đâu — đó là ngõ cụt kiểu khác, không phải thứ luật X3 nói tới.
  if (status === 'missing' && missingInfo && !(vaoThang && missingInfo.kind === 'empty-project')) {
    return (
      <ProjectScopeEmptyState
        routeId={id}
        stage="present"
        info={missingInfo}
        loiVaoThang={
          missingInfo.kind === 'empty-project'
            ? {
                nhan: 'Trình bày mà chưa cần bản vẽ',
                goiY: 'Nhập PDF · PPTX · ảnh, hoặc dàn từ mẫu',
                chay: moThang,
              }
            : undefined
        }
      />
    );
  }
  return <PresentStageScreen />;
}
