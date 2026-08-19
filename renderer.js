const tabsEl = document.getElementById('tabs');
const newTabBtn = document.getElementById('new-tab-btn');
const webviewContainer = document.getElementById('webview-container');
const addressBar = document.getElementById('address-bar');
const goBtn = document.getElementById('go-btn');
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');
const reloadBtn = document.getElementById('reload-btn');

const HOME_URL = 'https://www.google.com';

let tabs = [];
let activeTabId = null;
let tabCounter = 0;

function normalizeUrl(input) {
  const trimmed = input.trim();
  if (!trimmed) return HOME_URL;

  const looksLikeUrl = /^https?:\/\//i.test(trimmed) || /^[\w-]+(\.[\w-]+)+.*$/.test(trimmed);

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (looksLikeUrl) return `https://${trimmed}`;

  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

function createTab(url = HOME_URL) {
  tabCounter += 1;
  const id = `tab-${tabCounter}`;

  const webview = document.createElement('webview');
  webview.setAttribute('src', url);
  webview.setAttribute('data-id', id);
  webview.setAttribute('allowpopups', 'true');
  webviewContainer.appendChild(webview);

  const tab = { id, title: 'New Tab', url, webview };
  tabs.push(tab);

  webview.addEventListener('page-title-updated', (e) => {
    tab.title = e.title;
    renderTabs();
  });

  webview.addEventListener('did-navigate', (e) => {
    tab.url = e.url;
    if (tab.id === activeTabId) addressBar.value = e.url;
  });

  webview.addEventListener('did-navigate-in-page', (e) => {
    tab.url = e.url;
    if (tab.id === activeTabId) addressBar.value = e.url;
  });

  webview.addEventListener('new-window', (e) => {
    createTab(e.url);
    setActiveTab(id === activeTabId ? id : tabs[tabs.length - 1].id);
  });

  setActiveTab(id);
  renderTabs();
  return tab;
}

function closeTab(id) {
  const index = tabs.findIndex((t) => t.id === id);
  if (index === -1) return;

  const [tab] = tabs.splice(index, 1);
  tab.webview.remove();

  if (tabs.length === 0) {
    createTab();
    return;
  }

  if (activeTabId === id) {
    const nextTab = tabs[index] || tabs[index - 1];
    setActiveTab(nextTab.id);
  }

  renderTabs();
}

function setActiveTab(id) {
  activeTabId = id;
  tabs.forEach((t) => {
    const isActive = t.id === id;
    t.webview.classList.toggle('active', isActive);
  });

  const tab = tabs.find((t) => t.id === id);
  if (tab) addressBar.value = tab.url;

  renderTabs();
}

function renderTabs() {
  tabsEl.innerHTML = '';
  tabs.forEach((t) => {
    const el = document.createElement('div');
    el.className = 'tab' + (t.id === activeTabId ? ' active' : '');

    const title = document.createElement('span');
    title.className = 'tab-title';
    title.textContent = t.title || t.url;

    const close = document.createElement('span');
    close.className = 'tab-close';
    close.textContent = '✕';
    close.addEventListener('click', (ev) => {
      ev.stopPropagation();
      closeTab(t.id);
    });

    el.appendChild(title);
    el.appendChild(close);
    el.addEventListener('click', () => setActiveTab(t.id));

    tabsEl.appendChild(el);
  });
}

function getActiveWebview() {
  const tab = tabs.find((t) => t.id === activeTabId);
  return tab ? tab.webview : null;
}

function navigateTo(input) {
  const url = normalizeUrl(input);
  const webview = getActiveWebview();
  if (webview) webview.loadURL(url);
}

// Toolbar events
goBtn.addEventListener('click', () => navigateTo(addressBar.value));
addressBar.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') navigateTo(addressBar.value);
});

backBtn.addEventListener('click', () => {
  const webview = getActiveWebview();
  if (webview && webview.canGoBack()) webview.goBack();
});

forwardBtn.addEventListener('click', () => {
  const webview = getActiveWebview();
  if (webview && webview.canGoForward()) webview.goForward();
});

reloadBtn.addEventListener('click', () => {
  const webview = getActiveWebview();
  if (webview) webview.reload();
});

newTabBtn.addEventListener('click', () => createTab());

// Start with one tab
createTab();
