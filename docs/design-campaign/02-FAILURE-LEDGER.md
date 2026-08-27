# DESIGN FAILURE LEDGER
Every entry must reach a CORRECTED LAW. A symptom without a root cause is not an entry.
**Same class twice = process failure — fix the system, not the instance.**

---
## F-01 · Daylight telemetry leaked into Home
**Symptom** Sun arc + `05:00`/`20:00` + `5600K` ticks rendered on Home.
**Root cause** A comment asserted *"belongs to atmosphere, not a widget"* directly above markup
that drew the instrument. **The claim and the code disagreed and only the claim was read.**
**Wrong assumption** That labelling something as environment makes it environment.
**Corrected law** Daylight acts through light direction, warm/cool balance, ambient brightness,
shadow softness, material response. The user *feels* the hour; never reads it. (Kelvin may
remain in Wallpaper/Lighting settings, where the user is deliberately tuning light behaviour.)
**Scope** SYSTEM · **Regression** `components/home/widgets/light-clock.test.ts`, 8/8
**Skill** §5 material, §11 data truth. Removed by deletion, not a flag — 6 mount sites existed
and only one passed `truong`, so a flag would have left it alive at five.

---
## F-02 · False calm — a healthy state asserted on a failed premise
**Symptom** With `site` and `projects` both 401, the Vitals aperture showed `calm`.
**Root cause** `calm` is not silence — it is the assertion *"checked, nothing needs attention."*
The read had failed, so the premise was gone.
**Wrong assumption** "Couldn't read ⇒ undefined ⇒ silent." Only the first half held.
**Corrected law** Three distinct states: `calm` (read, clean) · silent (no context) ·
**unknown/unavailable (read failed)** ← was missing. Never map 401 / failed prerequisite /
unavailable to calm. Gate at auth, or say unknown.
**Scope** SYSTEM · **Status** FAIL, open
**Note** MAIN and the QA lane *both praised this as correct*, using the exact phrase that
describes its own disease ("lying with a true number"). Hoà rejected it. **A "healthy" state is
still a claim — check that its premise holds.**

---
## F-03 · Measurement error dressed as a finding
**Symptom** Reported `lib/lighting` as dead with "zero references of any kind".
**Root cause** Hand-rolled scan matched `lib/<name>`; the real import is `'../../lighting/lux'`
— no `lib/` in the specifier. `lib/review/luat/rules-3d.ts:31` calls it at runtime.
**Wrong assumption** That an ad-hoc grep beats the purpose-built machine.
**Corrected law** Use the real import graph (`soi:cam-dien`), never text grep, for reachability.
This exact trap is documented in that tool's own docstring.
**Scope** SYSTEM · **Regression** `soi:cam-dien` resolves `@/`, `./`, `../`, index, dynamic
**Related** A structural scan also reported "0 sidebar/ambient" in the Home target because `\|`
inside `grep -E` is a literal pipe, not alternation. Nearly discarded a correct target.

---
## F-04 · Frontier completeness overcounted — existence scored as product
**Symptom** 5 entries marked `xong` for a 3,341-line engine with **zero runtime callers**.
**Root cause** Two compounding bugs in an existing guard: (a) `import type` counted as a caller,
so `lib/idfc-import`'s three type-only references made it look internally used; (b) the frontier
cross-check fired only on one bucket label, so anything mislabelled by (a) escaped. It printed
`⚡ 0` — **a guard reporting zero looks identical to a guard finding nothing wrong.**
**Corrected law** Ladder, never collapsed: ENGINE EXISTS → RUNTIME WIRED → USER REACHABLE →
REAL APP VERIFIED → VISUALLY APPROVED. Directory/symbol/test existence never implies product.
**Scope** SYSTEM · **Regression** `soi:cam-dien` exits 1 on frontier contract violation;
verified by injecting a regression and confirming it fires, then clears.

