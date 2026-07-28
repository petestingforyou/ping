const codigo = document.getElementById("codigo");

function codigoLeido(texto) {
    codigo.textContent = texto;
}

const html5QrCode = new Html5Qrcode("reader");

Html5Qrcode.getCameras().then(cameras => {

    if (cameras && cameras.length) {

        html5QrCode.start(
            cameras[0].id,
            {
                fps: 10,
                qrbox: 250
            },
            codigoLeido
        );

    }

});