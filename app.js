let productos = {};

fetch("productos.json")
    .then(r => r.json())
    .then(datos => {
        productos = datos;
        
    });

const lector = new Html5Qrcode("lector");

document
    .getElementById("botonEscanear")
    .addEventListener("click", iniciarEscaner);

function iniciarEscaner() {
    lector.start(
        { facingMode: "environment" },
        { fps: 30 },
        {qrbox: { width: 50, height: 250 }},

        (codigo) => {
alert(codigo);
            const posicion = productos[codigo].posicion;
            const categoria = productos[codigo].categoria;
                  
            const resultado = document.getElementById("resultado");
             const barra = document.getElementById("barra");

            if (posicion) {

                resultado.textContent =
                    `✓ Colocar en ${posicion}`;
                 barra.textContent =
                    `este es: ${codigo}`;

            } else {
                   barra.textContent =
                    `este es ${codigo}`;
                resultado.textContent =
                    "✗ No pertenece al mueble";
            }

            lector.stop();
        }
    );
}
