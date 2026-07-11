const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const dayShort = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const mealTypes = ['breakfast', 'lunch', 'snack', 'dinner'];
const mealLabels: Record<string, string> = { breakfast: 'Desayuno', lunch: 'Almuerzo', snack: 'Snack', dinner: 'Cena' };
const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const ROUTINE_COLORS = [
  '#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#8b5cf6',
];

const userSelect = document.getElementById('user-select') as HTMLSelectElement;
const userSearch = document.getElementById('user-search') as HTMLInputElement;
const editor = document.getElementById('assignment-editor')!;
const feedbackEl = document.getElementById('assign-feedback') as HTMLDivElement;
const weekLabel = document.getElementById('week-label')!;
const prevWeekBtn = document.getElementById('prev-week')!;
const nextWeekBtn = document.getElementById('next-week')!;
const nutritionCalendar = document.getElementById('nutrition-calendar')!;
const routineCalendar = document.getElementById('routine-calendar')!;

let allUsers: any[] = [];
let meals: any[] = [];
let routines: any[] = [];
let currentWeekStart: Date;

function getRoutineColor(id: number): string {
  return ROUTINE_COLORS[(id - 1) % ROUTINE_COLORS.length];
}

function getRoutineName(id: number): string {
  const r = routines.find(r => r.id === id);
  return r ? r.name : '';
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDates(monday: Date): Date[] {
  return dayNames.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatWeekLabel(monday: Date): string {
  const sun = new Date(monday);
  sun.setDate(monday.getDate() + 6);
  const m = monday.getDate();
  const s = sun.getDate();
  const month = monthNames[monday.getMonth()];
  const year = monday.getFullYear();
  if (monday.getMonth() === sun.getMonth()) {
    return `${m} al ${s} de ${month}, ${year}`;
  }
  const nextMonth = monthNames[sun.getMonth()];
  return `${m} de ${month} al ${s} de ${nextMonth}, ${year}`;
}

function showFeedback(msg: string, isError = false) {
  feedbackEl.textContent = msg;
  feedbackEl.style.display = 'block';
  feedbackEl.className = `feedback-msg ${isError ? 'error' : 'success'}`;
  setTimeout(() => { feedbackEl.style.display = 'none'; }, 4000);
}

async function init() {
  try {
    const [usersRes, mealsRes, routinesRes] = await Promise.all([
      fetch('/api/users'),
      fetch('/api/nutrition/meals'),
      fetch('/api/routines'),
    ]);

    if (!usersRes.ok) throw new Error('Error al cargar usuarios');
    if (!mealsRes.ok) throw new Error('Error al cargar comidas');
    if (!routinesRes.ok) throw new Error('Error al cargar rutinas');

    const usersData = await usersRes.json();
    allUsers = usersData.users || [];
    meals = await mealsRes.json();
    routines = await routinesRes.json();

    renderUsers(allUsers);
    userSearch.placeholder = `Buscar entre ${allUsers.length} usuarios...`;
    currentWeekStart = getMonday(new Date());
    renderWeek();
  } catch (err) {
    showFeedback('Error al cargar datos. Recarga la página.', true);
    console.error('Init error:', err);
  }
}

function renderUsers(users: any[]) {
  if (users.length === 0) {
    userSelect.innerHTML = '<option value="">-- Sin resultados --</option>';
    return;
  }
  userSelect.innerHTML = '<option value="">-- Selecciona un cliente --</option>' +
    users.map((u: any) => `<option value="${u.id}">${u.name} (${u.email})</option>`).join('');
}

function filterUsers(query: string) {
  const q = query.toLowerCase().trim();
  if (!q) {
    renderUsers(allUsers);
    userSelect.value = '';
    editor.style.display = 'none';
    return;
  }
  const filtered = allUsers.filter(u =>
    u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  );
  renderUsers(filtered);
  userSelect.value = '';
  editor.style.display = 'none';
  if (filtered.length === 0) {
    showFeedback('No se encontraron usuarios con ese criterio');
  }
}

function populateRoutineOptions() {
  document.querySelectorAll('.routine-select').forEach(select => {
    select.innerHTML = '<option value="">Ninguna</option>' +
      routines.map((r: any) => {
        const color = getRoutineColor(r.id);
        const count = r.exercise_count ? ` [${r.exercise_count} ej.]` : '';
        return `<option value="${r.id}">${r.name}${count}</option>`;
      }).join('');
  });
}

function populateMealOptions(container: HTMLElement) {
  container.querySelectorAll('.meal-select').forEach(select => {
    const type = select.getAttribute('data-type');
    const filtered = meals
      .filter((m: any) => m.meal_type === type)
      .map((m: any) => {
        const kcal = m.total_calories ? ` (${m.total_calories} kcal)` : '';
        return `<option value="${m.id}">${m.name}${kcal}</option>`;
      })
      .join('');
    select.innerHTML = '<option value="">Ninguno</option>' + filtered;
  });
}

function updateRoutineCellColor(select: HTMLSelectElement) {
  const cell = select.closest('.wc-cell')!;
  const val = select.value;
  if (val) {
    const color = getRoutineColor(Number(val));
    cell.style.borderLeft = `4px solid ${color}`;
    cell.style.background = `${color}10`;
  } else {
    cell.style.borderLeft = '';
    cell.style.background = '';
  }
}

/* ─── Week Calendar Renderers ─── */

function renderWeek() {
  weekLabel.textContent = formatWeekLabel(currentWeekStart);
  renderNutritionCalendar();
  renderRoutineCalendar();
  if (userSelect.value) {
    loadAssignments(userSelect.value);
  }
}

function renderNutritionCalendar() {
  const dates = getWeekDates(currentWeekStart);
  const cells = dates.map((d, i) => {
    const day = dayNames[i];
    const dayNum = d.getDate();
    const mealsHtml = mealTypes.map(mt => `
      <div class="meal-slot">
        <label class="meal-label">${mealLabels[mt]}</label>
        <select class="meal-select" data-day="${day}" data-type="${mt}">
          <option value="">—</option>
        </select>
      </div>
    `).join('');
    return `
      <div class="wc-cell" data-day="${day}">
        <div class="wc-day-header">
          <span class="wc-day-name">${dayShort[i]}</span>
          <span class="wc-day-num">${dayNum}</span>
        </div>
        <div class="wc-meals">${mealsHtml}</div>
      </div>
    `;
  }).join('');

  nutritionCalendar.innerHTML = `<div class="wc-row wc-body">${cells}</div>`;
  populateMealOptions(nutritionCalendar);
}

function renderRoutineCalendar() {
  const dates = getWeekDates(currentWeekStart);
  const cells = dates.map((d, i) => {
    const day = dayNames[i];
    const dayNum = d.getDate();
    const options = routines.map((r: any) => {
      const count = r.exercise_count ? ` [${r.exercise_count} ej.]` : '';
      return `<option value="${r.id}">${r.name}${count}</option>`;
    }).join('');
    return `
      <div class="wc-cell" data-day="${day}">
        <div class="wc-day-header">
          <span class="wc-day-name">${dayShort[i]}</span>
          <span class="wc-day-num">${dayNum}</span>
        </div>
        <div class="routine-slot">
          <label class="meal-label">Rutina</label>
          <select class="routine-select" data-day="${day}">
            <option value="">Ninguna</option>
            ${options}
          </select>
        </div>
      </div>
    `;
  }).join('');

  routineCalendar.innerHTML = `<div class="wc-row wc-body">${cells}</div>`;

  routineCalendar.querySelectorAll('.routine-select').forEach(s => {
    s.addEventListener('change', () => updateRoutineCellColor(s as HTMLSelectElement));
  });
}

/* ─── Load Assignments ─── */

async function loadAssignments(userId: string) {
  try {
    const [nutritionRes, routinesRes] = await Promise.all([
      fetch(`/api/nutrition/assign?userId=${userId}`),
      fetch(`/api/routines/assign?userId=${userId}`),
    ]);

    if (nutritionRes.ok) {
      const nutritionData = await nutritionRes.json();
      nutritionCalendar.querySelectorAll('.meal-select').forEach(s => {
        const day = s.getAttribute('data-day');
        const type = s.getAttribute('data-type');
        const match = nutritionData.find((a: any) => a.day_of_week === day && a.meal_type === type);
        s.value = match ? String(match.meal_id) : '';
      });
    }

    if (routinesRes.ok) {
      const routineData = await routinesRes.json();
      routineCalendar.querySelectorAll('.routine-select').forEach(s => {
        const day = s.getAttribute('data-day');
        const match = routineData.find((a: any) => a.day_of_week === day);
        s.value = match ? String(match.routine_id) : '';
        updateRoutineCellColor(s as HTMLSelectElement);
      });
    }
  } catch (error) {
    console.error('Load assignments error:', error);
  }
}

/* ─── Event Listeners ─── */

let searchTimer: number | null = null;
userSearch.addEventListener('input', () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => filterUsers(userSearch.value), 200);
});

