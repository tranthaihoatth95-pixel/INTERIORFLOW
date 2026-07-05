/**
 * Provider adapter: SD-portable (engine 'sd' của oneAI). CHỈ import phía server.
 * Cùng interface submitJob/jobStatus với fal.ts / comfyui.ts để dispatcher gọi thống nhất.
 *
 * - runtime 'server': gọi SD server cạnh máy (Draw Things / ComfyUI / A1111) qua `SD_SERVER_URL`.
 * - runtime 'webgpu': chạy client-side trong trình duyệt (registry mock cho tới khi có bản
 *   WebGPU thật) — đường này KHÔNG đi qua đây.
 *
 * SCAFFOLDING (05/07): chưa nối inference thật. Khi chưa set SD_SERVER_URL, `sdConfigured()`
 * = false → `providerReady` phía registry trả false → node tự chạy mock (không lỗi). Các hàm
 * submit/status dưới là chốt an toàn nếu vô tình được gọi khi chưa cấu hình.
 */
export function sdConfigured() {
  return Boolean(process.env.SD_SERVER_URL);
}

const NOT_WIRED =
  'SD-portable server chưa nối (SD_SERVER_URL). Trỏ tới Draw Things/ComfyUI/A1111 cạnh máy, ' +
  'hoặc dùng runtime WebGPU (đang phát triển).';

export async function submitJob(_model: string, _input: Record<string, unknown>): Promise<string> {
  throw new Error(NOT_WIRED);
}

export async function jobStatus(_model: string, _requestId: string): Promise<never> {
  throw new Error(NOT_WIRED);
}
