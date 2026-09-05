'use client';

/**
 * components/studio/ProjectScopeEmptyState.tsx — M-SCOPE VIỆC 5 (G-M14-02, 07/08).
 *
 * Trước đây `useProjectScopeSync` trả `status='missing'` nhưng KHÔNG page nào đọc nó — CadStageScreen/
 * RenderStageScreen/PresentStageScreen luôn render, vào bằng URL rỗng thấy canvas trắng không lý
 * do (grep xác nhận: app/projects/[id]/{cad,render,present}/page.tsx gọi useProjectScopeSync()
 * nhưng không dùng giá trị trả về — 0 chỗ rẽ nhánh theo status).
 *
 * `[id]` trong URL nhận CẢ Flow.id lẫn Project.id (`resolveFlowForRouteId`, lib/scope-core.ts) —
 * `useScopeMissingInfo` phân biệt 2 ca và component này NÓI RA đúng luật §9j "thiết kế trước":
 *   - `empty-project`: id là MỘT Project THẬT, chỉ chưa có Flow nào — sửa được TẠI CHỖ (luật X2,
 *     cấm đá "sang chặng khác rồi quay lại"): tạo bản vẽ mới, hoặc nhận một bản vẽ mồ côi có sẵn
 *     (VIỆC 1 tìm ra gốc bệnh: `createFlow()` không gắn projectId — kho đang có 41 flow mồ côi,
 *     đây là nơi USER tự sửa việc đó cho TỪNG bản vẽ họ muốn dùng, không phải gán bừa hàng loạt).
 *   - `unknown`: id không khớp Project lẫn Flow nào — đường dẫn hỏng/đã xoá, sửa tại chỗ vô nghĩa,
 *     chỉ còn cách điều hướng đi (Home button đã có, dùng lại `goHomeConfirmed`).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { EmptyState } from '@/components/ui/EmptyState';
import { useT } from '@/lib/i18n';
import { fetchFlows, createFlow, assignProject, openFlow, type FlowMeta } from '@/lib/workspace';
import { goHomeConfirmed } from '@/lib/resume';
import { stageRoutePath } from '@/lib/scope-core';
import type { StageSegment } from '@/lib/scope-core';
import type { ScopeMissingInfo } from '@/lib/project-scope';

export function ProjectScopeEmptyState({
  routeId,
  stage,
  info,
}: {
  routeId: string;
  stage: StageSegment;
  info: ScopeMissingInfo;
}) {
  const tr = useT();
  const router = useRouter();
  const duongHienTai = usePathname();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orphanFlows, setOrphanFlows] = useState<FlowMeta[] | null>(null);
  /**
   * KHOÁ BẤM HAI LẦN phải là REF, không phải state (04/09).
   * `if (busy) return` đọc `busy` đã bị đóng băng trong closure của `useCallback`; hai cú bấm
   * sát nhau có thể cùng thấy `false` ⇒ hai lần `createFlow` ⇒ dự án mọc thêm một bản vẽ thừa.
   * Ref đổi NGAY trong cùng một lượt xử sự kiện nên không có khe hở đó. `busy` state giữ
   * nguyên vai trò của nó: đổi nhãn nút.
   */
  const dangChay = useRef(false);
  /** Còn gắn trên màn không — để không gọi setState sau khi màn rỗng đã nhường chỗ cho chặng. */
  const conGan = useRef(true);
  useEffect(() => {
    conGan.current = true;
    return () => {
      conGan.current = false;
    };
  }, []);

  /** Gỡ cờ bận — chỉ khi màn RỖNG vẫn còn đứng đó. Xong việc thì component đã unmount. */
  const thoiBan = useCallback(() => {
    dangChay.current = false;
    if (conGan.current) setBusy(false);
  }, []);

  useEffect(() => {
    if (info.kind !== 'empty-project') return;
    let alive = true;
    void fetchFlows().then(({ flows }) => {
      if (alive) setOrphanFlows(flows.filter((f) => !f.project));
    });
    return () => {
      alive = false;
    };
  }, [info.kind]);

  /**
   * ĐIỀU HƯỚNG THẬT SỰ, hoặc KHÔNG ĐIỀU HƯỚNG GÌ.
   * Trước 04/09 hàm này luôn `router.push` — mà đích đến CHÍNH LÀ đường đang đứng, nên nó chỉ
   * đẻ thêm một mục lịch sử (nút Lùi bấm xong đứng yên) chứ không dựng lại gì. Nay: khác đường
   * thì đi, cùng đường thì thôi — màn tự đổi vì `useProjectScopeSync` đã tính lại status.
   */
  const goToStage = useCallback(
    (id: string) => {
      const dich = stageRoutePath(id, stage);
      if (dich !== duongHienTai) router.push(dich);
    },
    [router, stage, duongHienTai],
  );

  const handleCreate = useCallback(async () => {
    if (dangChay.current) return;
    dangChay.current = true;
    setBusy(true);
    setError(null);
    try {
      // Gắn dự án NGAY LÚC SINH (`createFlow` nhận `projectId` từ 07/08, server kiểm quyền ở
      // `app/api/flows/route.ts:90`). Đường cũ tạo trần rồi `assignProject` vá sau: hỏng giữa
      // hai bước là để lại một bản vẽ nằm trong dự án "Nháp" mà không ai biết.
      const flowId = await createFlow(
        tr('Bản vẽ mới', 'New drawing'),
        JSON.stringify({ nodes: [], edges: [] }),
        routeId,
      );
      await openFlow(flowId);
      goToStage(routeId);
    } catch {
      setError(tr('Không tạo được bản vẽ — thử lại.', 'Could not create the drawing — try again.'));
    } finally {
      // Đường THÀNH CÔNG cũng phải gỡ cờ. Trước 04/09 `setBusy(false)` chỉ nằm trong `catch`
      // ⇒ làm xong việc là màn kẹt "Đang tạo…" vĩnh viễn (lỗi chặn D-J04b).
      thoiBan();
    }
  }, [routeId, tr, goToStage, thoiBan]);

  const handleAttachOrphan = useCallback(
    async (flowId: string) => {
      if (dangChay.current) return;
      dangChay.current = true;
      setBusy(true);
      setError(null);
      try {
        await assignProject(flowId, routeId);
        await openFlow(flowId);
        goToStage(routeId);
      } catch {
        setError(tr('Không gắn được bản vẽ này vào dự án — thử lại.', 'Could not attach this drawing — try again.'));
      } finally {
        thoiBan();
      }
    },
    [routeId, tr, goToStage, thoiBan],
  );

  if (info.kind === 'unknown') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <EmptyState
          title={tr('Không tìm thấy dự án hoặc bản vẽ này', 'This project or drawing was not found')}
          desc={tr(
            'Đường dẫn có thể đã đổi hoặc dự án đã bị xoá. Quay về Thư viện dự án để chọn lại.',
            'The link may be outdated or the project was removed. Go back to the project library to pick again.',
          )}
          ghost="none"
          actions={[
            {
              label: tr('Home', 'Home'),
              primary: true,
              onClick: () => goHomeConfirmed(router),
            },
          ]}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <EmptyState
        title={
          info.projectName
            ? tr(`"${info.projectName}" chưa có bản vẽ nào`, `"${info.projectName}" has no drawings yet`)
            : tr('Dự án này chưa có bản vẽ nào', 'This project has no drawings yet')
        }
        desc={error ?? tr('Tạo bản vẽ mới, hoặc gắn một bản vẽ có sẵn (chưa thuộc dự án nào) vào đây.', 'Create a new drawing, or attach an existing unassigned drawing here.')}
        ghost="rows"
        actions={[
          {
            label: busy ? tr('Đang tạo…', 'Creating…') : tr('Tạo bản vẽ mới', 'Create new drawing'),
            primary: true,
            onClick: handleCreate,
            disabled: busy,
          },
          orphanFlows && orphanFlows.length > 0
            ? {
                label: tr(`Nhập bản vẽ có sẵn (${orphanFlows.length})`, `Attach existing drawing (${orphanFlows.length})`),
                onClick: () => void handleAttachOrphan(orphanFlows[0].id),
                disabled: busy,
                hint: orphanFlows[0]?.name,
              }
            : {
                label: tr('Nhập bản vẽ có sẵn', 'Attach existing drawing'),
                disabled: true,
                disabledReason: tr('Chưa có bản vẽ nào chưa thuộc dự án khác để gắn vào đây.', 'No unassigned drawing available to attach.'),
              },
        ]}
      />
    </div>
  );
}
