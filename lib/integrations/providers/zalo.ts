import { getValidToken } from '@/lib/integrations/oauth-core';

/**
 * Zalo — CHỈ Official Account / ZNS (Zalo Notification Service).
 *
 * ⚠ Zalo CÁ NHÂN không có API chính thức → tự động hoá tin nhắn cá nhân = VI PHẠM ToS,
 * KHÔNG hỗ trợ ở đây. Chỉ gửi thông báo qua OA (cần OA đã duyệt + template ZNS).
 * Khung — bật khi có ZALO_OA_APP_ID/SECRET + template id.
 */
export async function sendZnsNotification(
  userId: string,
  phone: string,
  templateId: string,
  templateData: Record<string, string>,
) {
  const token = await getValidToken(userId, 'zalo');
  if (!token) throw new Error('Chưa kết nối Zalo Official Account.');
  const res = await fetch('https://business.openapi.zalo.me/message/template', {
    method: 'POST',
    headers: { access_token: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, template_id: templateId, template_data: templateData }),
  });
  if (!res.ok) throw new Error(`Zalo ZNS ${res.status}`);
  return res.json();
}
