// --- Toast Notification Function (Modified) ---
function showToast(message, type = 'info', duration = 3000) {
    console.log(`SCRIPT: showToast called: ${message}, type: ${type}`);
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.id = toastId;
    // Add base class, type class, and 'show' class for initial state (handled by CSS animation)
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // REMOVED: Inline style settings for position, bottom, right, zIndex, opacity, transition
    // Set background/color based on type (this CAN stay or move to CSS)
    // If moving to CSS, ensure .toast-success, .toast-error etc. define background-color
    if (type === 'success') {
        toast.style.backgroundColor = '#28a745'; // Keep or move to CSS
        toast.style.color = 'white';             // Keep or move to CSS
    } else if (type === 'error') {
        toast.style.backgroundColor = '#dc3545'; // Keep or move to CSS
        toast.style.color = 'white';             // Keep or move to CSS
    } else { // info or default
        toast.style.backgroundColor = '#17a2b8'; // Keep or move to CSS
        toast.style.color = 'white';             // Keep or move to CSS
    }

    document.body.appendChild(toast);

    // Trigger the 'show' class addition shortly after appending
    // This allows the CSS transition/animation to start correctly
    setTimeout(() => {
        toast.classList.add('show');
        console.log(`SCRIPT: Added 'show' class to toast ${toastId}`); // Debug
    }, 50); // Small delay for rendering

    // Set timeout to remove the toast
    setTimeout(() => {
        toast.classList.remove('show'); // Trigger fade-out animation
        // Remove from DOM after fade-out completes (match transition duration in CSS)
        toast.addEventListener('transitionend', () => {
             // Check if the element still exists before removing
             if (toast.parentNode) {
                 toast.remove();
                 console.log(`SCRIPT: Removed toast ${toastId} after transition`); // Debug
             }
        }, { once: true }); // Important: ensure listener runs only once

        // Fallback removal if transitionend doesn't fire (e.g., display: none)
        setTimeout(() => {
             if (toast.parentNode) {
                 toast.remove();
                 console.log(`SCRIPT: Removed toast ${toastId} via fallback timeout`); // Debug
             }
        }, 600); // Slightly longer than CSS transition

    }, duration);
}


