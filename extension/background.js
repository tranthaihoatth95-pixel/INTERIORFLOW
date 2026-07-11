// InteriorFlow Clipper — service worker (MV3). KHUNG tối giản: chuột phải ảnh trên web →
// gửi tới /api/library/clip. Auth: dựa cookie same-origin của app (user đã đăng nhập trong
// cùng trình duyệt). ⚠ Cross-origin cookie có giới hạn → cơ chế token riêng là hạng mục sau
// (xem README). Đặt APP_ORIGIN đúng nơi app chạy.
const APP_ORIGIN = 'http://localhost:3000';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'if-clip-image',
    title: 'Clip ảnh vào InteriorFlow',
    contexts: ['image'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'if-clip-image' || !info.srcUrl) return;
  try {
    const res = await fetch(`${APP_ORIGIN}/api/library/clip`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: info.srcUrl, sourceUrl: tab?.url, name: 'Clip: ' + (tab?.title || 'web') }),
    });
    const ok = res.ok;
    chrome.action.setBadgeText({ text: ok ? 'OK' : 'ERR' });
    setTimeout(() => chrome.action.setBadgeText({ text: '' }), 2000);
  } catch (e) {
    chrome.action.setBadgeText({ text: 'ERR' });
  }
});
