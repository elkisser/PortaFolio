// Traducciones completas ES/EN para el portfolio
const translations = {
    es: {
        nav: ["Inicio", "Habilidades", "Proyectos", "Experiencia", "Contacto"],
        menuAria: "Abrir menú",
        home_hello: "Hola, soy",
        home_and: "y soy",
        home_cv: "Descargar CV",
        home_contact: "Contactar",
        home_desc: "Soy desarrollador Full Stack y diseñador gráfico. Me encanta construir soluciones limpias, con UX cuidada y estética moderna.",
        about_title: "Sobre mí",
        about_lead: "¡Hola! 👋 Soy Sebastián, un apasionado programador proveniente de Argentina 🇦🇷. Tengo 23 años y me especializo en desarrollo web, diseño y edición multimedia.",
        about_subtitle: "Habilidades Técnicas",
        skills: {
            Backend: "Backend",
            Frontend: "Frontend",
            Database: "Base de Datos",
            Tools: "Herramientas",
            Other: "Otras Habilidades",
            PHP: "PHP",
            Symfony: "Symfony",
            Doctrine: "Doctrine ORM",
            "Doctrine ORM": "Doctrine ORM",
            Java: "Java",
            "Node.js": "Node.js",
            Twig: "Twig",
            Bootstrap: "Bootstrap",
            HTML5: "HTML5",
            CSS3: "CSS3",
            JavaScript: "JavaScript",
            TypeScript: "TypeScript",
            React: "React",
            "Next.js": "Next.js",
            "Tailwind CSS": "Tailwind CSS",
            Astro: "Astro",
            Vite: "Vite",
            "React Router": "React Router",
            "Framer Motion": "Framer Motion",
            MySQL: "MySQL",
            PostgreSQL: "PostgreSQL",
            Firebase: "Firebase",
            Git: "Git",
            GitHub: "GitHub",
            GitLab: "GitLab",
            Composer: "Composer",
            Xdebug: "Xdebug",
            Postman: "Postman",
            Netlify: "Netlify",
            Validations: "Validaciones personalizadas",
            Auth: "Autenticación por sesión",
            Pagination: "Paginación",
            Upload: "Carga de archivos",
            TwigMacros: "Macros Twig",
            Views: "Personalización de vistas",
            Refactor: "Refactorización de entidades",
            REST: "Controladores REST",
            MVC: "Arquitectura MVC",
            "TensorFlow.js": "TensorFlow.js",
            WebGL: "WebGL",
            "Anime.js": "Anime.js",
            "Chroma.js": "Chroma.js",
            "Context API": "Context API"
        },
        skillLevels: {
            Basic: "Básico",
            Intermediate: "Intermedio",
            Advanced: "Avanzado"
        },
        projects_title: "Proyectos destacados",
        projects_lead: "Tarjetas con demo, tecnologías y acciones. Haz click en 'Ver' para más.",
        project1_title: "Chromora - Generador Inteligente de Paletas",
        project1_desc: "Aplicación moderna para crear paletas de colores hermosas y útiles. Combina generación manual con 6 tipos de paletas armónicas y generación asistida por IA a partir de prompts en lenguaje natural. Incluye exportación, historial persistente y reescalado armónico LCH.",
        project1_see: "Ver proyecto",
        project2_title: "SoMoS - Portfolio de Agencia Digital",
        project2_desc: "Sitio web portfolio moderno para agencia de desarrollo digital que se especializa en crear experiencias digitales únicas. Combina diseño elegante con funcionalidad avanzada, presentando servicios y trabajos de manera atractiva e interactiva.",
        project2_see: "Ver proyecto",
        project3_title: "LuminaEdit",
        project3_desc: "Aplicación web avanzada de eliminación de fondos con IA 100% local y privada. Combina TensorFlow.js con aceleración WebGL para procesamiento en tiempo real sin comprometer la privacidad del usuario.",
        project3_see: "Ver proyecto",
        project4_title: "TheWordIsBeautiful",
        project4_desc: "Experiencia web inmersiva e interactiva que te lleva en un viaje épico a través del sistema solar. Explora cada planeta con animaciones fluidas, información detallada y efectos visuales espectaculares.",
        project4_see: "Ver proyecto",
        project5_title: "The Cookie Box – Sitio de E-Commerce Artesanal",
        project5_desc: "Experiencia web para The Cookie Box (Santa Fe, Argentina) con catálogo filtrable, carrito animado y panel de administración seguro. Incluye conversión automática de imágenes a WebP, animaciones suaves con Framer Motion y conexión directa a Instagram y WhatsApp.",
        project5_see: "Ver proyecto",
        project6_title: "Yo No Fui - Juego de Misterio",
        project6_desc:
            "Juego web inmersivo de misterio y deducción donde te convertís en detective. Analizá pistas, interrogá sospechosos y resolvé casos únicos generados dinámicamente con distintos niveles de dificultad.",
        project6_see: "Ver proyecto",
        badges: {
            chromora_ai: "🎨 IA + Manual",
            chromora_lch: "🌈 Paletas LCH",
            somos_services: "⚡ Astro 5",
            somos_entrepreneurs: "🎨 Agencia Digital",
            lumina_ai: "🤖 IA Local",
            lumina_private: "🔒 100% Privado",
            theword_solar: "🌌 Sistema Solar",
            theword_interactive: "🚀 Interactivo",
            cookiebox_ecommerce: "🛒 E-Commerce React",
            cookiebox_firebase: "🍪 Firebase + Animaciones",
            yonofui_detective: "🕵️‍♂️ Juego de Misterio",
yonofui_ai: "🤖 IA + Deducción",
        },
        experience_title: "Experiencia",
        experience_lead: "Linea de tiempo de mi experiencia laboral.",
        exp1_date: "2024 — Actualidad",
        exp1_title: "Ministerio de Infraestructura Servicios Públicos y Habitat",
        exp1_desc: "Desarrollo de aplicaciones web con Symfony, Twig y bases de datos relacionales. Experiencia en backend y frontend, formularios complejos, gestión de entidades y lógicas de negocio. Manejo de Bootstrap y JavaScript para interfaces dinámicas, accesibles y responsivas.",
        exp2_date: "2021 — Actualidad",
        exp2_title: "Full Stack Developer",
        exp2_desc: "Proyectos personales y freelance (apps web, APIs, dashboards).",
        exp3_date: "2016 — Actualidad",
        exp3_title: "Diseñador Gráfico & Editor",
        exp3_desc: "Identidad visual, motion graphics y edición para redes sociales.",
        contact_title: "Contacto",
        contact_lead: "Dejanos un mensaje y te respondo por WhatsApp.",
        contact_name: "Tu nombre",
        contact_msg: "Tu mensaje...",
        contact_btn: "Enviar por WhatsApp",
        contact_note: "Al enviar se abrirá WhatsApp con tu mensaje compilado. Número destino: ",
        footer: "Hecho con ❤️"
    },
    en: {
        nav: ["Home", "Skills", "Projects", "Experience", "Contact"],
        menuAria: "Open menu",
        home_hello: "Hi, I'm",
        home_and: "and I'm",
        home_cv: "Download CV",
        home_contact: "Contact",
        home_desc: "I'm a Full Stack developer and graphic designer. I love building clean solutions with a careful UX and modern aesthetics.",
        about_title: "About me",
        about_lead: "Hi! 👋 I'm Sebastián, a passionate programmer from Argentina 🇦🇷. I'm 23 years old and specialize in web development, design, and multimedia editing.",
        about_subtitle: "Technical Skills",
        skills: {
            Backend: "Backend",
            Frontend: "Frontend",
            Database: "Database",
            Tools: "Tools",
            Other: "Other Skills",
            PHP: "PHP",
            Symfony: "Symfony",
            Doctrine: "Doctrine ORM",
            "Doctrine ORM": "Doctrine ORM",
            Java: "Java",
            "Node.js": "Node.js",
            Twig: "Twig",
            Bootstrap: "Bootstrap",
            HTML5: "HTML5",
            CSS3: "CSS3",
            JavaScript: "JavaScript",
            TypeScript: "TypeScript",
            React: "React",
            "Next.js": "Next.js",
            "Tailwind CSS": "Tailwind CSS",
            Astro: "Astro",
            Vite: "Vite",
            "React Router": "React Router",
            "Framer Motion": "Framer Motion",
            MySQL: "MySQL",
            PostgreSQL: "PostgreSQL",
            Firebase: "Firebase",
            Git: "Git",
            GitHub: "GitHub",
            GitLab: "GitLab",
            Composer: "Composer",
            Xdebug: "Xdebug",
            Postman: "Postman",
            Netlify: "Netlify",
            Validations: "Custom validations",
            Auth: "Session authentication",
            Pagination: "Pagination",
            Upload: "File upload",
            TwigMacros: "Twig Macros",
            Views: "View customization",
            Refactor: "Entity refactoring",
            REST: "REST Controllers",
            MVC: "MVC Architecture",
            "TensorFlow.js": "TensorFlow.js",
            WebGL: "WebGL",
            "Anime.js": "Anime.js",
            "Chroma.js": "Chroma.js",
            "Context API": "Context API"
        },
        skillLevels: {
            Basic: "Basic",
            Intermediate: "Intermediate",
            Advanced: "Advanced"
        },
        projects_title: "Featured Projects",
        projects_lead: "Cards with demo, technologies and actions. Click 'See' for more.",
        project1_title: "Chromora - Intelligent Color Palette Generator",
        project1_desc: "Modern application for creating beautiful and useful color palettes. Combines manual generation with 6 types of harmonic palettes and AI-assisted generation from natural language prompts. Includes export, persistent history and harmonic LCH rescaling.",
        project1_see: "See project",
        project2_title: "SoMoS - Digital Agency Portfolio",
        project2_desc: "Modern portfolio website for a digital development agency specializing in creating unique digital experiences. Combines elegant design with advanced functionality, showcasing services and work in an attractive and interactive way.",
        project2_see: "See project",
        project3_title: "LuminaEdit",
        project3_desc: "Advanced web application for background removal with 100% local and private AI. Combines TensorFlow.js with WebGL acceleration for real-time processing without compromising user privacy.",
        project3_see: "See project",
        project4_title: "TheWordIsBeautiful",
        project4_desc: "Immersive and interactive web experience that takes you on an epic journey through the solar system. Explore each planet with smooth animations, detailed information and spectacular visual effects.",
        project4_see: "See project",
        project5_title: "The Cookie Box – Artisan E-Commerce Website",
        project5_desc: "Web experience for The Cookie Box (Santa Fe, Argentina) with a filterable catalog, animated cart and a secure admin panel. Includes automatic WebP image conversion, smooth animations with Framer Motion, and direct integration with Instagram and WhatsApp.",
        project5_see: "See project",
        project6_title: "Yo No Fui - Mystery Game",
        project6_desc:
            "Immersive mystery and deduction web game where you become a detective. Analyze clues, interrogate suspects and solve dynamically generated cases with different difficulty levels.",
        project6_see: "See project",
        badges: {
            chromora_ai: "🎨 AI + Manual",
            chromora_lch: "🌈 LCH Palettes",
            somos_services: "⚡ Astro 5",
            somos_entrepreneurs: "🎨 Digital Agency",
            lumina_ai: "🤖 Local AI",
            lumina_private: "🔒 100% Private",
            theword_solar: "🌌 Solar System",
            theword_interactive: "🚀 Interactive",
            cookiebox_ecommerce: "🛒 React E-Commerce",
            cookiebox_firebase: "🍪 Firebase + Animations",
            yonofui_detective: "🕵️‍♂️ Mystery Game",
    yonofui_ai: "🤖 AI + Deduction",
        },
        experience_title: "Experience",
        experience_lead: "Timeline of My Work Experience.",
        exp1_date: "2024 — Present",
        exp1_title: "Ministry of Infrastructure, Public Services and Habitat",
        exp1_desc: "Development of web applications with Symfony, Twig and relational databases. Experience in backend and frontend, complex forms, entity management and business logic. Use of Bootstrap and JavaScript for dynamic, accessible and responsive interfaces.",
        exp2_date: "2021 — Present",
        exp2_title: "Full Stack Developer",
        exp2_desc: "Personal and freelance projects (web apps, APIs, dashboards).",
        exp3_date: "2016 — Present",
        exp3_title: "Graphic Designer & Editor",
        exp3_desc: "Visual identity, motion graphics and editing for social media.",
        contact_title: "Contact",
        contact_lead: "Leave me a message and I'll reply via WhatsApp.",
        contact_name: "Your name",
        contact_msg: "Your message...",
        contact_btn: "Send via WhatsApp",
        contact_note: "When you send, WhatsApp will open with your compiled message. Destination number: ",
        footer: "Made with ❤️"
    }
};

