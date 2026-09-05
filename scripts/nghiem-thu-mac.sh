#!/usr/bin/env bash
# scripts/nghiem-thu-mac.sh — phần MÁY LÀM ĐƯỢC của lượt nghiệm thu macOS.
#
# ⛔ TỆP NÀY CHƯA TỪNG CHẠY. Nó được soạn trong một container Linux, nơi không
#    dựng được bản macOS, không mở được app Mac, không ký được. Mọi câu lệnh
#    dưới đây là suy từ cấu hình + mã. Lần chạy đầu tiên trên máy Mac thật là
#    lần kiểm chính nó — sai thì sửa script, đừng sửa kết luận.
#
# ⚠️ Script này KHÔNG kết luận được "bản Mac đạt". Nó chỉ dọn đường và đo những
#    thứ máy đo được (kiến trúc · chữ ký · vị trí dữ liệu · kích thước gói).
#    Phần PHẢI DÙNG BẰNG TAY nằm ở docs/delivery/G7-NGHIEM-THU-MAC.md — đi một
#    mạch, không bấm lẻ.
#
# Dùng: bash scripts/nghiem-thu-mac.sh          (dựng rồi đo)
#       bash scripts/nghiem-thu-mac.sh --do-thoi (bỏ bước dựng, chỉ đo bản có sẵn)

set -uo pipefail

APP="dist-installer/mac-arm64/InteriorFlow.app"
[ -d "$APP" ] || APP="dist-installer/mac/InteriorFlow.app"
DU_LIEU="$HOME/Library/Application Support"
ok=0; loi=0
d_ok() { printf '  \033[32m✓\033[0m %s\n' "$1"; ok=$((ok+1)); }
d_loi() { printf '  \033[31m✗\033[0m %s\n' "$1"; loi=$((loi+1)); }
d_xem() { printf '  \033[33m?\033[0m %s\n' "$1"; }

if [ "$(uname -s)" != "Darwin" ]; then
  echo "Script này chỉ có nghĩa trên macOS. Đang chạy trên: $(uname -s). Dừng."
  exit 2
fi

echo "══ 0 · MÁY NÀY LÀ MÁY GÌ ══"
echo "  macOS $(sw_vers -productVersion) · $(uname -m) · $(sysctl -n machdep.cpu.brand_string 2>/dev/null || echo '?')"
[ "$(uname -m)" = "arm64" ] && d_ok "Apple Silicon — khớp bản dựng arm64" \
  || d_loi "Máy Intel (x86_64). Bản dựng hiện CHỈ có arm64 ⇒ sẽ KHÔNG mở được. Báo lại ngay, đừng đi tiếp."

echo
echo "══ 1 · TRẠNG THÁI DỮ LIỆU TRƯỚC KHI DỰNG ══"
# Đo TRƯỚC để lát nữa so được: nâng cấp/cài lại KHÔNG ĐƯỢC làm mất dữ liệu này.
for ten in InteriorFlow interiorflow; do
  db="$DU_LIEU/$ten/dev.db"
  if [ -f "$db" ]; then
    echo "  $ten/dev.db · $(du -h "$db" | cut -f1) · sửa lần cuối $(stat -f '%Sm' "$db")"
    echo "  → GHI LẠI SỐ NÀY: $(shasum -a 256 "$db" | cut -c1-16)"
    d_ok "Có dữ liệu cũ ở '$ten' — dùng làm mốc so cho mục 6"
  fi
done
[ -d "$DU_LIEU/InteriorFlow" ] || [ -d "$DU_LIEU/interiorflow" ] \
  || d_xem "Chưa có thư mục dữ liệu nào — đây là máy sạch. Mục 6 (giữ dữ liệu) sẽ kiểm ở lượt cài thứ hai."

if [ "${1:-}" != "--do-thoi" ]; then
  echo
  echo "══ 2 · DỰNG BẢN arm64 ══"
  npm run electron:build:mac || { echo "Dựng THẤT BẠI — dừng, chép nguyên lỗi ở trên gửi về."; exit 1; }
fi

echo
echo "══ 3 · GÓI DỰNG RA CÓ ĐÚNG HÌNH KHÔNG ══"
if [ ! -d "$APP" ]; then
  d_loi "Không thấy $APP — bước dựng chưa ra sản phẩm."
  exit 1
