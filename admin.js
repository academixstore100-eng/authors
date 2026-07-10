/* =========================================================
   AcademixStore — Admin dashboard
   Requires config.js with your Supabase URL + anon key, and
   an admin user created in Supabase (Authentication → Users).
   ========================================================= */

(function () {
  if (typeof SUPABASE_URL === 'undefined' || SUPABASE_URL === 'YOUR_SUPABASE_PROJECT_URL') {
    document.body.innerHTML =
      '<p style="padding:60px;font-family:sans-serif;">Supabase is not configured. Add your project URL and anon key to config.js first.</p>';
    return;
  }

  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const loginPanel = document.getElementById('loginPanel');
  const dashboard = document.getElementById('dashboard');
  const loginForm = document.getElementById('loginForm');
  const loginBtn = document.getElementById('loginBtn');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');

  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const refreshBtn = document.getElementById('refreshBtn');
  const tableBody = document.getElementById('tableBody');
  const emptyState = document.getElementById('emptyState');
  const loadingState = document.getElementById('loadingState');
  const dashStats = document.getElementById('dashStats');

  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalCard = document.getElementById('modalCard');

  let allRows = [];

  /* ---------- auth ---------- */
  async function checkSession() {
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
      showDashboard();
    } else {
      showLogin();
    }
  }

  function showLogin() {
    loginPanel.hidden = false;
    dashboard.hidden = true;
    logoutBtn.hidden = true;
  }

  function showDashboard() {
    loginPanel.hidden = true;
    dashboard.hidden = false;
    logoutBtn.hidden = false;
    loadApplications();
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    loginBtn.disabled = true;
    loginBtn.classList.add('is-loading');

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    const { error } = await sb.auth.signInWithPassword({ email, password });

    loginBtn.disabled = false;
    loginBtn.classList.remove('is-loading');

    if (error) {
      loginError.textContent = error.message;
      return;
    }
    showDashboard();
  });

  logoutBtn.addEventListener('click', async () => {
    await sb.auth.signOut();
    showLogin();
  });

  /* ---------- data ---------- */
  async function loadApplications() {
    loadingState.hidden = false;
    emptyState.hidden = true;
    tableBody.innerHTML = '';

    const { data, error } = await sb
      .from('author_applications')
      .select('*')
      .order('submitted_at', { ascending: false });

    loadingState.hidden = true;

    if (error) {
      loadingState.hidden = false;
      loadingState.textContent = 'Could not load applications: ' + error.message;
      return;
    }

    allRows = data || [];
    renderStats();
    renderTable();
  }

  function renderStats() {
    const counts = { pending: 0, reviewing: 0, accepted: 0, rejected: 0 };
    allRows.forEach((r) => { if (counts[r.status] !== undefined) counts[r.status]++; });
    dashStats.innerHTML = `
      <span><strong>${allRows.length}</strong> total</span>
      <span><strong>${counts.pending}</strong> pending</span>
      <span><strong>${counts.reviewing}</strong> reviewing</span>
      <span><strong>${counts.accepted}</strong> accepted</span>
    `;
  }

  function matchesFilters(row) {
    const q = searchInput.value.trim().toLowerCase();
    const status = statusFilter.value;
    if (status && row.status !== status) return false;
    if (!q) return true;
    const haystack = [row.full_name, row.email, row.subject, row.city, row.institution]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  }

  function renderTable() {
    const rows = allRows.filter(matchesFilters);
    tableBody.innerHTML = '';
    emptyState.hidden = rows.length !== 0;

    rows.forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="cell-muted">${formatDate(row.submitted_at)}</td>
        <td class="cell-name">${escapeHtml(row.full_name)}</td>
        <td>
          <span class="cell-sub">${escapeHtml(row.email)}</span>
          <span class="cell-sub cell-muted">${escapeHtml(row.phone)}</span>
        </td>
        <td>${escapeHtml(row.city)}, ${escapeHtml(row.state)}</td>
        <td>${escapeHtml(row.subject)}</td>
        <td class="cell-muted">${escapeHtml(row.experience)}</td>
        <td>${row.portfolio ? `<a class="link-pill" href="${escapeAttr(row.portfolio)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Portfolio ↗</a>` : '<span class="cell-muted">—</span>'}</td>
        <td></td>
      `;

      const statusCell = tr.lastElementChild;
      statusCell.appendChild(buildStatusSelect(row));

      tr.addEventListener('click', () => openModal(row));
      tableBody.appendChild(tr);
    });
  }

  function buildStatusSelect(row) {
    const select = document.createElement('select');
    select.className = `status-select status-${row.status}`;
    ['pending', 'reviewing', 'accepted', 'rejected'].forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      if (s === row.status) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener('click', (e) => e.stopPropagation());
    select.addEventListener('change', async () => {
      const newStatus = select.value;
      const prevStatus = row.status;
      select.className = `status-select status-${newStatus}`;
      const { error } = await sb
        .from('author_applications')
        .update({ status: newStatus })
        .eq('id', row.id);
      if (error) {
        alert('Could not update status: ' + error.message);
        select.value = prevStatus;
        select.className = `status-select status-${prevStatus}`;
        return;
      }
      row.status = newStatus;
      renderStats();
    });
    return select;
  }

  /* ---------- modal ---------- */
  function openModal(row) {
    modalCard.innerHTML = `
      <h2>${escapeHtml(row.full_name)}</h2>
      <p class="modal-meta">Submitted ${formatDate(row.submitted_at)}</p>
      <dl>
        <div class="modal-row"><dt>Email</dt><dd>${escapeHtml(row.email)}</dd></div>
        <div class="modal-row"><dt>Phone</dt><dd>${escapeHtml(row.phone)}</dd></div>
        <div class="modal-row"><dt>Location</dt><dd>${escapeHtml(row.city)}, ${escapeHtml(row.state)}</dd></div>
        <div class="modal-row"><dt>Institution</dt><dd>${escapeHtml(row.institution)}</dd></div>
        <div class="modal-row"><dt>Qualification</dt><dd>${escapeHtml(row.qualification)}</dd></div>
        <div class="modal-row"><dt>Experience</dt><dd>${escapeHtml(row.experience)}</dd></div>
        <div class="modal-row"><dt>Subject / domain</dt><dd>${escapeHtml(row.subject)}</dd></div>
        ${row.book_idea ? `<div class="modal-row"><dt>Proposed book</dt><dd>${escapeHtml(row.book_idea)}</dd></div>` : ''}
        ${row.portfolio ? `<div class="modal-row"><dt>Portfolio</dt><dd><a class="link-pill" href="${escapeAttr(row.portfolio)}" target="_blank" rel="noopener">${escapeHtml(row.portfolio)}</a></dd></div>` : ''}
        <div class="modal-row"><dt>Motivation</dt><dd>${escapeHtml(row.motivation)}</dd></div>
      </dl>
      <button class="btn btn-ghost modal-close" id="modalCloseBtn">Close</button>
    `;
    modalBackdrop.hidden = false;
    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  }

  function closeModal() {
    modalBackdrop.hidden = true;
    modalCard.innerHTML = '';
  }

  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  /* ---------- helpers ---------- */
  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function escapeAttr(str) {
    return escapeHtml(str);
  }

  /* ---------- filter listeners ---------- */
  searchInput.addEventListener('input', renderTable);
  statusFilter.addEventListener('change', renderTable);
  refreshBtn.addEventListener('click', loadApplications);

  checkSession();
})();
