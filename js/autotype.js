// Autotype robusto y reiniciable
class Autotype {
    constructor(el, text, speed = 60) {
        this.el = el;
        this.text = text;
        this.speed = speed;
        this.idx = 0;
        this.timer = null;
    }
    
    type() {
        if (!this.el) return;
        this.el.textContent = '';
        this.idx = 0;
        this._typeNext();
    }
    
    _typeNext() {
        if (this.idx <= this.text.length) {
            this.el.textContent = this.text.slice(0, this.idx);
            this.idx++;
            this.timer = setTimeout(() => this._typeNext(), this.speed);
        }
    }
    
    restart(newText) {
        if (this.timer) clearTimeout(this.timer);
        this.text = newText;
        this.type();
    }
}

// Función para configurar el autotype
function setupAutotype() {
    const lang = getLang();
    const t = translations[lang];
    const nombreEl = document.getElementById('nombre');
    const rolEl = document.getElementById('rol');
    
    window.autotypeNombre = new Autotype(nombreEl, t.home_nombre || 'Sebastián Kisser', 60);
    window.autotypeRol = new Autotype(rolEl, t.home_rol || 'Full Stack Developer & Graphic Designer', 40);
    
    window.autotypeNombre.type();
    window.autotypeRol.type();
}
