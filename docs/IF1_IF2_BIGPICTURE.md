# IF1 + IF2 — Bức tranh tổng (đối chiếu STATUS hiện tại)

> 🔴 **ĐÍNH CHÍNH TỪ VỰNG (07/08, G-M15-03, `docs/M-NHAN-OUT.md`)** — file này (viết 20/07) dùng
> chữ **"chặng"** cho một bộ HOÀN TOÀN KHÁC bộ "chặng" mà `docs/00-CHOT.md` chốt sau này (07/08):
> đây là ① CAD kỹ thuật ② BIM/IFC 4.0 ③ Viewer 3D + clash/section-cut (§3 dưới); còn chốt 07/08
> gọi 3 chặng IF là ① Thiết kế 2D ② Thiết kế 3D ③ Trình chiếu (`concept`/`render`/`present`).
> **BỘ CHỐT 07/08 THẮNG** — chữ "chặng" từ nay CHỈ dùng cho bộ đó (đã lên `StageSwitcher.tsx`,
> `lib/phases.ts`, mọi UI người dùng thấy). Bộ ba mục ở §3 dưới đây đổi tên gọi thành **"3 mảng
> IF2"**, không còn gọi là "chặng" — tránh phiên nào đọc file này trước sẽ hiểu nhầm "chặng 3" là
> Viewer 3D thay vì Trình chiếu.

> File này do phiên Cowork/kiến trúc-sư-trưởng (Claude) viết ngày 2026-07-20, tổng hợp
> toàn bộ quyết định kiến trúc IF1+IF2 đã thống nhất với Hoà. Claude Code: đọc file này
> TRƯỚC, rồi đối chiếu với STATUS.md + CHANGELOG.md hiện tại của bạn, tự liệt kê:
> (a) phần nào IF1 đã làm ĐÚNG hướng với bức tranh này, (b) phần nào ĐANG LỆCH cần sửa,
> (c) phần nào bức tranh này yêu cầu mà STATUS.md chưa nhắc tới. Không tự sửa code chỉ vì
> đọc file này — chỉ báo cáo đối chiếu, việc sửa chờ Hoà xác nhận.

## 1. Nguyên lý cốt lõi: 1 app, 1 file `.idf`, nhiều chế độ

IF2 KHÔNG phải app riêng (not a separate app). Cùng file `.idf`, cùng Doc (`model.ts`),
chỉ khác toolbar hiển thị theo "mode".

