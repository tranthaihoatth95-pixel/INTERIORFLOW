# CHẠY ĐỢT FINAL — bảng chỉ đường chống sót

> Mở **một tệp này**, làm từ trên xuống, đánh dấu `[x]` khi xong.
> Sáu phiếu nằm ở sáu tệp riêng — cố ý tách để `Cmd+A` → `Cmd+C` là dán trọn, không lo cắt hụt.
> Soạn 08/08 · cập nhật sau khi `p12` xong.

---

## TRẠNG THÁI

| | Phiên | Việc | Tệp dán | Xong? |
|---|---|---|---|---|
| ✅ | `p12` | Nền dữ liệu — 3 bảng + bịt đường đẻ flow mồ côi | `docs/DAN-VAO-p12.md` | **xong, đã push `3578af2`** |
| ⬜ | `p3c` | Bảng kiểm 3 chặng — nối `lib/review` vào UI | `docs/DAN-VAO-p3c.md` | |
| ⬜ | `p14` | Mở kho dựng hình — 11 hàm lên nút | `docs/DAN-VAO-p14.md` | |
| ⬜ | `p3` | Đối chiếu lại mock bằng mắt + xác minh tay cầm panel | `docs/DAN-VAO-p3.md` | |
| ⬜ | `p2` | Dọn trần "5 sheet" + cắt `STATUS.md` + thống nhất thước đếm | `docs/DAN-VAO-p2.md` | |
| ⬜ | `p6` | **Nghiệm thu + build final** — chạy SAU CÙNG | `docs/DAN-VAO-p6.md` | |

---

# BƯỚC 1 · Mở 4 worktree

- [ ] Dán khối này vào Terminal:

```bash
cd ~/Downloads/interiorflow
git worktree add ../interiorflow-wt-p3c -b feat/p3c-bang-kiem
git worktree add ../interiorflow-wt-p14 -b feat/p14-build-ops-ui
git worktree add ../interiorflow-wt-p3  -b feat/p3-mock-doi-chieu
git worktree add ../interiorflow-wt-p2  -b feat/p2-don-tran-sheet
git worktree list
```

✔ Đúng khi `git worktree list` in ra **5 dòng** (thư mục gốc + 4 worktree).

> **Vì sao phải worktree:** bốn phiên cùng sửa một thư mục là bốn người cùng vẽ trên một tờ giấy.
> Đêm 07/08 đã dính đúng bệnh này — 5 tệp khoá git kẹt 24 giờ, `git push` bị từ chối ba lần.

---

# BƯỚC 2 · Cài + chạy server cho từng worktree

Mỗi worktree **một cửa sổ Terminal riêng, một cổng riêng**. Để cả bốn cửa sổ chạy nguyên.

- [ ] **p3c** → cổng 3012

```bash
cd ~/Downloads/interiorflow-wt-p3c && npm install && npm run dev -- -p 3012
```

- [ ] **p14** → cổng 3013

```bash
cd ~/Downloads/interiorflow-wt-p14 && npm install && npm run dev -- -p 3013
```

- [ ] **p3** → cổng 3015

```bash
cd ~/Downloads/interiorflow-wt-p3 && npm install && npm run dev -- -p 3015
```

- [ ] **p2** → cổng 3014

```bash
cd ~/Downloads/interiorflow-wt-p2 && npm install && npm run dev -- -p 3014
```

> `npm install` mỗi worktree mất vài phút. Chạy song song bốn cửa sổ cũng được.

---

# BƯỚC 3 · Dán 4 phiếu

Mỗi phiên phải mở **trong đúng thư mục worktree của nó**, không phải thư mục gốc.

- [ ] Mở `docs/DAN-VAO-p3c.md` → `Cmd+A` `Cmd+C` → dán vào phiên **`p3c`** *(thư mục `interiorflow-wt-p3c`)*
- [ ] Mở `docs/DAN-VAO-p14.md` → `Cmd+A` `Cmd+C` → dán vào phiên **`p14`** *(thư mục `interiorflow-wt-p14`)*
- [ ] Mở `docs/DAN-VAO-p3.md`  → `Cmd+A` `Cmd+C` → dán vào phiên **`p3`**  *(thư mục `interiorflow-wt-p3`)*
- [ ] Mở `docs/DAN-VAO-p2.md`  → `Cmd+A` `Cmd+C` → dán vào phiên **`p2`**  *(thư mục `interiorflow-wt-p2`)*

## Bản đồ chống đụng — không ô nào trùng

| | `lib/review`<br>`components/review` | `AppShell` | `build-ops`<br>`Command3DPanel` | 4 màn rỗng<br>`docs/mocks` | `STATUS.md`<br>"5 sheet" |
|---|---|---|---|---|---|
| `p3c` | ✅ | ✅ | ⛔ | ⛔ | |
| `p14` | ⛔ | ⛔ | ✅ | ⛔ | |
| `p3` | ⛔ | ⛔ | ⛔ | ✅ | |
| `p2` | ⛔ | | ⛔ | ⛔ | ✅ |

`Command3DPanel.tsx` và `Render3DModeSkeleton.tsx` là **hai tệp riêng** (đã kiểm) — `p14` với `p3` không đụng nhau.

---

# BƯỚC 4 · Nhận báo cáo, commit từng nhánh

Phiên nào xong thì nó ghi `docs/M-*-OUT.md` và **KHÔNG commit** (luật V6).

