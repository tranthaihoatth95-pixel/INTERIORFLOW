# TECHNICAL GLOSSARY — Từ điển thuật ngữ InteriorFlow

> Giải nghĩa **tiếng Việt dễ hiểu** các thuật ngữ xuất hiện trong code/docs của dự án.
> Mỗi mục: nghĩa là gì (2–4 câu) + *"trong dự án này dùng ở đâu"* kèm file.
> Đọc kèm `FINAL_ARCHITECTURE_REPORT.md`.

---

## Máy học & gợi ý

**Pairwise Perceptron (perceptron học theo cặp)**
Một thuật toán máy học rất nhẹ: thay vì học "cái này tốt mấy điểm", nó học từ các **cặp so
sánh** — mỗi lần bạn Nhận gợi ý A và Bỏ gợi ý B, máy ghi nhận "A phải xếp trên B" và chỉnh
nhẹ bộ trọng số cho lần sau. Chạy thuần trên máy, không cần GPU hay mạng, và mỗi cú click chỉ
kéo model nhích một chút (không "giật" theo một lần bấm nhầm).
→ *Trong dự án:* `lib/gu/pairwise-perceptron.ts` — học gu bố cục từ nút Nhận/Bỏ ở LayoutShelf
(chặng Present); dưới 10 cặp thì chưa can thiệp, giữ thứ tự gợi ý gốc.

**Learning-to-rank (học để xếp hạng)**
Nhánh máy học mà mục tiêu không phải "đoán đúng nhãn" mà là **xếp danh sách theo thứ tự ưng
ý** — như Google xếp kết quả tìm kiếm. Pairwise perceptron ở trên là dạng đơn giản nhất của nó.
→ *Trong dự án:* xếp lại thứ tự 21 template gợi ý trong LayoutShelf theo gu từng người.

**L0 / L1 / L2 (3 tầng đặc trưng)**
Cách xếp bậc thang các "giác quan" của app theo chi phí: **L0** = thống kê tính ngay trên máy
(đếm pixel, đo hình học) — miễn phí, tức thì; **L1** = tra từ điển chữ nghĩa (tag, caption) —
cũng miễn phí; **L2** = gọi AI ngoài (embedding/VLM) — có phí và độ trễ, chỉ chạy khi có key.
Nguyên tắc: L0+L1 luôn chạy, L2 là tuỳ chọn; hết key thì tụt bậc và báo rõ, không hỏng việc.
→ *Trong dự án:* quy ước xuyên suốt `docs/ML-GU-ENGINE-PROPOSAL.md`; L0 CAD =
`lib/cad/gu-features.ts`, L0 màu = `lib/gu/color-psychology.ts`, L2 = `lib/ai/providers/`.

**Feature vector thưa (sparse feature vector)**
Cách mô tả một đối tượng cho máy học bằng danh sách "tên đặc trưng → con số", và chỉ ghi
những đặc trưng khác 0 (nên gọi là "thưa"). Ví dụ một slide: `img.count: 0.4, pal.warm: 0.8`.
Muốn model giải thích được thì tên đặc trưng phải thống nhất toàn hệ thống.
→ *Trong dự án:* `lib/gu/feature-dict.ts` — từ điển chuẩn hoá tên + thang đo (~0..1) cho cả
3 chặng; perceptron học trực tiếp trên vector này.

**Heuristic (mẹo luật)**
Cách giải bài toán bằng **luật kinh nghiệm** viết tay thay vì model học: "thấy giường → khả
năng là nhà ở", "ô mỏng nằm cao → là tiêu đề". Ưu điểm: tất định (cùng input luôn cùng
output), giải thích được, 0 chi phí. Dự án này chủ trương heuristic-first, ML chỉ bồi thêm.
→ *Trong dự án:* `lib/cad/operator-profile.ts` (đoán loại không gian bằng trọng số
block × phòng × chữ), `lib/present-editor/region-layout.ts` (gán vai trò ô bằng hình học).

**Typology (kiểu hình bố cục)**
Nhãn phân loại "dáng" tổng thể của một mặt bằng: **linear** (một trục dài), **island** (cụm
đảo giữa), **perimeter** (bám chu vi), **open-plan** (mở thoáng), **cellular** (chia ô phòng
kín). Là ngôn ngữ chung của dân quy hoạch không gian.
→ *Trong dự án:* `lib/cad/gu-features.ts` suy typology từ occupancy grid + quan hệ tường,
rồi bơm vào operator-profile như tín hiệu phụ.

