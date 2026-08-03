# SPEC — EDITOR VIDEO (loại hồ sơ #5, tầng ② DỰNG)
**COWORK-TRÌNH lập 04/08 · mở khoá nhờ `NC-timeline-editor-2026-08-02` (đọc trọn).**
**Đủ 3 bước §0b:** SEARCH = `lib/three/capture.ts` streaming `onFrame`+`AbortSignal`+`frameCount` (`57ed9b8`) · `lib/cad/campath.ts` `CamPathResult{samples,totalLengthMm,totalDurationSec}` + `LookAtMode 'zone'` · NGHIÊN CỨU = NC-2 (CapCut/Canva/Descript + 2 vụ than phiền chiến lược) · NGƯỜI DÙNG THẬT = designer nội thất KHÔNG PHẢI editor phim — chọn công cụ vì KHÔNG muốn học Premiere (bài học Canva 2.0 sập vì quên điều này).
**Luật khung BẤT DI BẤT DỊCH:** `CHOT-VIDEO-2-TANG` — ① Sinh phim ở IF2 chặng 2; **② Dựng = chặng 3 CHỈ EDIT, KHÔNG viết engine video, không giữ scene 3D riêng** (một-nguồn). `SPEC-VIDEO-MAT-BANG` §0.4 — *xếp thứ tự · cắt đầu đuôi · chèn tiếng*. Người code: G4 (UI) + PHU (2 thẩm định §8).

## §1 · MÔ HÌNH: SHOT CÓ TÊN, KHÔNG PHẢI TRACK VÔ DANH (NC#1 ⭐ — moat)
- Đơn vị edit = **SHOT** = 1 footage từ ① (1 lần chạy campath/capture). Hiển thị dạng **dải tile ngang** (kiểu Descript storyboard / Canva page) — KHÔNG mặt bàn track kiểu CapCut.
- **Tên shot:** mặc định "Shot n"; TỰ GỢI Ý từ ngữ nghĩa khi có (`LookAtMode kind:'zone'` → tên zone; campath đi qua phòng nào — cần hàm map sample→zone, PHU thẩm định §8, CHƯA hứa auto-đủ); user sửa tay luôn được. Footage IF có ngữ nghĩa sẵn — lợi thế Descript-style mà CapCut không có.
- Kéo-thả tile đổi thứ tự = "xếp thứ tự" đúng luật §0.4.

## §2 · CẤU TRÚC CỐ ĐỊNH 3 TẦNG — KHÔNG QUẢN LÝ TRACK (NC#3)
```
[ Shot 1 · Vào cửa chính ][ Shot 2 · Quanh đảo bếp ][ Shot 3 · … ]   ← dải shot (video)
[ ♪ pill nhạc — 1 track duy nhất, snap point beat ]                  ← nhạc
[ T tiêu đề theo shot — 1 track duy nhất ]                           ← chữ
```
KHÔNG cho thêm track tự do · KHÔNG ripple edit · KHÔNG layer dependency (đúng 2 bài học Canva 2.0: đừng ép NLE lên non-editor; n-track là gánh học của CapCut, IF không cần).

## §3 · TIMELINE CHI TIẾT: COLLAPSED MẶC ĐỊNH (NC#2)
Mặc định chỉ thấy dải shot + pill nhạc + track chữ. **Kéo handle mở timeline đầy đủ** khi cần trim tinh (pattern Descript — sống khoẻ với timeline phụ). Mở ra có playhead + thước giây.

## §4 · TRIM — THAO TÁC HẠNG NHẤT (NC#5)
- Kéo 2 đầu tile shot = cắt đầu/đuôi, **hiện số giây đang kéo** (tabular-nums).
- Nút cắt tại playhead (phím `S`) khi timeline mở — chia 1 shot thành 2 (vẫn là shot có tên, tên cũ + "· tiếp").
- Xoá shot = xoá tile; khép khoảng trống TỰ ĐỘNG (dải tile không có "gap" — né luôn khái niệm close-gap).

