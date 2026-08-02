# NC-2 · TIMELINE EDITOR — CapCut / Canva / Descript
**COWORK-NC · 02/08/2026 tối.** Nuôi: `SPEC-TRINH-VIDEO-EDITOR` (COWORK-TRÌNH đang chờ) — editor Video chặng 3 ăn footage `captureSequence`.
**Luật khung đã chốt:** `CHOT-VIDEO-2-TANG` — ② Dựng = chặng 3, *"chỉ edit CapCut, KHÔNG viết engine video"*. `SPEC-VIDEO-MAT-BANG` §0.4 — trong IF chỉ *xếp thứ tự · cắt đầu đuôi · chèn tiếng*. Phạm vi ticket: track/trim/nhạc/chữ.

---

## 1 · Ba mô hình timeline — track-first / page-first / text-first

| | CapCut (desktop) | Canva Video | Descript |
|---|---|---|---|
| Đơn vị tư duy | **Track**: video chính 1 track, audio/overlay/chữ mỗi loại 1 track dưới; track có nhãn + màu | **Page/Scene**: mỗi trang = 1 clip, xếp ngang như slide | **Script**: transcript là bản edit; **Scene** = dấu `/` trong script, "như slide trong presentation" |
| Trim/cắt | kéo handle 2 đầu clip; **Split Ctrl+B** tại playhead; right-click "close gap" khép khoảng trống | kéo 2 đầu page trên strip; trim audio bằng pill | sửa/xoá CHỮ trong transcript → video tự cắt; Split trên timeline khi cần |
| Timeline chi tiết | luôn hiện, là mặt bàn chính | strip đơn giản dưới canvas | **mặc định COLLAPSED** — kéo handle mở ra khi cần chỉnh tinh; storyboard view = scene dạng tile |
| Nhịp theo beat | right-click track → **Auto Beat Sync**; marker phím **M**; **Auto Cut** (AI): 3 trigger — Music Beat · Speech Pause · AI Script (gõ lệnh "make a 30-second highlight reel"); Auto Cut KHÔNG có trên bản Web (2026) | **Beat Sync**: AI dò beat → **snap point trên audio pill**; free = "Display beat markers" rồi kéo tay clip hít vào marker; Pro = nút **"Sync now"** tự trim mỗi page tới beat đầu của bar gần nhất; chỉ có ở doctype Presentation/Social/Video | không làm beat-sync (trọng tâm là lời nói) |
| Chữ | Text → **Auto Captions** (Recognize theo track audio); caption template | text element trên page, animation theo template | captions sinh từ transcript (bản chất của app) |
| Chuyển cảnh | thư viện transition lớn | transition giữa page | transition giữa scene; layer kéo dài xuyên nhiều scene được |
| Layer trong 1 đơn vị | mọi thứ nằm trên track | element trên page (mô hình design sẵn có của Canva) | mỗi scene chứa layer riêng (video, title, b-roll, ảnh) |

