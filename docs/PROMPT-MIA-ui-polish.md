# Prompt cho Mia — Polish giao diện InteriorFlow (branch cô lập)

> User dán nguyên khối dưới đây vào phiên Claude Code của Mia (mở trong `~/Downloads/interiorflow`).
> Mục tiêu: Mia lo **thẩm mỹ/giao diện**; không đụng file lõi mà phiên Claude Code kia (AI-tier/merge) đang giữ.

---

## PASTE CHO MIA — bắt đầu từ đây

Bạn phụ trách **polish giao diện** cho InteriorFlow (Next.js 14 + Tailwind + framer-motion, token Apple đã có trong `app/globals.css`). Một phiên Claude khác đang làm phần lõi (AI-tier, provider, merge) — **phải cô lập để không giẫm chân**.

### Quy tắc cô lập (bắt buộc)
1. **Làm trên worktree + branch riêng**, KHÔNG làm thẳng trên `main`:
   ```bash
   cd ~/Downloads/interiorflow
   git worktree add ../interiorflow-mia -b feat/ui-polish-mia
   cd ../interiorflow-mia && npm install && npm run dev   # chạy port riêng nếu 3000 bận: PORT=3010 npm run dev
   ```
   → Bạn code trong thư mục `~/Downloads/interiorflow-mia` (tách hẳn), phiên kia ở `~/Downloads/interiorflow`. Git lo phần gộp.
2. **CHỈ sửa các file GIAO DIỆN** (className, motion, layout, spacing, màu qua token). Danh sách được phép:
   - `components/InteriorNode.tsx`, `components/BottomToolbar.tsx`, `components/Lightbox.tsx`, `components/MaskPainterModal.tsx`, `components/AnnotateModal.tsx`, `components/CommandPalette.tsx`
   - `components/Header.tsx`, `components/NodeLibraryPanel.tsx`, các `*Panel.tsx`, `components/LeftRail.tsx` — **chỉ className/responsive**, giữ nguyên logic + các component con (PhaseSwitcher, AiTierMenu, ViewToggle) và `data-testid`.
   - `app/globals.css` — **chỉ thêm** trong block đánh dấu `/* === MIA UI === */ ... /* === /MIA UI === */`, không sửa token/biến sẵn có.
   - `lib/motion.ts` — thêm variant mới, không đổi cái đang dùng.
3. **TUYỆT ĐỐI KHÔNG đụng**: `lib/store.ts`, `lib/execution.ts`, `lib/nodes/registry.ts`, `lib/ai/**`, `lib/phases.ts`, `lib/types.ts`, `app/api/**`, `prisma/**`, `next.config.mjs`. Cần đổi gì ở đây → ghi vào `docs/MIA-requests.md` để phiên kia làm.
4. **Commit path-scoped**, message tiền tố `ui:` — `git add components/ app/globals.css && git commit -m "ui: ..."`. Đừng `git add -A`.
5. Sau mỗi cụm việc: `npx tsc --noEmit` phải exit 0.

### Việc cần làm (ưu tiên trên xuống)
1. **Responsive header** (đang chật): tên flow bị co còn "U". Cho các nhóm co gọn ở màn hẹp (PhaseSwitcher → icon-only <lg, ViewToggle ẩn <md đã có, tên flow ẩn <sm), header cuộn ngang mượt trên mobile (class `.no-scrollbar` đã có).
2. **Panel thành bottom-sheet trên mobile** (hiện là sidebar trái đè canvas): <md thì panel trượt từ đáy (iOS sheet), overlay mờ đã có sẵn trong `app/page.tsx`.
3. **Restyle nốt theo token Apple + motion spring** (nền apple-design đã merge, các file này chưa hoàn thiện): `InteriorNode` (spring khi xuất hiện, hairline, trạng thái run/done/error rõ), `BottomToolbar`, `Lightbox`, `MaskPainter/Annotate modal`, `CommandPalette`.
4. **Node card**: badge kiểu dữ liệu (image/text/mask/**video** hồng san hô), progress ring mượt, nút ▶ press-scale.

### Cách user xem + comment + bạn sửa (vòng review)
- Bạn chạy `npm run dev` trên worktree → báo URL. User mở xem.
- Muốn user xem trên điện thoại: `npx localtunnel --port 3010` (hoặc 3000) → gửi link + QR. (Xem `~/Downloads` memory "preview-prototype-tren-dien-thoai".)
- User comment bằng cách: chụp màn hình + khoanh, hoặc nhắn ý trong chat của bạn. Bạn sửa trực tiếp file → user reload thấy ngay (HMR).
- Khi 1 cụm xong + user duyệt: commit, rồi báo phiên kia (hoặc user) để `git merge feat/ui-polish-mia` vào main.

### Nghiệm thu
- `npx tsc --noEmit` exit 0; không sửa file trong danh sách cấm; header + panel dùng tốt trên mobile (375px) lẫn desktop; giữ nguyên logic + `data-testid` + các control (PhaseSwitcher/AiTierMenu/ViewToggle) hoạt động.

## HẾT PHẦN PASTE
