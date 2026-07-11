const modal = document.getElementById('exercise-modal')!;
const form = document.getElementById('exercise-form') as HTMLFormElement;
const container = document.getElementById('exercises-container')!;
const addBtn = document.getElementById('add-exercise-btn')!;
const modalTitle = modal.querySelector('h2')!;

async function fetchExercises() {
  try {
    const response = await fetch('/api/exercises');
    const exercises = await response.json();

    if (exercises.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          <p>Tu catálogo está vacío. Comienza añadiendo tu primer ejercicio.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = exercises.map((ex: any) => `
      <div class="exercise-card glass-card" data-id="${ex.id}">
        <div class="card-top">
          <span class="muscle-badge">${ex.muscle_group || 'General'}</span>
          <div class="action-icons">
            <button class="icon-btn-edit" title="Editar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="icon-btn-delete" title="Eliminar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        <div class="card-content">
          <h3>${ex.name}</h3>
          <p class="ex-description">${ex.description || 'Sin descripción detallada'}</p>
        </div>
        <div class="card-footer">
          <span class="diff-indicator ${ex.difficulty}">${ex.difficulty === 'beginner' ? 'Principiante' : ex.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzado'}</span>
          ${ex.youtube_url ? `
            <a href="${ex.youtube_url}" target="_blank" class="video-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              Video
            </a>
          ` : '<span class="no-video">Sin video</span>'}
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.icon-btn-edit').forEach((btn, i) => {
      (btn as HTMLElement).onclick = () => editExercise(exercises[i]);
    });
    document.querySelectorAll('.icon-btn-delete').forEach((btn, i) => {
      (btn as HTMLElement).onclick = () => deleteExercise(exercises[i].id);
    });
  } catch (error) {
    container.innerHTML = '<div class="error-state">Error al cargar la biblioteca. Intenta de nuevo.</div>';
  }
}

function editExercise(ex: any) {
  modalTitle.textContent = 'Editar Ejercicio';
  (document.getElementById('exercise-id') as HTMLInputElement).value = ex.id;
  (document.getElementById('name') as HTMLInputElement).value = ex.name;
  (document.getElementById('muscle_group') as HTMLSelectElement).value = ex.muscle_group || 'Piernas';
  (document.getElementById('difficulty') as HTMLSelectElement).value = ex.difficulty || 'beginner';
  (document.getElementById('youtube_url') as HTMLInputElement).value = ex.youtube_url || '';
  (document.getElementById('description') as HTMLTextAreaElement).value = ex.description || '';
  (document.getElementById('recommendation') as HTMLTextAreaElement).value = ex.recommendation || '';
  modal.style.display = 'flex';
}

async function deleteExercise(id: number) {
  if (!confirm('¿Estás seguro de eliminar este ejercicio?')) return;
  try {
    const response = await fetch(`/api/exercises/${id}`, { method: 'DELETE' });
    if (response.ok) fetchExercises();
  } catch (error) {
    console.error('Delete error:', error);
  }
}

addBtn.onclick = () => {
  form.reset();
  (document.getElementById('exercise-id') as HTMLInputElement).value = '';
  modalTitle.textContent = 'Nuevo Ejercicio';
  modal.style.display = 'flex';
};

form.onsubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  const id = data.id;

  const url = id ? `/api/exercises/${id}` : '/api/exercises';
  const method = id ? 'PATCH' : 'POST';

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      modal.style.display = 'none';
      fetchExercises();
    } else {
      const err = await response.json();
      alert(err.message || 'Error al guardar el ejercicio');
    }
  } catch (error) {
    console.error('Save error:', error);
  }
};

fetchExercises();