// Función para obtener el idioma actual
function getLang() {
    // Permite override manual por localStorage
    const stored = localStorage.getItem('lang');
    if (stored) return stored;
    const nav = navigator.language || navigator.userLanguage || 'es';
    return nav.startsWith('en') ? 'en' : 'es';
}

// Función principal de traducción
function translatePortfolio() {
    const lang = getLang();
    const t = translations[lang];
    if (!t) return;
    
    // Nav
    document.querySelectorAll('#nav-list .nav-link').forEach((el, i) => { el.textContent = t.nav[i]; });
    document.getElementById('menu-toggle').setAttribute('aria-label', t.menuAria);
    
    // Home
    document.querySelector('.home_sub').textContent = t.home_hello;
    document.querySelector('.home_role .home_sub').textContent = t.home_and;
    document.querySelector('.btn.primary.download .btn-text').textContent = t.home_cv;
    document.querySelector('.btn.ghost .btn-text').textContent = t.home_contact;
    document.querySelector('.home-desc').textContent = t.home_desc;
    
    // About
    document.querySelector('#habilidades .section-title').textContent = t.about_title;
    document.querySelector('#habilidades .lead').textContent = t.about_lead;
    document.querySelector('#habilidades .section-subtitle').textContent = t.about_subtitle;
    
    // Skills titles
    const cats = document.querySelectorAll('.skills-category-title');
    if (cats.length >= 5) {
        cats[0].textContent = t.skills.Backend;
        cats[1].textContent = t.skills.Frontend;
        cats[2].textContent = t.skills.Database;
        cats[3].textContent = t.skills.Tools;
        cats[4].textContent = t.skills.Other;
    }
    
    // Skills names (robusto: usa data-key si existe, si no, fallback al texto)
    document.querySelectorAll('.skill-item .skill-name').forEach(el => {
        const key = el.dataset.key || el.textContent.trim();
        if (t.skills[key]) el.textContent = t.skills[key];
    });
    
    // Skill levels
    document.querySelectorAll('.skill-level').forEach(el => {
        const level = el.dataset.level;
        if (t.skillLevels[level]) el.textContent = t.skillLevels[level];
    });
    
    // Projects
    document.querySelector('#proyectos .section-title').textContent = t.projects_title;
    document.querySelector('#proyectos .muted').textContent = t.projects_lead;
    const projectCards = document.querySelectorAll('.project-card');
    if (projectCards.length >= 1) {
        projectCards[0].querySelector('h3').textContent = t.project1_title;
        projectCards[0].querySelector('p').textContent = t.project1_desc;
        projectCards[0].querySelector('.btn-view-text').textContent = t.project1_see;
    }
    if (projectCards.length >= 2) {
        projectCards[1].querySelector('h3').textContent = t.project2_title;
        projectCards[1].querySelector('p').textContent = t.project2_desc;
        projectCards[1].querySelector('.btn-view-text').textContent = t.project2_see;
    }
    if (projectCards.length >= 3) {
        projectCards[2].querySelector('h3').textContent = t.project3_title;
        projectCards[2].querySelector('p').textContent = t.project3_desc;
        projectCards[2].querySelector('.btn-view-text').textContent = t.project3_see;
    }
    if (projectCards.length >= 4) {
        projectCards[3].querySelector('h3').textContent = t.project4_title;
        projectCards[3].querySelector('p').textContent = t.project4_desc;
        projectCards[3].querySelector('.btn-view-text').textContent = t.project4_see;
    }
    if (projectCards.length >= 5) {
        projectCards[4].querySelector('h3').textContent = t.project5_title;
        projectCards[4].querySelector('p').textContent = t.project5_desc;
        projectCards[4].querySelector('.btn-view-text').textContent = t.project5_see;
    }
    
    // Update project badges
    const chromoraBadge1 = document.querySelector('.chromora-badge-1');
    const chromoraBadge2 = document.querySelector('.chromora-badge-2');
    const somosBadge1 = document.querySelector('.somos-badge-1');
    const somosBadge2 = document.querySelector('.somos-badge-2');
    const luminaBadge1 = document.querySelector('.lumina-badge-1');
    const luminaBadge2 = document.querySelector('.lumina-badge-2');
    const thewordBadge1 = document.querySelector('.theword-badge-1');
    const thewordBadge2 = document.querySelector('.theword-badge-2');
    const cookieboxBadge1 = document.querySelector('.cookiebox-badge-1');
    const cookieboxBadge2 = document.querySelector('.cookiebox-badge-2');
    
    // Chromora badges
    if (chromoraBadge1) chromoraBadge1.textContent = t.badges.chromora_ai;
    if (chromoraBadge2) chromoraBadge2.textContent = t.badges.chromora_lch;
    
    // SoMoS badges
    if (somosBadge1) somosBadge1.textContent = t.badges.somos_services;
    if (somosBadge2) somosBadge2.textContent = t.badges.somos_entrepreneurs;
    
    // LuminaEdit badges
    if (luminaBadge1) luminaBadge1.textContent = t.badges.lumina_ai;
    if (luminaBadge2) luminaBadge2.textContent = t.badges.lumina_private;
    
    // TheWordIsBeautiful badges
    if (thewordBadge1) thewordBadge1.textContent = t.badges.theword_solar;
    if (thewordBadge2) thewordBadge2.textContent = t.badges.theword_interactive;

    // The Cookie Box badges
    if (cookieboxBadge1) cookieboxBadge1.textContent = t.badges.cookiebox_ecommerce;
    if (cookieboxBadge2) cookieboxBadge2.textContent = t.badges.cookiebox_firebase;
    
    // Experiencia
    document.querySelector('#experiencia .section-title').textContent = t.experience_title;
    document.querySelector('#experiencia .muted').textContent = t.experience_lead;
    const exp = document.querySelectorAll('.timeline-item');
    if (exp.length >= 3) {
        exp[0].querySelector('h3').textContent = t.exp1_date;
        exp[0].querySelector('strong').textContent = t.exp1_title;
        exp[0].querySelector('p').childNodes[2].textContent = t.exp1_desc;
        exp[1].querySelector('h3').textContent = t.exp2_date;
        exp[1].querySelector('strong').textContent = t.exp2_title;
        exp[1].querySelector('p').childNodes[2].textContent = t.exp2_desc;
        exp[2].querySelector('h3').textContent = t.exp3_date;
        exp[2].querySelector('strong').textContent = t.exp3_title;
        exp[2].querySelector('p').childNodes[2].textContent = t.exp3_desc;
    }
    
    // Contacto
    document.querySelector('#contacto .section-title').textContent = t.contact_title;
    document.querySelector('#contacto .lead').textContent = t.contact_lead;
    document.querySelector('label[for="nombreContacto"]').textContent = t.contact_name;
    document.querySelector('label[for="mensajeContacto"]').textContent = t.contact_msg;
    document.querySelector('#contacto .btn.primary .btn-text').textContent = t.contact_btn;
    document.querySelector('#contacto .muted.small').innerHTML = t.contact_note + '<strong>+54 343 508 6453</strong>';
    
    // Footer
    document.querySelector('.site-footer p').innerHTML = `© <span id="year"></span> Sebastián Kisser — ${t.footer}`;
    
    // Actualiza selector visual
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.style.opacity = btn.dataset.lang === lang ? '1' : '.6';
        btn.disabled = btn.dataset.lang === lang;
    });
    
    // Actualiza autotype
    if (window.autotypeNombre && window.autotypeRol) {
        window.autotypeNombre.restart(t.home_name || 'Sebastián Kisser');
        window.autotypeRol.restart(t.home_role || 'Full Stack Developer & Graphic Designer');
    }
    
    // Cambia el archivo de CV según idioma
    const cvBtn = document.querySelector('.btn.primary.download');
    if (cvBtn) {
        if (lang === 'en') {
            cvBtn.setAttribute('data-href', './documentos/CV SEBA-DEV-EN.pdf');
        } else {
            cvBtn.setAttribute('data-href', './documentos/CV SEBA-DEV-ES.pdf');
        }
    }
}
