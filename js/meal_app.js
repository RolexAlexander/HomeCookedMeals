document.addEventListener('DOMContentLoaded', () => {
    console.log("MEAL_APP: DOM fully loaded.");

    // --- Element References ---
    // Get references to containers/placeholders that exist on initial load
    const contentWrapper = document.getElementById('meal-detail-content');
    const heroImageEl = document.getElementById('meal-image'); // Reference to the img tag itself
    const loadingErrorContainer = contentWrapper.querySelector('.loading-error-message');
    const cartCountElement = document.getElementById('cart-count');

    // References to elements generated/updated after data loads
    let mealTitleEl, mealSubtitleEl, mealPriceEl, mealDescriptionEl;
    let quantityDecreaseBtn, quantityDisplayEl, quantityIncreaseBtn, checkoutButton;

    // --- State Variables ---
    let currentQuantity = 1;
    let currentMeal = null;
    let mealId = null;

    // --- Constants ---
    const DEFAULT_IMAGE = 'https://via.placeholder.com/1920x500/cccccc/969696?text=Image+Not+Available'; // Wide default
    const CHECKOUT_PAGE_URL = '/cart.html';

    // --- Helper Functions --- (formatPrice, showToast, updateCartCount - keep as they were)
    function formatPrice(priceInCents) {
        if (typeof priceInCents !== 'number' || isNaN(priceInCents)) { return "$?.??"; }
        const dollars = Math.floor(priceInCents / 100);
        return `$${dollars.toLocaleString('en-US')}`;
    }

    if (typeof showToast !== 'function') {
        console.warn("MEAL_APP: showToast function not found.");
        window.showToast = (message, type = 'info') => alert(`[${type.toUpperCase()}] ${message}`);
    }

    function updateCartCount() {
        if (!cartCountElement) return;
        try {
            const cart = Api.getCart();
            const totalItems = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
            cartCountElement.textContent = totalItems;
            cartCountElement.classList.toggle('has-items', totalItems > 0);
        } catch (error) { console.error("MEAL_APP: Error updating cart count:", error); cartCountElement.textContent = '?'; cartCountElement.classList.add('has-items'); }
    }


    // --- DOM Update Functions ---
    function updateQuantityDisplay() {
        if (quantityDisplayEl) { quantityDisplayEl.textContent = currentQuantity; }
        if (quantityDecreaseBtn) { quantityDecreaseBtn.disabled = (currentQuantity <= 1); }
    }

    function handleQuantityChange(change) {
        const newQuantity = currentQuantity + change;
        if (newQuantity >= 1) {
            currentQuantity = newQuantity;
            updateQuantityDisplay();
        }
    }

    // *** MODIFIED populateMealData ***
    function populateMealData(meal) {
        currentMeal = meal;

        const name = meal.name || 'Unnamed Meal';
        const subtitle = meal.subtitle || 'Homemade with fresh Ingredients'; // Use a default subtitle or field
        const description = meal.description || 'No description available.';
        const price = meal.price !== undefined ? formatPrice(meal.price) : 'N/A';
        const imageUrl = meal.imageUrl || DEFAULT_IMAGE;

        // Update page title
        document.title = `${name} - Home Cooked Meals`;

        // Update Hero Image
        if (heroImageEl) {
             heroImageEl.src = imageUrl;
             heroImageEl.alt = name;
        }

        // Clear loading message and build content within the wrapper
        if(loadingErrorContainer) loadingErrorContainer.style.display = 'none'; // Hide loading message

        // Generate the *inner* content structure
        contentWrapper.innerHTML = `
            <div class="meal-main-info">
                <h1 class="meal-title" id="meal-title">${name}</h1>
                <p class="meal-subtitle" id="meal-subtitle">${subtitle}</p>
                <div class="meal-description" id="meal-description">
                    <p>${description.replace(/\n/g, '<br>')}</p>
                    ${meal.ingredients ? `<br><p><strong>Ingredients:</strong> ${meal.ingredients}</p>` : ''}
                </div>
            </div>

            <div class="meal-sidebar-info">
                <div class="rating-actions-price">
                    <div class="ratings"> <!-- Static Stars -->
                        <span class="star">★</span><span class="star">★</span><span class="star">★</span><span class="star">★</span><span class="star dimmed">★</span>
                    </div>
                    <div class="product-actions">
                        <button class="action-button" aria-label="Like this meal"><i class="fa-regular fa-heart"></i></button>
                        <button class="action-button" aria-label="Save this meal"><i class="fa-regular fa-bookmark"></i></button>
                    </div>
                    <div class="meal-price" id="meal-price">${price}</div>
                </div>
                <div class="order-section">
                    <div class="quantity-label">Quantity</div>
                    <div class="quantity-controls">
                        <button class="quantity-button" id="quantity-decrease" aria-label="Decrease quantity"><i class="fa-solid fa-minus"></i></button>
                        <span class="quantity-display" id="quantity-display">1</span>
                        <button class="quantity-button" id="quantity-increase" aria-label="Increase quantity"><i class="fa-solid fa-plus"></i></button>
                    </div>
                    <button class="checkout-button" id="checkout-button">
                         <i class="fa-solid fa-cart-plus"></i>
                         <span>Add & Checkout</span>
                    </button>
                </div>
            </div>

            <section class="reviews-section"> <!-- Static Reviews -->
                <h2 class="reviews-heading">Reviews</h2>
                 <div class="reviews-grid">
                      <!-- Review Card 1 -->
                      <div class="review-card"><div class="review-rating"><span class="star">★</span><span class="star">★</span><span class="star">★</span><span class="star">★</span><span class="star dimmed">★</span></div><h3 class="review-title">Slice of Heaven!</h3><p class="review-text">The lasagna is absolutely divine—layers of rich, savory flavors that melt in your mouth. A true masterpiece!</p><div class="reviewer"><div class="reviewer-avatar"><img src="https://media.istockphoto.com/id/1394347360/photo/confident-young-black-businesswoman-standing-at-a-window-in-an-office-alone.jpg?s=612x612&w=0&k=20&c=tOFptpFTIaBZ8LjQ1NiPrjKXku9AtERuWHOElfBMBvY=" alt="Avatar"/></div><div class="reviewer-info"><div class="reviewer-name">Mary Owen</div><div class="review-date">12/03/2025</div></div></div></div>
                      <!-- Review Card 2 --><div class="review-card"><div class="review-rating"><span class="star">★</span><span class="star">★</span><span class="star">★</span><span class="star">★</span><span class="star dimmed">★</span></div><h3 class="review-title">Amazing</h3><p class="review-text">Every bite of the lasagna is a perfect blend of rich, cheesy goodness and hearty, savory layers. It's comfort food at its finest!</p><div class="reviewer"><div class="reviewer-avatar"><img src="https://img.freepik.com/free-photo/closeup-young-female-professional-making-eye-contact-against-colored-background_662251-651.jpg?semt=ais_hybrid&w=740" alt="Avatar"/></div><div class="reviewer-info"><div class="reviewer-name">Sarah Peters</div><div class="review-date">15/09/2020</div></div></div></div>
                      <!-- Review Card 3 --><div class="review-card"><div class="review-rating"><span class="star">★</span><span class="star">★</span><span class="star">★</span><span class="star">★</span><span class="star">★</span></div><h3 class="review-title">Authentic & Unforgettable!</h3><p class="review-text">This lasagna is a culinary masterpiece—each layer bursting with flavor and perfectly balanced. The rich meat sauce, creamy cheese, and tender pasta create an unforgettable dining experience.</p><div class="reviewer"><div class="reviewer-avatar"><img src="https://media.istockphoto.com/id/1171169127/photo/headshot-of-cheerful-handsome-man-with-trendy-haircut-and-eyeglasses-isolated-on-gray.jpg?s=612x612&w=0&k=20&c=yqAKmCqnpP_T8M8I5VTKxecri1xutkXH7zfybnwVWPQ=" alt="Avatar"/></div><div class="reviewer-info"><div class="reviewer-name">Dave Jones</div><div class="review-date">11/01/2025</div></div></div></div>
                  </div>
            </section>
        `;

        // Get references to newly added elements inside contentWrapper
        quantityDecreaseBtn = contentWrapper.querySelector('#quantity-decrease');
        quantityDisplayEl = contentWrapper.querySelector('#quantity-display');
        quantityIncreaseBtn = contentWrapper.querySelector('#quantity-increase');
        checkoutButton = contentWrapper.querySelector('#checkout-button');

        // Attach Event Listeners
        if (quantityDecreaseBtn) quantityDecreaseBtn.addEventListener('click', () => handleQuantityChange(-1));
        if (quantityIncreaseBtn) quantityIncreaseBtn.addEventListener('click', () => handleQuantityChange(1));
        if (checkoutButton) checkoutButton.addEventListener('click', handleCheckout);

        // Update initial state
        currentQuantity = 1; // Reset quantity when loading new meal
        updateQuantityDisplay();
    }

    function displayError(message) {
        // Update the loading/error container directly
        if (loadingErrorContainer) {
            loadingErrorContainer.textContent = message;
            loadingErrorContainer.style.display = 'block'; // Ensure it's visible
        } else { // Fallback if the container itself wasn't found
            contentWrapper.innerHTML = `<div class="loading-error-message">${message}</div>`;
        }
        if (heroImageEl) heroImageEl.src = DEFAULT_IMAGE; // Show default image on error
        document.title = "Error - Home Cooked Meals";
    }


    // --- API Call --- (fetchMealDetails - keep as it was)
     async function fetchMealDetails(id) {
        console.log(`MEAL_APP: Fetching details for meal ID: ${id}`);
        try {
             const response = await Api.getMeals({ id: id });
             console.log("MEAL_APP: API Response:", response);

             if (response.status === 200 && Array.isArray(response.body) && response.body.length > 0) {
                populateMealData(response.body[0]);
             } else if (response.status === 200 && response.body && !Array.isArray(response.body)) {
                 populateMealData(response.body);
             } else if (response.status === 404 || (Array.isArray(response.body) && response.body.length === 0)) {
                console.error(`MEAL_APP: Meal with ID ${id} not found.`);
                displayError(`Sorry, we couldn't find the meal you're looking for (ID: ${id}).`);
            } else {
                console.error(`MEAL_APP: Failed to load meal details. Status: ${response.status}`, response.body);
                displayError(`An error occurred while loading meal details (Status: ${response.status}). Please try again later.`);
            }
        } catch (error) {
            console.error("MEAL_APP: Network error fetching meal details:", error);
            displayError("A network error occurred. Please check your connection and try again.");
        }
    }


    // --- Checkout Logic --- (handleCheckout - keep as it was)
     function handleCheckout() {
        if (!currentMeal || !currentMeal.id) { console.error("MEAL_APP: Cannot checkout, current meal data missing."); showToast("Could not add item. Meal data missing.", "error"); return; }
        if (currentQuantity < 1) { console.error("MEAL_APP: Cannot checkout with quantity < 1."); showToast("Please select a valid quantity.", "error"); return; }

        console.log(`MEAL_APP: Adding ${currentQuantity} of meal ${currentMeal.id} to cart.`);
        try {
            const result = Api.addToCart(currentMeal.id, currentQuantity);
            if (result.success) {
                console.log("MEAL_APP: Item(s) added. Navigating to checkout.");
                updateCartCount();
                showToast(`${currentQuantity} x ${currentMeal.name} added!`, 'success', 2000);
                setTimeout(() => { window.location.href = CHECKOUT_PAGE_URL; }, 500);
            } else {
                console.error("MEAL_APP: Failed to add item(s) via API:", result.message);
                showToast(`Error adding: ${result.message || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error("MEAL_APP: Exception during checkout addToCart:", error);
            showToast("An unexpected error occurred.", 'error');
        }
    }


    // --- Initialization --- (init - keep as it was)
    function init() {
        const urlParams = new URLSearchParams(window.location.search);
        mealId = urlParams.get('id');

        if (!mealId) {
            console.error("MEAL_APP: No meal ID found in URL.");
            displayError("No meal ID specified.");
            return;
        }
        fetchMealDetails(mealId);
        updateCartCount();
    }

    init();

}); // End DOMContentLoaded