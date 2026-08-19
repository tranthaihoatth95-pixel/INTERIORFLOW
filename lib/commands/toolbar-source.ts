/**
 * lib/commands/toolbar-source.ts — CỬA DUY NHẤT để thanh công cụ đọc sổ lệnh.
 * Bước **B2** của `docs/TICKET-KIEN-TRUC-LENH-3-TANG.md` (phiếu `docs/phieu-giao/P-C-toolbar-doc-so-lenh.md`).
 *
 * ▚ VẤN ĐỀ NÓ GIẢI — đo 16/08, `grep "lib/commands"` trong cả 3 thanh công cụ = **0**:
 * `CadToolbar` tự khai 10 mảng · `ToolDock3D` tự khai 6 nhóm · `present-editor/Toolbar` tự khai
 * danh sách riêng. Cùng một lệnh mang ba cái tên, ba cái phím (Xoay `RO`/`RO`/`Q` · Chép
 * `CO`/`CO`/`D` · Đo `DI`/`DI`/`T` · Chọn `Esc`/`V`). Người dùng học phím ở 2D, sang 3D bấm sai —
 * đó là **chi phí học lại**, đúng cái Hoà gọi là "3 chặng như 3 app · khó dùng".
 *
 * ▚ CÁCH GIẢI — "một cỗ máy, nhiều mặt tiền": KHÔNG viết registry thứ sáu ([Đ2] "nhìn vào trong
 * trước"). File này chỉ là lớp ĐỌC mỏng trên `registry.ts` (B1 đã nâng: `stages` + `icon`), lọc ra
 * tầng ① và trả về một mô tả mà cả ba mặt tiền vẽ được y hệt nhau.
 *
 * ▚ VÌ SAO THUẦN (không React, không lucide):
 *  - test bằng `sucrase-node` như mọi `lib/*` (import TƯƠNG ĐỐI, không alias `@/` — alias chỉ
 *    resolve qua bundler Next.js);
 *  - `icon` giữ nguyên dạng CHUỖI đúng như registry khai; đổi chuỗi → component là việc của
 *    `components/ui/command-icon.tsx`. Nhét lucide vào đây là kéo React vào `lib/`, hết test thuần.
 *
 * ▚ HAI ĐƯỜNG NHẬP — chỗ dễ làm sai nhất, đọc kỹ:
 * 2D và 3D **KHÔNG cùng cơ chế nhập**, không phải cùng cơ chế mà lệch giá trị:
 *   · 2D = **GÕ LỆNH** — `RO` + Enter vào dòng lệnh (khuôn AutoCAD). `lib/shortcuts.ts` KHÔNG có
 *     phím đơn nào cho rotate.
 *   · 3D = **PHÍM ĐƠN** — bấm `Q` là xoay ngay (`lib/render-studio/tool3d.ts:42` `TOOL3D_HOTKEYS`).
 * ⇒ **Cấm "hợp nhất phím" bằng cách chọn một bên thắng.** Sổ lệnh giữ CẢ HAI (`aliases` +
 * `directKey`); **chặng** quyết định bật đường nào — vì đường nhập là năng lực của MẶT TIỀN
 * (có dòng lệnh không? có bộ bắt phím đơn không?), không phải thuộc tính của LỆNH.
 * Đó là lý do `inputPathsFor()` nhận `stage` chứ không nhận `CommandDef`.
 */

import type { CommandDef, Stage, WhenCtx } from './registry';
import { COMMANDS } from './registry';
import type { ThaoTacKey } from '../ui/thao-tac-glyph';

/* ─────────────────────────── tầng ① — lệnh chung ─────────────────────────── */

/** Một lệnh chung đã "dọn sẵn" cho mặt tiền vẽ. Mọi trường ở đây đến TỪ registry, không mặt tiền
 * nào được tự chế thêm — đó là toàn bộ điểm của B2. */
