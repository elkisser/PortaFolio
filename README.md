# 🚀 Portfolio Personal - Sebastián Kisser

Un portafolio web moderno y responsivo desarrollado con tecnologías web estándar, diseñado para mostrar habilidades técnicas y proyectos profesionales.

## 📋 Descripción del Proyecto

Este portafolio personal presenta una experiencia de usuario inmersiva con animaciones fluidas, efectos visuales avanzados y una interfaz completamente bilingüe (Español/Inglés). Combina un diseño minimalista con funcionalidades interactivas que demuestran las habilidades técnicas del desarrollador.

### ✨ Características Principales

- **🌍 Bilingüe**: Soporte completo para Español e Inglés con cambio dinámico
- **📱 Responsive**: Diseño adaptativo para todos los dispositivos
- **🎨 Animaciones Avanzadas**: Efectos de scroll reveal, parallax y transiciones suaves
- **🎯 Cursor Personalizado**: Cursor interactivo con efectos hover y click
- **⚡ Performance Optimizada**: Carga rápida y animaciones fluidas
- **♿ Accesibilidad**: Navegación por teclado y elementos semánticos
- **📞 Integración WhatsApp**: Formulario de contacto directo a WhatsApp

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5**: Estructura semántica y accesible
- **CSS3**: Estilos avanzados con variables CSS, flexbox y grid
- **JavaScript ES6+**: Funcionalidades interactivas y animaciones
- **Font Awesome**: Iconografía moderna

### Librerías y APIs
- **Google Fonts (Poppins)**: Tipografía moderna y legible
- **Intersection Observer API**: Animaciones basadas en scroll
- **Web APIs**: LocalStorage, Intersection Observer, Geolocation

### Herramientas de Desarrollo
- **Git**: Control de versiones
- **GitHub/GitLab**: Repositorio y deployment
- **Responsive Design**: Mobile-first approach

## 📁 Estructura del Proyecto

```
PortaFolio/
├── index.html              # Página principal
├── styles/
│   └── style.css          # Estilos principales (2000+ líneas)
├── js/
│   ├── script.js          # Lógica principal (700+ líneas)
│   ├── translations.js    # Sistema de traducciones
│   ├── autotype.js        # Efecto de escritura automática
│   └── videos.js          # Manejo de videos y sliders
├── img/
│   ├── favicon.svg        # Icono del sitio
│   ├── foto-perfil.png    # Foto personal
│   ├── LuminaEdit/        # Assets del proyecto LuminaEdit
│   ├── SoMoS/             # Assets del proyecto SoMoS
│   └── TheWorldIsBeautiful/ # Assets del proyecto TheWorldIsBeautiful
└── documentos/
    ├── CV SEBA-DEV-ES.pdf # Currículum en español
    └── CV SEBA-DEV-EN.pdf # Currículum en inglés
```

## 🎯 Funcionalidades Implementadas

### 1. **Sistema de Navegación**
- Menú hamburguesa responsive
- Scroll spy automático
- Smooth scroll entre secciones
- Overlay de navegación móvil

### 2. **Efectos Visuales**
- **Scroll Reveal**: Animaciones al hacer scroll
- **Parallax**: Efectos de profundidad en elementos
- **Custom Cursor**: Cursor personalizado con estados interactivos
- **Hover Effects**: Transiciones suaves en elementos interactivos

### 3. **Sección de Proyectos**
- **Cards Interactivas**: Con efectos hover y videos de fondo
- **Videos Autoplay**: Con efecto loop reverso
- **Slider Automático**: Para proyecto SoMoS con fallback a imágenes
- **Badges Dinámicos**: Etiquetas descriptivas por proyecto

### 4. **Timeline de Experiencia**
- **Animación Alternada**: Entrada desde ambos lados
- **Marcadores Animados**: Con efectos de hover y rotación
- **Scroll Progress**: Barra de progreso animada

### 5. **Sistema de Traducciones**
- **Cambio Dinámico**: Sin recarga de página
- **Persistencia**: Guardado en localStorage
- **Detección Automática**: Basada en idioma del navegador
- **Currículums Separados**: CV en ambos idiomas

### 6. **Formulario de Contacto**
- **Integración WhatsApp**: Envío directo con datos preformateados
- **Validación Visual**: Estados de error y éxito
- **Animaciones de Envío**: Feedback visual del proceso

