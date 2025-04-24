document.addEventListener('DOMContentLoaded', () => {
    console.log("MENU_APP: DOM fully loaded and parsed.");

    // --- Element References ---
    const mealGrid = document.getElementById('meal-grid');
    const categoryFilterList = document.getElementById('category-filter-list');
    const searchInput = document.getElementById('search-input');
    const cartCountElement = document.getElementById('cart-count');
    const priceRangeSlider = document.getElementById('price-range-slider');
    const priceRangeValueDisplay = document.getElementById('price-range-value');


    // --- State Variables ---
    let allMeals = [];
    let allCategories = [];
    let currentFilters = {
        searchTerm: '',
        selectedCategoryIds: [],
        maxPrice: priceRangeSlider ? parseInt(priceRangeSlider.max) : null
    };

    // --- Constants ---
    const DEFAULT_IMAGE = 'https://via.placeholder.com/300x200/cccccc/969696?text=No+Image';

    // --- Helper Functions --- (Keep formatPrice, showToast, updateCartCount)
    function formatPrice(priceInCents) {
        if (typeof priceInCents !== 'number' || isNaN(priceInCents)) { return "$?.??"; }
        const dollars = Math.floor(priceInCents / 100);
        return `$${dollars.toLocaleString('en-US')}`;
    }

    if (typeof showToast !== 'function') {
        console.warn("MENU_APP: showToast function not found.");
        window.showToast = (message, type = 'info') => alert(`[${type.toUpperCase()}] ${message}`);
    }

    function updateCartCount() {
        // ... (keep existing implementation)
        if (!cartCountElement) return;
        try {
            const cart = Api.getCart();
            const totalItems = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
            cartCountElement.textContent = totalItems;
            cartCountElement.classList.toggle('has-items', totalItems > 0);
        } catch (error) {
            console.error("MENU_APP: Error updating cart count:", error);
            cartCountElement.textContent = '?';
            cartCountElement.classList.add('has-items');
        }
    }

    // --- Card Click/Button Handler ---
    function handleAddToCartClick(event) {
        // **** STOP EVENT PROPAGATION ****
        // Prevent the click from bubbling up to the parent link wrapper
        event.stopPropagation();
        event.preventDefault(); // Also prevent default button behavior if any

        const button = event.target.closest('.add-to-cart-btn'); // Ensure we target the button itself
        if (button) {
            const mealId = button.dataset.mealId;
             if (!mealId) {
                 console.error("MENU_APP: Add to cart button missing data-meal-id.");
                 showToast("Error: Could not identify the meal.", 'error');
                 return;
            }
            console.log(`MENU_APP: Adding meal ${mealId} to cart.`);
            try {
                const result = Api.addToCart(mealId, 1);
                if (result.success && result.cart) {
                    const addedItem = result.cart.find(item => item.mealId === mealId);
                    const itemName = addedItem?.name || 'Item';
                    updateCartCount();
                    showToast(`${itemName} added to cart!`, 'success');
                } else {
                    console.error("MENU_APP: Failed to add item via API:", result.message);
                    showToast(`Error adding item: ${result.message || 'Unknown error'}`, 'error');
                }
            } catch (error) {
                console.error("MENU_APP: Exception during addToCart:", error);
                showToast("An unexpected error occurred while adding the item.", 'error');
            }
        } else {
            console.warn("MENU_APP: Add to cart click detected, but button element not found cleanly.");
        }
    }


    // --- Rendering Functions ---

    function createMealCardHTML(meal) {
        const imageUrl = meal.imageUrl || DEFAULT_IMAGE;
        const detailPageUrl = `meal.html?id=${meal.id}`; // Construct detail page URL

        // Outer card div retains data-meal-id for potential future use
        return `
            <div class="card" data-meal-id="${meal.id}">
                <a href="${detailPageUrl}" class="card-link-wrapper">
                    <div class="card-image-container">
                        <img src="${imageUrl}" alt="${meal.name || 'Meal'}">
                        <div class="card-icons">
                            <i class="icon-button fa-regular fa-heart"></i>
                            <i class="icon-button fa-regular fa-bookmark"></i>
                        </div>
                    </div>
                    <div class="card-content">
                        <span class="item-name">${meal.name || 'Unnamed Meal'}</span>
                        <div class="card-footer">
                            <span class="item-price">${formatPrice(meal.price)}</span>
                            <!-- Button is INSIDE the link, needs stopPropagation in its handler -->
                        </div>
                    </div>
                </a>
            </div>
        `;
    }

    function renderMeals(mealsToDisplay) {
        // ... (keep existing implementation)
        if (!mealGrid) return;
        console.log(`MENU_APP: Rendering ${mealsToDisplay.length} meals.`);
        mealGrid.innerHTML = '';

        if (mealsToDisplay.length > 0) {
            let gridHTML = '';
            mealsToDisplay.forEach(meal => {
                gridHTML += createMealCardHTML(meal);
            });
            mealGrid.innerHTML = gridHTML;

            // Re-attach listener specifically to buttons AFTER rendering
            // NOTE: Event delegation on mealGrid is generally better, but
            // let's explicitly add listeners to buttons here to ensure stopPropagation works reliably.
            const addButtons = mealGrid.querySelectorAll('.add-to-cart-btn');
             addButtons.forEach(button => {
                 // Remove previous listener if any (safer if re-rendering)
                 button.removeEventListener('click', handleAddToCartClick);
                 // Add the listener
                 button.addEventListener('click', handleAddToCartClick);
             });

        } else {
            mealGrid.innerHTML = `<p class="grid-message">No meals found matching your criteria.</p>`;
        }
    }

    function renderCategories(categories) {
       // ... (keep existing implementation)
       if (!categoryFilterList) return;
       categoryFilterList.innerHTML = '';
       if (categories.length > 0) {
            let listHTML = '';
            categories.forEach(category => {
                listHTML += `
                    <li class="category-option">
                        <input type="checkbox" id="cat-${category.id}" value="${category.id}" data-category-id="${category.id}">
                        <label for="cat-${category.id}">${category.name}</label>
                    </li>
                `;
            });
            categoryFilterList.innerHTML = listHTML;
        } else {
            categoryFilterList.innerHTML = `<p>No categories available.</p>`;
        }
    }


    // --- Filtering Logic --- (Keep applyFiltersAndRender as it was)
    function applyFiltersAndRender() {
        console.log("MENU_APP: Applying filters:", currentFilters);
        let filteredMeals = [...allMeals];

        // 1. Filter by Search Term
        if (currentFilters.searchTerm) {
            const searchTermLower = currentFilters.searchTerm.toLowerCase();
            filteredMeals = filteredMeals.filter(meal =>
                (meal.name && meal.name.toLowerCase().includes(searchTermLower)) ||
                (meal.description && meal.description.toLowerCase().includes(searchTermLower))
            );
        }

        // 2. Filter by Selected Categories
        if (currentFilters.selectedCategoryIds.length > 0) {
            filteredMeals = filteredMeals.filter(meal => {
                 if (Array.isArray(meal.categoryIds)) {
                    return meal.categoryIds.some(mealCatId => currentFilters.selectedCategoryIds.includes(mealCatId));
                 } else if (meal.categoryId) {
                     return currentFilters.selectedCategoryIds.includes(meal.categoryId);
                 }
                 return false;
            });
        }

        // 3. Filter by Max Price
        if (typeof currentFilters.maxPrice === 'number') {
             const maxPriceInCents = currentFilters.maxPrice * 100;
             filteredMeals = filteredMeals.filter(meal => {
                 return typeof meal.price === 'number' && meal.price <= maxPriceInCents;
             });
        }

        // Render the filtered results
        renderMeals(filteredMeals);
    }


    // --- Event Handlers --- (Keep handleSearchInput, handleCategoryChange, handlePriceRangeChange as they were)
    function handleSearchInput() {
        currentFilters.searchTerm = searchInput.value.trim();
        applyFiltersAndRender();
    }

    function handleCategoryChange() {
        const selectedCheckboxes = categoryFilterList.querySelectorAll('input[type="checkbox"]:checked');
        currentFilters.selectedCategoryIds = Array.from(selectedCheckboxes).map(cb => cb.value);
        applyFiltersAndRender();
    }

    function handlePriceRangeChange() {
        if (!priceRangeSlider || !priceRangeValueDisplay) return;
        const currentValue = parseInt(priceRangeSlider.value);
        currentFilters.maxPrice = currentValue;
        priceRangeValueDisplay.textContent = `$${currentValue.toLocaleString('en-US')}`;
        applyFiltersAndRender();
    }


    // --- Initial Data Loading --- (Keep loadInitialData as it was)
     async function loadInitialData() {
        console.log("MENU_APP: Loading initial data...");
        if (categoryFilterList) categoryFilterList.innerHTML = '<p>Loading categories...</p>';
        if (mealGrid) mealGrid.innerHTML = '<p class="grid-message">Loading meals...</p>';
        if(priceRangeSlider && priceRangeValueDisplay) {
            priceRangeValueDisplay.textContent = `$${parseInt(priceRangeSlider.value).toLocaleString('en-US')}`;
            currentFilters.maxPrice = parseInt(priceRangeSlider.value);
        }

        try {
            const [categoryResponse, mealResponse] = await Promise.all([
                Api.getCategories(),
                Api.getMeals()
            ]);

            if (categoryResponse.status === 200 && Array.isArray(categoryResponse.body)) {
                allCategories = categoryResponse.body;
                renderCategories(allCategories);
            } else {
                console.error("MENU_APP: Failed to load categories", categoryResponse);
                if (categoryFilterList) categoryFilterList.innerHTML = `<p style="color: red;">Error loading categories.</p>`;
            }

            if (mealResponse.status === 200 && Array.isArray(mealResponse.body)) {
                allMeals = mealResponse.body;
                applyFiltersAndRender(); // This will call renderMeals which now attaches button listeners
            } else {
                console.error("MENU_APP: Failed to load meals", mealResponse);
                if (mealGrid) mealGrid.innerHTML = `<p class="grid-message" style="color: red;">Error loading meals.</p>`;
            }

            updateCartCount();

        } catch (error) {
            console.error("MENU_APP: Error during initial data load:", error);
            if (mealGrid) mealGrid.innerHTML = `<p class="grid-message" style="color: red;">A network error occurred.</p>`;
            if (categoryFilterList && categoryFilterList.innerHTML.includes('Loading')) {
                 categoryFilterList.innerHTML = `<p style="color: red;">Error loading categories.</p>`;
            }
        } finally {
            console.log("MENU_APP: Initial data loading complete.");
        }
    }


    // --- Attach Global Event Listeners ---
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
    }

    if (categoryFilterList) {
        // Use delegation for category checkboxes
        categoryFilterList.addEventListener('change', (event) => {
            if (event.target.type === 'checkbox') {
                handleCategoryChange();
            }
        });
    }

     if (priceRangeSlider) {
         priceRangeSlider.addEventListener('input', handlePriceRangeChange);
     }

    // NOTE: AddToCart listeners are now added dynamically within renderMeals

    // --- Initialize ---
    loadInitialData();

}); // End DOMContentLoaded