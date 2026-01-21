// DOM Elements
const grid = document.getElementById('session-grid');
const saveBtn = document.getElementById('save-btn');
const refreshBtn = document.getElementById('refresh-btn');
const saveModal = document.getElementById('save-modal');
const inputName = document.getElementById('session-name-input');
const confirmSaveBtn = document.getElementById('confirm-save-btn');
const cancelSaveBtn = document.getElementById('cancel-save-btn');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');
const toastEl = document.getElementById('toast');

// State
let sessions = [];

// Init
init();

async function init() {
    await loadSessions();
    setupListeners();
}

async function loadSessions() {
    try {
        sessions = await window.api.getSessions();
        render();
    } catch (e) {
        showToast('Error loading sessions', true);
    }
}

function render() {
    grid.innerHTML = '';

    if (sessions.length === 0) {
        grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1; text-align: center; color: var(--secondary-text); margin-top: 40px;">No saved sessions found.<br>Create one to get started.</div>';
        return;
    }

    sessions.forEach(s => {
        const card = document.createElement('div');
        card.className = 'session-card';

        // Icon based on confidence or name
        let icon = '📂';
        if (s.id.toLowerCase().includes('code')) icon = '💻';
        if (s.id.toLowerCase().includes('work')) icon = '💼';
        if (s.id.toLowerCase().includes('music')) icon = '🎵';

        const date = new Date(s.created);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        card.innerHTML = `
            <div class="card-header">
                <div class="session-icon">${icon}</div>
                <button class="delete-btn" title="Delete Session">×</button>
            </div>
            <div class="session-info">
                <h3>${escapeHtml(s.id)}</h3>
                <div class="session-meta">
                    ${s.appCount} items • ${dateStr}
                </div>
            </div>
        `;

        // Click to restore
        card.addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn')) return;
            handleRestore(s.id);
        });

        // Delete action
        const delBtn = card.querySelector('.delete-btn');
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Delete session "${s.id}"?`)) {
                handleDelete(s.id);
            }
        });

        grid.appendChild(card);
    });
}

function setupListeners() {
    saveBtn.addEventListener('click', () => {
        inputName.value = '';
        saveModal.classList.remove('hidden');
        inputName.focus();
    });

    refreshBtn.addEventListener('click', loadSessions);

    // Save Modal
    cancelSaveBtn.addEventListener('click', () => saveModal.classList.add('hidden'));

    confirmSaveBtn.addEventListener('click', () => {
        const name = inputName.value.trim();
        if (name) {
            handleSave(name);
            saveModal.classList.add('hidden');
        }
    });

    inputName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') confirmSaveBtn.click();
        if (e.key === 'Escape') cancelSaveBtn.click();
    });
}

async function handleRestore(name) {
    showLoading(true, `Restoring "${name}"...`);
    try {
        const res = await window.api.restoreSession(name);
        if (res.success) {
            showToast(`Session "${name}" restored!`);
        } else {
            showToast('Restore returned unexpected status', true);
        }
    } catch (e) {
        showToast(`Error: ${e.message}`, true);
    } finally {
        showLoading(false);
    }
}

async function handleSave(name) {
    showLoading(true, `Saving "${name}"...`);
    try {
        const res = await window.api.saveSession(name);
        if (res.success) {
            showToast(`Session "${name}" saved!`);
            await loadSessions();
        }
    } catch (e) {
        showToast(`Save failed: ${e.message}`, true);
    } finally {
        showLoading(false);
    }
}

async function handleDelete(name) {
    try {
        const res = await window.api.deleteSession(name);
        if (res.success) {
            showToast(`Deleted "${name}"`);
            await loadSessions();
        }
    } catch (e) {
        showToast(`Delete failed: ${e.message}`, true);
    }
}

function showLoading(visible, text = '') {
    if (visible) {
        loadingText.textContent = text;
        loadingOverlay.classList.remove('hidden');
    } else {
        loadingOverlay.classList.add('hidden');
    }
}

function showToast(msg, isError = false) {
    toastEl.textContent = msg;
    toastEl.style.backgroundColor = isError ? 'rgba(255, 59, 48, 0.9)' : 'rgba(50, 50, 50, 0.9)';
    toastEl.classList.remove('hidden');

    // Reset animation
    toastEl.style.animation = 'none';
    toastEl.offsetHeight; // trigger reflow
    toastEl.style.animation = 'fadein 0.3s, fadeout 0.3s 2.7s';

    setTimeout(() => {
        toastEl.classList.add('hidden');
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
