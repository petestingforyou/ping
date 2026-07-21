let productos = {};

fetch("productos.json")
    .then(r => r.json())
    .then(datos => {
        productos = datos;
        console.log("Productoscargados:",productos);
    });

const lector = new Html5Qrcode("lector");

document
    .getElementById("botonEscanear")
    .addEventListener("click", iniciarEscaner);

function iniciarEscaner() {
console.log("funciona");
    lector.start(
        { facingMode: "environment" },
        { fps: 10 },

        (codigo) => {

            const posicion = productos[codigo];

            const resultado = document.getElementById("resultado");
             const barra = document.getElementById("");

            if (posicion) {

                resultado.textContent =
                    `✓ Colocar en ${posicion}`;

            } else {

                resultado.textContent =
                    "✗ No pertenece al mueble";
            }

            lector.stop();
        }
    );
}
