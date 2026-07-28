const codigo = document.getElementById("codigo");


// Función que recibe el código leído por la cámara
function codigoLeido(texto) {
    codigo.textContent = texto;
}


// Crear lector
const html5QrCode = new Html5Qrcode("reader");


// Intentar obtener cámaras disponibles
Html5Qrcode.getCameras()
.then(cameras => {

    if (cameras && cameras.length > 0) {

        console.log("Cámaras encontradas:", cameras);


        html5QrCode.start(
            { 
                facingMode: { exact: "environment" } 
            },
            {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            },
            codigoLeido
        )
        .catch(error => {
            console.log("Error al iniciar cámara:", error);
            mostrarEntradaManual();
        });


    } else {

        console.log("No hay cámaras disponibles");
        mostrarEntradaManual();

    }


})
.catch(error => {

    console.log("No se pudo acceder a la cámara:", error);
    mostrarEntradaManual();

});



// Mostrar cuadro de texto manual
function mostrarEntradaManual() {

    document.getElementById("manual").style.display = "block";

}



// Usar código escrito manualmente
function usarCodigoManual() {

    const entrada = document.getElementById("entradaManual");

    const texto = entrada.value.trim();


    if (texto !== "") {

        codigo.textContent = texto;

    }

}