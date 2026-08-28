# PLAN GIAO VIỆC — 8 LUỒNG CẤU THÀNH IF (12/08/2026, khuôn §2b hợp đồng T)

> Phơi bày toàn bộ hạng mục cấu thành IF từ tổng thể → ngóc ngách, nhóm thành 8 LUỒNG —
> mỗi luồng = một nhánh gia phả = MỘT VAI sub-agent (chữ cái đầu). Xương sống nhất quán:
> mọi task đều treo vào 8 hệ CẤP 1 + bản đồ workspace đã chốt (00-CHOT 11/08); cấp Đ/F/L
> theo §2b. Nguồn task = frontier-registry (33 chờ) + gap đã cảnh báo. Hoà duyệt bảng này
> (chạm 2/3) → T xuất phiếu dán-được vào docs/phieu-giao/.

## SƠ ĐỒ 8 LUỒNG — ai giữ ngóc ngách nào

```
                    ┌────────────── IF ──────────────┐
   N · Nền & Nguồn      K · Kho          H · Hình & Mặt      D · Dựng
   (dữ liệu, format,    (Library·Gallery (design system,     (2D+3D core,
    an toàn)             ·packs)          shell, Home)        lệnh, hiệu năng vẽ)
   T · Trình            W · Việc & Luồng  C · Cổng           V · Vitals & AI
   (hồ sơ đầu ra,       (task, workspace, (duyệt nội bộ,     (3 window, DNA,
    Story Set, docType)  team-fit, feed)   họp, chat dự án)   Magic có căn cứ)
```

## LUỒNG N · NỀN & NGUỒN — vai "N" (hệ: DocCore · Một Nguồn)
Mục tiêu: mọi lời hứa một-nguồn có chỗ đựng dữ liệu thật, an toàn, truy vết.
| Task | Cấp | registry-id | Ghi chú thứ tự |
|---|---|---|---|
| Backup offsite tự động | Đ | backup-offsite | làm sớm — rủi ro một-đĩa |
| `.idfc` v1 (vỏ chung + ruột theo kind, migrate v1→v2) | L | (mở entry khi chốt phạm vi) | XƯƠNG của "đổi 1 lan 5" — sau build-recipe |
| Nhãn nguồn DataOrigin + lệnh reset trung tính | Đ | nhan-nguon-reset | |
| Smart Ingest (gốc bất biến + proxy + định tuyến) | F | smart-ingest | |
| DWG tách tiến trình | Đ | dwg-tach-tien-trinh | đợt 3, trước người ngoài |
| Cấy lại hatch T-junction | Đ | hatch-t-junction-cay-lai | |

## LUỒNG K · KHO — vai "K" (hệ: LibraryFirst)
Mục tiêu: "cửa hàng có gia phả" đúng Phiếu 4 + kho ảnh nuôi gu.
| Task | Cấp | registry-id |
|---|---|---|
| Gallery liên ngành (nhóm + xu hướng có nguồn) | F | gallery-lien-nganh |
| Gói hệ màu Pantone·Jotun·Dulux | Đ | color-system-packs |
| Neufert tách gói | Đ | neufert-tach-goi |
| Instance THAM SỐ + usages ("món này nằm ở 3 dự án") | F | (mở entry khi vào đợt) |
| Kệ ảnh ảo hoá 1.500+ món (giao với hieu-nang-do) | Đ | — thuộc hieu-nang-do |
| Company DNA Pack | F | company-dna-pack |

## LUỒNG H · HÌNH & MẶT — vai "H" (hệ: thang bo · LightState · shell)
Mục tiêu: "nhìn không biết máy vẽ" áp cho chính giao diện app.
| Task | Cấp | registry-id |
|---|---|---|
| ÁP thang bo đã duyệt + token --r-* + sửa top 10 + --strict | Đ | hinh-hoc-ap-thang |
| Sửa 81 chỗ lệch từ điển (nhãn hiển thị trước) | Đ | chong-lech-dinh-nghia (phần sửa) |
| Bento align vùng đầu 2D | Đ | bento-align-2d |
| Hover gradient kem + canvas tone be/xám | Đ | hover-gradient-kem |
| Home → Tổng quan dự án (card ProjectProfile + PresenceRow + lastStage) | F | home-overview-card |

