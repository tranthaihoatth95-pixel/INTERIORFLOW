'use client';

import { useT, useLang } from '@/lib/i18n';
import { workhubNhungNgoaiBat } from '@/lib/workhub/cong';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AppWindow,
  Bot,
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
  Paperclip,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  Play,
  Plus,
  Search,
  Send,
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

type Message = { id: number; role: 'assistant' | 'user'; text: string };

const SERVICES: Service[] = [
  { id: 'mail', name: 'Mail', short: 'ML', url: 'https://outlook.office.com', icon: Mail, detail: 'Hộp thư và lịch làm việc' },
  { id: 'zalo', name: 'Zalo', short: 'ZL', url: 'https://chat.zalo.me', icon: MessageCircle, detail: 'Trao đổi với đồng đội' },
  { id: 'pinterest', name: 'Pinterest', short: 'PI', url: 'https://www.pinterest.com', icon: Pin, detail: 'Thu thập cảm hứng' },
  { id: 'youtube', name: 'YouTube', short: 'YT', url: 'https://www.youtube.com', icon: Play, detail: 'Video và nội dung tham khảo' },
  { id: 'office', name: 'Microsoft 365', short: 'M3', url: 'https://www.microsoft365.com', icon: FileText, detail: 'Word, Excel và PowerPoint' },
  { id: 'canvas', name: 'Canvas', short: 'CV', url: 'https://www.canva.com', icon: Sparkles, detail: 'Thiết kế nội dung trực quan' },
];

/**
 * ⚙️ IF-WORKHUB-CONTAINMENT-001 (27/08) — lời chào KHÔNG nhúng tên riêng.
 *
 * Bản trước: `'Chào Hoa. …'` — nhúng cứng tên một người vào sản phẩm. Vi phạm thẳng LUẬT NỀN
 * TẢNG (`CLAUDE.md`): IF là sản phẩm toàn cầu, trung tính, không mang tên người hay studio nào.
 * Một studio khác mở app ra và được chào bằng tên người lạ — đó không phải lỗi chính tả, đó là
 * sản phẩm nói rằng nó thuộc về người khác.
 *
 * Lane `IF-UXUI-RUNTIME-001` đo được câu này **trên runtime, ở bề mặt chưa đăng nhập**.
 */
function loiChaoBanDau(tr: (vi: string, en: string) => string): Message[] {
  return [
    {
      id: 1,
      role: 'assistant',
      text: tr(
        'Tôi có thể đọc ngữ cảnh từ các cửa sổ đang mở và giúp bạn biến chúng thành công việc, email hoặc tài liệu.',
        'I can read context from your open windows and turn it into tasks, emails, or documents.',
      ),
    },
  ];
}

