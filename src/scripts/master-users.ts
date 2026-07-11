const tbody = document.getElementById('users-tbody')!;
const totalSpan = document.getElementById('total-users')!;
const activeSpan = document.getElementById('active-users')!;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const filterStatus = document.getElementById('filter-status') as HTMLSelectElement;
const filterActive = document.getElementById('filter-active') as HTMLSelectElement;
const pagination = document.getElementById('pagination')!;
const pageInfo = document.getElementById('page-info')!;
const prevBtn = document.getElementById('prev-page') as HTMLButtonElement;
const nextBtn = document.getElementById('next-page') as HTMLButtonElement;
const addBtn = document.getElementById('add-user-btn')!;
const createModal = document.getElementById('create-user-modal')!;
const createForm = document.getElementById('create-user-form') as HTMLFormElement;
const createFeedback = document.getElementById('create-feedback') as HTMLDivElement;

let currentPage = 1;
let totalPages = 1;
let searchTimer: number | null = null;

async function fetchUsers() {
  tbody.innerHTML = '<tr><td colspan="5" class="loading-state"><div class="loader"></div><p>Sincronizando base de datos...</p></td></tr>';

  try {
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: '20',
      search: searchInput.value,
      status: filterStatus.value,
      active: filterActive.value,
    });
    const response = await fetch('/api/users?' + params);
    const result = await response.json();

    if (!response.ok) throw new Error(result.message);

    const { users, total, page, totalPages: pages } = result;
    totalPages = pages;

    totalSpan.textContent = total;
    activeSpan.textContent = users.filter((u: any) => u.is_active).length;

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No se encontraron usuarios.</td></tr>';
      pagination.style.display = 'none';
      return;
    }

    tbody.innerHTML = users.map((user: any) => `
      <tr class="user-row" data-user-id="${user.id}">
        <td data-label="Usuario">
          <div class="user-identity" style="cursor:pointer;">
            <div class="avatar-placeholder">${user.name.charAt(0)}</div>
            <div class="user-details">
              <span class="user-name">${user.name}</span>
              <span class="user-email">${user.email}</span>
            </div>
          </div>
        </td>
        <td data-label="Objetivo">
          <div class="user-metrics">
            <span class="badge-goal ${user.goal || 'none'}">${user.goal || 'Sin meta'}</span>
            <span class="metrics-text">${user.weight_kg ? user.weight_kg + 'kg' : '---'} / ${user.height_cm ? user.height_cm + 'cm' : '---'}</span>
          </div>
        </td>
        <td data-label="Calorías">
          <div class="calories-grid">
            <div class="input-with-label">
              <label>Mant.</label>
              <input type="number" class="input-minimal maint-input" value="${user.maintenance_calories || ''}">
            </div>
            <div class="input-with-label">
              <label>Obj.</label>
              <input type="number" class="input-minimal highlighted target-input" value="${user.target_calories || ''}">
            </div>
          </div>
        </td>
        <td data-label="Suscripción">
          <div class="select-wrapper">
            <select class="status-select ${user.subscription_status} status-input">
              <option value="trial" ${user.subscription_status === 'trial' ? 'selected' : ''}>Trial</option>
              <option value="active" ${user.subscription_status === 'active' ? 'selected' : ''}>Activo</option>
              <option value="expired" ${user.subscription_status === 'expired' ? 'selected' : ''}>Expirado</option>
            </select>
          </div>
        </td>
        <td data-label="Estado">
          <div class="action-buttons">
            <button class="action-btn ${user.is_active ? 'active' : 'inactive'} toggle-btn"
              title="${user.is_active ? 'Desactivar' : 'Activar'}">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
      <tr class="user-detail-row" data-user-id="${user.id}" style="display:none;">
        <td colspan="5" class="detail-cell">
          <div class="user-detail-container">
            <div class="loader"></div>
          </div>
        </td>
      </tr>
    `).join('');

    attachUserEvents();
    updatePagination(page, totalPages, total);
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="5" class="error-state">Error al conectar con el servidor.</td></tr>';
    pagination.style.display = 'none';
  }
}

function updatePagination(page: number, pages: number, total: number) {
  pagination.style.display = pages > 1 ? 'flex' : 'none';
  pageInfo.textContent = `Página ${page} de ${pages} (${total} usuarios)`;
  prevBtn.disabled = page <= 1;
  nextBtn.disabled = page >= pages;
}

function attachUserEvents() {
  document.querySelectorAll('.maint-input').forEach(input => {
    input.addEventListener('change', function(this: HTMLInputElement) {
      const userId = this.closest('tr')!.getAttribute('data-user-id');
      updateUser(Number(userId), { maintenance_calories: this.value }, this);
    });
  });

  document.querySelectorAll('.target-input').forEach(input => {
    input.addEventListener('change', function(this: HTMLInputElement) {
      const userId = this.closest('tr')!.getAttribute('data-user-id');
      updateUser(Number(userId), { target_calories: this.value }, this);
    });
  });

  document.querySelectorAll('.status-input').forEach(select => {
    select.addEventListener('change', function(this: HTMLSelectElement) {
      const userId = this.closest('tr')!.getAttribute('data-user-id');
      updateUser(Number(userId), { subscription_status: this.value }, this);
    });
  });

  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', async function(this: HTMLElement) {
      const row = this.closest('tr')!;
      const userId = row.getAttribute('data-user-id');
      const isActive = this.classList.contains('active');
      await updateUser(Number(userId), { is_active: !isActive });
      fetchUsers();
    });
  });

  document.querySelectorAll('.user-identity').forEach(el => {
    el.addEventListener('click', function(this: HTMLElement) {
      const row = this.closest('.user-row')!;
      const userId = row.getAttribute('data-user-id');
      const detailRow = document.querySelector(`.user-detail-row[data-user-id="${userId}"]`) as HTMLElement;
      if (!detailRow) return;

      const isVisible = detailRow.style.display !== 'none';
      document.querySelectorAll('.user-detail-row').forEach(r => (r as HTMLElement).style.display = 'none');

      if (!isVisible) {
        detailRow.style.display = 'table-row';
        const container = detailRow.querySelector('.user-detail-container')!;
        loadUserDetail(Number(userId), container);
      }
    });
  });
}

