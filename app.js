let productos = {};
let cargado = false;

fetch("productos.json")
    .then(r => r.json())
    .then(datos => {
        productos = datos;
        cargado = true;
        console.log("Productos cargados:", productos);
    })
    .catch(error => {
        console.error("Error cargando JSON:", error);
        alert("No se pudo cargar el archivo productos.json");
    });


const lector = new Html5Qrcode("lector");

document
    .getElementById("botonEscanear")
    .addEventListener("click", iniciarEscaner);


function iniciarEscaner() {

    if (!cargado) {
        alert("El archivo de productos todavía se está cargando");
        return;
    }

    lector.start(
        { facingMode: "environment" },
        { fps: 10 },

        (codigo) => {

            // Limpia espacios o caracteres extra del lector
            codigo = codigo.trim();

            const producto = productos[codigo];

            const resultado = document.getElementById("resultado");
            const barra = document.getElementById("barra");


            if (producto) {

                const posicion = producto.posicion;
                const categoria = producto.categoria;

           resultado.className = "correcto";
         resultado.textContent = `✓ Colocar en ${posicion}`;
        barra.textContent = `Código: ${codigo}`;

            } else {

        resultado.className = "error";
      resultado.textContent = "✗ No pertenece al mueble";
      barra.textContent = `Código: ${codigo}`;

            }


            lector.stop();

        }
    )
    .catch(error => {
        console.error("Error iniciando escáner:", error);
    });

}
