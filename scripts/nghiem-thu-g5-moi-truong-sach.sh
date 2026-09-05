#!/usr/bin/env bash
# scripts/nghiem-thu-g5-moi-truong-sach.sh — NGHIỆM THU G5 TRÊN MÔI TRƯỜNG SẠCH.
#
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║ ⛔ KỊCH BẢN NÀY CHƯA TỪNG ĐƯỢC CHẠY MỘT LẦN NÀO.                             ║
# ║                                                                              ║
# ║ Soạn 04/09 tại mốc a64c0248, trong PHA KHẢO SÁT của cổng G5. Phần đóng gói   ║
# ║ Electron rất tốn nên lượt soạn CỐ Ý không chạy thử. Vì vậy:                  ║
# ║   · mọi bước dưới đây là SUY TỪ CẤU HÌNH, chưa bước nào được quan sát;       ║
# ║   · lần chạy đầu tiên PHẢI có người ngồi cạnh, trên máy thật, đúng nền tảng  ║
# ║     đích — đừng cắm nó vào CI rồi tin kết quả;                               ║
# ║   · chỗ nào nó sai thì SỬA KỊCH BẢN rồi ghi lại, đừng nới cổng cho qua.      ║
# ║                                                                              ║
# ║ Xoá khối này khi nó đã chạy trọn ít nhất một lần và kết quả được ghi vào     ║
# ║ docs/delivery/G5-RELEASE-READINESS.md.                                       ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
#
# PHẠM VI. Kịch bản chỉ làm được PHẦN MÁY của cổng G5 — cổng 1..6 trong bảng 21 cổng
# (checkout · cài · dựng môi trường · migrate deploy · build sản phẩm · đóng gói Electron).
#
# 🔴 CỔNG 7..21 KHÔNG TỰ ĐỘNG HOÁ ĐƯỢC BẰNG TỆP NÀY, và đó không phải thiếu sót tạm
#    thời: "mở bộ cài trên máy sạch rồi làm việc thật" là thứ phải có người và có máy
#    thứ hai. Kịch bản kết thúc bằng cách IN RA danh sách việc tay còn lại, để không ai
#    đọc "rc=0" thành "đã sẵn sàng phát hành".
#
# LUẬT KIỂM CHỨNG (bắt buộc, đã có một lần báo xanh giả vì vi phạm):
#    · giữ MÃ THOÁT THẬT của lệnh sinh ra nó.
#    · CẤM `lệnh | tail; echo $?`  — dạng đó trả mã thoát của `tail`.
#    · dùng `set -o pipefail`, và lấy mã thoát trực tiếp từ lệnh.
#
# CHẠY:
#    bash scripts/nghiem-thu-g5-moi-truong-sach.sh              # bỏ qua đóng gói
#    G5_DONG_GOI=1 bash scripts/nghiem-thu-g5-moi-truong-sach.sh # kèm đóng gói (TỐN)
#
# BIẾN:
#    G5_DONG_GOI=1     chạy cả bước đóng gói Electron (mặc định BỎ QUA — rất tốn)
#    G5_DICH=mac|win   nền tảng đích khi đóng gói (mặc định: suy từ máy đang chạy)

set -u
set -o pipefail

cd "$(git rev-parse --show-toplevel)" || exit 1

NHAT_KY="/tmp/g5-nghiem-thu-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$NHAT_KY"

SO_DAT=0
SO_TRUOT=0
SO_BO_QUA=0
declare -a TRUOT_TEN=()

# ── buoc <tên> <tệp-log> <lệnh...> ────────────────────────────────────────────
# Chạy lệnh, giữ NGUYÊN mã thoát của chính nó. Không đường ống, không `echo $?`
# sau một pipeline. Toàn bộ đầu ra đi vào tệp log để đọc lại khi trượt.
buoc() {
  local ten="$1"; shift
  local log="$NHAT_KY/$1"; shift
  printf '\n── %s\n' "$ten"
  "$@" > "$log" 2>&1
  local rc=$?                      # ← mã thoát THẬT của "$@", lấy ngay lập tức
  if [ "$rc" -eq 0 ]; then
    SO_DAT=$((SO_DAT + 1))
    printf '   ĐẠT   rc=0   log: %s\n' "$log"
  else
    SO_TRUOT=$((SO_TRUOT + 1))
    TRUOT_TEN+=("$ten (rc=$rc)")
    printf '   TRƯỢT rc=%s  log: %s\n' "$rc" "$log"
    printf '   ── 20 dòng cuối ──\n'
    tail -20 "$log" | sed 's/^/   /'
  fi
  return 0                         # không dừng cả lượt; báo cáo trọn ở cuối
}

bo_qua() {
  SO_BO_QUA=$((SO_BO_QUA + 1))
  printf '\n── %s\n   BỎ QUA — %s\n' "$1" "$2"
}

printf '╔══ NGHIỆM THU G5 · MÔI TRƯỜNG SẠCH ══\n'
printf '║ mốc   : %s\n' "$(git rev-parse --short HEAD)"
printf '║ nhánh : %s\n' "$(git rev-parse --abbrev-ref HEAD)"
printf '║ log   : %s\n' "$NHAT_KY"
printf '╚══\n'

