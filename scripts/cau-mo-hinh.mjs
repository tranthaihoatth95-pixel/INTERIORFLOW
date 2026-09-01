/**
 * cau-mo-hinh.mjs — BA QUYẾT ĐỊNH THUẦN của cầu bàn giao, tách ra để ĐO ĐƯỢC.
 *
 * ⚠️ ĐÂY KHÔNG PHẢI NGUỒN THỨ HAI. `moc.mjs` vẫn là cửa duy nhất ghi vào cầu; tệp này chỉ giữ
 * phần **quyết định** mà trước đây nằm lẫn trong thân lệnh CLI. Vì sao phải tách: `moc.mjs` chạy
 * việc ngay ở phạm vi module (`process.argv`, `process.exit`, ghi tệp), nên **không import được
 * vào một bài kiểm** — mà luật của repo là *một luật chỉ là luật khi có ca đột biến chứng minh
 * cổng bắt được*. Không tách thì ba việc dưới đây mãi mãi là lời chúc.
 *
 * Ba việc, đến từ DISS REVISE của Codex (phiếu `HO-20260830120509-23fe0005a0a2`):
 *   ① `phanRo`   — rổ "CHƯA GỬI" từng là rổ KHÔNG THOÁT RA ĐƯỢC.
 *   ② `chamAck`  — biên nhận có cấu trúc, thay chữ tự do.
 *   ③ `chuanHoaSo`/`buocLaneSo` — sổ lane↔phiên có hạn dùng, và dòng ĐOÁN không có thẩm quyền.
 */

/* ═════════════════════ ① PHÂN RỔ — ba rổ, ba người phải làm ═════════════════════
 *
 * 🔴 LỖI ĐÃ ĐO, VÀ NÓ LÀM HỎNG LÒNG TIN GIỮA HAI HỆ:
 * Bản cũ (`moc.mjs` lệnh `chua-nhan`) phân rổ theo mỗi mắt `SENT`:
 *     chuaGui = phiếu KHÔNG có SENT
 * Nhưng **tuyến Claude không có ai ghi SENT** — bưu tá là một bước KHÔNG TỒN TẠI ở đây; bên giao
 * tự đánh thức và ghi `WAKE`. Hệ quả: phiếu `HO-20260830100659-a7557134a95d` có chuỗi thật
 *     HANDOFF 10:06:59 → SEEN 10:12:38 → WAKE 10:25:23
 * vẫn nằm trong rổ "CHƯA GỬI" — **kể cả khi đã tới mắt người nhận**. Rổ đó không có lối ra.
 * Codex đọc rổ ấy rồi kết luận cầu tự mâu thuẫn, và Codex đọc đúng những gì được cho xem.
 *
 * ⇒ CHỮA BẰNG QUAN HỆ, KHÔNG BẰNG THÊM MỘT MẮT NỮA: `SEEN` và `WAKE` **bao hàm** `SENT`.
 * Không thể tới mắt mà chưa được giao; không thể gọi được mà chưa được giao. `SENT` vẫn dùng
 * tốt cho tuyến nào thật sự có bưu tá — nó chỉ thôi làm ĐIỀU KIỆN DUY NHẤT.
 * Đây cũng là gộp về một khuôn với `soi-cau.mjs`, vốn đã lấy `WAKE` làm bằng chứng giao từ trước
 * (luật 6: hai chỗ cùng trả lời câu *"đã giao chưa?"* mà trả lời khác nhau là đã phân kỳ).
 *
 * Rổ thứ BA là thứ bản cũ không có, và thiếu nó thì sửa ① sẽ đẻ ra lỗi ngược: phiếu đã SEEN mà
 * chưa ACK sẽ **biến mất khỏi mọi rổ**, tức im lặng đúng vào lúc cần nói. Ba rổ = ba việc khác
 * hẳn nhau, ba người khác nhau phải làm:
 *   CHƯA GỬI            → chưa ai giao        · việc của BÊN GIAO: đánh thức
 *   ĐÃ GỬI, CHƯA AI NHÌN → giao rồi, đích chưa mở · việc của NGƯỜI: gọi lại phiên đó
 *   ĐÃ NHÌN, CHƯA XỬ LÝ  → đã tới mắt         · việc của NGƯỜI NGỒI LANE: ack
 */

