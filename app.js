// ==========================================
// ESTADO DE LA APLICACIÓN
// ==========================================

const app = {
    video: null,
    resultado: null,
    listaCamaras: null,

    camaras: [],
    camaraActual: null,

    stream: null,
    lector: null
};

// ==========================================
// OBTENER LOS ELEMENTOS DEL HTML
// ==========================================

function iniciarElementos() {

    app.video = document.getElementById("video");
    app.resultado = document.getElementById("resultado");
    app.listaCamaras = document.getElementById("listaCamaras");

}

// ==========================================
// ABRIR LA CÁMARA
// ==========================================

async function iniciarCamara() {

    try {

        const stream = await navigator.mediaDevices.getUserMedia({

            video: {
                facingMode: "environment"
            }

        });

        app.stream = stream;

        app.video.srcObject = stream;

        await app.video.play();

        console.log("Cámara iniciada");

    } catch (error) {

        console.error(error);

        alert("No fue posible acceder a la cámara.");

    }

}

// ==========================================
// OBTENER LAS CÁMARAS DISPONIBLES
// ==========================================

async function obtenerCamaras() {

    const dispositivos = await navigator.mediaDevices.enumerateDevices();

    app.camaras = dispositivos.filter(dispositivo =>
        dispositivo.kind === "videoinput"
    );

    console.log(app.camaras);

}

// ==========================================
// LLENAR EL SELECT
// ==========================================

function llenarListaCamaras() {

    app.listaCamaras.innerHTML = "";

    app.camaras.forEach((camara, indice) => {

        const opcionCamara = document.createElement("option");

        opcionCamara.value = camara.deviceId;

        if (camara.label !== "") {

            opcionCamara.textContent = camara.label;

        } else {

            opcionCamara.textContent = `Cámara ${indice + 1}`;

        }

        app.listaCamaras.appendChild(opcionCamara);

    });

}

// ==========================================
// INICIAR LA APLICACIÓN
// ==========================================

async function iniciarApp() {

    iniciarElementos();

    await iniciarCamara();

    await obtenerCamaras();

    llenarListaCamaras();

}

iniciarApp();
