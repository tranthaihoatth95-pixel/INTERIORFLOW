/**
 * support.js — bộ chạy tại chỗ cho các mock `.dc.html` của Claude Design.
 *
 * VÌ SAO CÓ TỆP NÀY (07/08):
 * 20/30 tệp mock mở đầu bằng `<script src="./support.js">`, nhưng tệp đó CHƯA BAO GIỜ
 * được lấy về cùng mock. Hệ quả khi mở bằng `file://`:
 *   · `<sc-if>` thành thẻ lạ → trình duyệt hiện ĐỦ CẢ 4 trạng thái CHỒNG LÊN NHAU
 *   · `{{ tên biến }}` giữ nguyên chữ thô, không thay bằng giá trị
 *   · nút bấm không đổi trạng thái vì `onClick="{{ ... }}"` không được nối
 * Đúng cái ảnh chủ dự án gửi: bốn màn đè lên nhau, chữ chồng chữ.
 * Tức là LỖI BÀN GIAO THIẾU TỆP, không phải lỗi thiết kế.
 *
 * Tệp này dựng lại đúng phần tối thiểu để mock chạy được ngoài Claude Design:
 *   ① lớp `DCLogic`   — state/props/setState, componentDidMount, componentDidUpdate
 *   ② `<sc-if>`        — giữ hay bỏ một nhánh
 *   ③ `<sc-for>`       — lặp danh sách (hoặc lặp theo `hint-placeholder-count` khi chưa có dữ liệu)
 *   ④ `{{ biểu thức }}`— thay trong cả nội dung chữ lẫn thuộc tính
 *   ⑤ `onClick="{{ hàm }}"` và các `on*` khác — nối vào addEventListener thật
 *   ⑥ `style-hover="..."` — đổi kiểu khi rê chuột
 *   ⑦ `<helmet>`       — đẩy <title>/<style> lên <head>
 *
 * KHÔNG phải bản dựng lại đầy đủ của Claude Design. Chỉ đủ để XEM và BẤM THỬ mock.
 * Nguồn sự thật của mock vẫn là chính tệp `.dc.html`.
 */
