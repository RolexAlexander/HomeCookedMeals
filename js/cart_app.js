document.addEventListener('DOMContentLoaded', () => {
    console.log("CART_APP: DOM fully loaded.");

    // --- Element References ---
    const orderItemsList = document.getElementById('order-items-list');
    const billingSubtotalEl = document.getElementById('billing-subtotal');
    const billingTaxEl = document.getElementById('billing-tax');
    const billingGrandTotalEl = document.getElementById('billing-grandtotal');
    const taxRateDisplayEl = document.getElementById('tax-rate-display');
    // const discountRowEl = document.getElementById('discount-row'); // If using discount
    // const billingDiscountEl = document.getElementById('billing-discount'); // If using discount
    const payButton = document.getElementById('pay-button');
    const itemCountEl = document.getElementById('item-count');
    const cartCountHeaderEl = document.getElementById('cart-count'); // Header cart count
    const commentsInput = document.getElementById('checkout-comments');
    const privacyCheckbox = document.getElementById('privacy');
    const emptyCartMessageEl = document.querySelector('.empty-cart-message'); // To hide/show

    // --- Constants ---
    const TAX_RATE = 0.08; // 8% Tax Rate - Adjust as needed
    const PAYMENT_PAGE_URL = '/pay.html'; // Target page after successful checkout API call
    const DEFAULT_ITEM_IMAGE = 'https://via.placeholder.com/60x60/cccccc/969696?text=Meal';

    // --- Helper Functions ---
    function formatPrice(priceInCents, showFree = false) {
        if (showFree && priceInCents === 0) return "Free";
        if (typeof priceInCents !== 'number' || isNaN(priceInCents)) { return "$?.??"; }
        const dollars = (priceInCents / 100).toFixed(2);
        return `$${parseFloat(dollars).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

     if (typeof showToast !== 'function') {
        console.warn("CART_APP: showToast function not found.");
        window.showToast = (message, type = 'info') => alert(`[${type.toUpperCase()}] ${message}`);
    }

     function updateHeaderCartCount(cart) {
        if (!cartCountHeaderEl) return;
        const totalItems = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
        cartCountHeaderEl.textContent = totalItems;
        cartCountHeaderEl.classList.toggle('has-items', totalItems > 0);
    }

    // --- Rendering Functions ---
    function createCartItemHTML(item) {
        const imageUrl = item.imageUrl || DEFAULT_ITEM_IMAGE;
        // Ensure price and qty exist before multiplying
        const itemTotal = (item.price || 0) * (item.qty || 0);
        const itemName = item.name || 'Unknown Item';
        const itemQty = item.qty || 0;

       // REMOVED reference to originalPrice entirely from this template
       return `
           <div class="cart-item" data-meal-id="${item.mealId}">
               <img class="item-image-cart" src="${imageUrl}" alt="${itemName}">
               <div class="item-details-cart">
                   <div class="item-name-cart">${itemName}</div>
                   <div class="quantity-controls-cart">
                       <button class="quantity-btn-cart quantity-decrease" aria-label="Decrease quantity" ${itemQty <= 1 ? 'disabled' : ''}>−</button>
                       <span class="quantity-display-cart">${itemQty}</span>
                       <button class="quantity-btn-cart quantity-increase" aria-label="Increase quantity">+</button>
                   </div>
               </div>
               <div class="item-actions-cart">
                    <div class="item-price-cart">${formatPrice(itemTotal)}</div>
                    <!-- Original price display removed as data is not available -->
                   <button class="remove-item-btn" aria-label="Remove item">
                       <i class="fa-solid fa-trash-can"></i>
                   </button>
               </div>
           </div>
       `;
   }

    function renderCartItems(cart) {
        if (!orderItemsList) return;
        orderItemsList.innerHTML = ''; // Clear previous items

        if (!cart || cart.length === 0) {
            orderItemsList.innerHTML = '<p class="empty-cart-message">Your cart is empty.</p>';
             if (itemCountEl) itemCountEl.textContent = `0 items in cart`;
             if(payButton) payButton.disabled = true; // Disable pay button if cart empty
        } else {
             let totalItems = 0;
             cart.forEach(item => {
                 orderItemsList.innerHTML += createCartItemHTML(item);
                 totalItems += item.qty;
             });
             if (itemCountEl) itemCountEl.textContent = `${totalItems} item${totalItems === 1 ? '' : 's'} in cart`;
             if(payButton) payButton.disabled = false; // Enable pay button if items exist
        }
    }

    function updateBillingSummary(cart) {
        if (!billingSubtotalEl || !billingTaxEl || !billingGrandTotalEl || !taxRateDisplayEl) return;

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const taxAmount = subtotal * TAX_RATE;
        const grandTotal = subtotal + taxAmount;

        billingSubtotalEl.textContent = formatPrice(subtotal);
        billingTaxEl.textContent = formatPrice(taxAmount);
        billingGrandTotalEl.textContent = formatPrice(grandTotal);
        taxRateDisplayEl.textContent = (TAX_RATE * 100).toFixed(0); // Display tax rate percentage

         // Handle discount display if applicable (example)
         // const discount = calculateDiscount(cart); // Implement your discount logic
         // if (discount > 0 && discountRowEl && billingDiscountEl) {
         //     billingDiscountEl.textContent = `-${formatPrice(discount)}`;
         //     discountRowEl.style.display = 'flex';
         //     grandTotal -= discount; // Adjust grand total if discount applied
         //     billingGrandTotalEl.textContent = formatPrice(grandTotal);
         // } else if (discountRowEl) {
         //     discountRowEl.style.display = 'none';
         // }
    }

    // --- Event Handlers ---
    function handleCartAction(event) {
        const target = event.target;
        const cartItemDiv = target.closest('.cart-item');
        if (!cartItemDiv) return; // Click wasn't inside a cart item

        const mealId = cartItemDiv.dataset.mealId;
        if (!mealId) return;

         const currentItem = Api.getCart().find(item => item.mealId === mealId);
         if (!currentItem) return; // Should not happen if UI is synced

        if (target.classList.contains('quantity-increase')) {
            console.log(`CART_APP: Increasing quantity for ${mealId}`);
             const result = Api.updateCart(mealId, currentItem.qty + 1);
             if (result.success) loadCartData(); // Refresh UI
             else showToast(`Error updating quantity: ${result.message || 'Unknown error'}`, 'error');

        } else if (target.classList.contains('quantity-decrease')) {
            console.log(`CART_APP: Decreasing quantity for ${mealId}`);
            const newQuantity = currentItem.qty - 1;
            let result;
             if (newQuantity < 1) {
                 result = Api.removeFromCart(mealId); // Remove if quantity goes below 1
             } else {
                 result = Api.updateCart(mealId, newQuantity);
             }
              if (result.success) loadCartData(); // Refresh UI
              else showToast(`Error updating quantity: ${result.message || 'Unknown error'}`, 'error');

        } else if (target.closest('.remove-item-btn')) { // Check parent button for icon clicks
             console.log(`CART_APP: Removing item ${mealId}`);
             const result = Api.removeFromCart(mealId);
              if (result.success) loadCartData(); // Refresh UI
              else showToast(`Error removing item: ${result.message || 'Unknown error'}`, 'error');
        }
    }

    async function handleCheckout() {
         if (!privacyCheckbox || !privacyCheckbox.checked) {
             showToast("Please acknowledge the Privacy & Terms Policy.", "info");
             return;
         }

         // Disable button immediately
         if (payButton) payButton.disabled = true;
         payButton.textContent = "Processing...";


         // --- Mock Checkout Data (Replace with actual form data if needed) ---
         // The current API.checkout doesn't require detailed address/payment
         // but we pass an empty object as per its expectation.
         // If your actual checkout needs real data, gather it here.
         const checkoutData = {
             // shippingAddress: { street: "...", city: "...", ... }, // Example
             // paymentMethod: "...", // Example
             notes: commentsInput ? commentsInput.value : "" // Include comments if input exists
         };
         // --- End Mock Checkout Data ---


        console.log("CART_APP: Initiating checkout...");

        try {
             // Check login status BEFORE calling checkout
             if (!Api.isLoggedIn()) {
                 showToast("Please log in to complete your order.", "error");
                 // Optional: Redirect to login
                 // window.location.href = '/auth.html?redirect=cart.html';
                  if (payButton) payButton.disabled = false; // Re-enable button
                  payButton.textContent = "Proceed to Payment";
                 return;
             }

            const result = await Api.checkout(checkoutData);

            if (result.status === 201 && result.body.success) {
                console.log("CART_APP: Checkout API call successful! Order:", result.body.order);
                showToast("Order placed successfully! Redirecting...", 'success', 2000);
                // Clear local cart after successful API checkout
                // Api.clearCart(); // IMPORTANT: Assuming Api.checkout *doesn't* clear it automatically
                updateHeaderCartCount([]); // Clear header count immediately

                 // Navigate to payment page after a short delay
                 setTimeout(() => {
                    window.location.href = PAYMENT_PAGE_URL; // Redirect to pay.html
                 }, 1000); // Adjust delay as needed

            } else {
                console.error("CART_APP: Checkout API call failed:", result.body.message);
                showToast(`Checkout failed: ${result.body.message || 'Unknown error'}`, 'error');
                 if (payButton) payButton.disabled = false; // Re-enable button
                 payButton.textContent = "Proceed to Payment";
            }
        } catch (error) {
            console.error("CART_APP: Error during checkout process:", error);
            showToast("An unexpected error occurred during checkout.", 'error');
             if (payButton) payButton.disabled = false; // Re-enable button
             payButton.textContent = "Proceed to Payment";
        }
    }

    // --- Initialization Function ---
    function loadCartData() {
        console.log("CART_APP: Loading cart data...");
        try {
            const cart = Api.getCart(); // Synchronous in the provided Api.js
            console.log("CART_APP: Cart data fetched:", cart);
            renderCartItems(cart);
            updateBillingSummary(cart);
            updateHeaderCartCount(cart); // Update header count
             // Enable/disable pay button based on cart content
             if (payButton) payButton.disabled = (!cart || cart.length === 0);

        } catch (error) {
            console.error("CART_APP: Error loading cart:", error);
            if(orderItemsList) orderItemsList.innerHTML = '<p class="empty-cart-message" style="color: red;">Error loading cart items.</p>';
            // Handle error display for summary?
            if(payButton) payButton.disabled = true; // Disable pay button on error
        }
    }

    // --- Attach Event Listeners ---
    if (orderItemsList) {
        // Use event delegation for item buttons
        orderItemsList.addEventListener('click', handleCartAction);
    }

    if (payButton) {
        // payButton.addEventListener('click', handleCheckout);
    }

    // --- Initial Load ---
    loadCartData();

}); // End DOMContentLoaded