---
## F-05 · Evidence patterns too broad to prove anything
**Symptom** `import-ghe-tu-hinh` stayed green because its pattern also matched a task-name
constant in a live, unrelated module.
**Corrected law** Evidence must be scoped: exact runtime path · exact exported symbol · exact
registered capability id · route/component ownership. Repo-wide patterns never auto-green.
Mixed evidence = WARNING, never complete.
**Scope** SYSTEM · **Regression** `soi:cam-dien` prints a broad-evidence tier (20 entries), as a
warning not a failure — 20 unfixable reds would teach people to ignore the guard.

---
## F-06 · Guard satisfied by editing a comment
**Symptom** A sub-agent cleared `kinh-webkit-prefix` by adding the prefix text to explanatory
comments in files that never used `backdrop-filter`.
**Root cause** Grep-based guard; changing the prose satisfied it while changing nothing.
**Corrected law** A guard cleared without behaviour change is a **disarmed tripwire** — it would
now stay green if someone later added real unprefixed glass. Report false positives; never clear
them. Reverted; the rule is honestly red.
**Scope** SYSTEM

---
## F-07 · Test flake from a global assertion
**Symptom** `npm test` failed ~1 in 5, no failing item in the tail.
**Root cause** `route.guard.test.ts` compared a **global** `projectAssetUsage.count()` before and
after. Intent was "I cleaned up after myself"; the code asserted "nobody in the `-P8` pool
wrote to this table" — and `lib/server/promote.test.ts` legitimately does.
**Corrected law** Assert your own scope. Reproduced before fixing (round 2 of 3 failed);
verified after (4/4 green while the global count genuinely drifted 18→20).
**Scope** SYSTEM · **Regression** scoped assertion retained
**Note** Not SQLite locking — a previously-dismissed hypothesis was dismissed for the right
reason but the real one is cross-file row-count interference.

---
## F-08 · A frozen build used to judge new source
**Symptom** MAIN told both lanes to verify new code on `:3777` — a release snapshot built
*before* their edits. `if:voice-loi` was in the repo twice, in the bundle zero times.
**Corrected law** Distinguish CURRENT SOURCE / DEV SERVER / PRODUCTION BUILD / FROZEN REFERENCE.
New code against a frozen build is **PENDING-REBUILD**, never green.
**Scope** SYSTEM · MAIN's error, caught because the lane refused to claim an unverified pass.

---
## F-09 · Two dev servers on one tree
**Symptom** `:3000` served `/` → 404 for one observer and `/files` → 500 for another.
**Root cause** Two `next dev` processes writing the same `.next`.
**Corrected law** Exactly one server per tree. Also: `pgrep next dev` **cannot see them** —
processes are `node …/next dev` and `next-server`; use `pgrep -f`. A `pgrep` check wrongly
reported them dead. **Status** OPEN — needs human; both sessions are blocked from `kill`.

---
## F-10 · Silent failure — user's sentence swallowed
**Symptom** `void fetch(...)` to `/api/home/notes` returned 401 with the UI saying nothing; the
sentence the user had just spoken or typed disappeared while they believed it saved.
**Corrected law** Silent loss is worse than a visible error — the user walks away. Every failure
branch names the cause and returns the verbatim text. **Regression** all three branches (401,
other status, connection lost) interpolate the original.
**Scope** SYSTEM · now REAL-BROWSER PASS on current source.

---
## F-11 · A superseded target nearly implemented
**Symptom** MAIN briefed a lane to build `claude-home-first-use.html`, an abandoned direction.
**Root cause** The design index still listed it as a candidate; MAIN read the index, not the
supersession.
**Corrected law** There is ONE Home with multiple **data states**; zero-state is a state, not a
separate screen or concept. Resolve supersession through the index before briefing; never pick
by filename or mtime.
**Scope** SYSTEM · index corrected, lane stopped mid-flight.

