# BẢN THIẾT KẾ HỆ THỐNG IF — giải phẫu app ship được · IF thừa/thiếu · cơ chế đồng bộ (13/08/2026)

> Hoà đặt bài: một sản phẩm ship ra có bao nhiêu mục cấu thành; cách nào GIAO DIỆN – VẬN HÀNH –
> DATABASE thống nhất (bệnh: UI và lõi không gọi được nhau); app không thể thiếu gì; IF thừa hay
> thiếu; có nên xây đồng bộ hơn không. NC nguồn: production-readiness (Cortex/Port), Linear
> Method + sync engine, Figma eng blog, **Blender RNA/DNA**, NN/g generative-UI, Zod/tRPC/tokens
> pipeline. Đối chiếu nội bộ: DOI-CHIEU-42-SPEC + frontier-registry + 8 trụ. [T4][Đ2][Đ3]

## 1 · 16 MỤC CẤU THÀNH một app ship được — CHẤM IF hôm nay

| # | Mục | IF | Bằng chứng 1 dòng |
|---|---|---|---|
| 1 | Data model đơn nguồn (schema-first) | 🟡 | Prisma có; nhưng UI còn khai lại type/field rải rác, zod chưa là nguồn duy nhất |
| 2 | Migration & versioning dữ liệu | ✅ | IDF version + IDFC_MIGRATIONS khung + snapshot DB trước đổi schema |
| 3 | Auth & phân quyền | 🟡 | session + assertProjectAccess có; per-folder/per-vai chưa đủ (RBAC 5 vai mới neo) |
| 4 | Đồng bộ trạng thái một graph | 🟡 | Doc store là một-nguồn tốt; quanh nó còn nhiều fetch/ghi rời (Home/Library tự fetch) |
| 5 | Hiệu năng có ngưỡng đo | 🟡 | bench tất định + điểm gãy pickHatchFace VỪA có (13/08); việc sửa chưa làm |
| 6 | A11y (bàn phím/contrast/reader) | ❌ | chưa từng audit; keyboard tốt ở 2D nhưng không hệ thống |
| 7 | i18n kiến trúc | ✅ | lib/i18n VI/EN + switcher |
| 8 | Telemetry / feedback loop | ❌ | 0 — mọi "hành vi người dùng" hiện = mắt Hoà |
| 9 | Release/rollback kiểm soát | 🟡 | registry-gate (biến thể feature-flag "chống quên" — NC ghi nhận đúng pattern) + auto-update opt-in; chưa có flag runtime |
| 10 | Backup & disaster recovery | 🟡 | backup-offsite + rotation CÓ; chưa TEST RESTORE thật (nằm trong R1 gate) |
| 11 | Test phân tầng | 🟡 | unit rất dày (263 file); e2e luồng người dùng = 0 (verify browser đang là tay); hạ tầng test không đọc alias @/ |
| 12 | Docs/onboarding 2 tầng | 🟡 | dev docs rất dày; onboarding end-user mới có intro |
| 13 | Error surface người dùng | 🟡 | SPEC-NGON-NGU có khuôn lỗi; chưa áp đồng loạt |
| 14 | Security & credentials | ✅ | env tách, key không vào repo, luật an toàn dữ liệu |
| 15 | Extensibility contract ổn định | 🟡 | node registry là contract tốt; **FeatureContract 4 câu ĐÃ CHỐT 11/08 nhưng CHƯA MÁY HOÁ** |
| 16 | Observability production | ❌ | 0 (local-first vẫn cần error-log file + nút "gửi báo lỗi kèm log") |

**Đếm: 3 ✅ · 10 🟡 · 3 ❌.** Ba lỗ ❌ (a11y · telemetry · observability) đều thuộc nhóm "vô hình
cho tới khi có người dùng thật ngoài Hoà" — đúng lúc phải vá vì vòng người-dùng-thật TTT sắp mở.

## 2 · IF THỪA gì (dạng tồn kho, không phải cắt bỏ)

13 kho-chưa-mở còn lại (code+test xong, 0 caller — đợt 4 đã mở 1/14) · 12 chỗ spec nói sai hiện
trạng · cơ chế trùng ý định (ops[]/opsDisabled/recipe). Thừa kiểu này = nợ NỐI DÂY + nợ DỌN SỔ,
xử bằng đòn bẩy trong plan 8 luồng, không cần chiến dịch riêng.

