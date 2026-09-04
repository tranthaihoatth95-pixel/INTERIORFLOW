# BOOTSTRAP REPORT — Lead Architect / Delivery Orchestrator

**Ngày** 04/09/2026 · **REPO_ROOT** `/home/user/INTERIORFLOW` · **Nhánh** `claude/interiorflow-design-system-vbdcku` · **HEAD** `5749161`
**Phạm vi lượt này** BOOTSTRAP ONLY — 0 feature work, đúng lệnh chủ dự án.

Mọi phát hiện gắn nhãn: **OBSERVED** (đo tại nguồn) · **INFERENCE** (suy ra, chưa đo) · **PROPOSED** (đề xuất, chưa ai duyệt) · **DECIDED** (đã có người quyết). Không mục nào được nâng cấp nhãn.

---

## 1 · CURRENT STATE

| Hạng mục | Đo được | Nhãn |
|---|---|---|
| Khung | Next.js 14.2.35 App Router · TypeScript strict · Prisma/SQLite · Electron 33 · React Flow 12.11.1 · three.js | OBSERVED |
| Bề mặt | **26 trang** (`app/**/page.tsx`) · **70 API route** | OBSERVED |
| Git | cây sạch · 0 stash · 1 worktree · ahead 1 / behind 1 so `origin/main` | OBSERVED |
| Build sản phẩm | `npm run build` **exit 0**, 96 mục route, chỉ có warning | VERIFIED |
| Khởi động | `next start` Ready 339ms · `/` 200 · `/login` 200 · `/api/health` 200 | VERIFIED |
| Cửa auth | `/api/{auth/me,dashboard,projects,library,tasks}` → **401 có thân JSON**, không sập | VERIFIED |
| Môi trường | **KHÔNG có `.env`** · **KHÔNG có `prisma/dev.db`** · `.env.example` 44 khoá | OBSERVED |
| CI | **KHÔNG có `.github/workflows`** — không máy nào chạy tự động khi mở PR | OBSERVED |
| Sổ hoàn thành (`soi:frontier`) | 👁 **1 qua mắt** · ✅ **76 xong-MÁY** · ⬜ **57 chờ** · 🔴 **0 lệch** | OBSERVED |

**Đọc một câu:** app **chạy được và dựng được**; thứ thiếu không phải mã, mà là **xác nhận bằng mắt người** và **môi trường chạy dữ liệu**.

---

## 2 · VERIFIED (đã tự chạy, có số)

- **Production build PASS** — exit 0.
- **Runtime boot PASS** — server lên, trang công khai 200, API health 200.
- **Cửa auth PASS (graceful)** — route cần DB trả 401 đúng khuôn, không 500, không crash.
- **Máy soi nội bộ**: `soi:frontier` 0 lệch · `soi:contract` 🔗21 có dây / 🟡1 chờ / 🔴0 · `soi:cam-dien` 🟢86 sống / 🔵10 nội bộ / 🔴1 kho chưa mở / 📄19 tệp mồ côi · `soi:hinh-hoc` 26 ngoài thang.
- **Bộ nền chrome (Slice 9)** — đo bằng Chromium thật, hai theme: vòng focus bắt qua đường **bàn phím**, inspector **không kính**, nhãn nguồn giữ viền đứt/chấm khi mất màu. Máy đo nay nằm trong repo: `scripts/nen-chrome/`.

**UNVERIFIED (nói thẳng):** chưa chạy được **workflow lõi nào end-to-end** (vẽ 2D → dựng 3D → render → deck → BOQ), vì không có DB. Mọi khẳng định về workflow trong lượt này là INFERENCE.

---

## 3 · CRITICAL GAPS

### P0 — chặn xác minh, phải xử trước tiên
1. **Không có `.env` + không có `prisma/dev.db`** ⇒ 5 tệp test chết `PrismaClientInitializationError`, `npm test` **EXIT 123**, và **không workflow lõi nào kiểm được**. `db push`/`migrate` **không được chạy qua sandbox** (luật vận hành 1) ⇒ **cần chủ dự án chạy trên máy thật**, hoặc cho phép dựng DB tạm chỉ để kiểm.
   *Nhãn: OBSERVED (hiện trạng) · PROPOSED (cách xử).*

