// No Node.js modules – pure DOM + webview APIs

let tabs = [];
let activeTabId = 0;
let tabIdCounter = 0;

const container = document.getElementById('webviewContainer');
const tabBar = document.getElementById('tabBar');
const addressBar = document.getElementById('addressBar');
const newTabBtn = document.getElementById('newTabBtn');

// Navigation buttons
document.getElementById('backBtn').addEventListener('click', () => {
  const webview = getActiveWebview();
  if (webview && webview.canGoBack()) webview.goBack();
});
document.getElementById('forwardBtn').addEventListener('click', () => {
  const webview = getActiveWebview();
  if (webview && webview.canGoForward()) webview.goForward();
});
document.getElementById('reloadBtn').addEventListener('click', () => {
  const webview = getActiveWebview();
  if (webview) webview.reload();
});

// Address bar – handles URLs, localhost, and search terms
addressBar.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;

  const input = addressBar.value.trim();
  if (!input) return;

  const webview = getActiveWebview();
  if (!webview) return;

  let finalUrl;
  if (/^https?:\/\//i.test(input)) {
    finalUrl = input;
  } else if (/^localhost(:\d+)?(\/.*)?$/i.test(input)) {
    finalUrl = `http://${input}`;
  } else if (/^[^\s]+\.[^\s]+$/.test(input)) {
    finalUrl = `https://${input}`;
  } else {
    finalUrl = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
  }

  webview.src = finalUrl;
  webview.focus();
});

// New tab
newTabBtn.addEventListener('click', () => createTab('https://google.com'));

function createTab(url) {
  const id = ++tabIdCounter;
  const webview = document.createElement('webview');

  // Attach to DOM first, then set src to avoid lifecycle timing issues
  webview.id = `webview-${id}`;
  webview.classList.add('active');
  container.appendChild(webview);

  // Set src after append
  webview.src = url;

  const updateAddressBar = () => {
    if (activeTabId === id) {
      addressBar.value = webview.getURL();
    }
  };

  webview.addEventListener('did-navigate', updateAddressBar);
  webview.addEventListener('did-navigate-in-page', updateAddressBar);

  webview.addEventListener('page-title-updated', (e) => {
    const tabEl = document.querySelector(`.tab[data-id="${id}"]`);
    if (tabEl) {
      const titleSpan = tabEl.querySelector('.tab-title');
      if (titleSpan) titleSpan.textContent = e.title || 'New Tab';
    }
  });

  const tabEl = document.createElement('div');
  tabEl.className = 'tab active';
  tabEl.dataset.id = id;
  tabEl.innerHTML = `
    <span class="tab-title">${url || 'New Tab'}</span>
    <button class="closeTab">✕</button>
  `;
  tabBar.appendChild(tabEl);

  tabEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('closeTab')) return;
    switchTab(id);
  });

  tabEl.querySelector('.closeTab').addEventListener('click', (e) => {
    e.stopPropagation();
    closeTab(id);
  });

  tabs.push({ id, webview, tabEl });
  switchTab(id);
  return id;
}

function switchTab(id) {
  activeTabId = id;
  document.querySelectorAll('webview').forEach(wv => wv.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

  const tab = tabs.find(t => t.id === id);
  if (tab) {
    tab.webview.classList.add('active');
    tab.tabEl.classList.add('active');
    addressBar.value = tab.webview.getURL() || '';
  }
}

function closeTab(id) {
  if (tabs.length === 1) {
    const tab = tabs[0];
    tab.webview.remove();
    tab.tabEl.remove();
    tabs = [];
    createTab('https://google.com');
    return;
  }

  const index = tabs.findIndex(t => t.id === id);
  if (index === -1) return;
  const tab = tabs[index];
  tab.webview.remove();
  tab.tabEl.remove();
  tabs.splice(index, 1);

  if (activeTabId === id) {
    const newIndex = Math.min(index, tabs.length - 1);
    switchTab(tabs[newIndex].id);
  }
}

function getActiveWebview() {
  const tab = tabs.find(t => t.id === activeTabId);
  return tab ? tab.webview : null;
}

// Start with one tab
createTab('https://google.com');
