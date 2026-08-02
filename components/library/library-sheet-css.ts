// components/library/library-sheet-css.ts — CSS Thư viện sheet, PORT NGUYÊN VĂN từ
// `docs/mocks/mock-if-3chang.html` khối "══════ THƯ VIỆN — sheet trượt lên, kính ══════".
//
// L2 (`docs/LUAT-GIAO-DIEN-BAT-BUOC.md`): chép markup+CSS, KHÔNG vẽ lại bằng mắt. Mọi con số
// (186px kệ · 122px ô lưới · 76px thumbnail · 24px chip · 15px badge · 38px chân sheet ·
// min(980px,94vw) × min(560px,74vh)) giữ NGUYÊN.
//
// Hai khác biệt so với mock, đều CÓ LÝ DO, không phải tự chế:
//  1. Mock bật/tắt bằng `body.lib`; ở React không nên ghi class lên <body> từ component (dễ rò
//     khi unmount) ⇒ dùng `[data-open="true"]` trên chính 2 phần tử. Giá trị CSS y hệt.
//  2. Mock khai `--fs-2xs:11px` trong `:root` của riêng nó; `app/globals.css` (NGOÀI vùng code
//     G4, không được sửa) chưa có biến này ⇒ khai trong phạm vi sheet, không đụng file chung.
//     Các biến còn lại (--mat-card/--blur-strong/--shadow-sheet/--mat-overlay/--mat-hairline/
//     --border-strong/--accent-warm/--field/--hover/--radius-*/--fw-semi/--ease-apple/--dur-base)
//     ĐÃ CÓ THẬT trong globals.css — đã kiểm từng biến, dùng thẳng.
//  Ngoài ra `.mat-sheet` chưa có trong globals.css nên khai ở đây đúng công thức mock
//  (= công thức `.mat-card` sẵn có: nền --mat-card + blur-strong).
export const LIBRARY_SHEET_CSS = `
.if-lib-root{--fs-2xs:11px}
.if-lib-root .mat-sheet{background:var(--mat-card);backdrop-filter:saturate(180%) blur(var(--blur-strong));-webkit-backdrop-filter:saturate(180%) blur(var(--blur-strong))}
.if-lib-root *{box-sizing:border-box}

.if-lib-root .scrim{position:fixed;inset:0;background:var(--mat-overlay);opacity:0;pointer-events:none;z-index:20;
       transition:opacity var(--dur-base) var(--ease-apple);border:0;padding:0}
.if-lib-root .scrim[data-open="true"]{opacity:1;pointer-events:auto}
.if-lib-root .lib{position:fixed;left:50%;bottom:0;transform:translate(-50%,100%);width:min(980px,94vw);height:min(560px,74vh);
     border-radius:var(--radius-xl) var(--radius-xl) 0 0;border:1px solid var(--mat-hairline);border-bottom:0;
     box-shadow:var(--shadow-sheet);z-index:21;display:flex;flex-direction:column;overflow:hidden;
     transition:transform var(--dur-base) var(--ease-apple)}
.if-lib-root .lib[data-open="true"]{transform:translate(-50%,0)}
.if-lib-root .grab{height:16px;flex:none;display:flex;align-items:center;justify-content:center}
.if-lib-root .grab i{width:34px;height:4px;border-radius:2px;background:var(--border-strong)}
.if-lib-root .libh{flex:none;display:flex;align-items:center;gap:10px;padding:2px 14px 10px}
.if-lib-root .libh h3{margin:0;font-size:var(--fs-md);font-weight:var(--fw-semi);letter-spacing:-.015em;color:var(--t1)}
.if-lib-root .libh .cx{margin-left:auto;width:28px;height:28px;color:var(--t3);border-radius:8px;display:flex;
          align-items:center;justify-content:center;transition:background .12s,color .12s;border:0;background:none;cursor:pointer}
.if-lib-root .libh .cx:hover{background:var(--hover);color:var(--t1)}
.if-lib-root .srch{flex:1;max-width:260px;height:28px;background:var(--field);border:1px solid var(--border);
      border-radius:var(--radius-sm);display:flex;align-items:center;gap:7px;padding:0 9px;color:var(--t4);font-size:var(--fs-xs)}
.if-lib-root .srch input{flex:1;min-width:0;border:0;background:none;outline:none;color:var(--t1);font:inherit}
.if-lib-root .srch input::placeholder{color:var(--t4)}
.if-lib-root .libbody{flex:1;display:flex;min-height:0}
.if-lib-root .shelf{width:186px;flex:none;border-right:1px solid var(--mat-hairline);padding:4px 6px;overflow-y:auto}
.if-lib-root .shrow{width:100%;height:30px;display:flex;align-items:center;gap:9px;padding:0 9px;border-radius:var(--radius-sm);
       color:var(--t2);font-size:var(--fs-xs);text-align:left;transition:background .12s var(--ease-apple);border:0;background:none;cursor:pointer}
.if-lib-root .shrow:hover{background:var(--hover)}
.if-lib-root .shrow.on{background:var(--accent-soft);color:var(--accent);font-weight:var(--fw-semi)}
.if-lib-root .shrow .c{margin-left:auto;font-size:var(--fs-2xs);color:var(--t4);font-variant-numeric:tabular-nums}
.if-lib-root .shcap{padding:9px 9px 5px;font-size:var(--fs-2xs);font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--t5)}
.if-lib-root .libmain{flex:1;min-width:0;display:flex;flex-direction:column}
.if-lib-root .chips{flex:none;display:flex;gap:5px;padding:9px 14px;border-bottom:1px solid var(--mat-hairline);overflow-x:auto;scrollbar-width:none}
.if-lib-root .chip{height:24px;padding:0 11px;border-radius:20px;background:var(--field);color:var(--t3);
      font-size:var(--fs-2xs);white-space:nowrap;display:flex;align-items:center;gap:5px;border:0;cursor:pointer;
      transition:background .12s var(--ease-apple),color .12s var(--ease-apple)}
.if-lib-root .chip:hover{background:var(--hover);color:var(--t1)}
.if-lib-root .chip.on{background:var(--accent);color:#fff;font-weight:var(--fw-semi)}
.if-lib-root .grid{flex:1;overflow-y:auto;padding:12px 14px 16px;display:grid;
      grid-template-columns:repeat(auto-fill,minmax(122px,1fr));gap:11px;align-content:start}
.if-lib-root .it{border-radius:var(--radius-md);overflow:hidden;background:var(--field);border:1px solid var(--border);
    text-align:left;padding:0;cursor:grab;transition:transform .2s var(--ease-apple),box-shadow .2s var(--ease-apple),border-color .15s}
.if-lib-root .it:hover{transform:translateY(-2px) scale(1.02);box-shadow:var(--shadow-pop);border-color:var(--border-strong)}
.if-lib-root .it:active{transform:scale(.99);transition-duration:.09s}
.if-lib-root .it:focus-visible{outline:none;border-color:var(--accent);box-shadow:0 0 0 2px var(--accent)}
.if-lib-root .it .th{height:76px;position:relative;display:flex;align-items:center;justify-content:center;color:var(--t5)}
.if-lib-root .it .mt{padding:7px 9px 9px}
.if-lib-root .it .mt .a{font-size:var(--fs-2xs);font-weight:var(--fw-semi);color:var(--t2);overflow:hidden;
           text-overflow:ellipsis;white-space:nowrap}
.if-lib-root .it .mt .b{font-size:var(--fs-2xs);color:var(--t5);margin-top:2px;font-family:ui-monospace,Menlo,monospace}
.if-lib-root .badge{position:absolute;top:6px;right:6px;height:15px;padding:0 5px;border-radius:5px;background:var(--mat-card);
       backdrop-filter:blur(10px);color:var(--t3);font-size:9px;font-weight:700;display:flex;align-items:center;
       letter-spacing:.03em}
.if-lib-root .badge.st{color:var(--accent-warm)}
.if-lib-root .libft{flex:none;height:38px;display:flex;align-items:center;gap:10px;padding:0 14px;
       border-top:1px solid var(--mat-hairline);font-size:var(--fs-2xs);color:var(--t4)}
.if-lib-root .pub{margin-left:auto;height:26px;padding:0 12px;border-radius:var(--radius-sm);background:var(--accent);color:#fff;
     font-size:var(--fs-2xs);font-weight:var(--fw-semi);display:flex;align-items:center;gap:6px;border:0;cursor:pointer;
     transition:background .12s var(--ease-apple)}
.if-lib-root .pub:hover{background:var(--accent-strong)}
.if-lib-root .pub:focus-visible,.if-lib-root .chip:focus-visible,.if-lib-root .shrow:focus-visible,
.if-lib-root .libh .cx:focus-visible{outline:none;box-shadow:0 0 0 2px var(--accent)}
.if-lib-root .empty{grid-column:1/-1;padding:26px 0;text-align:center;color:var(--t4);font-size:var(--fs-xs)}

@media (prefers-reduced-motion:reduce){
  .if-lib-root *{animation:none!important;transition-duration:.1s!important}
  .if-lib-root .it:hover{transform:none!important}
}
`;
