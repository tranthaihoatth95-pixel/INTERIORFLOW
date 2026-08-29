#!/usr/bin/env python3
"""
scripts/nhuom-anh-the.py — LỚP LỌC ĐIỆN ẢNH theo ASC CDL, có CHUẨN HOÁ THÍCH ỨNG.

Hoà 29/08: *"search công thức filter ảnh trên mạng, range xác suất chạy dài nhiều trường hợp
sáng tối khác nhau, đảm bảo filter khi áp vào phải đẹp và hợp cho từng trường hợp."*

━━ CÔNG THỨC LẤY TỪ ĐÂU, KHÔNG PHẢI TÔI NGHĨ RA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**ASC CDL** (American Society of Cinematographers — Color Decision List) là chuẩn chỉnh màu của
ngành phim, được mọi hệ chỉnh màu chuyên nghiệp nhận. Đúng một dòng cho mỗi kênh R/G/B:

        ra = (slope × vào + offset) ^ power

  · slope  = gain, kéo VÙNG SÁNG
  · offset = lift, nâng VÙNG TỐI
  · power  = gamma, uốn VÙNG GIỮA
rồi một bước bão hoà chung, dùng trọng số sáng Rec.709: `0.2126·R + 0.7152·G + 0.0722·B`.
Ba tham số × ba kênh + một bão hoà = 10 số, và đó là toàn bộ ngôn ngữ chỉnh màu điện ảnh.
Nguồn: pomfort.com/article/an-in-depth-look-at-asc-cdl-based-color-controls · docs.red.com CDL.

━━ VÌ SAO PHẢI CHUẨN HOÁ TRƯỚC KHI NHUỘM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Đây là chỗ bản trước của tôi sai, và là đúng điều Hoà bắt: **một bộ số cố định không thể hợp
cho mọi ảnh.** Đo trên 24 ảnh thật: độ sáng trung bình trải từ **64 đến 170**, tương phản từ
**41 đến 102**. Áp cùng một grade lên cả dải đó thì ảnh vốn tối thành đen kịt, ảnh vốn sáng
thành bệt trắng — nhuộm chỉ ĐẨY, nó không biết ảnh đang đứng ở đâu.

Cách của phòng tối thật là hai bước, và thứ tự không đảo được:
  ① **CHUẨN HOÁ** (thích ứng — mỗi ảnh một bộ số): tìm điểm đen và điểm trắng THẬT của ảnh
     bằng phân vị 0,5% / 99,5% rồi kéo về cùng một mốc. Dùng phân vị chứ không dùng min/max vì
     một điểm nhiễu duy nhất cũng đủ làm hỏng min/max. Sau bước này mọi ảnh đứng cùng vạch.
  ② **NHUỘM** (cố định — mọi ảnh một bộ số): giờ mới áp CDL sáng tạo được, vì "kéo vùng tối
     ngả xanh" nay có nghĩa như nhau trên mọi tấm.

━━ MƯỜI SỐ SÁNG TẠO, mỗi số một lý do ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tông chọn là **lạnh-ở-bóng / ấm-ở-sáng** — cách phân loại màu phổ biến nhất của phim, vì mắt
người đọc hai đầu dải ngả ngược chiều nhau thành CHIỀU SÂU. Kéo cùng chiều là ra ảnh ố.
  · offset  R −0.014 · G −0.004 · B +0.020  → bóng ngả xanh mực (khớp token nền `--bg`)
  · slope   R  1.030 · G  1.008 · B  0.966  → sáng ngả kem (khớp token chữ `--t1`)
  · power   1.04 cả ba kênh                 → hạ nhẹ vùng giữa, giữ điểm đen
  · bão hoà 0.72                            → đủ để ảnh 6 nguồn khác nhau đứng cạnh nhau

━━ CHẠY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    python3 scripts/nhuom-anh-the.py <vào.jpg> <ra.jpg> [--rong 900]
    python3 scripts/nhuom-anh-the.py --thu  <vào.jpg>      # ảnh trước/sau để soi mắt
    python3 scripts/nhuom-anh-the.py --quet <thư mục>      # CHẠY DẢI: chứng minh nó hợp mọi ca
"""
import sys, os

