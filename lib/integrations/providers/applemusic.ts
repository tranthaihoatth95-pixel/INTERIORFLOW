/**
 * Apple Music — STUB (Tier 3). Cần Apple Developer + MusicKit + Developer Token là JWT ES256
 * ký bằng private key .p8 (APPLE_MUSIC_PRIVATE_KEY + TEAM_ID + KEY_ID). Playback CHỈ trong
 * MusicKit SDK (JS/native) — không có server playback API. Chưa dựng flow; báo rõ khi chưa cấu hình.
 * Doc lấy .p8/team id/key id: docs/INTEGRATIONS.md.
 */
export function appleMusicConfigured(): boolean {
  return !!(
    process.env.APPLE_MUSIC_TEAM_ID &&
    process.env.APPLE_MUSIC_KEY_ID &&
    process.env.APPLE_MUSIC_PRIVATE_KEY
  );
}

/** Sinh Developer Token (JWT ES256). Chưa triển khai ký — trả lỗi hướng dẫn. */
export function developerToken(): string {
  if (!appleMusicConfigured()) {
    throw new Error('Apple Music chưa cấu hình (APPLE_MUSIC_TEAM_ID/KEY_ID/PRIVATE_KEY). Xem docs/INTEGRATIONS.md.');
  }
  throw new Error('Apple Music: ký Developer Token (ES256 .p8) chưa triển khai — hạng mục MusicKit riêng.');
}
