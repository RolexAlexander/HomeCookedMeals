/**
 * reservations_app.js
 * Handles fetching, displaying, editing, and deleting user reservations.
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("RESERVATIONS_APP: DOM loaded.");

    // --- Element References ---
    const reservationsContent = document.getElementById('reservations-content');
    const reservationList = document.getElementById('reservation-list');
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-reservation-form');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    // Edit Form Fields
    const editIdInput = document.getElementById('edit-reservation-id');
    const editServiceInput = document.getElementById('edit-reservation-service');
    const editDateTimeInput = document.getElementById('edit-reservation-datetime');
    const editNotesInput = document.getElementById('edit-reservation-notes');
    const editSaveBtn = document.getElementById('modal-save-btn');

    let flatpickrInstance = null; // To hold the date picker instance

    // --- Helper Functions ---
    if (typeof showToast !== 'function') { /* ... include showToast fallback ... */ console.warn("RESERVATIONS_APP: showToast function not found."); window.showToast = (message, type = 'info') => alert(`[${type.toUpperCase()}] ${message}`); }

    function formatReservationDateTime(isoString) {
        if (!isoString) return 'N/A';
        try {
            const date = new Date(isoString);
             // Example format: Aug 15, 2024, 2:30 PM
            return date.toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: '2-digit', hour12: true
            });
        } catch (e) {
            console.error("Error formatting date:", e);
            return isoString; // Return original if formatting fails
        }
    }

     // Function to set modal visibility
     function setModalVisibility(isVisible) {
         if (editModal) {
             editModal.classList.toggle('visible', isVisible);
         }
     }

    // --- Rendering ---
    function createReservationItemHTML(reservation) {
        const formattedDateTime = formatReservationDateTime(reservation.dateTime);
        const statusClass = `status-${(reservation.status || 'pending').toLowerCase()}`;
        // Disable edit/cancel for past or completed/cancelled reservations
        const now = new Date();
        const reservationDate = new Date(reservation.dateTime);
        const isPast = reservationDate < now;
        const isActionable = !isPast && reservation.status !== 'completed' && reservation.status !== 'cancelled';

        return `
            <div class="reservation-item" data-id="${reservation.id}">
                <div class="reservation-details">
                    <p><strong>Service:</strong> ${reservation.service || 'N/A'}</p>
                    <p><strong>Date & Time:</strong> ${formattedDateTime}</p>
                    <p><strong>Status:</strong> <span class="reservation-status ${statusClass}">${reservation.status || 'Pending'}</span></p>
                    ${reservation.notes ? `<p><strong>Notes:</strong> ${reservation.notes}</p>` : ''}
                </div>
                <div class="reservation-actions">
                    <button class="action-btn edit-btn" ${isActionable ? '' : 'disabled'} title="${isActionable ? 'Edit Reservation' : 'Cannot edit past/completed/cancelled'}">
                        <i class="fa-regular fa-pen-to-square"></i> Edit
                    </button>
                    <button class="action-btn cancel-btn" ${isActionable ? '' : 'disabled'} title="${isActionable ? 'Cancel Reservation' : 'Cannot cancel past/completed/cancelled'}">
                         <i class="fa-regular fa-calendar-xmark"></i> Cancel
                    </button>
                     <!-- Delete button might be redundant if Cancel is sufficient -->
                    <!-- <button class="action-btn delete-btn"> <i class="fa-solid fa-trash-can"></i> Delete</button> -->
                </div>
            </div>
        `;
    }

    function renderReservations(reservations) {
        if (!reservationList) return;
        reservationList.innerHTML = ''; // Clear loading/previous

        if (reservations && reservations.length > 0) {
            // Sort reservations by date (newest first)
            reservations.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
            reservations.forEach(res => {
                reservationList.innerHTML += createReservationItemHTML(res);
            });
             attachActionListeners(); // Attach listeners after rendering
        } else {
            reservationList.innerHTML = '<p class="loading-error-message">You have no reservations.</p>';
        }
    }

    function displayLoginPrompt() {
         if (!reservationList) return;
         reservationList.innerHTML = `<div class="login-prompt">Please <a href="auth.html?redirect=${encodeURIComponent(window.location.pathname)}">log in</a> to view your reservations.</div>`;
    }
     function displayLoading() {
         if (!reservationList) return;
         reservationList.innerHTML = `<div class="loading-error-message">Loading reservations...</div>`;
     }
      function displayError(message) {
         if (!reservationList) return;
         reservationList.innerHTML = `<div class="loading-error-message" style="color: red;">${message}</div>`;
     }

    // --- API Calls ---
    async function fetchReservations() {
        if (!Api.isLoggedIn()) {
             displayLoginPrompt();
             return;
         }
        displayLoading();
        try {
            const result = await Api.getAppointments();
            if (result.status === 200 && Array.isArray(result.body)) {
                renderReservations(result.body);
            } else {
                console.error("RESERVATIONS_APP: Failed to fetch reservations", result);
                displayError(`Error loading reservations: ${result.body.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("RESERVATIONS_APP: Network error fetching reservations", error);
            displayError("Network error. Please try again later.");
        }
    }

     async function handleCancelReservation(reservationId) {
         if (!confirm("Are you sure you want to cancel this reservation?")) return;

         console.log(`RESERVATIONS_APP: Cancelling reservation ${reservationId}`);
         showToast("Cancelling...", "info");
         try {
             // Use the update API to set status to 'cancelled'
             const result = await Api.updateAppointment({ id: reservationId, status: 'cancelled' });
             if (result.status === 200 && result.body.success) {
                 showToast("Reservation cancelled successfully.", "success");
                 fetchReservations(); // Refresh the list
             } else {
                 showToast(`Failed to cancel: ${result.body.message || 'Error'}`, "error");
             }
         } catch (error) {
              showToast("Network error while cancelling.", "error");
         }
     }

     async function handleDeleteReservation(reservationId) {
          if (!confirm("Are you sure you want to permanently delete this reservation? This cannot be undone.")) return;

          console.log(`RESERVATIONS_APP: Deleting reservation ${reservationId}`);
          showToast("Deleting...", "info");
           try {
               const result = await Api.deleteAppointment(reservationId);
                if (result.status === 200 && result.body.success) {
                     showToast("Reservation deleted successfully.", "success");
                     fetchReservations(); // Refresh the list
                 } else {
                     showToast(`Failed to delete: ${result.body.message || 'Error'}`, "error");
                 }
           } catch (error) {
               showToast("Network error while deleting.", "error");
           }
       }

      async function handleEditSubmit(event) {
           event.preventDefault();
           if (!editSaveBtn || editSaveBtn.disabled) return;

           editSaveBtn.disabled = true; // Basic loading state
           editSaveBtn.textContent = 'Saving...';

           const reservationId = editIdInput.value;
           const newDateTime = editDateTimeInput.value; // Flatpickr machine format
           const newNotes = editNotesInput.value.trim();
           const service = editServiceInput.value; // Service cannot be changed in this UI

           // Basic validation
           if (!newDateTime) {
               showToast("Please select a valid date and time.", "error");
               editSaveBtn.disabled = false; editSaveBtn.textContent = 'Save Changes';
               return;
           }

            const updateData = {
                id: reservationId,
                dateTime: new Date(newDateTime).toISOString(), // Convert to ISO
                notes: newNotes,
                // service: service // Don't include service if it shouldn't be updated
           };

           console.log("RESERVATIONS_APP: Updating reservation:", updateData);

           try {
                const result = await Api.updateAppointment(updateData);
                if (result.status === 200 && result.body.success) {
                     showToast("Reservation updated successfully.", "success");
                     setModalVisibility(false);
                     fetchReservations(); // Refresh list
                } else {
                     showToast(`Update failed: ${result.body.message || 'Error'}`, "error");
                }
           } catch (error) {
                showToast("Network error while updating.", "error");
           } finally {
                 editSaveBtn.disabled = false; editSaveBtn.textContent = 'Save Changes';
           }
       }


    // --- Event Listeners ---
    function attachActionListeners() {
        reservationList.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', handleEditClick);
        });
        reservationList.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', handleCancelClick);
        });
         // reservationList.querySelectorAll('.delete-btn').forEach(btn => {
         //    btn.addEventListener('click', handleDeleteClick);
         // });
    }

    function handleEditClick(event) {
        const button = event.currentTarget;
        const itemDiv = button.closest('.reservation-item');
        if (!itemDiv) return; // Safety check

        const reservationId = itemDiv.dataset.id;

        // Fetch service description reliably
        const serviceElement = itemDiv.querySelector('.reservation-details p:first-child'); // Assuming service is always first
        const service = serviceElement ? serviceElement.textContent.replace(/strong>:/gi, '').replace('Service:', '').trim() : 'N/A'; // More robust removal

        // *** CORRECTED NOTES FINDING LOGIC ***
        let notes = '';
        const detailParagraphs = itemDiv.querySelectorAll('.reservation-details p');
        detailParagraphs.forEach(p => {
            const strongTag = p.querySelector('strong');
            // Check if strong tag exists and its text content is exactly "Notes:"
            if (strongTag && strongTag.textContent.trim() === 'Notes:') {
                // Get the next sibling node after the <strong> tag
                const notesNode = strongTag.nextSibling;
                // Check if the next sibling is a text node and get its content
                if (notesNode && notesNode.nodeType === Node.TEXT_NODE) {
                    notes = notesNode.textContent.trim();
                }
                // Exit the loop once found (optional optimization)
                // return; // Can't return directly from forEach like this
            }
        });
        // *** END CORRECTED NOTES FINDING LOGIC ***


        // --- Pre-fill form ---
        if (!editIdInput || !editServiceInput || !editNotesInput || !editDateTimeInput) {
            console.error("RESERVATIONS_APP: Edit modal form elements not found!");
            return;
        }

        editIdInput.value = reservationId;
        editServiceInput.value = service; // Use the found service
        editNotesInput.value = notes; // Use the found notes

        // Initialize or update flatpickr for the date field
        if (flatpickrInstance) flatpickrInstance.destroy(); // Destroy previous instance
        flatpickrInstance = flatpickr(editDateTimeInput, {
           enableTime: true,
           dateFormat: "Y-m-d H:i",
           altInput: true,
           altFormat: "F j, Y at h:i K",
           minDate: "today",
           time_24hr: false,
           minuteIncrement: 15,
           // We need the original date to set as default - consider fetching full data
           // defaultDate: dateTimeISO // Pre-select current date/time (Requires fetching full object)
        });

        setModalVisibility(true);
        // Don't auto-open, let user click
        // flatpickrInstance.open(); // Open date picker
    }

     function handleCancelClick(event) {
         const button = event.currentTarget;
         const itemDiv = button.closest('.reservation-item');
         const reservationId = itemDiv.dataset.id;
         handleCancelReservation(reservationId);
     }

    // function handleDeleteClick(event) {
    //      const button = event.currentTarget;
    //      const itemDiv = button.closest('.reservation-item');
    //      const reservationId = itemDiv.dataset.id;
    //      handleDeleteReservation(reservationId);
    // }

    // Modal Close/Cancel Listeners
     if (modalCloseBtn) modalCloseBtn.addEventListener('click', () => setModalVisibility(false));
     if (modalCancelBtn) modalCancelBtn.addEventListener('click', () => setModalVisibility(false));
     if (editModal) { // Close modal if clicking outside the content
         editModal.addEventListener('click', (event) => {
             if (event.target === editModal) {
                 setModalVisibility(false);
             }
         });
     }
     if (editForm) editForm.addEventListener('submit', handleEditSubmit);


    // --- Initial Load ---
    fetchReservations(); // Fetch reservations on page load

}); // End DOMContentLoaded