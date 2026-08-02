// components/filemanager/files-mock-css.ts — CSS cho /files.
//
// Gốc: port từ `docs/mocks/mock-files-polished.html`. Ba lần chỉnh sau đó, theo đúng chỉ đạo:
//  1. MÀU: mọi bề mặt/chữ/viền đi qua biến CSS THẬT của app (`app/globals.css`) — cấm hardcode hex
//     (`docs/LUAT-GIAO-DIEN-BAT-BUOC.md` L4). Nhờ vậy bản Tối ăn đúng bảng màu tối đã kiểm chứng
//     thay vì tự chế bảng riêng (nguyên nhân bug chữ trắng-trên-trắng đã sửa).
//  2. BO GÓC: về thang Apple **10 / 14 / 20 / 28** (`--radius-sm/md/lg/xl`) thay các số lẻ của mock
//     (12/13/16/19/26) — chỉ đạo 03/08. Bo tròn hoàn toàn (nút icon, chip) vẫn `50%`/`9999px`.
//  3. HOVER/FOCUS/PRESS: theo bảng tra `docs/SPEC-HOVER-FOCUS-IDF.md` §2 — thẻ nội dung thì LIFT,
//     ô danh sách CHỈ đổi nền (không scale, vì lặp nhiều), tab/segmented đổi màu chữ. `focus-visible`
//     luôn có vòng accent 2px offset 2px (§3 luật 6). `prefers-reduced-motion` bỏ scale/lift (§3.8).
//
// KHÔNG đổi: gradient trang trí (ảnh trong fan, icon thư mục tím, khối doc xem trước) — đây là
// NỘI DUNG minh hoạ, không phải bề mặt UI, phải đứng yên bất kể theme.
//
// Rail riêng ĐÃ XOÁ khỏi file này 03/08 — `/files` dùng chung `components/LeftRail.tsx` toàn app.
export const FILES_MOCK_CSS = `
.if-files-app{display:flex;height:100dvh;max-width:1440px;margin:0 auto;color:var(--t1);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.if-files-app *{box-sizing:border-box}

.if-files-app .main{flex:1;display:flex;flex-direction:column;padding:26px 30px 22px 18px;min-width:0;position:relative}
.if-files-app .crumbrow{display:flex;align-items:center;gap:14px}
.if-files-app h1{font-size:22px;margin:0;letter-spacing:-.02em;font-weight:600}
.if-files-app .sub{font-size:12px;color:var(--t2);margin-top:3px}
.if-files-app .crumbs{display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--t2);margin-top:20px;flex-wrap:wrap}
.if-files-app .crumbs b{color:var(--t1);font-weight:600}
.if-files-app .crumbs .c{padding:4px 9px;border-radius:var(--radius-sm);border:0;background:none;font:inherit;color:inherit;cursor:pointer;transition:background-color .12s}
.if-files-app .crumbs .c:hover{background:var(--hover)}
.if-files-app .crumbs .c:focus-visible{outline:none;box-shadow:0 0 0 2px var(--accent);border-radius:var(--radius-sm)}
.if-files-app .toolrow{margin-left:auto;display:flex;align-items:center;gap:8px}

/* segmented — SPEC-HOVER §2 "Tab/segmented": hover đổi màu chữ 120ms, chọn = nền nổi */
.if-files-app .viewseg{display:flex;background:var(--field);border-radius:var(--radius-md);padding:3px}
.if-files-app .viewseg button{width:32px;height:28px;display:flex;align-items:center;justify-content:center;border:0;background:none;border-radius:var(--radius-sm);color:var(--t3);cursor:pointer;transition:color .12s,background-color .12s}
.if-files-app .viewseg button:hover{color:var(--t1)}
.if-files-app .viewseg button.on{background:var(--panel);color:var(--t1);box-shadow:0 1px 3px rgba(0,0,0,.10)}
.if-files-app .viewseg button:focus-visible{outline:none;box-shadow:0 0 0 2px var(--accent)}

/* nút chính — icon+chữ; hover đổi nền, press scale .97 (SPEC-HOVER §2 dòng nút toolbar) */
.if-files-app .upbtn{display:flex;align-items:center;gap:7px;background:var(--t1);color:var(--panel);border:0;border-radius:9999px;height:38px;padding:0 18px;font-size:12.5px;font-weight:600;box-shadow:0 4px 14px rgba(38,38,43,.25);cursor:pointer;transition:opacity .12s,transform .08s}
.if-files-app .upbtn:hover{opacity:.88}
.if-files-app .upbtn:active{transform:scale(.97)}
.if-files-app .upbtn:focus-visible{outline:none;box-shadow:0 0 0 2px var(--accent),0 0 0 4px var(--panel)}

.if-files-app .permnote,.if-files-app .fsnote{display:flex;align-items:center;gap:5px;font-size:11.5px;margin-top:8px}
.if-files-app .permnote{color:var(--t2)}
.if-files-app .fsnote{color:var(--warning);background:color-mix(in srgb,var(--warning) 12%,transparent);border-radius:var(--radius-sm);padding:7px 10px;line-height:1.45}

/* THẺ nội dung (thư mục / file dạng lưới) — SPEC-HOVER §2: lift translateY(-2px)+scale 1.02 200ms,
   press .99 90ms, chọn = viền accent + halo accent-soft. Chữ bên trong KHÔNG scale riêng (§3.2). */
.if-files-app .folders{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap}
.if-files-app .folders.list{flex-direction:column}
.if-files-app .fol{display:flex;align-items:center;gap:10px;background:var(--panel);border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 14px;box-shadow:var(--shadow-node);font-size:12.5px;cursor:pointer;text-align:left;transition:transform .2s cubic-bezier(.32,.72,0,1),box-shadow .2s,border-color .15s}
.if-files-app .fol:hover{transform:translateY(-2px) scale(1.02);box-shadow:var(--shadow-pop)}
.if-files-app .fol:active{transform:scale(.99);transition-duration:.09s}
.if-files-app .fol:focus-visible{outline:none;border-color:var(--accent);box-shadow:0 0 0 2px var(--accent)}
.if-files-app .fol.sel{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.if-files-app .fol .ic{width:30px;height:26px;border-radius:7px 7px 8px 8px;position:relative;background:linear-gradient(180deg,#8f7df7,#6a57f5);flex:none}
.if-files-app .fol .ic::before{content:"";position:absolute;top:-4px;left:0;width:14px;height:6px;border-radius:4px 4px 0 0;background:#8f7df7}
.if-files-app .fol.dim .ic{background:linear-gradient(180deg,#d8d5cf,#c2beb6)}
.if-files-app .fol.dim .ic::before{background:#d8d5cf}
.if-files-app .fol .ic.file{background:var(--field);border:1px solid var(--border)}
.if-files-app .fol .ic.file::before{display:none}
.if-files-app .fol b{font-weight:600;display:block;color:var(--t1)}
.if-files-app .fol .m{font-size:10.5px;color:var(--t2)}

/* DANH SÁCH — SPEC-HOVER §2 "Ô danh sách": CHỈ đổi nền 100ms, KHÔNG scale (lặp nhiều lần),
   đang chọn = viền trái accent 2px. */
.if-files-app .filelist{margin-top:22px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;background:var(--panel)}
.if-files-app .filehead,.if-files-app .filerow{display:grid;grid-template-columns:1fr 130px 90px;align-items:center;gap:10px;padding:9px 14px;font-size:12px;text-align:left}
.if-files-app .filehead{background:var(--field);color:var(--t3);font-size:10.5px;text-transform:uppercase;letter-spacing:.04em}
.if-files-app .filehead span:last-child,.if-files-app .filerow .fsize{text-align:right;font-variant-numeric:tabular-nums}
.if-files-app .filerow{width:100%;border:0;border-top:1px solid var(--border);border-left:2px solid transparent;background:none;color:var(--t1);cursor:pointer;transition:background-color .1s}
.if-files-app .filerow:hover{background:var(--hover)}
.if-files-app .filerow:focus-visible{outline:none;box-shadow:inset 0 0 0 2px var(--accent)}
.if-files-app .filerow.sel{border-left-color:var(--accent);background:var(--accent-soft)}
.if-files-app .filerow .ficon{display:none}
.if-files-app .filerow .fnamecell{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}
.if-files-app .filerow .fmeta{color:var(--t3);font-size:11px}
.if-files-app .filerow .fsize{color:var(--t2);font-size:11px}

.if-files-app .empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;border-radius:var(--radius-lg);border:1.5px dashed transparent;transition:border-color .15s,background-color .15s}
.if-files-app .empty.dragover{border-color:var(--accent);background:var(--accent-soft)}
.if-files-app .fan{position:relative;width:200px;height:150px;margin-bottom:26px}
.if-files-app .fan .ph{position:absolute;width:104px;height:104px;border-radius:var(--radius-lg);border:4px solid var(--panel);box-shadow:0 10px 26px rgba(40,38,35,.16)}
.if-files-app .fan .p1{background:linear-gradient(135deg,#b89b7a,#8a6f52);transform:rotate(-10deg);left:8px;top:14px}
.if-files-app .fan .p2{background:linear-gradient(135deg,#8a9a8f,#5f6f66);transform:rotate(7deg);right:8px;top:8px}
.if-files-app .fan .p3{background:linear-gradient(135deg,#d9c7b8,#a9987f);left:50%;top:26px;transform:translateX(-50%) rotate(-1deg);z-index:2}
.if-files-app .empty h2{font-size:19px;margin:0 0 6px;letter-spacing:-.01em;color:var(--t1);font-weight:600}
.if-files-app .empty p{font-size:13px;color:var(--t2);margin:0 0 20px}
.if-files-app .cta{background:var(--t1);color:var(--panel);border:0;border-radius:9999px;height:48px;padding:0 26px;font-size:14px;font-weight:600;box-shadow:0 6px 18px rgba(38,38,43,.28);cursor:pointer;transition:opacity .12s,transform .08s}
.if-files-app .cta:hover{opacity:.88}
.if-files-app .cta:active{transform:scale(.97)}
.if-files-app .cta:focus-visible{outline:none;box-shadow:0 0 0 2px var(--accent),0 0 0 4px var(--panel)}
.if-files-app .cta small{font-weight:400;opacity:.65;margin-left:8px;font-size:11px}

.if-files-app .dropveil{position:absolute;inset:18px;border:2px dashed var(--accent);background:var(--accent-soft);border-radius:var(--radius-lg);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;color:var(--accent);pointer-events:none;z-index:5}

.if-files-app .uptoast{position:absolute;left:50%;bottom:26px;transform:translateX(-50%);display:flex;align-items:center;gap:12px;background:var(--mat-panel);backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);border:1px solid var(--mat-hairline);border-radius:var(--radius-lg);padding:10px 14px;box-shadow:var(--shadow-pop);min-width:330px;z-index:6}
.if-files-app .uptoast .fic{width:38px;height:44px;border-radius:var(--radius-sm);background:var(--field);border:1px solid var(--border);position:relative;display:flex;align-items:flex-end;justify-content:center;padding-bottom:4px;flex:none}
.if-files-app .uptoast .badge{font-size:7.5px;font-weight:800;letter-spacing:.05em;background:var(--t1);color:var(--panel);border-radius:4px;padding:1px 5px}
.if-files-app .uptoast .meta{flex:1;min-width:0}
.if-files-app .uptoast .nm{font-size:12.5px;font-weight:600;color:var(--t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.if-files-app .uptoast .sz{font-size:10.5px;color:var(--t2);margin-top:1px}
.if-files-app .track{height:5px;border-radius:5px;background:var(--field);margin-top:7px;overflow:hidden}
.if-files-app .track i{display:block;height:100%;border-radius:5px;background:var(--accent);transition:width .3s ease-out}
.if-files-app .uptoast .pc{font-size:13px;font-weight:700;color:var(--accent);font-variant-numeric:tabular-nums}

.if-files-app .insp{width:308px;padding:26px 26px 22px 0;display:flex;flex-direction:column;gap:14px;overflow-y:auto}
.if-files-app .card{background:var(--panel);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow-node);padding:16px}
.if-files-app .storrow{display:flex;align-items:center;gap:14px}
.if-files-app .ring{width:64px;height:64px;flex:none;outline:none}
.if-files-app .stor .big{font-size:20px;font-weight:700;letter-spacing:-.02em;color:var(--t1)}
.if-files-app .stor .small{font-size:11px;color:var(--t2)}
.if-files-app .bars{margin-top:12px;display:flex;flex-direction:column;gap:8px}
.if-files-app .brow{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--t3)}
.if-files-app .brow .k{width:70px;flex:none}
.if-files-app .brow .tr{flex:1;height:4px;border-radius:4px;background:var(--field);overflow:hidden}
.if-files-app .brow .tr i{display:block;height:100%;border-radius:4px}
.if-files-app .brow .v{width:46px;text-align:right;color:var(--t2);font-variant-numeric:tabular-nums}

.if-files-app .fprev{border-radius:var(--radius-md);height:118px;background:radial-gradient(120px 80px at 30% 30%, #cfd9e8, transparent),linear-gradient(135deg,#e8edf4,#d5dde9);position:relative;display:flex;align-items:center;justify-content:center}
.if-files-app .fprev .doc{width:58px;height:70px;background:#fff;border-radius:var(--radius-sm);box-shadow:0 8px 20px rgba(60,80,110,.25);position:relative;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;letter-spacing:.05em;color:var(--accent)}
.if-files-app .fname{font-size:15px;font-weight:700;margin-top:12px;letter-spacing:-.01em;color:var(--t1);word-break:break-word}
.if-files-app .frow{display:flex;align-items:center;gap:8px;margin-top:5px;font-size:11.5px;color:var(--t2)}
.if-files-app .tagofficial{background:color-mix(in srgb, var(--success) 16%, var(--panel));color:var(--success);font-size:9.5px;font-weight:700;border-radius:6px;padding:2px 8px}
.if-files-app .matbox{margin-top:10px;padding:10px;border-radius:var(--radius-sm);background:var(--field);font-size:11.5px;color:var(--t2);display:flex;flex-direction:column;gap:3px}
.if-files-app .matbox>div{display:flex;justify-content:space-between;gap:8px}
.if-files-app .whorow{display:flex;align-items:center;gap:7px;margin-top:12px;font-size:11.5px;color:var(--t3)}
.if-files-app .whorow .av{width:20px;height:20px;border-radius:50%;overflow:hidden;display:block;flex:none}
.if-files-app .whorow b{color:var(--t1)}

.if-files-app .tabs{display:flex;background:var(--field);border-radius:var(--radius-md);padding:3px;margin-top:14px}
.if-files-app .tabs button{flex:1;text-align:center;font-size:11.5px;padding:6px;border-radius:var(--radius-sm);color:var(--t3);border:0;background:none;cursor:pointer;transition:color .12s,background-color .12s}
.if-files-app .tabs button:hover{color:var(--t1)}
.if-files-app .tabs button.on{background:var(--panel);color:var(--t1);font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.if-files-app .tabs button:focus-visible{outline:none;box-shadow:0 0 0 2px var(--accent)}
.if-files-app .desc{font-size:12px;color:var(--t3);line-height:1.55;margin-top:10px}
.if-files-app .cinput{flex:1;border-radius:var(--radius-sm);padding:6px 10px;font-size:12px;background:var(--field);color:var(--t1);border:1px solid var(--border)}
.if-files-app .cinput:focus-visible{outline:none;border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-soft)}
.if-files-app .cbtn{border-radius:var(--radius-sm);padding:0 10px;font-size:12px;background:var(--accent-soft);color:var(--accent);border:0;cursor:pointer;font-weight:600}
.if-files-app .openbtn{width:100%;margin-top:14px;background:var(--accent);color:#fff;border:0;border-radius:var(--radius-md);height:40px;font-size:12.5px;font-weight:600;box-shadow:0 5px 16px rgba(106,87,245,.32);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:opacity .12s,transform .08s}
.if-files-app .openbtn:hover{opacity:.9}
.if-files-app .openbtn:active{transform:scale(.97)}
.if-files-app .openbtn:focus-visible{outline:none;box-shadow:0 0 0 2px var(--accent),0 0 0 4px var(--panel)}
.if-files-app .empty-insp{padding:16px;font-size:12.5px;color:var(--t2)}
.if-files-app .quickfile{display:flex;justify-content:space-between;gap:8px;background:var(--field);border:0;border-left:2px solid transparent;border-radius:var(--radius-sm);padding:6px 9px;font-size:11.5px;color:var(--t1);cursor:pointer;text-align:left;transition:background-color .1s}
.if-files-app .quickfile:hover{background:var(--hover)}
.if-files-app .quickfile:focus-visible{outline:none;box-shadow:0 0 0 2px var(--accent)}

.if-files-outer{min-height:100dvh;background:var(--bg)}

/* SPEC-HOVER-FOCUS-IDF §3.8 — reduced-motion: bỏ scale/lift, chỉ giữ đổi nền ≤100ms */
@media (prefers-reduced-motion:reduce){
  .if-files-app .fol:hover,.if-files-app .fol:active,.if-files-app .upbtn:active,
  .if-files-app .cta:active,.if-files-app .openbtn:active{transform:none}
  .if-files-app *{transition-duration:.1s!important}
}
`;
