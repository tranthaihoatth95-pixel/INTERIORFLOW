/**
 * lib/gu/pairwise-perceptron.ts — PAIRWISE PERCEPTRON online (learning-to-rank THẬT, user đã
 * duyệt) cho vòng phản hồi Nhận/Bỏ của Gu Engine (proposal §4 "vòng phản hồi online").
 *
 * BÀI TOÁN: mỗi lần user NHẬN 1 gợi ý và BỎ 1 gợi ý khác (cùng ngữ cảnh) ta có 1 CẶP thứ hạng
 * (accepted ≻ rejected). Học vector trọng số w sao cho score(accepted) > score(rejected) + margin.
 *
 * THIẾT KẾ (ràng buộc phần cứng + nguyên tắc gu):
 *   - Thuần TS, 0 GPU, 0 key, on-device — 1 vector trọng số thưa (Record<string, number>),
 *     update O(số feature khác 0). Mac 16GB không đổ mồ hôi.
 *   - MARGIN UPDATE kiểu perceptron/PA: chỉ update khi score(acc) − score(rej) < margin
 *     → w += η·(acc − rej). η nhỏ (mặc định 0.05) để không giật theo 1 cú click.
 *   - CLAMP trọng số về [−maxWeight, +maxWeight] — chống drift (rủi ro "Feedback online trôi"
 *     trong proposal §6: "clamp η, sàn/trần trọng số").
 *   - DEGRADE: dưới `minPairs` cặp dữ liệu, `rank()` xếp theo HEURISTIC caller đưa vào (điểm
 *     tất định hiện có) — model chỉ được cầm lái khi đủ dữ liệu. Không bao giờ chặn luồng.
 *   - SERIALIZE: JSON thuần (`serialize`/`deserialize`) → nhét được vào localStorage
 *     (helper sẵn) HOẶC IndexedDB (Sprint 2 tự bọc — chuỗi JSON là đủ). Dữ liệu hỏng → model
 *     mới tinh, không ném.
 *   - TẤT ĐỊNH: cùng chuỗi cặp feedback ra cùng trọng số; rank tie-break theo heuristic rồi
 *     thứ tự vào — không random.
 *
 * CHƯA cắm UI feedback ở pha này (Sprint 2): module + API để sẵn. Điểm cắm dự kiến — nút
 * Nhận/Bỏ trên gợi ý template (suggest.ts), gợi ý ảnh reference (ref-search), gợi ý rule.
 */

/* ═══════════════════════ KIỂU ═══════════════════════ */

/** Vector đặc trưng THƯA — key là tên feature ('mood:warm-inviting', 'op:office', 'nImg'…),
 *  value là số thực. Feature vắng mặt = 0. Caller tự quyết từ điển feature. */
export type FeatureVector = Record<string, number>;

export interface PerceptronOptions {
  /** learning-rate η — nhỏ để 1 cú click không lật thuyền. */
  learningRate?: number;
  /** biên an toàn: đòi score(acc) − score(rej) ≥ margin mới coi là "đã tách". */
  margin?: number;
  /** trần |w| mỗi feature (clamp chống drift). */
  maxWeight?: number;
  /** dưới ngưỡng này rank() degrade về heuristic. */
  minPairs?: number;
}

/** Trạng thái serialize được (JSON thuần — localStorage/IndexedDB đều nuốt). */
export interface PerceptronState {
  version: 1;
  weights: Record<string, number>;
  pairsSeen: number;
  updatedAt: number;
}

