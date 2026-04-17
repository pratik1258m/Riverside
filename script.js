/* ===================================================
   The Riverside Farm — script.js
   Performance-first: RAF-throttled scroll, IO-based
   mobile bar, passive listeners everywhere.
   =================================================== */

// ── DOM refs ──────────────────────────────────────
const navShell = document.querySelector('[data-nav-shell]');
const progressBar = document.querySelector('[data-testid="scroll-progress-bar"]');
const heroMedia = document.querySelector('.hero-media');
const heroSection = document.getElementById('home');
const mobileBar = document.getElementById('mobile-booking-bar');
const sections = document.querySelectorAll('section[id], header[id]');
const navLinks = document.querySelectorAll('.nav-link');
const revealItems = document.querySelectorAll('.reveal');
const countItems = document.querySelectorAll('[data-count-target]');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Scroll handler (RAF-throttled, zero layout reflow) ─
let rafPending = false;
let scrollMax = 0;

const recalcScrollMax = () => {
    scrollMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
};
recalcScrollMax();
window.addEventListener('resize', recalcScrollMax, { passive: true });

const applyScrollState = () => {
    const y = window.scrollY;
    navShell.classList.toggle('nav-scrolled', y > 24);
    progressBar.style.transform = `scaleX(${y / scrollMax})`;
    // Lightweight parallax — desktop only, skipped when prefers-reduced-motion
    if (heroMedia && window.innerWidth >= 768 && !prefersReducedMotion) {
        heroMedia.style.transform = `scale(1.03) translateY(${Math.min(y * 0.10, 24)}px)`;
    }
    rafPending = false;
};

window.addEventListener('scroll', () => {
    if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(applyScrollState);
    }
}, { passive: true });

// ── Mobile booking bar via IntersectionObserver ────
// Avoids getBoundingClientRect() (forces reflow) on every scroll tick.
if (mobileBar && heroSection) {
    const heroObserver = new IntersectionObserver(
        ([entry]) => {
            // Show bar when hero is fully out of view (bottom edge scrolled past)
            mobileBar.classList.toggle('bar-visible', !entry.isIntersecting);
        },
        { rootMargin: '60px 0px 0px 0px', threshold: 0 }
    );
    heroObserver.observe(heroSection);
}

// Initial state
applyScrollState();

// ── Reveal animations (IntersectionObserver) ──────
if (!prefersReducedMotion) {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08 });
    revealItems.forEach((item) => revealObserver.observe(item));
} else {
    // Skip animation, just show everything immediately
    revealItems.forEach((item) => item.classList.add('is-visible'));
}

// ── Active nav link highlight ──────────────────────
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            navLinks.forEach((link) => {
                link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
            });
        }
    });
}, { rootMargin: '-40% 0px -45% 0px', threshold: 0.01 });
sections.forEach((section) => sectionObserver.observe(section));

// ── Mobile menu ─────────────────────────────────────
const mobileToggle = document.querySelector('[data-mobile-menu-toggle]');
const mobilePanel = document.querySelector('[data-mobile-menu-panel]');
const mobileLinks = mobilePanel ? mobilePanel.querySelectorAll('a') : [];

const toggleMobileMenu = (open) => {
    if (!mobilePanel) return;
    mobilePanel.classList.toggle('open', open);
    mobileToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
};

mobileToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMobileMenu(!mobilePanel.classList.contains('open'));
});

mobileLinks.forEach((link) => link.addEventListener('click', () => toggleMobileMenu(false)));

document.addEventListener('click', (e) => {
    if (mobilePanel && !mobilePanel.contains(e.target) && !mobileToggle.contains(e.target)) {
        toggleMobileMenu(false);
    }
});

// ── Animated counters ────────────────────────────────
if (!prefersReducedMotion) {
    const animateCount = (el) => {
        const target = parseFloat(el.dataset.countTarget);
        const start = performance.now();
        const dur = 1200;
        const tick = (now) => {
            const p = Math.min((now - start) / dur, 1);
            const e = 1 - Math.pow(1 - p, 3);          // ease-out-cubic
            el.textContent = (target * e).toFixed(1);
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = target.toFixed(1);
        };
        requestAnimationFrame(tick);
    };

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                animateCount(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.65 });
    countItems.forEach((item) => counterObserver.observe(item));
}

// ── Gallery lightbox ─────────────────────────────────
const galleryTriggers = Array.from(document.querySelectorAll('[data-gallery-trigger]'));
const lightbox = document.querySelector('[data-lightbox]');
const lightboxImage = document.querySelector('[data-lightbox-image]');
const lightboxCaption = document.querySelector('[data-lightbox-caption]');
const lightboxClosebtns = document.querySelectorAll('[data-lightbox-close]');
const lightboxPrev = document.querySelector('[data-lightbox-prev]');
const lightboxNext = document.querySelector('[data-lightbox-next]');
const lightboxDots = document.querySelector('[data-lightbox-dots]');

const galleryItems = galleryTriggers.map((t) => ({ src: t.dataset.gallerySrc, alt: t.dataset.galleryAlt }));
let activeIndex = 0;

// Build dots once
galleryItems.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'h-2 w-2 rounded-full transition-all duration-300 bg-white/30';
    dot.setAttribute('aria-label', `Go to image ${i + 1}`);
    dot.addEventListener('click', () => { activeIndex = i; renderLightbox(); });
    lightboxDots?.appendChild(dot);
});

const updateDots = () => {
    lightboxDots?.querySelectorAll('button').forEach((dot, i) => {
        dot.className = i === activeIndex
            ? 'h-2 w-4 rounded-full transition-all duration-300 bg-white'
            : 'h-2 w-2 rounded-full transition-all duration-300 bg-white/30';
    });
};

