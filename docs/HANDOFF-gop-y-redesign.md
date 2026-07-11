# HANDOFF — Thiết kế lại tính năng "Góp ý" (comment layer) của InteriorFlow

> File này để đưa cho Claude design (phiên khác) tự làm. Bối cảnh đầy đủ, không cần đọc thêm gì.

## App là gì
**InteriorFlow** — node-based AI workflow canvas cho studio thiết kế nội thất (kiểu Weavy.ai), Next.js 14 App Router + TypeScript + Tailwind + Zustand + React Flow (`@xyflow/react` v12). Repo: `~/Downloads/interiorflow`. Chạy dev: `npm run dev` (port 3000).

Gu thẩm mỹ: **quiet-luxury, tối giản, sang trọng**. Luật cứng của repo:
- **Chỉ dùng font sans** (SF Pro stack) — CẤM serif.
- **Không hardcode màu** — dùng CSS token trong `app/globals.css`: `--bg / --panel / --card / --field / --hover / --border / --t1..--t5` (theme sáng/tối tự đổi).
- Motion dùng util sẵn: `lib/motion.ts` (springNode, pressable, prefersReducedMotion) + framer-motion.
- Mọi chuỗi UI qua i18n (`lib/i18n.ts`, EN + VI) — xem `docs/CONTENT-RULES.md`.

## Tính năng hiện tại (đang bị TẮT vì khó dùng)
**Mục đích:** người trong team (hoặc sếp xem qua điện thoại) bấm thẳng vào giao diện để ghim nhận xét — Claude Code trên máy đọc file JSON rồi sửa app theo góp ý. Là vòng review từ xa: xem app qua tunnel trên phone → ghim góp ý → dev sửa.

**File liên quan:**
- `components/CommentLayer.tsx` (~420 dòng) — toàn bộ UI: nút toggle "Góp ý" nổi góc phải-dưới + badge đếm `💬 n`, chế độ ghim (bấm đâu ghim đó, toạ độ % viewport), popup nhập text + đính kèm ảnh (FileReader → data URL), danh sách góp ý (sort chưa-xử-lý lên trên, đánh dấu resolved, xoá), ghim chỉ hiện đúng route đang xem.
- `app/api/comments/route.ts` — GET/POST/PATCH/DELETE, lưu file `comments-review.json` ở gốc repo (không DB).
- Mount ở `app/page.tsx` (canvas chính) và `app/present-editor/page.tsx`.
- **Trạng thái:** đã gate `process.env.NEXT_PUBLIC_COMMENT_LAYER !== '1' → return null` (tắt mặc định). Bật lại để dev/test: thêm `NEXT_PUBLIC_COMMENT_LAYER=1` vào `.env.local`.

**Schema 1 góp ý:**
```ts
{ id: string; text: string; x: number; y: number;   // % viewport
  route: string; stage?: string; elementHint?: string;
  image?: string;                                    // data URL
  resolved?: boolean; ts: number }
```

## Vì sao bị chê "khó xài" (quan sát thực tế)
1. **2 nút nổi (💬 n + Góp ý) đè lên UI app thường trực** — che thao tác canvas/modal (vd đè lên nút "Lưu vào node" của Sketch Studio), gây bấm nhầm.
2. Chế độ ghim bật lên thì **mọi cú bấm bị chặn để ghim** — dễ quên đang bật, app như "đơ".
3. Ghim theo **% viewport** → đổi kích thước màn/điện thoại là ghim trôi khỏi phần tử được góp ý.
4. Trên **màn điện thoại hẹp** (là ngữ cảnh dùng chính — sếp xem qua tunnel) popup nhập + danh sách chưa tối ưu, chữ nhỏ, khó gõ.
5. Màu accent hardcode `#e0603a` (coral) — lệch tokens, nổi "chói" trên gu quiet-luxury.

## Đề bài cho Claude design
Thiết kế lại trải nghiệm góp ý sao cho:
- **Không xâm lấn**: khi không dùng thì gần như vô hình, tuyệt đối không che thao tác app.
- Vào/thoát chế độ góp ý **rõ ràng** (biết ngay đang ở mode nào, thoát dễ).
- Ghim **bám phần tử** thay vì % viewport (gợi ý: lưu selector/element hint + fallback toạ độ), sống sót qua đổi viewport desktop ↔ phone.
- **Mobile-first** cho người xem qua tunnel trên điện thoại; desktop là phụ.
- Theo tokens + motion util sẵn có, sans-only, i18n EN/VI đủ.
- Giữ nguyên API contract `/api/comments` (đừng đổi schema nếu không cần — Claude Code đọc `comments-review.json` để sửa app).
- Deliverable mong muốn: mock/spec UI (hoặc code React nếu làm được) cho: nút entry, mode ghim, popup nhập, danh sách/resolve, hiển thị ghim.

## Ràng buộc kỹ thuật khi code
- Component client (`'use client'`), portal ra `document.body` nếu overlay `fixed` (bài học: ancestor có transform sẽ "giam" fixed).
- Không đụng store chính (`lib/store.ts`) — feature tự quản state.
- `npx tsc --noEmit` phải sạch.