/** Một phiếu coi như ĐÃ GIAO khi có bất kỳ bằng chứng nào mạnh hơn hoặc bằng `SENT`. */
export const daGiao = (id, mat) => mat.sent.has(id) || mat.wake.has(id) || mat.seen.has(id);

/**
 * @param {object[]} su   toàn bộ sự kiện cầu
 * @param {number} nguongPhut  chỉ xét phiếu treo quá ngần này phút
 * @param {number} bayGio  mốc thời gian (ms) — truyền vào để ca đột biến không phụ thuộc đồng hồ
 */
export function phanRo(su, nguongPhut = 10, bayGio = Date.now()) {
  const gom = (t) => new Set(su.filter((e) => e.type === t).map(khoaHandoff));
  const mat = { sent: gom('SENT'), seen: gom('SEEN'),
    wake: new Set([...gom('WAKE'), ...gom('WAKE_ATTEMPTED')]) };
  const acked = gom('ACK');
  const phutCua = (e) => Math.round((bayGio - Date.parse(e.createdAt)) / 60000);

  const mo = su.filter((e) => e.type === 'HANDOFF' && !acked.has(khoaHandoff(e)) && phutCua(e) >= nguongPhut);

  const chuaGui = mo.filter((e) => !daGiao(khoaHandoff(e), mat));
  const daGuiChuaNhin = mo.filter((e) => daGiao(khoaHandoff(e), mat) && !mat.seen.has(khoaHandoff(e)));
  const daNhinChuaXuLy = mo.filter((e) => mat.seen.has(khoaHandoff(e)));

  /* Biên nhận CŨ — không có `outcome`. Đọc thành DONE-không-bằng-chứng và NÊU TÊN, nhưng
   * TUYỆT ĐỐI không viết lại lịch sử: sổ cầu chỉ được ghi thêm, không được sửa. */
  const ackCu = su.filter((e) => e.type === 'ACK' && !e.outcome);

  return { chuaGui, daGuiChuaNhin, daNhinChuaXuLy, ackCu, phutCua };
}

/** Đọc MỘT biên nhận, cũ hay mới đều ra cùng một hình. Không sửa gì trên sổ. */
export function docAck(e) {
  if (e.outcome) return { outcome: e.outcome, evidence: e.evidence ?? null, blocker: e.blocker ?? null, note: e.note ?? null, suyRa: false };
  return { outcome: 'DONE', evidence: null, blocker: null, note: e.noted ?? null, suyRa: true };
}

/* ═════════════════════ ② BIÊN NHẬN CÓ CẤU TRÚC ═════════════════════
 *
 * Nguyên văn Codex, và tôi đồng ý: *"ACK là biên nhận xử lý, không phải bài văn."*
 *
 * VÌ SAO BẢN CŨ SAI (tự khai): nó bắt buộc `noted` là chữ tự do, rồi **không có cổng nào chấm
 * chất lượng chữ đó**. Một ràng buộc không đo được thì nó không lọc ra thứ tốt — nó chỉ dạy
 * người ta gõ "ok/xong" cho qua. Bắt buộc mà không kiểm là khuyến khích rác.
 *
 * NGHỊCH LÝ PHẢI KHAI THẲNG: Hoà 30/08 đòi *"mỗi trạng thái kèm noted… người mới biết noted thế
 * nào mà tránh"*, tức đòi CHIỀU SÂU. Cấu trúc này lại cắt ngắn. Không mâu thuẫn, vì hai thứ đó
 * thuộc hai chỗ: **bài học sống ở BÀN** (`docs/control/ban/NN.md` — "kiến thức nằm tại bàn, không
 * nằm ở người ngồi"), **biên nhận chỉ trỏ tới bằng chứng**. Nhét bài học vào biên nhận là đặt tri
 * thức vào chỗ không ai đọc lại: sổ cầu là dòng sự kiện, không phải nơi người sau đi tìm.
 */
