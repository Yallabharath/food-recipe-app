// Recipe management and detail page functionality
class RecipeManager {
    constructor(foodieHub) {
        this.foodieHub = foodieHub;
        this.currentRecipe = null;
        this.init();
    }

    init() {
        this.loadPageContent();
        this.setupEventListeners();
    }

    loadPageContent() {
        const currentPage = window.location.pathname.split('/').pop();
        
        if (currentPage === 'recipe-list.html') {
            this.loadRecipeListPage();
        } else if (currentPage === 'recipe-detail.html') {
            this.loadRecipeDetailPage();
        }
    }

    setupEventListeners() {
        // Recipe detail page favorite button
        const favoriteBtn = document.getElementById('favoriteBtn');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => this.toggleRecipeFavorite());
        }

        // Ingredient checkboxes
        document.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && e.target.closest('.ingredients-list')) {
                this.handleIngredientCheck(e.target);
            }
        });
    }

    loadRecipeListPage() {
        const recipeGrid = document.getElementById('recipeGrid');
        if (!recipeGrid) return;

        setTimeout(() => {
            const recipes = this.foodieHub.recipes;
            if (recipes.length > 0) {
                // Trigger filter function to show all recipes
                if (window.filterRecipes) {
                    window.filterRecipes();
                } else {
                    recipeGrid.innerHTML = recipes
                        .map(recipe => this.foodieHub.createRecipeCard(recipe))
                        .join('');
                    this.setupRecipeCardListeners();
                }
            }
        }, 600);
    }

    loadRecipeDetailPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const recipeId = parseInt(urlParams.get('id'));
        const apiType = urlParams.get('api');
        
        if (!recipeId) {
            this.showRecipeNotFound();
            return;
        }

        // Skip if it's an API recipe
        if (apiType) return;

        setTimeout(() => {
            this.currentRecipe = this.foodieHub.getRecipeById(recipeId);
            
            if (!this.currentRecipe) {
                this.showRecipeNotFound();
                return;
            }

            this.renderRecipeDetail();
        }, 200);
    }

    renderRecipeDetail() {
        const recipe = this.currentRecipe;
        
        // Update page title
        document.title = `${recipe.name} - FoodieHub`;
        
        // Update banner
        const banner = document.getElementById('recipeBanner');
        if (banner) {
            banner.style.backgroundImage = `url(${recipe.image})`;
        }

        // Update recipe info
        this.updateElement('recipeTitle', recipe.name);
        this.updateElement('cookTime', recipe.cookTime);
        this.updateElement('difficulty', recipe.difficulty);
        this.updateElement('category', recipe.category);
        this.updateElement('recipeDescription', recipe.description);

        // Update favorite button
        this.updateFavoriteButton();

        // Render ingredients
        this.renderIngredients();

        // Render instructions
        this.renderInstructions();

        // Add fade-in animation
        document.querySelector('.recipe-content').classList.add('fade-in');
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) element.textContent = content;
    }

    updateFavoriteButton() {
        const favoriteBtn = document.getElementById('favoriteBtn');
        if (!favoriteBtn) return;

        const isFavorite = this.foodieHub.favorites.some(fav => fav.id === this.currentRecipe.id);
        
        favoriteBtn.classList.toggle('active', isFavorite);
        favoriteBtn.innerHTML = isFavorite 
            ? '<i class="fas fa-heart"></i> Remove from Favorites'
            : '<i class="far fa-heart"></i> Add to Favorites';
    }

    renderIngredients() {
        const ingredientsList = document.getElementById('ingredientsList');
        if (!ingredientsList) return;

        ingredientsList.innerHTML = this.currentRecipe.ingredients
            .map((ingredient, index) => `
                <li>
                    <input type="checkbox" id="ingredient-${index}" data-ingredient="${ingredient}">
                    <label for="ingredient-${index}">${ingredient}</label>
                </li>
            `).join('');
    }

    renderInstructions() {
        const instructionsList = document.getElementById('instructionsList');
        if (!instructionsList) return;

        instructionsList.innerHTML = this.currentRecipe.instructions
            .map(instruction => `<li>${instruction}</li>`)
            .join('');
    }

    toggleRecipeFavorite() {
        if (!this.currentRecipe) return;

        const isFavorite = this.foodieHub.favorites.some(fav => fav.id === this.currentRecipe.id);
        
        if (isFavorite) {
            this.foodieHub.removeFromFavorites(this.currentRecipe.id);
        } else {
            this.foodieHub.addToFavorites(this.currentRecipe);
        }

        this.updateFavoriteButton();
    }

    handleIngredientCheck(checkbox) {
        const label = checkbox.nextElementSibling;
        if (checkbox.checked) {
            label.style.textDecoration = 'line-through';
            label.style.opacity = '0.6';
        } else {
            label.style.textDecoration = 'none';
            label.style.opacity = '1';
        }

        // Save checked ingredients to localStorage
        this.saveIngredientProgress();
    }

    saveIngredientProgress() {
        if (!this.currentRecipe) return;

        const checkedIngredients = [];
        document.querySelectorAll('.ingredients-list input[type="checkbox"]:checked').forEach(checkbox => {
            checkedIngredients.push(checkbox.dataset.ingredient);
        });

        localStorage.setItem(`recipe-${this.currentRecipe.id}-ingredients`, JSON.stringify(checkedIngredients));
    }

    loadIngredientProgress() {
        if (!this.currentRecipe) return;

        const saved = localStorage.getItem(`recipe-${this.currentRecipe.id}-ingredients`);
        if (!saved) return;

        const checkedIngredients = JSON.parse(saved);
        
        document.querySelectorAll('.ingredients-list input[type="checkbox"]').forEach(checkbox => {
            if (checkedIngredients.includes(checkbox.dataset.ingredient)) {
                checkbox.checked = true;
                this.handleIngredientCheck(checkbox);
            }
        });
    }

    setupRecipeCardListeners() {
        // Add favorite toggle listeners for recipe cards
        document.querySelectorAll('.favorite-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const recipeId = parseInt(btn.dataset.id);
                this.foodieHub.toggleFavorite(recipeId);
            });
        });
    }

    showRecipeNotFound() {
        const main = document.querySelector('main');
        if (main) {
            main.innerHTML = `
                <div class="container">
                    <div class="recipe-not-found">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h2>Recipe Not Found</h2>
                        <p>The recipe you're looking for doesn't exist or has been removed.</p>
                        <a href="recipe-list.html" class="btn-primary">Browse All Recipes</a>
                    </div>
                </div>
            `;
        }
    }

    // Utility methods for recipe operations
    getRecipeNutrition(recipe) {
        // Mock nutrition calculation based on ingredients
        return {
            calories: Math.floor(Math.random() * 400) + 200,
            protein: Math.floor(Math.random() * 30) + 10,
            carbs: Math.floor(Math.random() * 50) + 20,
            fat: Math.floor(Math.random() * 20) + 5
        };
    }

    getRecipeRating(recipeId) {
        // Mock rating system
        return {
            average: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
            count: Math.floor(Math.random() * 500) + 50
        };
    }

    getSimilarRecipes(recipe, count = 4) {
        return this.foodieHub.recipes
            .filter(r => r.id !== recipe.id && r.category === recipe.category)
            .slice(0, count);
    }

    scaleRecipe(recipe, servings) {
        // Scale ingredients based on serving size
        const originalServings = 4; // Assume original recipes serve 4
        const scale = servings / originalServings;
        
        return {
            ...recipe,
            ingredients: recipe.ingredients.map(ingredient => {
                // Simple scaling - in real app, would need more sophisticated parsing
                return ingredient.replace(/(\d+(?:\.\d+)?)/g, (match) => {
                    return (parseFloat(match) * scale).toFixed(1);
                });
            })
        };
    }

    printRecipe() {
        if (!this.currentRecipe) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>${this.currentRecipe.name}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h1 { color: #333; }
                        .meta { margin: 20px 0; }
                        .ingredients, .instructions { margin: 20px 0; }
                        .ingredients li, .instructions li { margin: 5px 0; }
                    </style>
                </head>
                <body>
                    <h1>${this.currentRecipe.name}</h1>
                    <div class="meta">
                        <p><strong>Cook Time:</strong> ${this.currentRecipe.cookTime}</p>
                        <p><strong>Difficulty:</strong> ${this.currentRecipe.difficulty}</p>
                        <p><strong>Category:</strong> ${this.currentRecipe.category}</p>
                    </div>
                    <p>${this.currentRecipe.description}</p>
                    <div class="ingredients">
                        <h2>Ingredients</h2>
                        <ul>
                            ${this.currentRecipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="instructions">
                        <h2>Instructions</h2>
                        <ol>
                            ${this.currentRecipe.instructions.map(inst => `<li>${inst}</li>`).join('')}
                        </ol>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

// Initialize recipe manager
document.addEventListener('DOMContentLoaded', () => {
    if (window.foodieHub) {
        window.recipeManager = new RecipeManager(window.foodieHub);
    } else {
        setTimeout(() => {
            if (window.foodieHub) {
                window.recipeManager = new RecipeManager(window.foodieHub);
            }
        }, 100);
    }
});

// Add CSS for recipe detail page
const recipeStyle = document.createElement('style');
recipeStyle.textContent = `
    .recipe-not-found {
        text-align: center;
        padding: 80px 20px;
    }
    
    .recipe-not-found i {
        font-size: 4rem;
        color: var(--text-light);
        margin-bottom: 20px;
    }
    
    .recipe-not-found h2 {
        font-size: 2rem;
        margin-bottom: 15px;
        color: var(--text-color);
    }
    
    .recipe-not-found p {
        color: var(--text-light);
        margin-bottom: 30px;
        font-size: 1.1rem;
    }
    
    .ingredients-list label {
        cursor: pointer;
        transition: all 0.3s ease;
        margin-left: 10px;
    }
    
    .ingredients-list input[type="checkbox"] {
        cursor: pointer;
    }
    
    .recipe-actions {
        display: flex;
        gap: 15px;
        justify-content: center;
        margin: 30px 0;
        flex-wrap: wrap;
    }
    
    .btn-outline {
        background: transparent;
        color: var(--primary-color);
        border: 2px solid var(--primary-color);
        padding: 10px 20px;
        border-radius: 25px;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
        transition: all 0.3s ease;
        font-weight: 500;
    }
    
    .btn-outline:hover {
        background: var(--primary-color);
        color: white;
        transform: translateY(-2px);
    }
`;
document.head.appendChild(recipeStyle);