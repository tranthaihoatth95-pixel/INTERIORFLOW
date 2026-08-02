# NC-1 · CAMERA & ĐƯỜNG QUAY trong D5 / Lumion / Twinmotion
**COWORK-NC · 02/08/2026 tối.** Nuôi: `SPEC-DUNG-CAMERA` (COWORK-DỰNG đang chờ) + bước ② DỰNG video chặng 3.
**Đối chiếu code IF có sẵn:** `lib/cad/campath.ts` — `planCamPath()` (polyline → `roundPolylineCorners` bo góc → `sampleByLength` bước đều → `smoothDirections`), `LookAtMode` 3 kiểu tangent/point/zone, tầm mắt 1650. `CamPathPreview`+`CamPathControlPanel` (V2.1) CÓ nhưng CHƯA wire (`STATUS.md`). Luật khung: `SPEC-VIDEO-MAT-BANG` §0.4 — trong IF chỉ *xếp thứ tự · cắt đầu đuôi · chèn tiếng*, KHÔNG làm NLE.

---

## 1 · Mô hình dữ liệu video của 3 app — đều là KEYFRAME-FIRST

| | D5 Render | Lumion | Twinmotion |
|---|---|---|---|
| Cấu trúc | **Clip > Shot > View** — "Add Current View" tạo view 3 s; nhiều shot/clip, shot cắt thẳng sang nhau | **Movie > Clip** — bấm icon máy ảnh "chụp" vị trí hiện tại thành keyframe, di chuyển bằng QWEASD rồi chụp tiếp | **Video > Part > Keyframe** — keyframe = 1 point-of-view; part = 1 đoạn sequence |
| Path sinh ra từ | nội suy giữa các view + **Edit Path** (từ 2.6): 3 đối tượng gizmo — Camera Carrier (dời cả path) · View Carrier (dời 1 view) · **Spline Tool** (2 control point bẻ cong đoạn) | nội suy giữa keyframe; hoặc **4 preset path**: Orbit · Dolly · Pan/Tilt · Follow Object (chỉnh bằng Move Gizmo / nhập toạ độ / "lấy vị trí camera hiện tại làm đầu-cuối") | nội suy giữa keyframe; Properties panel chỉnh hình dạng path + tốc độ + **easing in/out theo part** |
| Tốc độ / nhịp | **Movement 5 kiểu**: Linear · Ease in · Ease out · Ease in out · Speed in out, chỉnh thêm bằng curve 2D; **Auto View Interval** = tick để tự chia lại thời gian cho tốc độ ĐỀU giữa các view | thời lượng đặt theo clip; **Handheld Camera Effect** (Shake Strength/Angle) giả rung tay | easing in/out đầu-cuối part |
| Look-at | **Camera Target**: bấm "Focus" chọn object → camera tự khoá nhìn vào object suốt chuyển động (doc tự nhận: "ideal for surround, semi-surround, curved paths — khỏi chỉnh hướng tay") | Follow Object preset; Handheld "Look at Fixed Point" (override target của preset path) | không có target riêng — hướng nhìn nằm trong từng keyframe |
| Tầm mắt | không có nút riêng | **nút "Set eye level" = 1,60 m** + khuyên focal 28–32 mm | không có nút riêng |
| Per-shot môi trường | env/post copy-paste theo shot/view (right-click), "update all parameters" hàng loạt | effect stack theo clip | **Ambience theo part HOẶC theo từng keyframe** (Env·Camera·Render·FX), copy/paste Ctrl-C/V, multi-select Shift/Ctrl; **Start/end ambience** = time-lapse sáng→chiều trong 1 part |
| Chuyển cảnh | shot cắt thẳng | — | **Fade to black / Fade to white** giữa 2 part (menu Cut để bỏ) |
| Template | **Camera Movement template** (pan…) hover xem preview động — NHƯNG shot template bị khoá: chỉ 2 view đầu-cuối, cấm thêm view, **cấm chỉnh Movement**; **Phasing Animation template** (Drop/Rise, Ascend/Descend, Fly in/out, Explode…) sort theo list hoặc world-coordinate, nhịp Simultaneous/Cascading/Sequential | 4 preset path (trên) | Phasing + View sets (construction stages) |
| Xuất | max **4K (tài khoản cá nhân) / 8K (team)**; render queue gom clip/shot | mặc định **30 fps · 720p**; MP4; quality 1–5 sao; giảm sao/fps/độ phân giải để nhanh | export local; 2 phút 4K trên RTX 4090: **Lumen ~8–18 phút · Path Tracer ~25–50 phút** (nguồn bên thứ 3, chưa tự kiểm) |

