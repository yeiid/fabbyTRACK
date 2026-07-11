const modal = document.getElementById('routine-modal')!;
const form = document.getElementById('routine-form') as HTMLFormElement;
const container = document.getElementById('routines-container')!;
const addBtn = document.getElementById('add-routine-btn')!;
const modalTitle = modal.querySelector('h2')!;

async function fetchRoutines() {
  try {
    const response = await fetch('/api/routines');
    const routines = await response.json();

    if (routines.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No hay rutinas creadas. Comienza creando una.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = routines.map((r: any) => `
      <div class="routine-card glass-card" data-routine-id="${r.id}">
        <div class="card-top">
          <h3>${r.name}</h3>
          <div class="action-icons">
            <button class="icon-btn-edit" title="Editar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="icon-btn-exercises" title="Gestionar Ejercicios">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
            </button>
            <button class="icon-btn-delete" title="Eliminar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        ${r.description ? `<p class="routine-desc">${r.description}</p>` : ''}
        <div class="card-footer">
          <span class="ex-count">${r.exercise_count} ejercicios</span>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.icon-btn-edit').forEach((btn, i) => {
      (btn as HTMLElement).onclick = () => editRoutine(routines[i]);
    });
    document.querySelectorAll('.icon-btn-delete').forEach((btn, i) => {
      (btn as HTMLElement).onclick = () => deleteRoutine(routines[i].id);
    });
    document.querySelectorAll('.icon-btn-exercises').forEach((btn, i) => {
      (btn as HTMLElement).onclick = () => manageExercises(routines[i]);
    });
  } catch (error) {
    container.innerHTML = '<div class="error-state">Error al cargar rutinas.</div>';
  }
}

function editRoutine(r: any) {
  modalTitle.textContent = 'Editar Rutina';
  (document.getElementById('routine-id') as HTMLInputElement).value = r.id;
  (document.getElementById('name') as HTMLInputElement).value = r.name;
  (document.getElementById('description') as HTMLTextAreaElement).value = r.description || '';
  modal.style.display = 'flex';
}

async function deleteRoutine(id: number) {
  if (!confirm('¿Eliminar esta rutina y todos sus ejercicios?')) return;
  try {
    const response = await fetch(`/api/routines/${id}`, { method: 'DELETE' });
    if (response.ok) fetchRoutines();
  } catch (error) {
    console.error('Delete error:', error);
  }
}

function manageExercises(r: any) {
  window.location.href = `/master/routines/${r.id}`;
}

addBtn.onclick = () => {
  form.reset();
  (document.getElementById('routine-id') as HTMLInputElement).value = '';
  modalTitle.textContent = 'Nueva Rutina';
  modal.style.display = 'flex';
};

form.onsubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  const id = data.id;

  const url = id ? `/api/routines/${id}` : '/api/routines';
  const method = id ? 'PATCH' : 'POST';

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (response.ok) {
      modal.style.display = 'none';
      fetchRoutines();
    }
  } catch (error) {
    console.error('Save error:', error);
  }
};

fetchRoutines();
