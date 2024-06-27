// Textos a autotipear
const nombre = "Sebastián Kisser";
const rol = "Full Stack Developer & Diseñador Grafico";

// Elementos HTML donde se autotipeará
const nombreElement = document.getElementById("nombre");
const rolElement = document.getElementById("rol");
const cursor = document.getElementById("cursor");
const cursor2 = document.getElementById("cursor2");

// Función para autotipear el texto con barrita de tipeo intermitente
function autotype(element, text, cursor) {
    let index = 0;
    const interval = setInterval(() => {
        if (index <= text.length) {
            element.innerHTML = text.slice(0, index);
            index++;
        } else {
            clearInterval(interval);
            // Mantener la barra de tipeo al finalizar el autotipeo
            cursor.style.display = "inline";
        }
    }, 100); // Velocidad de autotipeo en milisegundos (ej. 100ms)
}

// Llamar a la función para autotipear con titilación de la barra
autotype(nombreElement, nombre, cursor);
setTimeout(() => autotype(rolElement, rol, cursor2), nombre.length * 100 + 500); // Añade un retraso después de completar el primer texto