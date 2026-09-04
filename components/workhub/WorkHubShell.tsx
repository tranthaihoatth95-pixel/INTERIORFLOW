'use client';

/**
 * WorkHub — nhiều cửa sổ web cạnh nhau (chia 1/2/3 ngăn, thanh địa chỉ, dock tạo tệp).
 *
 * 🔴 04/09 — ĐÃ GỠ "TRỢ LÝ CÔNG VIỆC" KHỎI MÀN NÀY. Hai lý do, cả hai đo được:
 *
 *   ① **Trong IF, mặt AI là VITALS — không có mặt AI thứ hai** (chủ dự án chốt 04/09,
 *      nguyên văn: *"chat gpt ko liên quan, trong if AI tương tác là vitals"*). Một ngăn
 *      trợ lý riêng ở đây là bề mặt AI thứ hai cạnh tranh với khẩu độ Vitals.
 *
 *   ② **Nó nói dối việc nó vừa làm — tệ hơn một nút chết.** `submitMessage()` cũ nối thẳng
 *      một câu trả lời gõ cứng vào danh sách tin nhắn; `grep "fetch("` trong tệp này = **0**,
 *      không route API nào được gọi. Tệ hơn nữa, câu gõ cứng đó còn KHẲNG ĐỊNH
 *      *"đang dùng ngữ cảnh từ Mail · Pinterest"* và có công tắc *"Dùng ngữ cảnh cửa sổ ·
 *      Bật"*, trong khi **không dòng nào đọc nội dung pane** — pane là `<iframe>` khác gốc,
 *      trình duyệt KHÔNG cho đọc. Nút chết thì người dùng biết mà đi đường khác; nút nói dối
 *      thì họ tin.
 *
 * ⇒ Đường hỏi AI ở màn này (nếu cần) đi qua ĐÚNG khẩu độ Vitals như mọi màn khác
 *   (`components/studio/VitalsAperture.tsx`), không dựng bề mặt riêng ở đây.
 *
 * GIỮ NGUYÊN phần WorkHub thật sự làm được: rail đổi dịch vụ · chia 1/2/3 ngăn · thanh địa
 * chỉ + mở trang · đổi sáng/tối · dock tạo tệp.
 */

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AppWindow,
  ChevronDown,
  CirclePlus,
  FileSpreadsheet,
  FileText,
  Globe2,
  Grid2X2,
  LayoutPanelLeft,
  Mail,
  Maximize2,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Pin,
  Play,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import styles from './workhub.module.css';

type Service = {
  id: string;
  name: string;
  short: string;
  url: string;
  icon: typeof Globe2;
  detail: string;
};

const SERVICES: Service[] = [
  { id: 'mail', name: 'Mail', short: 'ML', url: 'https://outlook.office.com', icon: Mail, detail: 'Hộp thư và lịch làm việc' },
  { id: 'zalo', name: 'Zalo', short: 'ZL', url: 'https://chat.zalo.me', icon: MessageCircle, detail: 'Trao đổi với đồng đội' },
  { id: 'pinterest', name: 'Pinterest', short: 'PI', url: 'https://www.pinterest.com', icon: Pin, detail: 'Thu thập cảm hứng' },
  { id: 'youtube', name: 'YouTube', short: 'YT', url: 'https://www.youtube.com', icon: Play, detail: 'Video và nội dung tham khảo' },
  { id: 'office', name: 'Microsoft 365', short: 'M3', url: 'https://www.microsoft365.com', icon: FileText, detail: 'Word, Excel và PowerPoint' },
  { id: 'canvas', name: 'Canvas', short: 'CV', url: 'https://www.canva.com', icon: Sparkles, detail: 'Thiết kế nội dung trực quan' },
];

function normalizeUrl(value: string) {
  const clean = value.trim();
  if (!clean) return '';
  return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
}

function WebPane({ service, onClose }: { service: Service; onClose?: () => void }) {
  const [address, setAddress] = useState(service.url);
  const [liveUrl, setLiveUrl] = useState('');

  const openAddress = (event: FormEvent) => {
    event.preventDefault();
    setLiveUrl(normalizeUrl(address));
  };

  return (
    <section className={styles.webPane} aria-label={`Cửa sổ ${service.name}`}>
      <header className={styles.browserBar}>
        <div className={styles.traffic} aria-hidden="true"><i /><i /><i /></div>
        <form className={styles.addressBar} onSubmit={openAddress}>
          <Globe2 size={13} />
          <input aria-label="Địa chỉ trang web" value={address} onChange={(event) => setAddress(event.target.value)} />
          <button type="submit">Mở</button>
        </form>
        <button className={styles.iconButton} aria-label="Phóng to cửa sổ"><Maximize2 size={15} /></button>
        {onClose && <button className={styles.iconButton} aria-label="Đóng cửa sổ" onClick={onClose}><X size={15} /></button>}
      </header>

      {liveUrl ? (
        <iframe className={styles.frame} src={liveUrl} title={service.name} />
      ) : (
        <div className={styles.serviceHome}>
          <div className={styles.serviceMark}>{service.short}</div>
          <p className={styles.eyebrow}>Cửa sổ làm việc</p>
          <h2>{service.name}</h2>
          <p>{service.detail}</p>
          <button className={styles.primaryButton} onClick={() => setLiveUrl(service.url)}>
            <Globe2 size={15} /> Mở trang web
          </button>
          <span>Một số dịch vụ yêu cầu mở trong ứng dụng desktop để đăng nhập.</span>
        </div>
      )}
    </section>
  );
}

