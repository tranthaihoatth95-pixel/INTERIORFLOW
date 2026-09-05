/**
 * lib/three/uv-chieu-hop.ts — CHIẾU HỘP RA `uv`, đơn vị MÉT THẾ GIỚI.
 *
 * ⛔ VÌ SAO TỒN TẠI — đo được trên Chromium + WebGL 2.0 (05/09, `docs/delivery/PROBE-DUONG-ONG-ANH.md`
 * mục "ĐO LẦN HAI"): dựng đúng khuôn `geometryOf()` (CHỈ `position`) rồi gán `material.map` cho ra
 * **ĐÚNG MỘT MÀU trên toàn mặt, và KHÔNG ném lỗi** — `pageerror` = 0, không cảnh báo, không màu tím
 * báo hỏng. Tức gán vật liệu PBR lên hình học thiếu `uv` thì `tsc` sạch, test xanh, ảnh chụp "trông
 * như cũ", và **không máy soi nào của IF bắt được** vì không có gì sai để bắt.
 * ⇒ UV phải có TRƯỚC mọi việc gán vật liệu. Đó là lý do tệp này là bước 1, không phải bước phụ.
 *
 * ⚠️ ĐƠN VỊ LÀ MÉT, KHÔNG PHẢI 0..1 — ràng buộc cứng, đừng "chuẩn hoá cho đẹp":
 * `uvRepeatOf()` (`pbr-three.ts:23`) tính `repeat = 1000 / uvScaleMm.w`, tức nó GIẢ ĐỊNH
 * **1 đơn vị UV = 1 mét thế giới**. Chuẩn hoá UV về 0..1 là phá tỉ lệ vật lý của TOÀN APP: viên
 * gạch 600 mm sẽ phủ trọn một bức tường 6 m thay vì lặp 10 lần.
 *
 * ⚠️ KHÔNG TRỪ GỐC BBOX. UV neo vào toạ độ THẾ GIỚI nên vân LIÊN TỤC qua mọi ranh giới mesh: hai
 * tường cùng vật liệu bị gộp chung, hay một tường đi đường `massing` còn tường kia đi đường gộp
 * tĩnh, vẫn khớp vân với nhau. Trừ gốc bbox sẽ làm mỗi mesh có pha riêng ⇒ vân gãy ở đúng chỗ mắt
 * nhìn vào (góc tường). Cái giá: toạ độ UV lớn dần theo khoảng cách tới gốc — ở 1 km, sai số
 * float32 còn ~0,06 mm, không thấy được; cảnh xa gốc hàng chục km mới đáng lo.
 *
 * VÌ SAO CHIẾU HỘP chứ không phải hai lựa chọn kia (T chốt, `P-V8c` §QUYẾT ĐỊNH KIẾN TRÚC ①):
 *  · planar MỘT trục ⇒ mặt vuông góc trục đó bị KÉO GIÃN thành vệt — sàn hoặc tường, chọn cái nào
 *    cũng hỏng cái kia.
 *  · triplanar ⇒ phải viết shader riêng ⇒ rời khỏi `MeshPhysicalMaterial` mà `buildPbrMaterial`
 *    dựng ⇒ **đẻ đường vật liệu thứ hai**. Cấm.
 *  · chiếu hộp tất định, tính một lần lúc dựng hình, và mặt xiên thì méo CÓ KIỂM SOÁT (thấy ngay
 *    trên ảnh chẩn đoán) chứ không méo bí ẩn. Nội thất gần như luôn vuông góc trục.
 *
 * KHÔNG import `three` — thuần số học trên mảng phẳng, chạy được trong test Node không cần DOM.
 */

/** Trục trội của một tam giác: 0 = X, 1 = Y, 2 = Z. */
export type TrucTroi = 0 | 1 | 2;

/**
 * Chiếu hộp một mảng vị trí tam-giác-hoá phẳng (`[x,y,z, x,y,z, …]`, MÉT, hệ three.js Y-up) ra
 * mảng `uv` phẳng (`[u,v, u,v, …]`), độ dài = 2/3 độ dài đầu vào.
 *
 * Mỗi TAM GIÁC lấy pháp tuyến riêng (tích có hướng hai cạnh) rồi chọn trục trội; cả 3 đỉnh của
 * tam giác đó dùng CHUNG một phép chiếu — nên tam giác không bao giờ bị xé UV giữa hai trục.
 *
 * DẤU theo quy ước mặt lập phương (giống box mapping của Blender/3ds Max): nhìn thẳng vào mặt
 * TỪ PHÍA PHÁP TUYẾN thì `u` tăng sang PHẢI, `v` tăng LÊN ⇒ ảnh KHÔNG bị lật gương ở bất kỳ mặt
 * nào. (Tường của IF là khối hộp kín — mặt quay vào phòng có pháp tuyến riêng hướng vào phòng —
 * nên người đứng trong phòng vẫn đang nhìn MẶT TRƯỚC của mặt đó, không phải nhìn xuyên lưng.)
 *
 * Tam giác suy biến (diện tích 0 ⇒ pháp tuyến 0) rơi về trục Z. KHÔNG sinh `NaN`: một `NaN` lọt
 * vào attribute là cả mesh biến mất khỏi màn hình, im lặng.
 */
export function chieuHopUv(positions: ArrayLike<number>): Float32Array {
  const soDinh = Math.floor(positions.length / 3);
  const uv = new Float32Array(soDinh * 2);
  for (let t = 0; t + 8 < positions.length; t += 9) {
    const ax = positions[t], ay = positions[t + 1], az = positions[t + 2];
    const bx = positions[t + 3], by = positions[t + 4], bz = positions[t + 5];
    const cx = positions[t + 6], cy = positions[t + 7], cz = positions[t + 8];
    // pháp tuyến = (b−a) × (c−a)
    const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
    const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;
    const gx = Math.abs(nx), gy = Math.abs(ny), gz = Math.abs(nz);
    const suyBien = !(gx > 0 || gy > 0 || gz > 0) || !Number.isFinite(gx + gy + gz);
    let truc: TrucTroi = 2;
    if (!suyBien) truc = gx >= gy && gx >= gz ? 0 : gy >= gz ? 1 : 2;
    const duong = suyBien ? true : truc === 0 ? nx > 0 : truc === 1 ? ny > 0 : nz > 0;
    const o = (t / 9) * 6;
    for (let k = 0; k < 3; k++) {
      const px = positions[t + k * 3];
      const py = positions[t + k * 3 + 1];
      const pz = positions[t + k * 3 + 2];
      let u: number;
      let v: number;
      if (truc === 0) {
        // mặt đứng vuông góc X — ngang là Z, dọc là Y
        u = duong ? -pz : pz;
        v = py;
      } else if (truc === 1) {
        // mặt nằm (sàn/trần) — ngang là X, dọc là Z
        u = px;
        v = duong ? -pz : pz;
      } else {
        // mặt đứng vuông góc Z — ngang là X, dọc là Y
        u = duong ? px : -px;
        v = py;
      }
      uv[o + k * 2] = Number.isFinite(u) ? u : 0;
      uv[o + k * 2 + 1] = Number.isFinite(v) ? v : 0;
    }
  }
  return uv;
}
