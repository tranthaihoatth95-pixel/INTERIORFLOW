/**
 * YouTube — KHUNG. Data API v3 (API key, quota-limited) để tìm video tham khảo/tutorial
 * rồi NHÚNG (iframe) vào Reference/Present. ⚠ quota mặc định 10k đơn vị/ngày → cần cache.
 * Playback = iframe embed (không tải nội dung — tuân ToS).
 */
export function youtubeConfigured(): boolean {
  return !!process.env.YOUTUBE_API_KEY;
}

export async function searchVideos(query: string, max = 6) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error('YOUTUBE_API_KEY chưa cấu hình.');
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', String(max));
  url.searchParams.set('q', query);
  url.searchParams.set('key', key);
  const res = await fetch(url);
  if (res.status === 403) throw new Error('YouTube quota/permission (403) — thử lại sau hoặc kiểm key.');
  if (!res.ok) throw new Error(`YouTube ${res.status}`);
  const d = await res.json();
  return (d.items ?? []).map((it: { id: { videoId: string }; snippet: { title: string; thumbnails?: { medium?: { url: string } } } }) => ({
    videoId: it.id.videoId,
    title: it.snippet.title,
    thumb: it.snippet.thumbnails?.medium?.url ?? '',
    embedUrl: `https://www.youtube.com/embed/${it.id.videoId}`,
  }));
}
