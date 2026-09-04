// components/three/ve3d-css.ts — CSS mode Vẽ 3D, PORT NGUYÊN VĂN `docs/mocks/mock-ve-3d.html`.
//
// L2: chép markup+CSS, không vẽ lại bằng mắt. Giữ nguyên mọi số của mock: sidebar 256px ·
// tab 9px dọc + gạch chân 2px accent · thumbnail swatch 46px · tên 9px · matId 8px màu accent ·
// hint nền nhạt viền đứt · ViewCube 60px góc trên phải · trục toạ độ 90px góc dưới trái.
//
// MÀU: hex bề mặt/chữ/viền của mock đổi sang biến thật `app/globals.css` (cấm hardcode — L4), nên
// mode này tự đúng CẢ 2 THEME. Bảng map: #eceae7→--bg · #fff→--panel · #e6e3de→--border ·
// #2b2b30→--t1 · #9a9aa2→--t2 · #c3c1bc→--t3 · #f4f2ef→--field · accent/accent-soft giữ nguyên tên.
// GIỮ hex: 3 màu TRỤC X/Y/Z và gradient thumbnail vật liệu — đây là mã màu NGỮ NGHĨA đã chốt
// (`SPEC-DESIGN-SYSTEM-IF` §1 "Trục 3D": X #e05c5c · Y #3fb984 · Z #4a78e0), không được đổi
// theo theme vì trục X phải luôn là đỏ.
//
// BO GÓC: về thang Apple 10/14/20/28 qua `var(--radius-*)` thay số lẻ của mock (9/8/16/11/20px).
export const VE3D_CSS = `
.if-ve3d{--ax-x:#e05c5c;--ax-y:#3fb984;--ax-z:#4a78e0;--fs-3xs:9px;--fs-2xs:11px;
  color:var(--t1);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.if-ve3d *{box-sizing:border-box}

/* ══════ COMMAND PANEL (ổ ② navigator) ══════ */
.if-ve3d.cmdp{width:100%;height:100%;display:flex;flex-direction:column;overflow:hidden;background:var(--panel)}
.if-ve3d .ctabs{display:flex;border-bottom:1px solid var(--border);flex:none}
.if-ve3d .ctabs button{flex:1;border:0;background:transparent;padding:9px 2px;font-size:var(--fs-2xs);
  color:var(--t2);display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;
  transition:background-color .12s var(--ease-apple),color .12s var(--ease-apple)}
/* SPEC-HOVER §2 "nút toolbar/icon-only": ĐỔI NỀN 120ms, KHÔNG scale */
.if-ve3d .ctabs button:hover{background:var(--hover);color:var(--t1)}
.if-ve3d .ctabs button.on{color:var(--accent);box-shadow:inset 0 -2px 0 var(--accent);font-weight:var(--fw-semi)}
.if-ve3d .ctabs button:focus-visible{outline:none;box-shadow:inset 0 0 0 2px var(--accent)}
.if-ve3d .sbody{padding:12px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;flex:1;min-height:0}

.if-ve3d .search{display:flex;align-items:center;gap:7px;border:1px solid var(--border);
  border-radius:var(--radius-sm);padding:8px 10px;font-size:var(--fs-xs);color:var(--t3);background:var(--field);flex:none}
.if-ve3d .search input{flex:1;min-width:0;border:0;background:none;outline:none;color:var(--t1);font:inherit}
.if-ve3d .search input::placeholder{color:var(--t4)}

/* engine chips — pill, hover đổi nền (không scale: nằm trong hàng lặp) */
.if-ve3d .mtabs{display:flex;gap:6px;flex:none;flex-wrap:wrap}
.if-ve3d .mtabs button{font-weight:var(--fw-semi);font-size:var(--fs-2xs);padding:5px 11px;border:1px solid var(--border);
  border-radius:9999px;color:var(--t2);background:var(--panel);cursor:pointer;
  transition:background-color .12s var(--ease-apple),color .12s var(--ease-apple),border-color .12s}
.if-ve3d .mtabs button:hover{background:var(--hover);color:var(--t1)}
.if-ve3d .mtabs button.on{background:var(--accent-soft);border-color:transparent;color:var(--accent)}
.if-ve3d .mtabs button:focus-visible{outline:none;box-shadow:0 0 0 2px var(--accent)}

.if-ve3d .gcap{font-size:var(--fs-3xs);letter-spacing:.06em;text-transform:uppercase;color:var(--t4);
  font-weight:700;margin:2px 0 -2px}
/* lưới swatch 4 cột (brief 03/08; mock vẽ 3 cột — xem báo cáo) */
.if-ve3d .mgrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
/* SPEC-HOVER §2 "swatch vật liệu": ĐƯỢC scale 1.04 150ms (nhỏ + đơn lẻ) */
/* flex-column + con display:block: mock dùng <div> (block), ở đây phải là <span> vì nội dung hợp lệ
   của <button> là phrasing content ⇒ nếu để mặc định inline thì .mn/.id trôi cùng dòng, tràn khỏi ô
   rồi bị overflow:hidden CẮT MẤT tiền tố matId ("W-102" hiện thành "102") — bug thật bắt khi verify,
   mà matId chính là thứ quan trọng nhất ở đây (moat). */
.if-ve3d .msw{border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden;background:var(--panel);
  padding:0;cursor:pointer;text-align:left;display:flex;flex-direction:column;min-width:0;
  transition:transform .15s var(--ease-apple),box-shadow .15s,border-color .15s}
.if-ve3d .msw:hover{transform:scale(1.04);box-shadow:var(--shadow-node)}
.if-ve3d .msw:active{transform:scale(.98);transition-duration:.08s}
.if-ve3d .msw.on{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-soft)}
.if-ve3d .msw:focus-visible{outline:none;border-color:var(--accent);box-shadow:0 0 0 2px var(--accent)}
.if-ve3d .msw .th{height:46px;display:block;flex:none}
.if-ve3d .msw .mn{display:block;font-size:var(--fs-3xs);padding:3px 5px 0;color:var(--t2);font-weight:var(--fw-semi);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* matId KHÔNG được cắt — đây là khoá thật của moat. Ô hẹp thì thu chữ, không ẩn ký tự. */
.if-ve3d .msw .id{display:block;font-size:8px;color:var(--accent);padding:0 5px 4px;
  font-family:ui-monospace,Menlo,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

.if-ve3d .hint{font-size:10.5px;color:var(--t3);line-height:1.45;background:var(--field);
  border:1px dashed var(--border);border-radius:var(--radius-sm);padding:7px 9px}
.if-ve3d .hint b{color:var(--t1)}
.if-ve3d .hint code{background:var(--accent-soft);color:var(--accent);border-radius:4px;padding:0 4px;
  font-size:10px;font-family:ui-monospace,Menlo,monospace}

/* lưới nút "Tạo" — 3 cột nút vuông */
.if-ve3d .tgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.if-ve3d .tool{aspect-ratio:1;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--panel);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;cursor:pointer;
  color:var(--t2);font-size:var(--fs-3xs);font-weight:var(--fw-semi);padding:4px;
  transition:background-color .12s var(--ease-apple),color .12s var(--ease-apple),border-color .12s}
/* nút công cụ: đổi nền 120ms, KHÔNG scale (SPEC-HOVER §4 cấm scale nút toolbar) */
.if-ve3d .tool:hover{background:var(--hover);color:var(--t1)}
.if-ve3d .tool.on{background:var(--accent-soft);border-color:transparent;color:var(--accent)}
.if-ve3d .tool:focus-visible{outline:none;border-color:var(--accent);box-shadow:0 0 0 2px var(--accent)}
.if-ve3d .tool svg{color:inherit}

/* hàng lệnh dạng list (Tạo→nguồn khác · Sửa · Camera) */
.if-ve3d .row{display:flex;align-items:center;gap:8px;font-size:11.5px;padding:7px 9px;border:1px solid var(--border);
  border-radius:var(--radius-sm);background:var(--panel);color:var(--t2);width:100%;cursor:pointer;text-align:left;
  transition:background-color .1s var(--ease-apple),color .1s}
.if-ve3d .row:hover{background:var(--hover);color:var(--t1)}
.if-ve3d .row:focus-visible{outline:none;box-shadow:0 0 0 2px var(--accent)}
.if-ve3d .row .k{margin-left:auto;font-size:var(--fs-3xs);color:var(--t4);font-variant-numeric:tabular-nums}

.if-ve3d .shelf{border-top:1px solid var(--border);padding-top:10px;margin-top:2px;display:flex;
  flex-direction:column;gap:6px}
.if-ve3d .zt{font-size:var(--fs-3xs);letter-spacing:.05em;color:var(--t4);font-weight:700;text-transform:uppercase}

/* ô số (cao độ, kích thước, ống kính) */
.if-ve3d .fields{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.if-ve3d .fld{display:flex;flex-direction:column;gap:3px}
.if-ve3d .fld label{font-size:var(--fs-3xs);color:var(--t4);font-weight:var(--fw-semi)}
.if-ve3d .fld .box{display:flex;align-items:center;gap:4px;border:1px solid var(--border);border-radius:var(--radius-sm);
  background:var(--field);padding:6px 8px}
.if-ve3d .fld input{flex:1;min-width:0;border:0;background:none;outline:none;color:var(--t1);font:inherit;
  font-size:var(--fs-xs);font-variant-numeric:tabular-nums}
.if-ve3d .fld .u{font-size:var(--fs-3xs);color:var(--t4);flex:none}
.if-ve3d .fld .box:focus-within{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-soft)}

/* outliner (tab Hiện) — hàng list: đổi nền 100ms, KHÔNG scale */
.if-ve3d .outl{display:flex;flex-direction:column;gap:2px}
.if-ve3d .orow{display:flex;align-items:center;gap:7px;padding:6px 8px;border-radius:var(--radius-sm);
  font-size:11.5px;color:var(--t2);background:none;border:0;width:100%;text-align:left;cursor:pointer;
  transition:background-color .1s var(--ease-apple)}
.if-ve3d .orow:hover{background:var(--hover)}
.if-ve3d .orow.on{background:var(--accent-soft);color:var(--accent);font-weight:var(--fw-semi)}
.if-ve3d .orow:focus-visible{outline:none;box-shadow:0 0 0 2px var(--accent)}
.if-ve3d .orow .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.if-ve3d .orow .ib{width:22px;height:22px;display:flex;align-items:center;justify-content:center;border:0;
  background:none;color:var(--t4);border-radius:6px;cursor:pointer;flex:none;transition:background-color .1s,color .1s}
.if-ve3d .orow .ib:hover{background:var(--hover);color:var(--t1)}
.if-ve3d .orow .ib.off{color:var(--t5)}
.if-ve3d .orow .ib:focus-visible{outline:none;box-shadow:0 0 0 2px var(--accent)}
.if-ve3d .empty{font-size:var(--fs-xs);color:var(--t4);padding:14px 2px;text-align:center;line-height:1.5}

/* ══════ VIEWPORT 3D (ổ ③ canvas) ══════ */
.if-ve3d.vp3d{position:relative;width:100%;height:100%;overflow:hidden;background:var(--bg)}
.if-ve3d .vpscene{position:absolute;inset:0}
/* 21/08 — GỐC BỆNH "3D không dùng được" trên màn retina: Scene3DViewer gọi renderer.setSize(w,h,
   FALSE) (không ghi style, :742) + setPixelRatio(min(dpr,1.5)) (:225) ⇒ buffer canvas = container
   × 1.5, và vì KHÔNG có luật CSS nào ghim cỡ HIỂN THỊ, trình duyệt vẽ canvas Ở ĐÚNG CỠ BUFFER —
   tràn 50% ra ngoài container rồi bị .vp3d overflow:hidden cắt cụt: chỉ thấy 2/3 khung hình,
   raycast/NDC lệch theo. DPR=1 thì buffer=container nên không ai thấy — bệnh CHỈ PHÁT TRÊN RETINA,
   nên bộ kiểm headless mặc định (DPR=1) không bao giờ bắt được. Đây là khuôn chuẩn three.js cho
   setSize(…,false): CSS phải tự ghim canvas theo container. */
.if-ve3d .vpscene>canvas{display:block;width:100%;height:100%}
/* PHIẾU ĐỢT 7 NHÓM B — 96×96 (spec), khung ViewCube3D thật (renderer riêng, xem ViewCube3D.tsx);
   không còn <button> con — cube tự vẽ nhãn bằng texture, tự bắt pointer trên canvas của nó. */
.if-ve3d .viewcube{position:absolute;right:14px;top:14px;width:76px;height:76px;z-index:4;overflow:hidden;
  border-radius:20px;background:rgba(20,22,26,.30);border:1px solid rgba(255,255,255,.10)}
.if-ve3d .axisg{position:absolute;left:22px;bottom:22px;width:90px;height:90px;z-index:4;pointer-events:none}
/* ⚠️ Overlay trong viewport KHÔNG dùng màu theo theme.
   Scene3DViewer.tsx:105 đặt nền cảnh CỨNG #2a2d33 — luôn TỐI ở cả 2 theme (code 3D-1..3D-5
   có sẵn, việc này không được sửa). Nếu overlay chạy theo theme thì bản Sáng ra chữ mờ trên nền
   tối, bản Tối ra nút tối trên nền tối — sai cả hai chiều (đã thấy khi verify). Nên chốt: kính
   TỐI + chữ sáng cố định, tương phản đảm bảo bất kể theme. Đây là ngoại lệ CÓ CĂN CỨ với luật
   "màu qua biến", không phải tiện tay hardcode. */
.if-ve3d .vpover{background:rgba(20,22,26,.72);backdrop-filter:blur(var(--blur)) saturate(140%);
  -webkit-backdrop-filter:blur(var(--blur)) saturate(140%);border:1px solid rgba(255,255,255,.14);color:#e8e8ee}
.if-ve3d .vplabel{position:absolute;left:14px;top:14px;z-index:4;display:flex;align-items:center;gap:6px;
  border-radius:var(--radius-sm);font-size:var(--fs-2xs);padding:4px 9px}
.if-ve3d .vpnote{position:absolute;left:14px;bottom:14px;z-index:4;font-size:10.5px;
  border-radius:var(--radius-sm);padding:5px 9px;max-width:250px;line-height:1.45}
.if-ve3d .vpnote b{color:#fff}
/* G-M18-04 — nút "Toàn cảnh". CÙNG lý do màu cố định của .vpover trên (nền cảnh #2a2d33 luôn
   tối bất kể theme) NHƯNG KHÔNG backdrop-filter (G9: cảnh này đã có sẵn ViewCube + vplabel/vpnote
   dùng blur, thêm 1 tấm nữa là vượt ngân sách hiệu năng WebGL — dùng nền đặc thay kính). */
.if-ve3d .fitbtn{position:absolute;right:12px;top:120px;z-index:4;display:flex;align-items:center;
  gap:6px;height:var(--tap);padding:0 11px;border-radius:var(--radius-sm);
  background:rgba(20,22,26,.92);border:1px solid rgba(255,255,255,.14);color:#e8e8ee;
  font-size:var(--fs-2xs);font-weight:600;line-height:1.5;cursor:pointer;font-family:inherit}
.if-ve3d .fitbtn:hover{background:rgba(32,35,40,.92)}
.if-ve3d .fitbtn:disabled{opacity:.4;cursor:not-allowed}
/* ══════ OBJECT PROPERTIES (ổ ④ inspector) ══════ */
.if-ve3d.objp{width:100%;height:100%;overflow-y:auto;background:var(--panel);padding:12px;
  display:flex;flex-direction:column;gap:12px}
.if-ve3d .grp{display:flex;flex-direction:column;gap:7px}
.if-ve3d .gh{font-size:var(--fs-3xs);letter-spacing:.06em;text-transform:uppercase;color:var(--t4);font-weight:700}
.if-ve3d .kv{display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--t2)}
.if-ve3d .kv .k{flex:none;color:var(--t3)}
.if-ve3d .kv .v{margin-left:auto;color:var(--t1);font-variant-numeric:tabular-nums}
.if-ve3d .kv .v.mono{font-family:ui-monospace,Menlo,monospace;color:var(--accent)}
.if-ve3d .matline{display:flex;align-items:center;gap:8px;padding:7px 9px;border:1px solid var(--border);
  border-radius:var(--radius-sm);background:var(--field)}
.if-ve3d .matline .sw{width:26px;height:26px;border-radius:6px;flex:none;border:1px solid var(--border)}
.if-ve3d .matline .t{min-width:0;display:flex;flex-direction:column}
.if-ve3d .matline .t b{font-size:11.5px;font-weight:var(--fw-semi);color:var(--t1);overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
.if-ve3d .matline .t span{font-size:var(--fs-3xs);color:var(--accent);font-family:ui-monospace,Menlo,monospace}
/* CẢNH BÁO nguồn — dùng --warning đúng brief */
.if-ve3d .warn{display:flex;gap:7px;font-size:10.5px;line-height:1.45;color:var(--warning);
  background:color-mix(in srgb,var(--warning) 12%,transparent);border:1px solid color-mix(in srgb,var(--warning) 34%,transparent);
  border-radius:var(--radius-sm);padding:7px 9px}
.if-ve3d .warn svg{flex:none;margin-top:1px}
.if-ve3d .ok{display:flex;gap:7px;font-size:10.5px;line-height:1.45;color:var(--success);
  background:color-mix(in srgb,var(--success) 12%,transparent);border:1px solid color-mix(in srgb,var(--success) 30%,transparent);
  border-radius:var(--radius-sm);padding:7px 9px}
.if-ve3d .ok svg{flex:none;margin-top:1px}
/* CHINH-5 chữ→icon (SPEC-PANEL-ROLLOUT §3): chấm trạng thái · chip engine · xích đứt gọn */
.if-ve3d .dot{width:9px;height:9px;border-radius:50%;flex:none;display:inline-block}
.if-ve3d .dot.sync{background:var(--success)}
.if-ve3d .dot.detached{background:var(--warning)}
.if-ve3d .chips{display:flex;gap:5px;align-items:center}
.if-ve3d .chip{font-size:9.5px;font-weight:var(--fw-semi);letter-spacing:.02em;padding:2px 7px;
  border-radius:999px;border:1px solid var(--border);color:var(--t1);background:var(--field)}
.if-ve3d .chip.lit{border-color:color-mix(in srgb,var(--success) 45%,transparent);
  color:var(--success);background:color-mix(in srgb,var(--success) 10%,transparent)}
.if-ve3d .warn.mini{padding:5px 8px;align-items:center;gap:6px}
.if-ve3d .warn.mini svg{margin-top:0}
.if-ve3d .tgl{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11.5px;color:var(--t2)}
.if-ve3d .sw2{width:34px;height:20px;border-radius:9999px;background:var(--border-strong);position:relative;flex:none;
  border:0;cursor:pointer;padding:0;transition:background-color .15s}
.if-ve3d .sw2.on{background:var(--accent)}
.if-ve3d .sw2::after{content:"";position:absolute;width:16px;height:16px;border-radius:50%;background:#fff;
  top:2px;left:2px;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:left .15s var(--ease-apple)}
.if-ve3d .sw2.on::after{left:16px}
.if-ve3d .sw2:focus-visible{outline:none;box-shadow:0 0 0 2px var(--accent)}

@media (prefers-reduced-motion:reduce){
  .if-ve3d *{animation:none!important;transition-duration:.1s!important}
  .if-ve3d .msw:hover,.if-ve3d .msw:active{transform:none!important}
}
`;