**Occupancy Grid (lưới chiếm chỗ)**
Chia mặt bằng thành lưới đều (ở đây 8×8) rồi đo mỗi ô "đặc" bao nhiêu phần nội thất. Biến một
bản vẽ phức tạp thành 64 con số — đủ để so sánh hai mặt bằng "dáng" giống hay khác nhau.
→ *Trong dự án:* `lib/cad/gu-features.ts` — tầng đặc trưng L0 của chặng CAD.

**Softmax**
Phép toán đổi một dãy điểm số thô thành **phần trăm độ tin** cộng lại bằng 100%. Nhờ nó app
nói được "residential 59%" thay vì một con số vô hướng khó hiểu.
→ *Trong dự án:* bước cuối của `lib/cad/operator-profile.ts` trước khi trả `confidence`.

## Xử lý ảnh & màu

**Projection Profile (biên dạng chiếu)**
Kỹ thuật dò bố cục ảnh: "ép" ảnh theo phương ngang và dọc thành hai đồ thị đậm–nhạt; chỗ trũng
của đồ thị chính là khe trống (gutter) giữa các khối nội dung → suy ra lưới. Hợp với slide
(ít vùng, khe sạch, thẳng trục), không hợp với collage ảnh chồng lộn xộn.
→ *Trong dự án:* `lib/present-editor/detect-regions.ts` — nhận diện lưới từ ảnh bố cục tham
khảo, chạy trên bản đồ cạnh (gradient) nên nền trắng hay đen đều dò được.

**LAB / ΔE (Delta-E)**
**LAB** là không gian màu thiết kế theo mắt người: khoảng cách giữa 2 điểm màu trong LAB xấp
xỉ mức "nhìn khác nhau" thật sự (khác RGB — nơi 2 màu gần số nhưng nhìn khác hẳn). **ΔE** là
con số đo khoảng cách đó; ΔE < ~2 coi như mắt thường không phân biệt. Dùng để gom màu "cùng
họ" thay vì so mã hex khít từng ký tự.
→ *Trong dự án:* `lib/gu/color-psychology.ts` (sRGB→XYZ→CIELAB, gom palette, ánh xạ
tâm-lý-màu) và feature `pal.*` trong `lib/gu/feature-dict.ts`.

## Hình học CAD

**DCEL (Doubly-Connected Edge List — danh sách cạnh nối kép / nửa-cạnh)**
Cấu trúc dữ liệu hình học kinh điển: mỗi đoạn thẳng tách thành 2 "nửa-cạnh" ngược chiều; đi
men theo các nửa-cạnh sẽ liệt kê được **mọi mặt kín** của bản vẽ — tức là mọi căn phòng — kể
cả khi tường giao nhau chữ T hay bản vẽ là đống đoạn rời rạc. Đáng tin hơn hẳn mẹo "rẽ góc
nhỏ nhất" cục bộ.
→ *Trong dự án:* `lib/cad/hatch.ts` — tìm biên phòng để tô hatch và đo diện tích; là nền của
checker tiêu chuẩn (bếp bao nhiêu m² là đo từ đây). Fix T-junction `fd4718d`.

**Shoelace (công thức dây giày)**
Công thức tính diện tích đa giác từ toạ độ các đỉnh, nhân chéo như xỏ dây giày. Có dấu:
dương = đỉnh đi ngược kim đồng hồ — dùng luôn dấu đó để biết mặt nào là "mặt trong".
→ *Trong dự án:* `lib/cad/hatch.ts` (`polygonArea`) — đo diện tích phòng cho checker.

## Trình bày & UI

**Bento Grid (lưới bento)**
Kiểu dàn trang chia khối to nhỏ xen kẽ như hộp cơm bento Nhật — mỗi ô một ý, ô quan trọng to
hơn. Quy ước ngành: một trang bento đẹp thường 6–9 ô, quá số đó là loãng.
→ *Trong dự án:* `lib/present-editor/standards.ts` (`DECK_STANDARDS` — ngân sách ô/trang) và
`region-layout.ts` (kẹp số ô về budget).

**Glassmorphism / Liquid Glass (hiệu ứng kính mờ)**
Ngôn ngữ UI cho các mảng giao diện trông như tấm kính mờ: nền phía sau xuyên qua nhưng bị
blur + tăng bão hoà màu, tạo cảm giác sang và có lớp lang (kiểu macOS/visionOS).
→ *Trong dự án:* màn Login (backdrop `saturate(1.8) blur(40px)`, 4 preset nền) và Unified
Dock `.if-dock` (Header + StudioBar) — verify ở cổng Sprint 2, `CHANGELOG.md` 14/07.

**Toast**
Mẩu thông báo nhỏ tự hiện rồi tự biến mất ở góc màn hình — đủ để nhắc, không chặn thao tác.
→ *Trong dự án:* guardrail dàn trang (`lib/present-editor/layout-check.ts` → PresentEditor)
và xác nhận "Đưa sang Present →".

