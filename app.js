const app = {

    video: null,

    resultado: null,

    camaras: [],

    camaraActual: 0,

    lector: null

};
function iniciarElementos() {

    app.video = document.getElementById("video");

    app.resultado = document.getElementById("resultado");

}
function iniciarApp() {

    iniciarElementos();

    console.log(app);

}

iniciarApp();
