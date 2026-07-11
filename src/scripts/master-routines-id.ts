const main = document.querySelector('.routine-detail')!;
const ROUTINE_ID = Number(main.getAttribute('data-routine-id'));
const modal = document.getElementById('exercise-modal')!;
const form = document.getElementById('add-exercise-form') as HTMLFormElement;
const container = document.getElementById('exercises-container')!;
const addBtn = document.getElementById('add-exercise-btn')!;
const nameEl = document.getElementById('routine-name')!;
const descEl = document.getElementById('routine-desc')!;
const exerciseSelect = document.getElementById('exercise-select') as HTMLSelectElement;

async function loadRoutine() {
  try {
    const [routineRes, exercisesRes] = await Promise.all([
      fetch(`/api/routines/${ROUTINE_ID}`),
      fetch('/api/exercises')
    ]);
    const routine = await routineRes.json();
    const allExercises = await exercisesRes.json();

    nameEl.textContent = routine.name;
    descEl.textContent = routine.description || 'Sin descripción';

    const addedIds = new Set((routine.exercises || []).map((e: any) => e.exercise_id));
    exerciseSelect.innerHTML = '<option value="">Seleccionar ejercicio...</option>' +
      allExercises
        .filter((ex: any) => !addedIds.has(ex.id))
        .map((ex: any) => `<option value="${ex.id}">${ex.name} (${ex.muscle_group || 'General'})</option>`)
        .join('');

    renderExercises(routine.exercises || []);
  } catch (error) {
    container.innerHTML = '<div class="error-state">Error al cargar rutina.</div>';
  }
}

function renderExercises(exercises: any[]) {
  if (exercises.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Esta rutina no tiene ejercicios. Agrega tu primer ejercicio.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="exercise-grid">
      ${exercises.map((ex: any, i: number) => `
        <div class="ex-card glass-card" data-exercise-id="${ex.exercise_id}">
          <div class="ex-order">${i + 1}</div>
          <div class="ex-info">
            <h3>${ex.name}</h3>
            <div class="ex-tags">
              <span class="muscle-tag">${ex.muscle_group || 'General'}</span>
              <span class="diff-tag ${ex.difficulty}">${ex.difficulty === 'beginner' ? 'Principiante' : ex.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzado'}</span>
            </div>
            ${ex.exercise_description ? `<p class="ex-desc">${ex.exercise_description}</p>` : ''}
          </div>
          <div class="ex-config">
            <div class="config-item">
              <label>Series</label>
              <span class="config-val">${ex.sets}</span>
            </div>
            <div class="config-item">
              <label>Reps</label>
              <span class="config-val">${ex.reps}</span>
            </div>
            <div class="config-item">
              <label>Descanso</label>
              <span class="config-val">${ex.rest_seconds}s</span>
            </div>
          </div>
          <button class="btn-remove" title="Quitar de la rutina">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('.btn-remove').forEach((btn, i) => {
    (btn as HTMLElement).onclick = () => removeExercise(exercises[i].exercise_id);
  });
}

async function removeExercise(exerciseId: number) {
  if (!confirm('¿Quitar este ejercicio de la rutina?')) return;
  try {
    const response = await fetch(`/api/routines/${ROUTINE_ID}/exercises`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercise_id: exerciseId })
    });
    if (response.ok) loadRoutine();
  } catch (error) {
    console.error('Remove error:', error);
  }
}

addBtn.onclick = () => { modal.style.display = 'flex'; };

form.onsubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  try {
    const response = await fetch(`/api/routines/${ROUTINE_ID}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exercise_id: Number(data.exercise_id),
        sets: Number(data.sets),
        reps: Number(data.reps),
        rest_seconds: Number(data.rest_seconds),
      })
    });
    if (response.ok) {
      modal.style.display = 'none';
      loadRoutine();
    }
  } catch (error) {
    console.error('Add exercise error:', error);
  }
};

loadRoutine();
