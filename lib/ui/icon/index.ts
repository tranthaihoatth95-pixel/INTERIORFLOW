/**
 * lib/ui/icon/index.ts — cửa DUY NHẤT của bộ ký hiệu IF.
 * Mặt tiền (thanh điều hướng, thanh công cụ, bảng lệnh) nhập từ đây, KHÔNG nhập thẳng tệp
 * con: một cửa thì đổi hình học bên trong không phải sửa nơi gọi — cùng lối
 * `components/ui/command-icon.tsx` đã đặt cho bảng tra lệnh.
 */
export {
  LUOI, DEM, VUNG_AN_TOAN, NET, NGUONG_NET_XA, BO, DAU_NET, GOC_NOI,
  THANG_CO, HINH_KHOA, dienTich, lechDienTich, netThuc,
} from './he-so';
export type { CoIcon } from './he-so';
export { IfIcon, TEN_ICON, HO_CUA_ICON, NHAN_ICON, coHopLe } from './IfIcon';
export type { TenIcon, HoIcon, IfIconProps } from './IfIcon';