# ── Cổng 1 · cây làm việc sạch ────────────────────────────────────────────────
# Không dùng `buoc` vì cần so sánh nội dung, không chỉ mã thoát.
printf '\n── Cổng 1 · cây làm việc sạch\n'
git status --porcelain > "$NHAT_KY/01-status.txt" 2>&1
if [ -s "$NHAT_KY/01-status.txt" ]; then
  SO_TRUOT=$((SO_TRUOT + 1)); TRUOT_TEN+=("Cổng 1 · cây không sạch")
  printf '   TRƯỢT — có thay đổi chưa commit. Bộ cài phải dựng từ cây sạch,\n'
  printf '           nếu không thì không ai truy được bộ cài này từ commit nào.\n'
  sed 's/^/   /' "$NHAT_KY/01-status.txt"
else
  SO_DAT=$((SO_DAT + 1)); printf '   ĐẠT\n'
fi

# ── Cổng 2 · cài đặt đúng lockfile ────────────────────────────────────────────
# `npm ci` chứ không `npm install`: ci tôn trọng lockfile tuyệt đối. Bộ cài phải
# dựng từ đúng bộ phụ thuộc đã khoá, nếu không thì "máy sạch" chỉ là cách nói.
buoc "Cổng 2 · npm ci" 02-npm-ci.log npm ci

# ── Cổng 3 · môi trường xác minh dùng-xong-bỏ ─────────────────────────────────
# Tái dùng script đã có (KHÔNG dựng đường thứ hai). Nó tự tạo .env nháp + CSDL.
buoc "Cổng 3 · dựng môi trường kiểm" 03-moi-truong.log \
  bash scripts/dung-moi-truong-kiem.sh

# ── Cổng 4 · migrations dựng đủ schema ────────────────────────────────────────
# Đây là cổng mà `db push` sẽ CHE MẤT. Giữ nguyên `migrate diff`: nó trả lời đúng
# một câu — "thư mục migrations còn dựng ra đúng schema.prisma không".
buoc "Cổng 4 · migrations khớp schema" 04-migrate-diff.log \
  npx prisma migrate diff \
    --from-migrations ./prisma/migrations \
    --to-schema-datamodel ./prisma/schema.prisma \
    --shadow-database-url "file:$NHAT_KY/shadow.db" \
    --exit-code
# LƯU Ý `--exit-code`: không có cờ này, `migrate diff` trả 0 KỂ CẢ KHI CÓ LỆCH —
# nó chỉ in ra khác biệt. Thiếu cờ này là một cổng luôn xanh, tức một cổng chết.
# Với cờ này: 0 = không lệch, 2 = có lệch, 1 = lỗi.
# ⚠️ CHƯA KIỂM cách `--exit-code` hành xử ở prisma 6.19 — kiểm ở lần chạy đầu.

# ── Cổng 5a · kiểu ────────────────────────────────────────────────────────────
buoc "Cổng 5a · tsc" 05a-tsc.log npx tsc --noEmit

# ── Cổng 5b · bộ kiểm + máy soi ───────────────────────────────────────────────
buoc "Cổng 5b · npm test" 05b-test.log npm test
buoc "Cổng 5c · release:preflight" 05c-preflight.log npm run release:preflight
# ⚠️ preflight ĐẠT không có nghĩa là sẵn sàng phát hành: nó là 8 phép so khớp chuỗi
#    trên electron/main.js, phủ 0/21 cổng của bảng này. Xem G5-RELEASE-READINESS §B2.

# ── Cổng 6a · build sản phẩm ──────────────────────────────────────────────────
buoc "Cổng 6a · next build" 06a-build.log npm run build

# ── Cổng 6b · đóng gói Electron ───────────────────────────────────────────────
# 🔴 RẤT TỐN. Chỉ chạy khi G5_DONG_GOI=1.
if [ "${G5_DONG_GOI:-0}" = "1" ]; then
  DICH="${G5_DICH:-}"
  if [ -z "$DICH" ]; then
    case "$(uname -s)" in
      Darwin) DICH=mac ;;
      *)      DICH=win ;;
    esac
  fi
  printf '\n   đích đóng gói: %s (suy từ uname, ghi đè bằng G5_DICH)\n' "$DICH"
  # ⚠️ CỐ Ý KHÔNG gọi `npm run electron:build`: lệnh đó gõ cứng `--win --x64`
  #    (package.json:31) nên trên máy Mac nó dựng bản Windows — thứ không mở được
  #    trên chính máy vừa dựng, tức không nghiệm thu được cổng 7. Xem M2.
  if [ "$DICH" = "mac" ]; then
    buoc "Cổng 6b · đóng gói (mac)" 06b-pack.log npm run electron:build:mac
  else
    buoc "Cổng 6b · đóng gói (win)" 06b-pack.log npm run electron:build:win
  fi

  printf '\n── Cổng 6c · bộ cài có thật trên đĩa\n'
  # electron-builder có thể kết thúc rc=0 mà không sinh tệp nào đáng dùng.
  # Kiểm bằng SỰ TỒN TẠI của hiện vật, không bằng mã thoát của trình đóng gói.
  find dist-installer -maxdepth 1 -type f \
    \( -name '*.exe' -o -name '*.dmg' -o -name '*.zip' \) \
    > "$NHAT_KY/06c-hien-vat.txt" 2>&1
  if [ -s "$NHAT_KY/06c-hien-vat.txt" ]; then
    SO_DAT=$((SO_DAT + 1)); printf '   ĐẠT — hiện vật:\n'; sed 's/^/   /' "$NHAT_KY/06c-hien-vat.txt"
  else
    SO_TRUOT=$((SO_TRUOT + 1)); TRUOT_TEN+=("Cổng 6c · không sinh bộ cài nào")
    printf '   TRƯỢT — dist-installer/ không có .exe/.dmg/.zip nào.\n'
  fi
