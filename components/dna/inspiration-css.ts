// components/dna/inspiration-css.ts — CSS cho bề mặt Cảm hứng (`InspirationBoard`, marker
// `inspiration-surface`). Cùng cách làm `components/library/gallery-css.ts`: TOKEN CHUNG globals.css,
// KHÔNG hex tự chế (L4), thang bo `--r-1..--r-4`/`--r-full`, 2 theme tự động qua biến.
// Bề mặt biên tập bình thường (Home/Workspace rule) — KHÔNG lưới CAD vô hạn, không canvas node.
// Định danh thẻ = dải màu đặc 2px đáy (chốt 15/08), hover đậm lên.
export const INSPIRATION_CSS = `
.if-inspo{--fs-2xs:11px;line-height:1.5;box-sizing:border-box;background:var(--bg);min-height:100%;
     padding:20px 22px 40px;max-width:1440px;margin:0 auto;color:var(--t1)}
.if-inspo *{box-sizing:border-box}
.if-inspo .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

.ins-head{display:flex;flex-wrap:wrap;align-items:flex-end;gap:14px;margin-bottom:14px}
.ins-head h1{margin:0;font-size:20px;font-weight:var(--fw-semi);letter-spacing:-.015em}
.ins-head p{margin:4px 0 0;font-size:var(--fs-xs);color:var(--t3);max-width:60ch}
.ins-head-copy{flex:1;min-width:240px}
.ins-search{flex:none;width:min(260px,100%);height:var(--tap,32px);background:var(--field);
     border:1px solid var(--border);border-radius:var(--r-2);display:flex;align-items:center;gap:7px;
     padding:0 10px;color:var(--t4)}
.ins-search input{flex:1;min-width:0;border:0;background:none;outline:none;color:var(--t1);font-size:var(--fs-xs)}
/* Ring TRONG: ô nằm trong vỏ pill — ring ngoài đè viền vỏ. Cùng khuôn .gal-search input. */
.ins-search input:focus-visible{outline:var(--stroke-focus) solid var(--focus-ring);outline-offset:calc(-1 * var(--stroke-focus))}
.ins-search input::placeholder{color:var(--t4)}

/* ── hàng điều khiển: dự án + nhập ── */
.ins-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}
.ins-bar .lbl{font-size:var(--fs-2xs);font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--t5)}
.ins-select{height:30px;padding:0 10px;border-radius:var(--r-2);border:1px solid var(--border);background:var(--field);
     color:var(--t1);font-size:var(--fs-xs);max-width:280px}
.ins-btn{height:30px;padding:0 12px;border-radius:var(--r-full);border:1px solid var(--border);background:var(--field);
     color:var(--t2);font-size:var(--fs-xs);display:inline-flex;align-items:center;gap:6px;cursor:pointer;
     transition:background .12s var(--ease-apple),color .12s var(--ease-apple)}
.ins-btn:hover{background:var(--hover);color:var(--t1)}
.ins-btn.primary{background:var(--accent);color:var(--on-accent,#fff);border-color:transparent;font-weight:var(--fw-semi)}
.ins-btn.primary:hover{background:var(--accent-strong,var(--accent))}
.ins-btn[aria-disabled="true"],.ins-btn:disabled{opacity:var(--mo-vo-hieu,.5);cursor:not-allowed}
.ins-btn:focus-visible,.ins-chip:focus-visible,.ins-card:focus-visible,.ins-view:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

/* ── chip facet ── */
.ins-chips{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
.ins-chiprow{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.ins-chiprow .lbl{font-size:var(--fs-2xs);font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--t5);margin-right:4px;min-width:74px}
.ins-chip{height:26px;padding:0 10px;border-radius:var(--r-full);border:1px solid var(--border);background:var(--field);
     color:var(--t3);font-size:var(--fs-xs);display:inline-flex;align-items:center;gap:5px;cursor:pointer;
     transition:background .12s var(--ease-apple),color .12s var(--ease-apple)}
.ins-chip:hover{background:var(--hover);color:var(--t1)}
.ins-chip.on{background:var(--accent-soft);color:var(--accent);border-color:transparent;font-weight:var(--fw-semi)}
.ins-chip .n{font-size:var(--fs-2xs);color:var(--t4)}
.ins-chip.on .n{color:var(--accent)}

/* ── bố cục 2 cột: lưới trái · chi tiết phải ── */
.ins-body{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:18px;align-items:start}
@media (max-width:980px){.ins-body{grid-template-columns:1fr}}

.ins-group{margin-bottom:20px}
.ins-group .sec-head{display:flex;align-items:center;gap:8px;margin-bottom:9px}
.ins-group .sec-head h2{margin:0;font-size:var(--fs-sm);font-weight:var(--fw-semi)}
.ins-group .sec-head span{font-size:var(--fs-2xs);color:var(--t4)}
.ins-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:12px}
.ins-card{position:relative;display:flex;flex-direction:column;border:1px solid var(--border);border-radius:var(--r-3);
     overflow:hidden;background:var(--card,var(--panel));padding:0;text-align:left;cursor:pointer;color:var(--t1);
     transition:transform .18s var(--ease-apple),box-shadow .18s var(--ease-apple)}
.ins-card:hover{transform:translateY(-2px);box-shadow:var(--shadow-pop)}
.ins-card.on{box-shadow:0 0 0 2px var(--accent)}
.ins-card .cover{aspect-ratio:4/3;background:var(--field) center/cover no-repeat;display:block}
.ins-card .meta{padding:8px 10px 10px;display:flex;flex-direction:column;gap:3px}
.ins-card .meta b{font-size:var(--fs-xs);font-weight:var(--fw-semi);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ins-card .meta span{font-size:var(--fs-2xs);color:var(--t4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ins-card .strip{height:2px;width:100%;background:var(--border-strong);transition:background .12s var(--ease-apple)}
.ins-card .strip.ok{background:var(--success)}
.ins-card .strip.warn{background:var(--warning)}
.ins-card .strip.bad{background:var(--danger)}
.ins-card:hover .strip{filter:saturate(1.3) brightness(1.1)}
.ins-card .facets{display:flex;flex-wrap:wrap;gap:3px;margin-top:2px}
.ins-card .facets i{font-style:normal;font-size:10px;padding:1px 6px;border-radius:var(--r-full);background:var(--field);color:var(--t3)}

.ins-empty{border:1px dashed var(--border);border-radius:var(--r-3);padding:22px;text-align:center;color:var(--t3);
     font-size:var(--fs-xs);display:flex;flex-direction:column;gap:10px;align-items:center}
.ins-loading{font-size:var(--fs-xs);color:var(--t4)}

/* ── nhập ảnh ── */
.ins-import{border:1px solid var(--border);border-radius:var(--r-3);background:var(--panel);padding:12px 14px;margin-bottom:14px}
.ins-import h3{margin:0 0 6px;font-size:var(--fs-sm);font-weight:var(--fw-semi)}
.ins-import p{margin:0 0 8px;font-size:var(--fs-2xs);color:var(--t4)}
.ins-import .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:8px}
.ins-import .err{color:var(--danger);font-size:var(--fs-2xs);margin-top:6px}

/* ── panel chi tiết ── */
.ins-detail{position:sticky;top:12px;border:1px solid var(--border);border-radius:var(--r-3);background:var(--panel);overflow:hidden}
.ins-detail .hd{padding:12px 14px 10px;border-bottom:1px solid var(--vien-mo,var(--border))}
.ins-detail .hd b{display:block;font-size:var(--fs-sm);font-weight:var(--fw-semi)}
.ins-detail .hd span{font-size:var(--fs-2xs);color:var(--t4)}
.ins-detail .hd a{color:var(--accent);text-decoration:none}
.ins-detail .bd{padding:12px 14px;display:flex;flex-direction:column;gap:12px;max-height:calc(100vh - 120px);overflow-y:auto}
.ins-sec h4{margin:0 0 6px;font-size:var(--fs-2xs);font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--t5)}
.ins-preview{position:relative;border-radius:var(--r-2);overflow:hidden;background:var(--field);border:1px solid var(--border)}
.ins-preview canvas{display:block;width:100%;height:auto}
.ins-views{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
.ins-view{height:24px;padding:0 9px;border-radius:var(--r-full);border:1px solid var(--border);background:var(--field);
     color:var(--t3);font-size:var(--fs-2xs);display:inline-flex;align-items:center;gap:4px;cursor:pointer}
.ins-view.on{background:var(--accent-soft);color:var(--accent);border-color:transparent;font-weight:var(--fw-semi)}
.ins-view[aria-disabled="true"]{opacity:var(--mo-vo-hieu,.5);cursor:not-allowed}
.ins-reason{font-size:var(--fs-2xs);color:var(--t4);margin-top:6px;min-height:1em}

.ins-kv{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;font-size:var(--fs-xs)}
.ins-kv dt{color:var(--t4);white-space:nowrap}
.ins-kv dd{margin:0;color:var(--t1);display:flex;flex-wrap:wrap;gap:4px;align-items:center}
.ins-badge{font-size:10px;padding:1px 6px;border-radius:var(--r-full);border:1px solid var(--border);color:var(--t3);white-space:nowrap}
.ins-badge.measured{color:var(--success);border-color:var(--success)}
.ins-badge.inferred{color:var(--warning);border-color:var(--warning)}
.ins-badge.verified{color:var(--accent);border-color:var(--accent)}
.ins-swatches{display:flex;gap:4px;flex-wrap:wrap}
.ins-swatch{width:26px;height:26px;border-radius:var(--r-1);border:1px solid var(--border)}
.ins-tag{font-size:var(--fs-2xs);padding:2px 7px;border-radius:var(--r-full);background:var(--field);color:var(--t2)}
.ins-note{font-size:var(--fs-2xs);color:var(--t4);margin:4px 0 0}

/* ── cổng + áp ── */
.ins-gate{display:flex;flex-direction:column;gap:5px}
.ins-issue{display:flex;gap:6px;align-items:flex-start;font-size:var(--fs-2xs);padding:6px 8px;border-radius:var(--r-2);
     border:1px solid var(--border);background:var(--field);color:var(--t2)}
.ins-issue.block{border-color:var(--danger);color:var(--danger)}
.ins-issue.warn{border-color:var(--warning);color:var(--t1)}
.ins-issue.info{color:var(--t3)}
.ins-check{display:flex;gap:8px;align-items:flex-start;font-size:var(--fs-xs);color:var(--t1);cursor:pointer}
.ins-check input{margin-top:3px}
.ins-aspects{display:flex;flex-wrap:wrap;gap:5px}
.ins-diff{display:flex;flex-direction:column;gap:4px;font-size:var(--fs-2xs)}
.ins-diff .row{display:flex;gap:6px;align-items:baseline}
.ins-diff .row b{color:var(--t2);font-weight:var(--fw-semi);min-width:110px}
.ins-diff .row span{color:var(--t3)}
.ins-diff .row.skip span{color:var(--t4);font-style:italic}
.ins-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.ins-undo{display:flex;flex-direction:column;gap:4px}
.ins-undo .row{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:var(--fs-2xs);color:var(--t3)}
`;