### P1 — workflow lõi chưa đóng
2. **57 mục ⬜ chờ** trong sổ frontier — chia theo vai: **⭐MVP 20 · 🔗kết nối 16 · 🧰đỡ 21**; theo hệ: `DocCore` 21 · `Workspace` 14 · `TriTueDuAn` 14 · còn lại 8. Chưa mục nào có bằng chứng chạy end-to-end.
3. **41 dấu "chưa cắm / not implemented"** trong mã · **15 TODO/FIXME** · **1 kho chưa mở** (`lib/slide-templates.ts`, 229 dòng, 0 nơi gọi) · **19 tệp mồ côi**.

### P2 — integration
4. **Không có CI**: PR #8 đang mở và sẽ **không bao giờ có check nào báo**. Mọi cổng chất lượng hiện chạy bằng tay.

### P3 — UI lệch Design Authority
5. **DRIFT so với chốt EXS 20/08** — 🔧 *đính chính 04/09 sau khi đo lại tại nguồn:* mục `BE_RONG_NAC` 28 → 52-56 tôi ghi **SAI**, main **đã có** rail BA CỤM và ba nấc 52/240/320 (`components/nav/muc-dieu-huong.test.ts:170` khẳng định, commit `3e1dde32` EXS-BUILD-1). Còn lại đúng là chưa có: **trần Work Panel 320 → 440** · **bento hero 2×2 Resume** · **nguyên thể aperture**. Hai mục đầu và cuối đã tìm thấy bản thi công trên `backup/2026-08-19-batch0a` (`components/studio/VitalsAperture.tsx`, commit `fbd65213`) — xem `docs/delivery/CLOUD-SESSION-LEDGER.md` §6.
6. **Nợ di trú của Slice 9** (đã khai trong PR #8, ngoài phạm vi slice đó): 18 vòng focus tự chế bám `--accent-ring` (~2:1) chưa đổi sang `--focus-ring` · 82 `backdrop-filter` viết tay chưa qua `Surface` · ~20 `zIndex` số trần chưa qua `--z-*` · `--tap-chinh` khai rồi nhưng chưa rail/dock nào đọc.
7. `soi:thao-tac` 🔴4 lệch: `outline-can-focus-visible` 32 tệp · `cam-hex-inline` 186 chỗ · `keydown-ne-o-nhap` 1 tệp · `kinh-webkit-prefix` 2 tệp — **2 tệp cuối là báo nhầm**, đã kiểm: cả `components/ui/Surface.tsx` lẫn `components/SearchProjectsInput.tsx:94` chỉ nhắc `backdrop-filter` **trong lời chú thích**, 0 dòng thật; regex của máy soi khớp cả comment. *OBSERVED.*

### NÚT THẮT THẬT
> **76 mục xong-MÁY / 1 mục qua mắt.** Đây là con số quyết định lộ trình: khối lượng mã không phải nút cổ chai — **băng thông duyệt mắt của chủ dự án** mới là. Mọi kế hoạch không giải bài này sẽ chỉ làm con số 76 phình thêm.

---

## 4 · DESIGN AUTHORITY

**Nguồn có thẩm quyền, xếp theo thứ bậc** (OBSERVED):
1. `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` — 12 điều, **Hoà duyệt mắt PASS 20/08**. Chốt hiện hành cho trải nghiệm.
2. `docs/IF-ARCHITECTURE-BLUEPRINT.md` v1.0 — B1..B25, gồm **B25 luật NO-REBUILD** (LOOK INSIDE → MAP → CLASSIFY → CONNECT → EXTEND → NEW; NEW đòi 6 mục bằng chứng phủ định).
3. `docs/IF-KIEN-TRUC.md` — bản đồ sống (cốt lõi + cập nhật theo ngày).
4. `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` (NT-1..18) + `docs/nc/NC-TRIET-LY-GIAO-DIEN-2026-08-14.md` (KB-1..5) — hiến pháp giao diện.
5. `docs/SPEC-DESIGN-SYSTEM-IF.md` §7 · `docs/mocks/` (116 tệp) · `docs/nc/REF-VISUAL-EXS-2026-08-20.md` (R1-R16).

**🔴 HARD STOP còn hiệu lực** — `CHOT-EXPERIENCE-SYSTEM` dòng 7: *"File này là BẢN CHỐT; thi công vẫn chờ Hoà eye-approve từng board (HARD STOP phiếu EXS giữ nguyên)."* ⇒ **Không được khởi công thi công UI theo EXS cho tới khi chủ dự án mở cổng từng board.**

---

## 5 · COMPLETION MAP

| Bề mặt / Luồng | Hiện trạng | Trạng thái mong đợi | Khoảng cách | Phụ thuộc | Authority | Xác minh bằng | Trạng thái |
|---|---|---|---|---|---|---|---|
| Build + khởi động | build 0, boot 200 | như hiện tại | — | — | — | build + curl | ✅ VERIFIED |
| Bộ nền chrome (token/Surface/Truth/focus) | landed, đo Chromium | rail·dock·inspector đọc token | 18 focus + 82 kính + 20 z chưa di trú | — | SPEC-DS §7, NT/KB | `scripts/nen-chrome` + test token | 🟡 một phần |
| Auth + phiên | 401 đúng khuôn | đăng nhập chạy thật | thiếu DB | **P0 .env/DB** | — | thao tác thật | ⛔ UNVERIFIED |
| 2D Kỹ thuật (`/projects/[id]/cad`) | route 200 (có auth) | vẽ→lưu→mở lại | chưa chạy được | P0 | Blueprint | thao tác thật | ⛔ UNVERIFIED |
| 3D Thiết kế (`render`) | route có | dựng khối→vật liệu→render | chưa chạy được | P0 | Blueprint | thao tác thật | ⛔ UNVERIFIED |
| Trình bày (`present`) | route có | deck→xuất PDF/PPTX | chưa chạy được | P0 + LUẬT chuẩn đầu ra | CHUAN-DAU-RA-NGHE | **mở tệp đầu ra soi** | ⛔ UNVERIFIED |
| Thư viện / Vật liệu | route 200 | `.idfc` một vật ba mặt | `resolve.ts` có dây, **chưa cắm điện** | P0 | 00-CHOT 07/08 | test + thao tác | 🟡 một phần |
| Files hai tầng | có route | 2 tầng + Collection+ | chưa dựng theo chốt 17/08 | Design Authority | IF-KIEN-TRUC §5 | duyệt mắt | ⬜ chưa |
| Sidebar router | HAI CỤM | **BA CỤM** (EXS) | drift | **DECISION #2** | EXS điều 2 | duyệt mắt | ⛔ chờ quyết |
| Vitals | neo theo ngữ cảnh | **Aperture top-edge** (EXS) | drift | **DECISION #2** | EXS điều 4 | duyệt mắt | ⛔ chờ quyết |
| 76 mục "xong-MÁY" | mã xong | qua mắt chủ dự án | **75 mục chưa ai nhìn** | băng thông Hoà | — | cửa duyệt mắt | ⛔ UNVERIFIED |

---

## 6 · EXECUTION PLAN (đề xuất — PROPOSED, chờ chủ dự án gật)

**W0 · MỞ KHOÁ XÁC MINH** *(chặn mọi thứ khác)*
Dựng `.env` + DB chạy được → `npm test` xanh → chạy thử 1 workflow lõi đầu tiên.
*Cần chủ dự án: chạy lệnh Prisma trên máy thật, hoặc cho phép dựng DB tạm chỉ để kiểm.*

**W1 · CỬA DUYỆT MẮT THÀNH DÂY CHUYỀN** *(giải nút thắt 76/1)*
`scripts/chup-man-duyet-mat.mjs` đã có sẵn và đúng việc — chỉ cần chạy được (phụ thuộc W0), rồi đổ ảnh theo lô để chủ dự án duyệt trên điện thoại. Mỗi lô ~20 phút của Hoà đổi lấy hàng chục mục đóng.

**W2 · TRẢ NỢ DI TRÚ BỘ NỀN** *(không cần duyệt mắt, không đổi hình)*
18 vòng focus → `--focus-ring` · 82 `backdrop-filter` → `Surface` · 20 `zIndex` → `--z-*` · sửa regex `kinh-webkit-prefix` cho hết báo nhầm. Đây là việc **đóng lệch máy soi**, rủi ro thấp nhất.

**W3 · CẮM ĐIỆN VẬT LIỆU MỘT VẬT** *(phiếu P-T đã soạn)*
`lib/materials/resolve.ts` có đủ ba mặt, 0 nơi gọi. Cắm vào nơi tiêu thụ, giữ luật *trỏ tới bản ghi thương mại, không chép giá*.

**W4 · UI THEO EXS** — ⛔ **KHOÁ** cho tới khi HARD STOP được mở từng board.

**W5 · CI tối thiểu** — 1 workflow chạy `tsc` + test + 5 máy soi, để PR có check thật.

---

## 7 · PARALLEL PLAN

| Làn | Việc | Phạm vi tệp (khoá chống va) | Phụ thuộc |
|---|---|---|---|
| A | W0 môi trường + DB | `.env`, `prisma/` | **không** — chạy trước |
| B | W2 di trú focus/kính/z | `components/**` (trừ `components/ui/Surface.tsx`), `app/globals.css` | không |
| C | W3 cắm điện vật liệu | `lib/materials/**`, nơi gọi | A (để test) |
| D | W5 CI | `.github/workflows/` | không |
| E | W1 chụp màn duyệt mắt | `scripts/chup-man-duyet-mat.mjs` | **A** |

B, D chạy được **ngay**, song song, không đụng nhau. C, E chờ A.
Khoá phạm vi phải khai **cả định danh** (tên token/lệnh), không chỉ đường dẫn — bài học `claim-keys-va-cham` 16/08.

---

## 8 · DECISIONS REQUIRED

> Bốn mục dưới đây **tôi không tự quyết**. Ba mục đầu là xung đột authority hoặc quyền của chủ dự án.

**D1 · HARD STOP của EXS — mở hay giữ?**
`CHOT-EXPERIENCE-SYSTEM` vừa là *bản chốt đã duyệt mắt* vừa ghi *"thi công vẫn chờ eye-approve từng board"*. ⇒ Không rõ được phép khởi công board nào. **Cần**: danh sách board được mở, hoặc xác nhận giữ khoá toàn bộ.

**D2 · Hai chốt SUPERSEDED chưa được phản chiếu vào bản đồ**
EXS 20/08 đè: ① sidebar HAI CỤM (16-17/08) → **BA CỤM** ② Vitals neo-theo-ngữ-cảnh (16/08) → **Aperture top-edge**. Nhưng `IF-ARCHITECTURE-MAP §2.2` và `Blueprint B6` **vẫn ghi bản cũ**. ⇒ **DECISION CONFLICT**: hai văn bản authority nói ngược nhau. Tôi không tự chọn. **Cần**: xác nhận EXS thắng, để tôi đi sửa MAP + Blueprint cho khớp (hoặc ngược lại).

**D3 · Môi trường DB để xác minh**
Luật vận hành cấm chạy `prisma db push`/`migrate` qua sandbox. **Cần chọn**: (a) chủ dự án chạy trên máy thật rồi tôi kiểm từ xa, hay (b) cho phép tôi dựng DB **tạm, dùng-xong-bỏ** chỉ để chạy test/workflow, không đụng dữ liệu thật.

**D4 · Bảy câu EXS còn treo** *(nhắc lại, không mới)*
V3 Engage = V3-a? · chỗ đặt bộ chọn model · màu badge đếm · R2 direct↔proximity-1 · màu quầng presence — **đang kẹt vì màu nhấn thứ hai (mòng két ↔ mận) chưa chốt** · chỗ đặt Collage · số-tại-vật.

---

## 9 · NEXT ACTION

**Việc đầu tiên tôi sẽ dispatch ngay khi chủ dự án xác nhận bootstrap:**

> **Làn B · W2 — trả nợ di trú bộ nền chrome.**

Vì sao chọn nó làm việc đầu:
- **Không chặn bởi bất kỳ decision nào** ở §8 — không đổi hình, không đụng Design Authority, chỉ đưa mã đang tự chế về token đã có.
- **Không cần DB**, chạy được ngay trong khi chờ D3.
- Đóng đúng phần lệch mà máy soi **đang báo đỏ** (`outline-can-focus-visible` 32 tệp), tức có **cửa nghiệm thu tự động**, không cần băng thông mắt của chủ dự án.
- Đúng thứ tự `PRESERVE > REPAIR > COMPLETE` — sửa cái đã có trước khi làm cái mới.

Song song, làn D (CI tối thiểu) cũng chạy được ngay nếu chủ dự án muốn PR có check thật.

**Tôi DỪNG ở đây và chờ.** Không khởi công feature nào.
