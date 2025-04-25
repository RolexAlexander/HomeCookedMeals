/**
 * locations_app.js
 * Handles interactions on the locations page, including reservation form display and submission.
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("LOCATIONS_APP: DOM loaded.");

    // --- Element References ---
    const reservationFormContainer = document.getElementById('reservation-form-container');
    const locationCardsContainer = document.getElementById('location-cards');
    const loginPrompt = document.getElementById('login-prompt');

    // Variables for form elements (will be created dynamically)
    let reservationForm, locationInput, dateTimeInput, notesInput, reserveButton, reserveButtonText;

    // --- Helper Functions ---
    if (typeof showToast !== 'function') { /* ... include showToast fallback ... */ console.warn("LOCATIONS_APP: showToast function not found."); window.showToast = (message, type = 'info') => alert(`[${type.toUpperCase()}] ${message}`); }
    function setButtonLoading(button, textEl, isLoading, loadingText = "Reserving...") { /* ... include setButtonLoading from checkout_app.js ... */ if (!button || !textEl) return; if (isLoading) { button.disabled = true; textEl.textContent = loadingText; button.insertAdjacentHTML('afterbegin', '<span class="spinner"></span>'); } else { button.disabled = false; textEl.textContent = 'Reserve Now'; const spinner = button.querySelector('.spinner'); if (spinner) spinner.remove(); } }

    // --- Reservation Form Logic ---
    function createReservationForm() {
        // Clear existing content (like login prompt)
        reservationFormContainer.innerHTML = '';

        const formHTML = `
            <form id="reservation-form">
                <div class="form-group">
                    <label for="reservation-location" class="form-label">Location</label>
                    <input type="text" id="reservation-location" class="form-input" name="service" readonly required placeholder="Select a location first">
                </div>
                <div class="form-group">
                    <label for="reservation-datetime" class="form-label">Date & Time</label>
                    <input type="text" id="reservation-datetime" class="form-input" name="dateTime" required placeholder="Select date and time">
                     <small style="font-size: 0.8rem; color: #6c757d; margin-top: 5px; display: block;">Select date first, then time.</small>
                </div>
                 <div class="form-group">
                    <label for="reservation-guests" class="form-label">Number of Guests</label>
                    <select id="reservation-guests" name="guests" class="form-select" required>
                        <option value="" disabled selected>Select party size</option>
                        <option value="1">1 Person</option>
                        <option value="2">2 People</option>
                        <option value="3">3 People</option>
                        <option value="4">4 People</option>
                        <option value="5">5 People</option>
                        <option value="6">6 People</option>
                        <option value="7">7 People</option>
                        <option value="8">8+ People (Contact)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="reservation-notes" class="form-label">Notes (Optional)</label>
                    <textarea id="reservation-notes" name="notes" class="form-input form-textarea" placeholder="Any special requests?"></textarea>
                </div>
                <button type="submit" id="reserve-button" class="submit-button">
                    <span class="button-text">Reserve Now</span>
                </button>
            </form>
        `;
        reservationFormContainer.innerHTML = formHTML;

        // Get references to the new form elements
        reservationForm = document.getElementById('reservation-form');
        locationInput = document.getElementById('reservation-location');
        dateTimeInput = document.getElementById('reservation-datetime');
        notesInput = document.getElementById('reservation-notes');
        reserveButton = document.getElementById('reserve-button');
        reserveButtonText = reserveButton.querySelector('.button-text');


        // Initialize Flatpickr for DateTime selection
        flatpickr(dateTimeInput, {
            enableTime: true,
            dateFormat: "Y-m-d H:i", // Format compatible with API (adjust if needed)
            altInput: true, // Human-readable format
            altFormat: "F j, Y at h:i K", // e.g., August 15, 2024 at 02:30 PM
            minDate: "today", // Prevent booking past dates
            time_24hr: false, // Use AM/PM
            minuteIncrement: 15, // Allow booking every 15 minutes
        });

        // Attach submit listener
        reservationForm.addEventListener('submit', handleReservationSubmit);
    }

    function handleLocationSelect(event) {
        const button = event.target.closest('.reserve-location-btn');
        if (!button || !reservationFormContainer) return; // Click wasn't on a button or form container missing

        if (!Api.isLoggedIn()) {
             showToast("Please log in to make a reservation.", "info");
             // Highlight the login prompt briefly?
             loginPrompt?.scrollIntoView({ behavior: 'smooth', block: 'center' });
             loginPrompt?.animate([{ backgroundColor: '#fff3cd' }, {backgroundColor: '#e9ecef'}], {duration: 1500});
             return;
         }

        const locationName = button.dataset.locationService || 'Selected Location'; // Get service description

        // Ensure form exists before trying to set value
        if (!reservationForm) {
             createReservationForm(); // Create form if it doesn't exist
        }

        if (locationInput) {
            locationInput.value = locationName; // Set location/service description
             // Scroll form into view smoothly
             reservationFormContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
             // Focus the date picker
             dateTimeInput?.focus();
              flatpickr(dateTimeInput).open(); // Open flatpickr calendar

        }
         console.log(`LOCATIONS_APP: Location selected: ${locationName}`);
    }

    async function handleReservationSubmit(event) {
        event.preventDefault();
        if (!reserveButton || reserveButton.disabled || !Api.isLoggedIn()) return;

        setButtonLoading(reserveButton, reserveButtonText, true);

        const serviceDescription = locationInput.value;
        const dateTimeValue = dateTimeInput.value; // Flatpickr's main input stores the machine-readable format
        const notesValue = notesInput.value.trim();
        const guestsValue = document.getElementById('reservation-guests').value; // Get selected guest count

        // Basic validation
        if (!serviceDescription) {
            showToast("Please select a location first using the 'Reserve Here' button.", "error");
             setButtonLoading(reserveButton, reserveButtonText, false);
            return;
        }
        if (!dateTimeValue) {
            showToast("Please select a date and time for your reservation.", "error");
            dateTimeInput.focus();
            setButtonLoading(reserveButton, reserveButtonText, false);
            return;
        }
         if (!guestsValue) {
             showToast("Please select the number of guests.", "error");
             document.getElementById('reservation-guests').focus();
             setButtonLoading(reserveButton, reserveButtonText, false);
             return;
         }

        // Combine guest count with notes or service description if desired by API
        let finalNotes = notesValue;
        if (guestsValue) {
             finalNotes = `Party of ${guestsValue}. ${notesValue}`.trim();
        }


        const reservationData = {
            dateTime: new Date(dateTimeValue).toISOString(), // Convert to ISO string if needed by API
            service: serviceDescription, // Use location name as service
            notes: finalNotes
        };

        console.log("LOCATIONS_APP: Submitting reservation:", reservationData);

        try {
            const result = await Api.createAppointment(reservationData);

            if (result.status === 201 && result.body.success) {
                console.log("LOCATIONS_APP: Reservation successful!", result.body.appointment);
                showToast("Reservation confirmed! You can view it in 'My Reservations'.", 'success');
                reservationForm.reset(); // Clear the form
                locationInput.value = ''; // Specifically clear location too
                flatpickr(dateTimeInput).clear(); // Clear date picker
            } else {
                console.error("LOCATIONS_APP: Reservation failed:", result.body.message);
                showToast(`Reservation failed: ${result.body.message || 'Could not create reservation.'}`, 'error');
            }
        } catch (error) {
            console.error("LOCATIONS_APP: Error during reservation API call:", error);
            showToast("An unexpected error occurred. Please try again.", 'error');
        } finally {
            setButtonLoading(reserveButton, reserveButtonText, false);
        }
    }

    // --- Initialization ---
    function initLocationsPage() {
        if (Api.isLoggedIn()) {
            console.log("LOCATIONS_APP: User logged in, creating reservation form.");
            if(loginPrompt) loginPrompt.style.display = 'none'; // Hide login prompt
            createReservationForm();
        } else {
            console.log("LOCATIONS_APP: User not logged in, showing login prompt.");
             if(loginPrompt) loginPrompt.style.display = 'block'; // Ensure login prompt is visible
             // Optionally hide the entire sidebar if not logged in?
             // reservationFormContainer.innerHTML = ''; // Clear potential old form
        }

        // Attach listener to the container holding location cards (Event Delegation)
        if (locationCardsContainer) {
            locationCardsContainer.addEventListener('click', handleLocationSelect);
        } else {
             console.warn("LOCATIONS_APP: Location cards container not found.");
        }
    }

    initLocationsPage();

});