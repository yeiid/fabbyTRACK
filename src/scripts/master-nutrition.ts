const modal = document.getElementById('meal-modal')!;
const form = document.getElementById('meal-form') as HTMLFormElement;
const container = document.getElementById('meals-container')!;
const addBtn = document.getElementById('add-meal-btn')!;

async function fetchMeals() {
  try {
    const response = await fetch('/api/nutrition/meals');
    const meals = await response.json();

    if (meals.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No hay recetas en el catálogo. Comienza añadiendo una.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = meals.map((meal: any) => `
      <div class="meal-card glass-card" data-meal-id="${meal.id}">
        <div class="card-image-wrapper">
          ${meal.photo_url ? `<img src="${meal.photo_url}" alt="${meal.name}" class="meal-img">` : `
            <div class="meal-img-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
          `}
          <span class="type-badge badge-${meal.meal_type}">${meal.meal_type}</span>
          <button class="btn-delete-float delete-meal-btn" title="Eliminar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
        
        <div class="card-info">
          <h3>${meal.name}</h3>
          
          <div class="macros-strip">
            <div class="macro-item kcal">
              <span class="m-val">${meal.total_calories || 0}</span>
              <span class="m-label">Kcal</span>
            </div>
            <div class="macro-item prot">
              <span class="m-val">${meal.protein_g || 0}g</span>
              <span class="m-label">Prot</span>
            </div>
            <div class="macro-item carbs">
              <span class="m-val">${meal.carbs_g || 0}g</span>
              <span class="m-label">Carb</span>
            </div>
            <div class="macro-item fats">
              <span class="m-val">${meal.fat_g || 0}g</span>
              <span class="m-label">Gras</span>
            </div>
          </div>

          ${meal.ingredients && meal.ingredients.length > 0 ? `
            <div class="ing-preview">
              ${meal.ingredients.slice(0, 2).map((ing: any) => `<span>• ${ing.ingredient_name}</span>`).join('')}
              ${meal.ingredients.length > 2 ? `<span class="more">+${meal.ingredients.length - 2} más</span>` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  } catch (error) {
    container.innerHTML = '<div class="error-state">Error al cargar recetas.</div>';
  }
}

async function deleteMeal(id: number) {
  if (!confirm('¿Estás seguro de eliminar esta comida?')) return;
  try {
    const response = await fetch('/api/nutrition/' + id, { method: 'DELETE' });
    if (response.ok) fetchMeals();
  } catch (error) {
    console.error('Delete error:', error);
  }
}

addBtn.onclick = () => {
  form.reset();
  modal.style.display = 'flex';
};

form.onsubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const data: any = Object.fromEntries(formData);
  
  const ingredientsText = (document.getElementById('ingredients-text') as HTMLTextAreaElement).value;
  data.ingredients = ingredientsText.split('\n').filter(line => line.trim()).map(line => {
    return { name: line.trim(), quantity: '' };
  });

  try {
    const response = await fetch('/api/nutrition/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      modal.style.display = 'none';
      fetchMeals();
    } else {
      const err = await response.json();
      alert(err.message || 'Error al guardar la comida');
    }
  } catch (error) {
    console.error('Save error:', error);
  }
};

document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const deleteBtn = target.closest('.delete-meal-btn');
  if (deleteBtn) {
    const mealId = deleteBtn.closest('.meal-card')?.getAttribute('data-meal-id');
    if (mealId) deleteMeal(Number(mealId));
  }
});

fetchMeals();
