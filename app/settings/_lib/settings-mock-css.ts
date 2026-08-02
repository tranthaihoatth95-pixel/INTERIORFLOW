// app/settings/_lib/settings-mock-css.ts — CSS port 1:1 từ docs/mocks/mock-settings-polished.html.
// Cùng luật với components/filemanager/files-mock-css.ts: px/gradient/bóng/bo góc trang trí giữ
// NGUYÊN VĂN; màu bề mặt/chữ/viền đổi hex tĩnh → biến CSS thật của app (globals.css) — xem bảng
// map + lý do ở đầu files-mock-css.ts (không lặp lại ở đây). Icon = lucide-react, không glyph.
export const SETTINGS_MOCK_CSS = `
.if-settings-app{display:flex;height:100%;max-width:1440px;margin:0 auto;color:var(--t1);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.if-settings-app *{box-sizing:border-box}

/* Rail riêng ĐÃ XOÁ 03/08 — /settings dùng chung components/LeftRail.tsx toàn app. */
.if-settings-app .main{flex:1;padding:26px 34px 30px 18px;overflow:auto}
.if-settings-app h1{font-size:22px;margin:0;letter-spacing:-.02em;font-weight:600}
.if-settings-app .sub{font-size:12px;color:var(--t2);margin-top:3px}
.if-settings-app .backlink{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--t2);margin-bottom:10px;background:none;border:0;padding:0;cursor:pointer}

.if-settings-app .cols{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:22px;max-width:1000px}
.if-settings-app .card{background:var(--panel);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow-node);padding:18px}
.if-settings-app .card h3{font-size:13px;margin:0 0 3px;display:flex;align-items:center;gap:8px;color:var(--t1);font-weight:600}
.if-settings-app .card .hint{font-size:11px;color:var(--t2);margin-bottom:14px}

.if-settings-app .avrow{display:flex;align-items:center;gap:16px}
.if-settings-app .avbig{width:68px;height:68px;border-radius:50%;border:3px solid var(--panel);box-shadow:0 6px 18px rgba(40,38,35,.18);position:relative;flex:none;overflow:hidden}
.if-settings-app .avbig .edit{position:absolute;right:-2px;bottom:-2px;width:26px;height:26px;border-radius:50%;background:var(--t1);color:var(--panel);display:flex;align-items:center;justify-content:center;border:2px solid var(--panel);cursor:pointer}
.if-settings-app .avname{font-size:15px;font-weight:700;color:var(--t1)}
.if-settings-app .avmail{font-size:11.5px;color:var(--t2)}
.if-settings-app .avgrid{display:flex;flex-wrap:wrap;gap:9px;margin-top:14px}
.if-settings-app .avo{width:52px;height:52px;flex:0 0 auto;border-radius:50%;position:relative;border:2px solid transparent;padding:0;background:none;cursor:pointer;overflow:hidden}
.if-settings-app .avo.sel{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.if-settings-app .avo.add{border:1.5px dashed var(--t3);display:flex;align-items:center;justify-content:center;color:var(--t3);background:var(--field)}

.if-settings-app .thgrid{display:flex;gap:10px}
.if-settings-app .th{width:130px;height:120px;border:2px solid var(--border);border-radius:var(--radius-md);overflow:hidden;position:relative;padding:0;background:var(--panel);cursor:pointer;display:flex;flex-direction:column}
.if-settings-app .th.sel{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.if-settings-app .th .prev{flex:1;position:relative}
.if-settings-app .th .prev .mb{position:absolute;left:8px;top:8px;right:8px;bottom:8px;border-radius:var(--radius-sm)}
.if-settings-app .th .lb{font-size:11px;font-weight:600;text-align:center;padding:7px;color:var(--t1)}
.if-settings-app .th .tick{position:absolute;right:7px;top:7px;width:17px;height:17px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center}

.if-settings-app .wpgrid{display:grid;grid-template-columns:repeat(6,64px);gap:9px}
.if-settings-app .wp{width:64px;height:48px;border-radius:var(--radius-sm);border:2px solid transparent;padding:0;cursor:pointer}
.if-settings-app .wp.sel{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.if-settings-app .wp.none{border:1.5px dashed var(--t3);background:var(--field);display:flex;align-items:center;justify-content:center;color:var(--t3);font-size:10px}

.if-settings-app .pathbox{display:flex;align-items:center;gap:11px;background:var(--field);border-radius:var(--radius-sm);padding:11px 13px}
.if-settings-app .pathbox .fi{width:32px;height:27px;border-radius:var(--radius-sm);background:linear-gradient(180deg,#8f7df7,#6a57f5);position:relative;flex:none}
.if-settings-app .pathbox .fi::before{content:"";position:absolute;top:-4px;left:0;width:14px;height:6px;border-radius:4px 4px 0 0;background:#8f7df7}
.if-settings-app .pathbox .p{flex:1;min-width:0}
.if-settings-app .pathbox .pp{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--t1)}
.if-settings-app .pathbox .ps{font-size:10.5px;color:var(--success);display:flex;align-items:center;gap:5px;margin-top:1px}
.if-settings-app .pathbox .dot{width:6px;height:6px;border-radius:50%;background:var(--success)}
.if-settings-app .ghost{border:1px solid var(--border);background:var(--panel);border-radius:var(--radius-sm);height:34px;padding:0 14px;font-size:12px;font-weight:600;color:var(--t1);cursor:pointer}
.if-settings-app .warn{font-size:10.5px;color:var(--t2);margin-top:9px;line-height:1.5}

.if-settings-app .seg{display:flex;background:var(--field);border-radius:var(--radius-sm);padding:3px;width:max-content}
.if-settings-app .seg span{padding:7px 16px;border-radius:var(--radius-sm);font-size:12px;color:var(--t3);cursor:pointer}
.if-settings-app .seg span.on{background:var(--panel);color:var(--t1);font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,.10)}
.if-settings-app .noterow{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-top:1px solid var(--border);font-size:12.5px}
.if-settings-app .noterow:first-of-type{border-top:0}
.if-settings-app .noterow .k b{display:block;font-weight:600;color:var(--t1)}
.if-settings-app .noterow .k span{font-size:10.5px;color:var(--t2)}
.if-settings-app .sw{width:36px;height:22px;border-radius:22px;background:var(--border-strong);position:relative;flex:none;border:0;cursor:pointer;padding:0}
.if-settings-app .sw.on{background:var(--accent)}
.if-settings-app .sw::after{content:"";position:absolute;width:18px;height:18px;border-radius:50%;background:#fff;top:2px;left:2px;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:left .12s}
.if-settings-app .sw.on::after{left:16px}

/* HOVER/FOCUS — docs/SPEC-HOVER-FOCUS-IDF.md §2. Thẻ chọn (theme/hình nền/avatar) là "thẻ nội
   dung" ⇒ lift nhẹ; segmented đổi màu chữ; mọi thứ bấm được có vòng focus accent 2px (§3.6). */
.if-settings-app .th,.if-settings-app .wp,.if-settings-app .avo{transition:transform .2s cubic-bezier(.32,.72,0,1),box-shadow .2s,border-color .15s}
.if-settings-app .th:hover,.if-settings-app .wp:hover,.if-settings-app .avo:hover{transform:translateY(-2px) scale(1.02);box-shadow:var(--shadow-pop)}
.if-settings-app .th:active,.if-settings-app .wp:active,.if-settings-app .avo:active{transform:scale(.99);transition-duration:.09s}
.if-settings-app .th:focus-visible,.if-settings-app .wp:focus-visible,.if-settings-app .avo:focus-visible,
.if-settings-app .ghost:focus-visible,.if-settings-app .sw:focus-visible,.if-settings-app .backlink:focus-visible,
.if-settings-app .avbig:focus-visible{outline:none;box-shadow:0 0 0 2px var(--accent),0 0 0 4px var(--panel)}
.if-settings-app .ghost{transition:background-color .12s,border-color .12s}
.if-settings-app .ghost:hover{background:var(--hover);border-color:var(--border-strong)}
.if-settings-app .seg span{transition:color .12s,background-color .12s}
.if-settings-app .seg span:hover{color:var(--t1)}
.if-settings-app .backlink{transition:color .12s}
.if-settings-app .backlink:hover{color:var(--t1)}
.if-settings-app .avbig{cursor:pointer;transition:transform .15s,box-shadow .15s}
.if-settings-app .avbig:hover{transform:scale(1.04)}

.if-settings-outer{height:100%;background:var(--bg)}

/* SPEC-HOVER-FOCUS-IDF §3.8 — reduced-motion: bỏ scale/lift, giữ đổi nền ngắn */
@media (prefers-reduced-motion:reduce){
  .if-settings-app .th:hover,.if-settings-app .wp:hover,.if-settings-app .avo:hover,
  .if-settings-app .th:active,.if-settings-app .wp:active,.if-settings-app .avo:active,
  .if-settings-app .avbig:hover{transform:none}
  .if-settings-app *{transition-duration:.1s!important}
}
`;
