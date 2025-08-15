// FatSecret API integration
const CLIENT_ID = '75cd4dceac884eeba1e1d0517efeea80';
const CLIENT_SECRET = 'b29cf49705cf47d0b84c72c6884ebc6f';
const BASE_URL = 'https://platform.fatsecret.com/rest/server.api';

class FatSecretAPI {
    constructor() {
        this.accessToken = null;
        this.recipes = [];
        this.init();
    }

    init() {
        if (!window.location.pathname.includes('recipe-list.html')) return;
        setTimeout(() => {
            this.authenticate().then(() => {
                this.setupFilters();
                this.loadRecipes();
            });
        }, 500);
    }

    async authenticate() {
        try {
            const response = await fetch('https://oauth.fatsecret.com/connect/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
                },
                body: 'grant_type=client_credentials&scope=premier'
            });
            
            const data = await response.json();
            this.accessToken = data.access_token;
        } catch (error) {
            console.error('Authentication failed:', error);
        }
    }

    setupFilters() {
        const recipeSearch = document.getElementById('recipeSearch');
        const clearBtn = document.getElementById('clearFilters');

        if (recipeSearch) {
            recipeSearch.addEventListener('input', (e) => {
                this.searchRecipes(e.target.value);
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearFilters());
        }
    }

    async loadRecipes() {
        try {
            this.showLoading();
            await this.searchRecipes('chicken'); // Default search
        } catch (error) {
            console.error('Error loading recipes:', error);
            this.showError();
        } finally {
            this.hideLoading();
        }
    }

    async searchRecipes(query = '') {
        if (!this.accessToken || !query.trim()) return;

        try {
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify({
                    method: 'recipes.search.v3',
                    search_expression: query,
                    max_results: 20,
                    format: 'json'
                })
            });

            const data = await response.json();
            this.recipes = data.recipes?.recipe || [];
            this.displayRecipes();
        } catch (error) {
            console.error('Search failed:', error);
        }
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
        const isFavorite = this.isFavorite(recipe.recipe_id);
        
        return `
            <div class="recipe-card fade-in">
                <img src="${recipe.recipe_image || 'https://via.placeholder.com/300x200'}" alt="${recipe.recipe_name}" loading="lazy">
                <div class="recipe-card-content">
                    <h3>${recipe.recipe_name}</h3>
                    <div class="recipe-meta">
                        <span><i class="fas fa-utensils"></i> ${recipe.recipe_category || 'Recipe'}</span>
                        <span><i class="fas fa-star"></i> FatSecret</span>
                    </div>
                    <div class="card-actions">
                        <a href="recipe-detail.html?id=${recipe.recipe_id}&api=fatsecret" class="btn-primary">View Recipe</a>
                        <button class="favorite-toggle ${isFavorite ? 'active' : ''}" data-id="${recipe.recipe_id}">
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
                const recipeId = btn.dataset.id;
                this.toggleFavorite(recipeId, btn);
            });
        });
    }

    toggleFavorite(recipeId, button) {
        const recipe = this.recipes.find(r => r.recipe_id === recipeId);
        if (!recipe) return;

        let favorites = JSON.parse(localStorage.getItem('fatsecret-favorites') || '[]');
        const existingIndex = favorites.findIndex(fav => fav.recipe_id === recipeId);

        if (existingIndex > -1) {
            favorites.splice(existingIndex, 1);
            button.classList.remove('active');
            this.showNotification('Removed from favorites!', 'info');
        } else {
            favorites.push(recipe);
            button.classList.add('active');
            this.showNotification('Added to favorites!', 'success');
        }

        localStorage.setItem('fatsecret-favorites', JSON.stringify(favorites));
    }

    isFavorite(recipeId) {
        const favorites = JSON.parse(localStorage.getItem('fatsecret-favorites') || '[]');
        return favorites.some(fav => fav.recipe_id === recipeId);
    }

    clearFilters() {
        document.getElementById('recipeSearch').value = '';
        this.searchRecipes('chicken');
    }

    getNoResultsHTML() {
        return `
            <div class="no-results">
                <i class="fas fa-search" style="font-size: 4rem; color: var(--text-light); margin-bottom: 20px;"></i>
                <h3>No recipes found</h3>
                <p>Try a different search term.</p>
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

document.addEventListener('DOMContentLoaded', () => {
    window.fatSecretAPI = new FatSecretAPI();
});