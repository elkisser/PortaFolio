// Video loop with reverse effect
function setupVideoLoop(video) {
    if (!video) return;
    
    let isReversed = false;
    
    video.addEventListener('ended', () => {
        if (!isReversed) {
            // Play in reverse
            isReversed = true;
            video.style.transform = 'scaleX(-1)';
            video.currentTime = video.duration;
            video.playbackRate = -1;
            video.play();
        } else {
            // Reset to normal
            isReversed = false;
            video.style.transform = 'scaleX(1)';
            video.currentTime = 0;
            video.playbackRate = 1;
            video.play();
        }
    });
    
    // Ensure video starts playing
    video.addEventListener('loadedmetadata', () => {
        video.play().catch(e => console.log('Video autoplay prevented:', e));
    });
}

// SoMoS slider fallback
function setupSomosSlider() {
    const slides = document.querySelectorAll('.somos-slider-fallback .somos-slide');
    if (slides.length === 0) return;
    
    let currentSlide = 0;
    let isReversed = false;
    
    // Activate first slide
    slides[0].classList.add('active');
    
    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        
        if (!isReversed) {
            currentSlide++;
            if (currentSlide >= slides.length) {
                // Start reverse
                isReversed = true;
                currentSlide = slides.length - 2;
            }
        } else {
            currentSlide--;
            if (currentSlide < 0) {
                // Reset to normal
                isReversed = false;
                currentSlide = 1;
            }
        }
        
        slides[currentSlide].classList.add('active');
    }
    
    // Change slide every 2 seconds
    setInterval(nextSlide, 2000);
}