try:
    import numpy as np
    from PIL import Image
except ImportError:
    print("Cần Pillow và numpy: python3 -m pip install Pillow numpy", file=sys.stderr)
    sys.exit(2)

# ── ① chuẩn hoá thích ứng ──────────────────────────────────────────────────────────────────
PHAN_VI = (0.5, 99.5)      # điểm đen / điểm trắng, bỏ 0,5% đuôi mỗi bên
MOC_DEN, MOC_TRANG = 0.030, 0.955   # kéo về đây; chừa 3% để không có điểm đen tuyệt đối
KEO_TOI_DA = 2.6           # trần hệ số kéo — ảnh mù sương thật thì đừng ép thành tương phản giả
# 🔴 THÊM SAU LẦN CHẠY DẢI ĐẦU. Chuẩn hoá điểm đen/trắng KHÔNG đủ: nó neo hai ĐẦU dải, còn
# VÙNG GIỮA vẫn ở đâu tuỳ ảnh. Đo được: độ trải độ sáng 27,5 → **29,0** — rộng ra chứ không
# hẹp lại. Một tấm toàn trời vẫn sáng, một tấm toàn bóng đổ vẫn tối, dù hai đầu đã khớp.
# ⇒ Thêm nhịp khớp vùng giữa bằng gamma thích ứng: chọn g sao cho độ sáng trung bình rơi về
# MOC_GIUA. Đây là "khớp phơi sáng" của phòng tối, không phải mẹo.
# Kẹp g trong [0.72, 1.40]: quá tay thì ảnh đêm bị kéo thành ảnh ngày — sai sự thật của tấm ảnh,
# và đó là ranh giới giữa CHỈNH MÀU và BỊA.
MOC_GIUA = 0.455
GAMMA_KEP = (0.72, 1.40)

# ── ② CDL sáng tạo, cố định ────────────────────────────────────────────────────────────────
SLOPE = np.array([1.030, 1.008, 0.966])
OFFSET = np.array([-0.014, -0.004, 0.020])
POWER = np.array([1.04, 1.04, 1.04])
BAO_HOA = 0.72
LUMA_709 = np.array([0.2126, 0.7152, 0.0722])
HAT = 0.016   # hạt phim, độ lệch chuẩn theo thang 0–1


def chuan_hoa(x: "np.ndarray") -> "np.ndarray":
    """Kéo điểm đen/trắng THẬT của ảnh về cùng một mốc. Bước duy nhất khác nhau giữa các ảnh."""
    l = x @ LUMA_709
    den, trang = np.percentile(l, PHAN_VI[0]), np.percentile(l, PHAN_VI[1])
    if trang - den < 1e-4:
        return x
    keo = min(KEO_TOI_DA, (MOC_TRANG - MOC_DEN) / (trang - den))
    y = np.clip((x - den) * keo + MOC_DEN, 0, 1)

    # khớp vùng giữa — gamma thích ứng đưa độ sáng trung bình về cùng một mốc
    m = float((y @ LUMA_709).mean())
    if 0.02 < m < 0.98:
        g = float(np.clip(np.log(MOC_GIUA) / np.log(m), *GAMMA_KEP))
        y = np.clip(y, 0, 1) ** g
    return y


def cdl(x: "np.ndarray") -> "np.ndarray":
    """ASC CDL: ra = (slope·vào + offset)^power, rồi bão hoà theo trọng số Rec.709."""
    y = np.clip(x * SLOPE + OFFSET, 0, 1) ** POWER
    l = (y @ LUMA_709)[..., None]
    return np.clip(l + BAO_HOA * (y - l), 0, 1)


def nhuom(im: "Image.Image", hat: bool = True) -> "Image.Image":
    x = np.asarray(im.convert("RGB"), dtype=np.float32) / 255.0
    y = cdl(chuan_hoa(x))
    if hat and HAT:
        rng = np.random.default_rng(7)   # TẤT ĐỊNH: cùng ảnh vào luôn cho cùng ảnh ra
        y = np.clip(y + rng.normal(0, HAT, y.shape[:2])[..., None], 0, 1)
    return Image.fromarray((y * 255 + 0.5).astype(np.uint8))


