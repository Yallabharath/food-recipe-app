// DummyJSON API integration
const BASE_URL = 'https://dummyjson.com/recipes';

class DummyAPIManager {
    constructor() {
        this.allRecipes = [];
        this.recipes = [];
        this.currentFilters = {
            query: '',
            type: '',
            maxReadyTime: ''
        };
        this.init();
    }

    init() {
        if (!window.location.pathname.includes('recipe-list.html')) return;
        setTimeout(() => {
            this.setupFilters();
            this.loadRecipes();
        }, 500);
    }

    setupFilters() {
        const recipeSearch = document.getElementById('recipeSearch');
        const categoryFilter = document.getElementById('categoryFilter');
        const timeFilter = document.getElementById('timeFilter');
        const clearBtn = document.getElementById('clearFilters');

        if (recipeSearch) {
            recipeSearch.addEventListener('input', (e) => {
                this.currentFilters.query = e.target.value;
                this.debounceSearch();
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentFilters.type = e.target.value;
                this.filterRecipes();
            });
        }

        if (timeFilter) {
            timeFilter.addEventListener('change', (e) => {
                const timeMap = {
                    'quick': 30,
                    'medium': 60,
                    'long': 120
                };
                this.currentFilters.maxReadyTime = timeMap[e.target.value] || '';
                this.filterRecipes();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearFilters());
        }
    }

    debounceSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.filterRecipes();
        }, 300);
    }

    async loadRecipes() {
        try {
            this.showLoading();
            const response = await fetch(BASE_URL);
            const data = await response.json();
            
            this.allRecipes = data.recipes || [];
            this.filterRecipes();
        } catch (error) {
            console.error('API Error:', error);
            this.showError();
        } finally {
            this.hideLoading();
        }
    }

    filterRecipes() {
        let filtered = [...this.allRecipes];

        if (this.currentFilters.query) {
            filtered = filtered.filter(recipe => 
                recipe.name.toLowerCase().includes(this.currentFilters.query.toLowerCase()) ||
                recipe.ingredients.some(ing => ing.toLowerCase().includes(this.currentFilters.query.toLowerCase()))
            );
        }

        if (this.currentFilters.type) {
            filtered = filtered.filter(recipe => 
                recipe.mealType?.includes(this.currentFilters.type) ||
                recipe.cuisine?.toLowerCase() === this.currentFilters.type
            );
        }

        if (this.currentFilters.maxReadyTime) {
            filtered = filtered.filter(recipe => 
                recipe.prepTimeMinutes + recipe.cookTimeMinutes <= this.currentFilters.maxReadyTime
            );
        }

        this.recipes = filtered;
        this.displayRecipes();
    }

    displayRecipes() {
        const recipeGrid = document.getElementById('recipeGrid');
        const resultCount = document.getElementById('resultCount');

        if (resultCount) {
            resultCount.textContent = `${this.recipes.length} recipes found`;
        }

        if (!recipeGrid) return;

        if (this.recipes.length === 0) {
            recipeGrid.innerHTML = this.getNoResultsHTML();
            return;
        }

        recipeGrid.innerHTML = this.recipes.map(recipe => this.createRecipeCard(recipe)).join('');
        this.setupFavoriteToggles();
    }

    createRecipeCard(recipe) {
        const isFavorite = this.isFavorite(recipe.id);
        const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
        const stars = '★'.repeat(Math.floor(recipe.rating)) + '☆'.repeat(5 - Math.floor(recipe.rating));
        
        return `
            <div class="recipe-card fade-in">
                <img src="${recipe.image}" alt="${recipe.name}" loading="lazy">
                <div class="recipe-card-content">
                    <h3>${recipe.name}</h3>
                    <div class="recipe-meta">
                        <span><i class="fas fa-clock"></i> ${totalTime} mins</span>
                        <span><i class="fas fa-users"></i> ${recipe.servings} servings</span>
                        <span class="rating">
                            <span class="stars">${stars}</span> 
                            ${recipe.rating}
                        </span>
                    </div>
                    <div class="card-actions">
                        <a href="recipe-detail.html?id=${recipe.id}&api=dummy" class="btn-primary">View Recipe</a>
                        <button class="favorite-toggle ${isFavorite ? 'active' : ''}" data-id="${recipe.id}">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    setupFavoriteToggles() {
        document.querySelectorAll('.favorite-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const recipeId = parseInt(btn.dataset.id);
                this.toggleFavorite(recipeId, btn);
            });
        });
    }

    toggleFavorite(recipeId, button) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        let favorites = JSON.parse(localStorage.getItem('dummy-favorites') || '[]');
        const existingIndex = favorites.findIndex(fav => fav.id === recipeId);

        if (existingIndex > -1) {
            favorites.splice(existingIndex, 1);
            button.classList.remove('active');
            this.showNotification('Removed from favorites!', 'info');
        } else {
            favorites.push(recipe);
            button.classList.add('active');
            this.showNotification('Added to favorites!', 'success');
        }

        localStorage.setItem('dummy-favorites', JSON.stringify(favorites));
    }

    isFavorite(recipeId) {
        const favorites = JSON.parse(localStorage.getItem('dummy-favorites') || '[]');
        return favorites.some(fav => fav.id === recipeId);
    }

    clearFilters() {
        this.currentFilters = { query: '', type: '', maxReadyTime: '' };
        
        document.getElementById('recipeSearch').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('timeFilter').value = '';
        document.getElementById('difficultyFilter').value = '';
        
        this.filterRecipes();
    }

    getNoResultsHTML() {
        return `
            <div class="no-results">
                <i class="fas fa-search" style="font-size: 4rem; color: var(--text-light); margin-bottom: 20px;"></i>
                <h3>No recipes found</h3>
                <p>Try adjusting your search criteria.</p>
            </div>
        `;
    }

    showLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.style.display = 'flex';
    }

    hideLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.style.display = 'none';
    }

    showError() {
        const recipeGrid = document.getElementById('recipeGrid');
        if (recipeGrid) {
            recipeGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #ff6b6b; margin-bottom: 20px;"></i>
                    <h3>Unable to load recipes</h3>
                    <p>Please check your internet connection.</p>
                </div>
            `;
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : '#2196f3'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize DummyJSON API manager
document.addEventListener('DOMContentLoaded', () => {
    window.dummyAPIManager = new DummyAPIManager();
});