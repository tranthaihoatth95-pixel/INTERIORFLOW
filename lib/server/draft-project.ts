/**
 * lib/server/draft-project.ts — dự án "Nháp" mặc định (p12 NỀN DỮ LIỆU, 08/08 — G-M14-01).
 *
 * GỐC BỆNH 45/46 flow mồ côi: POST /api/flows chấp nhận `projectId=null` êm ru (route.ts:88
 * `body.projectId ?? null`) và MỌI client tạo flow chính đều không truyền (FlowsPanel.tsx:85 ·
 * ProjectSelect.tsx:616 · WelcomeIntro.tsx:51) ⇒ flow sinh ra đã mồ côi từ trong trứng, và màn
 * dự án không bao giờ thấy chúng (overview/route.ts:45 lọc chặt `where:{projectId:id}`).
 *
 * Luật mới (phiếu p12 08/08): **mọi lối tạo Flow phải có dự án chủ** — client không nói rõ
 * project nào thì rơi vào dự án "Nháp" của chính user đó (get-or-create, mỗi user 1 cái).
 * Sửa Ở CUỐNG HỌNG SERVER thay vì đi vá từng client (components/ thuộc phiên khác) — client cũ
 * không cần đổi dòng nào vẫn hết đẻ mồ côi.
 *
 * "Nháp" là dự án THẬT (hiện trong gallery, mở được, đổi tên được) — không phải bucket ẩn kiểu
 * `__nb:` (đường Notebook, cố ý ẩn). Người dùng kéo flow từ Nháp sang dự án thật bằng
 * `assignProject` sẵn có (FlowsPanel).
 */

import { prisma } from './db';

export const DRAFT_PROJECT_NAME = 'Nháp';

/**
 * Trả id dự án "Nháp" của user — tạo mới (kèm ProjectMember owner, cùng transaction, đúng khuôn
 * POST type:'project' của route.ts) nếu chưa có. Idempotent theo (userId, name, deletedAt=null);
 * không có unique constraint DB cho cặp này nên vẫn có cửa sổ đua hiếm — chấp nhận được cho
 * dev-DB một người dùng, ghi rõ thay vì giấu.
 */
export async function ensureDraftProject(userId: string): Promise<string> {
  const existing = await prisma.project.findFirst({
    where: { userId, name: DRAFT_PROJECT_NAME, deletedAt: null },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.project.create({
    data: {
      userId,
      name: DRAFT_PROJECT_NAME,
      lastEditedBy: userId,
      members: { create: { userId, role: 'owner', lastEditedBy: userId } },
    },
    select: { id: true },
  });
  return created.id;
}