export interface CommonCommand {
  id: string;
  /** [vi, en] — mặt tiền tự chọn theo ngôn ngữ giao diện, KHÔNG dịch lại. */
  label: [string, string];
  /** Tên icon lucide dạng chuỗi; đổi ra component ở `components/ui/command-icon.tsx`. */
  icon: string;
  /** Alias GÕ (khuôn AutoCAD) — luôn có, kể cả ở chặng chưa bật đường gõ. */
  aliases: string[];
  /** Phím ĐƠN (khuôn 3D) — `undefined` khi hôm nay chưa có phím thật; KHÔNG bịa. */
  directKey?: string;
  /** Phím tắt toàn cục (`['mod','Z']`…) nếu có. */
  key?: string[];
  /** R3 — câu giải nghĩa [vi, en] từ sổ; mặt tiền tự chọn theo ngôn ngữ, KHÔNG tự chế câu khác. */
  desc?: [string, string];
  /** R3 — khoá hình minh hoạ thao tác (kho `lib/ui/thao-tac-glyph.tsx`); đổi khoá → component ở
   * `components/ui/command-icon.tsx` (`commandHinh`), cùng đường với `icon`. */
  hinh?: ThaoTacKey;
  /** Chạy được ở chặng này không — đúng `when(ctx)` của registry, KHÔNG tự suy lại. */
  enabled: boolean;
  /** BẮT BUỘC khi `enabled=false` (§9 cấm nút giả): vì sao lệnh này chưa chạy được ở đây. */
  disabledReason?: string;
  run: () => void;
}

/**
 * Vì sao một lệnh chung MỜ ở chặng này — câu chữ cho NGƯỜI DÙNG đọc, không phải log kỹ thuật.
 *
 * Nguồn: chính các chú thích B1 đã ghi tại từng dòng lệnh trong `registry.ts` (mỗi lệnh chung có
 * một đoạn "MỜ ở 'render'/'present': …" giải thích bằng code thật). Ở đây dịch sang lời người
 * dùng theo `docs/SPEC-NGON-NGU-CHI-DAN.md`: **hành động/hiện trạng trước · ≤12 từ · cấm jargon
 * nội bộ** (không lộ chữ "store", "useCadStore", "when", "registry" ra giao diện).
 *
 * Tra theo `id + stage`; không có mục khớp thì rơi về câu chung — thà một câu chung thật thà còn
 * hơn để trống, vì `ToolbarChip` cảnh báo khi `disabled` mà thiếu lý do.
 */
const LY_DO_MO: Record<string, Partial<Record<Stage, [string, string]>>> = {
  'cad.sel.select': {
    render: ['Khung nhìn 3D có công cụ chọn riêng — dùng phím V', 'The 3D viewport has its own Select — press V'],
    present: ['Chưa nối công cụ chọn cho trang trình chiếu', 'Select is not wired to slides yet'],
  },
  'cad.sel.delete': {
    render: ['Xoá chưa đọc được khối đang chọn trong khung nhìn 3D', 'Delete cannot read the 3D selection yet'],
    present: ['Chưa nối lệnh xoá cho trang trình chiếu', 'Delete is not wired to slides yet'],
  },
  'cad.sel.undo': { present: ['Trang trình chiếu có lịch sử riêng, chưa nối', 'Slides keep their own history, not wired yet'] },
  'cad.sel.redo': { present: ['Trang trình chiếu có lịch sử riêng, chưa nối', 'Slides keep their own history, not wired yet'] },
  'cad.edit.move': {
    render: ['Khung nhìn 3D dời khối bằng công cụ riêng — dùng phím M', 'The 3D viewport moves blocks with its own tool — press M'],
    present: ['Chưa nối lệnh dời cho trang trình chiếu', 'Move is not wired to slides yet'],
  },
  'cad.edit.copy': {
    render: ['Khung nhìn 3D nhân bản bằng công cụ riêng — dùng phím D', 'The 3D viewport duplicates with its own tool — press D'],
    present: ['Chưa nối lệnh chép cho trang trình chiếu', 'Copy is not wired to slides yet'],
  },
  'cad.edit.rotate': {
    render: ['Khung nhìn 3D xoay bằng công cụ riêng — dùng phím Q', 'The 3D viewport rotates with its own tool — press Q'],
    present: ['Chưa nối lệnh xoay cho trang trình chiếu', 'Rotate is not wired to slides yet'],
  },
  'cad.edit.mirror': {
    render: ['Chưa có lệnh đối xứng cho khối 3D', 'No mirror command for 3D blocks yet'],
    present: ['Chưa nối lệnh lật cho trang trình chiếu', 'Flip is not wired to slides yet'],
  },
  'cad.dim.measure': {
    render: ['Khung nhìn 3D đo bằng thước riêng — dùng phím T', 'The 3D viewport measures with its own ruler — press T'],
    present: ['Chưa có thước đo trên trang trình chiếu', 'No ruler on slides yet'],
  },
  'cad.draw.text': {
    render: ['Chưa đặt được chữ trong khung nhìn 3D', 'Cannot place text in the 3D viewport yet'],
    present: ['Chưa nối công cụ chữ cho trang trình chiếu', 'The text tool is not wired to slides yet'],
  },
};