export const KET_QUA = ['DONE', 'PARTIAL', 'BLOCKED', 'SUPERSEDED'];
const TRAN_CHU = 240;

/**
 * Con trỏ bằng chứng phải **chạy lại được hoặc mở lại được** — đường dẫn, hash, lệnh, hoặc số
 * phiếu. Câu văn xuôi không phải bằng chứng, dù nó đúng.
 */
export const laConTro = (s) =>
  /(^|\s)(node|npm|npx|git|sucrase-node)\s+\S/.test(s) ||   // lệnh chạy lại được
  /[\w./-]+\.[a-z0-9]{1,6}(:\d+)?(\s|$)/i.test(s) ||        // đường dẫn tệp (kèm số dòng nếu có)
  /\b[0-9a-f]{7,40}\b/.test(s) ||                           // hash commit / bám ngắn
  /\bHO-\d{14}-[0-9a-f]{12}\b/.test(s);                     // phiếu khác trên cùng cây cầu

/**
 * Chấm một biên nhận TRƯỚC KHI ghi. Trả `{ok, loi}` — `loi` là câu nói thẳng phải sửa gì.
 * FAIL CLOSED: thiếu bằng chứng thì KHÔNG ghi, không ghi kèm cảnh báo rồi cho qua.
 */
export function chamAck({ outcome, evidence, note }) {
  if (!KET_QUA.includes(outcome)) {
    return { ok: false, loi: `outcome phải là một trong ${KET_QUA.join(' | ')} — nhận được "${outcome ?? ''}"` };
  }
  const ev = (evidence ?? '').trim();

  if (outcome === 'DONE' || outcome === 'PARTIAL') {
    if (!ev) return { ok: false, loi: `${outcome} BẮT BUỘC con trỏ bằng chứng (đường dẫn · hash · lệnh chạy lại được).` };
    if (!laConTro(ev)) {
      return { ok: false, loi: `bằng chứng phải MỞ LẠI ĐƯỢC, không phải câu kể. Nhận được: "${ev.slice(0, 60)}"\n` +
        '   Hợp lệ: `components/x.tsx:12` · `npm test` · `ba3668ff` · `HO-20260830101114-3d8077bcaae3`' };
    }
  }
  if (outcome === 'BLOCKED' && !ev) {
    return { ok: false, loi: 'BLOCKED BẮT BUỘC nêu TÊN cái đang chặn — ai/cái gì, không phải "chưa làm được".' };
  }
  if (outcome === 'SUPERSEDED' && !ev) {
    return { ok: false, loi: 'SUPERSEDED BẮT BUỘC trỏ phiếu thay thế (id `HO-…`) hoặc quyết định đã thay nó.' };
  }
  if (note && note.length > TRAN_CHU) {
    return { ok: false, loi: `note dài ${note.length} ký tự, trần ${TRAN_CHU}. Biên nhận không phải bài văn —\n` +
      `   bài học viết vào bàn (\`docs/control/ban/NN.md\`), chỗ người sau thật sự đọc lại.` };
  }
  return { ok: true, loi: null };
}

