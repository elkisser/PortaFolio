/* =================================================================
   carousel.js — lightweight image carousel for project media
   Reads images from `data-shots` (comma-separated paths).
   If empty, renders an elegant branded cover from `data-label`.
   ================================================================= */
(function () {
    "use strict";

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function buildCover(label) {
        const cover = document.createElement("div");
        cover.className = "carousel-cover";
        const span = document.createElement("span");
        span.className = "cover-label";
        span.textContent = label || "";
        cover.appendChild(span);
        return cover;
    }

    function buildSlide(src, label, eager) {
        const slide = document.createElement("div");
        slide.className = "carousel-slide";
        const img = document.createElement("img");
        img.src = src.trim();
        img.alt = label ? `${label} — captura` : "Captura del proyecto";
        img.loading = eager ? "eager" : "lazy";
        img.decoding = "async";
        slide.appendChild(img);
        return slide;
    }

    function initCarousel(root) {
        const label = root.dataset.label || "";
        const shots = (root.dataset.shots || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

        // No screenshots yet → branded cover, nothing else to wire.
        if (shots.length === 0) {
            root.appendChild(buildCover(label));
            return;
        }

        const track = document.createElement("div");
        track.className = "carousel-track";
        shots.forEach((src, i) => track.appendChild(buildSlide(src, label, i === 0)));
        root.appendChild(track);

        if (shots.length === 1) return; // single image, no controls

        // Controls
        const mkBtn = (dir, aria) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = `carousel-btn carousel-btn--${dir}`;
            b.setAttribute("aria-label", aria);
            b.innerHTML =
                '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="' +
                (dir === "prev" ? "15 18 9 12 15 6" : "9 18 15 12 9 6") +
                '"/></svg>';
            return b;
        };
        const prev = mkBtn("prev", "Anterior");
        const next = mkBtn("next", "Siguiente");
        root.appendChild(prev);
        root.appendChild(next);

        const dots = document.createElement("div");
        dots.className = "carousel-dots";
        shots.forEach((_, i) => {
            const d = document.createElement("button");
            d.type = "button";
            d.className = "carousel-dot";
            d.setAttribute("aria-label", `Imagen ${i + 1}`);
            dots.appendChild(d);
        });
        root.appendChild(dots);

        let index = 0;
        let timer = null;

        function go(i) {
            index = (i + shots.length) % shots.length;
            track.style.transform = `translateX(-${index * 100}%)`;
            dots.querySelectorAll(".carousel-dot").forEach((d, di) =>
                d.classList.toggle("is-active", di === index)
            );
        }

        function start() {
            if (prefersReduced) return;
            stop();
            timer = setInterval(() => go(index + 1), 4200);
        }
        function stop() {
            if (timer) { clearInterval(timer); timer = null; }
        }

        prev.addEventListener("click", () => { go(index - 1); start(); });
        next.addEventListener("click", () => { go(index + 1); start(); });
        dots.querySelectorAll(".carousel-dot").forEach((d, di) =>
            d.addEventListener("click", () => { go(di); start(); })
        );

        root.addEventListener("mouseenter", stop);
        root.addEventListener("mouseleave", start);

        // Keyboard when carousel is focused
        root.tabIndex = 0;
        root.addEventListener("keydown", (e) => {
            if (e.key === "ArrowLeft") { go(index - 1); start(); }
            else if (e.key === "ArrowRight") { go(index + 1); start(); }
        });

        // Touch swipe
        let startX = 0;
        root.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; stop(); }, { passive: true });
        root.addEventListener("touchend", (e) => {
            const dx = e.changedTouches[0].clientX - startX;
            if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
            start();
        }, { passive: true });

        // Autoplay only while visible
        if ("IntersectionObserver" in window) {
            const io = new IntersectionObserver((entries) => {
                entries.forEach((en) => (en.isIntersecting ? start() : stop()));
            }, { threshold: 0.3 });
            io.observe(root);
        } else {
            start();
        }

        go(0);
    }

    function init() {
        document.querySelectorAll(".carousel").forEach(initCarousel);
    }

    if (document.readyState !== "loading") init();
    else document.addEventListener("DOMContentLoaded", init);
})();
