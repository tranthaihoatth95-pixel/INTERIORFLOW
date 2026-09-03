/** lib/auth — cửa vào slice phân quyền/cộng tác. Client CHỈ import roles/mutation-queue/permission-cache
 * (thuần); server thêm authorize-db/collab-store/invite. */
export * from './roles';
export * from './authorize';
export * from './mutation-queue';
export * from './permission-cache';
