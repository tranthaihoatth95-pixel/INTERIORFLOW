# NGHIÊN CỨU — PHIM NỘI THẤT: NGÀNH LÀM THẾ NÀO (D5 · Chaos Group)

> Hoà 02/08: *"video ở đây nghĩa RỘNG hơn — có thể **edit video**; nghiên cứu phim nội thất người
> ta làm thế nào với **D5** và **Chaos Group** đi."* → Cowork tra D5 docs · Chaos blog · Autodesk
> University (Ben Rappell) · ArchiCGI. Kết luận: **video IF = 2 lớp tách bạch (SINH + DỰNG).**

## 1 · BA TRƯỜNG PHÁI CỦA NGÀNH — ai làm gì

| Trường phái | Công cụ đại diện | Cơ chế | Điểm mạnh · yếu |
|---|---|---|---|
| **A · Sinh phim TỪ mô hình** *(camera-in-scene)* | **D5 Render** · Twinmotion · Lumion | Đặt **đường cam + keyframe** ngay trong scene 3D → render dãy khung | Nhanh, 1 nguồn (đổi model→phim đổi). Không cần app dựng. Đây là mảng IF đã có xương (`SPEC-3D-CORE` campath) |
| **B · Real-time raytrace** *(photoreal, xem tức thì)* | **Chaos Vantage** + V-Ray · Enscape | Live-link từ Max/C4D → viewport ray-trace như game → tìm góc → **sequencer ghép shot** → xuất | Ảnh thật cấp cao, "2 tuần render → 6 giờ". NẶNG, cần scene Max/V-Ray. **Không phải chỗ IF đua** |
| **C · Dựng/edit hậu kỳ** *(post-production)* | After Effects · Premiere · DaVinci · **CapCut** | Ghép dãy khung + clip quay + still → **color grade · people/entourage · motion graphics/title · nhạc · nhịp cắt** | Đây chính là *"edit video"* Hoà nói. Biến khung thô thành **phim** |

**Chốt hiểu:** A và B cùng triết lý "camera trong scene" — khác độ photoreal. **C là lớp riêng**,
đứng sau, không thay A/B. Phim hoàn chỉnh = A(hoặc B) **rồi** C.

## 2 · BÀI HỌC PHIM HAY ≠ FLYTHROUGH CHÁN (Ben Rappell, Autodesk University)

| Nguyên tắc | Cụ thể cho nội thất |
|---|---|
| **Có kịch bản** *(script → storyboard → animatic)* | thử ý ở độ phân giải thấp trước khi render nặng — rẻ, sửa dễ |
| **Bố cục điện ảnh** | rule of thirds · leading lines · framing · symmetry · **camera target** (khoá vật → shot vòng quanh) |
| **Sự sống tinh tế** | rèm lay · đèn bật dần · time-lapse nắng — *thêm hồn, KHÔNG cướp nét khỏi kiến trúc* |
| **Tiếng dẫn hình** | nhạc & hình đi đôi — **cắt đúng nhịp nhạc** *(cut to beat)* |
| **Color grade thống nhất** | khung render + clip quay cùng một tông |

⇒ Giá trị nằm ở **kể chuyện + nhịp cắt + ánh sáng**, không ở "bay lượn nhiều góc".

## 3 · IF ĐỨNG ĐÂU — moat & cửa bậc 5

- **IF làm A + C nhẹ**, KHÔNG đua B. IF là "D5-lite cho khối", ảnh thật để D5/Chaos.
- **Cửa bậc 5 một chiều:** IF xuất OBJ/scene → D5/Vantage render photoreal (đúng `CHOT-HUONG-3D` §1.3,
  `SPEC-3D-CORE` 3D-6). IF **không** nuốt V-Ray.
- **Moat KHÔNG ai có** *(Canva/CapCut/D5 đều thiếu)*: **live-link CAD → shot tự cập nhật** (đổi bản
  vẽ, phim đổi theo) + **auto sinh đường cam từ mặt bằng** (layer `IF_CAMPATH`) + **cắt theo DỮ LIỆU**
  (đi hết các phòng, dừng ở vùng có ghi chú). Đúng tinh thần InDesign live-link (`SEMANTIC-MODEL` §6).

## 4 · ĐỀ XUẤT — Present §4 "Video" tách 2 lớp

| Lớp | Là gì | Nền IF đã có |
|---|---|---|
| **① SINH** | đường cam 3D + keyframe → dãy khung (như D5) | `3D-CORE` captureSequence · `SPEC-VIDEO-MAT-BANG` 6 bậc ✅ |
| **② DỰNG** | timeline ghép clip·ảnh AI·still + nhạc·nhịp cắt·title·transition·color | `SPEC-EDITOR-TOOLKIT` §Nhóm4 "timeline là DỮ LIỆU" |

⚠️ **Kỷ luật cũ giữ nguyên:** ② **KHÔNG viết engine video** (đừng thành DaVinci/AE). Ghép + nhạc +
title + color cấp CapCut là đủ *nơi tiêu thụ*; nâng cao (VFX, particle) để hậu kỳ ngoài. Làm ② **sau**
khi ① có phim thật để dựng — đúng luật "có nơi tiêu thụ mới thêm".

✅ **CHỐT VỊ TRÍ (Hoà 02/08):** **① Sinh** đặt ở **IF2 chặng 2** (chung vẽ 3D + camera, kèm cửa D5/Chaos); **② Dựng** ở **chặng 3 Present** (chỉ CapCut). Chi tiết `CHOT-VIDEO-2-TANG-2026-08-02.md`.

**Từ khoá tra cứu / xem mẫu:** `D5 render camera path keyframe` · `Chaos Vantage sequencer archviz` ·
`architectural film cut to beat` · `Enscape video walkthrough` · nguồn hình: Behance "architecture film",
Vimeo "archviz animation".

---
*Cowork tra & ghi 02/08/2026. Nối: `SPEC-MODE-PER-STAGE` §4 · `SPEC-VIDEO-MAT-BANG` · `SPEC-3D-CORE` 3D-2/3D-6 · `CHOT-HUONG-3D` §1.3.*
