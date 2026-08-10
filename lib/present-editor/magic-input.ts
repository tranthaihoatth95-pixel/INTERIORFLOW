/** Chuẩn hoá đầu vào Magic: không có nội dung vẫn tạo một hồ sơ nháp có nhãn rõ ràng. */
export function magicBodyText(bodyText: string, hasImages: boolean): {
  bodyText: string;
  usesDraftCopy: boolean;
} {
  const supplied = bodyText.trim();
  if (supplied) return { bodyText: supplied, usesDraftCopy: false };

  return {
    usesDraftCopy: true,
    bodyText: `# Hồ sơ đề xuất thiết kế
Nội dung mẫu — cần chỉnh theo dự án
${hasImages ? 'Hình ảnh đã cung cấp sẽ được phân bổ vào hồ sơ.' : 'Vị trí hình ảnh được để sẵn và có thể thay sau.'}

## Bối cảnh và mục tiêu
- Nội dung mẫu — bổ sung nhu cầu, phạm vi và mục tiêu của dự án
- Xác nhận đối tượng sử dụng và tiêu chí thành công

## Ý tưởng thiết kế
- Nội dung mẫu — mô tả concept chủ đạo
- Ngôn ngữ không gian, cảm xúc và trải nghiệm mong muốn

## Tổ chức không gian
- Nội dung mẫu — bổ sung sơ đồ công năng và luồng di chuyển
- Ghi chú vị trí cần mặt bằng hoặc hình minh hoạ

## Vật liệu và màu sắc
- Nội dung mẫu — bổ sung vật liệu chính, màu và bề mặt
- Ghi chú vị trí cần ảnh vật liệu

## Ánh sáng và điểm nhấn
- Nội dung mẫu — bổ sung chiến lược ánh sáng và chi tiết đặc trưng

## Bước tiếp theo
- Xác nhận phương án
- Hoàn thiện nội dung và hình ảnh
- Chuẩn bị hồ sơ triển khai`,
  };
}
