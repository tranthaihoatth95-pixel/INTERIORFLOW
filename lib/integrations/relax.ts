/**
 * lib/integrations/relax.ts — CỬA THƯ GIÃN (Spotify · YouTube · Apple Music). Nhóm `thu-gian`:
 * KHÔNG là đầu vào của sự thật dự án, KHÔNG bắt buộc cho thiết kế — cùng hình dạng kết quả với lịch
 * để UI một khuôn, nhưng route riêng và bảng năng lực riêng để không ai vô tình nối vào bối cảnh.
 */
import { getProvider } from './registry';
import { getGrantedScope } from './oauth-core';
import { NHOM_PROVIDER, SCOPE_NANG_LUC } from './capabilities';
import { scopeThieu } from './scopes';
import { ketQuaLoi, ketQuaOk, phanLoaiLoi, type KetQuaTichHop } from './ket-qua';

export type RelaxData =
  | { kind: 'now-playing'; track: string; artist: string; isPlaying: boolean }
  | { kind: 'idle' }
  | { kind: 'videos'; items: { videoId: string; title: string; thumb: string; embedUrl: string }[] };

export async function docThuGian(userId: string, providerId: string, q?: string): Promise<KetQuaTichHop<RelaxData> | null> {
  const cfg = getProvider(providerId);
  if (!cfg || NHOM_PROVIDER[cfg.id] !== 'thu-gian') return null;
  const p = cfg.id;
  if (!cfg.configured()) return ketQuaLoi(p, 'chua-cau-hinh', { thongDiep: `${cfg.label} chưa cấu hình khoá trên máy chủ.` });
  try {
    if (p === 'spotify') {
      const scope = await getGrantedScope(userId, p).catch(() => null);
      if (scope === null) return ketQuaLoi(p, 'chua-ket-noi', { ketNoiUrl: `/api/integrations/${p}/connect` });
      const thieu = scopeThieu(scope, SCOPE_NANG_LUC.spotify?.['phat-nhac'] ?? []);
      if (thieu.length) return ketQuaLoi(p, 'thieu-scope', { thieuScope: thieu, ketNoiUrl: `/api/integrations/${p}/connect` });
      const { nowPlaying } = await import('./providers/spotify');
      const np = await nowPlaying(userId);
      return ketQuaOk<RelaxData>(p, np ? { kind: 'now-playing', ...np } : { kind: 'idle' });
    }
    if (p === 'youtube') {
      const query = (q ?? '').trim();
      if (!query) return ketQuaLoi(p, 'loi', { thongDiep: 'Thiếu từ khoá tìm (q).' });
      const { searchVideos } = await import('./providers/youtube');
      return ketQuaOk<RelaxData>(p, { kind: 'videos', items: await searchVideos(query.slice(0, 120)) });
    }
    // applemusic: STUB tier 3 — developerToken() ném lỗi hướng dẫn, đi qua phanLoaiLoi thành 'loi' có thông điệp.
    const { developerToken } = await import('./providers/applemusic');
    developerToken();
    return ketQuaLoi(p, 'loi', { thongDiep: 'Apple Music: chưa có đường phát.' });
  } catch (e) {
    return phanLoaiLoi<RelaxData>(p, e);
  }
}
