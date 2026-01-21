// DOM Elements
const grid = document.getElementById('session-grid');
const saveBtn = document.getElementById('save-btn');
const refreshBtn = document.getElementById('refresh-btn');
const saveModal = document.getElementById('save-modal');
const inputName = document.getElementById('session-name-input');
const confirmSaveBtn = document.getElementById('confirm-save-btn');
const cancelSaveBtn = document.getElementById('cancel-save-btn');
const toastEl = document.getElementById('toast');

// State
let sessions = [];
let restoringSession = null; // Track which session is restoring

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
        grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1; text-align: center; color: var(--secondary-text); margin-top: 40px; font-size: 13px;">No saved sessions.<br>Create one to start.</div>';
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
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        const isRestoring = restoringSession === s.id;
        const btnText = isRestoring ? 'Restoring...' : 'Restore';
        const btnClass = isRestoring ? 'restore-btn loading' : 'restore-btn';
        const spinnerHtml = isRestoring ? '<span class="spinner-small"></span>' : '';

        card.innerHTML = `
            <button class="delete-btn" title="Delete">×</button>
            <div class="card-top">
                <div class="session-icon">${icon}</div>
                <div class="session-info">
                    <h3>${escapeHtml(s.id)}</h3>
                    <div class="session-meta">
                        ${s.appCount} apps • ${dateStr}
                    </div>
                </div>
            </div>
            <div class="card-actions">
                <button class="${btnClass}" data-name="${escapeHtml(s.id)}">
                    ${spinnerHtml}${btnText}
                </button>
            </div>
        `;

        // Explicit Restore Button Click
        const restoreBtn = card.querySelector('.restore-btn');
        restoreBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Safe click
            if (!restoringSession) {
                handleRestore(s.id);
            }
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
    restoringSession = name;
    render(); // Update UI to show spinner
    
    try {
        const res = await window.api.restoreSession(name);
        if (res.success) {
            showToast(`Session restored`);
        } else {
            showToast('Restore returned unexpected status', true);
        }
    } catch (e) {
        showToast(`Error: ${e.message}`, true);
    } finally {
        restoringSession = null;
        render(); // Reset UI
    }
}

async function handleSave(name) {
    try {
        const res = await window.api.saveSession(name);
        if (res.success) {
            showToast(`Saved "${name}"`);
            await loadSessions();
        }
    } catch (e) {
        showToast(`Save failed: ${e.message}`, true);
    }
}

async function handleDelete(name) {
    try {
        const res = await window.api.deleteSession(name);
        if (res.success) {
            await loadSessions(); // fast update, no toast needed for simple delete
        }
    } catch (e) {
        showToast(`Delete failed: ${e.message}`, true);
    }
}

function showToast(msg, isError = false) {
    toastEl.innerHTML = msg; // innerHTML to support simple formatting if need be
    toastEl.style.color = isError ? '#ff453a' : 'white';
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
