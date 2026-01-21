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

        // Preview List (Hidden by default)
        const previewHtml = `
            <div class="preview-list">
                <ul>
                    ${(s.previewItems || []).map(p => `
                        <li>
                            <span class="app-icon">${p.type === 'browser' ? '🌐' : '🖥️'}</span>
                            <span class="app-name">${escapeHtml(p.name)}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;

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
            ${previewHtml}
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

        // Click to expand
        card.addEventListener('click', (e) => {
            if (isDragging || e.target.closest('button')) return;

            // Toggle
            const wasExpanded = card.classList.contains('expanded');

            // Collapse all others
            document.querySelectorAll('.session-card.expanded').forEach(c => c.classList.remove('expanded'));

            if (!wasExpanded) {
                card.classList.add('expanded');
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

    // We don't start dragging immediately. We wait for movement > threshold.

    const moveEvent = e.type.includes('touch') ? 'touchmove' : 'mousemove';
    const endEvent = e.type.includes('touch') ? 'touchend' : 'mouseup';

    const onMove = (moveE) => {
        const cx = moveE.type.includes('touch') ? moveE.touches[0].clientX : moveE.clientX;
        const cy = moveE.type.includes('touch') ? moveE.touches[0].clientY : moveE.clientY;

        const dist = Math.hypot(cx - dragStartX, cy - dragStartY);

        if (!isDragging && dist > 5) {
            // Threshold reached, start dragging
            startDragging(card, e, cx, cy); // Pass current coords to sync
        }
    };

    const onEnd = () => {
        document.removeEventListener(moveEvent, onMove);
        document.removeEventListener(endEvent, onEnd);
    };

    document.addEventListener(moveEvent, onMove, { passive: false });
    document.addEventListener(endEvent, onEnd, { once: true });
}

function startDragging(card, startEvent, startX, startY) {
    if (isDragging) return;
    isDragging = true;
    draggedCard = card;
    initialIndex = [...grid.children].indexOf(card);

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);

    card.classList.add('is-dragging');

    // Set initial offsets based on where the drag STARTED (not current mouse, to avoid jumps? 
    // actually we need offset from card top-left)
    const rect = card.getBoundingClientRect();

    // Note: Use startEvent coordinates for offset calculation to keep it stuck to mouse relative position
    // Or better, use proper current mouse position.
    // The startX/Y passed are the CURRENT mouse positions when threshold triggered.
    const offsetX = startX - rect.left;
    const offsetY = startY - rect.top;

    // Fix width/height
    card.style.width = rect.width + 'px';
    card.style.height = rect.height + 'px';
    card.style.position = 'fixed';
    card.style.left = rect.left + 'px';
    card.style.top = rect.top + 'px';
    card.style.zIndex = 1000;

    // Create placeholder
    placeholder = document.createElement('div');
    placeholder.className = 'session-card';
    placeholder.style.opacity = '0';
    placeholder.style.border = '1px dashed var(--accent)'; // Optional visual
    grid.insertBefore(placeholder, grid.children[initialIndex]);

    const moveEvent = startEvent.type.includes('touch') ? 'touchmove' : 'mousemove';
    const endEvent = startEvent.type.includes('touch') ? 'touchend' : 'mouseup';

    const onDragMove = (moveE) => {
        moveE.preventDefault();
        const clientX = moveE.type.includes('touch') ? moveE.touches[0].clientX : moveE.clientX;
        const clientY = moveE.type.includes('touch') ? moveE.touches[0].clientY : moveE.clientY;

        card.style.left = (clientX - offsetX) + 'px';
        card.style.top = (clientY - offsetY) + 'px';

        // Hit test
        // We hide the dragged card so we can see what's under it? 
        // pointer-events: none in CSS handles this.
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

    const onDragEnd = async () => {
        document.removeEventListener(moveEvent, onDragMove);
        document.removeEventListener(endEvent, onDragEnd);

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

        // Update local state
        sessions.sort((a, b) => newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id));
    };

    document.addEventListener(moveEvent, onDragMove, { passive: false });
    document.addEventListener(endEvent, onDragEnd);
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

    // Global click to collapse
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.session-card')) {
            document.querySelectorAll('.session-card.expanded').forEach(c => c.classList.remove('expanded'));
        }
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