/* ═════════════════════ ③ SỔ LANE ↔ PHIÊN ═════════════════════
 *
 * Hai lỗ hổng Codex nêu, cả hai đều là *thẩm quyền cấp cho thứ không có thẩm quyền*:
 *   ⒜ một phiên giữ NHIỀU lane — đo 30/08: sổ gán lane 04 và 06 cho CÙNG một id.
 *   ⒝ dòng ĐOÁN (`doan:true`, suy từ "tệp .jsonl vừa chạm gần nhất") **vẫn được dùng để tra**.
 *      In cảnh báo rồi vẫn cho dùng thì cảnh báo chỉ là trang trí: người đọc vẫn gọi theo nó.
 *
 * Nay: dòng ĐOÁN và dòng QUÁ HẠN đều KHÔNG có thẩm quyền — chúng vẫn được giữ để người ta biết
 * "có thể là ai", nhưng `ai-giu` từ chối trả lời bằng chúng. Thà nói *không biết* còn hơn gọi
 * nhầm người rồi tin là đã gọi đúng.
 */
export const TTL_PHUT = 120;

/* ═════════════════════ ④ ĐỊA CHỈ CÓ NAMESPACE — role không còn là địa chỉ ═════════════════════ */
export const HE = ['cx', 'cl'];

/** Parse `cx:06` / `cl:06`. `06` chỉ được nhận khi caller đang làm compatibility READ-ONLY. */
export function docDiaChi(raw, choLegacy = false) {
  const s = String(raw ?? '');
  const m = /^(cx|cl):(\d{2})$/.exec(s);
  if (m) return { ok: true, address: s, system: m[1], lane: m[2], legacy: false };
  if (choLegacy && /^\d{2}$/.test(s)) return { ok: true, address: s, system: null, lane: s, legacy: true };
  return { ok: false, loi: `địa chỉ phải là cx:NN hoặc cl:NN${choLegacy ? ' (NN chỉ để đọc legacy)' : ''}` };
}

/** Scope đích của event. Event cũ chỉ có `to:'06'` giữ nguyên LEGACY_AMBIGUOUS. */
export function dichEvent(e) {
  if (e?.target_system && /^\d{2}$/.test(e?.target_lane ?? ''))
    return { address: `${e.target_system}:${e.target_lane}`, system: e.target_system, lane: e.target_lane, legacy: false };
  const p = docDiaChi(e?.to, true);
  if (p.ok) return p;
  return { address: null, system: null, lane: null, legacy: true };
}

export function eventThuocDiaChi(e, diaChi) {
  const q = docDiaChi(diaChi, true);
  if (!q.ok) return false;
  const d = dichEvent(e);
  return q.legacy ? d.legacy && d.lane === q.lane : !d.legacy && d.address === q.address;
}

/** Khóa state/retry gồm namespace đích + handoff; legacy không được tự gán sang cx/cl.
 *
 * 🔴 SỬA 01/09 — HAI ĐẦU CỦA CÙNG MỘT PHIẾU TỪNG KHOÁ RA HAI CHUỖI KHÁC NHAU.
 * HANDOFF legacy (`to:'06'`, chưa có namespace) khoá ra `legacy:06|<id>`. Nhưng mọi biên nhận
 * THEO SAU nó — WAKE · SEEN · ACK — rơi vào nhánh dưới: `target_system` rỗng ⇒ nhảy thẳng xuống
 * đáy và lấy lane của **TÁC GIẢ** làm đích. Tang vật trên cầu thật:
 *     HANDOFF        HO-…-3db07c32bcd1  to:'06'                        ⇒ legacy:06|3db07…
 *     WAKE_ATTEMPTED cùng handoffId, lane:'00' (cl:00 ghi hộ bên giao) ⇒ legacy:00|3db07…
 * Hai khoá không bao giờ gặp nhau ⇒ phiếu vĩnh viễn đọc ra "🔴 KẸT — ghi rồi mà chưa ai gọi",
 * kể cả khi đã có người gọi thật. Cái mất không phải một dòng sai, mà là **lối ra**: phiếu legacy
 * KHÔNG CÓ CÁCH NÀO đóng được, và bàn thì hiển thị nó như lỗi của người đang ngồi.
 *
 * Gốc: nhánh đáy SUY đích từ lane tác giả. Đó là suy diễn — đúng thứ cả sổ này sinh ra để cấm.
 *
 * ⇒ Nay đọc Ô KHAI BÁO TƯỜNG MINH đã có sẵn trong schema: `target_system:null` **kèm**
 * `target_lane:'NN'`. Cặp đó do người ghi đặt (moc.mjs lấy từ `dichEvent(handoff)` của chính
 * phiếu legacy), nghĩa đen là *"đích là phiếu LEGACY NN"* — dữ liệu, không phải phỏng đoán.
 * ⛔ VẪN CẤM chiều ngược lại: `06` KHÔNG bao giờ tự thành `cl:06`. Muốn nhận một phiếu legacy
 * thì phải KHAI (`moc.mjs ack … --legacy`), vì hai hệ dùng chung mã vai `06`.
 */
