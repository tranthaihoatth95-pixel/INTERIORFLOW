# InteriorFlow — Bàn giao phiên & Roadmap

> File này để mở phiên chat mới đọc là tiếp tục được ngay. Cập nhật 2026-07-04.

## 1. Backend hiện tại đang chạy như thế nào

Toàn bộ là **1 app Next.js 14 (App Router)** — vừa là frontend vừa là backend, không tách server riêng:

- **Frontend**: React + `@xyflow/react` (canvas node), Zustand (state), TailwindCSS + CSS variables (theme sáng/tối).
- **Backend = Next.js API Routes** (`app/api/**`), chạy Node.js:
  - `auth/*` — đăng ký/đăng nhập, JWT cookie (jose) + bcrypt. **Tự viết, không NextAuth.**
  - `flows/*` — CRUD flow, autosave, snapshot version, share token.
  - `credits` — ledger (spend nguyên tử `updateMany ... gte`, refund khi lỗi).
  - `chat` — tin nhắn + presence (polling 3s).
  - `library/*` — thư viện ảnh team, file lưu `./uploads/`, metadata trong DB.
  - `jobs/*` — **adapter gọi AI** (hiện tại fal.ai). Đây là chỗ nối API AI.
- **Database**: Prisma + **SQLite** (`prisma/dev.db`). Đổi `provider = "postgresql"` + `DATABASE_URL` là lên Supabase/Postgres, không sửa code.
- **AI**: adapter layer `lib/ai/` — client gửi `task` → server map sang model fal.ai → submit + poll. Tách sạch để **thêm provider mới (ComfyUI self-host, Gemini, video API) chỉ cần thêm 1 file provider**, không đụng node.
- **Cơ chế credit**: mỗi node có `creditCost`; đã đăng nhập thì trừ/hoàn qua `/api/credits` (server), chưa thì trừ local.

**Tóm lại**: một Next.js app duy nhất, DB SQLite, AI qua adapter. Chạy được trên bất kỳ máy nào có Node. Cả team hiện dùng bằng cách vào `http://<ip-máy-chủ>:3000`.

## 2. Yêu cầu tiếp theo (nhiệm vụ phiên 11:30) — theo thứ tự ưu tiên

### A. Chạy native trên Windows (dàn máy mạnh có 3ds Max + Vray/D5)
- **Cách 1 (khuyến ngh) — Tauri**: wrap app Next.js thành .exe/.msi, nhẹ (~10MB), Rust core. Ưu điểm: chạy như app desktop, đóng gói được cả server Node bên trong hoặc trỏ về server LAN.
- **Cách 2 — Electron**: nặng hơn nhưng dễ hơn, đóng gói Next.js + Node server + SQLite vào 1 app. Chọn cách này nếu cần nhanh.
- **Tận dụng máy mạnh**: cài **ComfyUI + FLUX.1 dev** local trên máy render (RTX ≥12GB), viết provider `lib/ai/providers/comfyui.ts` → render **0đ/ảnh, không gửi bản vẽ khách ra ngoài**. Đây là điểm mạnh nhất: máy đã có sẵn cho Vray/D5.
- 3ds Max/Vray: KHÔNG thay thế, mà **bổ trợ** — xuất viewport/clay render từ Max → Import Image → AI polish/relight/upscale. Có thể thêm node "Import từ Max" (watch folder).

### B. Cài lên iPad (iPadOS), Android, điện thoại
- **PWA** (Progressive Web App): thêm `manifest.json` + service worker → "Add to Home Screen" trên iPad/Android chạy full màn hình như app native. **Không cần App Store, không phí developer.** Đây là cách nhanh + phủ hết thiết bị nhất.
- Cần: responsive layout (hiện đang desktop-first — phải làm mobile: panel thành bottom-sheet, canvas pinch-zoom đã có sẵn của React Flow).
- Nâng cao (nếu cần app store thật): Capacitor wrap PWA → .ipa/.apk.