## LUỒNG D · DỰNG — vai "D" (hệ: BuildRecipe · SnapCore · NhapLenh)
Mục tiêu: kịch bản 90-phút của Phiếu 3 chạy trọn.
| Task | Cấp | registry-id |
|---|---|---|
| Máy trạng thái công cụ 3D (mở 12 nút dock) | F | tool-state-3d |
| BuildRecipe stack non-destructive | L | build-recipe |
| SnapCore hợp nhất 2D↔3D | Đ | snap-hop-nhat |
| Dải số nổi + pie menu 3D (touch) | Đ | num-strip · pie-menu-3d |
| Camera mức nghề (2 điểm tụ · DOF · safe frame) | Đ | camera-pro |
| Nút xuất PNG sequence | Đ | capture-nut |
| ĐO hiệu năng có số (5k entity · 100k tam giác) | Đ | hieu-nang-do |

## LUỒNG T · TRÌNH — vai "T2" (hệ: Workspace hồ sơ · Story Set)
Mục tiêu: 6 loại hồ sơ từ thẻ "Sắp có" thành editor thật, Story Set thành sản phẩm bán.
| Task | Cấp | registry-id |
|---|---|---|
| Editor bảng-biểu-mẫu chung (schedule → spec-sheet → approval-form, nâng từ BOQ engine) | F | (mở entry khi chốt docType đầu) |
| Story Set v2: ăn Thẻ DNA thật + ambient tint + xuất PDF soi LUẬT | F | story-set (nâng) |
| Văn bản editor (mở khoá meeting-distill + biên bản) | F | (mock+spec sẵn) |
| BOQ nâng: nguồn giá + wastage + trạng thái ước tính/xác nhận | Đ | (spec sẵn) |

## LUỒNG W · VIỆC & LUỒNG — vai "W" (hệ: Workspace · TriTueDuAn)
Mục tiêu: Phiếu 1 "junior 9h không phải hỏi" khép vòng.
| Task | Cấp | registry-id |
|---|---|---|
| Các chặng ĐỌC focusEntity (khép deep-link) | Đ | focus-entity-doc |
| "Tạo việc từ đây" ở 3 chặng | Đ | tao-viec-tu-day |
| Dòng Hoạt Động (ref #13) | F | activity-feed |
| Chat nhóm NotebookLM (mock sẵn) | F | chat-ai-notebook |
| TeamFit bootstrap | F | team-fit |
| Milestone model + TIMELINE đầy đủ bảng khởi tạo | Đ | (mở entry cùng đợt) |
| Vòng người dùng thật TTT | L | nguoi-dung-that |

## LUỒNG C · CỔNG — vai "C" (hệ: Workspace duyệt/họp)
Mục tiêu: Phiếu 5 — vòng duyệt nội bộ chạy thật, CĐT ở ngoài hệ.
| Task | Cấp | registry-id |
|---|---|---|
| Comment neo đối tượng | Đ | comment-neo-doi-tuong |
| Review Gate (mốc → push → note gõ/voice → checklist → sạch mới gửi) | L | review-gate |
| Chat theo dự án (projectId) | Đ | chat-project |
| Meeting distill (3 dòng chảy — sau editor Văn bản) | L | meeting-distill |

## LUỒNG V · VITALS & AI — vai "V2" (hệ: ThinkDial · TriTueDuAn)
Mục tiêu: Magic có căn cứ, đúng "MVP là linh hồn".
| Task | Cấp | registry-id |
|---|---|---|
| Thẻ DNA Thiết kế (schema 8 lớp + 3 đầu ra + trạng thái + Distiller) | L | dna-card |
| Vitals 3 cấp window theo Siri (mock sẵn) | F | vitals-3-window |
| Seed-lock + khoá giữ vùng lên UI render | Đ | (mở entry khi vào đợt) |
| Magic prompt→build (đường mô tả → cụm tham số) | F | (chờ spec — luật không-spec-không-code) |

## NHỊP THI CÔNG — mỗi đợt ghép 3-4 luồng, đúng luật "1 cốt lõi + 1 nhìn thấy"

**ĐỢT 3 (đề xuất, chờ Hoà duyệt bảng này):**
- **D**·tool-state-3d (cốt lõi — mở 12 nút dock, nền cho build-recipe)
- **H**·hinh-hoc-ap-thang + sửa nhãn hiển thị lệch từ điển (nhìn thấy ngay toàn app)
- **W**·focus-entity-doc + tao-viec-tu-day (khép vòng Phiếu 1 — nối cốt lõi TaskContext vừa ship)
- **H**·home-overview-card (nhìn thấy — nối 3 món vừa ship: Profile+PresenceRow+lastStage)
- Kèm: **phiên duyệt mắt gộp #1** (trả nợ 24 xong-máy) + **N**·backup-offsite (rẻ, rủi ro thật)

Đợt 4 dự kiến: D·build-recipe + V2·dna-card + K·gallery + T2·editor bảng-biểu-mẫu.
Đợt 5: C·review-gate + W·activity-feed + D·camera-pro + hieu-nang-do. (Điều chỉnh theo 8 trụ.)
