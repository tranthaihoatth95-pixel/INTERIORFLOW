#!/usr/bin/env python3
"""
scripts/nhuom-anh-the.py — LỚP LỌC ĐIỆN ẢNH, bước SAU tiêu chuẩn.

Hoà chốt 29/08: *"chỉ cần 1 tiêu chí về bố cục thôi là chọn → blend filter điện ảnh là bước sau
tiêu chuẩn."* Đúng thứ tự đó: `soi-anh-the.py` lọc và xếp hạng trước, tệp này chỉ nhuộm những
tấm ĐÃ QUA cổng. Nhuộm một tấm hỏng thì nó vẫn hỏng, chỉ hỏng có màu.

VÌ SAO NHUỘM Ở BƯỚC DỰNG chứ không phải bằng CSS lúc chạy:
  · Ảnh vào từ 6 nguồn khác nhau, chụp bằng 6 máy, 6 kiểu thời tiết. Không nhuộm thì thẻ khoá
    đổi tông mỗi lần bốc câu — đó là thứ phá cảm giác "một sản phẩm" nhanh nhất.
  · CSS `filter` chạy lại mỗi khung hình trên mọi máy; nhuộm sẵn thì tốn 0 GPU.
  · Nhuộm sẵn là TẤT ĐỊNH: ai mở cũng thấy đúng một màu, không phụ thuộc trình duyệt.

BỐN NHỊP, theo đúng thứ tự phòng tối — đảo thứ tự là ra màu khác:
  ① HẠ BÃO HOÀ 62%      ảnh du lịch bão hoà cao đá nhau chan chát khi nằm cạnh nhau.
  ② NÉN DẢI SÁNG NHẸ    kéo vùng tối lên 3,5%, ép vùng sáng xuống 96,5% — chỉ đủ để không còn
                        điểm cháy trắng tuyệt đối, KHÔNG nâng đen lên xám. Nâng nhiều là ra ảnh
                        cũ phai chứ không phải điện ảnh (đã trả giá ở bản đầu).
  ③ NHUỘM HAI ĐẦU       bóng ngả LẠNH (xanh mực), sáng ngả ẤM (kem). Đây là cách phân loại màu
                        của phim: hai đầu dải kéo về hai phía đối nhau thì hình có CHIỀU SÂU
                        mà không cần tăng tương phản. Kéo cùng phía là ra ảnh ố vàng.
  ④ HẠT PHIM MỊN        chống dải màu ở vùng chuyển sắc lớn (trời), và cho ảnh có chất.

Màu nhuộm lấy từ token của app, không phải màu tôi thích: `--bg #0c0c0e` cho phía bóng,
`--t1 #f5f5f7` ngả ấm cho phía sáng. Nhờ vậy ảnh nằm trong thẻ như thuộc về nó, không như dán vào.

    python3 scripts/nhuom-anh-the.py <vào.jpg> <ra.jpg> [--rong 900]
    python3 scripts/nhuom-anh-the.py --thu <vào.jpg>       # xuất bản so sánh trước/sau
"""
import sys, os

try:
    from PIL import Image, ImageEnhance, ImageOps
except ImportError:
    print("Cần Pillow: python3 -m pip install Pillow", file=sys.stderr)
    sys.exit(2)

# Hai đầu dải — đọc từ token app, giữ nguyên tên biến để tra ngược được.
BONG = (18, 24, 38)     # --bg #0c0c0e ngả xanh mực
SANG = (252, 247, 238)  # --t1 #f5f5f7 ngả kem
BAO_HOA = 0.62
# 🔴 HIỆU CHỈNH SAU LẦN SOI ĐẦU: bản đầu `0.10 / 0.94` + nhuộm 0.30 cho ra ảnh BẠC MÀU như
# ảnh cũ phai, không phải "điện ảnh". Nhìn ảnh trước/sau là thấy ngay — số đo không nói được.
# Nguyên nhân: kéo vùng tối lên 10% là quá tay, ảnh mất hẳn điểm đen, mà MẤT ĐIỂM ĐEN thì hình
# hết chiều sâu. Phim thật vẫn giữ đen, nó chỉ đổi SẮC của đen chứ không nâng đen lên xám.
NEN_TOI, NEN_SANG = 0.035, 0.965
DO_NHUOM = 0.22
# Bù tương phản sau khi nhuộm — nhuộm luôn làm phẳng hình một chút, đây là bước lấy lại.
BU_TUONG_PHAN = 1.14
HAT = 5


def nhuom(im: "Image.Image") -> "Image.Image":
    im = im.convert("RGB")

    # ① hạ bão hoà
    im = ImageEnhance.Color(im).enhance(BAO_HOA)

    # ② nén dải sáng — dựng bảng tra một lần, áp cho cả ba kênh
    bang = [round(255 * (NEN_TOI + (NEN_SANG - NEN_TOI) * (i / 255))) for i in range(256)]
    im = im.point(bang * 3)

    # ③ nhuộm hai đầu: pha ảnh với thang màu bóng→sáng theo ĐỘ SÁNG của chính điểm ảnh
    xam = im.convert("L")
    thang = ImageOps.colorize(xam, black=BONG, white=SANG)
    im = Image.blend(im, thang, DO_NHUOM)

    # ③b lấy lại tương phản đã mất khi nhuộm — giữ điểm đen, đó là thứ cho hình chiều sâu
    im = ImageEnhance.Contrast(im).enhance(BU_TUONG_PHAN)

    # ④ hạt phim — nhiễu đơn sắc, cùng mức cho cả ba kênh nên không lệch màu
    if HAT:
        import random
        random.seed(7)  # TẤT ĐỊNH: cùng ảnh vào luôn cho cùng ảnh ra
        w, h = im.size
        nhieu = Image.new("L", (w, h))
        nhieu.putdata([128 + random.randint(-HAT, HAT) for _ in range(w * h)])
        im = Image.blend(im, Image.merge("RGB", (nhieu, nhieu, nhieu)), 0.055)
    return im


def cat_dai(im: "Image.Image", rong: int) -> "Image.Image":
    """Cắt đúng dải 2:1 mà thẻ hiện — cùng công thức với `soi-anh-the.py`, đừng để hai bên lệch."""
    w, h = im.size
    can = w / 2
    if can <= h:
        top = max(0, int((h - can) * 0.38))
        im = im.crop((0, top, w, top + int(can)))
    else:
        cw = h * 2
        im = im.crop(((w - cw) // 2, 0, (w - cw) // 2 + int(cw), h))
    return im.resize((rong, rong // 2), Image.LANCZOS)


def main() -> int:
    a = sys.argv[1:]
    if not a:
        print(__doc__)
        return 2
    if a[0] == "--thu":
        goc = Image.open(a[1])
        t = cat_dai(goc, 900)
        s = nhuom(t)
        bp = Image.new("RGB", (900, 902), (12, 12, 14))
        bp.paste(t, (0, 0))
        bp.paste(s, (0, 452))
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