### C. Nối API AI tạo ảnh + video tốt nhất hiện nay
Adapter đã sẵn. Cần thêm:
- **Ảnh** (đã có fal FLUX): thêm **Gemini 3 Pro Image (Nano Banana Pro)** cho chất lượng cao + hiểu prompt tiếng Việt; **Recraft/Ideogram** cho text-trong-ảnh.
- **VIDEO** (CHƯA CÓ — làm mới): interior walkthrough / flythrough. Nên nối qua fal.ai (1 key, nhiều model):
  - **Kling 2.x** (image-to-video, chuyển động mượt) — tốt nhất cho pan nội thất.
  - **Google Veo 3** (chất lượng cao, có audio).
  - **Runway Gen-4**, **Luma Ray 2**, **Minimax Hailuo** — dự phòng.
  - Node mới: `ai.image2video` (input: ảnh render + prompt chuyển động → output video URL). Cần thêm `DataType = 'video'`, node hiển thị `<video>`, output panel tải mp4.
- **Giá tham khảo**: ảnh fal FLUX ~$0.05/ảnh; video ~$0.3–0.5/clip 5s. Nạp fal $10–20 là chạy được nhiều.

### D. Giao diện chuẩn Apple Design System + motion vibe Apple
- **Đổi type system**: dùng SF Pro (hoặc `-apple-system` font stack), spacing 8pt grid, corner radius Apple (10/14/20), materials (translucency/vibrancy — backdrop-blur).
- **Motion**: spring animations (framer-motion), easing Apple (`cubic-bezier(0.32, 0.72, 0, 1)`), panel slide như iOS sheet, haptic-like micro-interactions, node xuất hiện có spring scale.
- **Cân nhắc**: giữ tông quiet-luxury hiện tại nhưng tinh chỉnh theo HIG. Thêm framer-motion (chưa cài).

## 3. Trạng thái hiện tại (đã xong, đã test)
- Phase 1–4: canvas node, 24 node (input/AI generate/AI edit/slide/utility/output), edge typing, run per-node + run flow (topo-sort), cache, undo/redo, mask painter, annotate, compare A/B, color palette, export board PDF, gallery.
- Pipeline SLIDE: Concept → Slide Composer (theme từ ảnh ref) → Export Deck PDF. **Chạy 100% local, đã nghiệm thu (gửi user deck SERENE).**
- Phase 3 multi-user: auth, credits ledger server, flows + version, share link read-only `/share/[token]`, chat team + presence, thư viện team (`./uploads`). Test 2 user OK.
- Theme sáng/tối auto theo giờ (6h30–18h sáng).
- Command Palette ⌘K, DAG auto-layout, snap-to-grid (Increment 1).

## 4. Chặn / chờ
- **fal.ai**: key đã gắn (`.env.local`) nhưng **tài khoản hết balance** → cần nạp tại fal.ai/dashboard/billing.
- **Gemini**: key ở `~/.config/gemini/api_key` nhưng free-tier bị chặn model ảnh.
- Nạp 1 trong 2 là chạy AI thật ngay. Flow mẫu "Phòng ngủ hoàn chỉnh" đã tune prompt sẵn để nghiệm thu.

## 5. Tài khoản test
- `hoa@ttt.vn` / `matkhau123` (admin, 500cr)
- `thong@ttt.vn` / `matkhau123` (member, 200cr)

## 6. Lệnh hay dùng
```bash
cd ~/Downloads/interiorflow
npm run dev              # dev server :3000
npx prisma studio        # xem DB
npx prisma migrate dev   # sau khi đổi schema
# ⚠️ Đừng chạy `npm run build` khi dev server đang chạy — hỏng .next, phải rm -rf .next
```

## 7. Thứ tự làm phiên 11:30 (đề xuất)
1. Cài `framer-motion` + refactor UI sang Apple HIG (type, spacing, materials, spring motion).
2. Thêm `DataType='video'` + node `ai.image2video` (Kling qua fal) + provider video.
3. PWA (manifest + service worker + responsive mobile) → cài lên iPad/điện thoại.
4. Electron/Tauri wrap → .exe Windows + provider ComfyUI self-host cho máy render.
5. Commit từng bước.
