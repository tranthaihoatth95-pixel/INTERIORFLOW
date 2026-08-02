// components/filemanager/files-mock-css.ts — CSS port 1:1 từ docs/mocks/mock-files-polished.html.
//
// MỌI px/gradient/bóng/bo góc/transform trang trí (fan ảnh, avatar, icon folder, doc-chip…) giữ
// NGUYÊN VĂN như file mock — không đổi số nào.
//
// MÀU BỀ MẶT/CHỮ/VIỀN đổi từ hex tĩnh của mock sang biến CSS THẬT của app (`app/globals.css`,
// đã có bảng sáng/tối kiểm chứng) — theo đúng yêu cầu sửa khẩn: "CẤM HARDCODE, màu qua biến" để
// theme Tối tự ăn đúng bảng màu tối chuẩn thay vì tự chế 1 bảng tối riêng (nguyên nhân bug
// tương phản trắng-trên-trắng ở bản Tối trước đó). Bảng map:
//   #edebe7 (mock --bg)    → var(--bg)      #fff (mock --panel) → var(--panel)
//   #e4e1db (mock --line)  → var(--border)  #26262b (mock --ink) → var(--t1)
//   #8f8f97 (mock --mut)   → var(--t2)      #f3f1ee (mock --chip) → var(--field)
//   #77777f / #5a5a62 (2 xám phụ không đặt tên trong mock) → var(--t3)
//   #1f9d6b/#e9f6ef (xanh trạng thái CHÍNH THỨC) → var(--success) / color-mix từ var(--success)
//   --sh/--sh-soft (bóng) → var(--shadow-pop)/var(--shadow-node) (đã theme-aware sẵn trong app)
// KHÔNG đổi: gradient trang trí (avatar mẫu, ảnh trong fan, icon folder tím, swatch preview
// theme/hình nền) — đây là NỘI DUNG minh hoạ (ảnh/mẫu), không phải bề mặt UI, phải đứng yên bất
// kể theme (ảnh không "theo tối/sáng").
//
// ICON = lucide-react, KHÔNG glyph/emoji (docs/LUAT-GIAO-DIEN-BAT-BUOC.md L4) — mock dùng glyph
// (▦◱🗀◈⚙⤒✎✓＋☰) chỉ để PHÁC THẢO vị trí/kích cỡ; JSX render icon lucide thật vào đúng chỗ đó,
// CSS ở đây chỉ định vị trí/khung (không đổi).
export const FILES_MOCK_CSS = `
.if-files-app{display:flex;height:100dvh;max-width:1440px;margin:0 auto;color:var(--t1);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.if-files-app *{box-sizing:border-box}

.if-files-app .rail{width:76px;display:flex;flex-direction:column;align-items:center;padding:18px 0}
.if-files-app .railcap{background:var(--panel);border:1px solid var(--border);border-radius:30px;box-shadow:var(--shadow-node);display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 8px}
/* bug #4 tự kiểm: bubble active tràn mép trái — nút 44px + scale(1.12) sát mép trong capsule
   padding 8px hai bên; giảm nút xuống 42px (chừa biên an toàn) + margin:0 + transform-origin
   giữa tường minh (mặc định đã là center, khai báo rõ để loại trừ nghi ngờ). */
.if-files-app .ri{width:42px;height:42px;margin:0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:17px;color:var(--t3);position:relative;text-decoration:none;transform-origin:center}
.if-files-app .ri.on{background:var(--t1);color:var(--panel);transform:scale(1.12);box-shadow:0 4px 12px rgba(38,38,43,.30)}
.if-files-app .ri .tip{position:absolute;left:52px;background:var(--t1);color:var(--panel);font-size:10.5px;border-radius:7px;padding:3px 9px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .12s}
.if-files-app .ri:hover .tip{opacity:1}
.if-files-app .railcap .sep{width:26px;height:1px;background:var(--border);margin:4px 0}
/* bug #6 tự kiểm: avatar rơi đáy màn (margin-top:auto đẩy xuống cuối .rail) — đổi sang cách
   railcap đúng 12px cố định, cùng trục dọc (align-items:center của .rail đã lo phần ngang). */
.if-files-app .rail .bottom{margin-top:12px}
.if-files-app .avatar{width:40px;height:40px;border-radius:50%;border:2px solid var(--panel);box-shadow:var(--shadow-node);overflow:hidden;display:block}

.if-files-app .main{flex:1;display:flex;flex-direction:column;padding:26px 30px 22px 10px;min-width:0;position:relative}
.if-files-app .crumbrow{display:flex;align-items:center;gap:14px}
.if-files-app h1{font-size:22px;margin:0;letter-spacing:-.02em;font-weight:600}
.if-files-app .sub{font-size:12px;color:var(--t2);margin-top:3px}
.if-files-app .crumbs{display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--t2);margin-top:20px;flex-wrap:wrap}
.if-files-app .crumbs b{color:var(--t1);font-weight:600}
.if-files-app .crumbs .c{padding:4px 9px;border-radius:8px;border:0;background:none;font:inherit;color:inherit;cursor:pointer}
.if-files-app .crumbs .c:hover{background:var(--field)}
.if-files-app .toolrow{margin-left:auto;display:flex;align-items:center;gap:8px}
.if-files-app .viewseg{display:flex;background:var(--field);border-radius:11px;padding:3px}
.if-files-app .viewseg span{width:32px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:8px;font-size:13px;color:var(--t3);cursor:pointer}
.if-files-app .viewseg span.on{background:var(--panel);color:var(--t1);box-shadow:0 1px 3px rgba(0,0,0,.10)}
/* bug #2 tự kiểm: nút Tải lên trông "xám như disabled" — gốc là render disabled+opacity:.4 ở
   root/thư mục chỉ đọc (đúng ý là ẩn hẳn khi không dùng được, không phải mờ đi trông như hỏng).
   JSX giờ chỉ render nút này khi canUpload=true, nên bỏ hẳn state disabled/opacity ở CSS —
   nút hiện ra LUÔN ở trạng thái đúng mock (nền đậm/chữ sáng theo cặp --t1/--panel, đổi đúng cả
   2 theme, không hardcode #fff — tránh lặp lại bug tương phản đã sửa ở vòng trước). */
.if-files-app .upbtn{display:flex;align-items:center;gap:7px;background:var(--t1);color:var(--panel);border:0;border-radius:19px;height:38px;padding:0 18px;font-size:12.5px;font-weight:600;box-shadow:0 4px 14px rgba(38,38,43,.25);cursor:pointer}

.if-files-app .folders{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap}
.if-files-app .fol{display:flex;align-items:center;gap:10px;background:var(--panel);border:1px solid var(--border);border-radius:13px;padding:10px 14px;box-shadow:var(--shadow-node);font-size:12.5px;cursor:pointer;text-align:left}
.if-files-app .fol .ic{width:30px;height:26px;border-radius:7px 7px 8px 8px;position:relative;background:linear-gradient(180deg,#8f7df7,#6a57f5)}
.if-files-app .fol .ic::before{content:"";position:absolute;top:-4px;left:0;width:14px;height:6px;border-radius:4px 4px 0 0;background:#8f7df7}
.if-files-app .fol.dim .ic{background:linear-gradient(180deg,#d8d5cf,#c2beb6)}
.if-files-app .fol.dim .ic::before{background:#d8d5cf}
.if-files-app .fol b{font-weight:600;display:block;color:var(--t1)}
.if-files-app .fol .m{font-size:10.5px;color:var(--t2)}

.if-files-app .empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0}
.if-files-app .fan{position:relative;width:200px;height:150px;margin-bottom:26px}
.if-files-app .fan .ph{position:absolute;width:104px;height:104px;border-radius:20px;border:4px solid var(--panel);box-shadow:0 10px 26px rgba(40,38,35,.16)}
.if-files-app .fan .p1{background:linear-gradient(135deg,#b89b7a,#8a6f52);transform:rotate(-10deg);left:8px;top:14px}
.if-files-app .fan .p2{background:linear-gradient(135deg,#8a9a8f,#5f6f66);transform:rotate(7deg);right:8px;top:8px}
.if-files-app .fan .p3{background:linear-gradient(135deg,#d9c7b8,#a9987f);left:50%;top:26px;transform:translateX(-50%) rotate(-1deg);z-index:2}
.if-files-app .empty h2{font-size:19px;margin:0 0 6px;letter-spacing:-.01em;color:var(--t1);font-weight:600}
.if-files-app .empty p{font-size:13px;color:var(--t2);margin:0 0 20px}
.if-files-app .cta{background:var(--t1);color:var(--panel);border:0;border-radius:26px;height:48px;padding:0 26px;font-size:14px;font-weight:600;box-shadow:0 6px 18px rgba(38,38,43,.28);cursor:pointer}
.if-files-app .cta small{font-weight:400;opacity:.65;margin-left:8px;font-size:11px}

.if-files-app .uptoast{position:absolute;left:50%;bottom:26px;transform:translateX(-50%);display:flex;align-items:center;gap:12px;background:var(--mat-panel);backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);border:1px solid var(--mat-hairline);border-radius:16px;padding:10px 14px;box-shadow:var(--shadow-pop);min-width:330px}
.if-files-app .uptoast .fic{width:38px;height:44px;border-radius:8px;background:var(--field);border:1px solid var(--border);position:relative;display:flex;align-items:flex-end;justify-content:center;padding-bottom:4px}
.if-files-app .uptoast .fic::before{content:"";position:absolute;top:0;right:0;border:7px solid transparent;border-top-color:var(--border);border-right-color:var(--border);border-radius:0 8px 0 0}
.if-files-app .uptoast .badge{font-size:7.5px;font-weight:800;letter-spacing:.05em;background:var(--t1);color:var(--panel);border-radius:4px;padding:1px 5px}
.if-files-app .uptoast .meta{flex:1;min-width:0}
.if-files-app .uptoast .nm{font-size:12.5px;font-weight:600;color:var(--t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.if-files-app .uptoast .sz{font-size:10.5px;color:var(--t2);margin-top:1px}
.if-files-app .track{height:5px;border-radius:5px;background:var(--field);margin-top:7px;overflow:hidden}
.if-files-app .track i{display:block;height:100%;border-radius:5px;background:var(--accent)}
.if-files-app .uptoast .pc{font-size:12px;font-weight:700;color:var(--accent);font-variant-numeric:tabular-nums}

.if-files-app .insp{width:308px;padding:26px 26px 22px 0;display:flex;flex-direction:column;gap:14px;overflow-y:auto}
.if-files-app .card{background:var(--panel);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-node);padding:16px}
.if-files-app .storrow{display:flex;align-items:center;gap:14px}
/* bug #3 tự kiểm: outline/focus ring lạ quanh gauge — SVG không tabIndex nên không tự nhận
   focus, nhưng vẫn khoá hẳn outline phòng trình duyệt/extension áp focus-visible mặc định. */
.if-files-app .ring{width:64px;height:64px;flex:none;outline:none}
.if-files-app .ring:focus{outline:none}
.if-files-app .stor .big{font-size:20px;font-weight:700;letter-spacing:-.02em;color:var(--t1)}
.if-files-app .stor .small{font-size:11px;color:var(--t2)}
.if-files-app .bars{margin-top:12px;display:flex;flex-direction:column;gap:8px}
.if-files-app .brow{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--t3)}
.if-files-app .brow .k{width:70px;flex:none}
.if-files-app .brow .tr{flex:1;height:4px;border-radius:4px;background:var(--field);overflow:hidden}
.if-files-app .brow .tr i{display:block;height:100%;border-radius:4px}
.if-files-app .brow .v{width:46px;text-align:right;color:var(--t2);font-variant-numeric:tabular-nums}
.if-files-app .fprev{border-radius:12px;height:118px;background:radial-gradient(120px 80px at 30% 30%, #cfd9e8, transparent),linear-gradient(135deg,#e8edf4,#d5dde9);position:relative;display:flex;align-items:center;justify-content:center}
.if-files-app .fprev .doc{width:58px;height:70px;background:#fff;border-radius:9px;box-shadow:0 8px 20px rgba(60,80,110,.25);position:relative;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;letter-spacing:.05em;color:var(--accent)}
.if-files-app .fprev .doc::before{content:"";position:absolute;top:0;right:0;border:8px solid transparent;border-top-color:#e6ebf2;border-right-color:#e6ebf2;border-radius:0 9px 0 0}
.if-files-app .fname{font-size:15px;font-weight:700;margin-top:12px;letter-spacing:-.01em;color:var(--t1)}
.if-files-app .frow{display:flex;align-items:center;gap:8px;margin-top:5px;font-size:11.5px;color:var(--t2)}
.if-files-app .tagofficial{background:color-mix(in srgb, var(--success) 16%, var(--panel));color:var(--success);font-size:9.5px;font-weight:700;border-radius:6px;padding:2px 8px}
.if-files-app .whorow{display:flex;align-items:center;gap:7px;margin-top:12px;font-size:11.5px;color:var(--t3)}
.if-files-app .whorow .av{width:20px;height:20px;border-radius:50%;overflow:hidden;display:block}
.if-files-app .whorow b{color:var(--t1)}
.if-files-app .tabs{display:flex;background:var(--field);border-radius:10px;padding:3px;margin-top:14px}
.if-files-app .tabs span{flex:1;text-align:center;font-size:11.5px;padding:6px;border-radius:8px;color:var(--t3);cursor:pointer}
.if-files-app .tabs span.on{background:var(--panel);color:var(--t1);font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.if-files-app .desc{font-size:12px;color:var(--t3);line-height:1.55;margin-top:10px}
.if-files-app .openbtn{width:100%;margin-top:14px;background:var(--accent);color:#fff;border:0;border-radius:12px;height:40px;font-size:12.5px;font-weight:600;box-shadow:0 5px 16px rgba(106,87,245,.32);cursor:pointer}
/* bug #5 tự kiểm: card rỗng chỉ 1 câu trơ — giờ chứa tóm tắt thư mục + tối đa 3 file (JSX), CSS
   bỏ ép text-align:center toàn khối (chỉ dòng "chọn thư mục" ở root mới tự canh giữa qua style
   riêng trong JSX). */
.if-files-app .empty-insp{padding:16px;font-size:12.5px;color:var(--t2)}

/* KHÔNG display:flex ở đây — biến .if-files-app (con) thành flex-item khiến width:auto co lại
   theo nội dung (shrink-to-fit) thay vì lấp đầy rồi bị max-width chặn ở 1440, PHÁ luôn margin:0
   auto (canh giữa lệch). .if-files-app phải là block bình thường như trong mock (con trực tiếp
   của <body>) — bug thật bắt khi verify ở viewport > 1440px (đo DOM: app.width chỉ 1130px dù
   max-width:1440, lệch tâm rõ). */
.if-files-outer{min-height:100dvh;background:var(--bg)}
`;
