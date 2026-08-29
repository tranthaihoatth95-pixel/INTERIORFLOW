#!/usr/bin/env python3
"""
scripts/soi-anh-the.py — TIÊU CHUẨN ẢNH CHO THẺ KHOÁ, đo bằng máy chứ không chấm bằng cảm tính.

Hoà chốt 29/08: *"hình lấy phải đạt tiêu chuẩn, thiết lập tiêu chuẩn để hình được chọn phải phù
hợp về mặt bố cục, sau đó blend cho nó 1 lớp filter để màu sắc điện ảnh phù hợp design."*

VÌ SAO PHẢI LÀ MÁY: "ảnh này đẹp không" là câu hỏi không ai trả lời giống ai, và người chọn luôn
tìm được lý do cho tấm mình thích. Nhưng ảnh dùng cho MỘT KHUNG CỤ THỂ thì có ràng buộc đo được:
nó bị cắt thành dải 300×150 (tỉ lệ 2:1) nằm dưới chữ, trong một thẻ nhỏ. Bảy phép đo dưới đây
không nói tấm nào ĐẸP — chúng loại những tấm CHẮC CHẮN HỎNG trong khung đó. Việc chọn cái đẹp
nhất trong số còn sống vẫn là của người.

    python3 scripts/soi-anh-the.py <thư mục ảnh>          # chấm, in bảng
    python3 scripts/soi-anh-the.py <thư mục> --chan       # thoát 1 nếu có tấm TRƯỢT

🔴 SỬA SAU LẦN CHẠY ĐẦU — bản đầu gộp "LỖI" với "KÉM HỢP" làm một, và chạy trên 24 ảnh kiến
trúc thật cho ra **0/24 đạt**. Phép đo loại sạch mọi ứng viên thì nó không đo gì cả.
Nguyên nhân không phải ngưỡng sai mà là PHÂN LOẠI SAI: khổ nhỏ, cháy trắng, tỉ lệ không cắt được
là **HỎNG** — tấm nào dính là bỏ, không bàn. Còn "nhiều chi tiết", "ít mảng nghỉ" là **KÉM HỢP**
— chúng nói tấm này *kém hợp hơn tấm kia* cho khung này, chứ không nói nó hỏng. Ảnh kiến trúc
vốn nhiều nét; lấy đó làm cớ loại thì loại cả nghề.
⇒ Nay chia hai tầng: **5 CỔNG CHẶN** (đo tuyệt đối, trượt là loại) và **2 THANG XẾP HẠNG**
(đo tương đối, dùng để xếp thứ tự trong số đã qua cổng). Người chọn trong nhóm đầu bảng.

NĂM CỔNG CHẶN + HAI THANG XẾP HẠNG:

 ① KHỔ ĐỦ LỚN        ≥900px ngang. Dải hiện ở 300px, màn 2x cần 600px, chừa biên cắt ⇒ 900.
                     Thiếu là ảnh nở ra, thấy điểm ảnh.
 ② CẮT ĐƯỢC 2:1      tỉ lệ gốc trong [1.10, 2.60]. Quá vuông thì cắt 2:1 mất hết phần trên hoặc
                     dưới; quá dẹt thì cắt xong còn lại một mẩu giữa, mất bối cảnh.
 ③ SÁNG VỪA          độ sáng trung bình dải cắt trong [58, 200]/255. Tối quá thì thành vệt đen
                     vô nghĩa; sáng quá thì chữ trắng phía trên hết đọc được.
 ④ CÒN TƯƠNG PHẢN    độ lệch chuẩn ≥26. Ảnh mù sương/bệt màu để dưới chữ trông như lỗi tải ảnh.
 ⑤ KHÔNG CHÁY/BẸT    ≤2% điểm ảnh chạm 0 hoặc 255. Vùng cháy trắng ăn mất chi tiết, và lớp
                     phủ màu ở bước sau KHÔNG cứu lại được — cháy là mất hẳn dữ liệu.
 ⑥ ĐỘ TĨNH  (xếp hạng, không chặn)  = 1 − mật độ biên. Dải này nằm ngay trên một câu cần đọc,
                     nên ảnh càng tĩnh càng để chữ thở. Ảnh chi tiết dày (giàn giáo, tán lá,
                     đám đông) kéo mắt khỏi chữ — kém hợp, không phải hỏng.
MỘT TIÊU CHÍ BỐ CỤC, KHÔNG HAI (Hoà chốt 29/08: *"chỉ cần 1 tiêu chí về bố cục thôi là chọn"*).
Bản trước tôi trộn hai thang — độ tĩnh và mảng nghỉ — với trọng số 0,62/0,38. Hai con số đó tôi
tự đặt, không có gì chứng minh, và trộn hai thang thì **không ai truy được vì sao tấm A hơn tấm
B**. Một thang thì tranh cãi được: *"tấm này tĩnh hơn"* là câu kiểm lại được.
Giữ ĐỘ TĨNH vì nó đo đúng thứ đang tranh chấp: **chữ và ảnh cùng đòi sự chú ý trong một thẻ
300px**. Mảng nghỉ vẫn được đo và in ra để tham khảo, nhưng KHÔNG vào điểm.

⛔ GIỚI HẠN PHẢI KHAI: BẢY PHÉP ĐO NÀY ĐO **HÌNH THỨC**, KHÔNG ĐO **NỘI DUNG**.
Ca thật bắt được ngay lần chạy đầu: tấm xếp hạng cao nhất cho Le Corbusier là **một tấm biển
chỉ đường ghi chữ "Villa Savoye"** — nó phẳng, tĩnh, sáng đều, qua sạch mọi cổng. Máy không biết
đó không phải công trình. ⇒ Máy lọc xong, **người vẫn phải nhìn** ít nhất một lượt trước khi
đưa vào app. Đây không phải lỗi sửa được bằng thêm ngưỡng: "đây có phải công trình của người
nói không" là câu hỏi về nghĩa, không phải về điểm ảnh.

Ngưỡng nào cũng có thể sai. Sửa được — nhưng phải sửa Ở ĐÂY, một chỗ, kèm lý do; cấm nới ngưỡng
cho lọt một tấm cụ thể. Đó đúng là cách một tiêu chuẩn chết.
"""
import sys, os, json

