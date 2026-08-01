# INDEX · SPEC AI — InteriorFlow
> Lọc 24/07/2026. Gom mọi tài liệu liên quan **spec AI** đang nằm rải rác trong repo, phân theo nhóm + trạng thái.
> Đây là BẢN LỌC/CHỈ MỤC — nội dung chi tiết vẫn ở file gốc, không sao chép lại.
> Ký hiệu trạng thái: ✅ đã thực thi · 📋 đề xuất chưa làm · 🔬 nghiên cứu/khảo sát · ⚠️ lỗi thời

## A · Kiến trúc AI: tầng phụ thuộc, provider, an toàn
| File | Dòng | Nội dung | TT |
|---|---|---|---|
| `STRATEGY-ai-tiers-and-safety.md` | 80 | **Chiến lược 4 mức phụ thuộc AI** (cloud → oneAI → tự-host → không AI) + xử rủi ro AI bất ổn (hết balance, model đổi giá, kết quả dao động) | ✅ đã wire |
| `PLAN-oneAI-and-nodes.md` | 55 | Kế hoạch engine "oneAI" + mở rộng node; kèm hợp đồng phân việc song song | ✅ phần lớn |
| `RESEARCH-COMFYUI-LESS.md` | 151 | **Chạy app KHÔNG cần ComfyUI local** mà vẫn kế thừa hệ sinh thái ComfyUI. Khảo sát `lib/ai/tiers.ts` · `models.ts` · providers | 🔬 |
| `CLOUD-webgpu-pipeline.md` | 92 | Pipeline Stable Diffusion **chạy client-side bằng WebGPU** (AI miễn phí trên máy user) | 📋 chưa xong |

## B · Chặng Rendering — node & model AI
| File | Dòng | Nội dung | TT |
|---|---|---|---|
| `CATALOG-STAGE2-RENDERING.md` | 165 | **CHUẨN NHẤT (24/07)** — 30 node phân 5 nhóm, ma trận backend, model từng task (FLUX Depth/Canny, ESRGAN, Kling), thời gian chạy, gap | ✅ audit thật |
| `RENDER-NODES.md` | 128 | UX node render + hệ tag + Sketch Studio | ✅ |

## C · AI trong chặng CAD
| File | Dòng | Nội dung | TT |
|---|---|---|---|
| `CAD-AI-MECHANISM.md` | 277 | **Cơ chế "AI mô tả" → layout**: 1 câu mô tả ra mặt bằng sơ phác DD. Solver + ràng buộc | ✅ đã build (B1 fix obstacles 24/07) |

## D · Máy học "Gu Engine" (học gu, KHÔNG phải AI cloud)
| File | Dòng | Nội dung | TT |
|---|---|---|---|
| `ML-GU-ENGINE-PROPOSAL.md` | 365 | **Đề xuất Gu Engine cho cả 3 chặng** — feature → memory → suggestion. Ghi rõ "chưa được phép implement" | 📋 chờ duyệt |
| `REFERENCE-QA-AND-GU-ML.md` | 225 | (A) QA thư viện Reference (B) thiết kế Gu ML Engine | 📋 |
| `GU-PROFILE.md` | 49 | **DNA thẩm mỹ học từ ~1.500 pin Pinterest** — cluster màu k-means + Claude đọc ảnh | 🔬 dữ liệu |
| — | — | *Đã thực thi thật:* Perceptron learning-to-rank wired ở Presenting LayoutShelf + CAD AiBriefPanel | ✅ |

## E · AI phân loại nội dung / vật liệu
| File | Dòng | Nội dung | TT |
|---|---|---|---|
| `RESEARCH-LIBRARY-UPGRADE.md` | 572 | **Auto-classify bằng VLM** (NVIDIA `captionImage` → style/materials/room) + taxonomy đa tầng + hiển thị theo chặng | 📋 chưa thực thi |
| `RESEARCH-MATERIAL-BRIDGE.md` | 425 | Cầu vật liệu Larkbase ↔ Hatch CAD ↔ Rendering (AI đọc/gán vật liệu) | 📋 chưa thực thi |
| `PROMPT-MIA-material-tags.md` | 42 | Prompt gắn nhãn vật liệu | 🔬 |

## F · Vitals AI (trợ lý hội thoại)
| Nguồn | Nội dung | TT |
|---|---|---|
| `SPEC-VITALS-AI.md` | **Spec Vitals AI v0.1 (lưu 25/07)** — vai trò đã duyệt (xem `SPEC-VITALS-ROLE.md`), cơ chế còn draft. 6 nhóm tính năng: Ambient orb → canvas copilot → grounded citation → **function-calling tạo/sửa node** → multimodal (voice+ảnh) → audio overview. Mỗi nhóm có bậc N/P/L + phụ thuộc + trạng thái verify bằng code (1 ✅ · 2 🟡 · 3 ⬜). Kèm mục **Nguyên tắc trung tính** (đọc Brand Kit/GuProfile của DỰ ÁN, không ép gu studio) + nợ/rủi ro + câu hỏi chờ quyết | 🟡 vai trò ✅, cơ chế draft |
| Đã build thật | Giọt Vitals kéo 2 tầng (popover → NotebookLM full) · RAG auto-smart (có nguồn = grounded, không nguồn = general) · context-aware theo chặng | ✅ |
| `RESEARCH-CHAT-FULL.md` | 702 dòng — chat người-với-người (khác Vitals AI), có phần chạm AI | 📋 chặn bởi ACCESS-CONTROL (đã gỡ) |

## G · Không phải spec AI (chỉ nhắc thoáng — bỏ qua khi tra AI)
`CHANGELOG.md` · `STATUS.md` · `RESUME.md` · `MASTERPLAN-IF-ARCHINOTE.md` · `FINAL_ARCHITECTURE_REPORT.md` · `TECHNICAL_GLOSSARY.md` · `DEPLOY-CHECKLIST.md` · `DIAGNOSIS.md` · `LOGIC-AUDIT.md` · `RESEARCH-MIRO-COMPARISON.md` · `RESEARCH-ACCESS-CONTROL.md` · `RESEARCH-TEAM-COLLABORATION.md` · `STRATEGY-competitive-and-unification.md` · `HANDOFF-BRIEF.md` · `INSTALL-windows.md`

---

## Tổng kết trạng thái AI
- **Đang chạy thật**: 4 mức phụ thuộc AI · 30 node Rendering (fal FLUX + ComfyUI fallback) · AI brief CAD · Perceptron học gu · Vitals RAG auto-smart · VLM caption (dùng ở Notebook/taxonomy).
- **Đề xuất chưa làm**: Gu Engine đầy đủ · Library auto-classify · Material bridge · WebGPU local · Vitals Group 4-5 (function-calling, voice, kéo ảnh).
- **Nợ tài liệu ✅ đã trả (25/07)**: spec Vitals AI đã lưu thành `docs/SPEC-VITALS-AI.md` (vai trò đã duyệt, cơ chế còn draft). Cơ chế chưa duyệt ⇒ chưa code Nhóm 4/5/6.
- **Cần rà lại theo luật mới** (IF là sản phẩm global, không dính TTT): `GU-PROFILE.md` là gu CÁ NHÂN của chủ dự án — với sản phẩm global thì gu phải học từ Reference của TỪNG dự án, không hardcode 1 gu.
