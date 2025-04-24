document.addEventListener('DOMContentLoaded', () => {
    console.log("APP: DOM fully loaded and parsed. Initializing page...");

    // --- Element References ---
    const carouselContainer = document.getElementById('carouselContainer');
    const specialsGrid = document.querySelector('.specials-grid');
    const tasteOfDayGrid = document.querySelector('.menu-item-grid');
    const cartCountElement = document.getElementById('cart-count');
    const subscribeForm = document.getElementById('subscribe-form');
    const subscribeEmailInput = document.getElementById('subscribe-email');
    // REMOVED: const subscribeMessage = document.getElementById('subscribe-message');

    // --- Verify Selectors ---
    if (!carouselContainer || !specialsGrid || !tasteOfDayGrid || !subscribeForm) {
        console.error("APP: CRITICAL - One or more required content containers or forms not found!", { carouselContainer, specialsGrid, tasteOfDayGrid, subscribeForm });
        document.body.insertAdjacentHTML('afterbegin', '<p style="color:red; background:white; padding: 10px; border: 1px solid red;">Error: Page structure is broken. Cannot load content or attach handlers.</p>');
        return;
    }

    // --- Constants ---
    const SPECIALS_CATEGORY_ID = 'cat_special';
    const TASTE_OF_DAY_CATEGORY_ID = 'cat_today';
    const DEFAULT_IMAGE = 'https://via.placeholder.com/600x400/cccccc/969696?text=No+Image+Available'; // Larger default

    // --- Helper Functions --- (Keep formatPrice, createSpecialCardHTML, createTasteOfDayCardHTML, createCarouselSlideHTML, renderList as they were)
    function formatPrice(priceInCents) {
        if (typeof priceInCents !== 'number' || isNaN(priceInCents)) { return "$?.??"; }
        const dollars = Math.floor(priceInCents / 100);
        return `$${dollars.toLocaleString('en-US')}`;
    }

    function createSpecialCardHTML(meal) {
        const imageUrl = meal.imageUrl || DEFAULT_IMAGE;
        const detailPageUrl = `meal.html?id=${meal.id}`; // Construct detail page URL
        // This structure matches the old UI's .card structure + Add button
        return `
                <div class="card">
                <a href="${detailPageUrl}" class="card-link-wrapper">
                    <div class="card-image-container">
                        <img src="${imageUrl}" alt="${meal.name || 'Special Meal'}">
                        <div class="card-icons">
                            <i class="icon-button fa-regular fa-heart"></i>
                            <i class="icon-button fa-regular fa-bookmark"></i>
                        </div>
                    </div>
                    <div class="card-content">
                        <span class="item-name">${meal.name || 'Unnamed Special'}</span>
                        <span class="item-price">${formatPrice(meal.price)}</span>
                        
                    </div>
                    </a>
                </div>
            `;
    }

    function createTasteOfDayCardHTML(meal) {
        const imageUrl = meal.imageUrl || DEFAULT_IMAGE;
        const detailPageUrl = `meal.html?id=${meal.id}`; // Construct detail page URL
        return `
        <a href="${detailPageUrl}" class="card-link-wrapper">
                <div class="menu-card-large">
                    <div class="mcl-image-container">
                        <img src="${imageUrl}" alt="${meal.name || 'Today\'s Meal'}" class="mcl-image">
                        <div class="mcl-icons">
                            <i class="icon-button fa-regular fa-heart"></i>
                            <i class="icon-button fa-regular fa-bookmark"></i>
                        </div>
                    </div>
                    <div class="mcl-content-container">
                        <h4 class="mcl-name">${meal.name || 'Unnamed Meal'}</h4>
                        <p class="mcl-description">
                            ${meal.description || 'Delicious home-cooked meal.'}
                        </p>
                        <div class="mcl-footer">
                            <span class="mcl-price">${formatPrice(meal.price)}</span>
                            <button class="mcl-add-button add-to-cart-btn" data-meal-id="${meal.id}" aria-label="Add ${meal.name || 'Meal'} to cart">
                                Add <i class="fa-solid fa-cart-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
                </a>
            `;
    }

    function createCarouselSlideHTML(meal, isActive = false) {
        const imageUrl = meal.imageUrl || DEFAULT_IMAGE;
        return `
                <div class="carousel-slide ${isActive ? 'active' : ''}">
                  <img
                    class="carousel-img-element"
                    src="${imageUrl}"
                    alt="${meal.name || 'Featured Meal'}"
                  />
                </div>
            `;
    }

    function renderList(items, container, itemCreatorFunction, notFoundMessage = "No items found.", sectionName) {
        if (!container) { console.error(`APP: (${sectionName}) Container element not found for rendering.`); return; }
        console.log(`APP: (${sectionName}) Rendering list. Items received count: ${items?.length}`);

        try {
            container.innerHTML = ''; // Clear previous content or loading message
            if (items && items.length > 0) {
                let generatedHTML = '';
                items.forEach(item => { generatedHTML += itemCreatorFunction(item); });
                container.innerHTML = generatedHTML;
                console.log(`APP: (${sectionName}) Rendered ${items.length} items.`);
            } else {
                console.log(`APP: (${sectionName}) No items found or items array empty. Displaying message.`);
                container.innerHTML = `<p>${notFoundMessage}</p>`;
            }
        } catch (error) {
            console.error(`APP: (${sectionName}) Error during rendering list:`, error);
            container.innerHTML = `<p style="color:red;">Error rendering ${sectionName}. Please check console.</p>`;
        }
    }

    // --- Cart and Subscribe Functions ---
    function updateCartCount() {
        if (!cartCountElement) return;
        try {
            const cart = Api.getCart();
            const totalItems = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
            cartCountElement.textContent = totalItems;
            // Optional: add/remove class for visibility/animation
            cartCountElement.classList.toggle('has-items', totalItems > 0);
            console.log("APP: Cart count updated to:", totalItems);
        } catch (error) {
            console.error("APP: Error updating cart count:", error);
            cartCountElement.textContent = '?'; // Indicate error
            cartCountElement.classList.add('has-items'); // Make visible on error?
        }
    }

    function handleAddToCartClick(event) {
        const button = event.target.closest('.add-to-cart-btn'); // Target any add button
        if (button) {
            const mealId = button.dataset.mealId;
            if (!mealId) {
                console.error("APP: Add to cart button clicked, but data-meal-id attribute is missing.");
                showToast("Error: Could not identify the meal.", 'error'); // Use toast for error
                return;
            }
            console.log(`APP: Adding meal ${mealId} to cart via button click.`);
            try {
                // Simulate adding - replace with actual API call if needed
                const result = Api.addToCart(mealId, 1); // Using the simulated API

                if (result.success && result.cart) {
                    const addedItem = result.cart.find(item => item.mealId === mealId);
                    const itemName = addedItem?.name || 'Item'; // Get name if available
                    console.log(`APP: Item added successfully: ${itemName}`);
                    updateCartCount();
                    // Use showToast instead of alert
                    showToast(`${itemName} added to cart!`, 'success');
                } else {
                    console.error("APP: Failed to add item via API:", result.message);
                    // Use showToast for error feedback
                    showToast(`Error adding item: ${result.message || 'Unknown error'}`, 'error');
                }
            } catch (error) {
                console.error("APP: Exception during addToCart:", error);
                // Use showToast for unexpected errors
                showToast("An unexpected error occurred while adding the item.", 'error');
            }
        }
    }

    async function handleSubscribeSubmit(event) {
        event.preventDefault();
        if (!subscribeForm || !subscribeEmailInput) return;

        const email = subscribeEmailInput.value.trim();
        if (!email) {
            showToast('Please enter an email address.', 'error'); // Use toast
            return;
        }

        console.log(`APP: Subscribing email: ${email}`);
        const submitButton = subscribeForm.querySelector('button[type="submit"]');
        if (submitButton) submitButton.disabled = true; // Disable button during request

        try {
            const response = await Api.subscribe(email); // Using simulated API

            if (response.status === 201 || response.status === 200) { // Check for success status
                // Use toast for success
                showToast(response.body.message || 'Subscription successful!', 'success');
                subscribeEmailInput.value = ''; // Clear input on success
            } else {
                // Use toast for API error
                showToast(`Error: ${response.body.message || 'Could not subscribe.'}`, 'error');
            }
        } catch (error) {
            console.error("APP: Error during subscription API call:", error);
            // Use toast for unexpected errors
            showToast('An unexpected error occurred. Please try again later.', 'error');
        } finally {
            if (submitButton) submitButton.disabled = false; // Re-enable button
        }
    }

    // --- Functions to Load Data and Render Sections ---

    async function loadFeaturedMeals() {
        console.log("APP: Starting loadFeaturedMeals...");
        if (!carouselContainer) {
            console.error("APP: Carousel container not found in loadFeaturedMeals.");
            return;
        }

        // Select controls/dots/placeholder to potentially re-append or manage
        const placeholder = carouselContainer.querySelector('.loading-placeholder');
        const controlsAndDots = carouselContainer.querySelectorAll('.carousel-arrow, .pagination-dot-group');

        try {
            const response = await Api.getFeaturedMeals();
            console.log("APP: Featured Meals API Response:", response);

            if (response.status === 200 && response.body && Array.isArray(response.body)) {
                const featuredMeals = response.body;
                console.log(`APP: Featured meals data received: ${featuredMeals.length} items.`);

                // Clear only the placeholder, keep controls/dots structure
                if (placeholder) placeholder.remove();
                // Remove any old slides if this function runs again
                carouselContainer.querySelectorAll('.carousel-slide').forEach(slide => slide.remove());

                if (featuredMeals.length > 0) {
                    let slidesHTML = '';
                    featuredMeals.forEach((meal, index) => {
                        slidesHTML += createCarouselSlideHTML(meal, index === 0); // First slide is active
                    });
                    console.log("APP: Generated Carousel Slides HTML (first 100 chars):", slidesHTML.substring(0, 100));

                    // Insert slides *before* the first control element (or append if none found)
                    const firstControl = carouselContainer.querySelector('.carousel-arrow, .pagination-dot-group');
                    if (firstControl) {
                        firstControl.insertAdjacentHTML('beforebegin', slidesHTML);
                        console.log("APP: Inserted slides before controls.");
                    } else {
                        // Append slides directly if controls weren't found (shouldn't happen with static HTML)
                        carouselContainer.insertAdjacentHTML('beforeend', slidesHTML);
                        console.warn("APP: Appended slides (fallback - controls/dots might be missing).");
                    }

                    // **** IMPORTANT: Initialize Carousel AFTER slides are in the DOM ****
                    if (typeof window.initializeCarousel === 'function') {
                        console.log("APP: Calling window.initializeCarousel()...");
                        window.initializeCarousel();
                    } else {
                        console.error("APP: window.initializeCarousel is not defined! Make sure script.js loaded correctly and defines it.");
                    }

                    console.log("APP: loadFeaturedMeals finished rendering slides and triggered initialization.");

                } else {
                    console.log("APP: No featured meals found in API response body.");
                    carouselContainer.insertAdjacentHTML('afterbegin', '<p>No featured meals available right now.</p>');
                    // Ensure controls/dots remain hidden if no slides
                    controlsAndDots.forEach(el => el.style.display = 'none');
                }
            } else {
                console.error("APP: Failed to load featured meals or invalid body. Status:", response.status, "Body:", response.body);
                if (placeholder) placeholder.remove();
                carouselContainer.insertAdjacentHTML('afterbegin', `<p>Error loading featured meals: ${response.body?.message || `Status ${response.status}`}</p>`);
                // Ensure controls/dots remain hidden on error
                controlsAndDots.forEach(el => el.style.display = 'none');
            }
        } catch (error) {
            console.error("APP: Error fetching or rendering featured meals:", error);
            if (placeholder) placeholder.remove();
            carouselContainer.insertAdjacentHTML('afterbegin', `<p style="color:red;">An error occurred while loading featured meals.</p>`);
            // Ensure controls/dots remain hidden on error
            controlsAndDots.forEach(el => el.style.display = 'none');
        } finally {
            console.log("APP: loadFeaturedMeals execution complete.");
            // You could double-check the final HTML structure here if needed
            // console.log("APP: Final Carousel Container innerHTML:", carouselContainer.innerHTML);
        }
    }

    async function loadSpecials() {
        console.log("APP: Starting loadSpecials...");
        if (!specialsGrid) { console.error("APP: Specials grid not found."); return; }
        specialsGrid.innerHTML = '<p>Loading specials...</p>'; // Loading state

        try {
            const response = await Api.getMeals({ categoryId: SPECIALS_CATEGORY_ID });
            console.log(`APP: Specials API Response (Category ${SPECIALS_CATEGORY_ID}):`, response);

            if (response.status === 200 && response.body && Array.isArray(response.body)) {
                console.log(`APP: Specials data received: ${response.body.length} items.`);
                renderList(response.body, specialsGrid, createSpecialCardHTML, "No specials available today.", "Specials");
            } else {
                console.error("APP: Failed to load specials or invalid body. Status:", response.status, "Body:", response.body);
                specialsGrid.innerHTML = `<p>Error loading specials: ${response.body?.message || `Status ${response.status}`}</p>`;
            }
        } catch (error) {
            console.error("APP: Error fetching or rendering specials:", error);
            specialsGrid.innerHTML = `<p style="color:red;">An error occurred while loading specials.</p>`;
        } finally {
            console.log("APP: loadSpecials execution complete.");
        }
    }

    async function loadTasteOfDay() {
        console.log("APP: Starting loadTasteOfDay...");
        if (!tasteOfDayGrid) { console.error("APP: Taste of Day grid not found."); return; }
        tasteOfDayGrid.innerHTML = "<p>Loading today's tastes...</p>"; // Loading state

        try {
            const response = await Api.getMeals({ categoryId: TASTE_OF_DAY_CATEGORY_ID });
            console.log(`APP: TasteOfDay API Response (Category ${TASTE_OF_DAY_CATEGORY_ID}):`, response);

            if (response.status === 200 && response.body && Array.isArray(response.body)) {
                console.log(`APP: Taste of Day data received: ${response.body.length} items.`);
                renderList(response.body, tasteOfDayGrid, createTasteOfDayCardHTML, "No 'Taste of the Day' meals set.", "TasteOfDay");
            } else {
                console.error("APP: Failed to load taste of day or invalid body. Status:", response.status, "Body:", response.body);
                tasteOfDayGrid.innerHTML = `<p>Error loading taste of the day: ${response.body?.message || `Status ${response.status}`}</p>`;
            }
        } catch (error) {
            console.error("APP: Error fetching or rendering taste of day:", error);
            tasteOfDayGrid.innerHTML = `<p style="color:red;">An error occurred while loading the taste of the day.</p>`;
        } finally {
            console.log("APP: loadTasteOfDay execution complete.");
        }
    }

    // --- Initial Page Load Logic ---
    async function initializePage() {
        console.log("APP: Starting initializePage...");
        try {
            // Run loads concurrently for faster page load
            await Promise.all([
                loadFeaturedMeals(), // This will now handle calling carousel init
                loadSpecials(),
                loadTasteOfDay()
            ]);

            console.log("APP: All loading functions completed.");
            updateCartCount(); // Update cart count once after initial loads
        } catch (error) {
            console.error("APP: Error during initializePage (Promise.all):", error);
            // Display a general error message?
            showToast("Error loading page content.", 'error');
        } finally {
            console.log("APP: initializePage function finished.");
        }
    }

    initializePage(); // Execute the initialization

    // --- Add Event Listeners ---
    // Use event delegation on parent elements for dynamically added buttons
    document.body.addEventListener('click', handleAddToCartClick); // Listen on body is broad, better to use specific containers if possible
    // specialsGrid.addEventListener('click', handleAddToCartClick); // More specific
    // tasteOfDayGrid.addEventListener('click', handleAddToCartClick); // More specific
    subscribeForm.addEventListener('submit', handleSubscribeSubmit);

    console.log("APP: Event listeners attached.");

}); // End DOMContentLoaded