/**
 * lib/home/search-store.ts — trạng thái CHIA SẺ cho ô tìm dự án ở Home
 * (phiếu P-V 17/08, mục ④.1 "Tách ô search thành component riêng").
 *
 * Ô tìm sống ở AppChrome top bar (nhìn cạnh Vitals) nhưng KẾT QUẢ hiện trong
 * ProjectSelect (mount bên trong bento Home). Trước đây `query`/`setQuery` là
 * state cục bộ của ProjectSelect — nay tách VIEW ra ngoài mà giữ nguyên
 * LOGIC filter thì cần một chỗ chung để ô search và ProjectSelect cùng đọc/ghi.
 *
 * Chọn zustand (đã dùng trong `lib/store.ts`) thay vì URL param: tránh navigation
 * mỗi keystroke; tránh Context provider bao ngoài AppShell riêng cho Home.
 * v1 KHÔNG persist — search là trạng thái phiên, giữ nguyên hành vi cũ (query
 * chỉ sống trong đời của trang, F5 mất). Nếu sau này cần deep-link `?q=…` thì
 * thêm effect đồng bộ với `useSearchParams` — không đụng chỗ đọc.
 */

import { create } from 'zustand';

type HomeSearchState = {
  query: string;
  setQuery: (q: string) => void;
  clear: () => void;
};

export const useHomeSearch = create<HomeSearchState>((set) => ({
  query: '',
  setQuery: (q) => set({ query: q }),
  clear: () => set({ query: '' }),
}));
