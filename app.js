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

    await obtenerCamaras();

}
async function obtenerCamaras() {

    const dispositivos = await navigator.mediaDevices.enumerateDevices();

    app.camaras = dispositivos.filter(dispositivo => dispositivo.kind === "videoinput");

    console.log(app.camaras);

}

iniciarApp();