## 3 · CƠ CHẾ THỐNG NHẤT UI ↔ LÕI ↔ DB — bộ chọn cho IF (từ 7 cơ chế đã kiểm chứng)

| Cơ chế (nguồn) | Phán quyết cho IF |
|---|---|
| **Blender RNA/DNA — UI TỰ SINH từ định nghĩa data có metadata** | ⭐ **THUỐC ĐẶC TRỊ bệnh "UI-lõi không gọi nhau"**. IF đã có discriminated union (.idfc/BuildOp/MaterialPbr) — thiếu lớp metadata (label VI/EN · đơn vị · min/max · callback lan truyền) để Inspector/panel TỰ SINH thay vì mỗi module code tay UI riêng. Đặt tên: **IF-RNA (Hệ Thuộc Tính Tự Mô Tả)** |
| Schema-first Zod/Prisma infer (chuẩn stack TS) | ÁP KỶ LUẬT: cấm khai lại type ở component — import từ schema; đưa vào Hệ Luật Thao Tác (P3) như một luật soi |
| BuildOp stack = event log (event-sourcing) | ĐÃ CÓ đúng hướng (BuildRecipe + Undo-Trước-Hỏi-Sau) — thực thi triệt để: mọi module đọc từ stack, không giữ state riêng |
| Linear local-first sync (một graph, mọi view đọc-ghi vào nó) | XÁC NHẬN kiến trúc DocCore đang đúng hướng ngành; vấn đề là thực thi (mục #4 bảng trên) |
| Design tokens pipeline | Đang đúng nửa đường (globals.css + luật cấm hex); nửa sau (pipeline tự động mock→code) để sau R1 |
| Figma plugin sandbox / contract | Áp NỘI BỘ: UI không import thẳng internal engine — chỉ gọi API đã khai (= FeatureContract) |
| Feature flags | IF đã có biến thể đúng (registry-gate); đủ cho giai đoạn 1-studio |

## 4 · TRẢ LỜI CÂU CHỐT: có nên xây đồng bộ hơn không? **CÓ — theo 2 bậc, không đại phẫu**

**Bậc 1 (rẻ, chữa ngay bệnh): MÁY HOÁ FeatureContract** — mọi tính năng khai 4 câu (Đọc gì ·
Ghi gì · Để lại công thức gì · Ai ăn theo) thành registry máy-đọc; `soi:contract` bắt 2 chiều:
nút UI không trỏ về hàm lõi có tên (nút mồ côi — mở rộng luật 7 hiến pháp thành "không có DÂY
thì không có NÚT") và engine 0 caller (kho không dây). 13 kho hiện tại là danh sách nạp đầu.

**Bậc 2 (đầu tư, proof trước): IF-RNA v0** — chọn MỘT loại đối tượng làm proof: **MaterialPbr**
(14 thuộc tính, đã chuẩn glTF): thêm metadata mô tả → panel vật liệu TỰ SINH từ định nghĩa;
đo bằng số dòng UI code giảm + 1 chỗ sửa lan mọi nơi. Thành công → nhân ra BuildOp/idfc.
KHÔNG cam kết RNA-hoá cả app trong một đợt — Blender làm việc này trong nhiều năm.

**KHÔNG làm (đón đầu tỉnh táo — NC xu hướng AI-era):** generative UI tự đổi layout theo hành vi
= hype, NN/g cảnh báo phá nhất quán — trái luật token-đổi-theo-điều-kiện-xác-định của IF.
Bám rễ thật (AI tăng tốc thao tác có hợp đồng · agentic có checkpoint · output luôn editable)
thì **IF đã chốt từ trước bằng triết lý riêng** — việc còn lại là thực thi nhất quán.

## 5 · Lộ trình đề xuất (nối vào chuỗi nền móng)

P3 (Hệ Luật Thao Tác — thêm luật schema-first) → P4 (Gói Hồ Sơ Sống) → **P5 = FeatureContract
máy hoá + soi:contract** (bậc 1) → **P6 = IF-RNA v0 MaterialPbr** (bậc 2, proof) → vá 3 lỗ ❌
(telemetry tối giản local-first: đếm-tính-năng-được-bấm ghi file cục bộ + nút gửi-log tự nguyện,
TRUNG TÍNH không gửi ngầm [T3]; a11y audit 1 lượt; error-log). Mỗi phiên một món, đúng [Đ1].
