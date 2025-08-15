// Simple search and filter functionality
document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.pathname.includes('recipe-list.html')) return;
    
    setTimeout(() => {
        setupFilters();
    }, 500);
});

function setupFilters() {
    const recipeSearch = document.getElementById('recipeSearch');
    const categoryFilter = document.getElementById('categoryFilter');
    const timeFilter = document.getElementById('timeFilter');
    const difficultyFilter = document.getElementById('difficultyFilter');
    const ratingFilter = document.getElementById('ratingFilter');
    const clearBtn = document.getElementById('clearFilters');

    if (recipeSearch) {
        recipeSearch.addEventListener('input', filterRecipes);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterRecipes);
    }
    
    if (timeFilter) {
        timeFilter.addEventListener('change', filterRecipes);
    }
    
    if (difficultyFilter) {
        difficultyFilter.addEventListener('change', filterRecipes);
    }
    
    if (ratingFilter) {
        ratingFilter.addEventListener('change', filterRecipes);
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllFilters);
    }
}

function filterRecipes() {
    const recipes = window.foodieHub?.recipes || [];
    if (recipes.length === 0) return;
    
    const query = document.getElementById('recipeSearch')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    const time = document.getElementById('timeFilter')?.value || '';
    const difficulty = document.getElementById('difficultyFilter')?.value || '';
    const rating = document.getElementById('ratingFilter')?.value || '';
    
    let filtered = recipes.filter(recipe => {
        // Search query
        if (query && !recipe.name.toLowerCase().includes(query) && 
            !recipe.description.toLowerCase().includes(query)) {
            return false;
        }
        
        // Category
        if (category && recipe.category !== category) {
            return false;
        }
        
        // Time
        if (time) {
            const cookTime = parseInt(recipe.cookTime);
            if (time === 'quick' && cookTime > 15) return false;
            if (time === 'medium' && (cookTime <= 15 || cookTime > 30)) return false;
            if (time === 'long' && cookTime <= 30) return false;
        }
        
        // Difficulty
        if (difficulty && recipe.difficulty.toLowerCase() !== difficulty) {
            return false;
        }
        
        // Rating
        if (rating && recipe.rating < parseInt(rating)) {
            return false;
        }
        
        return true;
    });
    
    displayFilteredRecipes(filtered);
}

function displayFilteredRecipes(recipes) {
    const recipeGrid = document.getElementById('recipeGrid');
    const resultCount = document.getElementById('resultCount');
    
    if (resultCount) {
        resultCount.textContent = `${recipes.length} recipe${recipes.length !== 1 ? 's' : ''} found`;
    }
    
    if (!recipeGrid) return;
    
    if (recipes.length === 0) {
        recipeGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search" style="font-size: 4rem; color: var(--text-light); margin-bottom: 20px;"></i>
                <h3>No recipes found</h3>
                <p>Try adjusting your search criteria.</p>
            </div>
        `;
        return;
    }
    
    recipeGrid.innerHTML = recipes.map(recipe => {
        const isFavorite = window.foodieHub?.favorites?.some(fav => fav.id === recipe.id) || false;
        const stars = '★'.repeat(Math.floor(recipe.rating)) + '☆'.repeat(5 - Math.floor(recipe.rating));
        
        return `
            <div class="recipe-card fade-in">
                <img src="${recipe.image}" alt="${recipe.name}" loading="lazy">
                <div class="recipe-card-content">
                    <h3>${recipe.name}</h3>
                    <div class="recipe-meta">
                        <span><i class="fas fa-clock"></i> ${recipe.cookTime}</span>
                        <span><i class="fas fa-signal"></i> ${recipe.difficulty}</span>
                        <span class="rating"><span class="stars">${stars}</span> ${recipe.rating}</span>
                    </div>
                    <div class="card-actions">
                        <a href="recipe-detail.html?id=${recipe.id}" class="btn-primary">View Recipe</a>
                        <button class="favorite-toggle ${isFavorite ? 'active' : ''}" data-id="${recipe.id}">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add favorite listeners
    document.querySelectorAll('.favorite-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const recipeId = parseInt(btn.dataset.id);
            window.foodieHub?.toggleFavorite(recipeId);
        });
    });
}

function clearAllFilters() {
    document.getElementById('recipeSearch').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('timeFilter').value = '';
    document.getElementById('difficultyFilter').value = '';
    document.getElementById('ratingFilter').value = '';
    filterRecipes();
}