---
## OPEN CLASSES CARRIED IN FROM PRIOR SESSIONS
Not yet root-caused here; listed so they are not lost:
refraction test stripes reaching production glass · fixed panels making IF less flexible than
professional tools · multiple chrome layers around the canvas · sidebar expansion pushing
content · legacy sidebar still reachable · mock existing while production composition stayed old
· MAIN editing CSS instead of implementing the design · mixed icon libraries · awkward literal
Vietnamese and unruled VI/EN mixing · placeholder identity promoted to product identity.

---
## F-12 · Repeated F-03 one wave later — reachability by grep
**Symptom** Reported `lib/distill` as having 0 runtime importers; nearly recorded the DNA core as
a dead island. It is reachable, with 3 lib callers and two independent adapters.
**Root cause** Ad-hoc regex matched `lib/distill`; the real specifier is `'../distill/engine'`.
**Wrong assumption** That knowing about the trap prevents falling into it.
**Corrected law** Not "be careful" — **reachability questions go through `soi:cam-dien`, never an
ad-hoc grep.** The tool resolves `@/`, `./`, `../`, index and dynamic forms; a regex cannot.
**Scope** PROCESS FAILURE — this is F-03's class, recurring after F-03 was written the same day.
That is the ledger's own trigger for fixing the system rather than the instance.

---
## F-13 · A guard rule that read prose and called it code
**Symptom** `F-MAT-VOCAB` reported PASS on its first run, contradicting known evidence that
G0–G3 appear zero times in production.
**Root cause** The pattern included a bare `\bG[0-3]\b` branch, which matched *"luật G1"* and
*"G2"* inside Vietnamese comments in `app/globals.css` — where "G1" is an unrelated performance
rule about not animating opacity.
**Wrong assumption** That a distinctive-looking token name is distinctive enough to grep for.
**Corrected law** Guard rules strip comments before matching, and accept only real token forms —
never a bare word. **Third occurrence of the match-text-instead-of-usage class (F-03, F-12, F-13).**
**Caught by** The scanner-trust law: a green against a known-bad baseline is suspect and must be
investigated, never banked. Had the law not been in place, the baseline would have shipped with a
false PASS in it.
**Regression** Probe test: 1164 → 1168 (delta 4/4) → 1164.

## F-14 · A proof mechanism that cannot reach what it claims to prove

**What happened.** The liquid-glass sheet placed a straight-line grid behind every material
specimen, on the stated rule that *a bent straight line is the only incontestable evidence of
refraction*. Sound rule. But the violet cell hosts `Vào xưởng`, and that button is
`background: var(--accent)` — fully opaque — with `isolation: isolate` deliberately cutting it
off from anything behind it. The grid sat behind an opaque surface. No line ever entered the
button's optics. The comment in the sheet went further and asserted that **without** the grid
*"law ④ fails immediately"* — an explicit claim of rigour, backwards.

**Why no guard caught it.** Every guard I have asks *does the artefact contain X*. The grid was
present, the law was written, the token was correct. Nothing was missing. The defect is that a
correct mechanism was pointed at a surface it physically cannot act on — a **wiring** fault
between proof and subject, and my guards check inventory, not wiring.

**Who caught it.** Hoà, by eye, in one sentence: the violet is the base, so the lines aren't
visible, so drop them. Ten words that invalidated a paragraph of stated rigour.

**Same family as F-03 / F-12 / F-13.** All four are *presence mistaken for effect*: an import
that is type-only, a match that is prose, a grid that is behind an opaque wall. The thing is
there; it does nothing.

**Rule.** A proof artefact must name the surface it acts on, and that surface must be able to
receive it. Grid behind opaque = decoration. Before shipping any specimen that claims to
demonstrate a property, check the property can physically occur in that specimen.

**🔴 AMENDED SAME DAY — my closing conclusion was wrong, Hoà overturned it.**
I wrote: *if it cannot refract an environment, calling it a lens is loose language — it is an
opaque violet with an interior light.* That conceded the wrong thing. Hoà: *"nếu màu tím là cả
cục kính lỏng thì chắc chắn ko ra. hình dung kính lỏng trong đè lên 1 lớp mỏng màu tím."*

