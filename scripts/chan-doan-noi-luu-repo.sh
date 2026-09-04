#!/usr/bin/env bash
# scripts/chan-doan-noi-luu-repo.sh — CHẨN ĐOÁN CHỖ ĐẶT REPO CÓ ĐANG ĂN MÒN DỮ LIỆU KHÔNG.
#
# VÌ SAO CÓ (Hoà nêu 04/09): nghi thất thoát tài nguyên liên quan tới việc repo IF nằm trong
# ~/Downloads, và đã từng bị một lần với công cụ đồng bộ.
#
# ⚠️ PHIÊN ĐÁM MÂY KHÔNG KIỂM ĐƯỢC CHUYỆN NÀY. Nó chạy trên bản clone mới trong container, không
# thấy máy Hoà. Tệp này để HOÀ CHẠY TRÊN MÁY THẬT:  bash scripts/chan-doan-noi-luu-repo.sh
#
# Nó CHỈ ĐỌC — không sửa, không xoá, không commit. In ra rồi thôi.
set -uo pipefail
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" || exit 1
R="$(pwd)"; do=0; canh=0
o(){ printf '%s\n' "$*"; }
đo(){ o "  ✅ $*"; }
c(){ o "  ⚠️  $*"; canh=$((canh+1)); }
đ(){ o "  🔴 $*"; do=$((do+1)); }

o "CHẨN ĐOÁN NƠI LƯU REPO — $(date '+%d/%m/%Y %H:%M')"
o "════════════════════════════════════════════════════════════"
o "repo: $R"
o ""

o "① CHỖ ĐẶT"
case "$R" in
  *"/Library/CloudStorage/"*|*"/Google Drive"*|*"/Dropbox"*|*"/OneDrive"*)
    đ "repo NẰM TRONG THƯ MỤC ĐỒNG BỘ. Đây là nguyên nhân hỏng .git kinh điển:" 
    o "     công cụ đồng bộ ghi/khoá tệp .git giữa lúc git đang ghi ⇒ object hỏng, index hỏng,"
    o "     hoặc tệp bị 'giải phóng dung lượng' rồi tải lại chậm ⇒ git đọc ra rỗng." ;;
  "$HOME/Downloads"*)
    c "repo nằm trong ~/Downloads."
    o "     Bản thân Downloads KHÔNG tự đồng bộ trên macOS (iCloud chỉ đồng bộ Desktop+Documents),"
    o "     NHƯNG Google Drive cho phép thêm thư mục bất kỳ ⇒ phải kiểm mục ② mới kết luận được."
    o "     Rủi ro riêng của Downloads: nhiều trình dọn rác/tiện ích 'dọn tải về' quét thư mục này." ;;
  "$HOME/Desktop"*|"$HOME/Documents"*)
    c "repo trong Desktop/Documents — iCloud có thể đang đồng bộ (kiểm ②)." ;;
  *) đo "chỗ đặt không nằm trong vùng đồng bộ quen thuộc." ;;
esac
o ""

o "② CÔNG CỤ ĐỒNG BỘ ĐANG CHẠY"
# ⚠️ CẠM BẪY ĐÃ ĐẠP PHẢI 04/09: `pgrep -f` khớp TOÀN BỘ dòng lệnh, mà danh sách tên công cụ
# nằm ngay trong script này ⇒ nó tự khớp chính mình và báo "9 công cụ đang chạy" trong một
# container Linux trống trơn. Máy chẩn đoán nói dối còn tệ hơn không có máy chẩn đoán.
# Vá: khớp theo TÊN TIẾN TRÌNH (`pgrep -x`/không -f), và loại trừ chính mình + tiến trình cha.
n=0
tu="$$"; cha="$PPID"
for p in "Google Drive" FileProvider bird Dropbox OneDrive Syncthing Resilio Megasync pCloud; do
  pids=$(pgrep -i "$p" 2>/dev/null | grep -vx "$tu" | grep -vx "$cha" || true)
  if [ -n "$pids" ]; then o "  • đang chạy: $p (pid $(echo $pids | tr '\n' ' '))"; n=$((n+1)); fi
