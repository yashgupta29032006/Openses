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

// Drag State
let longPressTimer = null;
let isDragging = false;
let draggedCard = null;
let placeholder = null;
let dragStartX = 0;
let dragStartY = 0;
let initialIndex = -1;

function render() {
    grid.innerHTML = '';

    if (sessions.length === 0) {
        grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1; text-align: center; color: var(--secondary-text); margin-top: 40px; font-size: 13px;">No saved sessions.<br>Create one to start.</div>';
        return;
    }

    sessions.forEach((s, index) => {
        const card = document.createElement('div');
        card.className = 'session-card';
        card.dataset.id = s.id;
        card.dataset.index = index;

        // Icon based on confidence or name
        let icon = '📂';
        if (s.id.toLowerCase().includes('code')) icon = '💻';
        if (s.id.toLowerCase().includes('work')) icon = '💼';
        if (s.id.toLowerCase().includes('music')) icon = '🎵';

        const date = new Date(s.created);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
            if (!restoringSession && !isDragging) {
                handleRestore(s.id);
            }
        });

        // Delete action
        const delBtn = card.querySelector('.delete-btn');
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!isDragging && confirm(`Delete session "${s.id}"?`)) {
                handleDelete(s.id);
            }
        });

        // Drag Listeners
        card.addEventListener('mousedown', handleDragStart);
        card.addEventListener('touchstart', handleDragStart, { passive: false });

        grid.appendChild(card);
    });
}

// Drag Handlers
function handleDragStart(e) {
    if (e.target.closest('button')) return; // Ignore button clicks

    const card = e.currentTarget;
    dragStartX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    dragStartY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

    longPressTimer = setTimeout(() => {
        startDragging(card, e);
    }, 500); // 500ms Long Press

    // Listener to cancel if moved too much before long press triggers
    const cancelEvents = ['mouseup', 'mouseleave', 'touchend', 'touchcancel'];
    const moveEvent = e.type.includes('touch') ? 'touchmove' : 'mousemove';

    const cancelHandler = () => {
        clearTimeout(longPressTimer);
        cleanup();
    };

    const moveHandler = (moveE) => {
        const cx = moveE.type.includes('touch') ? moveE.touches[0].clientX : moveE.clientX;
        const cy = moveE.type.includes('touch') ? moveE.touches[0].clientY : moveE.clientY;
        if (Math.hypot(cx - dragStartX, cy - dragStartY) > 10) {
            clearTimeout(longPressTimer); // Cancel if moved > 10px
            cleanup();
        }
    };

    const cleanup = () => {
        cancelEvents.forEach(ev => card.removeEventListener(ev, cancelHandler));
        document.removeEventListener(moveEvent, moveHandler);
    };

    cancelEvents.forEach(ev => card.addEventListener(ev, cancelHandler, { once: true }));
    document.addEventListener(moveEvent, moveHandler);
}

function startDragging(card, e) {
    isDragging = true;
    draggedCard = card;
    initialIndex = [...grid.children].indexOf(card);

    // Haptic feedback if available (not standard in Electron/web but good to have)
    if (navigator.vibrate) navigator.vibrate(50);

    card.classList.add('is-dragging');

    // Create placeholder
    // We actually keep the card in dom but move it visually? 
    // Easier: set fixed position for dragged card and put a placeholder in its spot.
    // Simpler approach for grid: Just use transform for dragged, and swap DOM nodes for others.

    // Set initial offsets
    const rect = card.getBoundingClientRect();
    const offsetX = (e.type.includes('touch') ? e.touches[0].clientX : e.clientX) - rect.left;
    const offsetY = (e.type.includes('touch') ? e.touches[0].clientY : e.clientY) - rect.top;

    // Fix width/height
    card.style.width = rect.width + 'px';
    card.style.height = rect.height + 'px';
    card.style.position = 'fixed';
    card.style.left = rect.left + 'px';
    card.style.top = rect.top + 'px';
    card.style.zIndex = 1000;

    // Create placeholder in flow
    placeholder = document.createElement('div');
    placeholder.className = 'session-card';
    placeholder.style.opacity = '0';
    placeholder.style.border = '1px dashed var(--accent)';
    grid.insertBefore(placeholder, grid.children[initialIndex]);

    // specific drag move listener
    const moveEvent = e.type.includes('touch') ? 'touchmove' : 'mousemove';
    const endEvent = e.type.includes('touch') ? 'touchend' : 'mouseup';

    const onMove = (moveE) => {
        moveE.preventDefault();
        const clientX = moveE.type.includes('touch') ? moveE.touches[0].clientX : moveE.clientX;
        const clientY = moveE.type.includes('touch') ? moveE.touches[0].clientY : moveE.clientY;

        card.style.left = (clientX - offsetX) + 'px';
        card.style.top = (clientY - offsetY) + 'px';

        // Hit test
        const elements = document.elementsFromPoint(clientX, clientY);
        const targetCard = elements.find(el => el.classList.contains('session-card') && el !== card && el !== placeholder);

        if (targetCard) {
            const targetIndex = [...grid.children].indexOf(targetCard);
            const placeholderIndex = [...grid.children].indexOf(placeholder);

            if (targetIndex !== -1 && targetIndex !== placeholderIndex) {
                // Swap logic
                if (targetIndex < placeholderIndex) {
                    grid.insertBefore(placeholder, targetCard);
                } else {
                    grid.insertBefore(placeholder, targetCard.nextSibling);
                }
            }
        }
    };

    const onEnd = async () => {
        document.removeEventListener(moveEvent, onMove);
        document.removeEventListener(endEvent, onEnd);

        isDragging = false;

        // Finalize
        card.classList.remove('is-dragging');
        card.style.position = '';
        card.style.width = '';
        card.style.height = '';
        card.style.left = '';
        card.style.top = '';
        card.style.zIndex = '';

        if (placeholder && placeholder.parentNode) {
            grid.insertBefore(card, placeholder);
            placeholder.remove();
        }
        placeholder = null;
        draggedCard = null;

        // Update sessions array
        const newOrderIds = [...grid.children].map(c => c.dataset.id).filter(id => id);

        // Save order
        await window.api.saveSessionOrder(newOrderIds);

        // Reload to sync state (optional, or just update local sessions)
        // Updating local sessions is smoother
        // But we need to make sure we don't reload and flicker
        // Let's just update local matches
        sessions.sort((a, b) => newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id));
    };

    document.addEventListener(moveEvent, onMove, { passive: false });
    document.addEventListener(endEvent, onEnd);
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