- [ ] `p3c` xong → `docs/M-BANG-KIEM-OUT.md`
- [ ] `p14` xong → `docs/M-BUILD-OPS-2-OUT.md`
- [ ] `p3` xong  → `docs/M-MOCK-2-OUT.md`
- [ ] `p2` xong  → `docs/M-DON-TRAN-OUT.md`

Commit **trong chính worktree đó**, ví dụ:

```bash
cd ~/Downloads/interiorflow-wt-p3c
git add -A
git commit -m "feat(bang-kiem): noi lib/review vao UI ba chang, hai lop LUAT va GOPY tach bach"
```

> Dán báo cáo cho TỔNG trước khi commit cũng được — TỔNG kiểm bằng máy rồi mới gật.

---

# BƯỚC 5 · Gộp cả bốn về `main`

- [ ] Dán khối này (chạy **sau khi cả bốn đã commit**):

```bash
cd ~/Downloads/interiorflow
git merge feat/p3c-bang-kiem
git merge feat/p14-build-ops-ui
git merge feat/p3-mock-doi-chieu
git merge feat/p2-don-tran-sheet
npx tsc --noEmit -p . && node scripts/check-chot.mjs && npm test
```

✔ Đúng khi cả ba cửa kiểm xanh. Gộp mà đụng nhau (`CONFLICT`) → **dừng, dán cho TỔNG**.

- [ ] Push:

```bash
git push origin main
```

---

# BƯỚC 6 · Dọn worktree

⛔ Chỉ dọn khi đủ **cả bốn** điều kiện (luật `CLAUDE.md`) — **KHÔNG dùng `--force`**:

1. Nhánh đã merge vào `main`
2. `git status` trong worktree đó **sạch**
3. Không còn dev server chạy trong đó
4. Không có commit chỉ tồn tại ở worktree đó

- [ ] Kiểm rồi dọn:

```bash
cd ~/Downloads/interiorflow
git branch --merged main
git worktree remove ../interiorflow-wt-p3c && git branch -d feat/p3c-bang-kiem
git worktree remove ../interiorflow-wt-p14 && git branch -d feat/p14-build-ops-ui
git worktree remove ../interiorflow-wt-p3  && git branch -d feat/p3-mock-doi-chieu
git worktree remove ../interiorflow-wt-p2  && git branch -d feat/p2-don-tran-sheet
git worktree list
```

✔ Đúng khi `git worktree list` chỉ còn **1 dòng**.

Thiếu một điều kiện → **giữ nguyên worktree đó**, ghi lý do vào `STATUS.md` mục "Worktree đang mở".

---

# BƯỚC 7 · Nghiệm thu cuối

- [ ] Mở `docs/DAN-VAO-p6.md` → `Cmd+A` `Cmd+C` → dán vào phiên **`p6`**
      *(chạy trên thư mục gốc `~/Downloads/interiorflow`, **KHÔNG** worktree)*

`p6` sẽ:

1. Chạy bốn thước (`tsc` · `check-chot` · `npm test` · `license:check`)
2. Đo lại bảng số TRƯỚC/SAU
3. **Đi một vòng 9 bước trên `dev-sach.db`** — CSDL trống, đúng cảnh người dùng mới cài
4. Build `.dmg`, kiểm gói không mang thừa 30 MB engine Linux
5. Trả lời **CÓ / KHÔNG**: *"nền đã vững, đấu nối đã thông suốt chưa?"*

---

# NHỮNG THỨ ĐỪNG LÀM

| ⛔ | Vì sao |
|---|---|
| Chạy `scripts/gan-flow-mo-coi.mjs --that` | Hoà chốt **phương án B** 08/08: 45 flow đó là rác thử nghiệm, **cố ý để yên**. Cái đã bịt là đường đẻ mồ côi mới |
| Dán hai phiếu vào cùng một phiên | Mỗi phiếu khoanh một vùng sở hữu riêng. Trộn là mất bản đồ chống đụng |
| Mở phiên ở thư mục gốc khi có worktree | Bốn người cùng vẽ một tờ giấy |
| Để phiên tự commit | Luật V6 — Hoà commit. Phiên tự commit là mất quyền xem trước |
| Tin số trong sổ mà không đo lại | §0ab — sổ là ảnh chụp cũ. Đêm 07/08 đã sai vì tin số cũ ba lần |

---

# NẾU KẸT

| Triệu chứng | Làm gì |
|---|---|
| Mọi trang trả **500** `Cannot read properties of undefined` | Bệnh §0aa — `.next` hỏng. `rm -rf .next && npm run dev` |
| `fatal: Unable to create '.git/index.lock'` | Có tệp khoá bỏ lại. Kiểm `ls -la .git/*.lock`, chắc chắn không có git nào đang chạy rồi mới xoá |
| `git status` ra số lạ so với TỔNG đo | Hộp cát của TỔNG nhìn qua lớp mount, **máy anh mới là sự thật**. Dán cho TỔNG |
| `npm run dev` báo `SyntaxError ... package.json` | Có ai đang sửa `package.json` giữa chừng. Chờ vài giây rồi chạy lại |
| Phiên hỏi việc ngoài phạm vi phiếu | Bảo nó đọc lại mục "Sở hữu / Cấm đụng" trong phiếu, rồi báo TỔNG |