done
[ "$n" -eq 0 ] && đo "không thấy tiến trình đồng bộ nào." || c "$n công cụ đang chạy — kiểm xem nó có ôm $R không."
if [ -d "$HOME/Library/CloudStorage" ]; then
  o "  điểm gắn CloudStorage:"; ls -1 "$HOME/Library/CloudStorage" 2>/dev/null | sed 's/^/    /'
fi
o ""

o "③ TỆP BỊ 'GIẢI PHÓNG DUNG LƯỢNG' (dataless) — thủ phạm âm thầm nhất"
if [ "$(uname)" = "Darwin" ]; then
  d=$(find . -flags dataless 2>/dev/null | head -50)
  if [ -n "$d" ]; then
    đ "có tệp DATALESS — nội dung KHÔNG nằm trên đĩa, chỉ là vỏ:"; printf '%s\n' "$d" | sed 's/^/     /'
    o "     git đọc phải tệp như vậy có thể ra rỗng hoặc treo."
  else đo "0 tệp dataless."; fi
else o "  (bỏ qua — chỉ macOS)"; fi
o ""

o "④ TOÀN VẸN KHO GIT"
git fsck --full --no-progress 2>&1 | grep -vE "^dangling|^Checking|^$" | head -20 > /tmp/_fsck.$$ || true
if [ -s /tmp/_fsck.$$ ]; then đ "git fsck có báo lỗi:"; sed 's/^/     /' /tmp/_fsck.$$; else đo "git fsck sạch (bỏ qua dangling — vô hại)."; fi
rm -f /tmp/_fsck.$$
git status --porcelain >/dev/null 2>&1 && đo "index đọc được." || đ "index HỎNG."
o ""

o "⑤ RÁC CỦA CÔNG CỤ ĐỒNG BỘ TRONG REPO"
r=$(find . -not -path "./node_modules/*" -not -path "./.git/*" \
     \( -name "*conflicted copy*" -o -name "*Conflict*" -o -name "desktop.ini" \
        -o -name "Icon?" -o -name ".*.icloud" -o -name "* (1).*" -o -name "* 2.*" \) 2>/dev/null | head -20)
[ -n "$r" ] && { đ "có rác đồng bộ — dấu hiệu CHẮC CHẮN thư mục này đang bị đồng bộ:"; printf '%s\n' "$r" | sed 's/^/     /'; } || đo "không có rác đồng bộ."
o ""

o "⑥ HỆ TỆP PHÂN BIỆT HOA-THƯỜNG?"
t=".__hoa_$$"; printf x > "$t"; if [ -e "$(printf '%s' "$t" | tr 'a-z' 'A-Z')" ]; then
  c "hệ tệp KHÔNG phân biệt hoa-thường (APFS mặc định). Hai tệp chỉ khác chữ hoa sẽ ĐÈ nhau"
  o "     khi checkout, mà Linux/CI thì không — đó là kiểu 'mất tệp' chỉ xảy ra trên máy anh."
else đo "hệ tệp phân biệt hoa-thường."; fi; rm -f "$t"
o ""

o "⑦ THỨ CHƯA COMMIT — nguồn mất mát THẬT SỰ hay gặp nhất"
u=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
i=$(git status --porcelain --ignored 2>/dev/null | grep -c '^!!' || true)
o "  chưa commit: $u mục · bị gitignore: $i mục"
[ "$u" -gt 20 ] && đ "$u mục chưa commit — repo chỉ bảo vệ thứ ĐÃ COMMIT." || đo "cây làm việc gọn."
o "  ⚠️  Thứ nằm trong .gitignore thì git KHÔNG cứu. Lô ảnh duyệt mắt từng biến mất đúng vì vậy"
o "     (04/09: .nen-chrome-out/ bị gitignore, ba lane chạy song song dọn mất trước khi ai kịp nhìn)."
o ""

o "════════════════════════════════════════════════════════════"
o "TỔNG: $do đỏ · $canh cảnh báo"
[ "$do" -gt 0 ] && o "→ Có đỏ: DỜI REPO RA NGOÀI VÙNG ĐỒNG BỘ trước, rồi mới bàn tiếp." 
o "→ Chỗ đặt an toàn: ~/Code/interiorflow (hoặc bất kỳ đâu KHÔNG được đồng bộ)."
o "→ Sao lưu đúng cách là ĐẨY LÊN GIT, không phải để công cụ đồng bộ ôm thư mục .git."