**Guardrail (rào chắn mềm)**
Cơ chế kiểm tra tự động chỉ **cảnh báo** khi kết quả lệch chuẩn (trang quá trống/chật/tràn
chữ) chứ không tự sửa — đúng triết lý "người luôn quyết".
→ *Trong dự án:* `lib/present-editor/layout-check.ts`; phía CAD là
`lib/cad/standards/checker.ts` (chỉ đọc + gợi ý).

## Dữ liệu & hạ tầng

**IndexedDB (IDB)**
Cơ sở dữ liệu có sẵn **bên trong trình duyệt**, lưu được dữ liệu lớn (hàng trăm MB, theo dung
lượng đĩa) — khác localStorage vốn trần ~5MB. Dữ liệu nằm trên máy người dùng, mất mạng vẫn đọc được.
→ *Trong dự án:* `lib/sheets-persist.ts` — autosave cả bộ sheet (≤5) khoá `userId::route`;
deck Present nhúng ảnh dataURL hàng trăm KB nên localStorage không kham nổi.

**SQLite / Postgres (Supabase)**
Hai "két" dữ liệu server: **SQLite** = cả database là 1 file trên máy (hợp bản desktop, copy
file là backup); **Postgres** = database server thực thụ (hợp bản cloud nhiều người dùng —
dự án dùng qua dịch vụ Supabase).
→ *Trong dự án:* `prisma/schema.prisma` mặc định SQLite (`prisma/dev.db`); lên Vercel đổi
provider theo `docs/DEPLOY-VERCEL.md`.

**Prisma / Migration / Drift**
**Prisma** là lớp trung gian để code TypeScript nói chuyện với database qua schema khai báo.
**Migration** là các "biên bản" từng lần đổi cấu trúc bảng. **Drift** = database thật đã lệch
so với chồng biên bản (do có lần đổi bảng không qua migration) — lúc này chạy
`migrate reset` sẽ XOÁ SẠCH dữ liệu để làm lại từ biên bản.
→ *Trong dự án:* drift ở bảng IntegrationAccount → luật cứng: chỉ dùng `prisma db push`
(đồng bộ thẳng schema→DB, không đụng biên bản), **cấm reset** (`STATUS.md` mục Nợ kỹ thuật).

**Seed script**
Script chạy tay một lần để "gieo" dữ liệu khởi đầu vào database — ở đây là tài khoản admin
đầu tiên, vì cửa đăng ký công khai đã khoá vĩnh viễn (403). Viết kiểu **idempotent**: chạy
lại bao nhiêu lần cũng không tạo trùng (upsert theo email).
→ *Trong dự án:* `scripts/seed-admin.ts` — tạo admin mới hoặc reset mật khẩu admin
(`SEED_ADMIN_EMAIL=… SEED_ADMIN_PASSWORD=… node_modules/.bin/sucrase-node scripts/seed-admin.ts`).

**Grandfather policy (chính sách "ông giữ ghế")**
Khi siết luật mới, những ai **đã ở trong hệ thống từ trước** được giữ nguyên quyền cũ — luật
mới chỉ áp cho người đến sau. Tránh khoá nhầm người đang dùng thật.
→ *Trong dự án:* `lib/server/auth-policy.ts` — Google OAuth chỉ cho tạo mới với email
@ttt.vn, nhưng user Google ngoài domain đã có trong DB vẫn đăng nhập bình thường.

**JWT (JSON Web Token)**
"Thẻ ra vào" điện tử: server ký một chuỗi chứa danh tính + hạn dùng; các request sau chỉ cần
trình thẻ, server kiểm chữ ký là tin — không phải tra DB mỗi lần. Chữ ký dựa trên khoá bí mật
`AUTH_SECRET`, lộ khoá là ai cũng in được thẻ.
→ *Trong dự án:* phiên đăng nhập (`lib/server/auth.ts`, thư viện jose); Remember-Me = cùng
thẻ nhưng hạn 30 ngày thay vì hết phiên.

**PWA / Service Worker**
**PWA** (Progressive Web App): trang web cài được lên màn hình chính điện thoại/iPad và chạy
như app thật (toàn màn hình, có icon). **Service worker** là đoạn script nằm giữa app và
mạng, lo cache để mở nhanh. Cần 2 file: manifest (khai tên/icon) + sw.js.
→ *Trong dự án:* `public/manifest.webmanifest` + `public/sw.js`, headers trong
`next.config.mjs`; deploy theo `docs/DEPLOY-VERCEL.md`.

