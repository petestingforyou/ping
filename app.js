const app = {
    listaCamaras: null,
    
    video: null,

    resultado: null,

    camaras: [],

    camaraActual: 0,

    lector: null

};
function iniciarElementos() {

    app.video = document.getElementById("video");

    app.resultado = document.getElementById("resultado");
    
    app.listaCamaras = document.getElementById("listaCamaras");

}
async function iniciarApp(){

   iniciarElementos();

    await iniciarCamara();

    await obtenerCamaras();

    llenarListaCamaras();
}
async function obtenerCamaras() {

    const dispositivos = await navigator.mediaDevices.enumerateDevices();

    app.camaras = dispositivos.filter(dispositivo => dispositivo.kind === "videoinput");

    console.log(app.camaras);
   

}
function llenarListaCamaras() {

    app.listaCamaras.innerHTML = "";

    app.camaras.forEach((camara, indice) => {

        const opcion = document.createElement("option");

        opcion.value = camara.deviceId;

        if (camara.label !== "") {

            opcion.textContent = camara.label;

        } else {

            opcion.textContent = `Cámara ${indice + 1}`;

        }

        app.listaCamaras.appendChild(opcion);

    });

}

iniciarApp();
