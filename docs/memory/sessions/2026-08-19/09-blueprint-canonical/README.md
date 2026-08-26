# 09 · Blueprint canonical v1.0 — Reconciliation gate + 4 chốt (19/08)

> Dữ liệu FULL của nhánh việc, theo luật trí nhớ 2 lớp 15/08. Bản nén ở `docs/memory/LATEST.md`.

## Chuỗi việc

1. Hoà giao prompt Reconciliation (bản gốc: `PROMPT-GOC.md` trong thư mục này — copy từ
   `~/Downloads/INTERIORFLOW-ARCHITECTURE-RECONCILIATION-BLUEPRINT-PROMPT.md` để chống thất lạc).
   Điểm cứng Hoà giữ: **MAJOR MISSING CONCEPTS = 0 mới được sinh Blueprint** — Claude phải chứng
   minh từng ý có chỗ đứng, không vá prompt kiểu nhớ-ra-thêm.
2. T chạy Phase A bằng phiên phụ (coverage matrix 47 nhóm + terminology 23 từ + layer test),
   agent DỪNG ở gate → T rà → phát lệnh Phase B qua SendMessage (gate không tự-chấm-tự-qua).
3. Hoà chốt 4 DECISION CONFLICT qua trắc nghiệm NGAY TRONG LƯỢT; C4 Hoà tự sửa định nghĩa
   (đè cách diễn đạt "1 canvas chính + phụ" của T).
4. Phase B+C sinh `docs/IF-ARCHITECTURE-BLUEPRINT.md` (543 dòng, B1-B24, 11 mermaid, YAML).
5. T verify + đấu 4 dây chống mồ côi + đính chính drift (ADR M-01/M-03 RESOLVED · MAP #5 nâng tag
   · 00-CHOT 1 dòng · registry entry `blueprint-canonical`).

## Gate result (Phase A → sau chốt)

```
TOTAL 52 · COVERED 27→30 · PARTIAL 18→15 · MISSING 0 · CONFLICT 1→0
SUPERSEDED 5→6 · AMBIGUOUS 1 (NODE unit-of-work — giữ [UNKNOWN], cấm mượn chữ Node)
```

Matrix đầy đủ 47 nhóm + bảng 23 từ + layer test: nằm trong transcript phiên phụ Phase A
(báo cáo final message 19/08) và bản nén B22 của Blueprint. Điểm PARTIAL đáng nhớ:
lifecycle nghề 0 model · Client identity 0 model · Location 0 trường · Project Context = composer
chưa có · Memory/Knowledge layer 0 code (Notebook RỖNG) · Revision DAG chưa chốt (Q6 phẳng) ·
`Flow.graphJson` GAP-OWNERSHIP (A-5).

## 4 chốt Hoà 19/08

| # | Chốt |
|---|---|
| C1 | "Gateway" trần = AI Gateway · `lib/gateway/` = **Format Router** (docs-only, 0 rename) — đóng M-01 |
| C2 | **overrides THẮNG variant**: effective = template → variant → overrides — đóng M-03 |
| C3 | Workspace = môi trường compose giữ context; danh mục CẤP 0.5 (11/08) = các workspace **instance** chuẩn |
| C4 | **Project → nhiều Workspace → mỗi Workspace nhiều Canvas/Board + MỘT Project Flow/Timeline xuyên suốt** (graph nối [DESIGN DIRECTION]). Canvas = working surface · Workspace = working context · Project = identity+truth+genealogy. Canvas không độc lập dữ liệu. ⛔ KHÔNG phải "1 canvas sản xuất + vài phụ" — Hoà tự sửa. Khuyến nghị một-canvas của T 16/08 SUPERSEDED |

## 6 SUPERSEDED cấm hồi sinh (bản đầy đủ ở Blueprint B22)

matId=sku (07/08) · Lark hạ tầng lõi (03/08) · video dựng chặng 3 (02/08) · chợ đầu mối + hai NGĂN
(02/08 + 17/08 sáng) · auto mode-switch (BIGPICTURE 20/07) · một-canvas-duy-nhất (T 16/08).

## Chống mồ côi — 4 dây đã đấu

① registry `blueprint-canonical` (bangChung grep vào blueprint — mất là soi:frontier đỏ)
② con trỏ: `docs/CLAUDE.md` mục 1b + MAP header trỏ chéo + MAP #5 nâng tag — cùng lượt
③ `LATEST.md` bản nén 19/08
④ thư mục này (matrix + prompt gốc).
⚠️ Nguy cơ nhầm tên đã rào: `IF-ARCHITECTURE-BLUEPRINT-v1.md` là file CŨ KHÁC HẲN (8 luật vận hành)
— cả CLAUDE.md lẫn MAP đều có dòng cảnh báo.

## Chưa chắc / hạn dùng

Mermaid chưa render bằng mắt (lint tự viết) · hiện trạng kế thừa audit đọc-mã · blueprint ngoài
vùng canh soi:tu-dien (nợ mở scope docs/ gốc). Hạn dùng: vô hiệu từng phần khi Hoà db push/backfill
· ADR mới · Wave 1-2 thi công · Hoà chốt NODE/U-Q1-01/U-Q2-02.