The fault was never the ambition, it was the **build**. `background: var(--accent)` made the
violet *the body of the glass* — a solid coloured block. A solid coloured block has no optical
gradient, so it reads as plastic no matter what highlight you paint on it. The correct object is
**clear glass with thickness sitting on a THIN violet film**. Then the film is the subject, the
glass is the lens, and refraction has somewhere to happen.

**The lesson is sharper than F-14's original one.** I found a real defect (proof cannot reach
subject) and then drew the cheap conclusion — *lower the claim to match the artefact*. The
expensive and correct conclusion was *fix the artefact to match the claim*. Downgrading
ambition to fit a broken build is the most respectable-looking way to lose a product's
signature, because every step of the reasoning is sound.

**Rule added.** When evidence shows a thing does not do what it claims, the default is to ask
*is it built wrong* before *is the claim wrong*. Only rename after the construction has been
tried honestly.

**Bonus resolution.** Removing the external grid is no longer a loss of proof. Under the correct
construction, the straight edge that bends is **the violet film's own rim**, compressed by the
glass at the capsule ends. The proof moved *inside* the button — where it is independent of
whatever is behind it. Hoà's two instructions, which looked unrelated, were one instruction.

---

## F-15 · MÁY SOI RỖNG VẪN BÁO XANH — 26/08

**Ghi vào đây theo yêu cầu của Hoà (26/08): *"Harness cũng là thứ phải chứng minh; ghi failure
của harness rỗng vào failure ledger/Smartboard, không chỉ docstring."* Trước đó tôi mới ghi bài
học này trong docstring của `scripts/proof/auth-failclosed.mjs` — tức là chôn nó ở nơi chỉ người
đã đọc đúng file mới thấy. Bài học nằm ngoài sổ chung thì phiên sau không đi tới. Đúng luật M-24.**

**Chuyện gì.** Chứng minh fail-closed `AUTH_SECRET` cần nạp `middleware.ts` trong hai môi trường
giả lập. Tôi biên dịch bằng `npx sucrase --transforms typescript middleware.ts > mw-proof.mjs`.
Lệnh **thoát mã 0** và tạo ra một file **RỖNG**. Import file rỗng thì thành công, in ra `LOADED`.

**Vì sao suýt chết người.** Ca đang chạy lúc đó mong `THREW`, nên file rỗng làm ca **đỏ** — tôi
nhìn thấy và đi tìm. Nếu ca đó mong `LOADED` — và ca "production có secret → nạp được" **đúng là
mong `LOADED`** — thì tôi đã báo **PASS trên một module rỗng**. Không có gì được kiểm. Máy soi
xanh vì nó không soi gì cả.

**Gốc.** Tôi kiểm *mã thoát của công cụ*, không kiểm *sản phẩm của công cụ*. `sucrase` CLI trong
repo này không hỗ trợ đường vào như tôi tưởng và chọn cách im lặng thay vì báo lỗi.

**Cùng họ với F-03 / F-12 / F-13 / F-14** — *có mặt bị nhầm là có tác dụng*. Ở đây thứ "có mặt"
là chính máy soi.

**Luật thêm — CỔNG HARNESS.** Mọi script chứng minh phải mở đầu bằng **một ca chứng minh chính
nó**: một điều kiện chỉ có thể đúng khi bộ máy thật sự đang chạy đúng chủ thể. Cổng đỏ ⇒ dừng
ngay, **cấm in PASS cho bất kỳ ca nào phía sau**. Ca đó không được nằm ở cuối; nó phải chặn đầu.

