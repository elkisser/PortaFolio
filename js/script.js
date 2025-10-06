/* SoMoS slider autoplay */
function initSomosSlider() {
    const slider = document.querySelector('.somos-slider');
    if (!slider) return;
    const slides = slider.querySelectorAll('.somos-slide');
    let idx = 0;
    function showSlide(i) {
        slides.forEach((s, j) => s.classList.toggle('active', i === j));
    }
    showSlide(idx);
    let autoplay = true;
    let interval = setInterval(nextSlide, 3400);
    function nextSlide() {
        idx = (idx + 1) % slides.length;
        showSlide(idx);
    }
    // Efecto de opacidad según mouse
    slider.addEventListener('mousemove', e => {
        const rect = slider.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const active = slider.querySelector('.somos-slide.active');
        if (active) {
            // Opacidad máxima cerca del mouse, mínima lejos
            const op = 0.45 + 0.55 * Math.pow(1 - Math.abs(x - 0.5) * 2, 2);
            active.style.opacity = op;
        }
        autoplay = false;
        clearInterval(interval);
    });
    slider.addEventListener('mouseleave', () => {
        const active = slider.querySelector('.somos-slide.active');
        if (active) active.style.opacity = 0.45;
        autoplay = true;
        interval = setInterval(nextSlide, 3400);
    });
    slider.addEventListener('mouseenter', () => {
        const active = slider.querySelector('.somos-slide.active');
        if (active) active.style.opacity = 1;
        autoplay = false;
        clearInterval(interval);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // ...existing code...
    initSomosSlider();

});
/* js/script.js
   Portfolio — Sebastián Kisser
   - Autotype sin romper layout
   - Scroll reveal (IntersectionObserver)
   - Timeline animada (entradas desde ambos lados)
   - Formulario -> WhatsApp
   - Menu responsive, scrollspy
   - Smooth scroll navigation
   - Parallax effects
   - Cursor effects
   - Advanced animations
*/

/* CONFIG */
const NOMBRE = "";
const ROL = "";
const WHATSAPP_NUMBER = "543435086453"; // sin '+' ni espacios

/* SMOOTH SCROLL para enlaces internos */
function smoothScrollTo(target) {
    const element = document.querySelector(target);
    if (element) {
        const headerHeight = document.querySelector('.site-header').offsetHeight;
        const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

/* AUTOTYPE (no cambia layout) */
function autotype(elementId, text, speed = 70, delay = 0) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = "";
    let i = 0;
    setTimeout(() => {
        const timer = setInterval(() => {
            if (i <= text.length) {
                el.textContent = text.slice(0, i);
                i++;
            } else {
                clearInterval(timer);
            }
        }, speed);
    }, delay);
}

/* DOMContentLoaded init */
document.addEventListener("DOMContentLoaded", () => {
    // Autotype with stagger
    autotype("nombre", NOMBRE, 70, 200);
    autotype("rol", ROL, 55, 200 + (NOMBRE.length * 70) + 300);

    // Footer year
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Menu toggle con overlay mejorado
    const menuToggle = document.getElementById("menu-toggle");
    const navList = document.getElementById("nav-list");
    
    if (menuToggle && navList) {
        // Función para abrir/cerrar el menú
        const toggleMenu = (isOpen) => {
            menuToggle.setAttribute("aria-expanded", isOpen);
            navList.classList.toggle("open", isOpen);
            document.body.classList.toggle("menu-open", isOpen);
            document.body.style.overflow = isOpen ? "hidden" : "auto";
            
            // Añadir efecto de entrada a los enlaces del menú
            if (isOpen) {
                const navLinks = navList.querySelectorAll('.nav-link');
                navLinks.forEach((link, index) => {
                    link.style.opacity = '0';
                    link.style.transform = 'translateX(20px)';
                    setTimeout(() => {
                        link.style.transition = 'all 0.3s ease ' + (index * 0.1) + 's';
                        link.style.opacity = '1';
                        link.style.transform = 'translateX(0)';
                    }, 50);
                });
            }
        };
        
        menuToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
            toggleMenu(!isExpanded);
        });

        // Cerrar menú al hacer clic en un enlace
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (navList.classList.contains('open')) {
                    toggleMenu(false);
                }
            });
        });
        
        // Cerrar menú al hacer clic en el overlay
        document.addEventListener('click', (e) => {
            if (document.body.classList.contains('menu-open') && 
                !navList.contains(e.target) && 
                e.target !== menuToggle && 
                !menuToggle.contains(e.target)) {
                toggleMenu(false);
            }
        });
        
        // Prevenir cierre al hacer clic dentro del menú
        navList.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Smooth scroll para enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href');
            smoothScrollTo(target);
        });
    });

    // Init scroll reveals
    initScrollReveal();

    // Timeline reveal
    initTimeline();

    // Scrollspy nav active
    initScrollSpy();

    // Whatsapp form
    setupWhatsappForm();
    
    // Parallax effect
    initParallaxEffect();
    
    // Custom cursor effect
    initCustomCursor();
    
    // Download button animation
    initDownloadButtonAnimation();
    
    // Animate skills on load
    animateSkills();
    
    // Initialize portfolio components
    initializePortfolio();
});

