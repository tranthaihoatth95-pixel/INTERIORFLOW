# SHIP CHECKLIST — còn gì mới ship được (T soi bằng máy 14/08, Hoà hỏi trực tiếp)

> Hai cửa ship khác nhau, đừng trộn: **CỬA R1 = nội bộ TTT dùng thật** (mục tiêu hiện tại) ·
> **CỬA B = ra ngoài/bán**. Mỗi dòng có nguồn kiểm.

## ✅ ĐÃ SẴN (máy xác nhận 14/08 — nhiều món sổ cũ chưa gạch)
- Trung tính: DETECH/com.ttt/ảnh khách/mật khẩu test/route demo = **grep 0 toàn bộ** (danh sách "CÒN SÓT" CLAUDE.md đã mốc) · check:chot 9 luật 0 chặn.
- `release-preflight` PASS (loopback · snapshot/migration gate · update opt-in).
- License bậc R1: GPL libredwg — Hoà chốt 08/08 "nội bộ không conveying" ⇒ KHÔNG chặn R1.
- Nền: chuỗi P1→P6 đóng · 5 máy soi 0 lệch · backup-offsite có · 22 contract 21 có-dây.

## 🔴 CHẶN CỬA R1 (nội bộ) — 4 việc, theo thứ tự
| # | Việc | Trạng thái / nguồn |
|---|---|---|
| R1-1 | **Nghiệm thu MÁY SẠCH trọn vòng đời**: build Electron (mac) → cài máy chưa từng có IF → mở/tạo dự án/lưu → nâng cấp bản mới → khôi phục từ backup | CHƯA LÀM — gate chính của R1 (STATUS mục tiêu); script build sẵn, chưa ai chạy vòng đủ |
| R1-2 | **Đợt UI theo bộ nguyên tắc NT + khuôn KB** (Hoà: "chuyên nghiệp mới xài cho dân chuyên được") — tối thiểu KB-1 toolbar một khuôn + L2 đường bàn phím (⌘K/hint) + 2 hàng đợi thao-tac (focus-visible · hex inline) | NT-1..18 CHỜ HOÀ DUYỆT → mock → áp (~2-3 đợt agent) |
| R1-3 | **Lô duyệt mắt** — nợ mắt còn ~53, Cửa chỉ đóng khi nợ mắt giai đoạn = 0 (HOP-DONG §8.1) | LO-1 soạn sẵn 48 mục/7 trạm, Hoà mới đi 1 |
| R1-4 | **Vòng người dùng thật TTT** 2-3 người chạy kịch bản Phiếu 5 Ô + kênh nhận lỗi (error-log file cục bộ + nút gửi-log tự nguyện — 1 trong 3 lỗ ❌ BAN-THIET-KE) | entry `nguoi-dung-that` ⬜ · error-log chưa có |

## 🟡 NÊN CÓ TRƯỚC R1 (không chặn cứng)
- Telemetry local-first đếm-tính-năng-được-bấm (file cục bộ, không gửi ngầm [T3]) + a11y audit 1 lượt — 2 lỗ ❌ còn lại của BAN-THIET-KE §5.
- Sửa điểm gãy hiệu năng `pickHatchFace` O(N²) (bench 13/08 — bản vẽ dày sẽ khựng ở 2k+ entity).
- GR v1 bảng ánh xạ + hoàn thiện phiếu cấp ②④ (dogfood ST5 dùng hằng ngày).

## ⛔ CHẶN CỬA B (ra ngoài — KHÔNG chặn R1, ghi để khỏi quên)
1. GPL/DWG: theo lộ trình RESEARCH-DWG-LICENSE (server-parse + DXF ngắn hạn) — LICENSE-NOTES §7 giữ cổng.
2. Dọn lịch sử git (`scripts/don-git-lich-su.sh` soạn sẵn — chỉ chạy lúc yên tĩnh đủ 4 điều kiện, Hoà bấm).
3. Vá nốt observability + docs onboarding end-user (BAN-THIET-KE #12 #16).
4. Neufert tách gói + color-system-packs (bản quyền dữ liệu ngoài repo) — entry sẵn.

## ĐỀ XUẤT NHỊP 3 ĐỢT TỚI (T sẽ chạy khi Hoà gật)
① Duyệt NT → mock+áp KB-1/L2 + trả 2 hàng đợi thao-tac (R1-2) ·
② Build máy sạch trọn vòng + error-log (R1-1 + R1-4 nền) ·
③ Lô duyệt mắt #2 gộp + vòng TTT (R1-3 + R1-4) → **đóng Cửa R1**.