**Đã áp dụng ngay.** `scripts/proof/secure-artifact-delivery.mjs` mở bằng `CA 0 · HARNESS`. Và nó
**đã bắt được lỗi thật ngay lần chạy đầu**: bộ đọc `.env` của harness không bóc cặp nháy bao quanh
`AUTH_SECRET` (Next thì có bóc), nên cookie ký bằng secret lệch. Không có CA 0, cả 6 ca sau đều
`401` và tôi đã có thể đọc "chặn tốt" trên một bộ chứng minh **không xác thực nổi chính mình**.
Cổng harness trả tiền ngay trong ngày nó được đặt.

---

## F-16 · TÔI TỰ CHẤM PASS CHO THỨ MỚI ĐẠT MỨC HỢP ĐỒNG — 26/08

**Chuyện gì.** Wave 0 `auth-failclosed`: tôi tuyên **PASS**. Hoà hiệu chỉnh: đó là
**`PARTIAL — process/contract proof`**, *"chưa được gọi full Electron/production runtime PASS"*.

**Hoà đúng, và lý do quan trọng hơn cái nhãn.** Cái tôi đã chứng minh: (a) một test đọc mã nguồn
xác nhận cổng chặn nằm TRƯỚC `secret()` ở cả hai tệp (11/11); (b) một proof nạp module trong ba
tổ hợp biến môi trường (3/3). Cả hai đều là **bằng chứng về hợp đồng của tiến trình** — mã có
đúng hình dạng đó không, module có ném không. Cái tôi **chưa** chứng minh: bản Electron **đã đóng
gói**, chạy `NODE_ENV=production` **thật**, thiếu `AUTH_SECRET`, **từ chối khởi động**, và người
dùng **nhìn thấy** một thông điệp hiểu được thay vì cửa sổ trắng.

**Gốc — chỗ này mới là bài học.** Tôi để **độ tinh vi của bằng chứng** thay cho **phạm vi của
bằng chứng**. Hai máy soi, một trong đó tự bắt được lỗi của chính mình, tạo cảm giác đã đi trọn.
Nhưng luật 8 nói *đi trọn tới chứng minh trên runtime* — và runtime của IF là **Electron đóng
gói**, không phải `node -e`. Bằng chứng đẹp trên sai bề mặt vẫn là sai bề mặt (đúng họ F-14).

**Luật thêm.** Nhãn verdict phải mang theo **bề mặt đã chạm**, không chỉ số ca đạt.
`PASS` một mình là chữ rỗng. Viết `PARTIAL — process/contract proof` hoặc
`PASS — runtime HTTP (dev server)` hoặc `PASS — Electron đóng gói`. Ai đọc cũng biết ngay còn
thiếu bậc nào. Bậc chưa chạm ghi `NOT ASSESSED` **kèm lý do**, không im lặng bỏ trống.

---

## F-17 · KHẲNG ĐỊNH XANH TRÊN `undefined` — 26/08

**Chuyện gì.** Proof cho W1-4 kiểm `/api/home/summary` bằng `h.projects`. Route đó **không có
trường `projects`** — nó trả `recentProjects`. Nên `h.projects` là `undefined`, `(undefined ??
[]).some(...)` là `false`, và hai ca *"KHÔNG thấy dự án của B"* **xanh** — trong khi chúng chưa
bao giờ nhìn vào dữ liệu nào.

**Vì sao lần này bắt được.** Ca thứ ba của cùng nhóm mong `true` ("A **thấy** dự án được mời").
`false !== true` nên nó đỏ, và kéo hai ca xanh giả kia ra ánh sáng.

**Cùng họ F-15, nhưng ở tầng khác.** F-15 là *bộ máy* rỗng. Đây là *khẳng định* rỗng — bộ máy
chạy đúng, dữ liệu về đủ, nhưng ta soi vào một trường không tồn tại. Cổng harness ở CA 0 **không
bắt được** loại này: nó chứng minh bộ máy sống, không chứng minh ta đang nhìn đúng chỗ.

