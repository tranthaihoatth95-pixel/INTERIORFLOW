/**
 * lib/auth/collab-store.ts — KHO CỘNG TÁC THEO DỰ ÁN (server): góp ý ghim · hàng đợi duyệt ·
 * sổ lời mời (thu hồi) · sổ op đã áp (idempotency).
 *
 * ── CURRENT / TARGET / GAP (B25, nói thẳng) ─────────────────────────────────────────────────
 * CURRENT: một tệp JSON / dự án tại `uploads/collab/<projectId>.json` (cùng gốc `./uploads` mà
 *          `project-files` đã dùng, đã nằm trong .gitignore — không tạo đường lưu thứ hai).
 *          Ghi nguyên tử (tmp + rename), tuần tự hoá theo dự án bằng chuỗi promise trong
 *          process. XUYÊN THIẾT BỊ vì nằm ở server, KHÔNG phải localStorage.
 * TARGET:  bảng Prisma `ProjectComment` / `ApprovalRequest` / `ProjectInvite` — schema là human
 *          gate (phiếu này bị cấm migrate). Mọi caller đi qua interface bên dưới; đổi sang
 *          Prisma = thay MỘT tệp này, route không đổi.
 * GAP:     nhiều process (cluster) không khoá chéo — bản nội bộ/LAN chạy 1 process, khai thật.
 *
 * IDEMPOTENCY: mọi mutation nhận `opId` (client sinh, gắn danh tính). `applyOp` trả lại kết quả
 * cũ nếu opId đã áp — client gửi lại sau mất mạng KHÔNG nhân bản góp ý/duyệt. Sổ op giữ 500
 * mục gần nhất / dự án.
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface CommentAnchor {
  route?: string;
  stage?: string;
  x?: number;
  y?: number;
  entityId?: string;
  slide?: number;
  /** góp ý thuộc một yêu cầu duyệt (review-gate: note gom thành checklist) */
  approvalId?: string;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  authorId: string;
  authorName: string;
  text: string;
  anchor: CommentAnchor;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  opId: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'changes' | 'rejected' | 'withdrawn';

export interface ApprovalRequest {
  id: string;
  projectId: string;
  title: string;
  stage?: string;
  entityId?: string;
  note?: string;
  requesterId: string;
  requesterName: string;
  status: ApprovalStatus;
  decidedBy?: string;
  decidedByName?: string;
  decidedAt?: string;
  decisionNote?: string;
  createdAt: string;
  updatedAt: string;
  opId: string;
}

export interface InviteRecord {
  jti: string;
  role: string;
  inviterId: string;
  inviterName: string;
  createdAt: string;
  /** ISO */
  expiresAt: string;
  revokedAt?: string;
  revokedBy?: string;
  acceptedBy?: string;
  acceptedAt?: string;
}

export interface CollabFile {
  v: 1;
  projectId: string;
  rev: number;
  comments: ProjectComment[];
  approvals: ApprovalRequest[];
  invites: InviteRecord[];
  appliedOps: Record<string, { at: string; result: unknown }>;
}

const MAX_OPS = 500;

export function emptyCollab(projectId: string): CollabFile {
  return { v: 1, projectId, rev: 0, comments: [], approvals: [], invites: [], appliedOps: {} };
}

export function collabRoot(): string {
  return process.env.IF_COLLAB_DIR || path.join(process.cwd(), 'uploads', 'collab');
}

/** projectId là cuid (chữ+số). Chặn mọi ký tự đường dẫn để không thoát thư mục. */
export function safeProjectId(projectId: string): string {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(projectId)) throw new Error('[collab] projectId không hợp lệ.');
  return projectId;
}

function fileOf(projectId: string): string {
  return path.join(collabRoot(), `${safeProjectId(projectId)}.json`);
}

export async function readCollab(projectId: string): Promise<CollabFile> {
  const target = fileOf(projectId); // ném NGOÀI try — projectId lạ không được nuốt thành "kho rỗng"
  try {
    const raw = await fs.readFile(target, 'utf8');
    const parsed = JSON.parse(raw) as Partial<CollabFile>;
    if (parsed && parsed.v === 1 && parsed.projectId === projectId) {
      return {
        v: 1,
        projectId,
        rev: typeof parsed.rev === 'number' ? parsed.rev : 0,
        comments: Array.isArray(parsed.comments) ? parsed.comments : [],
        approvals: Array.isArray(parsed.approvals) ? parsed.approvals : [],
        invites: Array.isArray(parsed.invites) ? parsed.invites : [],
        appliedOps: parsed.appliedOps && typeof parsed.appliedOps === 'object' ? parsed.appliedOps : {},
      };
    }
    return emptyCollab(projectId);
  } catch {
    return emptyCollab(projectId);
  }
}

async function writeCollab(file: CollabFile): Promise<void> {
  const target = fileOf(file.projectId);
  await fs.mkdir(path.dirname(target), { recursive: true });
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(file, null, 2), 'utf8');
  await fs.rename(tmp, target);
}

// Tuần tự hoá theo dự án: hai request cùng dự án không được đọc-sửa-ghi chồng nhau.
const chains = new Map<string, Promise<unknown>>();

export async function mutateCollab<T>(projectId: string, fn: (file: CollabFile) => T | Promise<T>): Promise<T> {
  const prev = chains.get(projectId) ?? Promise.resolve();
  const run = prev.catch(() => undefined).then(async () => {
    const file = await readCollab(projectId);
    const result = await fn(file);
    file.rev += 1;
    await writeCollab(file);
    return result;
  });
  chains.set(projectId, run);
  try {
    return await run;
  } finally {
    if (chains.get(projectId) === run) chains.delete(projectId);
  }
}

export type OpOutcome<T> = { duplicate: boolean; result: T };

/**
 * Áp một mutation có opId: đã áp rồi → trả kết quả cũ, duplicate=true, KHÔNG chạy `fn`.
 * `opId` phải là chuỗi 8..128 ký tự an toàn — client sinh, kèm danh tính trong payload.
 */
export function isValidOpId(x: unknown): x is string {
  return typeof x === 'string' && /^[A-Za-z0-9_:.-]{8,128}$/.test(x);
}

export async function applyOp<T>(
  projectId: string,
  opId: string,
  fn: (file: CollabFile) => T,
): Promise<OpOutcome<T>> {
  if (!isValidOpId(opId)) throw new Error('[collab] opId không hợp lệ.');
  return mutateCollab(projectId, (file) => {
    const done = file.appliedOps[opId];
    if (done) return { duplicate: true, result: done.result as T };
    const result = fn(file);
    file.appliedOps[opId] = { at: new Date().toISOString(), result };
    const keys = Object.keys(file.appliedOps);
    if (keys.length > MAX_OPS) {
      keys
        .sort((a, b) => (file.appliedOps[a].at < file.appliedOps[b].at ? -1 : 1))
        .slice(0, keys.length - MAX_OPS)
        .forEach((k) => delete file.appliedOps[k]);
    }
    return { duplicate: false, result };
  });
}

export function newId(prefix: string): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return `${prefix}_${Date.now().toString(36)}_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

/** Danh sách jti đã thu hồi — kiểm lúc nhận lời mời. */
export function isInviteRevoked(file: CollabFile, jti: string): boolean {
  const rec = file.invites.find((i) => i.jti === jti);
  return !!rec?.revokedAt;
}
