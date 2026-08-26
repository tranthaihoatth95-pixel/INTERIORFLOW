/**
 * lib/cad/sha256.ts — MỘT hàm băm cho cả repo, không hai.
 *
 * Trước tệp này, `sha256Hex` nằm riêng tư trong `lib/cad/ifpack.ts`. `.idfc` cần đúng hàm đó, và
 * đường dễ nhất là chép sang — đúng cái bẫy mà luật 6 cấm ("đẻ khuôn thứ hai là bắt đầu phân kỳ").
 * Hai hàm băm cùng tên, một hôm một cái đổi chuẩn hoá, và hash của `.ifpack` với `.idfc` nói hai
 * chuyện khác nhau về cùng một mảng byte — kiểu hỏng chỉ lộ ra khi đã có dữ liệu thật.
 *
 * Nên: tách ra ĐÂY, `ifpack.ts` import từ đây, `.idfc` cũng import từ đây. Không ai chép.
 *
 * `crypto.subtle` có ở cả trình duyệt và Node ≥ 15 (`globalThis.crypto`) ⇒ chạy được ở mọi phía.
 * Không import `node:crypto` để giữ tệp này thuần, dùng được trong bundle trình duyệt.
 */

export async function sha256Hex(data: ArrayBuffer | Uint8Array): Promise<string> {
  const buf = data instanceof Uint8Array ? (data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer) : data;
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Băm một chuỗi UTF-8. */
export async function sha256Text(s: string): Promise<string> {
  return sha256Hex(new TextEncoder().encode(s));
}