**Luật thêm — KHẲNG ĐỊNH PHẢI CÓ CHỦ THỂ.** Trước khi khẳng định *nội dung* của một trường trong
phản hồi, phải có một ca khẳng định **trường đó tồn tại và đúng kiểu**. Và: **một nhóm ca chỉ toàn
kỳ vọng "không thấy" là nhóm ca không đáng tin** — luôn kèm ít nhất một ca **mong THẤY** trên cùng
đường dữ liệu. Ca dương tính là thứ chứng minh đường ống có nước; ca âm tính chỉ chứng minh vòi
đang khoá — mà một cái ống chưa nối cũng "khoá".

---

## F-18 · `.env` THẮNG BIẾN MÔI TRƯỜNG — tôi ghi vào DB thật trong lúc tưởng đang thử trên bản sao — 27/08

**Chuyện gì.** Tôi định chạy thử hai lệnh `prisma migrate resolve --applied` trên **bản sao** DB
trước khi xin Hoà cho chạy trên bản thật. Cách cách ly tôi chọn:

```
export DATABASE_URL="file:/tmp/…/thu.db"
npx prisma migrate resolve --applied <tên>
```

**Prisma CLI nạp `.env` và `.env` thắng biến tôi vừa `export`.** Hai lệnh đi thẳng vào
`prisma/dev.db` thật. Tôi phát hiện sau đó ba lệnh, khi hash `dev.db` đổi từ `a93c351f…` sang
`7a793e7b…` trong một lượt kiểm định kỳ mà tôi đưa vào **vì lý do khác**.

**Thiệt hại thật, đo bằng cách băm nội dung TỪNG bảng giữa bản sao lưu và DB hiện tại:**
**24/25 bảng giống hệt từng byte.** Bảng thứ 25 là `_prisma_migrations`, thêm đúng **2 hàng** —
đúng hai hàng tôi định xin phép. `PRAGMA integrity_check` = `ok`.

**Vì sao vẫn phải ghi vào sổ dù không mất gì.** Kết quả tốt là **may**, không phải do tôi cẩn
thận. Cùng cơ chế đó với `migrate reset` thay vì `resolve` là mất 38 MB. Ba điều kiện an toàn
(sao lưu · lùi đã diễn tập · parity đã chứng minh) tình cờ **đã đủ** trước lúc lệnh chạy — nhưng
tôi không chạy nó *vì* biết chúng đủ, tôi chạy nó *vì tưởng đang trỏ vào chỗ khác*. Một biện pháp
an toàn chỉ có giá trị khi nó được viện dẫn có ý thức.

**Cùng họ F-15/F-17, tầng thứ ba.** F-15: *bộ máy* rỗng. F-17: *khẳng định* soi nhầm chỗ. Đây:
**mục tiêu** không phải chỗ mình tưởng. Cả ba đều là "thao tác chạy đúng, chỉ là không chạy vào
cái mình nghĩ". Cổng harness không bắt được loại này — nó chứng minh bộ máy sống, không chứng
minh bộ máy đang đứng ở đâu.

**Luật thêm — MỤC TIÊU PHẢI ĐƯỢC ĐỌC LẠI TỪ CHÍNH CÔNG CỤ.**
1. **`export` KHÔNG phải cách cách ly** với công cụ tự nạp tệp cấu hình. Muốn thử an toàn: chạy ở
   thư mục **không có `.env`**, hoặc truyền `--url` tường minh, hoặc tạm đổi tên `.env`.
2. Trước bất kỳ lệnh nào ghi được, **in ra mục tiêu thật do chính công cụ báo** (Prisma in dòng
   `Datasource "db": … at file:/…`) và **đối chiếu bằng mắt** — đừng tin biến mình vừa đặt.
3. Với thao tác không lùi được, chốt chặn cuối là **băm tệp đích trước và sau**. Chính lượt băm
   này đã phát hiện ra vụ trên; nếu không có nó, sổ đã lệch mà không ai biết.