// Initialize portfolio components
function initializePortfolio() {
    // Setup autotype and translations
    setupAutotype();
    translatePortfolio();
    
    // Show autotype elements when ready
    const nombreEl = document.getElementById('nombre');
    const rolEl = document.getElementById('rol');
    if (nombreEl) {
        nombreEl.style.opacity = '1';
        nombreEl.style.visibility = 'visible';
    }
    if (rolEl) {
        rolEl.style.opacity = '1';
        rolEl.style.visibility = 'visible';
    }
    
    // Setup video loops
    const luminaEditVideo = document.querySelector('.luminaedit-video');
    const theWordIsBeautifulVideo = document.querySelector('.thewordisbeautiful-video');
    const somosVideo = document.querySelector('.somos-video');
    
    if (luminaEditVideo) setupVideoLoop(luminaEditVideo);
    if (theWordIsBeautifulVideo) setupVideoLoop(theWordIsBeautifulVideo);
    if (somosVideo) setupVideoLoop(somosVideo);
    
    // Setup SoMoS slider fallback
    setupSomosSlider();
    
    // Language selector with animation
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const lang = btn.dataset.lang;
            localStorage.setItem('lang', lang);
            
            // Animation effect
            const switcher = btn.closest('.lang-switcher');
            if (switcher) {
                switcher.classList.add('switch-anim');
                setTimeout(() => switcher.classList.remove('switch-anim'), 400);
            }
            
            // Restart autotype and translations
            setupAutotype();
            translatePortfolio();
            
            // Show autotype elements again
            if (nombreEl) {
                nombreEl.style.opacity = '1';
                nombreEl.style.visibility = 'visible';
            }
            if (rolEl) {
                rolEl.style.opacity = '1';
                rolEl.style.visibility = 'visible';
            }
        });
    });
}

/* ANIMATE SKILLS */
function animateSkills() {
    const skillItems = document.querySelectorAll('.skill-item');
    skillItems.forEach((item, index) => {
        setTimeout(() => {
            item.classList.add('animate-in');
            const progress = item.querySelector('.skill-progress');
            if (progress) {
                progress.style.width = progress.style.getPropertyValue('--skill-level');
            }
        }, index * 100);
    });
}

/* GENERIC SCROLL REVEAL - aplica a clases .reveal-*
   Para elementos con delay se respetan las clases delay-N
*/
function initScrollReveal() {
    const revealSelector = ".reveal-left, .reveal-right, .reveal-up, .reveal-grid, .reveal-timeline";
    const items = document.querySelectorAll(revealSelector);
    if (!items.length) return;

    // Añadir clase inicial para preparar animaciones
    items.forEach(item => {
        if (!item.classList.contains('visible')) {
            item.classList.add('reveal-ready');
        }
    });

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Pequeño retraso para mejorar el efecto visual
                setTimeout(() => {
                    entry.target.classList.add("visible");
                    entry.target.classList.remove("reveal-ready");
                }, 100);
                
                // one-shot: unobserve para mejorar performance
                io.unobserve(entry.target);
            }
        });
    }, { 
        threshold: 0.15,  // Aumentado ligeramente para mejor timing
        rootMargin: "0px 0px -100px 0px"
    });

    items.forEach(i => io.observe(i));
}