export default function WorkHubShell() {
  const [paneCount, setPaneCount] = useState<1 | 2 | 3>(2);
  const [paneServices, setPaneServices] = useState(['mail', 'pinterest', 'office']);
  const [activeCreator, setActiveCreator] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('theme');
    const nextTheme = requested === 'dark' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  };

  const panes = useMemo(
    () => paneServices.slice(0, paneCount).map((id) => SERVICES.find((service) => service.id === id) ?? SERVICES[0]),
    [paneCount, paneServices],
  );

  const setPaneService = (index: number, id: string) => {
    setPaneServices((current) => current.map((item, itemIndex) => itemIndex === index ? id : item));
  };

  return (
    <main className={styles.shell}>
      <aside className={styles.rail}>
        <div className={styles.logo}>W</div>
        <nav aria-label="Ứng dụng nhanh">
          {SERVICES.map((service, index) => {
            const Icon = service.icon;
            return (
              <button
                key={service.id}
                className={styles.railButton}
                aria-label={`Mở ${service.name}`}
                onClick={() => setPaneService(Math.min(index % paneCount, paneCount - 1), service.id)}
              >
                <Icon size={18} />
              </button>
            );
          })}
          <button className={styles.railButton} aria-label="Thêm ứng dụng"><CirclePlus size={18} /></button>
        </nav>
        <div className={styles.railBottom}>
          <button className={styles.railButton} aria-label="Cài đặt"><Settings2 size={18} /></button>
          <div className={styles.avatar}>H</div>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <div>
            <strong>Không gian làm việc</strong>
            <span>Thứ Hai, 17 tháng 8</span>
          </div>
          <div className={styles.topActions}>
            <label className={styles.search}><Search size={14} /><input placeholder="Tìm tab hoặc công cụ" /></label>
            <button className={styles.themeButton} onClick={toggleTheme} aria-label={theme === 'light' ? 'Dùng giao diện tối' : 'Dùng giao diện sáng'}>
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            </button>
            <div className={styles.layoutPicker}>
              {[1, 2, 3].map((count) => (
                <button key={count} className={paneCount === count ? styles.layoutActive : ''} onClick={() => setPaneCount(count as 1 | 2 | 3)} aria-label={`${count} cửa sổ`}>
                  {count === 1 ? <AppWindow size={15} /> : count === 2 ? <LayoutPanelLeft size={15} /> : <Grid2X2 size={15} />}
                </button>
              ))}
            </div>
            <button className={styles.addButton}><Plus size={15} /> Thêm cửa sổ</button>
          </div>
        </header>

        <div className={styles.paneTabs}>
          {panes.map((pane, index) => (
            <label key={`${pane.id}-${index}`}>
              <span>{pane.short}</span>
              <select value={pane.id} onChange={(event) => setPaneService(index, event.target.value)} aria-label={`Dịch vụ cửa sổ ${index + 1}`}>
                {SERVICES.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
              </select>
              <ChevronDown size={13} />
            </label>
          ))}
          <button aria-label="Tùy chọn cửa sổ"><MoreHorizontal size={16} /></button>
        </div>

        <div className={`${styles.panes} ${styles[`panes${paneCount}`]}`}>
          {panes.map((pane, index) => <WebPane key={`${pane.id}-${index}`} service={pane} />)}
        </div>

        {/* 04/09 — nhãn cũ ghi "Tạo cùng trợ lý · Từ nội dung đang mở": SAI HAI LẦN. Trợ lý đã gỡ
            khỏi màn này, và "từ nội dung đang mở" vốn chưa bao giờ đúng — pane là `<iframe>` khác
            gốc nên không đọc được nội dung. Nhãn nay chỉ nói đúng thứ dock làm: chọn loại tệp.
            🟡 NỢ CÒN LẠI, khai thẳng: ba nút dưới mới chỉ đổi mục đang chọn (`setActiveCreator`),
            CHƯA tạo tệp nào. Đó là nút chưa nối — khác họ với "nút nói dối" mà lượt này đi đóng,
            nên không tự sửa ở đây; ai nối thì nối vào đường tạo tệp thật. */}
        <footer className={styles.creatorDock}>
          <div className={styles.dockLabel}><Sparkles size={15} /><span><strong>Tạo tệp mới</strong><small>Chọn loại tệp</small></span></div>
          {[
            ['doc', 'Tài liệu', FileText],
            ['sheet', 'Bảng tính', FileSpreadsheet],
            ['design', 'Thiết kế', Sparkles],
          ].map(([id, label, Icon]) => (
            <button key={id as string} className={activeCreator === id ? styles.creatorActive : ''} onClick={() => setActiveCreator(id as string)}>
              <Icon size={15} /> {label as string}
            </button>
          ))}
          <button className={styles.moreCreator}><Plus size={15} /> Công cụ khác</button>
        </footer>
      </section>
    </main>
  );
}