userSelect.onchange = () => {
  if (userSelect.value) {
    editor.style.display = 'block';
    loadAssignments(userSelect.value);
  } else {
    editor.style.display = 'none';
  }
};

prevWeekBtn.addEventListener('click', () => {
  currentWeekStart = getMonday(new Date(currentWeekStart.getTime() - 7 * 86400000));
  renderWeek();
});

nextWeekBtn.addEventListener('click', () => {
  currentWeekStart = getMonday(new Date(currentWeekStart.getTime() + 7 * 86400000));
  renderWeek();
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const tabId = btn.getAttribute('data-tab') + '-tab';
    document.getElementById(tabId)!.classList.add('active');
  });
});

document.querySelector('.copy-routine-monday')?.addEventListener('click', () => {
  const mondaySelect = routineCalendar.querySelector('.routine-select[data-day="Lunes"]') as HTMLSelectElement;
  if (!mondaySelect || !mondaySelect.value) {
    showFeedback('Primero selecciona una rutina para el Lunes', true);
    return;
  }
  routineCalendar.querySelectorAll('.routine-select').forEach(s => {
    s.value = mondaySelect.value;
    updateRoutineCellColor(s as HTMLSelectElement);
  });
  showFeedback('Rutina del Lunes copiada a todos los días');
});