const LY_DO_CHUNG: [string, string] = ['Chặng này chưa dùng được lệnh đó', 'This command is not available in this stage yet'];

/** Lệnh chung = lệnh khai đủ CẢ BA chặng trong `stages`. Tiêu chí "hành vi giống nhau ở cả 3
 * chặng" (ticket §2 tầng ①) đã được B1 mã hoá thành chính `stages`, nên ở đây KHÔNG khai lại
 * danh sách id — khai lại là đẻ nguồn thứ hai, đúng bệnh B2 sinh ra để chữa. */
export function isCommonCommand(c: CommandDef): boolean {
  const s = c.stages;
  return !!s && s.length === 3 && s.includes('cad') && s.includes('render') && s.includes('present');
}

/**
 * Tầng ① cho một chặng — **cùng thứ tự, cùng icon, cùng nhãn ở cả ba mặt tiền**.
 *
 * Thứ tự lấy nguyên thứ tự khai trong `COMMANDS` (đã có ý nghĩa: nhóm chọn → sửa → đo → chữ), nên
 * ba chặng không thể xếp khác nhau kể cả khi ai đó thêm lệnh mới — muốn đổi thứ tự thì đổi ở sổ.
 *
 * Lệnh KHÔNG chạy được ở chặng này thì **vẫn trả về, `enabled=false` kèm lý do** — không lọc bỏ.
 * Lọc bỏ là giấu, và giấu thì mỗi chặng lại hiện một bộ nút khác nhau = đẻ lại đúng cái bệnh cũ
 * (ticket §2 tầng ①: "chặng nào chưa có engine thì hiện MỜ KÈM LÝ DO THẬT, KHÔNG giấu đi").
 */
export function commonCommandsFor(ctx: WhenCtx): CommonCommand[] {
  const stage = ctx.stage as Stage;
  return COMMANDS.filter(isCommonCommand).map((c) => {
    const enabled = c.when(ctx);
    const reason = LY_DO_MO[c.id]?.[stage] ?? LY_DO_CHUNG;
    return {
      id: c.id,
      label: c.label,
      // `isCommonCommand` chỉ đúng cho 10 lệnh B1 đã điền `icon`; `??` là lưới an toàn cho lệnh
      // chung THÊM VỀ SAU mà quên icon — hiện dấu hỏi còn hơn vỡ render.
      icon: c.icon ?? 'HelpCircle',
      aliases: c.aliases,
      directKey: c.directKey,
      key: c.key,
      desc: c.desc,
      hinh: c.hinh,
      enabled,
      disabledReason: enabled ? undefined : reason[0],
      run: () => c.run(),
    };
  });
}

/* ─────────────────────────── nối tay thi hành của chặng ─────────────────────────── */

