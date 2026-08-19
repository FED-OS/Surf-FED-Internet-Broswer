// ============================================================
//  renderer.js – All low‑complexity features combined
// ============================================================

// ---- State ----
let tabs = [];
let activeTabId = null;
let tabIdCounter = 0;
let lastClosedTabs = [];

let history = JSON.parse(localStorage.getItem('history') || '[]');
let bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
let settings = JSON.parse(localStorage.getItem('settings') || '{"theme":"light","searchEngine":"google"}');

// ---- DOM refs ----
const urlBar = document.getElementById('urlBar');
const tabsContainer = document.getElementById('tabsContainer');
const webviewContainer = document.getElementById('webviewContainer');

const newTabBtn = document.getElementById('newTabBtn');
const backBtn = document.getElementById('backBtn');
const forwardBtn = document.getElementById('forwardBtn');
const reloadBtn = document.getElementById('reloadBtn');
const homeBtn = document.getElementById('homeBtn');
const bookmarkStarBtn = document.getElementById('bookmarkStarBtn');
const bookmarksListBtn = document.getElementById('bookmarksListBtn');
const historyBtn = document.getElementById('historyBtn');
const duplicateBtn = document.getElementById('duplicateBtn');
const darkModeBtn = document.getElementById('darkModeBtn');
const settingsBtn = document.getElementById('settingsBtn');

const historyPanel = document.getElementById('historyPanel');
const bookmarksPanel = document.getElementById('bookmarksPanel');
const settingsPanel = document.getElementById('settingsPanel');
const historyList = document.getElementById('historyList');
const bookmarkList = document.getElementById('bookmarkList');
const historySearch = document.getElementById('historySearch');
const bookmarkSearch = document.getElementById('bookmarkSearch');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const clearAllDataBtn = document.getElementById('clearAllDataBtn');
const themeSelect = document.getElementById('themeSelect');
const searchEngineSelect = document.getElementById('searchEngineSelect');

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
function createTab(url = 'about:blank', isActive = true) {
  const id = ++tabIdCounter;
  const tab = { id, url, title: 'New Tab', webview: null };
  tabs.push(tab);

  const webview = document.createElement('webview');
  webview.setAttribute('src', url);
  webview.style.display = 'none';
  webviewContainer.appendChild(webview);
  tab.webview = webview;

  webview.addEventListener('did-stop-loading', () => {
    tab.title = webview.getTitle() || 'New Tab';
    const currentUrl = webview.getURL();
    urlBar.value = currentUrl;
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
    urlBar.value = webview.getURL();
    updateBookmarkStar();
  });

  const tabEl = document.createElement('div');
  tabEl.className = 'tab';
  tabEl.dataset.id = id;
  tabEl.innerHTML = `<span>${tab.title}</span><button class="close-tab">×</button>`;
  tabEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-tab')) return;
    activateTab(id);
  });
  tabEl.querySelector('.close-tab').addEventListener('click', (e) => {
    e.stopPropagation();
    closeTab(id);
  });
  tabEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (confirm('Duplicate this tab?')) duplicateTab(id);
  });
  tabsContainer.appendChild(tabEl);

  if (isActive) activateTab(id);
  else tab.webview.style.display = 'none';
  updateTabUI();
  return tab;
}

function activateTab(id) {
  activeTabId = id;
  tabs.forEach(t => {
    const isActive = t.id === id;
    t.webview.style.display = isActive ? 'inline-flex' : 'none';
    if (isActive) urlBar.value = t.webview.getURL();
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
  tabsContainer.children[idx]?.remove();
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
  const tabEls = tabsContainer.querySelectorAll('.tab');
  tabEls.forEach((el, i) => {
    const tab = tabs[i];
    if (!tab) return;
    el.classList.toggle('active', tab.id === activeTabId);
    el.querySelector('span').textContent = tab.title;
  });
}

// ---- Navigation ----
function navigateTo(url) {
  if (!url) return;
  if (!url.includes('.') && !url.startsWith('http')) {
    const engines = {
      google: `https://www.google.com/search?q=${encodeURIComponent(url)}`,
      bing: `https://www.bing.com/search?q=${encodeURIComponent(url)}`,
      duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(url)}`
    };
    url = engines[settings.searchEngine] || engines.google;
  } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab) {
    tab.webview.loadURL(url);
    urlBar.value = url;
  }
}

function goHome() {
  navigateTo('https://www.google.com');
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

// ---- Event listeners for buttons ----
historyBtn.addEventListener('click', () => togglePanel(historyPanel));
bookmarksListBtn.addEventListener('click', () => togglePanel(bookmarksPanel));
settingsBtn.addEventListener('click', () => togglePanel(settingsPanel));
bookmarkStarBtn.addEventListener('click', toggleBookmark);

duplicateBtn.addEventListener('click', () => {
  if (activeTabId) duplicateTab(activeTabId);
});

newTabBtn.addEventListener('click', () => createTab());
backBtn.addEventListener('click', () => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab) tab.webview.goBack();
});
forwardBtn.addEventListener('click', () => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab) tab.webview.goForward();
});
reloadBtn.addEventListener('click', () => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab) tab.webview.reload();
});
homeBtn.addEventListener('click', goHome);

// ---- Search/filter for panels ----
historySearch.addEventListener('input', () => renderHistory(historySearch.value));
bookmarkSearch.addEventListener('input', () => renderBookmarks(bookmarkSearch.value));
clearHistoryBtn.addEventListener('click', () => { clearHistory(); renderHistory(); });
clearAllDataBtn.addEventListener('click', clearAllData);

// ---- URL bar ----
urlBar.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    navigateTo(urlBar.value);
    closeAllPanels();
  }
});
urlBar.addEventListener('focus', () => urlBar.select());

// ---- Keyboard shortcuts ----
document.addEventListener('keydown', (e) => {
  const ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && e.key === 't') { e.preventDefault(); createTab(); }
  if (ctrl && e.key === 'w') { e.preventDefault(); if (activeTabId) closeTab(activeTabId); }
  if (ctrl && e.key === 'l') { e.preventDefault(); urlBar.focus(); }
  if (ctrl && e.key === 'r') { e.preventDefault(); reload(); }
  if (ctrl && e.shiftKey && e.key === 'T') { e.preventDefault(); restoreClosedTab(); }
  if (ctrl && e.key === 'd') { e.preventDefault(); toggleBookmark(); }
  if (ctrl && e.key === 'Tab') { e.preventDefault(); switchTab(1); }
  if (ctrl && e.shiftKey && e.key === 'Tab') { e.preventDefault(); switchTab(-1); }
  if (e.key === 'F5') { e.preventDefault(); reload(); }
});

function switchTab(delta) {
  const idx = tabs.findIndex(t => t.id === activeTabId);
  if (idx === -1) return;
  const newIdx = (idx + delta + tabs.length) % tabs.length;
  activateTab(tabs[newIdx].id);
}

// ---- Init ----
createTab('https://www.google.com', true);
renderHistory();
renderBookmarks();
updateBookmarkStar();

console.log('Browser loaded with all low‑complexity features!');
