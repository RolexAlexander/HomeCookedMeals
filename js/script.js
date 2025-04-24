document.addEventListener('DOMContentLoaded', () => {
    // --- Carousel Logic ---
    const carouselContainer = document.getElementById('carouselContainer');
    const slides = carouselContainer.querySelectorAll('.carousel-slide');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const paginationDotsContainer = document.getElementById('paginationDots');

    let currentSlideIndex = 0;
    const totalSlides = slides.length;

    // Create pagination dots
    slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('pagination-dot');
        if (index === 0) {
            dot.classList.add('active');
        }
        dot.addEventListener('click', () => goToSlide(index));
        paginationDotsContainer.appendChild(dot);
    });

    const paginationDots = paginationDotsContainer.querySelectorAll('.pagination-dot');

    function updateCarousel() {
        // Update slides
        slides.forEach((slide, index) => {
            if (index === currentSlideIndex) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });

        // Update pagination dots
        paginationDots.forEach((dot, index) => {
            if (index === currentSlideIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    function goToSlide(index) {
        currentSlideIndex = index;
        updateCarousel();
    }

    function showNextSlide() {
        currentSlideIndex = (currentSlideIndex + 1) % totalSlides;
        updateCarousel();
    }

    function showPrevSlide() {
        currentSlideIndex = (currentSlideIndex - 1 + totalSlides) % totalSlides;
        updateCarousel();
    }

    // Event Listeners for arrows
    nextBtn.addEventListener('click', showNextSlide);
    prevBtn.addEventListener('click', showPrevSlide);

    // Initialize carousel
    updateCarousel();


    // --- Footer Year ---
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
});