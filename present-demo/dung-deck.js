/**
 * present-demo/dung-deck.js — DỰNG LẠI deck giới thiệu IF vào IndexedDB của trình duyệt.
 *
 * VÌ SAO CÓ TỆP NÀY: 21/08 deck 24 trang đã MẤT khi hồ sơ trình duyệt bị làm mới (deck chỉ sống
 * ở IndexedDB phía client). Nguyên liệu thì còn nguyên trên máy chủ, nên bài không mất — nhưng
 * "còn dựng lại được" chỉ đúng khi CÔNG THỨC nằm trên đĩa. Đây là công thức đó.
 * Chạy: dán `window.__dungDeckIF(userId, projectId)` trong console của app đang mở.
 */
(function () {
  const BG = '#1a1815', INKW = '#ece7dd', MUT = '#8d857a', SOFT = '#8a6f4d', LINE = '#4a443c';
  const SHOT = {
    home: 'cmt2cxdgo000hw93tsqp0eajs', sophac: 'cmt2cxl0r000nw93tzye4xe21',
    chuyen: 'cmt2cxmlp000tw93tc8gngwy8', vp3d: 'cmt2cxy8h000zw93tp7d19z1q',
    node: 'cmt2cy0lr0015w93ty9rhtpbm', act: 'cmt2cy21s001bw93trvy0qo3s',
    present: 'cmt2cy9fn001hw93th17drre6',
    ceTruoc: 'cmt2x4cww0001w9eww6qlx7aj', ceSau: 'cmt2x4cx50003w9ewfpk39tl3',
    veKhoi: 'cmt2x4cx90005w9ewevgr0z2d', vaoRong: 'cmt2x4cxd0007w9ewk91duquk',
  };
  const CHAIR = 'cmsshuywg0001w90hkws755g5';
  const MAT = [['WHITE OAK','cmt10gpq0001fw9rbhevn9ong'],['WALNUT','cmt10gqfj001lw9rbnoi8pshi'],
    ['WHT MARBLE','cmt10gqpn001rw9rbk997g2dk'],['GREY TRZ','cmt10grff001xw9rbruoupr6f'],
    ['BEIGE LINEN','cmt10grp50023w9rbuas5znyf'],['BR BRASS','cmt10grv90029w9rbkez480vn']];
  const F = (id) => `/api/library/${id}/file`;

  window.__dungDeckIF = async function (userId, projectId) {
    const P = `/projects/${projectId}`;
    let n = 0; const id = (p) => `${p}_${(n++).toString(36)}`;
    const txt = (o) => ({ id: id('txt'), kind: 'text', frame: { x: 8, y: 8, w: 50, h: 12, rotation: 0 }, text: '', fontSize: 3, color: INKW, align: 'left', bold: false, italic: false, underline: false, tracking: 0, lineHeight: 1.25, bullet: false, role: 'free', opacity: 1, colorAuto: false, ...o });
    const img = (src, o) => ({ id: id('img'), kind: 'image', frame: { x: 10, y: 10, w: 40, h: 50, rotation: 0 }, src, adjust: { brightness: 100, contrast: 100, saturate: 96, blur: 0 }, crop: { x: 0, y: 0, w: 100, h: 100 }, radius: 0, opacity: 1, ...o });
    const shp = (shape, o) => ({ id: id('shp'), kind: 'shape', shape, frame: { x: 20, y: 20, w: 30, h: 20, rotation: 0 }, fill: SOFT, stroke: SOFT, strokeWidth: 0, opacity: 1, ...o });
    const hr = (o) => shp('line', { fill: 'transparent', strokeWidth: 1.5, ...o });
    const slide = (els) => ({ id: id('slide'), background: BG, backgroundImage: null, elements: els, templateId: 'deck-C' });
    const meta = (t) => txt({ text: t, fontSize: 1.4, tracking: 3, color: MUT, frame: { x: 6, y: 7, w: 74, h: 3.5, rotation: 0 } });
    const cap = (t, x, y, w, mau) => txt({ text: t, fontSize: 1.7, tracking: 1, color: mau ?? MUT, frame: { x, y, w: w ?? 20, h: 3.5, rotation: 0 } });
    const live = (href, x, y, label) => txt({ text: label ?? '→ Mở live', fontSize: 1.9, bold: true, tracking: 1, color: SOFT, href, frame: { x, y, w: 18, h: 4, rotation: 0 } });
    const spine = (y, accent, labels) => [hr({ frame: { x: 6, y, w: 70, h: .3, rotation: 0 }, stroke: LINE }),
      ...[0,1,2,3,4].map((i) => shp('ellipse', { frame: { x: 6 + i * 17.1 - .55, y: y - 1.1, w: 1.1, h: 1.95, rotation: 0 }, fill: i === accent ? SOFT : LINE })),
      ...(labels ? ['Ý tưởng','Thiết kế','Quyết định','Sự thật','Trình bày'].map((t, i) => cap(t, 4.8 + i * 17.1, y + 4.5, 12, i === accent ? SOFT : MUT)) : [])];
    const stm = (kicker, title, line, fs) => slide([meta(kicker), hr({ frame: { x: 6, y: 52, w: 10, h: .3, rotation: 0 } }),
      txt({ text: title, role: 'title', fontSize: fs ?? 5.6, bold: true, lineHeight: 1.25, frame: { x: 6, y: 56, w: 76, h: 26, rotation: 0 } }),
      ...(line ? [txt({ text: line, fontSize: 2.1, color: MUT, frame: { x: 6, y: 84, w: 72, h: 6, rotation: 0 } })] : [])]);
    const wsChip = (label, x, y, w) => [shp('rect', { frame: { x, y, w: w ?? 17, h: 9, rotation: 0 }, fill: 'transparent', stroke: LINE, strokeWidth: 1.2 }),
      txt({ text: label, fontSize: 1.9, color: INKW, align: 'center', frame: { x, y: y + 3, w: w ?? 17, h: 4, rotation: 0 } })];

    const slides = [
      slide([meta('2026 · PRODUCT INTRODUCTION'), ...spine(38, 4, true), txt({ text: 'InteriorFlow', role: 'title', fontSize: 11.5, bold: true, tracking: -1, frame: { x: 5.6, y: 60, w: 80, h: 16, rotation: 0 } }), txt({ text: 'One spine for creative work.', fontSize: 2.1, color: MUT, frame: { x: 6, y: 76.5, w: 44, h: 5, rotation: 0 } })]),
      slide([meta('VẤN ĐỀ'), ...[[6,36],[24,41],[41,33],[57,44],[70,37]].map(([x,y]) => hr({ frame: { x, y, w: 9, h: .3, rotation: 0 }, stroke: LINE })), txt({ text: 'Chuỗi công cụ sáng tạo\nđang đứt rời.', role: 'title', fontSize: 6, bold: true, frame: { x: 6, y: 58, w: 70, h: 22, rotation: 0 } }), txt({ text: '2D · 3D · AI · Spec · Soát duyệt · Trình bày — mỗi việc một app.', fontSize: 2, color: MUT, frame: { x: 6, y: 82, w: 66, h: 5, rotation: 0 } })]),
      stm('INTERIORFLOW LÀ GÌ', 'Một Creative Operating System\ncho công việc nội thất.', 'Từ ý tưởng đến hồ sơ — trong một môi trường, một nguồn sự thật.'),
      slide([meta('WORKSPACE · PRODUCT DIRECTION'), txt({ text: 'Quay về đúng mạch việc,\nkhông chỉ đúng dự án.', role: 'title', fontSize: 5, bold: true, lineHeight: 1.25, frame: { x: 6, y: 14, w: 60, h: 18, rotation: 0 } }),
        txt({ text: 'Project nhớ công việc LÀ GÌ.\nWorkspace nhớ bạn ĐANG LÀM NÓ THẾ NÀO —\nvùng chọn · góc nhìn · công cụ mở · tham chiếu · trọng tâm.', fontSize: 2.1, color: MUT, lineHeight: 1.6, frame: { x: 6, y: 34, w: 56, h: 14, rotation: 0 } }),
        txt({ text: 'PROJECT', fontSize: 2.2, bold: true, tracking: 2, color: INKW, frame: { x: 6, y: 56, w: 20, h: 4, rotation: 0 } }),
        shp('rect', { frame: { x: 7.9, y: 61.5, w: .22, h: 5, rotation: 0 }, fill: LINE }),
        ...wsChip('Concept', 6, 68), ...wsChip('Kỹ thuật', 25, 68), ...wsChip('Client Review', 44, 68, 19),
        cap('mỗi workspace nối 2D · 3D · Trình bày — không nhân đôi sự thật dự án', 6, 80, 64),
        txt({ text: 'Project giữ sự thật.\nWorkspace giữ đà làm việc.', fontSize: 2.2, bold: true, color: SOFT, lineHeight: 1.5, frame: { x: 68, y: 62, w: 26, h: 12, rotation: 0 } }),
        cap('Đã chạy thật: Resume — về đúng dự án · chặng · sheet. Nhiều workspace đặt tên: hướng sản phẩm.', 6, 88, 84)]),
      slide([meta('MỘT CÔNG CỤ — KHÔNG PHẢI MỌI CÔNG CỤ'), ...spine(44, -1, true),
        shp('rect', { frame: { x: 20, y: 56, w: 42, h: .22, rotation: 0 }, fill: SOFT, opacity: .7 }),
        cap('workspace giữ ngữ cảnh của bạn ở bất kỳ điểm nào trên xương sống', 20, 58.5, 50, SOFT),
        txt({ text: 'Một dòng chảy. Không mối nối chết.', fontSize: 2.4, color: MUT, frame: { x: 6, y: 72, w: 60, h: 6, rotation: 0 } })]),
      slide([meta('TRANG CHỦ'), img(F(SHOT.home), { frame: { x: 6, y: 14, w: 88, h: 70, rotation: 0 }, href: '/' }), cap('Không gian cá nhân trước khi là nơi làm việc.', 6, 86.5, 50), cap('Tiếp tục · về lại đúng nơi đang dở — như quay về một căn phòng.', 56, 86.5, 38, SOFT), live('/', 84, 7)]),
      slide([meta('THIẾT KẾ 2D'), img(F(SHOT.sophac), { frame: { x: 6, y: 14, w: 43.5, h: 66, rotation: 0 }, href: `${P}/cad` }), img(F(SHOT.chuyen), { frame: { x: 50.5, y: 14, w: 43.5, h: 66, rotation: 0 }, href: `${P}/cad` }), cap('Sơ phác', 6, 82.5), cap('Chuyên', 50.5, 82.5), cap('Cùng một workspace — ngữ cảnh đi theo khi chuyển 2D → 3D → Trình bày.', 6, 86.5, 64), live(`${P}/cad`, 84, 7)]),
      slide([meta('THIẾT KẾ 3D'), img(F(SHOT.vp3d), { frame: { x: 6, y: 14, w: 88, h: 70, rotation: 0 }, href: `${P}/render` }), cap('Spatial Authoring Environment — viewport trước hết.', 6, 86.5, 60), live(`${P}/render`, 84, 7)]),
      slide([meta('DỰNG KHỐI BẰNG CỬ CHỈ'), img(F(SHOT.vaoRong), { frame: { x: 6, y: 14, w: 43.5, h: 66, rotation: 0 }, href: `${P}/render` }), img(F(SHOT.veKhoi), { frame: { x: 50.5, y: 14, w: 43.5, h: 66, rotation: 0 }, href: `${P}/render` }), cap('Cảnh trống — không đòi mặt bằng 2D', 6, 82.5, 43), cap('Một cú kéo trên mặt sàn → khối có thật', 50.5, 82.5, 43, SOFT), live(`${P}/render`, 84, 7)]),
      slide([meta('AI + QUYỀN NGƯỜI QUYẾT'), img(F(SHOT.node), { frame: { x: 6, y: 14, w: 56, h: 70, rotation: 0 }, href: `${P}/render` }), txt({ text: 'Máy đề xuất.\nNgười quyết.', role: 'title', fontSize: 4.6, bold: true, lineHeight: 1.2, frame: { x: 66, y: 30, w: 28, h: 20, rotation: 0 } }), txt({ text: 'Không kết quả nào tự ghi\nvào dự án sau lưng ai.', fontSize: 2, color: MUT, lineHeight: 1.55, frame: { x: 66, y: 54, w: 28, h: 10, rotation: 0 } }), live(`${P}/render`, 66, 68)]),
      slide([meta('SỬA CÓ KIỂM SOÁT'), img(F(SHOT.ceTruoc), { frame: { x: 6, y: 14, w: 43.5, h: 66, rotation: 0 } }), img(F(SHOT.ceSau), { frame: { x: 50.5, y: 14, w: 43.5, h: 66, rotation: 0 } }), cap('Trước', 6, 82.5), cap('Sau — vùng chọn tay, đã Nhận · bản gốc còn nguyên', 50.5, 82.5, 43, SOFT)]),
      slide([img(F(CHAIR), { frame: { x: 0, y: 0, w: 50, h: 100, rotation: 0 }, href: '/demo/ghe-3d' }), txt({ text: 'ẢNH → SPEC', fontSize: 1.6, bold: true, tracking: 3, color: MUT, frame: { x: 57, y: 12, w: 34, h: 4, rotation: 0 } }), txt({ text: 'Ghế bành', role: 'title', fontSize: 5.5, bold: true, frame: { x: 57, y: 17, w: 38, h: 9, rotation: 0 } }), txt({ text: 'Rộng  ≈ 1 206 mm\nSâu   ≈ 825 mm\nCao   ≈ 825 mm', fontSize: 3, lineHeight: 1.7, frame: { x: 57, y: 31, w: 36, h: 24, rotation: 0 } }), cap('SUY RA — chờ người xác minh', 57, 58, 34, SOFT), txt({ text: 'Máy đọc ảnh, suy kích thước kèm độ tin.\nNgười xác minh rồi mới thành sự thật.', fontSize: 1.9, color: MUT, lineHeight: 1.55, frame: { x: 57, y: 65, w: 36, h: 11, rotation: 0 } }), live('/demo/ghe-3d', 57, 78, '→ Mở ghế 3D')]),
      slide([meta('SỰ THẬT · PHẢ HỆ'), txt({ text: 'Đo được.\nĐã kiểm.\nNgười ghi đè.\nSuy ra.', role: 'title', fontSize: 5.6, bold: true, lineHeight: 1.35, frame: { x: 6, y: 20, w: 60, h: 52, rotation: 0 } }), txt({ text: 'Mỗi con số biết mình từ đâu tới — và đang được dùng ở đâu.', fontSize: 2.1, color: MUT, frame: { x: 6, y: 80, w: 64, h: 5, rotation: 0 } })]),
      stm('VIỆC TỪ CHÍNH CÔNG VIỆC', 'Việc sinh ra tại chỗ đang làm —\nvà nhảy về đúng chỗ đó.', 'Chọn một khối 3D, tạo việc gắn nó; mở việc là quay về đúng khối.'),
      slide([meta('TRÌNH BÀY'), img(F(SHOT.present), { frame: { x: 6, y: 14, w: 88, h: 70, rotation: 0 } }), cap('Chính trang này là một trang IF — deck dựng trong IF, ảnh liên kết tài sản thật.', 6, 86.5, 80)]),
      slide([meta('HOẠT ĐỘNG · VITALS'), img(F(SHOT.act), { frame: { x: 6, y: 14, w: 88, h: 70, rotation: 0 }, href: `${P}/render` }), cap('Cái gì đang chạy, bước kế là gì — không cần hỏi.', 6, 86.5, 60), live(`${P}/render`, 84, 7, '→ Xem flow sống')]),
      stm('CHO NGƯỜI SÁNG TẠO', 'Sức mạnh chuyên nghiệp,\nkhông cảm giác thù địch.', 'Bớt dựng lại ngữ cảnh, thêm mạch sáng tạo — máy thích nghi theo trọng tâm của người.'),
      stm('CHO TỔ CHỨC', 'Nỗ lực sáng tạo trở thành\ntrí tuệ của studio.', 'Quyết định, vật liệu, gu thiết kế tích luỹ — quyền tác giả luôn minh bạch.'),
      stm('VÌ SAO LÀ BÂY GIỜ', 'AI đề xuất được rồi.\nNghề cần sự thật kiểm chứng.', 'Cửa sổ để đặt chuẩn human-in-the-loop cho ngành — đang mở.'),
      stm('CHUẨN MỰC', 'Hồ sơ đúng nghề,\ntự động giữ chuẩn.', 'Tỉ lệ chuẩn · 300dpi · BOQ chỉ nhận số đo được · nguồn truy được.'),
      slide([meta('HỆ THỐNG HÔM NAY — MÀN THẬT'), img(F(SHOT.sophac), { frame: { x: 6, y: 14, w: 28.6, h: 34, rotation: 0 }, href: `${P}/cad` }), img(F(SHOT.vp3d), { frame: { x: 35.7, y: 14, w: 28.6, h: 34, rotation: 0 }, href: `${P}/render` }), img(F(SHOT.veKhoi), { frame: { x: 65.4, y: 14, w: 28.6, h: 34, rotation: 0 }, href: `${P}/render` }), img(F(SHOT.present), { frame: { x: 6, y: 50.5, w: 28.6, h: 34, rotation: 0 } }), img(F(SHOT.home), { frame: { x: 35.7, y: 50.5, w: 28.6, h: 34, rotation: 0 }, href: '/' }), img(F(SHOT.act), { frame: { x: 65.4, y: 50.5, w: 28.6, h: 34, rotation: 0 }, href: `${P}/render` }), cap('2D', 6, 86.5, 10), cap('3D', 35.7, 86.5, 10), cap('Dựng khối', 65.4, 86.5, 14), cap('Trình bày', 6, 48.2, 14), cap('Trang chủ', 35.7, 48.2, 14), cap('Hoạt động', 65.4, 48.2, 14)]),
      slide([...spine(46, 4, false), txt({ text: 'One spine for the work.\nFreedom for the creator.', role: 'title', fontSize: 5.6, bold: true, lineHeight: 1.3, frame: { x: 6, y: 58, w: 76, h: 24, rotation: 0 } })]),
      slide([meta('BẢNG VẬT THỂ — HERO + SUPPORT'), img(F(CHAIR), { frame: { x: 4, y: 14, w: 34, h: 74, rotation: 0 }, href: '/demo/ghe-3d' }), cap('GHẾ BAR LINCOLN 327 · AI-SINH', 4, 89, 40),
        ...MAT.map(([ma, aid], i) => { const col = i % 3, row = Math.floor(i / 3); const x = 44 + col * 18.6, y = 18 + row * 36; return [img(F(aid), { frame: { x, y, w: 13, h: 23.1, rotation: 0 }, mask: { shape: 'ellipse' }, href: '/library' }), cap(ma, x, y + 25, 16)]; }).flat()]),
      slide([meta('BẢNG VẬT THỂ — LINEUP'), hr({ frame: { x: 6, y: 62.5, w: 88, h: .3, rotation: 0 }, stroke: LINE }),
        ...MAT.map(([ma, aid], i) => { const x = 6 + i * 15.2; return [img(F(aid), { frame: { x, y: 36, w: 11.5, h: 20.4, rotation: 0 }, mask: { shape: 'ellipse' }, href: '/library' }), cap(ma, x, 65, 14)]; }).flat(),
        cap('Vật liệu thật từ Thư viện — bấm một ô để mở kho.', 6, 80, 60)]),
      slide([meta('DEMO INDEX — TRANG CỦA NGƯỜI TRÌNH BÀY'),
        ...[['Trang chủ · Resume','/'],['Thiết kế 2D',`${P}/cad`],['Thiết kế 3D',`${P}/render`],['Ghế 3D (Ảnh→3D) — mở thẳng','/demo/ghe-3d'],['Files','/files'],['Thư viện','/library']].map(([ten, href], i) => { const col = i % 2, row = Math.floor(i / 2); return txt({ text: `→  ${ten}`, fontSize: 3.2, bold: true, color: INKW, href, frame: { x: 6 + col * 46, y: 16 + row * 10, w: 42, h: 7, rotation: 0 } }); }),
        cap('Hoạt động — mở bằng chuông góc phải trên (không có route riêng).', 6, 58, 84),
        cap('Thiết lập trang — cần gửi một tờ từ 2D trước (nút "Gửi sang Trình chiếu").', 6, 63, 84),
        cap('Bấm mục nào là vào ngữ cảnh sống; viên "Quay về Trình bày" đưa về đúng trang này.', 6, 72, 84, SOFT)]),
    ];

    const key = `${userId}::/present-editor::${projectId}`;
    const db = await new Promise((res, rej) => { const r = indexedDB.open('interiorflow-sheets', 1); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const cu = await new Promise((res) => { const q = db.transaction('sheets', 'readonly').objectStore('sheets').get(key); q.onsuccess = () => res(q.result); });
        // ⚠️ `deck.id` BẮT BUỘC — `isValidDeck` (lib/present-editor/idfp.ts) đòi nó là chuỗi; thiếu
    // thì `importIdfp` LOẠI SẠCH mọi tờ và trả null, tức deck KHÔNG xuất/nhập `.idfp` được và
    // KHÔNG khôi phục được từ bản sao máy chủ. Bản dựng đầu 21/08 thiếu field này — bắt được khi
    // thử khôi phục sau khi xoá IndexedDB.
    const to = { id: 'presheet-gioithieu', name: 'Giới thiệu IF',
      deck: { id: 'deck-gioithieu-if', slides, fonts: '', transition: 'fade' } };
    const rec = cu && cu.sheets ? cu : { v: 1, activeId: to.id, sheets: [], ts: Date.now() };
    const i = rec.sheets.findIndex((s) => s.id === to.id);
    if (i >= 0) rec.sheets[i] = { ...rec.sheets[i], ...to }; else rec.sheets.unshift(to);
    rec.activeId = to.id; rec.ts = Date.now();
    await new Promise((res, rej) => { const q = db.transaction('sheets', 'readwrite').objectStore('sheets').put(JSON.parse(JSON.stringify(rec)), key); q.onsuccess = res; q.onerror = () => rej(q.error); });
    return { khoa: key, soSlide: slides.length };
  };
})();
