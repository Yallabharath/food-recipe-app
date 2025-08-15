// Search functionality
class SearchManager {
    constructor(foodieHub) {
        this.foodieHub = foodieHub;
        this.searchResults = [];
        this.currentFilters = {
            category: '',
            query: '',
            time: '',
            difficulty: '',
            rating: ''
        };
        
        this.init();
    }

    init() {
        this.setupSearchListeners();
        // Wait for recipes to load
        setTimeout(() => {
            this.loadInitialFilters();
        }, 100);
    }

    setupSearchListeners() {
        const recipeSearch = document.getElementById('recipeSearch');
        const categoryFilter = document.getElementById('categoryFilter');
        const timeFilter = document.getElementById('timeFilter');
        const difficultyFilter = document.getElementById('difficultyFilter');
        const ratingFilter = document.getElementById('ratingFilter');
        const searchBtn = document.getElementById('searchRecipeBtn');
        const clearBtn = document.getElementById('clearFilters');

        if (recipeSearch) {
            recipeSearch.addEventListener('input', (e) => {
                this.currentFilters.query = e.target.value.toLowerCase();
                this.performSearch();
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.performSearch());
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentFilters.category = e.target.value;
                this.performSearch();
            });
        }
        
        if (timeFilter) {
            timeFilter.addEventListener('change', (e) => {
                this.currentFilters.time = e.target.value;
                this.performSearch();
            });
        }
        
        if (difficultyFilter) {
            difficultyFilter.addEventListener('change', (e) => {
                this.currentFilters.difficulty = e.target.value;
                this.performSearch();
            });
        }
        
        if (ratingFilter) {
            ratingFilter.addEventListener('change', (e) => {
                this.currentFilters.rating = e.target.value;
                this.performSearch();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearFilters());
        }
    }

    loadInitialFilters() {
        const savedQuery = localStorage.getItem('searchQuery');
        const savedCategory = localStorage.getItem('selectedCategory');

        if (savedQuery) {
            this.currentFilters.query = savedQuery.toLowerCase();
            const searchInput = document.getElementById('recipeSearch');
            if (searchInput) searchInput.value = savedQuery;
            localStorage.removeItem('searchQuery');
        }

        if (savedCategory) {
            this.currentFilters.category = savedCategory;
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) categoryFilter.value = savedCategory;
            localStorage.removeItem('selectedCategory');
        }

