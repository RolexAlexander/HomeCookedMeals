// Keep only ONE DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {

    // --- Carousel Logic ---
    const carouselContainer = document.getElementById('carouselContainer');
    // Check if carouselContainer actually exists before querying inside it
    if (carouselContainer) {
        const slides = carouselContainer.querySelectorAll('.carousel-slide');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const paginationDotsContainer = document.getElementById('paginationDots');

        let currentSlideIndex = 0;
        const totalSlides = slides.length;
        let autoSlideInterval;
        const autoSlideIntervalTime = 4000;

        // --- Create pagination dots ---
        if (totalSlides > 1 && paginationDotsContainer) {
            // Clear container first to be safe
            paginationDotsContainer.innerHTML = '';

            slides.forEach((_, index) => {
                const dot = document.createElement('span');
                dot.classList.add('pagination-dot');
                if (index === 0) {
                    dot.classList.add('active');
                }
                dot.addEventListener('click', () => {
                    goToSlide(index);
                    resetAutoSlideTimer();
                });
                paginationDotsContainer.appendChild(dot);
            });
        }
        // Select dots *after* they are created
        const paginationDots = paginationDotsContainer ? paginationDotsContainer.querySelectorAll('.pagination-dot') : [];

        // --- Carousel Update Function ---
        function updateCarousel() {
            slides.forEach((slide, index) => {
                slide.classList.toggle('active', index === currentSlideIndex);
            });
            if (paginationDots.length > 0) {
                paginationDots.forEach((dot, index) => {
                    dot.classList.toggle('active', index === currentSlideIndex);
                });
            }
        }

        // --- Navigation Functions ---
        function goToSlide(index) {
            // Ensure index is within bounds (though modulo should handle this)
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

        // --- Automatic Sliding Logic ---
        function startAutoSlide() {
            stopAutoSlide();
            if (totalSlides > 1) {
               autoSlideInterval = setInterval(showNextSlide, autoSlideIntervalTime);
            }
        }

        function stopAutoSlide() {
            clearInterval(autoSlideInterval);
        }

        function resetAutoSlideTimer() {
            stopAutoSlide();
            startAutoSlide();
        }

        // --- Event Listeners ---
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                showNextSlide();
                resetAutoSlideTimer();
            });
        }
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                showPrevSlide();
                resetAutoSlideTimer();
            });
        }

        // Pause auto-slide on hover
        carouselContainer.addEventListener('mouseenter', stopAutoSlide);
        carouselContainer.addEventListener('mouseleave', startAutoSlide);

        // --- Initialize ---
        if (slides.length > 0) {
            updateCarousel();
            startAutoSlide();
        }

    } // End of check for carouselContainer

    // --- Today's Menu Date Logic ---
    const dateDisplayElement = document.getElementById('todays-date-formatted');
    if (dateDisplayElement) {
        try {
            const today = new Date();
            const day = today.getDate();
            const monthNames = ["January", "February", "March", "April", "May", "June",
                                "July", "August", "September", "October", "November", "December"];
            const monthName = monthNames[today.getMonth()];
            function getOrdinalSuffix(d) {
                if (d > 3 && d < 21) return 'th';
                switch (d % 10) {
                    case 1: return "st";
                    case 2: return "nd";
                    case 3: return "rd";
                    default: return "th";
                }
            }
            const formattedDate = `${day}${getOrdinalSuffix(day)} ${monthName}`;
            dateDisplayElement.textContent = formattedDate;
        } catch (error) {
            console.error("Error setting formatted date:", error);
            dateDisplayElement.textContent = "Today";
        }
    }

    // --- Footer Year ---
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

}); // End of the single DOMContentLoaded listener