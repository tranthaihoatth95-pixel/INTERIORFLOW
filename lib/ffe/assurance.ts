/**
 * lib/ffe/assurance.ts — độ đảm bảo của MỘT MÓN RỜI, đọc theo thang chung `lib/distill/assurance`.
 *
 * Món rời mang hai tín hiệu đã có sẵn: `confidence` (số đo tin tới đâu) + `source` (món từ đâu
 * ra). Danh mục (`ProductSpec.verified`) là tín hiệu thứ ba, caller tra và đưa vào — file này
 * THUẦN, không fetch. Mọi luật ánh xạ nằm ở `fromFfeConfidence` (một chỗ), đây chỉ là mặt tiền
 * cho hồ sơ FF&E/BOQ hỏi "dòng này cộng tiền được không".
 */
import type { FfeItem } from './item';
import { fromFfeConfidence, isVerifiedQuantity, type AssuranceGrade } from '../distill/assurance';

/** Danh mục đã duyệt theo `specId` — caller nạp từ `/api/specs` (`verified` của ProductSpec). */
export type SpecVerifiedMap = Readonly<Record<string, boolean>>;

export function ffeAssurance(
  item: Pick<FfeItem, 'confidence' | 'source' | 'specId'>,
  specVerified: SpecVerifiedMap = {},
): AssuranceGrade {
  const catalogVerified = item.specId ? specVerified[item.specId] === true : false;
  return fromFfeConfidence(item.confidence, item.source, catalogVerified);
}

/** Dòng này được cộng vào tổng ĐÃ ĐẢM BẢO không (luật Hoà 15/08: BOQ chỉ nhận số đo được). */
export function ffeIsVerified(item: Pick<FfeItem, 'confidence' | 'source' | 'specId'>, specVerified?: SpecVerifiedMap): boolean {
  return isVerifiedQuantity(ffeAssurance(item, specVerified));
}
