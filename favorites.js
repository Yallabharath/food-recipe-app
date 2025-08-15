// Favorites management
class FavoritesManager {
    constructor(foodieHub) {
        this.foodieHub = foodieHub;
        this.init();
    }

    init() {
        this.loadFavoritesPage();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for favorite toggle events
        document.addEventListener('click', (e) => {
            if (e.target.closest('.favorite-toggle')) {
                const btn = e.target.closest('.favorite-toggle');
                const recipeId = parseInt(btn.dataset.id);
                this.handleFavoriteToggle(recipeId, btn);
            }
        });
    }

    loadFavoritesPage() {
        const favoritesGrid = document.getElementById('favoritesGrid');
        const emptyFavorites = document.getElementById('emptyFavorites');
        
        if (!favoritesGrid) return;

        // Get both local and API favorites
        const localFavorites = this.foodieHub?.favorites || [];
        const dummyFavorites = JSON.parse(localStorage.getItem('dummy-favorites') || '[]');
        const allFavorites = [...localFavorites, ...dummyFavorites];

        if (allFavorites.length === 0) {
            favoritesGrid.style.display = 'none';
            if (emptyFavorites) emptyFavorites.style.display = 'block';
            return;
        }

        if (emptyFavorites) emptyFavorites.style.display = 'none';
        favoritesGrid.style.display = 'grid';

        favoritesGrid.innerHTML = allFavorites
            .map(recipe => this.createFavoriteCard(recipe))
            .join('');

        // Add animations
        favoritesGrid.querySelectorAll('.recipe-card').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('fade-in');
        });
    }

    createFavoriteCard(recipe) {
        // Handle both local and API recipe formats
        const name = recipe.name || recipe.title;
        const cookTime = recipe.cookTime || `${(recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)} mins`;
        const difficulty = recipe.difficulty || 'Medium';
        const category = recipe.category || recipe.cuisine || 'Recipe';
        const apiParam = recipe.cuisine ? '&api=dummy' : '';
        
        return `
            <div class="recipe-card">
                <img src="${recipe.image}" alt="${name}" loading="lazy">
                <div class="recipe-card-content">
                    <h3>${name}</h3>
                    <div class="recipe-meta">
                        <span><i class="fas fa-clock"></i> ${cookTime}</span>
                        <span><i class="fas fa-signal"></i> ${difficulty}</span>
                        <span><i class="fas fa-tag"></i> ${category}</span>
                    </div>
                    <div class="card-actions">
                        <a href="recipe-detail.html?id=${recipe.id}${apiParam}" class="btn-primary">View Recipe</a>
                        <button class="favorite-toggle active" data-id="${recipe.id}" title="Remove from favorites">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    handleFavoriteToggle(recipeId, button) {
        const recipe = this.foodieHub.getRecipeById(recipeId);
        if (!recipe) return;

        const isFavorite = this.foodieHub.favorites.some(fav => fav.id === recipeId);
        
        if (isFavorite) {
            this.removeFromFavorites(recipeId);
            button.classList.remove('active');
            button.title = 'Add to favorites';
            
            // If we're on the favorites page, remove the card with animation
            if (window.location.pathname.includes('favorites.html')) {
                const card = button.closest('.recipe-card');
                if (card) {
                    card.style.animation = 'fadeOut 0.3s ease';
                    setTimeout(() => {
                        this.loadFavoritesPage(); // Reload the page
                    }, 300);
                }
            }
        } else {
            this.addToFavorites(recipe);
            button.classList.add('active');
            button.title = 'Remove from favorites';
        }
    }

    addToFavorites(recipe) {
        if (!this.foodieHub.favorites.some(fav => fav.id === recipe.id)) {
            this.foodieHub.favorites.push(recipe);
            this.saveFavorites();
            this.showFavoriteNotification('Added to favorites!', 'success');
        }
    }

    removeFromFavorites(recipeId) {
        this.foodieHub.favorites = this.foodieHub.favorites.filter(fav => fav.id !== recipeId);
        this.saveFavorites();
        this.showFavoriteNotification('Removed from favorites!', 'info');
    }

    saveFavorites() {
        localStorage.setItem('favorites', JSON.stringify(this.foodieHub.favorites));
    }

    showFavoriteNotification(message, type) {
        this.foodieHub.showNotification(message, type);
    }

    // Utility methods
    getFavoriteCount() {
        return this.foodieHub.favorites.length;
    }

    isFavorite(recipeId) {
        return this.foodieHub.favorites.some(fav => fav.id === recipeId);
    }

    getFavoritesByCategory(category) {
        return this.foodieHub.favorites.filter(recipe => recipe.category === category);
    }

    clearAllFavorites() {
        if (confirm('Are you sure you want to remove all favorites?')) {
            this.foodieHub.favorites = [];
            this.saveFavorites();
            this.loadFavoritesPage();
            this.showFavoriteNotification('All favorites cleared!', 'info');
        }
    }

    exportFavorites() {
        const favorites = this.foodieHub.favorites;
        const dataStr = JSON.stringify(favorites, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'my-favorite-recipes.json';
        link.click();
        
        this.showFavoriteNotification('Favorites exported!', 'success');
    }

    importFavorites(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedFavorites = JSON.parse(e.target.result);
                
                // Validate the imported data
                if (Array.isArray(importedFavorites)) {
                    // Merge with existing favorites (avoid duplicates)
                    importedFavorites.forEach(recipe => {
                        if (!this.isFavorite(recipe.id)) {
                            this.foodieHub.favorites.push(recipe);
                        }
                    });
                    
                    this.saveFavorites();
                    this.loadFavoritesPage();
                    this.showFavoriteNotification('Favorites imported successfully!', 'success');
                } else {
                    throw new Error('Invalid format');
                }
            } catch (error) {
                this.showFavoriteNotification('Error importing favorites. Please check the file format.', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Recipe recommendations based on favorites
    getRecommendations() {
        if (this.foodieHub.favorites.length === 0) return [];

        // Get categories from favorites
        const favoriteCategories = [...new Set(this.foodieHub.favorites.map(recipe => recipe.category))];
        
        // Find recipes in those categories that aren't already favorites
        const recommendations = this.foodieHub.recipes.filter(recipe => 
            favoriteCategories.includes(recipe.category) && 
            !this.isFavorite(recipe.id)
        );

        // Return up to 6 recommendations
        return recommendations.slice(0, 6);
    }
}

// Initialize favorites manager
document.addEventListener('DOMContentLoaded', () => {
    if (window.foodieHub) {
        window.favoritesManager = new FavoritesManager(window.foodieHub);
    } else {
        setTimeout(() => {
            if (window.foodieHub) {
                window.favoritesManager = new FavoritesManager(window.foodieHub);
            }
        }, 100);
    }
});

// Add CSS for favorite animations
const favoritesStyle = document.createElement('style');
favoritesStyle.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.8); }
    }
    
    .favorite-toggle {
        transition: all 0.3s ease;
    }
    
    .favorite-toggle:hover {
        transform: scale(1.1);
    }
    
    .favorite-toggle.active {
        color: #ff6b6b;
        animation: heartBeat 0.6s ease;
    }
    
    @keyframes heartBeat {
        0% { transform: scale(1); }
        25% { transform: scale(1.2); }
        50% { transform: scale(1); }
        75% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
    
    .empty-favorites {
        animation: fadeIn 0.6s ease;
    }
    
    .favorites-actions {
        display: flex;
        justify-content: center;
        gap: 15px;
        margin-bottom: 30px;
        flex-wrap: wrap;
    }
    
    .btn-secondary {
        background: var(--secondary-color);
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 25px;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
        transition: all 0.3s ease;
        font-weight: 500;
    }
    
    .btn-secondary:hover {
        background: #3db8af;
        transform: translateY(-2px);
    }
`;
document.head.appendChild(favoritesStyle);