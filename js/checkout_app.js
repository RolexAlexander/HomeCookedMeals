document.addEventListener('DOMContentLoaded', () => {
    console.log("CHECKOUT_APP: DOM fully loaded.");

    // --- Element References ---
    const checkoutContentEl = document.getElementById('checkout-content');
    const checkoutFormEl = document.getElementById('checkout-form');
    const confirmationSectionEl = document.getElementById('confirmation-section');
    const loadingMessageEl = checkoutContentEl.querySelector('.loading-error-message');
    const cartCountHeaderEl = document.getElementById('cart-count');

    // Form Elements
    const deliveryMethodRadios = document.querySelectorAll('input[name="deliveryType"]');
    const addressSection = document.getElementById('address-section');
    const addressInputs = addressSection.querySelectorAll('input.form-input');
    const paymentMethodRadios = document.querySelectorAll('input[name="paymentType"]');
    const cardDetailsSection = document.getElementById('card-details-section');
    const cardInputs = cardDetailsSection.querySelectorAll('input.form-input');
    const orderTotalDisplay = document.getElementById('order-total-value');
    const placeOrderButton = document.getElementById('place-order-button');
    const placeOrderButtonText = placeOrderButton.querySelector('.button-text');

    // Confirmation Elements
    const confirmationTextEl = document.getElementById('confirmation-text');
    const confirmationOrderIdEl = document.getElementById('confirmation-order-id');
    const confirmationDeliveryInfoEl = document.getElementById('confirmation-delivery-info');

    // --- State Variables ---
    let orderTotal = 0;

    // --- Helper Functions ---
    function formatPrice(priceInCents) { /* ... keep existing ... */ if (typeof priceInCents !== 'number' || isNaN(priceInCents)) { return "$?.??"; } const dollars = (priceInCents / 100).toFixed(2); return `$${parseFloat(dollars).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
    if (typeof showToast !== 'function') { /* ... keep existing fallback ... */ console.warn("CHECKOUT_APP: showToast function not found."); window.showToast = (message, type = 'info') => alert(`[${type.toUpperCase()}] ${message}`); }
    function updateHeaderCartCount(cart) { /* ... keep existing ... */ if (!cartCountHeaderEl) return; const totalItems = cart.reduce((sum, item) => sum + (item.qty || 0), 0); cartCountHeaderEl.textContent = totalItems; cartCountHeaderEl.classList.toggle('has-items', totalItems > 0); }

    function displayError(message) {
        // Replace entire content area with error
        checkoutContentEl.innerHTML = `<div class="loading-error-message">${message}</div>`;
        document.title = "Checkout Error - Home Cooked Meals"; // Update title
    }

    // Function to show/hide sections with smooth transition (using classes)
    function setSectionVisibility(sectionElement, isVisible) {
        if (sectionElement) {
            sectionElement.classList.toggle('hidden', !isVisible);
            sectionElement.classList.toggle('visible', isVisible); // Add visible class for potential styling
        }
    }

    // Function to set button loading state
    function setButtonLoading(button, textEl, isLoading, loadingText = "Processing...") {
        if (!button || !textEl) return;
        if (isLoading) {
            button.disabled = true;
            textEl.textContent = loadingText;
            // Add spinner dynamically if needed or manage via CSS class
             button.insertAdjacentHTML('afterbegin', '<span class="spinner"></span>');
        } else {
            button.disabled = false;
            textEl.textContent = 'Place Order'; // Reset text
            const spinner = button.querySelector('.spinner');
            if (spinner) spinner.remove();
        }
    }

    // Basic Field Validation Highlighting
     function validateAndHighlight(inputs) {
         let isValid = true;
         inputs.forEach(input => {
             if (input.required && !input.value.trim()) {
                 input.classList.add('is-invalid');
                 isValid = false;
             } else if (input.pattern && !new RegExp(`^${input.pattern}$`).test(input.value)) {
                 // Check pattern if present and value exists
                 input.classList.add('is-invalid');
                 isValid = false;
             } else {
                 input.classList.remove('is-invalid');
             }
             // Clear validation on input
             input.addEventListener('input', () => input.classList.remove('is-invalid'), { once: true });
         });
         return isValid;
     }


    // --- Form Logic ---
    function toggleAddressSection() {
        const isDelivery = document.querySelector('input[name="deliveryType"][value="delivery"]').checked;
        setSectionVisibility(addressSection, isDelivery);
        addressInputs.forEach(input => input.required = isDelivery);
    }

    function toggleCardDetailsSection() {
        const isCard = document.querySelector('input[name="paymentType"][value="Card"]').checked;
        setSectionVisibility(cardDetailsSection, isCard);
         cardInputs.forEach(input => input.required = isCard);
    }

    function showConfirmation(order) {
         setSectionVisibility(checkoutFormEl, false); // Hide form
         setSectionVisibility(confirmationSectionEl, true); // Show confirmation

        confirmationOrderIdEl.textContent = `#${order.id}`;
        const deliveryType = order.shippingAddress.deliveryType || 'pickup';
        if (deliveryType === 'delivery') {
            confirmationDeliveryInfoEl.textContent = `It will be delivered to ${order.shippingAddress.street || 'your address'}.`;
        } else {
            confirmationDeliveryInfoEl.textContent = `Your order is ready for pick-up.`;
        }
        updateHeaderCartCount([]);
        document.title = "Order Confirmed - Home Cooked Meals";
        window.scrollTo(0, 0); // Scroll to top
    }

    // --- Event Handlers ---
    async function handlePlaceOrder(event) {
        event.preventDefault();
        if (!placeOrderButton || placeOrderButton.disabled) return;

        // Clear previous validation
         addressInputs.forEach(input => input.classList.remove('is-invalid'));
         cardInputs.forEach(input => input.classList.remove('is-invalid'));

        setButtonLoading(placeOrderButton, placeOrderButtonText, true, "Placing Order...");

        // 1. Get Delivery Type & Address
        const deliveryType = document.querySelector('input[name="deliveryType"]:checked').value;
        let shippingAddress = { deliveryType: deliveryType };
        let isAddressValid = true;
        if (deliveryType === 'delivery') {
            isAddressValid = validateAndHighlight(addressInputs); // Validate address fields
            if (!isAddressValid) {
                showToast("Please fill in all required address fields correctly.", "error");
                setButtonLoading(placeOrderButton, placeOrderButtonText, false);
                addressSection.querySelector('.is-invalid')?.focus();
                return;
            }
            // Build address object only if valid
            shippingAddress.street = document.getElementById('street').value.trim();
            shippingAddress.city = document.getElementById('city').value.trim();
            shippingAddress.zip = document.getElementById('zip').value.trim();
            shippingAddress.country = document.getElementById('country').value.trim();
        } else {
            shippingAddress.detail = "Store Pickup";
        }

        // 2. Get Payment Method & Details
        const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
        let paymentMethodString = paymentType;
        let isCardValid = true;
        if (paymentType === 'Card') {
            isCardValid = validateAndHighlight(cardInputs); // Validate card fields
             if (!isCardValid) {
                showToast("Please fill in all required card details correctly.", "error");
                setButtonLoading(placeOrderButton, placeOrderButtonText, false);
                cardDetailsSection.querySelector('.is-invalid')?.focus();
                return;
             }
            // Construct description (DO NOT SEND REAL DATA)
            const lastFour = document.getElementById('card-number').value.replace(/\D/g,'').slice(-4);
            paymentMethodString = `Credit Card ending ${lastFour || 'XXXX'}`;
        } else {
            paymentMethodString = "PayPal"; // Or handle PayPal specific logic
        }

        // 3. Construct checkoutData (ensure validation passed)
         if (!isAddressValid || !isCardValid) { // Double check validity before proceeding
             console.error("Validation failed, stopping checkout.");
             setButtonLoading(placeOrderButton, placeOrderButtonText, false);
             return;
         }

        const checkoutData = {
            shippingAddress: shippingAddress,
            paymentMethod: paymentMethodString,
            // notes: commentsInput ? commentsInput.value : ""
        };
        console.log("CHECKOUT_APP: Submitting validated checkout data:", checkoutData);

        // 4. Call API
        try {
            const result = await Api.checkout(checkoutData);
            if (result.status === 201 && result.body.success) {
                console.log("CHECKOUT_APP: Checkout successful! Order:", result.body.order);
                 // No toast needed, show confirmation screen
                 showConfirmation(result.body.order);
                 // Button stays disabled as view changes
            } else {
                console.error("CHECKOUT_APP: Checkout API call failed:", result.body.message);
                showToast(`Order placement failed: ${result.body.message || 'Unknown error'}`, 'error');
                setButtonLoading(placeOrderButton, placeOrderButtonText, false);
            }
        } catch (error) {
            console.error("CHECKOUT_APP: Error during checkout API call:", error);
            showToast("An unexpected network error occurred. Please try again.", 'error');
            setButtonLoading(placeOrderButton, placeOrderButtonText, false);
        }
    }

    // --- Initialization ---
    async function initCheckout() {
        setSectionVisibility(loadingMessageEl, true); // Show loading initially
        setSectionVisibility(checkoutFormEl, false);
        setSectionVisibility(confirmationSectionEl, false);

        if (!Api.isLoggedIn()) { /* ... keep login check and redirect ... */ console.log("CHECKOUT_APP: User not logged in. Redirecting..."); showToast("Please log in to proceed.", "info"); window.location.href = `/auth.html?redirect=${encodeURIComponent(window.location.pathname)}`; return; }

        try {
            const cart = Api.getCart();
            updateHeaderCartCount(cart);

            if (!cart || cart.length === 0) { displayError("Your cart is empty."); return; }

            orderTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
            if (orderTotalDisplay) orderTotalDisplay.textContent = formatPrice(orderTotal);

            setSectionVisibility(loadingMessageEl, false); // Hide loading
            setSectionVisibility(checkoutFormEl, true); // Show form
            if (placeOrderButton) placeOrderButton.disabled = false;

            toggleAddressSection();
            toggleCardDetailsSection();

            deliveryMethodRadios.forEach(radio => radio.addEventListener('change', toggleAddressSection));
            paymentMethodRadios.forEach(radio => radio.addEventListener('change', toggleCardDetailsSection));
            checkoutFormEl.addEventListener('submit', handlePlaceOrder);

        } catch (error) { console.error("CHECKOUT_APP: Error initializing:", error); displayError("Could not load checkout."); }
    }

    initCheckout();

});