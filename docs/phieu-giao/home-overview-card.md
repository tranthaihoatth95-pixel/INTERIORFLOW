# PHIẾU home-overview-card — Home đổi ngữ nghĩa thành TỔNG QUAN DỰ ÁN
①NGÀNH: tên "Gallery" nhường cho kho ảnh liên ngành (chốt 12/08); trang chọn dự án hiện toàn "Untitled flow" vô hồn — card phải thành thẻ TỔNG QUAN: nhìn 2 giây biết dự án gì, ai đang làm, đang dở đâu.
②ĐỌC TRƯỚC: components/ProjectSelect.tsx TOÀN VĂN · components/ui/PresenceRow.tsx (12/08) · lib/server/project-profile.ts + API GET /api/projects/[id]/profile · lib/phases.ts (Phase ids) · docs/00-CHOT.md mục "[12/08 Hoà gật 3...] ④ GALLERY/Home".
③VÙNG FILE: components/ProjectSelect.tsx · file MỚI components/home/ProjectOverviewCard.tsx · lib/shell/last-stage.ts (MỚI — ghi/đọc lastStage per project qua localStorage, hook ghi đặt ở nơi đổi chặng: grep StageSwitcher/setPhase, sửa TỐI THIỂU 1 điểm ghi). KHÔNG đụng render-studio/cad/present-editor ngoài 1 dòng hook ghi lastStage (nếu điểm ghi nằm trong Header/StageSwitcher thì được phép sửa tối thiểu file đó).
④VIỆC: (1) [marker: ProjectOverviewCard] card mới: tên dự án · quy mô (loaiHinh + dienTichM2 từ ProjectProfile — thiếu thì ẩn dòng, không bịa) · "bắt đầu từ <ngày>" · PresenceRow avatar thành viên online màu/offline trắng-đen (nguồn: roster/presence sẵn có của PresenceBar — đọc cách nó fetch) · click card → nhảy STAGE ĐANG DỞ [marker: lastStage] (mặc định concept nếu chưa có). (2) Giữ mọi hành vi cũ (Đổi bìa, Chi tiết, filter, gallery/list toggle). (3) Chữ theo SPEC-NGON-NGU (≤12 từ), token globals, hover thẻ 1.02+lift 200ms.
⑤RÀNG BUỘC: không git · không server · không hex mới · 2 theme qua biến.
⑥NGHIỆM THU: tsc 0 · test liên quan pass.
⑦BÁO CÁO: docs/bao-cao-phien/2026-08-12-H2-home-overview.md (khuôn chuẩn + 2 GIÁ TRỊ).
⑧DÂY MÁY: home-overview-card. Agent KHÔNG sửa registry.