Nguồn: [D5 render video clip](https://docs.d5render.com/user-guide/render/how-to-render-a-video-clip) · [Lumion preset paths](https://support.lumion.com/hc/en-us/articles/7958254659740-How-do-Camera-Path-presets-work) · [Lumion walkthrough eye-level](https://support.lumion.com/knowledge-base/api/v2/help_center/en-us/articles/360003476093.json) · [Twinmotion Creating Videos](https://dev.epicgames.com/documentation/twinmotion/creating-videos) · [TM export settings](https://dev.epicgames.com/documentation/en-us/twinmotion/export-settings-for-videos-in-twinmotion) · [radarrender đo TM](https://radarrender.com/twinmotion-video-export-is-too-slow-heres-the-real-bottleneck/) · [Lumion render times](https://support.lumion.com/hc/en-us/articles/360003456554-How-can-you-reduce-rendering-times)

---

## 2 · Than phiền cộng đồng — nỗi đau số 1 là INTERPOLATION, không phải render

### D5 — thread ["Camera Path" #12108](https://forum.d5render.com/t/camera-path/12108) (mike, 3090ti):
> *"The automatic interpolation between keyframes often leads to the camera **diving below ground level, crashing into objects**… the video function is **completely unusable** for me."*
> *"Smoothing sometimes **overshoots** quite a bit. If a keyframe is close to the ground, the resulting curve may dip below ground… I've spoken to other architects experiencing similar difficulties, it seems to be a **common issue**."*

Trả lời CHÍNH THỨC của D5 staff (Oliver.J): *"you can use **set only two keyframes for a clip**, dividing the video into several clips, at least the camera movement is more linear and will not exceed its position."* → **workaround chính hãng = tự tay né thuật toán của chính họ.**

### Các request lặp lại trên forum D5 ([#74173](https://forum.d5render.com/t/camera-path-while-making-video/74173), [#32657](https://forum.d5render.com/t/camera-path-editing/32657), [#20127](https://forum.d5render.com/t/video-path/20127)):
- **Giữ độ cao camera CỐ ĐỊNH** cho walkthrough (phải canh tay từng keyframe).
- **"Cho tôi sửa path từ TOP VIEW"** — chỉnh đường quay trên mặt bằng dễ hơn mò trong 3D.
- Camera target gán dễ như DOF target (trước khi D5 thêm Camera Target).
- Animate focal length (lens breathing) — chưa có.

### Lumion / Twinmotion:
- Lumion được khen dựng walkthrough nhanh; bù rung tay bằng Handheld effect thay vì path phức tạp.
- TM bị kêu **mất camera setup đã lưu khi save project** ([cgheven so sánh](https://cgheven.com/blog/lumion-vs-twinmotion-which-one-should-you-use-for-your-next-project) — nguồn yếu, cần kiểm thêm) và **export chậm là bottleneck chính** ([radarrender](https://radarrender.com/twinmotion-video-export-is-too-slow-heres-the-real-bottleneck/)).

**Đọc ra bản chất:** cả 3 app đều keyframe-first → path là SẢN PHẨM PHỤ của nội suy → mọi nỗi đau (chui đất, xuyên tường, tốc độ giật, không sửa được path) đều từ đó. Thứ user D5 cầu xin — *sửa path trên top view, độ cao cố định* — chính là kiến trúc **path-first trên mặt bằng** mà IF đã chọn.

---

## 3 · ĐIỀU IF NÊN LÀM (đầu vào cho `SPEC-DUNG-CAMERA`)

| # | Đề xuất | Căn cứ |
|---|---|---|
| 1 | **GIỮ path-first + độ cao khoá 1650 làm mặc định** — đây là moat, không phải thiếu tính năng. Ghi thẳng vào spec: "IF không có keyframe 6DOF tự do; đường quay là polyline trên mặt bằng" | Pain #1 của D5 (chui đất/xuyên tường) + workaround chính hãng "2 keyframe/clip"; `planCamPath` đã đúng hướng |
| 2 | **Nút "tầm mắt" kiểu Lumion** trên panel campath: mặc định 1650, kèm 2–3 mức đặt sẵn (vd ngồi ~1200 · trẻ em/khách ngồi thấp — số cụ thể để COWORK-DỰNG chốt). Lumion dùng 1,60 m — IF giữ 1650 theo spec đã chốt, không đổi | Lumion "Set eye level" là 1 nút, ai cũng hiểu |
| 3 | **Easing per-segment: 1 dropdown 5 kiểu như D5** (Linear · Ease in · Ease out · Ease in-out · Speed in-out). KHÔNG làm curve editor 2D ở v1 | D5 chứng minh 5 kiểu đủ cho archviz; curve editor = phức tạp NLE, phạm luật §0.4 |
| 4 | **Tốc độ đều = mặc định** (sampleByLength đã cho sẵn) + 1 ô "thời lượng tổng" — tự chia như D5 Auto View Interval nhưng KHÔNG cần tick, vì IF sample theo chiều dài nên đều bẩm sinh | D5 phải thêm option riêng để vá tốc độ lệch giữa view; IF có free |
| 5 | **Look-at giữ 3 mode; UI học D5 "Focus"**: bấm nút rồi click thẳng object/zone TRÊN MẶT BẰNG để gán target (không menu chọn tên) | D5 Camera Target được khen "khỏi chỉnh hướng tay"; IF chọn trên plan còn dễ hơn chọn trong 3D |
| 6 | **Scrub-preview 2 cửa sổ đồng bộ**: kéo thanh thời gian → chấm camera + nón hướng nhìn chạy TRÊN MẶT BẰNG, viewport 3D bám theo (ăn `CamPathPreview` có sẵn, chỉ việc wire — gap V2.1 ghi trong STATUS) | User D5 xin "top view editing" — IF cho luôn top view PREVIEW; Lumion On Path / TM scrubber là chuẩn tối thiểu |
| 7 | **Fade to black/white giữa 2 shot** — 1 toggle, nằm vừa phạm vi "xếp thứ tự, cắt đầu đuôi" §0.4, rẻ (crossfade CSS/canvas) | TM chỉ có đúng 2 fade này + Cut — đủ dùng cho archviz |
| 8 | **Template đường quay (orbit quanh 1 phòng · dolly dọc hành lang) làm SAU v1**, và nếu làm thì template phải "eject" ra polyline thường sửa tiếp được | Bài học D5: shot template khoá cứng (cấm thêm view, cấm chỉnh Movement) → user bực; Lumion preset chỉnh được bằng gizmo nên được khen |
| 9 | **KHÔNG làm ở campath v1**: per-keyframe ambience (LightMix IF đã có hướng riêng, `NGHIEN-CUU-QUY-TRINH-RENDER`) · animate focal · handheld shake · phasing animation (bậc 1 draw-on đã cover ý "công trình mọc dần" theo cách IF) | Giữ phạm vi; mấy thứ này là nồi phức tạp của D5/TM |
| 10 | **Định vị tốc độ khi nói về xuất video**: đối thủ 2 phút 4K mất 8–50 phút GPU rời (TM) hoặc render farm; IF bậc 1·2·4 là 0-credit từ `captureSequence` — chậm nhất cũng phải NHANH HƠN HẲN con số này, và spec nên ghi target thời gian xuất | Số §1; positioning cho marketing sau này |

**Giới hạn nghiên cứu:** số render-time TM/Lumion lấy từ nguồn bên thứ 3 (radarrender, packt/iastate tutorial) — chưa tự đo; complaint TM "mất camera khi save" mới 1 nguồn. Không ảnh hưởng kết luận chính (kiến trúc keyframe-first vs path-first) vì phần đó dựa doc + forum chính hãng.

*Nguồn phụ đã tham khảo: [D5 keyframe guide](https://www.d5render.com/posts/how-to-use-keyframes-to-create-animations-in-d5-render) · [Lumion camera path tạo tay](https://support.lumion.hk/articles/360006698053-Movie-Mode-Creating-A-Camera-Path) · [iastate Lumion walkthrough tutorial](https://iastate.pressbooks.pub/visualgraphiccomm2/chapter/chapter-22-lumion-walk-through-video/) · [TM sequences](https://dev.epicgames.com/documentation/twinmotion/creating-sequences-in-twinmotion)*
