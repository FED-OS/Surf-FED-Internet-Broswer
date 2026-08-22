const HOME_URL = 'https://www.google.com';

const tabsEl = document.getElementById('tabs');
const viewsEl = document.getElementById('views');
const addressBar = document.getElementById('address-bar');
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');
const reloadBtn = document.getElementById('reload-btn');
const homeBtn = document.getElementById('home-btn');
const goBtn = document.getElementById('go-btn');
const newTabBtn = document.getElementById('new-tab-btn');

let tabs = [];
let activeTabId = null;
let tabCounter = 0;

function normalizeUrl(input) {
  const trimmed = input.trim();
  if (!trimmed) return HOME_URL;
  const looksLikeUrl = /^https?:\/\//i.test(trimmed) || /^[\w-]+(\.[\w-]+)+.*$/.test(trimmed);
  if (looksLikeUrl) {
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

function createTab(url = HOME_URL) {
  const id = `tab-${++tabCounter}`;

  const tabEl = document.createElement('div');
  tabEl.className = 'tab';
  tabEl.dataset.id = id;
  tabEl.innerHTML = `
    <span class="tab-title">New Tab</span>
    <img class="tab-close" src="assets/icons/ui/close.png" alt="Close" />
  `;
  tabEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-close')) return;
    setActiveTab(id);
  });
  tabEl.querySelector('.tab-close').addEventListener('click', (e) => {
    e.stopPropagation();
    closeTab(id);
  });
  tabsEl.appendChild(tabEl);

  const webview = document.createElement('webview');
  webview.src = url;
  webview.dataset.id = id;
  viewsEl.appendChild(webview);

  webview.addEventListener('page-title-updated', (e) => {
    tabEl.querySelector('.tab-title').textContent = e.title;
  });
  webview.addEventListener('did-navigate', (e) => {
    if (id === activeTabId) addressBar.value = e.url;
  });
  webview.addEventListener('did-navigate-in-page', (e) => {
    if (id === activeTabId) addressBar.value = e.url;
  });

  tabs.push({ id, tabEl, webview });
  setActiveTab(id);
}

function setActiveTab(id) {
  activeTabId = id;
  tabs.forEach((t) => {
    const isActive = t.id === id;
    t.tabEl.classList.toggle('active', isActive);
    t.webview.classList.toggle('active', isActive);
    if (isActive) addressBar.value = t.webview.src || '';
  });
}

function closeTab(id) {
  const index = tabs.findIndex((t) => t.id === id);
  if (index === -1) return;
  const { tabEl, webview } = tabs[index];
  tabEl.remove();
  webview.remove();
  tabs.splice(index, 1);

  if (tabs.length === 0) {
    createTab();
    return;
  }
  if (activeTabId === id) {
    const next = tabs[Math.max(0, index - 1)];
    setActiveTab(next.id);
  }
}

function getActiveWebview() {
  const t = tabs.find((t) => t.id === activeTabId);
  return t ? t.webview : null;
}

function navigateTo(input) {
  const wv = getActiveWebview();
  if (!wv) return;
  wv.src = normalizeUrl(input);
}

// Toolbar wiring
backBtn.addEventListener('click', () => {
  const wv = getActiveWebview();
  if (wv && wv.canGoBack()) wv.goBack();
});
forwardBtn.addEventListener('click', () => {
  const wv = getActiveWebview();
  if (wv && wv.canGoForward()) wv.goForward();
});
reloadBtn.addEventListener('click', () => {
  const wv = getActiveWebview();
  if (wv) wv.reload();
});
homeBtn.addEventListener('click', () => navigateTo(HOME_URL));
goBtn.addEventListener('click', () => navigateTo(addressBar.value));
addressBar.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') navigateTo(addressBar.value);
});
newTabBtn.addEventListener('click', () => createTab());

// Start with one tab
createTab();