const renderLightbox = () => {
    const cur = galleryItems[activeIndex];
    if (lightboxImage) { lightboxImage.src = cur.src; lightboxImage.alt = cur.alt; }
    if (lightboxCaption) lightboxCaption.textContent = cur.alt;
    updateDots();
};

const openLightbox = (i) => {
    activeIndex = i;
    renderLightbox();
    lightbox?.classList.add('open');
    lightbox?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
};

const closeLightbox = () => {
    lightbox?.classList.remove('open');
    lightbox?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
};

const goToImage = (delta) => {
    activeIndex = (activeIndex + delta + galleryItems.length) % galleryItems.length;
    renderLightbox();
};

galleryTriggers.forEach((t, i) => t.addEventListener('click', () => openLightbox(i)));
lightboxClosebtns.forEach((btn) => btn.addEventListener('click', closeLightbox));
lightboxPrev?.addEventListener('click', (e) => { e.stopPropagation(); goToImage(-1); });
lightboxNext?.addEventListener('click', (e) => { e.stopPropagation(); goToImage(1); });

// Touch swipe on lightbox
let touchX = 0;
lightbox?.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].screenX; }, { passive: true });
lightbox?.addEventListener('touchend', (e) => {
    const diff = touchX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 48) goToImage(diff > 0 ? 1 : -1);
}, { passive: true });

// Keyboard nav
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
    if (!lightbox?.classList.contains('open')) return;
    if (e.key === 'ArrowLeft') goToImage(-1);
    if (e.key === 'ArrowRight') goToImage(1);
});

// ── Gallery Filtering ────────────────────────────────
const filterBtns = document.querySelectorAll('.filter-btn');
const galleryCards = document.querySelectorAll('.gallery-card');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => {
            b.classList.remove('active', 'bg-forest', 'text-white', 'shadow-soft');
            b.classList.add('bg-white', 'text-ink');
        });
        btn.classList.add('active', 'bg-forest', 'text-white', 'shadow-soft');
        btn.classList.remove('bg-white', 'text-ink');

        const filterValue = btn.getAttribute('data-filter');

        galleryCards.forEach(card => {
            if (filterValue === 'all') {
                card.style.display = '';
            } else {
                const categories = card.getAttribute('data-category');
                if (categories && categories.split(' ').includes(filterValue)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            }
        });
    });
});

// ── Reviews Slider ───────────────────────────────────
const track = document.getElementById('reviews-track');
const slides = Array.from(document.querySelectorAll('.review-slide'));
const nextButton = document.getElementById('slider-next');
const prevButton = document.getElementById('slider-prev');
const dotsNav = document.getElementById('slider-dots');

if (track && slides.length > 0) {
    let currentIndex = 0;

    slides.forEach((_, idx) => {
        const dot = document.createElement('button');
        dot.className = `h-3 w-4 rounded-full transition-all duration-300 ${idx === 0 ? 'bg-forest' : 'bg-forest/30'}`;
        dot.setAttribute('aria-label', `Go to review ${idx + 1}`);
        dot.addEventListener('click', () => goToSlide(idx));
        dotsNav.appendChild(dot);
    });

    const dots = Array.from(dotsNav.children);

    const getVisibleSlides = () => {
        if (window.innerWidth >= 1024) return 3; // lg breakpoint
        if (window.innerWidth >= 768) return 2;  // md breakpoint
        return 1;
    };

    const updateSlider = () => {
        const visible = getVisibleSlides();
        let maxIndex = slides.length - visible;
        if (maxIndex < 0) maxIndex = 0;
        if (currentIndex > maxIndex) currentIndex = maxIndex;

        const slideWidth = slides[0].getBoundingClientRect().width;
        track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;

        dots.forEach((dot, idx) => {
            dot.className = `h-3 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-forest' : 'w-3 bg-forest/30'}`;
            dot.style.display = idx > maxIndex ? 'none' : 'inline-block';
        });
    };

    const goToSlide = (index) => {
        const visible = getVisibleSlides();
        let maxIndex = slides.length - visible;
        if (maxIndex < 0) maxIndex = 0;

        if (index < 0) {
            currentIndex = maxIndex;
        } else if (index > maxIndex) {
            currentIndex = 0;
        } else {
            currentIndex = index;
        }
        updateSlider();
    };

    if (nextButton) nextButton.addEventListener('click', () => goToSlide(currentIndex + 1));
    if (prevButton) prevButton.addEventListener('click', () => goToSlide(currentIndex - 1));

    window.addEventListener('resize', updateSlider, { passive: true });

    let autoScroll = setInterval(() => {
        goToSlide(currentIndex + 1);
    }, 4000);

    const sliderContainer = document.querySelector('.reviews-slider-container');
    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', () => clearInterval(autoScroll));
        sliderContainer.addEventListener('mouseleave', () => {
            autoScroll = setInterval(() => goToSlide(currentIndex + 1), 4000);
        });

        // Swipe logic
        let touchStartX = 0;
        let touchEndX = 0;

        sliderContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            clearInterval(autoScroll);
        }, { passive: true });

        sliderContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
            autoScroll = setInterval(() => goToSlide(currentIndex + 1), 4000);
        }, { passive: true });

        const handleSwipe = () => {
            const threshold = 50; // minimum distance to trigger swipe
            if (touchStartX - touchEndX > threshold) {
                goToSlide(currentIndex + 1); // swiped left
            } else if (touchEndX - touchStartX > threshold) {
                goToSlide(currentIndex - 1); // swiped right
            }
        };
    }

    // Initialize layout (run once after images load)
    setTimeout(updateSlider, 100);
}