document.querySelector('.clear-routine-all')?.addEventListener('click', () => {
  if (!confirm('¿Limpiar todas las asignaciones de rutina?')) return;
  routineCalendar.querySelectorAll('.routine-select').forEach(s => {
    s.value = '';
    updateRoutineCellColor(s as HTMLSelectElement);
  });
  showFeedback('Rutinas limpiadas');
});

document.getElementById('save-nutrition')!.onclick = async () => {
  const btn = document.getElementById('save-nutrition') as HTMLButtonElement;
  const saving = document.getElementById('nutrition-saving')!;
  const userId = Number(userSelect.value);

  if (!userId) {
    showFeedback('Selecciona un usuario primero', true);
    return;
  }

  btn.disabled = true;
  saving.style.display = 'inline';

  const assignments: { meal_id: number; day_of_week: string; meal_type: string }[] = [];

  nutritionCalendar.querySelectorAll('.meal-select').forEach((select) => {
    const s = select as HTMLSelectElement;
    if (s.value) {
      assignments.push({
        meal_id: Number(s.value),
        day_of_week: s.getAttribute('data-day')!,
        meal_type: s.getAttribute('data-type')!
      });
    }
  });

  try {
    const response = await fetch('/api/nutrition/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, assignments })
    });

    if (response.ok) {
      showFeedback('Plan de nutrición guardado con éxito');
    } else {
      const err = await response.json();
      showFeedback(err.message || 'Error al guardar', true);
    }
  } catch {
    showFeedback('Error de conexión', true);
  } finally {
    btn.disabled = false;
    saving.style.display = 'none';
  }
};

document.getElementById('save-routines')!.onclick = async () => {
  const btn = document.getElementById('save-routines') as HTMLButtonElement;
  const saving = document.getElementById('routine-saving')!;
  const userId = Number(userSelect.value);

  if (!userId) {
    showFeedback('Selecciona un usuario primero', true);
    return;
  }

  btn.disabled = true;
  saving.style.display = 'inline';

  const assignments: { routine_id: number; day_of_week: string }[] = [];

  routineCalendar.querySelectorAll('.routine-select').forEach((select) => {
    const s = select as HTMLSelectElement;
    if (s.value) {
      assignments.push({
        routine_id: Number(s.value),
        day_of_week: s.getAttribute('data-day')!,
      });
    }
  });

  if (assignments.length === 0) {
    if (!confirm('No hay rutinas seleccionadas. ¿Limpiar todas las rutinas de este usuario?')) {
      btn.disabled = false;
      saving.style.display = 'none';
      return;
    }
  }

  try {
    const response = await fetch('/api/routines/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, assignments })
    });

    if (response.ok) {
      showFeedback('Rutinas guardadas con éxito');
    } else {
      const err = await response.json();
      showFeedback(err.message || 'Error al guardar', true);
    }
  } catch {
    showFeedback('Error de conexión', true);
  } finally {
    btn.disabled = false;
    saving.style.display = 'none';
  }
};

init();