else
  bo_qua "Cổng 6b · đóng gói Electron" "chưa bật G5_DONG_GOI=1 (bước này rất tốn)"
  bo_qua "Cổng 6c · bộ cài trên đĩa"   "phụ thuộc cổng 6b"
fi

# ── Tổng kết ──────────────────────────────────────────────────────────────────
printf '\n╔══ TỔNG KẾT PHẦN MÁY\n'
printf '║ đạt %s · trượt %s · bỏ qua %s\n' "$SO_DAT" "$SO_TRUOT" "$SO_BO_QUA"
if [ "${#TRUOT_TEN[@]}" -gt 0 ]; then
  printf '║ TRƯỢT:\n'
  for t in "${TRUOT_TEN[@]}"; do printf '║   · %s\n' "$t"; done
fi
printf '║ log: %s\n' "$NHAT_KY"
printf '╚══\n'

cat <<'CON_LAI'

╔══════════════════════════════════════════════════════════════════════════════╗
║ CÒN LẠI 15 CỔNG — PHẦN NGƯỜI. KHÔNG TỆP NÀO CHẠY THAY ĐƯỢC.                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

Phần trên chỉ chứng minh: từ nguồn sạch DỰNG RA được bộ cài. Nó KHÔNG chứng minh
bộ cài đó DÙNG ĐƯỢC. Bằng chứng phát hành là app đã đóng gói chạy trên MÁY KHÁC.

Trên một máy sạch — KHÔNG phải máy vừa dựng, KHÔNG cài Node/npm:

   7  cài bộ cài, mở app          ⚠️ macOS: bản hiện tại KHÔNG KÝ (identity: null)
                                     ⇒ Gatekeeper nhiều khả năng chặn. Xem M3.
   8  đăng ký · đăng nhập · THOÁT APP RỒI MỞ LẠI (phiên phải còn) — xem M5
   9  Home dựng lên, thẻ Resume đúng chỗ đang dở
  10  tạo dự án mới, mở lại được
  11  chạy trọn 3 hành trình đầu bảng của docs/delivery/JOURNEY-MATRIX.md
  12  🔴 LƯU / TẢI LẠI — nút thắt thật:
        · làm việc → đóng app → mở lại → việc CÒN KHÔNG
        · vào THẲNG deep-link (không qua Home) → làm việc → mở lại  ← lỗi P0 J16
  13  tải một tài sản lên, mở lại app, tài sản còn
  14  3D: dựng khối · chọn · Delete · ⌘Z  (chiều bàn phím đã gãy 2 lần)
  15  Trình bày: đưa bản vẽ sang → sửa → lưu → mở lại
  16  xuất .idf/.idfc rồi NẠP LẠI  (SHIP-BLOCKERS B4)
  17  rút mạng / bỏ trống API key → báo rõ ràng, KHÔNG nút giả
  18  mở DevTools suốt lượt: 0 lỗi console  (bản đóng gói ẩn DevTools ⇒ đo ở bản dev)
  19  thu hẹp cửa sổ tới 1024×640 (minWidth/minHeight) — không vỡ khổ
  20  đi hết bằng Tab: mọi thứ bấm được đều tới được, vòng focus NHÌN THẤY
  21  bấm icon → cửa sổ hiện: bao nhiêu giây?  (bản đóng gói còn phải dựng server
      Next + chạy đồng bộ schema trước khi cửa sổ hiện — chưa ai đo số này)

  ── và một cổng không nằm trên máy nào ──
   ·  GPL/DWG: package.json "licenseNotes" tự khai UNRESOLVED. Đường nhập DWG phải
      được đổi giấy phép / thay thế / cô lập TRƯỚC khi phân phối ra ngoài.
      Đây là cổng pháp lý — không sửa được sau khi bộ cài đã ra khỏi tay.

  Ghi kết quả vào docs/RELEASE-CHECKLIST-INTERNAL.md (mục 3 · máy sạch).
  Cổng nào trượt thì ghi TRƯỢT. Đừng ghi "gần đạt".

CON_LAI

# Mã thoát của cả lượt = có bước máy nào trượt không.
# CỐ Ý không tính "bỏ qua" là trượt: bỏ qua đóng gói là lựa chọn hợp lệ.
if [ "$SO_TRUOT" -gt 0 ]; then exit 1; fi
exit 0