/* TIMELINE: agrega la clase visible y controla side animation
   Items expected structure: .timeline-item.left OR .timeline-item.right
*/
function initTimeline() {
    const items = document.querySelectorAll(".timeline-item");
    if (!items.length) return;

    // Añadir clase reveal-ready para preparar animaciones
    items.forEach(item => {
        if (!item.classList.contains('visible')) {
            item.classList.add('reveal-ready');
        }
    });

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Pequeño retraso para mejorar el efecto visual
                setTimeout(() => {
                    entry.target.classList.add("visible");
                    
                    // Animar los elementos internos del timeline
                    const panel = entry.target.querySelector('.timeline-panel');
                    const marker = entry.target.querySelector('.timeline-marker-left') || 
                                  entry.target.querySelector('.timeline-marker-right');
                    
                    if (panel) {
                        panel.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s';
                        panel.style.opacity = '1';
                        panel.style.transform = 'translateY(0)';
                    }
                    
                    if (marker) {
                        marker.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s';
                        marker.style.opacity = '1';
                        marker.style.transform = marker.classList.contains('timeline-marker-left') ? 
                            'translateX(0) scale(1)' : 'translateX(0) scale(1)';
                    }
                    
                    // Remover clase reveal-ready después de la animación
                    entry.target.classList.remove("reveal-ready");
                }, 100);
                
                // one-shot: unobserve para mejorar performance
                io.unobserve(entry.target);
            }
        });
    }, { 
        threshold: 0.18,
        rootMargin: "0px 0px -100px 0px"
    });

    items.forEach(it => {
        io.observe(it);
    });
    
    // Añadir efecto de brillo a la línea de tiempo
    const timelineLine = document.querySelector('.timeline::before');
    if (timelineLine) {
        window.addEventListener('scroll', () => {
            const scrollPosition = window.scrollY;
            const timelineSection = document.querySelector('.experiencia');
            if (timelineSection) {
                const sectionTop = timelineSection.offsetTop;
                const sectionHeight = timelineSection.offsetHeight;
                const scrollPercentage = (scrollPosition - sectionTop + window.innerHeight) / (sectionHeight + window.innerHeight);
                
                if (scrollPercentage > 0 && scrollPercentage < 1) {
                    timelineLine.style.background = `linear-gradient(180deg, var(--accent) ${scrollPercentage * 100}%, rgba(255,255,255,0.05) ${scrollPercentage * 100}%)`;
                }
            }
        });
    }
}

/* SCROLLSPY: resalta enlaces del nav según sección visible */
function initScrollSpy() {
    const sections = Array.from(document.querySelectorAll("main > section"));
    const navLinks = Array.from(document.querySelectorAll(".nav-link"));

    if (!sections.length || !navLinks.length) return;

    function updateActive() {
        let minDist = Infinity;
        let activeId = null;
        const winMid = window.scrollY + window.innerHeight / 2;
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const secMid = rect.top + window.scrollY + rect.height / 2;
            const dist = Math.abs(winMid - secMid);
            if (dist < minDist) {
                minDist = dist;
                activeId = section.id;
            }
        });
        navLinks.forEach(a => {
            a.classList.toggle("active", a.getAttribute("href") === `#${activeId}`);
        });
    }
    window.addEventListener('scroll', updateActive, {passive:true});
    window.addEventListener('resize', updateActive);
    updateActive();
}