## §5 · NHẠC + BEAT (NC#4 — mô hình Canva-free, KHÔNG Auto-Cut AI)
- Nhạc: **user tự đưa file** (upload/File Manager) — KHÔNG thư viện nhạc bản quyền v1 (NC#10, né nồi licensing).
- Dò beat 1 lần khi nạp file (lib JS thuần — ứng viên `web-audio-beat-detector`/`essentia.js`, **PHU thẩm định §8**) → vẽ **snap point trên pill nhạc**.
- Kéo ranh giới shot → **HÍT vào beat gần nhất** (dung sai snap ~150ms, tắt được).
- Nút "**Chia đều theo beat**" = tự trim mọi shot tới beat gần nhất (bản "Sync now" của Canva) — bước 2, chạy sau khi có snap point.

## §6 · CHỮ (NC#6)
- **Tiêu đề theo shot**: nhập tay hoặc nhận từ tên shot; vị trí preset (dưới-trái/giữa), 2-3 kiểu animation theo `SPEC-APPLE-MOTION-MATERIAL` (fade+rise · crossfade — spring, reduce-motion thắng). **CẤM thư viện effect kiểu CapCut.**
- KHÔNG auto-caption giọng nói v1 — footage IF không có lời thoại (giải pháp cho vấn đề không tồn tại).

## §7 · CHUYỂN CẢNH + XUẤT
- Chuyển cảnh giữa shot: **fade đen/trắng + cắt thẳng** — 3 lựa chọn, hết. Cùng cơ chế fade với đề xuất #7 NC-1 (làm MỘT lần dùng cả campath preview lẫn editor).
- **Xuất MP4 SẠCH — 0 credit, không watermark** (NC#9): đây là đòn marketing thật vì CapCut vừa nhốt export sau paywall (petition 2024). Exit path ghi thẳng trong UI xuất: "Cần hiệu ứng nâng cao? Mang file MP4 này sang CapCut/Premiere."
- Cơ chế ghép file: **WebCodecs + muxer JS** (ứng viên `mp4-muxer`) — GHÉP là edit, KHÔNG phải engine render (hợp luật 2-TẦNG); ffmpeg.wasm chỉ là phương án nếu WebCodecs thiếu (PHU thẩm định §8, quyết 1 trong 2, ghi lý do).

## §8 · HAI VIỆC PHU THẨM ĐỊNH TRƯỚC KHI THÀNH PHIẾU CODE
1. Lib dò beat (`web-audio-beat-detector` vs `essentia.js`): bundle size · chạy client thuần · độ chính xác nhạc không lời.
2. Đường xuất MP4 (WebCodecs+mp4-muxer vs ffmpeg.wasm): hỗ trợ Safari/tablet · RAM với video ~60-90s 1080p · tốc độ. Kèm: hàm map campath-sample→zone cho tên shot (§1) có làm rẻ được không.

## §9 · LUẬT THIÊNG: CÁI THẤY = CÁI XUẤT (NC#8 — từ vụ "ghost footage" Canva)
Test bắt buộc trong phiếu code: (a) tổng thời lượng xuất = tổng trên timeline ±1 frame · (b) ranh giới shot trong file = ranh giới trên UI · (c) shot đã cắt KHÔNG xuất hiện trong file. Fail 1 trong 3 = 🔴 không ship.

## §10 · BA MẢNG §0c (thiếu 1 = 🔴)
1. **Phím tắt:** Space play/pause · S cắt tại playhead · ←→ nhích frame · ⇧←→ nhích giây · Delete xoá shot · ⌘Z · ⌘K palette ("Thêm nhạc/Chia theo beat/Xuất MP4") · Tab đi được, `:focus-visible` rõ.
2. **Lệnh tương tác:** status bar mách trạng thái ("đang kéo: 2,4s" · "beat snap BẬT" · "đang xuất 40%").
3. **Cảm ứng:** tile/handle ≥ `--tap 44` · kéo tile bằng chạm giữ · KHÔNG chức năng chỉ-hover (số giây khi kéo hiện cả khi chạm) · pinch zoom timeline khi mở.

## §11 · KHÔNG LÀM (chặn phạm vi)
n-track tự do · ripple edit · keyframe animation · color grading · speed ramp · auto-caption · thư viện nhạc/effect · re-render 3D trong editor (muốn đổi góc quay = quay lại chặng 2 sửa campath — một-nguồn).

## §12 · NGHIỆM THU
| # | Kiểm | Đạt khi |
|---|---|---|
| 1 | Nạp 4 footage → dải 4 shot, kéo đổi thứ tự, đổi tên | thứ tự + tên giữ sau reload |
| 2 | Trim đầu/đuôi + cắt playhead | số giây hiện khi kéo; shot chia 2 đúng vị trí |
| 3 | Nạp nhạc → snap point hiện; kéo ranh giới | hít beat trong dung sai; "Chia đều theo beat" trim cả dải |
| 4 | Tiêu đề 2 kiểu animation · reduce-motion | chạy spring đúng; reduce-motion = cắt thẳng |
| 5 | Xuất MP4 | luật §9 pass cả 3 · 0 credit · không watermark · mở được trong CapCut |
| 6 | 3 mảng §0c + 2 theme | đủ |

*COWORK-TRÌNH 04/08 (giờ máy 02/08 23:2x). Append-only. §8 chờ PHU trước khi phiếu code.*