        // Show all recipes if no filters
        if (!this.currentFilters.query && !this.currentFilters.category) {
            this.searchResults = [...this.foodieHub.recipes];
        } else {
            this.searchResults = this.filterRecipes();
        }
        this.displayResults();
    }

    performSearch() {
        // If no filters applied, show all recipes
        if (!this.currentFilters.query && !this.currentFilters.category && 
            !this.currentFilters.time && !this.currentFilters.difficulty && !this.currentFilters.rating) {
            this.searchResults = [...this.foodieHub.recipes];
        } else {
            this.searchResults = this.filterRecipes();
        }
        this.displayResults();
    }

    filterRecipes() {
        let results = [...this.foodieHub.recipes];

        if (this.currentFilters.category) {
            results = results.filter(recipe => recipe.category === this.currentFilters.category);
        }

        if (this.currentFilters.query) {
            results = results.filter(recipe => 
                recipe.name.toLowerCase().includes(this.currentFilters.query) ||
                recipe.description.toLowerCase().includes(this.currentFilters.query) ||
                recipe.ingredients.some(ingredient => 
                    ingredient.toLowerCase().includes(this.currentFilters.query)
                )
            );
        }

        if (this.currentFilters.time) {
            results = results.filter(recipe => {
                const time = parseInt(recipe.cookTime);
                switch(this.currentFilters.time) {
                    case 'quick': return time <= 15;
                    case 'medium': return time > 15 && time <= 30;
                    case 'long': return time > 30;
                    default: return true;
                }
            });
        }

        if (this.currentFilters.difficulty) {
            results = results.filter(recipe => 
                recipe.difficulty.toLowerCase() === this.currentFilters.difficulty
            );
        }

        if (this.currentFilters.rating) {
            const minRating = parseInt(this.currentFilters.rating);
            results = results.filter(recipe => recipe.rating >= minRating);
        }

        return results;
    }

    displayResults() {
        const recipeGrid = document.getElementById('recipeGrid');
        const resultCount = document.getElementById('resultCount');
        
        if (!recipeGrid) return;

        if (resultCount) {
            resultCount.textContent = `${this.searchResults.length} recipe${this.searchResults.length !== 1 ? 's' : ''} found`;
        }

        if (this.searchResults.length === 0) {
            recipeGrid.innerHTML = this.getNoResultsHTML();
            return;
        }

        recipeGrid.innerHTML = this.searchResults
            .map(recipe => this.foodieHub.createRecipeCard(recipe))
            .join('');

        this.setupFavoriteToggles();
        
        recipeGrid.querySelectorAll('.recipe-card').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });
    }

    setupFavoriteToggles() {
        document.querySelectorAll('.favorite-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const recipeId = parseInt(btn.dataset.id);
                this.foodieHub.toggleFavorite(recipeId);
            });
        });
    }

    getNoResultsHTML() {
        return `
            <div class="no-results">
                <i class="fas fa-search" style="font-size: 4rem; color: var(--text-light); margin-bottom: 20px;"></i>
                <h3>No recipes found</h3>
                <p>Try adjusting your search criteria or browse all recipes.</p>
                <button onclick="window.searchManager?.clearFilters()" class="btn-primary">Clear Filters</button>
            </div>
        `;
    }

    clearFilters() {
        this.currentFilters = { category: '', query: '', time: '', difficulty: '', rating: '' };
        
        const recipeSearch = document.getElementById('recipeSearch');
        const categoryFilter = document.getElementById('categoryFilter');
        const timeFilter = document.getElementById('timeFilter');
        const difficultyFilter = document.getElementById('difficultyFilter');
        const ratingFilter = document.getElementById('ratingFilter');
        
        if (recipeSearch) recipeSearch.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (timeFilter) timeFilter.value = '';
        if (difficultyFilter) difficultyFilter.value = '';
        if (ratingFilter) ratingFilter.value = '';
        
        this.performSearch();
    }

    // Advanced search methods
    searchByIngredients(ingredients) {
        return this.foodieHub.recipes.filter(recipe =>
            ingredients.every(ingredient =>
                recipe.ingredients.some(recipeIngredient =>
                    recipeIngredient.toLowerCase().includes(ingredient.toLowerCase())
                )
            )
        );
    }

    searchByDifficulty(difficulty) {
        return this.foodieHub.recipes.filter(recipe =>
            recipe.difficulty.toLowerCase() === difficulty.toLowerCase()
        );
    }

    searchByCookTime(maxTime) {
        return this.foodieHub.recipes.filter(recipe => {
            const time = parseInt(recipe.cookTime);
            return time <= maxTime;
        });
    }

    getPopularSearches() {
        // Return popular search terms (could be from analytics)
        return ['chicken', 'pasta', 'vegetarian', 'quick', 'dessert', 'healthy'];
    }

    getSuggestions(query) {
        if (!query || query.length < 2) return [];

        const suggestions = new Set();
        
        this.foodieHub.recipes.forEach(recipe => {
            // Add recipe names that match
            if (recipe.name.toLowerCase().includes(query.toLowerCase())) {
                suggestions.add(recipe.name);
            }
            
            // Add ingredients that match
            recipe.ingredients.forEach(ingredient => {
                if (ingredient.toLowerCase().includes(query.toLowerCase())) {
                    suggestions.add(ingredient);
                }
            });
        });

        return Array.from(suggestions).slice(0, 5);
    }
}

// Initialize search manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.foodieHub && window.location.pathname.includes('recipe-list.html')) {
            window.searchManager = new SearchManager(window.foodieHub);
        }
    }, 300);
});

// Add CSS for no results
const searchStyle = document.createElement('style');
searchStyle.textContent = `
    .no-results {
        text-align: center;
        padding: 60px 20px;
        grid-column: 1 / -1;
    }
    
    .no-results h3 {
        font-size: 1.8rem;
        margin-bottom: 15px;
        color: var(--text-color);
    }
    
    .no-results p {
        color: var(--text-light);
        margin-bottom: 30px;
        font-size: 1.1rem;
    }
`;
document.head.appendChild(searchStyle);