/* WHATSAPP FORM */
function setupWhatsappForm() {
    const form = document.getElementById("whatsappForm");
    if (!form) return;

    // Añadir efecto de enfoque a los campos del formulario
    const formInputs = form.querySelectorAll('input, textarea');
    const inputContainers = form.querySelectorAll('.input-container');
    
    // Inicializar estado de los campos
    formInputs.forEach(input => {
        // Eventos de focus/blur para animación de etiquetas
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            if (!input.value.trim()) {
                input.parentElement.classList.remove('focused');
            }
        });
        
        // Verificar si ya tiene valor al cargar
        if (input.value.trim()) {
            input.parentElement.classList.add('focused');
        }
        
        // Añadir validación visual
        input.addEventListener('input', () => {
            if (input.value.trim()) {
                input.classList.add('valid');
            } else {
                input.classList.remove('valid');
            }
        });
    });
    
    // Añadir efecto de elevación al formulario al hacer hover
    const formContainer = form.closest('.contact-form');
    if (formContainer) {
        formContainer.addEventListener('mouseenter', () => {
            formContainer.classList.add('hover');
        });
        
        formContainer.addEventListener('mouseleave', () => {
            formContainer.classList.remove('hover');
        });
    }

    // Manejar envío del formulario
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const nombre = document.getElementById("nombreContacto").value.trim();
        const mensaje = document.getElementById("mensajeContacto").value.trim();

        if (!nombre || !mensaje) {
            // Resaltar campos vacíos
            formInputs.forEach(input => {
                if (!input.value.trim()) {
                    input.parentElement.classList.add('error');
                    setTimeout(() => {
                        input.parentElement.classList.remove('error');
                    }, 1500);
                }
            });
            return;
        }

        // Añadir efecto de envío
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.classList.add('sending');
        submitBtn.disabled = true;
        
        // Simular un pequeño retraso para mostrar la animación
        setTimeout(() => {
            // Construimos mensaje y abrimos WhatsApp
            const msg = `Hola, soy ${nombre} \n\n${mensaje}`;
            const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
            window.open(url, "_blank", "noopener");
            
            // Restaurar el botón después de abrir WhatsApp
            submitBtn.classList.remove('sending');
            submitBtn.disabled = false;
            
            // Opcional: Limpiar el formulario después de enviar
            // form.reset();
            // inputContainers.forEach(container => container.classList.remove('focused'));
        }, 1200);
    });
}

/* PARALLAX EFFECT */
function initParallaxEffect() {
    // Elementos que tendrán efecto parallax al hacer scroll
    const parallaxElements = document.querySelectorAll('.profile-frame, .project-card');
    
    // Evitar transformaciones conflictivas
    parallaxElements.forEach(element => {
        element.setAttribute('data-original-transform', element.style.transform || 'translateY(0)');
    });
    
    // Efecto parallax al hacer scroll
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        parallaxElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const isInView = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (isInView) {
                const speed = element.classList.contains('profile-frame') ? 0.05 : 0.02;
                const yPos = (scrollY - rect.top) * speed;
                const originalTransform = element.getAttribute('data-original-transform') || 'translateY(0)';
                
                // Aplicar transformación sin sobrescribir otras transformaciones
                if (originalTransform.includes('translateY')) {
                    // Reemplazar el translateY existente
                    element.style.transform = originalTransform.replace(/translateY\([^)]*\)/, `translateY(${yPos}px)`);
                } else {
                    // Añadir translateY a la transformación existente
                    element.style.transform = `${originalTransform} translateY(${yPos}px)`;
                }
            }
        });
    });
    
    // Parallax para el fondo en secciones con movimiento del mouse
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth - 0.5;
        const mouseY = e.clientY / window.innerHeight - 0.5;
        
        // Efecto parallax en elementos de fondo
        const sections = document.querySelectorAll('.fullpage-section, .home-section, .skills-section, .projects-section');
        sections.forEach(section => {
            // Buscar elementos de fondo que pueden tener parallax (sin skill-item img)
            const sectionBg = section.querySelector('.profile-glow, .project-media, .profile-frame img');
            if (sectionBg) {
                sectionBg.style.transform = `translate(${mouseX * 15}px, ${mouseY * 15}px)`;
            }
        });
        
        // Efecto sutil en el cursor personalizado
        const cursor = document.querySelector('.custom-cursor');
        if (cursor) {
            const cursorX = e.clientX + (mouseX * 5);
            const cursorY = e.clientY + (mouseY * 5);
            cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
        }
    });
}

