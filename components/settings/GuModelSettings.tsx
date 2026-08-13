'use client';

/**
 * components/settings/GuModelSettings.tsx — nhóm "Bộ học Gu" của /settings (Đợt C, 01/08,
 * docs/QUYET-DINH-HA-TANG-2026-07-31.md §③ phương án C: "Prisma là nguồn + có đường xuất/nhập
 * tệp"). Đường xuất/nhập tệp NẰM Ở ĐÂY thay vì gộp vào `StorageSettings.tsx` — nhóm đó đang
 * dựng dở ở nhánh khác cùng đợt này (Đợt B, code chính); tách file mới để KHÔNG tranh khoá git
 * (xem CLAUDE.md, luật "A ở components/present-editor/, B ở prisma+lib/gu").
 *
 * CHỈ hiện 'cad-layout-option' — điểm cắm DUY NHẤT thật sự có dữ liệu chảy vào Prisma ở đợt
 * này (đã cắm ở components/cad/AiBriefPanel.tsx). Điểm cắm 'present-template' (LayoutShelf.tsx)
 * nằm trong components/present-editor/ — NGOÀI phạm vi được sửa của đợt này (đang bị Phần A
 * kiểm cùng lúc) — CỐ Ý CHƯA cắm, để dành đợt sau. Hiện nút cho 1 kind rỗng sẽ chỉ gây hiểu lầm
 * "tính năng có nhưng không chạy" nên không thêm vào UI cho tới khi cắm thật.
 */

import { useEffect, useState } from 'react';
import { useFlowStore } from '@/lib/store';
import { effectiveUserId } from '@/lib/resume';
import { PairwisePerceptron } from '@/lib/gu/pairwise-perceptron';
import { cadLayoutOptionModelKey } from '@/lib/cad/ai-layout-feedback';
import { loadGuModelFromServer, saveGuModelToServer, buildGuModelExport, parseGuModelExport, type GuKind } from '@/lib/gu/gu-model-sync';
import { useT } from '@/lib/i18n';

const KIND: GuKind = 'cad-layout-option';

export function GuModelSettings() {
  const tr = useT();
  const storeUserId = useFlowStore((s) => s.user?.id);
  const userId = effectiveUserId(storeUserId);
  const modelKey = cadLayoutOptionModelKey(userId);

  const [pairCount, setPairCount] = useState<number | null>(null); // null = đang tải
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  // Đọc số cặp đã học để hiện trạng thái (server ưu tiên — Prisma là nguồn; rỗng thì thử cache
  // cục bộ, đúng logic reconcile ở AiBriefPanel.tsx nhưng đơn giản hoá vì đây chỉ ĐỌC để hiện số).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const server = await loadGuModelFromServer(KIND);
      if (cancelled) return;
      if (server) {
        setPairCount(server.pairCount);
        return;
      }
      if (modelKey) {
        try {
          setPairCount(PairwisePerceptron.loadFromLocalStorage(modelKey).pairsSeen);
          return;
        } catch {
          /* rơi xuống 0 bên dưới */
        }
      }
      setPairCount(0);
    })();
    return () => {
      cancelled = true;
    };
  }, [modelKey]);

  async function onExport() {
    setMsg('');
    const server = await loadGuModelFromServer(KIND);
    const state = server
      ? PairwisePerceptron.deserialize(server.weightsJson).toState()
      : modelKey
        ? PairwisePerceptron.loadFromLocalStorage(modelKey).toState()
        : null;
    if (!state || state.pairsSeen === 0) {
      setMsg(tr('Chưa có dữ liệu để xuất.', 'Nothing to export yet.'));
      return;
    }
    const json = JSON.stringify(buildGuModelExport(KIND, state), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gu-model-${KIND}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const pkg = parseGuModelExport(String(reader.result));
      if (!pkg) {
        window.alert(tr('File không đúng định dạng bộ học Gu (.json xuất từ InteriorFlow).', 'Not a valid Gu model file (.json exported from InteriorFlow).'));
        return;
      }
      if (pkg.kind !== KIND) {
        window.alert(tr(`File này là bản ghi cho "${pkg.kind}", không khớp mục đang mở.`, `This file is for "${pkg.kind}", not this section.`));
        return;
      }
      const overwrite = window.confirm(
        tr(
          `Nhập bộ học Gu từ file .json — THAY THẾ toàn bộ trọng số hiện có (${pkg.state.pairsSeen} cặp đã học). Không thể hoàn tác. Tiếp tục?`,
          `Import Gu model from .json — this REPLACES all current weights (${pkg.state.pairsSeen} pairs learned). Cannot be undone. Continue?`,
        ),
      );
      if (!overwrite) return;
      setBusy(true);
      setMsg('');
      const model = PairwisePerceptron.deserialize(JSON.stringify(pkg.state));
      if (modelKey) model.saveToLocalStorage(modelKey);
      const ok = await saveGuModelToServer(KIND, model.serialize(), model.pairsSeen);
      setBusy(false);
      setPairCount(model.pairsSeen);
      setMsg(
        ok
          ? tr('Đã nhập.', 'Imported.')
          : tr('Đã nhập vào máy này — chưa đồng bộ lên máy chủ (kiểm tra mạng, sẽ tự thử lại lượt học kế tiếp).', 'Imported locally — not yet synced to the server (check your connection; will retry on the next learning event).'),
      );
    };
    reader.readAsText(f);
  }

  return (
    <section>
      <h2 className="text-[15px] font-semibold text-[var(--t1)]">{tr('Bộ học Gu', 'Gu learning model')}</h2>
      <p className="mt-1 text-[12px] text-[var(--t4)]">
        {tr(
          'Học từ lượt Nhận/Bỏ gợi ý bố trí ở Thiết kế 2D của bạn — riêng theo tài khoản, lưu trên máy chủ.',
          'Learns from your Accept/Reject picks on 2D Design layout suggestions — per account, stored on the server.',
        )}
      </p>

      <div className="mt-3 flex items-center justify-between rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 py-2.5">
        <span className="text-[12.5px] text-[var(--t3)]">
          {pairCount === null ? tr('Đang tải…', 'Loading…') : tr(`${pairCount} cặp đã học`, `${pairCount} pairs learned`)}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExport}
            disabled={busy}
            className="rounded-[10px] border border-[var(--border)] px-2.5 py-1 text-[12px] font-medium text-[var(--t2)] transition-colors hover:text-[var(--t1)] disabled:opacity-50"
          >
            {tr('Xuất .json', 'Export .json')}
          </button>
          <label className="cursor-pointer rounded-[10px] border border-[var(--border)] px-2.5 py-1 text-[12px] font-medium text-[var(--t2)] transition-colors hover:text-[var(--t1)]">
            {tr('Nhập .json', 'Import .json')}
            <input type="file" accept=".json,application/json" onChange={onFile} disabled={busy} className="hidden" />
          </label>
        </div>
      </div>
      {msg && <p className="mt-1.5 text-[11.5px] text-[var(--t4)]">{msg}</p>}
    </section>
  );
}