try:
    from PIL import Image, ImageFilter, ImageStat
except ImportError:
    print("Cần Pillow: python3 -m pip install Pillow", file=sys.stderr)
    sys.exit(2)

NGUONG = {
    "rong_toi_thieu": 900,
    "ti_le": (1.10, 2.60),
    "sang": (58, 200),
    "tuong_phan_toi_thieu": 26.0,
    "chay_toi_da": 0.02,
}


def cat_dai(im: "Image.Image") -> "Image.Image":
    """Cắt đúng dải 2:1 mà thẻ sẽ hiện — đo trên phần THẬT SỰ nhìn thấy, không đo cả ảnh."""
    w, h = im.size
    can = w / 2
    if can <= h:
        # Cắt theo chiều cao, lấy phần hơi trên tâm: công trình thường nằm nửa trên,
        # nửa dưới hay là mặt đường/cỏ.
        top = max(0, int((h - can) * 0.38))
        return im.crop((0, top, w, top + int(can)))
    can_w = h * 2
    left = (w - can_w) // 2
    return im.crop((left, 0, left + int(can_w), h))


def do(path: str) -> dict:
    # Một tệp tải dở KHÔNG được làm chết cả lượt soi. Cổng gãy vì một tệp hỏng là cổng không
    # dùng được — bắt được lần chạy đầu trên 110 ảnh: đúng một tấm truncated, cả máy dừng.
    try:
        im = Image.open(path).convert("RGB")
    except Exception as e:
        return {"tep": os.path.basename(path), "rong": 0, "cao": 0, "ti_le": 0,
                "sang": 0, "tuong_phan": 0, "chay": 0, "roi": 0, "chenh_o": 0,
                "o_phang": 0, "diem_hop": 0.0, "dat": False,
                "loi": [f"không đọc được: {type(e).__name__}"]}
    w, h = im.size
    dai = cat_dai(im).resize((600, 300), Image.LANCZOS)
    xam = dai.convert("L")
    st = ImageStat.Stat(xam)
    sang, lech = st.mean[0], st.stddev[0]

    hist = xam.histogram()
    tong = sum(hist)
    chay = (hist[0] + hist[255]) / tong

    bien = xam.filter(ImageFilter.FIND_EDGES)
    roi = sum(1 for p in bien.getdata() if p > 40) / (600 * 300)

    # lưới 6×3 — tìm mảng nghỉ
    o_sang, o_phang = [], 0
    for gy in range(3):
        for gx in range(6):
            o = xam.crop((gx * 100, gy * 100, gx * 100 + 100, gy * 100 + 100))
            s = ImageStat.Stat(o)
            o_sang.append(s.mean[0])
            if s.stddev[0] < 18:
                o_phang += 1
    chenh_o = max(o_sang) - min(o_sang)

    loi = []
    if w < NGUONG["rong_toi_thieu"]:
        loi.append(f"khổ nhỏ {w}px < {NGUONG['rong_toi_thieu']}")
    tl = w / h
    if not (NGUONG["ti_le"][0] <= tl <= NGUONG["ti_le"][1]):
        loi.append(f"tỉ lệ {tl:.2f} ngoài {NGUONG['ti_le']}")
    if not (NGUONG["sang"][0] <= sang <= NGUONG["sang"][1]):
        loi.append(f"sáng {sang:.0f} ngoài {NGUONG['sang']}")
    if lech < NGUONG["tuong_phan_toi_thieu"]:
        loi.append(f"bệt màu, lệch chuẩn {lech:.0f} < {NGUONG['tuong_phan_toi_thieu']:.0f}")
    if chay > NGUONG["chay_toi_da"]:
        loi.append(f"cháy/bẹt {chay*100:.1f}% > {NGUONG['chay_toi_da']*100:.0f}%")
    # ⑥⑦ KHÔNG vào `loi` — chúng xếp hạng, không chặn (xem chú thích đầu tệp).
    # MỘT tiêu chí: độ tĩnh. 0.40 = mức rối cao nhất đo được trên tập ảnh kiến trúc thật.
    diem_hop = round(max(0.0, min(1.0, 1 - roi / 0.40)), 3)

    return {
        "tep": os.path.basename(path), "rong": w, "cao": h, "ti_le": round(tl, 2),
        "sang": round(sang), "tuong_phan": round(lech), "chay": round(chay, 4),
        "roi": round(roi, 4), "chenh_o": round(chenh_o), "o_phang": o_phang,
        "diem_hop": diem_hop, "dat": not loi, "loi": loi,
    }


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    thu_muc = sys.argv[1]
    chan = "--chan" in sys.argv
    tep = sorted(
        os.path.join(thu_muc, f) for f in os.listdir(thu_muc)
        if f.lower().endswith((".jpg", ".jpeg", ".png"))
    )
    if not tep:
        print(f"Không có ảnh nào trong {thu_muc}", file=sys.stderr)
        return 2

    kq = [do(p) for p in tep]
    dat = sorted([k for k in kq if k["dat"]], key=lambda k: -k["diem_hop"])

    print(f"\nTIÊU CHUẨN ẢNH THẺ KHOÁ — {len(tep)} tấm")
    print("─" * 100)
    print(f"{'tệp':<12}{'khổ':>11}{'tỉ lệ':>7}{'sáng':>6}{'t.phản':>8}{'cháy':>7}{'độ tĩnh':>10}")
    for k in kq:
        dau = "✅" if k["dat"] else "🔴"
        print(f"{dau} {k['tep']:<10}{k['rong']}×{k['cao']:<6}{k['ti_le']:>6}{k['sang']:>6}"
              f"{k['tuong_phan']:>8}{k['chay']*100:>6.1f}%{k['diem_hop']:>10.3f}")
        for l in k["loi"]:
            print(f"     └ {l}")
    print("─" * 100)
    print(f"QUA CỔNG {len(dat)}/{len(tep)} — xếp theo ĐIỂM HỢP giảm dần:")
    for k in dat[:8]:
        print(f"   tĩnh {k['diem_hop']:.3f}  {k['tep']}   (ô nghỉ {k['o_phang']}/18 — tham khảo, không vào điểm)")
    print("\nNăm cổng LOẠI tấm hỏng. Điểm hợp XẾP HẠNG tấm còn sống — nó không nói tấm nào ĐẸP.")
    print("Chọn trong nhóm đầu bảng vẫn là việc của người.\n")

    json.dump(kq, open(os.path.join(thu_muc, "_diem.json"), "w"), ensure_ascii=False, indent=1)
    return 1 if (chan and len(dat) < len(tep)) else 0


if __name__ == "__main__":
    sys.exit(main())