**QUYẾT ĐỊNH QUAN TRỌNG (mới chốt 2026-07-19, cần kiểm tra STATUS.md/UI hiện tại có phạm
không):** KHÔNG được có 2 mục "CAD" riêng trong nav/menu (ví dụ "CAD sơ phác" và "CAD kỹ
thuật" là 2 stage/route khác nhau) — đó là lỗi UX gây nhầm (duplicate nav entries). CHỈ có
DUY NHẤT 1 mục nav "CAD". Bên trong, nhãn hiển thị (breadcrumb/title) tự đổi giữa "CAD ·
Phác thảo" và "CAD · Kỹ thuật" dựa trên 2 yếu tố: vai trò đang đăng nhập (role) + trạng
thái bàn giao dự án (đã qua "gate" handoff chưa). Người dùng KHÔNG tự chọn mode bằng tay —
tự động theo role + stage (auto mode-switch, not user-toggled). Cơ chế: mở rộng
`PRO_ONLY_TOOLS` (đã có trong `store.ts`) từ điều kiện thủ công sang điều kiện
`role + đã-bàn-giao-chưa`.

Nếu STATUS.md/CHANGELOG.md hiện tại đang có kế hoạch làm "2 CAD stage riêng" thì đây là
chỗ LỆCH cần báo cáo, không phải lỗi để tự sửa ngay.

## 2. Cơ chế đa team — "Dây chuyền tiếp sức" (relay pipeline)

1 dự án = 1 file `.idf` chảy qua 3 trạm: CREA (sáng tạo) → Hoạ viên (kỹ thuật) → Team BIM
(triển khai).

Mỗi team SỞ HỮU đúng 1 chặng tại 1 thời điểm (role-based stage lock). Bàn giao qua GATE:
đóng băng snapshot version trước khi mở khoá chặng sau (chống mất dữ liệu — đã có nền
`handoff.ts`/`present-handoff.ts`, cần kiểm tra có field version/snapshot thật chưa).

Nhiều dự án chạy song song (khác pha) nên không team nào ngồi chờ nhau — đây là model
pipeline (sequential relay), KHÔNG phải real-time multiplayer (không làm CRDT/Yjs kiểu
Figma ở giai đoạn này).

## 3. 3 mảng IF2 (đã research code thật 2026-07-19; ĐỔI TÊN từ "3 Chặng IF2" 07/08, xem đính chính đầu file — chữ "chặng" nay dành riêng cho bộ chốt 07/08)

| Mảng | Đã có (tái dùng) | Làm mới |
|---|---|---|
| 1 · CAD kỹ thuật | DXF round-trip, dimension, hatch, standards checker TCVN/QCVN/Neufert/NFPA (`lib/cad/standards/`) | DWG export (hiện chỉ import) |
| 2 · BIM/IFC 4.0 | Cầu Blender headless (`lib/server/blender.ts` + `obj2fbx.py`), pipeline Doc→OBJ (`lib/three/cad-to-obj.ts`) | Gắn IfcOpenShell/Bonsai; mở rộng `model.ts` thêm `storey?`/`elementType?` (optional, backward-compatible) — FBX hiện chỉ là mesh trơn không ngữ nghĩa |
| 3 · Viewer 3D web + clash/section-cut | Không có gì (0 three.js/web-ifc/@thatopen trong package.json) | Toàn bộ, lazy-load để không phình bundle IF1 |

Driver pháp lý Chặng 2: Quyết định 258/QĐ-TTg bắt buộc BIM IFC 4.0.

## 4. Việc dựng hình 3D — làm rõ để tránh hiểu nhầm

- IF ĐÃ CÓ khả năng auto-dựng khối 3D thô từ mặt bằng 2D (auto mass-model from 2D floor
  plan, đúng kích thước) — không phải chưa làm được gì.
- IF CHƯA CÓ màn hình xem 3D ngay trong app (đó là Chặng 3, việc mới).
- Việc hoạ viên dựng 3D chi tiết + render chất lượng cao KHÔNG thuộc phạm vi IF — quyết
  định dùng **Blender (free) + Cycles** thay 3ds Max/V-Ray (tiết kiệm ~$2,415/năm/seat),
  tận dụng đúng cầu Blender đã có sẵn trong `lib/server/blender.ts`. Không xây "app 3ds
  Max" riêng.

## 5. Quy tắc an toàn khi code IF2 (nhắc lại, không đổi)

- Additive schema — field mới optional, không phá `.idf` cũ (backward-compatible).
- Checker chỉ đề xuất (`fix-suggest.ts`), không tự sửa entity.
- Lazy-load mọi dependency 3D/IFC nặng — IF1 phải giữ nhẹ.
- Tuân CLAUDE-WORKTREE-RULES.md hiện có (tối đa 3 worktree, xoá sau merge, verify
  `git log -1` trước khi báo xong).

## 6. Việc cần Claude Code tự trả lời sau khi đọc xong (checklist)

1. STATUS.md hiện có đang implement UI nào có 2 mục CAD tách biệt không (2 nav entries
   thay vì 1)?
2. `PRO_ONLY_TOOLS` hiện gate theo gì — thủ công (manual flag) hay đã có khái niệm role?
3. `model.ts` đã có field `storey`/`elementType` chưa?
4. `package.json` đã lỡ thêm three.js/web-ifc/@thatopen chưa mà không cần thiết lúc này?
5. `handoff.ts`/`present-handoff.ts` đã có field version/snapshot thật để chống mất dữ
   liệu khi bàn giao chưa, hay mới chỉ là khung sườn?

Báo cáo đối chiếu (a)/(b)/(c) ở trên — KHÔNG tự sửa code, chờ Hoà xác nhận hướng đi trước.

## 7. Ghi chú bàn giao — nhãn "Coming soon → IF2" (thêm 2026-07-20)
IF1 sẽ launch cho dùng thử SỚM; các cơ chế IF2 (BIM/IFC, viewer 3D, clash detection...)
build GỐI ĐẦU sau, không chờ nhau. Vì vậy trong UI IF1, ở đúng chỗ mục "1. Nguyên lý cốt
lõi" đã mô tả (điểm vào CAD duy nhất, mode tự đổi theo role/stage), khi mode = "Kỹ thuật"
CHƯA sẵn sàng thật, hiện badge/nhãn dạng "Coming soon · IF2" thay vì ẩn hẳn hoặc giả vờ
đã xong — để hoạ viên/khách demo hiểu đây là tính năng đang tới, không phải lỗi.
Claude Code tự chọn vị trí đặt badge phù hợp với component hiện có (không cần hỏi lại),
chỉ cần đúng tinh thần: có thể thấy trước, rõ ràng "sắp có", không gây tưởng nhầm là hỏng.

**Ghi chú bàn giao trách nhiệm (2026-07-20):** từ đây, việc build code IF1/IF2 do Hoà +
phiên Claude Code này đảm nhiệm trực tiếp. Phiên Cowork (kiến trúc sư trưởng) không còn
thao tác trực tiếp trên repo InteriorFlow nữa — file này là bàn giao cuối, đọc xong thì
tự vận hành theo CLAUDE.md/STATUS.md như thường lệ.