// --- Global Carousel Initialization Function ---
// We define it here so app.js can call it AFTER slides are loaded
window.initializeCarousel = () => {
    console.log("SCRIPT: initializeCarousel() called.");
    const carouselContainer = document.getElementById('carouselContainer');
    if (!carouselContainer) {
        console.error("SCRIPT: Carousel container not found during initialization.");
        return;
    }

    // Select slides *inside* the function, *after* they should have been added by app.js
    const slides = carouselContainer.querySelectorAll('.carousel-slide');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const paginationDotsContainer = document.getElementById('paginationDots');

    console.log(`SCRIPT: Found ${slides.length} slides inside carouselContainer.`);

    // --- Basic Checks ---
    if (slides.length <= 1) { // Only initialize if more than one slide
        console.warn(`SCRIPT: Found ${slides.length} slide(s). Carousel controls/dots/auto-slide disabled.`);
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (paginationDotsContainer) paginationDotsContainer.style.display = 'none';
        // Ensure the single slide is visible if it exists
        if (slides.length === 1) {
           slides[0].classList.add('active');
           console.log("SCRIPT: Made the single slide active.");
        }
        return; // Don't initialize further if 0 or 1 slide
    } else {
         // Ensure controls and dots container are visible if slides exist and > 1
         console.log("SCRIPT: More than 1 slide found, enabling controls/dots.");
         if(prevBtn) prevBtn.style.display = ''; // Show button
         if(nextBtn) nextBtn.style.display = ''; // Show button
         if(paginationDotsContainer) paginationDotsContainer.style.display = ''; // Show dots container
    }

    let currentSlideIndex = 0;
    const totalSlides = slides.length; // Should be > 1 here
    let autoSlideInterval;
    const autoSlideIntervalTime = 4000;

    // --- Create pagination dots ---
    const paginationDots = [];
    if (paginationDotsContainer) { // Check container exists
        paginationDotsContainer.innerHTML = ''; // Clear previous dots if any
        slides.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.classList.add('pagination-dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => {
                goToSlide(index);
                resetAutoSlideTimer();
            });
            paginationDotsContainer.appendChild(dot);
            paginationDots.push(dot);
        });
        console.log(`SCRIPT: Created ${paginationDots.length} pagination dots.`);
    } else {
        console.warn("SCRIPT: Pagination dots container not found.");
    }


    function updateCarousel() {
        // console.log("SCRIPT: Updating carousel to index:", currentSlideIndex); // Frequent log, maybe disable later
        slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === currentSlideIndex);
        });
        if (paginationDots.length > 0) {
            paginationDots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentSlideIndex);
            });
        }
    }

    function goToSlide(index) {
        if (index >= 0 && index < totalSlides) {
            currentSlideIndex = index;
            updateCarousel();
        }
    }

    function showNextSlide() {
        currentSlideIndex = (currentSlideIndex + 1) % totalSlides;
        updateCarousel();
    }

    function showPrevSlide() {
        currentSlideIndex = (currentSlideIndex - 1 + totalSlides) % totalSlides;
        updateCarousel();
    }

    function startAutoSlide() {
        stopAutoSlide(); // Clear existing interval first
        console.log("SCRIPT: Starting auto-slide.");
        autoSlideInterval = setInterval(showNextSlide, autoSlideIntervalTime);
    }

    function stopAutoSlide() {
        // console.log("SCRIPT: Stopping auto-slide."); // Can be noisy
        clearInterval(autoSlideInterval);
    }

    function resetAutoSlideTimer() {
        stopAutoSlide();
        startAutoSlide();
    }

    // --- Event Listeners ---
    // Use direct assignment or remove/add listeners to avoid duplicates if init runs multiple times
    if (nextBtn) {
        nextBtn.onclick = () => {
            showNextSlide();
            resetAutoSlideTimer();
        };
    }
     if (prevBtn) {
         prevBtn.onclick = () => {
            showPrevSlide();
            resetAutoSlideTimer();
        };
    }

    // Pause auto-slide on hover
    carouselContainer.onmouseenter = stopAutoSlide;
    carouselContainer.onmouseleave = startAutoSlide;

    // --- Initial Display ---
    slides[0]?.classList.add('active'); // Ensure first slide is active explicitly
    updateCarousel(); // Set the first slide/dot active correctly
    startAutoSlide(); // Start the automatic sliding

    console.log("SCRIPT: Carousel initialized successfully.");

}; // --- End of window.initializeCarousel ---


// --- Other Logic (Date, Year) - Run on DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("SCRIPT: DOMContentLoaded fired for Date/Year.");

    const dateDisplayElement = document.getElementById('todays-date-formatted');
    if (dateDisplayElement) {
        try {
            const today = new Date();
            const day = today.getDate();
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const monthName = monthNames[today.getMonth()];
            function getOrdinalSuffix(d) { if (d > 3 && d < 21) return 'th'; switch (d % 10) { case 1: return "st"; case 2: return "nd"; case 3: return "rd"; default: return "th"; } }
            const formattedDate = `${day}${getOrdinalSuffix(day)} ${monthName}`;
            dateDisplayElement.textContent = formattedDate;
        } catch (error) { console.error("SCRIPT: Error setting formatted date:", error); dateDisplayElement.textContent = "Today"; }
    } else {
        console.warn("SCRIPT: Date display element (#todays-date-formatted) not found.");
    }

    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    } else {
         console.warn("SCRIPT: Current year span (#currentYear) not found.");
    }

    console.log("SCRIPT: Date and Year setup complete.");

    // Note: Carousel initialization is NOT called here anymore.
    // It's called by app.js after loading slides.
}); // End DOMContentLoaded Listener