async function loadUserDetail(userId: number, container: Element) {
  container.innerHTML = '<div class="loader"></div>';
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      container.innerHTML = '<div class="error-state">Error al cargar detalle</div>';
      return;
    }
    const user = await response.json();

    let html = '<div class="detail-grid">';

    html += '<div class="detail-section"><h4>Rutinas Asignadas</h4>';
    if (user.routines && user.routines.length > 0) {
      html += '<div class="detail-list">' + user.routines.map((r: any) =>
        `<span class="detail-tag">${r.day_of_week}: <strong>${r.routine_name}</strong></span>`
      ).join('') + '</div>';
    } else {
      html += '<p class="detail-empty">Sin rutinas asignadas</p>';
    }
    html += '</div>';

    html += '<div class="detail-section"><h4>Plan de Nutrición</h4>';
    if (user.meals && user.meals.length > 0) {
      html += '<div class="detail-list">';

      const byDay: Record<string, any[]> = {};
      user.meals.forEach((m: any) => {
        if (!byDay[m.day_of_week]) byDay[m.day_of_week] = [];
        byDay[m.day_of_week].push(m);
      });

      for (const [day, meals] of Object.entries(byDay)) {
        html += `<div class="detail-day"><span class="day-label">${day}:</span> `;
        html += (meals as any[]).map((m: any) =>
          `<span class="meal-type-badge ${m.meal_type}">${m.meal_name}</span>`
        ).join('');
        html += '</div>';
      }
      html += '</div>';
    } else {
      html += '<p class="detail-empty">Sin plan nutricional</p>';
    }
    html += '</div>';

    html += '<div class="detail-section"><h4>Últimas Medidas</h4>';
    if (user.lastMeasurement) {
      const m = user.lastMeasurement;
      const fields = [
        { label: 'Pierna Izq', v: m.leg_left_cm },
        { label: 'Pierna Der', v: m.leg_right_cm },
        { label: 'Pantorrilla', v: m.calf_cm },
        { label: 'Glúteo', v: m.glute_cm },
        { label: 'Abdomen', v: m.abdomen_cm },
        { label: 'Cintura', v: m.waist_cm },
        { label: 'Pecho', v: m.chest_cm },
        { label: 'Brazo', v: m.arm_cm },
      ].filter(f => f.v);
      html += '<div class="measurements-mini">' +
        fields.map(f => `<div class="meas-item"><span class="meas-label">${f.label}</span><span class="meas-val">${f.v} cm</span></div>`).join('') +
      '</div>';
    } else {
      html += '<p class="detail-empty">Sin medidas registradas</p>';
    }
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = '<div class="error-state">Error de conexión</div>';
  }
}

async function updateUser(id: number, data: Record<string, unknown>, element?: HTMLElement) {
  try {
    if (element) element.classList.add('saving');

    const response = await fetch('/api/users/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok && element) {
      element.classList.remove('saving');
      element.classList.add('saved');
      setTimeout(() => element.classList.remove('saved'), 1000);
    }
  } catch (error) {
    console.error('Update error:', error);
    if (element) element.classList.remove('saving');
  }
}

function showFeedback(msg: string, isError = false) {
  createFeedback.textContent = msg;
  createFeedback.style.display = 'block';
  createFeedback.className = `feedback-msg ${isError ? 'error' : 'success'}`;
  setTimeout(() => { createFeedback.style.display = 'none'; }, 3000);
}

searchInput.addEventListener('input', () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    currentPage = 1;
    fetchUsers();
  }, 300);
});

filterStatus.addEventListener('change', () => { currentPage = 1; fetchUsers(); });
filterActive.addEventListener('change', () => { currentPage = 1; fetchUsers(); });

prevBtn.addEventListener('click', () => {
  if (currentPage > 1) { currentPage--; fetchUsers(); }
});

nextBtn.addEventListener('click', () => {
  if (currentPage < totalPages) { currentPage++; fetchUsers(); }
});

addBtn.onclick = () => {
  createForm.reset();
  createFeedback.style.display = 'none';
  createModal.style.display = 'flex';
};

createForm.onsubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(createForm);
  const data = Object.fromEntries(formData);

  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      createModal.style.display = 'none';
      showFeedback('Usuario creado correctamente');
      fetchUsers();
    } else {
      const err = await response.json();
      showFeedback(err.message || 'Error al crear usuario', true);
    }
  } catch (error) {
    showFeedback('Error de conexión', true);
  }
};

fetchUsers();