/* CUSTOM CURSOR */
function initCustomCursor() {
    const cursor = document.querySelector('.custom-cursor');
    if (!cursor) return;
    
    // Asegurarse de que el cursor-inner existe
    let cursorInner = cursor.querySelector('.cursor-inner');
    if (!cursorInner) {
        cursorInner = document.createElement('div');
        cursorInner.className = 'cursor-inner';
        cursor.appendChild(cursorInner);
    }
    
    // Movimiento instantáneo del cursor
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
        cursor.style.transform = `translate(-50%, -50%)`;
        cursor.style.opacity = '1';
    });
    
    // Efecto hover en elementos interactivos
    const interactiveElements = document.querySelectorAll('a, button, .project-card, .skill-item, .btn, .timeline-panel, .timeline-marker-left, .timeline-marker-right, input, textarea, .contact-form, .btn-view');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hover');
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hover');
        });
    });
    
    // Ocultar cursor cuando sale de la ventana
    document.addEventListener('mouseout', (e) => {
        if (e.relatedTarget === null) {
            cursor.style.opacity = '0';
        }
    });
    
    document.addEventListener('mouseover', () => {
        cursor.style.opacity = '1';
    });
    
    // Inicialmente oculto hasta que se mueva el mouse
    cursor.style.opacity = '0';
    
    // Detectar dispositivos táctiles y ocultar el cursor
    function isTouchDevice() {
        return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
    }
    
    if (isTouchDevice()) {
        cursor.style.display = 'none';
    }
    
    // Añadir efecto de pulsación al hacer clic
    document.addEventListener('mousedown', () => {
        cursor.classList.add('clicking');
    });
    
    document.addEventListener('mouseup', () => {
        cursor.classList.remove('clicking');
    });
}

/* DOWNLOAD BUTTON ANIMATION */
function initDownloadButtonAnimation() {
    const downloadBtn = document.querySelector('.btn.primary.download');
    if (!downloadBtn) return;

    // Efecto de hover
    downloadBtn.addEventListener('mouseenter', () => {
        downloadBtn.classList.add('hover-animation');
    });
    downloadBtn.addEventListener('mouseleave', () => {
        downloadBtn.classList.remove('hover-animation');
    });

    // Animación de descarga al hacer clic
    downloadBtn.addEventListener('click', function(e) {
        if (!downloadBtn.classList.contains('downloading')) {
            e.preventDefault();
            downloadBtn.classList.remove('downloaded', 'flash-success', 'bump', 'text-fadeout', 'text-fadein');
            downloadBtn.classList.add('downloading', 'text-fadeout');
            downloadBtn.setAttribute('disabled', 'true');
            const progressBar = downloadBtn.querySelector('.progress-bar-bottom');
            const btnText = downloadBtn.querySelector('.btn-text');
            if (progressBar) {
                progressBar.style.transition = 'none';
                progressBar.style.width = '0%';
                setTimeout(() => {
                    progressBar.style.transition = 'width 1.2s cubic-bezier(.2,.9,.3,1)';
                    progressBar.style.width = '100%';
                }, 20);
            }
            // Loading spinner visible
            setTimeout(() => {
                downloadBtn.classList.remove('text-fadeout');
                if (btnText) btnText.textContent = 'Descargando...';
                downloadBtn.classList.add('text-fadein');
            }, 200);
            setTimeout(() => {
                downloadBtn.classList.remove('downloading', 'text-fadein');
                downloadBtn.classList.add('downloaded', 'bump', 'text-fadeout');
                if (btnText) btnText.textContent = 'Descargado';
                setTimeout(() => {
                    downloadBtn.classList.remove('text-fadeout');
                    downloadBtn.classList.add('text-fadein');
                }, 200);
                // Descargar el archivo
                setTimeout(() => {
                    const fileUrl = downloadBtn.getAttribute('data-href');
                    if (fileUrl) {
                        const tempLink = document.createElement('a');
                        tempLink.href = fileUrl;
                        tempLink.setAttribute('download', 'CV SEBASTIAN KISSER.pdf');
                        tempLink.setAttribute('target', '_blank');
                        document.body.appendChild(tempLink);
                        tempLink.click();
                        document.body.removeChild(tempLink);
                    }
                    setTimeout(() => {
                        downloadBtn.classList.remove('downloaded', 'bump', 'text-fadein');
                        downloadBtn.removeAttribute('disabled');
                        if (btnText) btnText.textContent = 'Descargar CV';
                        if (progressBar) {
                            progressBar.style.transition = 'none';
                            progressBar.style.width = '0%';
                            progressBar.style.background = 'linear-gradient(120deg, #ffe600 0%, #fdf28b 30%, #4CAF50 60%, #8BC34A 100%)';
                        }
                    }, 1200);
                }, 400);
            }, 1400);
        }
    });
}