**Electron**
Khung đóng gói web-app thành **app desktop thật** (.dmg/.exe): bên trong là một trình duyệt
Chromium + Node.js riêng, nên toàn bộ code web chạy nguyên xi mà có cửa sổ, icon, Start Menu.
Đổi lại file cài to (chở cả trình duyệt theo).
→ *Trong dự án:* `electron/main.js` — mở app là tự chạy server Next nội bộ (cổng ≥3777, chỉ
127.0.0.1) rồi mở cửa sổ trỏ vào; DB + uploads trỏ về thư mục userData. Build:
`npm run electron:build:mac` / `docs/BUILD-WINDOWS.md`.

## Quy trình phát triển

**Worktree (git worktree)**
Tính năng của git cho phép **một repo mở ra nhiều thư mục làm việc**, mỗi thư mục một nhánh —
nhiều agent/người làm song song không giẫm file của nhau, xong việc merge lại. Khác với
copy thư mục thủ công: mọi worktree chung một lịch sử git.
→ *Trong dự án:* luật ở `CLAUDE.md` — tối đa 3 worktree, đặt tên `interiorflow-wt-{nhánh}`,
merge xong xoá ngay; node_modules dùng symlink sang repo chính để khỏi cài lại.

**Handoff / Bridge (bàn giao giữa chặng)**
Kỹ thuật chuyển dữ liệu giữa 2 màn hình không chung bộ nhớ (2 route khác nhau): chặng trước
"gửi" gói dữ liệu vào chỗ tạm (sessionStorage), chặng sau mở lên "nhận" đúng một lần rồi dọn
(consume-once) — không nhận trùng khi màn hình vẽ lại.
→ *Trong dự án:* `lib/cad/handoff.ts` (CAD→Render) và `lib/present-editor/handoff.ts`
(Render→Present, nút "Đưa sang Present →"; có fallback khi ảnh to vỡ quota sessionStorage).

**Hydration (ngậm nước)**
Bước Next.js "thổi hồn" vào trang: HTML tĩnh render sẵn từ server được React phía client
tiếp quản. Nếu client vẽ ra khác server (vd server không biết máy là Mac hay Win để in ⌘ hay
Ctrl) sẽ có cảnh báo hydration mismatch.
→ *Trong dự án:* nợ kỹ thuật tooltip phím tắt ⌘Z/Ctrl+Z (`lib/kbd.ts:11` + CadToolbar) —
cosmetic, ghi ở `STATUS.md`.

**Idempotent (lặp vô hại)**
Tính chất của thao tác mà chạy 1 lần hay 10 lần kết quả y nhau — an toàn để chạy lại khi
không nhớ đã chạy chưa.
→ *Trong dự án:* `scripts/seed-admin.ts` (upsert), autosave sheet, `prisma db push`.

**Tất định (deterministic)**
Cùng đầu vào **luôn** cho cùng đầu ra — không ngẫu nhiên, không phụ thuộc mạng. Là tiêu chí
để mọi tầng L0/L1 test được bằng máy và tin được bằng người.
→ *Trong dự án:* toàn bộ operator-profile, gu-features, color-psychology, detect-regions
đều tất định — nhờ vậy có 492 test chạy thẳng bằng sucrase-node.

## Tiêu chuẩn ngành (trong checker CAD)

**TCVN / QCVN**
Hệ tiêu chuẩn (TCVN — khuyến nghị) và quy chuẩn (QCVN — bắt buộc) của Việt Nam. Dự án dùng
TCVN 4451:2012 (nhà ở — vd bếp tối thiểu 10m²) và QCVN 06:2022/BXD + Sửa đổi 1:2023 (an toàn
cháy).
→ *Trong dự án:* `lib/cad/standards/vn-residential.ts`, `vn-fire.ts` — checker đối chiếu
bản vẽ và giải thích từng cảnh báo.

**NFPA 101 / IBC**
Bộ chuẩn an toàn sinh mạng (NFPA 101 — Life Safety Code) và bộ luật xây dựng mẫu (IBC) của
Mỹ, hay được tham chiếu quốc tế cho lối thoát hiểm, bề rộng cửa, khoảng cách thoát nạn.
→ *Trong dự án:* `lib/cad/standards/intl-egress.ts` (22 test) — bổ trợ khi dự án có yêu cầu
chuẩn quốc tế.

**Neufert**
"Architects' Data" của Ernst Neufert — cuốn cẩm nang nhân trắc kinh điển của ngành: người
cần bao nhiêu chỗ để ngồi, đi lại, mở tủ; bàn ghế giường tủ kích thước chuẩn bao nhiêu.
→ *Trong dự án:* `lib/cad/standards/neufert.ts` — rule khoảng lưu thông/kích thước đồ đạc
trong checker.