(function () {
  'use strict';

  /** Lớp nền mà mọi `class Component extends DCLogic` kế thừa. */
  class DCLogic {
    constructor(props) {
      this.props = props || {};
      if (!this.state) this.state = {};
    }
    setState(patch) {
      Object.assign(this.state, typeof patch === 'function' ? patch(this.state) : patch);
      if (this.__scheduleRender) this.__scheduleRender();
    }
    componentDidMount() {}
    componentDidUpdate() {}
    /** Mặc định: không có biến nào. Mock thật luôn ghi đè hàm này. */
    renderVals() { return {}; }
  }
  window.DCLogic = DCLogic;

  /* ─── đọc biểu thức trong {{ }} ─────────────────────────────────────────── */

  /**
   * Đọc một biểu thức đơn giản: `true`, `false`, số, chuỗi 'a', hoặc đường dẫn `a.b.c`.
   * Tra trong `scope` (biến của vòng lặp) trước, rồi tới `vals` (biến của component).
   * Cố ý KHÔNG dùng eval — mock là tệp cục bộ nhưng vẫn không nên mở cửa chạy mã tuỳ ý.
   */
  function docBieuThuc(raw, vals, scope) {
    const s = String(raw).trim();
    if (s === 'true') return true;
    if (s === 'false') return false;
    if (s === 'null' || s === 'undefined') return undefined;
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
    if (/^'.*'$/.test(s) || /^".*"$/.test(s)) return s.slice(1, -1);

    const phu = s.startsWith('!');
    const duong = (phu ? s.slice(1) : s).trim().split('.');
    let cur;
    const goc = duong[0];
    if (scope && Object.prototype.hasOwnProperty.call(scope, goc)) cur = scope[goc];
    else cur = vals ? vals[goc] : undefined;
    for (let i = 1; i < duong.length && cur != null; i++) cur = cur[duong[i]];
    return phu ? !cur : cur;
  }

  const RE_MOUSTACHE = /\{\{([^}]*)\}\}/g;

  /** Thay mọi `{{ }}` trong một chuỗi. Nếu chuỗi CHỈ là một `{{ }}` thì trả về giá trị gốc. */
  function thayChuoi(txt, vals, scope) {
    const chiMot = /^\s*\{\{([^}]*)\}\}\s*$/.exec(txt);
    if (chiMot) return docBieuThuc(chiMot[1], vals, scope);
    return txt.replace(RE_MOUSTACHE, (_, e) => {
      const v = docBieuThuc(e, vals, scope);
      return v == null ? '' : String(v);
    });
  }

  /* ─── dựng cây ──────────────────────────────────────────────────────────── */

  /**
   * Duyệt cây, xử lý theo thứ tự: sc-for → sc-if → thay {{ }} → nối sự kiện.
   * Làm trên bản sao rời (DocumentFragment), xong mới gắn vào trang — tránh nháy hình.
   */
  function dungCay(node, vals, scope) {
    // gom con trước vì danh sách con sẽ đổi khi ta thay thẻ
    const cons = Array.from(node.childNodes);
    for (const con of cons) {
      if (con.nodeType === Node.TEXT_NODE) {
        if (con.nodeValue.indexOf('{{') !== -1) {
          const v = thayChuoi(con.nodeValue, vals, scope);
          con.nodeValue = v == null ? '' : String(v);
        }
        continue;
      }
      if (con.nodeType !== Node.ELEMENT_NODE) continue;

      const ten = con.tagName.toLowerCase();

      /* ① sc-for — lặp danh sách */
      if (ten === 'sc-for') {
        const bieuThuc = con.getAttribute('list') || '';
        const bien = con.getAttribute('as') || 'item';
        const soMau = parseInt(con.getAttribute('hint-placeholder-count') || '0', 10);
        let ds = thayChuoi(bieuThuc, vals, scope);
        if (!Array.isArray(ds)) {
          // chưa có dữ liệu thật → lặp theo số gợi ý để mock vẫn thấy được bố cục
          ds = soMau > 0 ? Array.from({ length: soMau }, () => ({})) : [];
        }
        const frag = document.createDocumentFragment();
        ds.forEach((phanTu, i) => {
          const lan = document.createElement('div');
          lan.innerHTML = con.innerHTML;
          const scopeCon = Object.assign({}, scope);
          scopeCon[bien] = phanTu;
          scopeCon[bien + 'Index'] = i;
          dungCay(lan, vals, scopeCon);
          while (lan.firstChild) frag.appendChild(lan.firstChild);
        });
        con.replaceWith(frag);
        continue;
      }

      /* ② sc-if — giữ hay bỏ nhánh */
      if (ten === 'sc-if') {
        const bieuThuc = con.getAttribute('value') || '';
        let dieuKien = thayChuoi(bieuThuc, vals, scope);
        if (dieuKien === undefined && con.hasAttribute('hint-placeholder-val')) {
          // biến chưa có → dùng giá trị gợi ý mà Claude Design ghi kèm
          dieuKien = thayChuoi(con.getAttribute('hint-placeholder-val'), vals, scope);
        }
        if (!dieuKien) { con.remove(); continue; }
        const boc = document.createElement('div');
        boc.innerHTML = con.innerHTML;
        dungCay(boc, vals, scope);
        const frag = document.createDocumentFragment();
        while (boc.firstChild) frag.appendChild(boc.firstChild);
        con.replaceWith(frag);
        continue;
      }

      /* ③ thuộc tính: {{ }}, on*, style-hover */
      for (const attr of Array.from(con.attributes)) {
        const ten2 = attr.name;
        const giaTri = attr.value;

        if (/^on[A-Za-z]/.test(ten2) && giaTri.indexOf('{{') !== -1) {
          const fn = thayChuoi(giaTri, vals, scope);
          con.removeAttribute(ten2);
          if (typeof fn === 'function') {
            con.addEventListener(ten2.slice(2).toLowerCase(), (ev) => fn(ev));
          }
          continue;
        }

        if (ten2 === 'style-hover') {
          const goc = con.getAttribute('style') || '';
          con.addEventListener('mouseenter', () => { con.setAttribute('style', goc + ';' + giaTri); });
          con.addEventListener('mouseleave', () => { con.setAttribute('style', goc); });
          con.removeAttribute('style-hover');
          continue;
        }

        if (giaTri.indexOf('{{') !== -1) {
          const v = thayChuoi(giaTri, vals, scope);
          con.setAttribute(ten2, v == null ? '' : String(v));
        }
      }

      dungCay(con, vals, scope);
    }
  }

  /* ─── khởi động ─────────────────────────────────────────────────────────── */

  function chay() {
    const host = document.querySelector('x-dc');
    if (!host) return;

    // <helmet> chỉ đẩy lên <head> một lần, trước khi lưu bản gốc
    const helmet = host.querySelector('helmet');
    if (helmet) {
      while (helmet.firstChild) document.head.appendChild(helmet.firstChild);
      helmet.remove();
    }

    const BAN_GOC = host.innerHTML; // khuôn mẫu — không bao giờ sửa

    const scriptTag = document.querySelector('script[type="text/x-dc"]');
    let Component = null;
    let props = {};

    if (scriptTag) {
      // giá trị mặc định của props do Claude Design ghi trong data-props
      try {
        const khai = JSON.parse(scriptTag.getAttribute('data-props') || '{}');
        for (const k in khai) props[k] = khai[k].default;
      } catch (e) { /* không có props cũng chạy được */ }

      try {
        // eslint-disable-next-line no-new-func
        Component = new Function('DCLogic', scriptTag.textContent + '\nreturn Component;')(DCLogic);
      } catch (e) {
        console.error('[support.js] Không đọc được phần logic của mock:', e);
      }
    }

    const inst = Component ? new Component(props) : new DCLogic(props);
    if (!inst.props) inst.props = props;

    let daGan = false;
    let choXep = false;
    inst.__scheduleRender = function () {
      if (choXep) return;
      choXep = true;
      requestAnimationFrame(() => { choXep = false; ve(); });
    };

    function ve() {
      let vals = {};
      try { vals = inst.renderVals() || {}; }
      catch (e) { console.error('[support.js] renderVals lỗi:', e); }

      const boc = document.createElement('div');
      boc.innerHTML = BAN_GOC;
      dungCay(boc, vals, null);

      host.replaceChildren(...Array.from(boc.childNodes));

      if (!daGan) { daGan = true; inst.componentDidMount(); }
      else inst.componentDidUpdate();
    }

    ve();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chay);
  else chay();
})();