### 7. **Botón de Descarga CV**
- **Animación Completa**: Progreso, loading, éxito
- **Estados Visuales**: Con iconos y transiciones
- **Descarga Automática**: Según idioma seleccionado

## 🎨 Diseño y UX

### Paleta de Colores
```css
--bg-900: #0f0f16    /* Fondo principal oscuro */
--bg-800: #1e1f2b    /* Fondo secundario */
--bg-700: #252530    /* Fondo terciario */
--accent: #ffe600    /* Color de acento dorado */
--accent-2: #fdf28b  /* Color de acento secundario */
--text: #ffffff      /* Texto principal */
```

### Tipografía
- **Fuente Principal**: Poppins (Google Fonts)
- **Pesos**: 400, 500, 600, 700
- **Jerarquía**: Títulos, subtítulos, texto y elementos pequeños

### Espaciado y Layout
- **Grid System**: CSS Grid y Flexbox
- **Breakpoints**: Mobile (480px), Tablet (768px), Desktop (980px)
- **Container**: Máximo 1200px con padding responsivo

## ⚡ Performance y Optimización

### Técnicas Implementadas
- **Lazy Loading**: Para videos e imágenes
- **Intersection Observer**: Para animaciones eficientes
- **CSS Variables**: Para temas y consistencia
- **Event Delegation**: Para mejor performance
- **Debounced Events**: Para scroll y resize

### Métricas de Performance
- **First Contentful Paint**: Optimizado con carga progresiva
- **Cumulative Layout Shift**: Minimizado con dimensiones fijas
- **Time to Interactive**: Mejorado con scripts defer

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile */
@media (max-width: 480px)

/* Tablet */
@media (max-width: 768px)

/* Desktop */
@media (max-width: 980px)
```

### Adaptaciones Móviles
- Menú hamburguesa con overlay
- Timeline vertical en móvil
- Cards de proyectos en columna única
- Formulario optimizado para touch
- Cursor personalizado deshabilitado en touch

## 🔧 Configuración y Personalización

### Variables de Configuración
```javascript
// En script.js
const NOMBRE = ""; // Nombre para autotype
const ROL = ""; // Rol para autotype
const WHATSAPP_NUMBER = "543435086453"; // Número de WhatsApp
```

### Personalización de Colores
```css
:root {
    --accent: #ffe600;     /* Color principal */
    --accent-2: #fdf28b;   /* Color secundario */
    --bg-900: #0f0f16;     /* Fondo principal */
}
```

## 🚀 Deployment

### Opciones de Hosting
- **Netlify**: Deploy automático desde Git
- **Vercel**: Optimizado para proyectos estáticos
- **GitHub Pages**: Hosting gratuito
- **Firebase Hosting**: Con CDN global

### Configuración Recomendada
1. **HTTPS**: Obligatorio para APIs modernas
2. **Compresión**: Gzip/Brotli habilitado
3. **Cache Headers**: Para assets estáticos
4. **CDN**: Para mejor performance global

## 📊 Métricas y Analytics

### Herramientas Recomendadas
- **Google Analytics**: Para métricas de usuario
- **Google Search Console**: Para SEO
- **PageSpeed Insights**: Para performance
- **Lighthouse**: Para auditorías completas

## 🔮 Futuras Mejoras

### Funcionalidades Planificadas
- [ ] **Dark/Light Mode**: Toggle de tema
- [ ] **PWA**: Progressive Web App
- [ ] **Blog Section**: Para artículos técnicos
- [ ] **Contact Form Backend**: Para almacenar mensajes
- [ ] **SEO Avanzado**: Meta tags dinámicos
- [ ] **Animaciones 3D**: Con Three.js o similar

### Optimizaciones Técnicas
- [ ] **Web Components**: Para reutilización
- [ ] **Service Worker**: Para cache offline
- [ ] **WebP Images**: Para mejor compresión
- [ ] **Critical CSS**: Para above-the-fold

## 👨‍💻 Autor

**Sebastián Kisser**
- 🌍 Argentina
- 💼 Full Stack Developer & Graphic Designer
- 📧 Contacto: +54 343 508 6453
- 🎨 Especializado en UX/UI y desarrollo web moderno

## 📄 Licencia

Este proyecto es de uso personal. Todos los derechos reservados.

---

*Desarrollado con ❤️ y mucho café ☕*