/**
 * Một chặng nối tay thi hành của mình vào lệnh chung.
 *
 * ⚠️ VÌ SAO CẦN, đừng bỏ đi tưởng thừa: `CommandDef.run()` của B1 gọi `useCadStore` — ĐÚNG ở 2D,
 * SAI ở 3D (khối đang chọn nằm ở `useTool3D`, một store khác) và ở Trình chiếu (state cục bộ
 * trong `useEditor()`). B1 đã cố ý để `when` chặn thay vì để `run()` chạy sai — nút giả còn tệ
 * hơn nút mờ (§9).
 *
 * B2 vì thế tách đôi rất rõ:
 *   · **DANH SÁCH** (lệnh nào · tên gì · icon gì · phím gì · xếp thứ tự nào) — **từ sổ lệnh**,
 *     ba chặng không thể khác nhau. Đây là phần B2 dứt điểm.
 *   · **TAY THI HÀNH** (`run`) — tạm thời vẫn của chặng, cho tới **B5** (`runFor` theo ngữ cảnh).
 *
 * Trộn hai thứ đó làm một chính là lý do trước nay mỗi thanh phải tự khai cả danh sách.
 */
export interface StageBinding {
  run: () => void;
  /** Lệnh này đang bật (tool đang cầm) — mặt tiền tự biết, sổ lệnh không giữ trạng thái. */
  active?: boolean;
  /**
   * Chặng CÓ engine nhưng LÚC NÀY chưa bấm được, kèm lý do — vd "Hoàn tác" khi lịch sử trống,
   * "Xoá" khi chưa chọn gì. Khác hẳn lý do mờ của sổ lệnh (`LY_DO_MO`): kia là *chặng này chưa
   * làm được lệnh đó bao giờ*, đây là *làm được, nhưng ngay bây giờ thì không*.
   * Phân biệt hai loại mờ là cần: loại đầu là NỢ TÍNH NĂNG, loại sau là trạng thái bình thường.
   */
  unavailableReason?: string;
}

/**
 * Đắp tay thi hành của chặng lên danh sách lấy từ sổ.
 *
 * · Có binding ⇒ chặng tự chạy được ⇒ `enabled=true`, dùng `run` của chặng, xoá lý do mờ.
 * · Không binding ⇒ giữ nguyên kết quả sổ lệnh (`when` + lý do mờ). KHÔNG loại khỏi danh sách —
 *   nút vẫn đứng đúng chỗ, mờ đi, nói rõ vì sao. Đó là điều kiện để ba thanh trông như một.
 *
 * Thuần: không đọc store, không đụng DOM ⇒ test được thẳng.
 */
export function bindStage(
  cmds: CommonCommand[],
  bindings: Record<string, StageBinding | undefined>,
): (CommonCommand & { active: boolean })[] {
  return cmds.map((c) => {
    const b = bindings[c.id];
    if (!b) return { ...c, active: false };
    if (b.unavailableReason) {
      return { ...c, enabled: false, disabledReason: b.unavailableReason, run: b.run, active: !!b.active };
    }
    return { ...c, enabled: true, disabledReason: undefined, run: b.run, active: !!b.active };
  });
}

/* ─────────────────────────── hai đường nhập ─────────────────────────── */

export type InputPath = 'typed' | 'directKey';

/**
 * Chặng này nhận lệnh bằng đường nào — **thuộc tính của MẶT TIỀN, không phải của lệnh**.
 *
 * Đo code thật 16/08, không suy đoán:
 *  · `'cad'`    → có dòng lệnh gõ tay (`CadEditor` status-bar + `findByAlias`) ⇒ `'typed'`.
 *                 KHÔNG có `'directKey'`: bật lên là phím đơn **cướp ký tự đang gõ** — bấm `R`
 *                 để xoay thì không gõ nổi `REC`. Đây là cạm bẫy ticket §1 nêu đích danh.
 *  · `'render'` → có bộ bắt phím đơn (`tool3dKeyTransition`) ⇒ `'directKey'`. Chưa có dòng lệnh.
 *  · `'present'`→ **chưa có đường nào**. Trả mảng rỗng là nói thật; bịa ra một đường ở đây thì
 *                 mặt tiền sẽ hiện phím tắt không bấm được — nút giả bằng bàn phím (§9).
 */