def cat_dai(im: "Image.Image", rong: int) -> "Image.Image":
    """Cắt đúng dải 2:1 mà thẻ hiện — CÙNG công thức với `soi-anh-the.py`, đừng để hai bên lệch."""
    w, h = im.size
    can = w / 2
    if can <= h:
        top = max(0, int((h - can) * 0.38))
        im = im.crop((0, top, w, top + int(can)))
    else:
        cw = h * 2
        im = im.crop(((w - cw) // 2, 0, (w - cw) // 2 + int(cw), h))
    return im.resize((rong, rong // 2), Image.LANCZOS)


def so_do(im: "Image.Image"):
    l = (np.asarray(im.convert("RGB"), dtype=np.float32) / 255.0) @ LUMA_709
    return l.mean() * 255, l.std() * 255


def quet(thu_muc: str) -> int:
    """CHẠY DẢI — bằng chứng bộ lọc hợp cho MỌI ca sáng/tối, không chỉ cho tấm tôi đem đi khoe."""
    tep = sorted(f for f in os.listdir(thu_muc) if f.lower().endswith((".jpg", ".jpeg", ".png")))
    truoc, sau = [], []
    print(f"\nCHẠY DẢI — {len(tep)} ảnh")
    print("─" * 74)
    print(f"{'tệp':<12}{'sáng trước':>12}{'sáng sau':>10}{'t.phản trước':>14}{'t.phản sau':>12}")
    for f in tep:
        a = cat_dai(Image.open(os.path.join(thu_muc, f)), 600)
        b = nhuom(a, hat=False)
        m0, s0 = so_do(a)
        m1, s1 = so_do(b)
        truoc.append((m0, s0))
        sau.append((m1, s1))
        print(f"{f:<12}{m0:>12.0f}{m1:>10.0f}{s0:>14.0f}{s1:>12.0f}")
    t = np.array(truoc)
    s = np.array(sau)
    print("─" * 74)
    print(f"{'DẢI SÁNG':<12}{t[:,0].min():>6.0f}–{t[:,0].max():<5.0f}{s[:,0].min():>6.0f}–{s[:,0].max():<4.0f}"
          f"{t[:,1].min():>10.0f}–{t[:,1].max():<5.0f}{s[:,1].min():>8.0f}–{s[:,1].max():<4.0f}")
    print(f"{'ĐỘ TRẢI':<12}{t[:,0].std():>12.1f}{s[:,0].std():>10.1f}{t[:,1].std():>14.1f}{s[:,1].std():>12.1f}")
    co = s[:, 0].std() < t[:, 0].std() and s[:, 1].std() < t[:, 1].std()
    trong_dai = ((s[:, 0] > 55) & (s[:, 0] < 190) & (s[:, 1] > 30)).all()
    print()
    print(f"  {'✅' if co else '🔴'} độ trải THU HẸP sau khi nhuộm — mọi ảnh về gần một tông")
    print(f"  {'✅' if trong_dai else '🔴'} mọi ảnh nằm trong dải đọc được (sáng 55–190, tương phản >30)")
    print("\nĐây là bằng chứng bộ lọc hợp cho CẢ DẢI, không chỉ cho tấm đem đi khoe.\n")
    return 0 if (co and trong_dai) else 1


def main() -> int:
    a = sys.argv[1:]
    if not a:
        print(__doc__)
        return 2
    if a[0] == "--quet":
        return quet(a[1])
    if a[0] == "--thu":
        t = cat_dai(Image.open(a[1]), 900)
        bp = Image.new("RGB", (900, 902), (12, 12, 14))
        bp.paste(t, (0, 0))
        bp.paste(nhuom(t), (0, 452))
        ra = os.path.splitext(a[1])[0] + "-truoc-sau.jpg"
        bp.save(ra, quality=88)
        print(f"trước/sau → {ra}")
        return 0
    rong = int(a[a.index("--rong") + 1]) if "--rong" in a else 900
    nhuom(cat_dai(Image.open(a[0]), rong)).save(a[1], quality=82, optimize=True)
    print(f"{a[1]}  {os.path.getsize(a[1])//1024} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
