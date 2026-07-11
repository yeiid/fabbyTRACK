const userSelect = document.getElementById('user-select') as HTMLSelectElement;
const userSearch = document.getElementById('user-search') as HTMLInputElement;
const editor = document.getElementById('assignment-editor')!;
const feedbackEl = document.getElementById('assign-feedback') as HTMLDivElement;

let allUsers: any[] = [];
let meals: any[] = [];
let routines: any[] = [];

function getMealSelects() { return document.querySelectorAll('.meal-select') as NodeListOf<HTMLSelectElement>; }
function getRoutineSelects() { return document.querySelectorAll('.routine-select') as NodeListOf<HTMLSelectElement>; }

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
    populateMealOptions();
    populateRoutineOptions();
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

function populateMealOptions() {
  getMealSelects().forEach(select => {
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

function populateRoutineOptions() {
  getRoutineSelects().forEach(select => {
    select.innerHTML = '<option value="">Ninguna</option>' +
      routines.map((r: any) => {
        const count = r.exercise_count ? ` [${r.exercise_count} ej.]` : '';
        return `<option value="${r.id}">${r.name}${count}</option>`;
      }).join('');
  });
}

async function loadAssignments(userId: string) {
  try {
    const [nutritionRes, routinesRes] = await Promise.all([
      fetch(`/api/nutrition/assign?userId=${userId}`),
      fetch(`/api/routines/assign?userId=${userId}`),
    ]);
    if (nutritionRes.ok) {
      const nutritionData = await nutritionRes.json();
      getMealSelects().forEach(s => {
        const day = s.getAttribute('data-day');
        const type = s.getAttribute('data-type');
        const match = nutritionData.find((a: any) => a.day_of_week === day && a.meal_type === type);
        s.value = match ? String(match.meal_id) : '';
      });
    }
    if (routinesRes.ok) {
      const routineData = await routinesRes.json();
      getRoutineSelects().forEach(s => {
        const day = s.getAttribute('data-day');
        const match = routineData.find((a: any) => a.day_of_week === day);
        s.value = match ? String(match.routine_id) : '';
      });
    }
    highlightAssignedDays();
  } catch (error) {
    console.error('Load assignments error:', error);
  }
}

function highlightAssignedDays() {
  document.querySelectorAll('.day-card').forEach(card => {
    const day = card.getAttribute('data-day');
    const hasMeal = Array.from(getMealSelects()).some(s => s.getAttribute('data-day') === day && s.value);
    const hasRoutine = Array.from(getRoutineSelects()).some(s => s.getAttribute('data-day') === day && s.value);
    card.classList.toggle('has-assignments', hasMeal || hasRoutine);
  });
}

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

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const tabId = btn.getAttribute('data-tab') + '-tab';
    document.getElementById(tabId)!.classList.add('active');
  });
});

document.querySelector('.copy-all-nutrition')?.addEventListener('click', () => {
  const mondaySelects = Array.from(getMealSelects()).filter(s => s.getAttribute('data-day') === 'Lunes');
  getMealSelects().forEach(s => {
    const type = s.getAttribute('data-type');
    const mondayMatch = mondaySelects.find(ms => ms.getAttribute('data-type') === type);
    if (mondayMatch) s.value = mondayMatch.value;
  });
  highlightAssignedDays();
  showFeedback('Menú del Lunes copiado a todos los días');
});

document.querySelector('.copy-all-routines')?.addEventListener('click', () => {
  const mondaySelect = Array.from(getRoutineSelects()).find(s => s.getAttribute('data-day') === 'Lunes');
  if (mondaySelect) {
    getRoutineSelects().forEach(s => { s.value = mondaySelect.value; });
    highlightAssignedDays();
    showFeedback('Rutina del Lunes copiada a todos los días');
  }
});

document.querySelector('.clear-nutrition')?.addEventListener('click', () => {
  if (!confirm('¿Limpiar todas las asignaciones de nutrición?')) return;
  getMealSelects().forEach(s => { s.value = ''; });
  highlightAssignedDays();
  showFeedback('Plan de nutrición limpiado');
});

document.querySelector('.clear-routines')?.addEventListener('click', () => {
  if (!confirm('¿Limpiar todas las asignaciones de rutina?')) return;
  getRoutineSelects().forEach(s => { s.value = ''; });
  highlightAssignedDays();
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

  getMealSelects().forEach((select) => {
    if (select.value) {
      assignments.push({
        meal_id: Number(select.value),
        day_of_week: select.getAttribute('data-day')!,
        meal_type: select.getAttribute('data-type')!
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

  getRoutineSelects().forEach((select) => {
    if (select.value) {
      assignments.push({
        routine_id: Number(select.value),
        day_of_week: select.getAttribute('data-day')!,
      });
    }
  });

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