/** Ngày HÔM NAY theo ngôn ngữ đang chọn — thay cho một chuỗi đóng băng trong mã. */
function ngayHomNay(lang: string): string {
  return new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function normalizeUrl(value: string) {
  const clean = value.trim();
  if (!clean) return '';
  return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
}

function WebPane({ service, onClose }: { service: Service; onClose?: () => void }) {
  const tr = useT();
  /**
   * ⚙️ IF-WORKHUB-CONTAINMENT-001 — nhúng miền NGOÀI phải sau cờ riêng, mặc định TẮT.
   *
   * Bản trước nhúng thẳng `outlook.office.com` · `pinterest.com` · `chat.zalo.me` ·
   * `microsoft365.com` · `canva.com` · `youtube.com` bằng `<iframe>`, **ở bề mặt chưa đăng
   * nhập**. Ba vấn đề, không phải một:
   *   ① mở một cửa ra Internet ngay trong vỏ app — bề mặt tấn công mà phần còn lại của IF
   *     (local-first, loopback, `contextIsolation`) cố ý không có;
   *   ② ô địa chỉ nhận **URL tuỳ ý** người dùng gõ và nhúng luôn — không allowlist, không kiểm;
   *   ③ chọn đúng sáu dịch vụ của MỘT lối làm việc cụ thể — trái LUẬT NỀN TẢNG về trung tính.
   *
   * Cờ tách riêng khỏi cờ `/workhub` có chủ ý (`lib/workhub/cong.ts` giải thích).
   */
  const nhungNgoai = workhubNhungNgoaiBat();
  const [address, setAddress] = useState(service.url);
  const [liveUrl, setLiveUrl] = useState('');

  const openAddress = (event: FormEvent) => {
    event.preventDefault();
    if (!nhungNgoai) return; // cờ tắt ⇒ ô địa chỉ không nhúng được gì, kể cả URL gõ tay
    setLiveUrl(normalizeUrl(address));
  };

  return (
    <section className={styles.webPane} aria-label={`Cửa sổ ${service.name}`}>
      <header className={styles.browserBar}>
        <div className={styles.traffic} aria-hidden="true"><i /><i /><i /></div>
        <form className={styles.addressBar} onSubmit={openAddress}>
          <Globe2 size={16} />
          <input
            aria-label={tr('Địa chỉ trang web', 'Web address')}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            disabled={!nhungNgoai}
          />
          <button type="submit" disabled={!nhungNgoai}>{tr('Mở', 'Open')}</button>
        </form>
        <button className={styles.iconButton} aria-label="Phóng to cửa sổ"><Maximize2 size={18} /></button>
        {onClose && <button className={styles.iconButton} aria-label="Đóng cửa sổ" onClick={onClose}><X size={18} /></button>}
      </header>

      {liveUrl && nhungNgoai ? (
        <iframe className={styles.frame} src={liveUrl} title={service.name} />
      ) : (
        <div className={styles.serviceHome}>
          <div className={styles.serviceMark}>{service.short}</div>
          <p className={styles.eyebrow}>Cửa sổ làm việc</p>
          <h2>{service.name}</h2>
          <p>{service.detail}</p>
          {nhungNgoai ? (
            <button className={styles.primaryButton} onClick={() => setLiveUrl(service.url)}>
              <Globe2 size={18} /> {tr('Mở trang web', 'Open website')}
            </button>
          ) : (
            /* Cờ tắt: nói RÕ vì sao, không để nút chết câm. "Bị tắt" ≠ "hỏng" ≠ "chưa có gì" —
               đúng trục trạng thái mà lane UX đo được là đã sập ở các màn khác. */
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: 'var(--t4)', maxWidth: 300 }}>
              {tr(
                'Nhúng trang ngoài đang tắt ở bản này. Không phải lỗi — đây là lựa chọn an toàn mặc định.',
                'Embedding external sites is disabled in this build. Not an error — this is the safe default.',
              )}
            </p>
          )}
          <span>Một số dịch vụ yêu cầu mở trong ứng dụng desktop để đăng nhập.</span>
        </div>
      )}
    </section>
  );
}

