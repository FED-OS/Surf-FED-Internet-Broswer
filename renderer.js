let tabs = [];
let activeTabId = null;
let tabIdCounter = 0;

const urlBar = document.getElementById('urlBar');
const tabsContainer = document.getElementById('tabsContainer');
const webviewContainer = document.getElementById('webviewContainer');
const newTabBtn = document.getElementById('newTabBtn');
const backBtn = document.getElementById('backBtn');
const forwardBtn = document.getElementById('forwardBtn');
const reloadBtn = document.getElementById('reloadBtn');

function createTab(url = 'about:blank', isActive = true) {
  const id = ++tabIdCounter;
  const tab = { id, title: 'New Tab', webview: null };
  tabs.push(tab);

  const webview = document.createElement('webview');
  webview.setAttribute('src', url);
  webview.style.display = 'none';
  webviewContainer.appendChild(webview);
  tab.webview = webview;

  webview.addEventListener('did-stop-loading', () => {
    tab.title = webview.getTitle() || 'New Tab';
    urlBar.value = webview.getURL();
    updateTabUI();
  });
  webview.addEventListener('page-title-updated', (e) => {
    tab.title = e.title || 'New Tab';
    updateTabUI();
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
}

function closeTab(id) {
  const idx = tabs.findIndex(t => t.id === id);
  if (idx === -1) return;
  tabs[idx].webview.remove();
  tabs.splice(idx, 1);
  tabsContainer.children[idx]?.remove();
  if (tabs.length === 0) createTab();
  else if (activeTabId === id) activateTab(tabs[Math.min(idx, tabs.length - 1)].id);
  updateTabUI();
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

function navigateTo(url) {
  if (!url) return;
  if (!url.includes('.') && !url.startsWith('http')) {
    url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
  } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab) {
    tab.webview.loadURL(url);
    urlBar.value = url;
  }
}

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
urlBar.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') navigateTo(urlBar.value);
});

createTab('https://www.google.com', true);
