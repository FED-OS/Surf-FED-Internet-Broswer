// ============================================================
//  renderer.js – Surf‑FED Browser (fixed, single version)
// ============================================================

// ---- DOM refs (match the HTML) ----
const tabsEl = document.getElementById('tabs');
const newTabBtn = document.getElementById('new-tab-btn');
const webviewContainer = document.getElementById('webview-container');
const addressBar = document.getElementById('address-bar');
const goBtn = document.getElementById('go-btn');
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');
const reloadBtn = document.getElementById('reload-btn');
const homeBtn = document.getElementById('home-btn');
const bookmarkStarBtn = document.getElementById('bookmark-star-btn');
const bookmarksListBtn = document.getElementById('bookmarks-list-btn');
const historyBtn = document.getElementById('history-btn');
const duplicateBtn = document.getElementById('duplicate-btn');
const darkModeBtn = document.getElementById('dark-mode-btn');
const settingsBtn = document.getElementById('settings-btn');
const historyPanel = document.getElementById('history-panel');
const bookmarksPanel = document.getElementById('bookmarks-panel');
const settingsPanel = document.getElementById('settings-panel');
const historyList = document.getElementById('history-list');
const bookmarkList = document.getElementById('bookmark-list');
const historySearch = document.getElementById('history-search');
const bookmarkSearch = document.getElementById('bookmark-search');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const clearAllDataBtn = document.getElementById('clear-all-data-btn');
const themeSelect = document.getElementById('theme-select');
const searchEngineSelect = document.getElementById('search-engine-select');

const HOME_URL = 'https://www.google.com';

// ---- State ----
let tabs = [];
let activeTabId = null;
let tabIdCounter = 0;
let lastClosedTabs = [];

let history = JSON.parse(localStorage.getItem('history') || '[]');
let bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
let settings = JSON.parse(localStorage.getItem('settings') || '{"theme":"light","searchEngine":"google"}');