export default function WorkHubShell() {
  const tr = useT();
  const lang = useLang();
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [paneCount, setPaneCount] = useState<1 | 2 | 3>(2);
  const [paneServices, setPaneServices] = useState(['mail', 'pinterest', 'office']);
  const [messages, setMessages] = useState<Message[]>(() => loiChaoBanDau(tr));
  const [draft, setDraft] = useState('');
  const [contextEnabled, setContextEnabled] = useState(true);
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

  const submitMessage = (event: FormEvent) => {
    event.preventDefault();
    const clean = draft.trim();
    if (!clean) return;
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: 'user', text: clean },
      {
        id: Date.now() + 1,
        role: 'assistant',
        text: contextEnabled
          ? `Tôi đã ghi nhận yêu cầu và đang dùng ngữ cảnh từ ${panes.map((pane) => pane.name).join(' · ')}. Bạn muốn tôi tạo tài liệu hay chuẩn bị các bước thực hiện?`
          : 'Tôi đã ghi nhận yêu cầu. Hãy bật “Dùng ngữ cảnh cửa sổ” nếu bạn muốn tôi tham chiếu nội dung đang mở.',
      },
    ]);
    setDraft('');
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

      {assistantOpen ? (
        <aside className={styles.assistant}>
          <header className={styles.assistantHeader}>
            <div className={styles.assistantTitle}>
              <span className={styles.aiMark}><Bot size={18} /></span>
              <div><strong>Trợ lý công việc</strong><small>ChatGPT</small></div>
            </div>
            <button className={styles.iconButton} aria-label="Thu gọn trợ lý" onClick={() => setAssistantOpen(false)}><PanelLeftClose size={16} /></button>
          </header>

          <div className={styles.contextRow}>
            <button className={contextEnabled ? styles.contextOn : styles.contextOff} onClick={() => setContextEnabled((value) => !value)}>
              <AppWindow size={14} /> Dùng ngữ cảnh cửa sổ <span>{contextEnabled ? 'Bật' : 'Tắt'}</span>
            </button>
          </div>

          <div className={styles.messages}>
            {messages.map((message) => (
              <div key={message.id} className={message.role === 'user' ? styles.userMessage : styles.aiMessage}>
                {message.role === 'assistant' && <span className={styles.messageAvatar}><Bot size={14} /></span>}
                <p>{message.text}</p>
              </div>
            ))}
          </div>

          <div className={styles.quickActions}>
            <button onClick={() => setDraft('Tóm tắt các cửa sổ đang mở')}><Sparkles size={14} /> Tóm tắt</button>
            <button onClick={() => setDraft('Tạo danh sách công việc tiếp theo')}><LayoutPanelLeft size={14} /> Tạo việc</button>
            <button onClick={() => setDraft('Soạn email phản hồi dựa trên nội dung đang mở')}><Mail size={14} /> Soạn email</button>
          </div>

          <form className={styles.composer} onSubmit={submitMessage}>
            <textarea rows={3} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Bạn muốn làm gì?" />
            <div>
              <button type="button" className={styles.iconButton} aria-label="Đính kèm"><Paperclip size={16} /></button>
              <span>Enter để gửi</span>
              <button type="submit" className={styles.sendButton} aria-label="Gửi"><Send size={16} /></button>
            </div>
          </form>
        </aside>
      ) : (
        <button className={styles.openAssistant} onClick={() => setAssistantOpen(true)} aria-label="Mở trợ lý"><PanelLeftOpen size={18} /></button>
      )}

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <div>
            <strong>Không gian làm việc</strong>
            {/* IF-WORKHUB-CONTAINMENT-001 — bản trước ghi cứng 'Thứ Hai, 17 tháng 8'. Một ngày
                đóng băng nằm ngay cạnh chữ "Không gian làm việc" là app nói dối về thời gian
                thực; và nó cũng là dấu vết của một lần chụp màn hình bị bỏ quên trong mã. */}
            <span suppressHydrationWarning>{ngayHomNay(lang)}</span>
          </div>
          <div className={styles.topActions}>
            <label className={styles.search}><Search size={14} /><input placeholder="Tìm tab hoặc công cụ" /></label>
            <button className={styles.themeButton} onClick={toggleTheme} aria-label={theme === 'light' ? 'Dùng giao diện tối' : 'Dùng giao diện sáng'}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <div className={styles.layoutPicker}>
              {[1, 2, 3].map((count) => (
                <button key={count} className={paneCount === count ? styles.layoutActive : ''} onClick={() => setPaneCount(count as 1 | 2 | 3)} aria-label={`${count} cửa sổ`}>
                  {count === 1 ? <AppWindow size={16} /> : count === 2 ? <LayoutPanelLeft size={16} /> : <Grid2X2 size={16} />}
                </button>
              ))}
            </div>
            <button className={styles.addButton}><Plus size={18} /> Thêm cửa sổ</button>
          </div>
        </header>

        <div className={styles.paneTabs}>
          {panes.map((pane, index) => (
            <label key={`${pane.id}-${index}`}>
              <span>{pane.short}</span>
              <select value={pane.id} onChange={(event) => setPaneService(index, event.target.value)} aria-label={`Dịch vụ cửa sổ ${index + 1}`}>
                {SERVICES.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
              </select>
              <ChevronDown size={16} />
            </label>
          ))}
          <button aria-label="Tùy chọn cửa sổ"><MoreHorizontal size={16} /></button>
        </div>

        <div className={`${styles.panes} ${styles[`panes${paneCount}`]}`}>
          {panes.map((pane, index) => <WebPane key={`${pane.id}-${index}`} service={pane} />)}
        </div>

        <footer className={styles.creatorDock}>
          <div className={styles.dockLabel}><Sparkles size={18} /><span><strong>Tạo cùng trợ lý</strong><small>Từ nội dung đang mở</small></span></div>
          {[
            ['doc', 'Tài liệu', FileText],
            ['sheet', 'Bảng tính', FileSpreadsheet],
            ['design', 'Thiết kế', Sparkles],
          ].map(([id, label, Icon]) => (
            <button key={id as string} className={activeCreator === id ? styles.creatorActive : ''} onClick={() => setActiveCreator(id as string)}>
              <Icon size={18} /> {label as string}
            </button>
          ))}
          <button className={styles.moreCreator}><Plus size={18} /> Công cụ khác</button>
        </footer>
      </section>
    </main>
  );
}