export function khoaHandoff(e) {
  const id = e?.type === 'HANDOFF' ? e.id : e?.handoffId;
  let scope;
  if (e?.type === 'HANDOFF') {
    const d = dichEvent(e);
    scope = d.legacy ? `legacy:${d.lane ?? '?'}` : d.address;
  } else if (e?.target_system) {
    scope = `${e.target_system}:${e.target_lane}`;
  } else if (/^\d{2}$/.test(e?.target_lane ?? '')) {
    scope = `legacy:${e.target_lane}`;
  } else {
    // Không ô đích nào ⇒ hết đường khai. Giữ nguyên hành vi cũ để không viết lại khoá của biên
    // nhận cũ; `id` trong khoá vẫn giữ hai phiếu khác nhau không lẫn vào nhau.
    scope = `legacy:${e?.lane ?? '?'}`;
  }
  return `${scope ?? 'LEGACY_AMBIGUOUS'}|${id ?? '?'}`;
}

/** Ghi lane↔phiên. MỘT PHIÊN ↔ MỘT LANE: nhận lane mới thì tự rời mọi lane cũ. */
export function buocLaneSo(so, lane, phien, doan, luc = new Date().toISOString()) {
  const dc = docDiaChi(lane, true);
  if (!dc.ok) return so ?? {};
  const moi = {};
  for (const [l, v] of Object.entries(so ?? {})) {
    const cu = docDiaChi(l, true);
    // Một session chỉ giữ một lane TRONG CÙNG HỆ. cx:S1 không được đá cl:S1 ra khỏi sổ.
    if (!dc.legacy && !cu.legacy && cu.system === dc.system && l !== dc.address && v?.phien === phien) continue;
    if (dc.legacy && cu.legacy && l !== dc.address && v?.phien === phien) continue;
    moi[l] = v;
  }
  moi[dc.address] = { phien, luc, system: dc.system, lane: dc.lane, ...(dc.legacy ? { legacy: 'LEGACY_AMBIGUOUS' } : {}), ...(doan ? { doan: true } : {}) };
  return moi;
}

/** Đọc sổ, gắn nhãn thẩm quyền. `thamQuyen=false` ⇒ CẤM dùng để đánh thức. */
export function chuanHoaSo(so, bayGio = Date.now(), ttlPhut = TTL_PHUT) {
  return Object.entries(so ?? {}).map(([lane, v]) => {
    const dc = docDiaChi(lane, true);
    const phut = Math.round((bayGio - Date.parse(v.luc)) / 60000);
    const hetHan = phut > ttlPhut;
    return {
      lane, system: dc.system, phien: v.phien, phut, doan: !!v.doan, hetHan,
      thamQuyen: !dc.legacy && !v.doan && !hetHan,
      lyDo: dc.legacy ? 'LEGACY_AMBIGUOUS — không biết thuộc Codex hay Claude' : v.doan ? 'ĐOÁN — không do phiên tự khai' : hetHan ? `quá hạn ${ttlPhut} phút` : null,
    };
  }).sort((a, b) => a.lane.localeCompare(b.lane));
}