fi
echo "  Cỡ gói app: $(du -sh "$APP" | cut -f1)"
ls -1 dist-installer/*.dmg 2>/dev/null | while read -r f; do echo "  DMG: $(basename "$f") · $(du -h "$f" | cut -f1)"; done

bin="$APP/Contents/MacOS/InteriorFlow"
if [ -f "$bin" ]; then
  kt=$(lipo -archs "$bin" 2>/dev/null || echo '?')
  echo "  Kiến trúc: $kt"
  case "$kt" in *arm64*) d_ok "Có lát arm64";; *) d_loi "KHÔNG có lát arm64 — sai đích dựng";; esac
fi

echo
echo "══ 4 · CHỮ KÝ & GATEKEEPER (chưa có chứng chỉ thì đây là kỳ vọng, không phải lỗi) ══"
codesign -dv --verbose=2 "$APP" 2>&1 | grep -E 'Authority|Signature|flags' | sed 's/^/  /'
if codesign -dv "$APP" 2>&1 | grep -q 'adhoc'; then
  d_xem "Ký ad-hoc (chưa có Developer ID). ĐÚNG như dự kiến ở lượt này."
  d_xem "⇒ Máy KHÁC máy dựng sẽ bị Gatekeeper chặn. Đó là mục T7 trong G7 — phải thử THẬT trên máy B."
fi
if codesign -dv "$APP" 2>&1 | grep -q 'runtime'; then
  d_ok "Hardened runtime ĐANG BẬT (cờ 'runtime') — sẵn sàng công chứng khi có chứng chỉ"
else
  d_loi "Hardened runtime KHÔNG bật — kiểm lại build.mac.hardenedRuntime"
fi
codesign -d --entitlements - "$APP" 2>/dev/null | grep -c 'allow-jit' >/dev/null 2>&1 \
  && d_ok "Đọc được entitlements từ gói" || d_xem "Không đọc được entitlements (bình thường khi ký ad-hoc trên vài bản macOS)"

echo
echo "══ 5 · ENGINE THỪA CÓ BỊ CẮT KHÔNG (gói nhẹ = mở nhanh) ══"
res="$APP/Contents/Resources/app/node_modules/.prisma/client"
if [ -d "$res" ]; then
  thua=$(ls "$res" 2>/dev/null | grep -cE 'windows|linux' || true)
  ls -1 "$res" | grep -E 'engine' | sed 's/^/  /'
  [ "$thua" -eq 0 ] && d_ok "Không còn engine của Windows/Linux trong bản Mac" \
    || d_loi "Còn $thua engine của hệ khác — bộ lọc extraResources chưa ăn"
  ls "$res" | grep -q 'darwin' && d_ok "CÓ engine darwin — app mới nối được CSDL" \
    || d_loi "THIẾU engine darwin ⇒ app mở lên sẽ KHÔNG nối được CSDL. Chặn phát hành."
else
  d_loi "Không thấy thư mục engine Prisma trong gói — app sẽ không chạy được CSDL."
fi

echo
echo "══ 6 · DỮ LIỆU THIẾT KẾ NẰM Ở ĐÂU (bất biến: phần mềm ≠ dữ liệu người dùng) ══"
for ten in InteriorFlow interiorflow; do
  [ -d "$DU_LIEU/$ten" ] && echo "  $DU_LIEU/$ten · $(du -sh "$DU_LIEU/$ten" | cut -f1)"
done
d_xem "macOS KHÔNG có trình gỡ cài đặt — kéo app vào Thùng rác KHÔNG đụng thư mục trên."
d_xem "Sau khi mở app lần đầu, chạy lại script này để xem tên thư mục THẬT là gì."

echo
echo "══════════════════════════════════════════"
echo "  Máy đo được: $ok đạt · $loi trượt"
echo "  ⚠️ Đây MỚI LÀ NỬA MÁY. Phần dùng thật ở docs/delivery/G7-NGHIEM-THU-MAC.md —"
echo "     đi một mạch T1→T12, khoảng 45-60 phút. Chưa đi thì CHƯA có kết luận về bản Mac."
[ "$loi" -gt 0 ] && exit 1 || exit 0
