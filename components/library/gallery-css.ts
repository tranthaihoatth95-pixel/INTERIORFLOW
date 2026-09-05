// components/library/gallery-css.ts — CSS cho Gallery liên ngành (`GalleryLienNganh`, marker
// `gallery-curated`). Dựng MỚI (không mock có sẵn cho màn này — đã kiểm `ls docs/mocks` + grep
// "gallery" 12/08, không thấy file khớp) nên đi bằng TOKEN CHUNG của app (globals.css), KHÔNG hex
// tự chế (L4), thang bo `--r-1..--r-4` + `--r-full` theo chốt 12/08 "hình học toàn app", 2 theme
// tự động qua biến (không viết riêng cho theme nào).
export const GALLERY_CSS = `
.if-gallery-root{--fs-2xs:11px;line-height:1.5;box-sizing:border-box;background:var(--bg);
     min-height:100%;padding:20px 22px 40px;max-width:1440px;margin:0 auto}
.if-gallery-root *{box-sizing:border-box}

.gal-head{display:flex;flex-wrap:wrap;align-items:flex-end;gap:14px;margin-bottom:16px}
.gal-head h1{margin:0;font-size:20px;font-weight:var(--fw-semi);letter-spacing:-.015em;color:var(--t1)}
.gal-head p{margin:4px 0 0;font-size:var(--fs-xs);color:var(--t3);max-width:56ch}
.gal-head-copy{flex:1;min-width:220px}
.gal-search{flex:none;width:min(280px,100%);height:var(--tap,32px);background:var(--field);
     border:1px solid var(--border);border-radius:var(--r-2);display:flex;align-items:center;
     gap:7px;padding:0 10px;color:var(--t4)}
.gal-search input{flex:1;min-width:0;border:0;background:none;outline:none;color:var(--t1);font-size:var(--fs-xs)}
/* Ô tìm nằm SÁT trong vỏ pill (input cao bằng vỏ) — ring ngoài sẽ đè viền vỏ, nên dùng ring TRONG
   đúng khuôn .if-focus-inset của globals.css. "outline:none" ở trên có đặc hiệu 0-1-1, THẮNG luật
   :where(...):focus-visible toàn app (0-1-0) ⇒ không trả ring ở đây là mất dấu bàn phím. */
.gal-search input:focus-visible{outline:var(--stroke-focus) solid var(--focus-ring);
     outline-offset:calc(-1 * var(--stroke-focus))}
.gal-search input::placeholder{color:var(--t4)}

/* ── Chip hàng lọc: nhóm ngành + giấy phép, cùng công thức chip đã có ở Thư viện sheet ── */
/* THANH MỎNG thay cho khối đầu trang cũ (<h1> + đoạn văn + ô tìm to). Một hàng, dính trên
   khi cuộn, để lưới ảnh chiếm màn ngay từ pixel đầu. */
/* 🔴 SỬA 30/08 — THANH NÀY TỪNG LÀ FLAT, VÀ ĐÓ LÀ LỖI CÓ TÊN.
   Bản sáng 30/08 (cũng do phiên này viết) dựng một dải phẳng, góc vuông, trải hết bề ngang, làm
   mờ nền bằng "linear-gradient" — tức KHÔNG có kính, KHÔNG có chiều dày, KHÔNG bo.
   "docs/GU-PROFILE.md" §2 — chưng cất 11/07 từ 4 board Pinterest của Hoà — chốt thẳng:
     "liquid-glass / soft neumorphism · pill bo tròn full · frosted blur · đơn sắc + 1 accent ·
      floating toolbar · KHÔNG rẽ flat/material"
   Đo được trên app trước khi sửa: "backdrop-filter: none" · "border-radius: 0px".
   Nguyên nhân gốc KHÔNG phải bất cẩn: "GU-PROFILE.md" lúc đó có **0 con trỏ** từ bộ nạp, nên
   phiên viết CSS chưa từng đọc nó. Cổng "scripts/soi-con-tro.mjs" sinh ra để chặn đúng chỗ đó.
   Nay: viên thuốc NỔI, không trải hết bề ngang, kính thật "blur(40px)" + "saturate(170%)",
   sáng viền trong 1px và bóng mềm hai chiều — đúng "soft neumorphism", không phải viền tóc. */
.gal-bar{position:sticky;top:8px;z-index:2;display:inline-flex;align-items:center;gap:10px;
     margin-bottom:14px;padding:0 8px 0 14px;height:var(--tap,38px);border-radius:var(--r-full);
     background:linear-gradient(155deg,color-mix(in srgb,var(--panel) 78%,transparent),
       color-mix(in srgb,var(--panel) 52%,transparent));
     -webkit-backdrop-filter:blur(var(--blur-strong,40px)) saturate(170%);
     backdrop-filter:blur(var(--blur-strong,40px)) saturate(170%);
     border:1px solid color-mix(in srgb,var(--border) 70%,transparent);
     box-shadow:0 1px 0 color-mix(in srgb,var(--t1) 8%,transparent) inset,
       0 20px 44px -26px rgba(0,0,0,.88)}
/* Trình duyệt không có backdrop-filter thì rơi về nền đục — thà đục còn hơn chữ chồng lên ảnh. */
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
  .gal-bar{background:var(--panel)}}
.gal-loc-nut{position:relative;flex:none;height:28px;padding:0 14px;border-radius:var(--r-full);
     border:0;background:color-mix(in srgb,var(--field) 70%,transparent);color:var(--t2);font-size:var(--fs-xs);
     cursor:pointer;transition:background .14s ease,color .14s ease}
.gal-loc-nut:hover{background:var(--hover);color:var(--t1)}
.gal-loc-nut.on{background:var(--accent-soft);border-color:var(--accent);color:var(--accent)}
.gal-loc-cham{position:absolute;top:5px;right:6px;width:6px;height:6px;border-radius:var(--r-full);
     background:var(--accent)}
/* Dòng "còn N ảnh chưa tuyển" — nói thật về thứ KHÔNG hiện, để không ai tưởng ảnh biến mất. */
.gal-con-lai{margin:18px 0 0;font-size:var(--fs-xs);color:var(--t4);line-height:1.5}
.gal-filters{display:flex;flex-direction:column;gap:8px;margin-bottom:18px}
.gal-chiprow{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.gal-chiprow .lbl{font-size:var(--fs-2xs);font-weight:700;letter-spacing:.06em;text-transform:uppercase;
     color:var(--t5);margin-right:4px}
.gal-chip{height:26px;padding:0 11px;border-radius:var(--r-full);border:1px solid var(--border);
     background:var(--field);color:var(--t3);font-size:var(--fs-xs);display:inline-flex;align-items:center;
     gap:5px;cursor:pointer;transition:background .12s var(--ease-apple),color .12s var(--ease-apple),
     border-color .12s var(--ease-apple)}
.gal-chip:hover{background:var(--hover);color:var(--t1)}
.gal-chip.on{background:var(--accent-soft);color:var(--accent);border-color:transparent;font-weight:var(--fw-semi)}
.gal-chip .dot{width:8px;height:8px;border-radius:50%;flex:none}

/* ── Bộ sưu tập xu hướng — dải cuộn ngang ── */
.gal-collections{margin-bottom:22px}
.gal-collections .sec-head{display:flex;align-items:center;gap:8px;margin-bottom:9px}
.gal-collections .sec-head h2{margin:0;font-size:var(--fs-sm);font-weight:var(--fw-semi);color:var(--t1)}
.gal-collections .sec-head span{font-size:var(--fs-2xs);color:var(--t4)}
.gal-colrow{display:flex;gap:10px;overflow-x:auto;padding-bottom:4px;scrollbar-width:thin}
.gal-colcard{flex:none;width:180px;border-radius:var(--r-3);overflow:hidden;border:1px solid var(--border);
     background:var(--card);cursor:pointer;text-align:left;transition:border-color .12s var(--ease-apple),
     transform .12s var(--ease-apple)}
.gal-colcard:hover{border-color:var(--border-strong)}
.gal-colcard.on{border-color:var(--accent)}
.gal-colcard .cover{height:96px;background-size:cover;background-position:center;background-color:var(--field)}
.gal-colcard .meta{padding:8px 10px}
.gal-colcard .meta b{display:block;font-size:var(--fs-xs);color:var(--t1);font-weight:var(--fw-semi);
     white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gal-colcard .meta span{font-size:var(--fs-2xs);color:var(--t4)}

/* ── Nhóm theo ngành ── */
.gal-group{margin-bottom:24px}
.gal-group .sec-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.gal-group .sec-head .ic{width:22px;height:22px;border-radius:var(--r-1);display:flex;align-items:center;
     justify-content:center;background:var(--accent-soft);color:var(--accent);flex:none}
.gal-group .sec-head h2{margin:0;font-size:var(--fs-sm);font-weight:var(--fw-semi);color:var(--t1)}
.gal-group .sec-head span{font-size:var(--fs-2xs);color:var(--t4);font-variant-numeric:tabular-nums}

.gal-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(196px,1fr));gap:12px}

/* SỬA 30/08 — viền tóc → bóng mềm hai chiều (GU §2 "đổ bóng mềm 2 chiều (neumorphic)").
   Một đường 1px là ngôn ngữ material; thẻ ảnh cần NỔI khỏi nền, không cần bị kẻ ô. Giữ một
   vệt sáng trong rất nhạt làm mép trên — đó là cái cho cảm giác dày. */
.gal-card{position:relative;border-radius:var(--r-3);overflow:hidden;border:0;
     box-shadow:0 0 0 1px color-mix(in srgb,var(--border) 46%,transparent),
       0 1px 0 color-mix(in srgb,var(--t1) 6%,transparent) inset,
       0 14px 30px -20px rgba(0,0,0,.85);
     transition:box-shadow .18s ease,transform .18s ease;
     background:var(--card);text-align:left;cursor:default;display:flex;flex-direction:column}
/* THẺ = TẤM ẢNH (Hoà chốt 30/08 "ảnh trước, bộ máy sau").
   Trước: ảnh 140px + một thân thẻ cố định mang tên · nguồn · nút hành động — bộ máy ăn ~40%
   chiều cao MỖI thẻ, nhân với cả lưới thì mặt cảm hứng thành bảng kê. Nay ảnh chiếm trọn thẻ,
   thân thẻ trượt lên khi rê chuột / khi tab tới. Không mất thông tin nào, chỉ đổi lúc nó xuất hiện. */
.gal-card .shot{position:relative;height:210px;background-size:cover;background-position:center;
     background-color:var(--field)}
/* BADGE GIẤY PHÉP — chỉ hiện khi rê chuột (Hoà chốt 30/08 "ảnh trước, bộ máy sau").
   Bản cũ dán chữ HOA lên góc MỌI tấm ảnh: siêu dữ liệu đè lên chính thứ người ta tới để nhìn.
   Nó vẫn ở đó, vẫn đọc được, chỉ thôi tranh chỗ với ảnh. Bàn phím tab tới cũng hiện (:focus-within).
   Cỡ chữ 9.5px → 12px: sàn chữ Việt V-6 (Hoà chốt 30/08 "nâng sàn 12px, giữ tỉ lệ"). */
.gal-badge{position:absolute;top:7px;right:7px;height:20px;padding:0 8px;border-radius:var(--r-full);
     opacity:0;transition:opacity .16s ease;
     font-size:12px;font-weight:var(--fw-semi);letter-spacing:.03em;text-transform:uppercase;
     display:inline-flex;align-items:center;background:color-mix(in srgb, var(--bg) 62%, transparent);
     color:#fff;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.gal-card:hover .gal-badge,.gal-card:focus-within .gal-badge{opacity:1}
@media (prefers-reduced-motion:reduce){.gal-badge{transition:none}}
.gal-badge.unknown{background:color-mix(in srgb, var(--warning) 78%, transparent)}
.gal-card{position:relative}
.gal-card .body{position:absolute;left:0;right:0;bottom:0;padding:10px;display:flex;
     flex-direction:column;gap:6px;
     background:linear-gradient(transparent,color-mix(in srgb, var(--bg) 88%, transparent) 34%);
     opacity:0;transform:translateY(6px);transition:opacity .16s ease,transform .16s ease}
.gal-card:hover .body,.gal-card:focus-within .body{opacity:1;transform:none}
.gal-card:hover,.gal-card:focus-within{transform:translateY(-2px);
     box-shadow:0 0 0 1px color-mix(in srgb,var(--border) 70%,transparent),
       0 1px 0 color-mix(in srgb,var(--t1) 10%,transparent) inset,
       0 22px 44px -22px rgba(0,0,0,.92)}
@media (prefers-reduced-motion:reduce){.gal-card{transition:none}
  .gal-card:hover,.gal-card:focus-within{transform:none}}
@media (prefers-reduced-motion:reduce){.gal-card .body{transition:none}}
/* Màn cảm ứng không có trạng thái rê chuột ⇒ ở đó thân thẻ hiện thường trực, nếu không thì
   thông tin nguồn/giấy phép thành thứ không đường nào tới được. */
@media (hover:none){.gal-card .body{position:static;opacity:1;transform:none;background:none}
  .gal-card .gal-badge{opacity:1}}
.gal-card .name{font-size:var(--fs-xs);color:var(--t1);font-weight:var(--fw-semi);
     white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gal-card .src{font-size:12px;color:var(--t4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gal-card .src.missing{color:var(--warning)}
.gal-card .use{height:28px;border-radius:var(--r-2);border:1px solid var(--border);
     background:var(--field);color:var(--t2);font-size:12px;font-weight:var(--fw-semi);
     display:flex;align-items:center;justify-content:center;gap:5px;cursor:pointer;
     transition:background .12s var(--ease-apple),color .12s var(--ease-apple)}
.gal-card .use:hover{background:var(--accent-soft);color:var(--accent)}

/* ── Trống — luôn kèm nút làm được việc (luật X2) ── */
.gal-empty{display:grid;justify-items:start;gap:10px;padding:28px 4px;color:var(--t3);font-size:var(--fs-xs)}
.gal-empty .go{height:30px;padding:0 13px;border-radius:var(--r-2);border:0;background:var(--accent);
     color:var(--on-accent,#fff);font-size:var(--fs-xs);font-weight:var(--fw-semi);display:inline-flex;
     align-items:center;gap:6px;cursor:pointer}
.gal-empty .go:hover{filter:brightness(1.06)}

/* ── Đề xuất nguồn mới ── */
.gal-source{margin-top:28px;padding:14px 16px;border-radius:var(--r-3);border:1px solid var(--border);
     background:var(--panel)}
.gal-source h3{margin:0 0 4px;font-size:var(--fs-sm);font-weight:var(--fw-semi);color:var(--t1)}
.gal-source p{margin:0 0 10px;font-size:var(--fs-2xs);color:var(--t4);max-width:64ch}
.gal-source-row{display:flex;gap:8px;flex-wrap:wrap}
.gal-source-row input{flex:1;min-width:220px;height:30px;background:var(--field);border:1px solid var(--border);
     border-radius:var(--r-2);padding:0 10px;color:var(--t1);font-size:var(--fs-xs);outline:none}
.gal-source-row input:focus{border-color:var(--accent)}
/* Đổi màu viền là affordance, KHÔNG thay được vòng focus (SPEC-HOVER-FOCUS-IDF §3.6) — và nó bắn
   cả khi bấm chuột. Trả lại ring accent chỉ cho bàn phím. */
.gal-source-row input:focus-visible{outline:var(--stroke-focus) solid var(--focus-ring);outline-offset:2px}
.gal-source-row button{height:30px;padding:0 13px;border-radius:var(--r-2);border:0;background:var(--accent);
     color:var(--on-accent,#fff);font-size:var(--fs-xs);font-weight:var(--fw-semi);cursor:pointer;
     display:inline-flex;align-items:center;gap:5px}
.gal-source-err{margin-top:7px;font-size:var(--fs-2xs);color:var(--warning);display:flex;align-items:flex-start;gap:6px}
.gal-source-list{margin-top:10px;display:flex;flex-direction:column;gap:6px}
.gal-source-item{display:flex;align-items:center;gap:8px;font-size:var(--fs-2xs);color:var(--t3);
     background:var(--field);border-radius:var(--r-2);padding:6px 9px}
.gal-source-item a{color:var(--accent);text-decoration:none;overflow:hidden;text-overflow:ellipsis;
     white-space:nowrap;flex:1;min-width:0}
.gal-source-item button{flex:none;width:20px;height:20px;border:0;background:none;color:var(--t4);
     cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:var(--r-1)}
.gal-source-item button:hover{background:var(--hover);color:var(--t1)}

.gal-loading{padding:30px 4px;color:var(--t4);font-size:var(--fs-xs)}
`;
