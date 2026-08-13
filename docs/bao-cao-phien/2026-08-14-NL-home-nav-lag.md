# BÁO CÁO NL · 14/08 — home-nav-lag: đo rồi giảm lag điều hướng về Home

**Phiếu:** `docs/phieu-giao/home-nav-lag.md` · **Vai:** NL (hiệu năng vỏ app, cấp Đ) ·
**Vùng file đã đụng:** `components/home/HomeScreen.tsx` + `components/home/heavy-panels.tsx` (wrapper mới, cho phép trong phiếu) + báo cáo này. KHÔNG git, KHÔNG server mới, KHÔNG dep, KHÔNG login (tab browser-pane dùng session cookie CÓ SẴN của profile pane — tôi không nhập bất kỳ ký tự nào vào form nào).

## ① ĐO TRƯỚC (dev server 3000 đang chạy, webpack dev — SỐ DEV, chỉ so tương đối cùng điều kiện)

| Số đo | Trước |
|---|---|
| `app/page.js` (chunk route `/`) | **28.622.846 bytes (~28,6 MB)** · tải 697 ms (localhost) |
| `app/projects/[id]/render/page.js` | 28.624.797 bytes (~28,6 MB) · 782 ms — điều hướng nào cũng gánh khối này |
| Số module trong chunk `/` | **1.986** |
| Trong đó node_modules đáng chú ý | `three-mesh-bvh` 82 · `three-bvh-csg` 44 · d3-* ~200 · motion-dom 358 · lucide 342 |
| DCL / FCP / load (warm, đã đăng nhập sẵn) | 449 / 480 / **1.209 ms** |

**Chẩn đoán:** đúng nghi phạm số 1 của T — bundle. Toàn bộ dàn panel/modal gated-by-state import TĨNH → nằm trọn trong chunk route; bấm về Home phải tải + parse 28,6 MB (dev) trước khi tương tác mượt. Nguyên nhân chính LÀ bundle ⇒ được phép sửa theo phiếu.

## ② SỬA — 15 component chuyển `next/dynamic` (ssr:false), gom vào `components/home/heavy-panels.tsx`

Cùng mẫu tiền lệ repo (`Scene3DPreviewModal.tsx`, `PresentSheets.tsx`). Tên + prop giữ nguyên, fallback mặc định (null — không chế UI mới), HomeScreen CHỈ đổi nguồn import, không đổi hành vi/thứ tự render có điều kiện.

| Component | Lý do không nằm trên first-paint |
|---|---|
| MaskPainterModal · AnnotateModal · MoodboardModal · Lightbox · CommandPalette | modal tự gate bằng store, đóng = null |
| Dashboard | overlay gated `dashboardOpen` (gallery) · toàn màn chỉ ở cover-mode <480px |
| GalleryPanel · LibraryPanel · ChatPanel | sheet tự gate (`panel`/`chatOpen`) |
| NodeLibraryPanel | navigator ổ ② — khung AppShell tĩnh hiện ngay, ruột vào sau một nhịp (T liệt kê rõ trong phiếu) |
| Object3DTree · Object3DInspector · Render3DModeSkeleton | chỉ mode `model3d` — chính nhánh kéo three-mesh-bvh/csg vào chunk |
| RenderToolModeOverlay | overlay tool-window tự gate |
| PresentOverlay | đã bọc `presentModeOpen &&` sẵn ở HomeScreen (cùng loại "modal gated" của phiếu) |

**GIỮ TĨNH** (luôn hiện / thân chính): LoginScreen · DongStudioHome · AppShell · RenderDocBar · StatusBar · ModeShell · **FlowCanvas** (thân chính — vì vậy d3/@xyflow còn lại trong chunk là ĐÚNG chốt) · CommentLayer · WelcomeIntro · StageIntroCard.

## ③ ĐO SAU (cùng điều kiện, cùng tab, hard-reload 2 lần)

| Số đo | Trước | Sau | Δ |
|---|---|---|---|
| `app/page.js` | 28.622.846 B | **24.246.364 B** | **−4,38 MB (−15,3%)** |
| `render/page.js` | 28.624.797 B | 24.248.315 B | −4,38 MB |
| Module trong chunk | 1.986 | **1.712** | **−274** |
| three-mesh-bvh / three-bvh-csg trong chunk | 82 / 44 | **0 / 0** | ra hẳn khỏi đường nạp Home |
| DCL / FCP / load | 449 / 480 / 1.209 ms | **379 / 408 / 1.041 ms** | −70 / −72 / −168 ms (dev, warm — tham khảo) |

Chunk tách nạp NỀN sau paint đúng thiết kế (GalleryPanel 32 KB · ChatPanel 38 KB · RenderToolModeOverlay 469 KB · MoodboardModal 378 KB…). NodeLibraryPanel/Render3DModeSkeleton chỉ nạp khi thật sự mở — đo thấy KHÔNG tải lúc navigator thu gọn.

## ④ NGHIỆM THU TỰ LÀM
- `npx tsc --noEmit` **0 lỗi** · `npm run soi:tu-dien` **0 lệch** · test liên quan `StoreHydrator.test.ts` (sucrase-node) **7 pass / 0 fail**.
- Browser (tab pane riêng, không đụng phiên Hoà): console **0 lỗi** qua 6 lượt kiểm; canvas Node render đủ (5 nút); mở navigator → NodeLibraryPanel nạp đầy đủ (search, chip lọc, TRÊN BẢNG, Mood+Cộng tác); PanelFlank hover-overlay trên rail thu gọn vẫn chạy; gạt "Vẽ 3D" → Render3DModeSkeleton nạp đủ (Command Panel · viewport · ViewCube · empty state đúng luật X2) rồi gạt về Node — tất cả qua đường dynamic, không lỗi, không đổi thị giác first-paint (login/gallery không mount cái nào trong dàn này).
- HMR sống bình thường trong suốt phiên (server 3000 không restart).

## ⑤ KHAI THẬT — chưa đo được [T0]
- **Cảm nhận hậu-login của chính Hoà** (bấm điều hướng về Home trên máy/phiên của Hoà) — chờ Hoà xác nhận hết lag rồi T mới flip entry.
- Số production (`next build`, gzip) chưa đo — phiếu chỉ cho đo trên server dev đang chạy; −15,3% dev là cận dưới hợp lý vì dev không tree-shake.
- Phần lag KHÔNG thuộc bundle (data-fetch sau mount: /api/auth/me ×2, /api/flows, specs, cursors poll — thấy trong network) vẫn còn nguyên, ngoài phạm vi phiếu; nếu Hoà vẫn thấy lag sau bản này thì nghi phạm kế tiếp là chuỗi fetch + double-effect StrictMode, cần phiếu riêng.
- Chunk `/` còn ~24 MB dev vì FlowCanvas (ReactFlow + d3) + AppShell + DongStudioHome giữ tĩnh đúng chốt; muốn giảm tiếp phải mở phiếu mới (vd tách widget DongStudioHome) — ngoài biên.

## Đề xuất lên T
1. Route anh em `/projects/[id]/render` hưởng sẵn (cùng HomeScreen). Các route studio khác (`/cad-editor`…) chưa soi — nếu Hoà than lag ở đó, mở phiếu tương tự.
2. Cân nhắc entry frontier phụ "đo bundle production" khi gần Cửa R1 (dev số chỉ tương đối).
