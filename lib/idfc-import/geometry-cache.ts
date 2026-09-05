/**
 * lib/idfc-import/geometry-cache.ts — CACHE CÓ TRẦN cho hình học nặng tải theo yêu cầu (Slice 8).
 *
 * Bậc `reference-only` (license-gate) chỉ giữ metadata + thumb; GLB/OBJ nặng tải khi người dùng
 * thật sự mở. Cache này giữ byte trong bộ nhớ theo LRU với TRẦN BYTE + TRẦN SỐ MỤC — một khoản
 * ngân sách hữu hạn khai tường minh, không phải Map lớn dần vô hạn. Byte gốc KHÔNG bị sửa (trả về
 * đúng tham chiếu đã đặt); cache không thay cho kho gốc bất biến — nó chỉ là bộ đệm.
 *
 * THUẦN (Map + đếm byte) — test: geometry-cache.test.ts.
 */

export interface GeometryCacheOptions {
  maxBytes: number;
  maxEntries?: number;
}

export interface GeometryCacheStats {
  entries: number;
  bytes: number;
  maxBytes: number;
  maxEntries: number;
  hits: number;
  misses: number;
  evictions: number;
}

export class BoundedGeometryCache {
  private readonly map = new Map<string, Uint8Array>();
  private bytes = 0;
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  readonly maxBytes: number;
  readonly maxEntries: number;

  constructor(opts: GeometryCacheOptions) {
    if (!Number.isFinite(opts.maxBytes) || opts.maxBytes <= 0) throw new Error('maxBytes phải > 0');
    this.maxBytes = Math.floor(opts.maxBytes);
    this.maxEntries = Math.max(1, Math.floor(opts.maxEntries ?? 64));
  }

  /** Lấy theo khoá; chạm là mục thành "mới dùng nhất". */
  get(key: string): Uint8Array | undefined {
    const v = this.map.get(key);
    if (!v) {
      this.misses += 1;
      return undefined;
    }
    this.hits += 1;
    this.map.delete(key);
    this.map.set(key, v);
    return v;
  }

  has(key: string): boolean {
    return this.map.has(key);
  }

  /**
   * Đặt byte vào cache. Mục LỚN HƠN TRẦN thì KHÔNG nhận (trả false) — không đẩy sạch cache để nhét
   * một mục không bao giờ vừa. Thay mục cùng khoá = trừ byte cũ rồi cộng byte mới.
   */
  set(key: string, bytes: Uint8Array): boolean {
    if (bytes.byteLength > this.maxBytes) return false;
    const old = this.map.get(key);
    if (old) {
      this.map.delete(key);
      this.bytes -= old.byteLength;
    }
    this.map.set(key, bytes);
    this.bytes += bytes.byteLength;
    this.evictUntilFits();
    return true;
  }

  delete(key: string): boolean {
    const old = this.map.get(key);
    if (!old) return false;
    this.map.delete(key);
    this.bytes -= old.byteLength;
    return true;
  }

  clear(): void {
    this.map.clear();
    this.bytes = 0;
  }

  stats(): GeometryCacheStats {
    return {
      entries: this.map.size,
      bytes: this.bytes,
      maxBytes: this.maxBytes,
      maxEntries: this.maxEntries,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
    };
  }

  /** Lấy-hoặc-tải: một hàm tải duy nhất, kết quả đi qua `set` (cùng luật trần). */
  async getOrLoad(key: string, load: () => Promise<Uint8Array>): Promise<Uint8Array> {
    const hit = this.get(key);
    if (hit) return hit;
    const bytes = await load();
    this.set(key, bytes);
    return bytes;
  }

  private evictUntilFits(): void {
    // Map giữ thứ tự chèn ⇒ mục đầu là cũ nhất (get() đã dời mục vừa dùng xuống cuối).
    while (this.map.size > this.maxEntries || this.bytes > this.maxBytes) {
      const oldest = this.map.keys().next();
      if (oldest.done) break;
      const v = this.map.get(oldest.value);
      this.map.delete(oldest.value);
      this.bytes -= v?.byteLength ?? 0;
      this.evictions += 1;
    }
  }
}
