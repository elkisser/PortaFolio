/* =================================================================
   i18n — bilingual content (ES / EN) via data-i18n keys
   ================================================================= */
(function () {
    "use strict";

    const STRINGS = {
        es: {
            nav_work: "Proyectos", nav_about: "Sobre mí", nav_stack: "Stack",
            nav_github: "GitHub", nav_exp: "Experiencia", nav_contact: "Contacto",

            hero_status: "Disponible para proyectos",
            hero_l1: "Desarrollo", hero_l2: "productos digitales", hero_l3: "con criterio.",
            hero_lead: "Soy Sebastián, desarrollador Full Stack y diseñador. Construyo software web rápido, accesible y bien diseñado — del backend en Symfony a interfaces en React.",
            hero_role: "Full Stack Developer", hero_loc: "Argentina",
            hero_cta_work: "Ver proyectos", hero_cta_cv: "Descargar CV",

            work_title: "Proyectos seleccionados",
            work_desc: "Una selección de productos que diseñé y construí. Cada uno con demo y código.",
            filter_all: "Todos",
            link_demo: "Demo", link_code: "Código",

            p_chromora_title: "Chromora",
            p_chromora_desc: "Generador inteligente de paletas de color. Combina generación manual, 6 tipos de armonías y asistencia por IA desde lenguaje natural, con reescalado armónico en espacio LCH.",
            p_prode_desc: "Plataforma de predicciones deportivas en tiempo real. Ligas privadas, datos de partidos reales vía APIs, autenticación y puntuación automática. Producto full-stack desplegado.",
            p_cookie_desc: "E-commerce artesanal con catálogo filtrable, carrito animado y panel de administración seguro. Conversión automática a WebP e integración directa con Instagram y WhatsApp.",
            p_yonofui_desc: "Juego de misterio y deducción donde sos detective. Analizás pistas, interrogás sospechosos y resolvés casos generados dinámicamente con IA y distintos niveles de dificultad.",
            p_lumina_desc: "Eliminación de fondos con IA 100% local y privada. Usa TensorFlow.js con aceleración WebGL para procesar en tiempo real sin enviar datos a ningún servidor.",
            p_somos_desc: "Sitio portfolio para una agencia de desarrollo digital. Diseño elegante con funcionalidad avanzada, presentando servicios y trabajos de forma interactiva.",

            about_title: "Sobre mí",
            about_lead: "Desarrollador Full Stack y diseñador, de Argentina. Me muevo cómodo entre el backend en Symfony y PHP y el frontend en React, Next.js y Astro.",
            about_text: "Vengo del diseño gráfico, así que cuido la estética tanto como la arquitectura del código. Me interesa construir productos completos: que funcionen rápido, sean accesibles y se sientan bien al usarlos. Hoy trabajo en el sector público desarrollando aplicaciones web internas, y en paralelo construyo proyectos propios y para clientes.",
            fact_exp_label: "Experiencia", fact_exp: "años",
            fact_proj_label: "Proyectos", fact_proj: "desplegados",
            fact_focus_label: "Enfoque", fact_focus: "Full Stack & UX",

            stack_title: "Stack & herramientas",
            stack_desc: "Las tecnologías con las que trabajo a diario, agrupadas por área.",
            stack_backend: "Backend", stack_frontend: "Frontend",
            stack_data: "Datos & Infra", stack_tools: "Herramientas & Diseño",

            github_title: "Actividad en GitHub",
            github_desc: "Datos en vivo desde mi perfil público de GitHub.",
            gh_repos: "Repositorios", gh_stars: "Stars",
            gh_followers: "Seguidores", gh_langs: "Lenguajes",
            gh_visit: "Ver perfil completo",

            exp_title: "Experiencia",
            exp1_date: "2024 — Actualidad",
            exp1_title: "Ministerio de Infraestructura, Servicios Públicos y Hábitat",
            exp1_desc: "Desarrollo de aplicaciones web con Symfony, Twig y bases de datos relacionales. Backend y frontend, formularios complejos, gestión de entidades y lógica de negocio. Interfaces dinámicas, accesibles y responsivas.",
            exp2_date: "2021 — Actualidad",
            exp2_title: "Full Stack Developer — Freelance",
            exp2_desc: "Proyectos personales y para clientes: apps web, APIs, dashboards y e-commerce.",
            exp3_date: "2016 — Actualidad",
            exp3_title: "Diseñador Gráfico & Editor",
            exp3_desc: "Identidad visual, motion graphics y edición audiovisual para redes sociales.",

            contact_title: "Trabajemos juntos",
            contact_lead: "¿Tenés un proyecto o una posición abierta? Escribime y te respondo por WhatsApp.",
            contact_name: "Tu nombre", contact_msg: "Tu mensaje",
            contact_send: "Enviar por WhatsApp",
            contact_err: "Completá tu nombre y mensaje.",

            footer_built: "Diseñado y desarrollado en Argentina",
            footer_top: "Volver arriba ↑"
        },
        en: {
            nav_work: "Work", nav_about: "About", nav_stack: "Stack",
            nav_github: "GitHub", nav_exp: "Experience", nav_contact: "Contact",

            hero_status: "Available for work",
            hero_l1: "I build", hero_l2: "digital products", hero_l3: "with intent.",
            hero_lead: "I'm Sebastián, a Full Stack developer and designer. I build fast, accessible and well-designed web software — from Symfony backends to React interfaces.",
            hero_role: "Full Stack Developer", hero_loc: "Argentina",
            hero_cta_work: "View work", hero_cta_cv: "Download CV",

            work_title: "Selected work",
            work_desc: "A selection of products I designed and built. Each with a live demo and source.",
            filter_all: "All",
            link_demo: "Demo", link_code: "Source",

            p_chromora_title: "Chromora",
            p_chromora_desc: "Intelligent color palette generator. Combines manual generation, 6 harmony types and AI assistance from natural language, with harmonic rescaling in LCH space.",
            p_prode_desc: "Real-time sports prediction platform. Private leagues, real match data via APIs, authentication and automatic scoring. A deployed full-stack product.",
            p_cookie_desc: "Artisan e-commerce with a filterable catalog, animated cart and a secure admin panel. Automatic WebP conversion and direct Instagram and WhatsApp integration.",
            p_yonofui_desc: "Mystery and deduction game where you play detective. Analyze clues, interrogate suspects and solve cases generated dynamically with AI across difficulty levels.",
            p_lumina_desc: "100% local and private AI background removal. Uses TensorFlow.js with WebGL acceleration to process in real time without sending data to any server.",
            p_somos_desc: "Portfolio site for a digital development agency. Elegant design with advanced functionality, presenting services and work interactively.",

            about_title: "About me",
            about_lead: "Full Stack developer and designer, from Argentina. I move comfortably between Symfony/PHP on the backend and React, Next.js and Astro on the frontend.",
            about_text: "I come from graphic design, so I care about aesthetics as much as code architecture. I like building complete products: fast, accessible and pleasant to use. Today I work in the public sector building internal web apps, while building my own and client projects in parallel.",
            fact_exp_label: "Experience", fact_exp: "years",
            fact_proj_label: "Projects", fact_proj: "shipped",
            fact_focus_label: "Focus", fact_focus: "Full Stack & UX",

            stack_title: "Stack & tools",
            stack_desc: "The technologies I work with daily, grouped by area.",
            stack_backend: "Backend", stack_frontend: "Frontend",
            stack_data: "Data & Infra", stack_tools: "Tools & Design",

            github_title: "GitHub activity",
            github_desc: "Live data from my public GitHub profile.",
            gh_repos: "Repositories", gh_stars: "Stars",
            gh_followers: "Followers", gh_langs: "Languages",
            gh_visit: "View full profile",

            exp_title: "Experience",
            exp1_date: "2024 — Present",
            exp1_title: "Ministry of Infrastructure, Public Services and Habitat",
            exp1_desc: "Web application development with Symfony, Twig and relational databases. Backend and frontend, complex forms, entity management and business logic. Dynamic, accessible and responsive interfaces.",
            exp2_date: "2021 — Present",
            exp2_title: "Full Stack Developer — Freelance",
            exp2_desc: "Personal and client projects: web apps, APIs, dashboards and e-commerce.",
            exp3_date: "2016 — Present",
            exp3_title: "Graphic Designer & Editor",
            exp3_desc: "Visual identity, motion graphics and video editing for social media.",

            contact_title: "Let's work together",
            contact_lead: "Got a project or an open role? Drop me a line and I'll reply on WhatsApp.",
            contact_name: "Your name", contact_msg: "Your message",
            contact_send: "Send via WhatsApp",
            contact_err: "Please fill in your name and message.",

            footer_built: "Designed and developed in Argentina",
            footer_top: "Back to top ↑"
        }
    };

    function detectLang() {
        const stored = localStorage.getItem("lang");
        if (stored === "es" || stored === "en") return stored;
        const nav = (navigator.language || "es").toLowerCase();
        return nav.startsWith("en") ? "en" : "es";
    }

    function apply(lang) {
        const dict = STRINGS[lang];
        if (!dict) return;

        document.documentElement.lang = lang;

        document.querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.getAttribute("data-i18n");
            if (dict[key] != null) el.textContent = dict[key];
        });

        // Active state on switcher
        document.querySelectorAll(".lang-btn").forEach((btn) => {
            const active = btn.dataset.lang === lang;
            btn.classList.toggle("is-active", active);
            btn.setAttribute("aria-pressed", String(active));
        });

        // CV link by language
        const cv = document.getElementById("cv-download");
        if (cv) cv.dataset.href = lang === "en" ? cv.dataset.hrefEn : cv.dataset.hrefEs;

        document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
    }

    function setLang(lang) {
        localStorage.setItem("lang", lang);
        apply(lang);
    }

    // Public API
    window.i18n = { apply, setLang, detect: detectLang, get current() { return detectLang(); } };

    // Init ASAP
    apply(detectLang());
    document.addEventListener("DOMContentLoaded", () => apply(detectLang()));
})();
