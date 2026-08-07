/**
 * lib/review/luat/deck.ts — CẮM bộ luật chặng Trình chiếu vào khung review. KHÔNG chép luật:
 * `DECK_STANDARDS` + `evaluateDeck()` (lib/present-editor/layout-check.ts — file đó thuộc vùng
 * p12, ở đây CHỈ IMPORT, không sửa) là kho duy nhất; đây là adapter `LayoutWarning` → `FindingLuat`.
 *
 * Mức: mọi cảnh báo layout deck là 'vang' — DECK_STANDARDS là ngưỡng thẩm mỹ ĐO ĐƯỢC (lưới/
 * margin/whitespace, CHOT-TACH-AI §5④ "ngưỡng đo được, không cảm tính") chứ không phải quy
 * chuẩn pháp lý; không có bậc 'do' vì không có điều khoản bắt buộc nào để dẫn — nhưng vẫn là
 * LỚP LUẬT (tất định, chạy 10 lần giống nhau), KHÔNG phải góp ý AI.
 */

import type { EditorSlide } from '../../present-editor/model';
import { evaluateDeck } from '../../present-editor/layout-check';
import type { FindingLuat } from '../types';

export function luatDeck(slides: EditorSlide[]): FindingLuat[] {
  const out: FindingLuat[] = [];
  for (const { slide, report } of evaluateDeck(slides)) {
    for (const w of report.warnings) {
      out.push({
        lop: 'luat',
        muc: 'vang',
        nguon: `DECK_STANDARDS.${w.metric}`,
        ruleId: `deck-${w.metric}-${w.level}`,
        moTa: w.message,
        viTri: { slide },
      });
    }
  }
  return out;
}