export function inputPathsFor(stage: Stage): InputPath[] {
  if (stage === 'cad') return ['typed'];
  if (stage === 'render') return ['directKey'];
  return [];
}

/** Ngữ cảnh một lần bấm phím — thuần dữ liệu để test được không cần DOM. */
export interface DirectKeyCtx {
  stage: Stage;
  /** Con trỏ đang nằm trong ô nhập chữ (input/textarea/select/contentEditable). */
  inTextField: boolean;
  /** Dòng lệnh đang có chữ dở. Chuỗi rỗng = không gõ gì. */
  commandLineBuffer: string;
  /** Có giữ ⌘/Ctrl/Alt/Shift không — tổ hợp là địa hạt của `key`, không phải phím đơn. */
  hasModifier: boolean;
}

/**
 * Có được để phím đơn ăn cú bấm này không.
 *
 * Đây là **mở rộng luật "keydown né ô nhập" sang cả DÒNG LỆNH** mà ticket §1 đòi làm TRƯỚC khi
 * gán phím đơn. Luật cũ (`ToolDock3D.tsx:77`) chỉ né khi ô nhập đang GIỮ FOCUS — chưa đủ: dòng
 * lệnh 2D nhận **gõ-đuổi** (người dùng gõ thẳng vào canvas, chữ chạy vào dòng lệnh mà ô đó không
 * hề focus). Nếu chỉ kiểm focus thì `R` vẫn cướp mất chữ đầu của `REC`.
 *
 * Bốn cửa, thứ tự rẻ-trước: tổ hợp phím → ô nhập → dòng lệnh đang dở → chặng có bật đường này.
 * Cách AutoCAD giải cũng đúng cửa thứ ba: đang gõ ở dòng lệnh thì phím đơn không ăn.
 */
export function shouldDirectKeyFire(ctx: DirectKeyCtx): boolean {
  if (ctx.hasModifier) return false;
  if (ctx.inTextField) return false;
  if (ctx.commandLineBuffer.length > 0) return false;
  return inputPathsFor(ctx.stage).includes('directKey');
}

/**
 * Phím đơn này Ở CHẶNG NÀY nghĩa là lệnh gì — **tra NGHĨA, không phải cấp quyền chạy**.
 *
 * ⚠️ CỐ Ý KHÔNG lọc qua `when(ctx)`, khác `findByAlias()`. Lý do: `when` trả lời câu
 * *"`CommandDef.run()` (đi qua `useCadStore`) có làm đúng việc ở chặng này không"* — ở 3D câu trả
 * lời là KHÔNG, vì engine 3D nằm ở `useTool3D`. Nếu lọc theo `when` thì hàm này luôn trả rỗng ở
 * đúng cái chặng duy nhất có phím đơn — vô dụng.
 * ⇒ Ở đây chỉ lọc theo `stages` (lệnh có SỐNG ở chặng này không). Nơi gọi nhận về **danh tính**
 * lệnh rồi tự dispatch bằng tay thi hành của mình (`bindStage`) — đúng ranh giới B2/B5.
 *
 * So KHÔNG phân biệt hoa/thường (`TOOL3D_HOTKEYS` khai chữ thường, dock in hoa).
 */
export function findByDirectKey(rawKey: string, ctx: WhenCtx): CommandDef | undefined {
  const stage = ctx.stage as Stage;
  if (!inputPathsFor(stage).includes('directKey')) return undefined;
  const k = rawKey.trim().toLowerCase();
  if (!k) return undefined;
  return COMMANDS.find((c) => c.directKey?.toLowerCase() === k && (c.stages ?? ['cad']).includes(stage));
}
