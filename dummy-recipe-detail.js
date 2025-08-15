// DummyJSON Recipe Detail functionality
const BASE_URL = 'https://dummyjson.com/recipes';

class DummyRecipeDetail {
    constructor() {
        this.recipe = null;
        this.init();
    }

    init() {
        if (!window.location.pathname.includes('recipe-detail.html')) return;
        
        const urlParams = new URLSearchParams(window.location.search);
        const recipeId = urlParams.get('id');
        const isDummy = urlParams.get('api') === 'dummy';
        
        if (recipeId && isDummy) {
            this.loadDummyRecipe(recipeId);
        }
    }

    async loadDummyRecipe(recipeId) {
        try {
            this.showLoading();
            
            const response = await fetch(`${BASE_URL}/${recipeId}`);
            const recipe = await response.json();
            
            this.recipe = recipe;
            this.renderRecipeDetail();
            
        } catch (error) {
            console.error('Error loading recipe:', error);
            this.showError();
        } finally {
            this.hideLoading();
        }
    }

    renderRecipeDetail() {
        const recipe = this.recipe;
        
        document.title = `${recipe.name} - FoodieHub`;
        
        const banner = document.getElementById('recipeBanner');
        if (banner) {
            banner.style.backgroundImage = `url(${recipe.image})`;
        }

        document.getElementById('recipeTitle').textContent = recipe.name;
        document.getElementById('cookTime').textContent = `${recipe.prepTimeMinutes + recipe.cookTimeMinutes} mins`;
        document.getElementById('difficulty').textContent = recipe.difficulty || 'Medium';
        document.getElementById('category').textContent = recipe.cuisine || 'International';
        document.getElementById('recipeDescription').textContent = `Serves ${recipe.servings} people. ${recipe.mealType?.join(', ') || 'Perfect for any meal'}.`;

        this.updateFavoriteButton();
        this.renderIngredients();
        this.renderInstructions();

        const favoriteBtn = document.getElementById('favoriteBtn');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => this.toggleFavorite());
        }
    }

    renderIngredients() {
        const ingredientsList = document.getElementById('ingredientsList');
        if (!ingredientsList || !this.recipe.ingredients) return;

        ingredientsList.innerHTML = this.recipe.ingredients
            .map((ingredient, index) => `
                <li>
                    <input type="checkbox" id="ingredient-${index}">
                    <label for="ingredient-${index}">${ingredient}</label>
                </li>
            `).join('');

        ingredientsList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const label = e.target.nextElementSibling;
                if (e.target.checked) {
                    label.style.textDecoration = 'line-through';
                    label.style.opacity = '0.6';
                } else {
                    label.style.textDecoration = 'none';
                    label.style.opacity = '1';
                }
            });
        });
    }

    renderInstructions() {
        const instructionsList = document.getElementById('instructionsList');
        if (!instructionsList) return;

        if (this.recipe.instructions && Array.isArray(this.recipe.instructions)) {
            instructionsList.innerHTML = this.recipe.instructions
                .map(instruction => `<li>${instruction}</li>`)
                .join('');
        } else {
            instructionsList.innerHTML = '<li>Instructions not available for this recipe.</li>';
        }
    }

    updateFavoriteButton() {
        const favoriteBtn = document.getElementById('favoriteBtn');
        if (!favoriteBtn) return;

        const isFavorite = this.isFavorite();
        
        favoriteBtn.classList.toggle('active', isFavorite);
        favoriteBtn.innerHTML = isFavorite 
            ? '<i class="fas fa-heart"></i> Remove from Favorites'
            : '<i class="far fa-heart"></i> Add to Favorites';
    }

    toggleFavorite() {
        if (!this.recipe) return;

        let favorites = JSON.parse(localStorage.getItem('dummy-favorites') || '[]');
        const existingIndex = favorites.findIndex(fav => fav.id === this.recipe.id);

        if (existingIndex > -1) {
            favorites.splice(existingIndex, 1);
            this.showNotification('Removed from favorites!', 'info');
        } else {
            favorites.push(this.recipe);
            this.showNotification('Added to favorites!', 'success');
        }

        localStorage.setItem('dummy-favorites', JSON.stringify(favorites));
        this.updateFavoriteButton();
    }

    isFavorite() {
        if (!this.recipe) return false;
        const favorites = JSON.parse(localStorage.getItem('dummy-favorites') || '[]');
        return favorites.some(fav => fav.id === this.recipe.id);
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
        const main = document.querySelector('main');
        if (main) {
            main.innerHTML = `
                <div class="container">
                    <div class="recipe-not-found">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h2>Recipe Not Found</h2>
                        <p>Unable to load recipe details.</p>
                        <a href="recipe-list.html" class="btn-primary">Browse Recipes</a>
                    </div>
                </div>
            `;
        }
    }

    async loadLocalRecipe(recipeId) {
        try {
            this.showLoading();
            
            // Try to get from foodieHub first
            if (window.foodieHub && window.foodieHub.recipes) {
                const recipe = window.foodieHub.recipes.find(r => r.id == recipeId);
                if (recipe) {
                    this.recipe = {
                        name: recipe.name,
                        image: recipe.image,
                        prepTimeMinutes: parseInt(recipe.cookTime) || 30,
                        cookTimeMinutes: 0,
                        difficulty: recipe.difficulty,
                        cuisine: recipe.category,
                        ingredients: recipe.ingredients,
                        instructions: recipe.instructions,
                        servings: 4,
                        id: recipe.id
                    };
                    this.renderRecipeDetail();
                    return;
                }
            }
            
            // Fallback: load from recipes.json directly
            const response = await fetch('recipes.json');
            const data = await response.json();
            const recipe = data.recipes.find(r => r.id == recipeId);
            
            if (recipe) {
                this.recipe = {
                    name: recipe.name,
                    image: recipe.image,
                    prepTimeMinutes: parseInt(recipe.cookTime) || 30,
                    cookTimeMinutes: 0,
                    difficulty: recipe.difficulty,
                    cuisine: recipe.category,
                    ingredients: recipe.ingredients,
                    instructions: recipe.instructions,
                    servings: 4,
                    id: recipe.id
                };
                this.renderRecipeDetail();
            } else {
                this.showError();
            }
        } catch (error) {
            console.error('Error loading local recipe:', error);
            this.showError();
        } finally {
            this.hideLoading();
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
    window.dummyRecipeDetail = new DummyRecipeDetail();
});