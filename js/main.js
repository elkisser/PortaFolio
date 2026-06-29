/* =================================================================
   main.js — interactions: nav, reveal, filters, cursor, form
   ================================================================= */
(function () {
    "use strict";

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const WHATSAPP = "543435086453";

    /* ---------- Header scroll state ---------- */
    function initHeader() {
        const header = document.querySelector(".header");
        if (!header) return;
        let ticking = false;
        const update = () => {
            header.classList.toggle("is-scrolled", window.scrollY > 24);
            ticking = false;
        };
        window.addEventListener("scroll", () => {
            if (!ticking) { requestAnimationFrame(update); ticking = true; }
        }, { passive: true });
        update();
    }

    /* ---------- Mobile menu ---------- */
    function initMenu() {
        const toggle = document.getElementById("menu-toggle");
        const nav = document.querySelector(".nav");
        if (!toggle || !nav) return;

        const backdrop = document.createElement("div");
        backdrop.className = "nav-backdrop";
        document.body.appendChild(backdrop);

        const open = (isOpen) => {
            toggle.setAttribute("aria-expanded", String(isOpen));
            toggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
            nav.classList.toggle("is-open", isOpen);
            backdrop.classList.toggle("is-open", isOpen);
            document.body.classList.toggle("is-locked", isOpen);
        };

        toggle.addEventListener("click", () => {
            open(toggle.getAttribute("aria-expanded") !== "true");
        });
        backdrop.addEventListener("click", () => open(false));
        nav.querySelectorAll(".nav-link").forEach((l) =>
            l.addEventListener("click", () => open(false))
        );
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && nav.classList.contains("is-open")) open(false);
        });
    }

    /* ---------- Smooth scroll for in-page links ---------- */
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach((a) => {
            a.addEventListener("click", (e) => {
                const id = a.getAttribute("href");
                if (id === "#" || id.length < 2) return;
                const target = document.querySelector(id);
                if (!target) return;
                e.preventDefault();
                // A fixed target (e.g. the header for "#top") always reports top:0,
                // so scroll to the actual page top instead.
                const isFixed = getComputedStyle(target).position === "fixed";
                const top = isFixed ? 0 : target.getBoundingClientRect().top + window.scrollY - 70;
                window.scrollTo({ top, behavior: prefersReduced ? "auto" : "smooth" });
            });
        });
    }

    /* ---------- Scrollspy ---------- */
    function initScrollSpy() {
        const links = Array.from(document.querySelectorAll(".nav-link"));
        const map = new Map();
        links.forEach((l) => {
            const sec = document.querySelector(l.getAttribute("href"));
            if (sec) map.set(sec, l);
        });
        if (!map.size) return;

        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    links.forEach((l) => l.classList.remove("is-active"));
                    const link = map.get(entry.target);
                    if (link) link.classList.add("is-active");
                }
            });
        }, { rootMargin: "-45% 0px -50% 0px" });

        map.forEach((_, sec) => io.observe(sec));
    }

    /* ---------- Scroll reveal ---------- */
    function initReveal() {
        const targets = [
            ".section-head", ".project", ".about-portrait", ".about-content",
            ".stack-group", ".gh-stat", ".gh-bottom", ".tl-item", ".contact-inner"
        ];
        const els = document.querySelectorAll(targets.join(","));
        if (prefersReduced || !("IntersectionObserver" in window)) {
            els.forEach((el) => el.classList.add("reveal", "is-in"));
            return;
        }
        els.forEach((el, i) => {
            el.classList.add("reveal");
            el.setAttribute("data-delay", String(i % 3));
        });
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-in");
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
        els.forEach((el) => io.observe(el));
    }

    /* ---------- Project filters ---------- */
    function initFilters() {
        const filters = document.querySelectorAll(".filter");
        const projects = document.querySelectorAll(".project");
        if (!filters.length) return;

        filters.forEach((btn) => {
            btn.addEventListener("click", () => {
                filters.forEach((b) => b.classList.remove("is-active"));
                btn.classList.add("is-active");
                const f = btn.dataset.filter;
                projects.forEach((p) => {
                    const match = f === "all" || (p.dataset.cat || "").includes(f);
                    p.classList.toggle("is-hidden", !match);
                });
            });
        });
    }

    /* ---------- Inline SVG icon system ---------- */
    const ICONS = (() => {
        const s = (paths) =>
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + "</svg>";
        const f = (paths) =>
            '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + paths + "</svg>";
        return {
            server: s('<rect x="2" y="3" width="20" height="8" rx="2"/><rect x="2" y="13" width="20" height="8" rx="2"/><line x1="6" y1="7" x2="6" y2="7"/><line x1="6" y1="17" x2="6" y2="17"/>'),
            layout: s('<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>'),
            database: s('<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>'),
            tools: s('<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>'),
            folder: s('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'),
            star: s('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'),
            users: s('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
            code: s('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>'),
            clock: s('<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>'),
            layers: s('<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>'),
            target: s('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>'),
            external: s('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>'),
            github: f('<path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.7.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"/>'),
            whatsapp: f('<path d="M.5 23.5l1.6-5.9a11.3 11.3 0 1 1 4.2 4.1L.5 23.5zM6.6 20l.4.2a9.4 9.4 0 1 0-3.2-3.1l.2.4-1 3.5 3.6-1zm11.2-5.3c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.1-.3.2-.5 0a7.7 7.7 0 0 1-2.3-1.4 8.5 8.5 0 0 1-1.6-2c-.2-.3 0-.4.1-.6l.4-.4.2-.4v-.4c0-.1-.5-1.3-.7-1.8-.2-.4-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3c-.2.2-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.4z"/>'),
            arrow: s('<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>')
        };
    })();

    function initIcons() {
        document.querySelectorAll("[data-icon]").forEach((el) => {
            const name = el.getAttribute("data-icon");
            if (ICONS[name]) el.innerHTML = ICONS[name];
        });

        // Project links: prepend a contextual icon
        document.querySelectorAll(".link-arrow").forEach((a) => {
            if (a.querySelector(".link-ico")) return;
            const key = a.querySelector("[data-i18n]");
            const type = key ? key.getAttribute("data-i18n") : "";
            const ico = document.createElement("span");
            ico.className = "ico link-ico";
            ico.innerHTML = type === "link_code" ? ICONS.github : ICONS.external;
            a.insertBefore(ico, a.firstChild);
        });
    }

    /* ---------- Scroll progress bar ---------- */
    function initScrollProgress() {
        const bar = document.querySelector(".scroll-progress span");
        if (!bar) return;
        let ticking = false;
        const update = () => {
            const h = document.documentElement;
            const max = h.scrollHeight - h.clientHeight;
            const p = max > 0 ? (h.scrollTop || window.scrollY) / max : 0;
            bar.style.transform = `scaleX(${Math.min(p, 1)})`;
            ticking = false;
        };
        window.addEventListener("scroll", () => {
            if (!ticking) { requestAnimationFrame(update); ticking = true; }
        }, { passive: true });
        update();
    }

    /* ---------- Role typing effect ---------- */
    function initTyping() {
        const el = document.getElementById("hero-role");
        if (!el || prefersReduced) return;

        const roles = {
            es: ["Full Stack Developer", "Diseñador de producto", "Frontend Engineer"],
            en: ["Full Stack Developer", "Product Designer", "Frontend Engineer"]
        };
        let lang = (window.i18n && window.i18n.current) || "es";
        let list = roles[lang];
        let ri = 0, ci = 0, deleting = false, timer = null;

        function tick() {
            const word = list[ri];
            ci += deleting ? -1 : 1;
            el.textContent = word.slice(0, ci);
            let delay = deleting ? 45 : 90;
            if (!deleting && ci === word.length) { delay = 1600; deleting = true; }
            else if (deleting && ci === 0) { deleting = false; ri = (ri + 1) % list.length; delay = 350; }
            timer = setTimeout(tick, delay);
        }
        tick();

        document.addEventListener("langchange", (e) => {
            lang = e.detail.lang;
            list = roles[lang];
            ri = 0; ci = 0; deleting = false;
            clearTimeout(timer);
            tick();
        });
    }

    /* ---------- CV download ---------- */
    function initCv() {
        const cv = document.getElementById("cv-download");
        if (!cv) return;
        cv.addEventListener("click", () => {
            const href = cv.dataset.href || cv.dataset.hrefEs;
            const a = document.createElement("a");
            a.href = href;
            a.download = "CV Sebastian Kisser.pdf";
            document.body.appendChild(a);
            a.click();
            a.remove();
        });
    }

    /* ---------- Contact form -> WhatsApp ---------- */
    function initForm() {
        const form = document.getElementById("contact-form");
        if (!form) return;
        const err = document.getElementById("form-error");

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = form.elements.name.value.trim();
            const msg = form.elements.message.value.trim();
            if (!name || !msg) {
                if (err) err.hidden = false;
                return;
            }
            if (err) err.hidden = true;
            const text = `Hola Sebastián, soy ${name}.\n\n${msg}`;
            const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
            window.open(url, "_blank", "noopener");
        });
    }

    /* ---------- Custom cursor (pointer devices) ---------- */
    function initCursor() {
        const cursor = document.querySelector(".cursor");
        const dot = document.querySelector(".cursor-dot");
        if (!cursor || prefersReduced) return;
        if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

        // Hide the native cursor (only now that we know the custom one runs)
        document.documentElement.classList.add("has-custom-cursor");

        let x = 0, y = 0, cx = 0, cy = 0, raf = null;
        const loop = () => {
            cx += (x - cx) * 0.2;
            cy += (y - cy) * 0.2;
            cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
            raf = requestAnimationFrame(loop);
        };

        window.addEventListener("mousemove", (e) => {
            x = e.clientX; y = e.clientY;
            // dot tracks instantly for precision
            if (dot) {
                dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
                dot.classList.add("is-visible");
            }
            cursor.classList.add("is-visible");
            if (!raf) loop();
        });
        document.addEventListener("mouseleave", () => {
            cursor.classList.remove("is-visible");
            if (dot) dot.classList.remove("is-visible");
        });

        const hoverSel = "a, button, .project, .filter, input, textarea, .gh-stat";
        document.querySelectorAll(hoverSel).forEach((el) => {
            el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
            el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
        });
    }

    /* ---------- Language switcher wiring ---------- */
    function initLang() {
        document.querySelectorAll(".lang-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                if (window.i18n) window.i18n.setLang(btn.dataset.lang);
            });
        });
    }

    /* ---------- Footer year ---------- */
    function initYear() {
        const y = document.getElementById("year");
        if (y) y.textContent = new Date().getFullYear();
    }

    function init() {
        initHeader();
        initIcons();
        initScrollProgress();
        initMenu();
        initSmoothScroll();
        initScrollSpy();
        initReveal();
        initFilters();
        initTyping();
        initCv();
        initForm();
        initCursor();
        initLang();
        initYear();
    }

    if (document.readyState !== "loading") init();
    else document.addEventListener("DOMContentLoaded", init);
})();
