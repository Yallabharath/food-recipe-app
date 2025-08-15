// Main JavaScript functionality
class FoodieHub {
    constructor() {
        this.recipes = [];
        this.currentRecipe = null;
        this.favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        this.theme = localStorage.getItem('theme') || 'light';
        
        this.init();
    }

    async init() {
        this.setupTheme();
        this.setupNavigation();
        await this.loadRecipes();
        this.setupEventListeners();
        this.loadPageContent();
    }

    setupTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.innerHTML = this.theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('theme', this.theme);
        
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.innerHTML = this.theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    setupNavigation() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');

        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });

            // Close menu when clicking on a link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                });
            });
        }
    }

    async loadRecipes() {
        try {
            const response = await fetch('recipes.json');
            const data = await response.json();
            this.recipes = data.recipes;
        } catch (error) {
            console.error('Error loading recipes:', error);
            this.recipes = [];
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');
        
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => this.handleSearch());
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleSearch();
            });
        }

        // Category cards
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                this.filterByCategory(category);
            });
        });

        // Contact form
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContactForm(e));
        }
    }

    handleSearch() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;
        
        const query = searchInput.value.trim();
        
        if (query) {
            localStorage.setItem('searchQuery', query);
            window.location.href = 'recipe-list.html';
        } else {
            window.location.href = 'recipe-list.html';
        }
    }

    filterByCategory(category) {
        localStorage.setItem('selectedCategory', category);
        window.location.href = 'recipe-list.html';
    }

    handleContactForm(e) {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;
        
        // Simulate form submission
        this.showNotification('Thank you for your message! We\'ll get back to you soon.', 'success');
        
        // Reset form
        e.target.reset();
    }

    loadPageContent() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        switch (currentPage) {
            case 'index.html':
            case '':
                this.loadHomePage();
                break;
            case 'recipe-list.html':
                this.loadRecipeListPage();
                break;
            case 'recipe-detail.html':
                this.loadRecipeDetailPage();
                break;
            case 'favorites.html':
                this.loadFavoritesPage();
                break;
        }
    }

    loadHomePage() {
        this.loadFeaturedRecipes();
    }

    loadFeaturedRecipes() {
        const carousel = document.getElementById('featuredCarousel');
        if (!carousel) return;

        const featuredRecipes = this.recipes.slice(0, 6);
        carousel.innerHTML = featuredRecipes.map(recipe => this.createRecipeCard(recipe)).join('');
        
        this.setupCarousel();
    }

    setupCarousel() {
        const carousel = document.getElementById('featuredCarousel');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (!carousel || !prevBtn || !nextBtn) return;

        let currentIndex = 0;
        const cardWidth = 330; // Card width + margin
        const visibleCards = Math.floor(carousel.parentElement.offsetWidth / cardWidth);
        const maxIndex = Math.max(0, carousel.children.length - visibleCards);

        const updateCarousel = () => {
            carousel.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
        };

        prevBtn.addEventListener('click', () => {
            currentIndex = Math.max(0, currentIndex - 1);
            updateCarousel();
        });

        nextBtn.addEventListener('click', () => {
            currentIndex = Math.min(maxIndex, currentIndex + 1);
            updateCarousel();
        });

        // Auto-scroll
        setInterval(() => {
            currentIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
            updateCarousel();
        }, 5000);
    }

    createRecipeCard(recipe) {
        const isFavorite = this.favorites.some(fav => fav.id === recipe.id);
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
    }

    showLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.style.display = 'flex';
    }

    hideLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.style.display = 'none';
    }

    showNotification(message, type = 'info') {
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

    // Utility methods
    getRecipeById(id) {
        return this.recipes.find(recipe => recipe.id === parseInt(id));
    }

    addToFavorites(recipe) {
        if (!this.favorites.some(fav => fav.id === recipe.id)) {
            this.favorites.push(recipe);
            localStorage.setItem('favorites', JSON.stringify(this.favorites));
            this.showNotification('Added to favorites!', 'success');
        }
    }

    removeFromFavorites(recipeId) {
        this.favorites = this.favorites.filter(fav => fav.id !== recipeId);
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        this.showNotification('Removed from favorites!', 'info');
    }

    toggleFavorite(recipeId) {
        const recipe = this.getRecipeById(recipeId);
        if (!recipe) return;

        const isFavorite = this.favorites.some(fav => fav.id === recipe.id);
        
        if (isFavorite) {
            this.removeFromFavorites(recipeId);
        } else {
            this.addToFavorites(recipe);
        }
        
        // Update UI
        this.updateFavoriteButtons();
    }

    updateFavoriteButtons() {
        document.querySelectorAll('.favorite-toggle').forEach(btn => {
            const recipeId = parseInt(btn.dataset.id);
            const isFavorite = this.favorites.some(fav => fav.id === recipeId);
            btn.classList.toggle('active', isFavorite);
        });
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    window.foodieHub = new FoodieHub();
});

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .favorite-toggle {
        background: none;
        border: none;
        color: #ccc;
        font-size: 1.2rem;
        cursor: pointer;
        transition: color 0.3s ease;
        padding: 5px;
    }
    
    .favorite-toggle:hover,
    .favorite-toggle.active {
        color: #ff6b6b;
    }
    
    .card-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 15px;
    }
`;
document.head.appendChild(style);