// ---- Normalize URL ----
function normalizeUrl(input) {
  const trimmed = input.trim();
  if (!trimmed) return HOME_URL;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w-]+(\.[\w-]+)+.*$/.test(trimmed)) return `https://${trimmed}`;
  const engines = {
    google: `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`,
    bing: `https://www.bing.com/search?q=${encodeURIComponent(trimmed)}`,
    duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`
  };
  return engines[settings.searchEngine] || engines.google;
}

// ---- Theme ----
function applyTheme(theme) {
  document.body.className = theme;
  themeSelect.value = theme;
}
applyTheme(settings.theme);

darkModeBtn.addEventListener('click', () => {
  const newTheme = settings.theme === 'light' ? 'dark' : 'light';
  settings.theme = newTheme;
  localStorage.setItem('settings', JSON.stringify(settings));
  applyTheme(newTheme);
});
themeSelect.addEventListener('change', () => {
  settings.theme = themeSelect.value;
  localStorage.setItem('settings', JSON.stringify(settings));
  applyTheme(settings.theme);
});

// ---- Search Engine ----
searchEngineSelect.value = settings.searchEngine;
searchEngineSelect.addEventListener('change', () => {
  settings.searchEngine = searchEngineSelect.value;
  localStorage.setItem('settings', JSON.stringify(settings));
});

// ---- Tab functions ----
function createTab(url = HOME_URL, isActive = true) {
  const id = ++tabIdCounter;
  const tab = { id, title: 'New Tab', url, webview: null };
  tabs.push(tab);

  const webview = document.createElement('webview');
  webview.setAttribute('src', url);
  webview.setAttribute('data-id', id);
  webview.setAttribute('allowpopups', 'true');
  webview.style.display = 'none';
  webviewContainer.appendChild(webview);
  tab.webview = webview;

  webview.addEventListener('did-stop-loading', () => {
    tab.title = webview.getTitle() || 'New Tab';
    const currentUrl = webview.getURL();
    addressBar.value = currentUrl;
    updateTabUI();
    if (currentUrl && currentUrl !== 'about:blank') {
      addHistory(currentUrl, tab.title);
    }
    updateBookmarkStar();
  });
  webview.addEventListener('page-title-updated', (e) => {
    tab.title = e.title || 'New Tab';
    updateTabUI();
  });
  webview.addEventListener('did-navigate', () => {
    addressBar.value = webview.getURL();
    updateBookmarkStar();
  });
  webview.addEventListener('did-navigate-in-page', () => {
    addressBar.value = webview.getURL();
  });
  webview.addEventListener('new-window', (e) => {
    createTab(e.url);
  });

  // Create tab element
  const tabEl = document.createElement('div');
  tabEl.className = 'tab';
  tabEl.dataset.id = id;
  tabEl.innerHTML = `<span class="tab-title">${tab.title}</span><span class="tab-close">✕</span>`;
  tabEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-close')) return;
    activateTab(id);
  });
  tabEl.querySelector('.tab-close').addEventListener('click', (e) => {
    e.stopPropagation();
    closeTab(id);
  });
  tabEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (confirm('Duplicate this tab?')) duplicateTab(id);
  });
  tabsEl.appendChild(tabEl);

  if (isActive) activateTab(id);
  else webview.style.display = 'none';
  updateTabUI();
  return tab;
}

function activateTab(id) {
  activeTabId = id;
  tabs.forEach(t => {
    const isActive = t.id === id;
    t.webview.style.display = isActive ? 'inline-flex' : 'none';
    if (isActive) addressBar.value = t.webview.getURL();
  });
  updateTabUI();
  updateBookmarkStar();
  closeAllPanels();
}

function closeTab(id) {
  const idx = tabs.findIndex(t => t.id === id);
  if (idx === -1) return;
  const tab = tabs[idx];
  const url = tab.webview.getURL();
  if (url && url !== 'about:blank') {
    lastClosedTabs.unshift({ url, title: tab.title });
    if (lastClosedTabs.length > 10) lastClosedTabs.pop();
  }
  tab.webview.remove();
  tabs.splice(idx, 1);
  tabsEl.children[idx]?.remove();
  if (tabs.length === 0) createTab();
  else if (activeTabId === id) activateTab(tabs[Math.min(idx, tabs.length - 1)].id);
  updateTabUI();
}

function duplicateTab(id) {
  const tab = tabs.find(t => t.id === id);
  if (!tab) return;
  const url = tab.webview.getURL();
  if (url && url !== 'about:blank') createTab(url, true);
}

function restoreClosedTab() {
  if (lastClosedTabs.length === 0) return;
  const item = lastClosedTabs.shift();
  createTab(item.url, true);
}

function updateTabUI() {
  const tabEls = tabsEl.querySelectorAll('.tab');
  tabEls.forEach((el, i) => {
    const tab = tabs[i];
    if (!tab) return;
    el.classList.toggle('active', tab.id === activeTabId);
    el.querySelector('.tab-title').textContent = tab.title;
  });
}

function switchTab(delta) {
  const idx = tabs.findIndex(t => t.id === activeTabId);
  if (idx === -1) return;
  const newIdx = (idx + delta + tabs.length) % tabs.length;
  activateTab(tabs[newIdx].id);
}

// ---- Navigation ----
function navigateTo(url) {
  if (!url) return;
  const normalized = normalizeUrl(url);
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab) {
    tab.webview.loadURL(normalized);
    addressBar.value = normalized;
  }
}

function goHome() {
  navigateTo(HOME_URL);
}

// ---- History ----
function addHistory(url, title) {
  if (!url || url === 'about:blank') return;
  history = history.filter(item => item.url !== url);
  history.unshift({ url, title, timestamp: Date.now() });
  if (history.length > 500) history.pop();
  localStorage.setItem('history', JSON.stringify(history));
}

function renderHistory(filter = '') {
  const filtered = history.filter(item =>
    item.title.toLowerCase().includes(filter.toLowerCase()) ||
    item.url.toLowerCase().includes(filter.toLowerCase())
  );
  historyList.innerHTML = filtered.map(item =>
    `<li data-url="${item.url}">${item.title || item.url}</li>`
  ).join('');
  historyList.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
      navigateTo(li.dataset.url);
      closeAllPanels();
    });
  });
}

function clearHistory() {
  history = [];
  localStorage.setItem('history', JSON.stringify(history));
  renderHistory();
}

// ---- Bookmarks ----
function toggleBookmark() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;
  const url = tab.webview.getURL();
  if (!url || url === 'about:blank') return;
  const idx = bookmarks.findIndex(b => b.url === url);
  if (idx > -1) {
    bookmarks.splice(idx, 1);
  } else {
    bookmarks.push({ url, title: tab.title || url });
  }
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  updateBookmarkStar();
  renderBookmarks();
}

function updateBookmarkStar() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab || !tab.webview) { bookmarkStarBtn.textContent = '☆'; return; }
  const url = tab.webview.getURL();
  const isBookmarked = bookmarks.some(b => b.url === url);
  bookmarkStarBtn.textContent = isBookmarked ? '⭐' : '☆';
}

function renderBookmarks(filter = '') {
  const filtered = bookmarks.filter(item =>
    item.title.toLowerCase().includes(filter.toLowerCase()) ||
    item.url.toLowerCase().includes(filter.toLowerCase())
  );
  bookmarkList.innerHTML = filtered.map(item =>
    `<li data-url="${item.url}">${item.title || item.url} <button class="remove-bookmark" data-url="${item.url}">✕</button></li>`
  ).join('');
  bookmarkList.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-bookmark')) return;
      navigateTo(li.dataset.url);
      closeAllPanels();
    });
    const removeBtn = li.querySelector('.remove-bookmark');
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = removeBtn.dataset.url;
        const idx = bookmarks.findIndex(b => b.url === url);
        if (idx > -1) bookmarks.splice(idx, 1);
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        renderBookmarks(bookmarkSearch.value);
        updateBookmarkStar();
      });
    }
  });
}

function clearAllData() {
  if (!confirm('Delete all history and bookmarks?')) return;
  history = [];
  bookmarks = [];
  localStorage.setItem('history', JSON.stringify(history));
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  renderHistory();
  renderBookmarks();
  updateBookmarkStar();
}

// ---- Panels ----
function closeAllPanels() {
  [historyPanel, bookmarksPanel, settingsPanel].forEach(p => p.classList.remove('visible'));
}
function togglePanel(panel) {
  const isVisible = panel.classList.contains('visible');
  closeAllPanels();
  if (!isVisible) panel.classList.add('visible');
  if (panel === historyPanel) renderHistory(historySearch.value);
  if (panel === bookmarksPanel) renderBookmarks(bookmarkSearch.value);
}

// ---- Event listeners ----
goBtn.addEventListener('click', () => navigateTo(addressBar.value));
addressBar.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') navigateTo(addressBar.value);
});
homeBtn.addEventListener('click', goHome);
backBtn.addEventListener('click', () => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab && tab.webview.canGoBack()) tab.webview.goBack();
});
forwardBtn.addEventListener('click', () => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab && tab.webview.canGoForward()) tab.webview.goForward();
});
reloadBtn.addEventListener('click', () => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab) tab.webview.reload();
});
newTabBtn.addEventListener('click', () => createTab());
duplicateBtn.addEventListener('click', () => {
  if (activeTabId) duplicateTab(activeTabId);
});
bookmarkStarBtn.addEventListener('click', toggleBookmark);
bookmarksListBtn.addEventListener('click', () => togglePanel(bookmarksPanel));
historyBtn.addEventListener('click', () => togglePanel(historyPanel));
settingsBtn.addEventListener('click', () => togglePanel(settingsPanel));

historySearch.addEventListener('input', () => renderHistory(historySearch.value));
bookmarkSearch.addEventListener('input', () => renderBookmarks(bookmarkSearch.value));
clearHistoryBtn.addEventListener('click', () => { clearHistory(); renderHistory(); });
clearAllDataBtn.addEventListener('click', clearAllData);

// ---- Keyboard shortcuts ----
document.addEventListener('keydown', (e) => {
  const ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && e.key === 't') { e.preventDefault(); createTab(); }
  if (ctrl && e.key === 'w') { e.preventDefault(); if (activeTabId) closeTab(activeTabId); }
  if (ctrl && e.key === 'l') { e.preventDefault(); addressBar.focus(); }
  if (ctrl && e.key === 'r') { e.preventDefault(); const tab = tabs.find(t => t.id === activeTabId); if (tab) tab.webview.reload(); }
  if (ctrl && e.shiftKey && e.key === 'T') { e.preventDefault(); restoreClosedTab(); }
  if (ctrl && e.key === 'd') { e.preventDefault(); toggleBookmark(); }
  if (ctrl && e.key === 'Tab') { e.preventDefault(); switchTab(1); }
  if (ctrl && e.shiftKey && e.key === 'Tab') { e.preventDefault(); switchTab(-1); }
  if (e.key === 'F5') { e.preventDefault(); const tab = tabs.find(t => t.id === activeTabId); if (tab) tab.webview.reload(); }
});

// ---- Init ----
createTab(HOME_URL, true);
renderHistory();
renderBookmarks();
updateBookmarkStar();
console.log('Surf‑FED browser loaded successfully!');