const DEFAULTS: Required<PerceptronOptions> = {
  learningRate: 0.05,
  margin: 1,
  maxWeight: 5,
  minPairs: 10,
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/* ═══════════════════════ MODEL ═══════════════════════ */

export class PairwisePerceptron {
  private w: Record<string, number> = {};
  private pairs = 0;
  private readonly opt: Required<PerceptronOptions>;

  constructor(opts?: PerceptronOptions) {
    this.opt = { ...DEFAULTS, ...opts };
  }

  /** Số cặp feedback đã học. */
  get pairsSeen(): number {
    return this.pairs;
  }

  /** Model đã đủ dữ liệu để cầm lái rank chưa (ngược lại rank dùng heuristic). */
  ready(): boolean {
    return this.pairs >= this.opt.minPairs;
  }

  /** Điểm tuyến tính w·f (feature vắng = 0). Tất định. */
  score(f: FeatureVector): number {
    let s = 0;
    for (const [k, v] of Object.entries(f)) {
      if (v === 0) continue;
      const wk = this.w[k];
      if (wk) s += wk * v;
    }
    return s;
  }

  /**
   * Học 1 cặp: `accepted` được user NHẬN, `rejected` bị BỎ (cùng ngữ cảnh gợi ý).
   * Margin update: chỉ chỉnh w khi cặp chưa tách đủ margin. Trả true nếu có update.
   * Luôn đếm pairsSeen (kể cả không update — cặp đã đúng cũng là bằng chứng dữ liệu).
   */
  update(accepted: FeatureVector, rejected: FeatureVector): boolean {
    this.pairs += 1;
    const gap = this.score(accepted) - this.score(rejected);
    if (gap >= this.opt.margin) return false; // đã xếp đúng + đủ biên — không đụng w
    const { learningRate: lr, maxWeight } = this.opt;
    const keys = new Set([...Object.keys(accepted), ...Object.keys(rejected)]);
    for (const k of keys) {
      const delta = (accepted[k] ?? 0) - (rejected[k] ?? 0);
      if (delta === 0) continue;
      this.w[k] = clamp((this.w[k] ?? 0) + lr * delta, -maxWeight, maxWeight);
      if (this.w[k] === 0) delete this.w[k]; // giữ vector thưa
    }
    return true;
  }

  /**
   * Xếp hạng danh sách ứng viên (giảm dần theo điểm). ĐỦ dữ liệu → điểm model, tie-break
   * heuristic rồi thứ tự vào; CHƯA đủ (degrade) → thuần heuristic, tie-break thứ tự vào.
   * Không mutate mảng vào. Tất định.
   */
  rank<T>(items: T[], featureOf: (item: T) => FeatureVector, heuristic: (item: T) => number): T[] {
    const useModel = this.ready();
    return items
      .map((item, idx) => ({
        item,
        idx,
        h: heuristic(item),
        s: useModel ? this.score(featureOf(item)) : 0,
      }))
      .sort((a, b) => {
        if (useModel && a.s !== b.s) return b.s - a.s;
        if (a.h !== b.h) return b.h - a.h;
        return a.idx - b.idx; // ổn định — không đảo thứ tự gốc khi hoà
      })
      .map((x) => x.item);
  }

  /* ─────────── serialize / persist ─────────── */

  /** Snapshot trạng thái (copy — mutate sau đó không ảnh hưởng). */
  toState(): PerceptronState {
    return { version: 1, weights: { ...this.w }, pairsSeen: this.pairs, updatedAt: Date.now() };
  }

  serialize(): string {
    return JSON.stringify(this.toState());
  }

  /** Dựng model từ JSON. Dữ liệu hỏng/khác version → model MỚI TINH (không ném — degrade). */
  static deserialize(json: string | null | undefined, opts?: PerceptronOptions): PairwisePerceptron {
    const m = new PairwisePerceptron(opts);
    if (!json) return m;
    try {
      const st = JSON.parse(json) as Partial<PerceptronState>;
      if (st?.version !== 1 || typeof st.weights !== 'object' || !st.weights) return m;
      for (const [k, v] of Object.entries(st.weights)) {
        if (typeof v === 'number' && Number.isFinite(v) && v !== 0) {
          m.w[k] = clamp(v, -m.opt.maxWeight, m.opt.maxWeight);
        }
      }
      m.pairs = Number.isFinite(st.pairsSeen) ? Math.max(0, Math.floor(st.pairsSeen as number)) : 0;
    } catch {
      /* JSON hỏng → model mới — không ném, không chặn */
    }
    return m;
  }

  /** Lưu localStorage (try/catch — storage hỏng thì im lặng, model vẫn sống trong RAM). */
  saveToLocalStorage(key: string): boolean {
    try {
      localStorage.setItem(key, this.serialize());
      return true;
    } catch {
      return false;
    }
  }

  /** Nạp từ localStorage — thiếu/hỏng/không có localStorage → model mới (degrade). */
  static loadFromLocalStorage(key: string, opts?: PerceptronOptions): PairwisePerceptron {
    try {
      return PairwisePerceptron.deserialize(localStorage.getItem(key), opts);
    } catch {
      return new PairwisePerceptron(opts);
    }
  }
}