Nguồn: [CapCut track/trim tips](https://pexo.ai/blog/capcut-tips-and-tricks-9869) · [CapCut Auto Cut (help chính hãng, 02/2026)](https://www.capcut.com/help/how-to-use-auto-cut) · [CapCut Auto Captions](https://www.capcut.com/help/auto-captions-in-capcut) · [CapCut beat-based editing](https://cursa.app/en/page/beat-based-editing-in-capcut-syncing-cuts-transitions-and-motion-to-music) · [Canva Beat Sync (feature page)](https://www.canva.com/features/beat-sync/) · [Canva sync audio help](https://www.canva.com/help/syncing-audio-with-video/) · [Descript Scenes overview (help chính hãng)](https://help.descript.com/hc/en-us/articles/10248939749517-Scenes-overview) · [Descript Timeline overview](https://help.descript.com/hc/en-us/articles/10249275208717-Timeline-overview)

**Đọc ra bản chất:** CapCut = NLE thật cho người chịu học; Canva = giấu NLE sau mô hình page; Descript = thay NLE bằng đơn vị NGỮ NGHĨA (chữ nói). Footage của IF cũng CÓ NGỮ NGHĨA sẵn (mỗi shot = 1 đoạn đường cam qua phòng nào, bậc mấy) → IF gần Descript/Canva hơn CapCut: đơn vị edit nên là SHOT có tên, không phải giây vô danh.

---

## 2 · Than phiền cộng đồng — 2 vụ lớn, cả 2 đều là bài học chiến lược

### 2a · CapCut nhốt tính năng sau paywall (2024) — cộng đồng nổi loạn
- 08/2024: Motion Blur + Smooth Slow-motion thành Pro; cuối 2024 thêm **Auto Captions, Loudness, Stabilization**; **export không watermark cũng thành Pro**; cắt luôn 1 GB cloud miễn phí. ([Capcut Wiki "Pro Controversy"](https://capcut.fandom.com/wiki/Pro_Controversy), [vediting tổng hợp 11/2025](https://vediting.home.blog/2025/11/30/capcut-features-locked-behind-paywall-after-update-whats-going-on-how-to-deal-with-it/))
- Petition ["Make CapCut free again"](https://www.change.org/p/make-capcut-free-again-307c78ee-7202-4316-a230-ed1bf02fd703) trên Change.org; [Newsweek đưa tin giá sub tăng ~gấp đôi qua đêm](https://www.newsweek.com/app-used-millions-nearly-doubles-subscription-price-overnight-11535999); báo tech viết bài chia tay ([Android Authority "I am ditching CapCut"](https://www.androidauthority.com/i-am-ditching-capcut-3545614/)).
- → Chuẩn "CapCut-level" trong miệng người dùng 2026 = *thứ họ từng có free và bị tước mất*. Video 0-credit của IF đánh thẳng vào vết thương này.

### 2b · Canva Video Editor 2.0 (2025-26) — ép NLE lên non-editor, rollout đổ vỡ
Nguồn: [soloshannon "Canva is Broken and I Almost Lost a Brand Deal"](https://soloshannon.substack.com/p/canva-is-broken-and-i-almost-lost) + Reddit/Trustpilot dẫn trong bài:
- Editor mới "như phần mềm cho film editor — timeline, playhead, ripple edit, layer dependency — **ngoại ngữ với core user của Canva**" (giáo viên, chủ shop, solo creator *chọn Canva chính vì không muốn học Premiere*).
- Bug rollout: trim 1 clip → **cả audio track unsync/restart/mất tiếng**; "**ghost footage**" — timeline báo đã cắt nhưng file xuất vẫn còn đoạn đó; "weeks of work destroyed".
- → 2 bài học: **(i)** đừng bắt designer nội thất học ripple-edit; **(ii)** nâng cấp editor không được phá project cũ — sự tin cậy timeline (cái thấy = cái xuất) là điều thiêng liêng nhất.

---

## 3 · ĐIỀU IF NÊN LÀM (đầu vào cho `SPEC-TRINH-VIDEO-EDITOR`)

| # | Đề xuất | Căn cứ |
|---|---|---|
| 1 | **Đơn vị edit = SHOT CÓ TÊN, không phải track vô danh.** Dàn shot dạng dải tile (kiểu Descript storyboard / Canva page): "Shot 1 · Vào cửa chính" · "Shot 2 · Quanh đảo bếp"… — tên suy từ ngữ nghĩa đường cam (phòng/zone). Kéo-thả đổi thứ tự = "xếp thứ tự" đúng luật §0.4 | Descript chứng minh đơn vị ngữ nghĩa thắng đơn vị thời gian với non-editor; footage IF có ngữ nghĩa sẵn từ campath — moat không app nào có |
| 2 | **Timeline chi tiết COLLAPSED mặc định** (pattern Descript): mặc định chỉ thấy dải shot + pill nhạc; kéo handle mở timeline đầy đủ khi cần trim tinh. KHÔNG ripple edit, KHÔNG layer dependency | Canva 2.0 sập vì ép full-NLE lên non-editor; Descript sống khoẻ với timeline phụ |
| 3 | **Cấu trúc cố định 3 tầng, không cho thêm track tự do**: ① dải shot (video) · ② 1 track nhạc · ③ 1 track chữ/tiêu đề. Đúng phạm vi "track/trim/nhạc/chữ" của ticket, khỏi quản lý track | CapCut mạnh vì n track nhưng đó là gánh nặng học; IF không cần |
| 4 | **Beat sync theo mô hình Canva-free, KHÔNG theo Auto Cut**: dò beat (lib JS sẵn có, vd essentia.js/web-audio-beat-detector — PHU thẩm định) → vẽ **snap point trên pill nhạc** → kéo ranh giới shot là HÍT vào beat gần nhất. Thêm nút "Chia đều theo beat" (tự trim mọi shot tới beat gần nhất — bản "Sync now") làm bước 2 | Canva chứng minh snap-to-beat thủ công đã đủ sướng ở tier free; Auto Cut kiểu AI script vượt phạm vi + không có cả trên CapCut Web |
| 5 | **Trim = kéo 2 đầu tile shot + nút cắt tại playhead. "Cắt đầu đuôi" là thao tác hạng nhất**, hiện số giây khi kéo | Chuẩn chung cả 3 app; đúng chữ trong luật §0.4 |
| 6 | **Chữ: tiêu đề theo shot** (nhập tay hoặc tự đề xuất từ tên phòng/zone), animation = 2-3 kiểu theo `SPEC-APPLE-MOTION-MATERIAL`, cấm thư viện effect kiểu CapCut. KHÔNG auto-caption giọng nói ở v1 (footage IF không có lời thoại) | Phạm vi "chữ" của ticket; auto-caption là giải pháp cho vấn đề IF không có |
| 7 | **Fade to black/white giữa shot** — cùng 1 cơ chế với đề xuất #7 của NC-1, làm MỘT lần dùng cả campath lẫn editor | TM/CapCut/Canva đều có; rẻ |
| 8 | **Luật thiêng: cái thấy trên timeline = cái xuất ra.** Ghi thành mục kiểm thử bắt buộc (test xuất so khớp tổng thời lượng + ranh giới shot), tránh "ghost footage" kiểu Canva 2.0 | Bug huỷ diệt lòng tin nhất trong vụ Canva |
| 9 | **Exit path ghi rõ trong spec**: IF xuất MP4 sạch (0 credit, không watermark) → ai cần hơn thì mang sang CapCut/Premiere. KHÔNG cố đuổi tính năng theo CapCut | Luật "KHÔNG NLE" đã chốt; paywall CapCut làm "MP4 sạch miễn phí" thành lợi thế marketing thật |
| 10 | **Nhạc: người dùng tự đưa file vào (upload/File Manager), không thư viện nhạc bản quyền ở v1** — tránh nồi licensing của CapCut/Canva | Ngoài phạm vi; rủi ro pháp lý không đáng |

**Giới hạn nghiên cứu:** chi tiết Canva Beat Sync (free vs Pro) tổng hợp từ feature page + nhiều nguồn thứ cấp nhất quán — trang help gốc chặn fetch, chưa đối chiếu được từng chữ; vụ Canva 2.0 dựa chủ yếu 1 bài substack dẫn Reddit/Trustpilot (hướng kết luận chắc, chi tiết từng bug nên coi là lời kể người dùng). Lib dò beat JS ở #4 là gợi ý, PHU phải thẩm định trước khi vào phiếu code.
