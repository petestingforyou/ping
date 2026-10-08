/* =====================================================
LECTOR DE LOTES
VERSION 2
ESCANEO INDIVIDUAL
===================================================== */

/* =====================================================
VARIABLES
===================================================== */

let lector = null;

let escanerActivo = false;

let escaneoProcesado = false;

let lotes =
JSON.parse(
localStorage.getItem("lectorLotes")
) || [];

let loteActual = [];

let loteActualNombre = "";

let indiceRevision = 0;

/* =====================================================
ELEMENTOS
===================================================== */

const pantallaPrincipal =
document.getElementById(
"pantallaPrincipal"
);

const pantallaNuevoLote =
document.getElementById(
"pantallaNuevoLote"
);

const pantallaRevision =
document.getElementById(
"pantallaRevision"
);

const btnNuevoLote =
document.getElementById(
"btnNuevoLote"
);

const btnVolverPrincipal =
document.getElementById(
"btnVolverPrincipal"
);

const btnVolverLotes =
document.getElementById(
"btnVolverLotes"
);

const btnIniciarEscaneo =
document.getElementById(
"btnIniciarEscaneo"
);

const btnCancelarEscaneo =
document.getElementById(
"btnCancelarEscaneo"
);

const btnGuardarLote =
document.getElementById(
"btnGuardarLote"
);

const btnSiguiente =
document.getElementById(
"btnSiguiente"
);

const btnRegresarLotesFinalizado =
document.getElementById(
"btnRegresarLotesFinalizado"
);

const nombreLote =
document.getElementById(
"nombreLote"
);

const listaLotes =
document.getElementById(
"listaLotes"
);

const listaEscaneados =
document.getElementById(
"listaEscaneados"
);

const contadorEscaneos =
document.getElementById(
"contadorEscaneos"
);

const estadoEscaner =
document.getElementById(
"estadoEscaner"
);

const mensajeEscaneo =
document.getElementById(
"mensajeEscaneo"
);

const lectorCamara =
document.getElementById(
"lectorCamara"
);

const tituloLoteRevision =
document.getElementById(
"tituloLoteRevision"
);

const progresoRevision =
document.getElementById(
"progresoRevision"
);

const numeroProductoActual =
document.getElementById(
"numeroProductoActual"
);

const codigoBarrasRevision =
document.getElementById(
"codigoBarrasRevision"
);

const informacionRepeticion =
document.getElementById(
"informacionRepeticion"
);

const contenedorRevision =
document.getElementById(
"contenedorRevision"
);

const pantallaFinalizado =
document.getElementById(
"pantallaFinalizado"
);

const mensaje =
document.getElementById(
"mensaje"
);

/* =====================================================
INICIO
===================================================== */

document.addEventListener(
"DOMContentLoaded",
() => {


    mostrarLotes();

}


);

/* =====================================================
CAMBIO DE PANTALLA
===================================================== */

function mostrarPantalla(
pantalla
) {


pantallaPrincipal.classList.remove(
    "activa"
);

pantallaNuevoLote.classList.remove(
    "activa"
);

pantallaRevision.classList.remove(
    "activa"
);

pantalla.classList.add(
    "activa"
);


}

/* =====================================================
NUEVO LOTE
===================================================== */

btnNuevoLote.addEventListener(
"click",
() => {


    prepararNuevoLote();

    mostrarPantalla(
        pantallaNuevoLote
    );

}


);

/* =====================================================
PREPARAR NUEVO LOTE
===================================================== */

function prepararNuevoLote() {


detenerEscaneo();

nombreLote.value = "";

loteActual = [];

actualizarListaEscaneados();


}

/* =====================================================
VOLVER PRINCIPAL
===================================================== */

btnVolverPrincipal.addEventListener(
"click",
() => {


    detenerEscaneo();

    mostrarPantalla(
        pantallaPrincipal
    );

}


);

/* =====================================================
VOLVER LOTES
===================================================== */

btnVolverLotes.addEventListener(
"click",
() => {


    mostrarPantalla(
        pantallaPrincipal
    );

    pantallaFinalizado.classList.add(
        "oculto"
    );

    contenedorRevision.classList.remove(
        "oculto"
    );

}


);

btnRegresarLotesFinalizado.addEventListener(
"click",
() => {


    mostrarPantalla(
        pantallaPrincipal
    );

    pantallaFinalizado.classList.add(
        "oculto"
    );

    contenedorRevision.classList.remove(
        "oculto"
    );

}


);

/* =====================================================
INICIAR ESCANEO
===================================================== */

btnIniciarEscaneo.addEventListener(
"click",
iniciarEscaneo
);

async function iniciarEscaneo() {


if (escanerActivo) {

    return;

}


/*
 * Cada vez que abrimos la cámara
 * comenzamos una sesión nueva.
 */

escaneoProcesado = false;


try {

    lector =
        new Html5Qrcode(
            "lectorCamara"
        );


    const configuracion = {

        fps: 10,

        qrbox: function (
            ancho,
            alto
        ) {

            /*
             * Para códigos de barras
             * usamos una zona horizontal.
             */

            const anchoCaja =
                Math.floor(
                    ancho * 0.85
                );

            const altoCaja =
                Math.floor(
                    Math.min(
                        180,
                        alto * 0.45
                    )
                );

            return {

                width:
                    anchoCaja,

                height:
                    altoCaja

            };

        },

        aspectRatio: 1.0,

        formatsToSupport: [

            Html5QrcodeSupportedFormats.EAN_13,

            Html5QrcodeSupportedFormats.EAN_8,

            Html5QrcodeSupportedFormats.UPC_A,

            Html5QrcodeSupportedFormats.UPC_E,

            Html5QrcodeSupportedFormats.CODE_128,

            Html5QrcodeSupportedFormats.CODE_39,

            Html5QrcodeSupportedFormats.ITF

        ]

    };


    lectorCamara.classList.add(
        "activo"
    );


    await lector.start(

        {
            facingMode:
                "environment"
        },

        configuracion,

        codigoDetectado,

        errorLectura

    );


    escanerActivo = true;


    btnIniciarEscaneo.disabled =
        true;

    btnCancelarEscaneo.disabled =
        false;


    estadoEscaner.textContent =
        "Escaneando";

    estadoEscaner.classList.remove(
        "estado-detenido"
    );

    estadoEscaner.classList.add(
        "estado-activo"
    );


    mensajeEscaneo.textContent =
        "Apunta la cámara al código de barras.";


} catch (error) {

    console.error(
        "Error iniciando cámara:",
        error
    );


    lector = null;

    escanerActivo = false;

    lectorCamara.classList.remove(
        "activo"
    );


    mostrarMensaje(
        "No fue posible iniciar la cámara. Revisa los permisos del navegador."
    );

}


}

/* =====================================================
CODIGO DETECTADO
===================================================== */

async function codigoDetectado(
texto,
resultado
) {


/*
 * Si ya procesamos un código
 * durante esta sesión, ignoramos
 * cualquier lectura adicional.
 */

if (escaneoProcesado) {

    return;

}


const codigo =
    String(texto).trim();


if (!codigo) {

    return;

}


/*
 * BLOQUEAMOS INMEDIATAMENTE
 *
 * Esto es importante porque la cámara
 * puede detectar el mismo código varias
 * veces antes de que termine de cerrarse.
 */

escaneoProcesado = true;


/*
 * Confirmación física.
 */

realizarConfirmacion();


/*
 * Guardamos exactamente una lectura.
 */

agregarCodigo(codigo);


/*
 * Cerramos automáticamente la cámara.
 */

await detenerEscaneo();


/*
 * Cambiamos el mensaje después
 * de cerrar la cámara.
 */

mensajeEscaneo.textContent =
    "✅ Producto agregado. Pulsa «Escanear producto» para continuar.";


}

/* =====================================================
CONFIRMACION
===================================================== */

function realizarConfirmacion() {


/*
 * Vibración disponible en la mayoría
 * de teléfonos Android.
 */

if (
    "vibrate" in navigator
) {

    navigator.vibrate(
        180
    );

}


mostrarMensaje(
    "✓ Código detectado"
);


}

/* =====================================================
ERROR DE LECTURA
===================================================== */

function errorLectura(error) {


/*
 * No mostramos errores aquí.
 *
 * html5-qrcode llama constantemente
 * a esta función mientras intenta
 * encontrar un código.
 */


}

/* =====================================================
AGREGAR CODIGO
===================================================== */

function agregarCodigo(
codigo
) {


const existente =
    loteActual.find(
        producto =>
            producto.codigo === codigo
    );


if (existente) {

    existente.cantidad++;


    mostrarMensaje(
        `Código repetido: ${existente.cantidad} veces`
    );

} else {

    loteActual.push({

        codigo:
            codigo,

        cantidad:
            1

    });


    mostrarMensaje(
        "Código agregado"
    );

}


actualizarListaEscaneados();


}

/* =====================================================
ACTUALIZAR LISTA
===================================================== */

function actualizarListaEscaneados() {


const total =
    loteActual.reduce(
        (
            suma,
            producto
        ) =>
            suma +
            producto.cantidad,
        0
    );


contadorEscaneos.textContent =
    `${total} productos escaneados · ${loteActual.length} códigos diferentes`;


if (
    loteActual.length === 0
) {

    listaEscaneados.innerHTML = `

        <div class="sin-productos">

            Todavía no has escaneado productos.

        </div>

    `;

    return;

}


listaEscaneados.innerHTML =
    "";


loteActual.forEach(
    producto => {

        const elemento =
            document.createElement(
                "div"
            );


        elemento.className =
            "producto-escaneado";


        if (
            producto.cantidad > 1
        ) {

            elemento.classList.add(
                "producto-repetido"
            );

        }


        elemento.innerHTML = `

            <div class="producto-codigo">
                ${escaparHTML(
                    producto.codigo
                )}
            </div>

            <div class="producto-cantidad">
                ${producto.cantidad}
            </div>

        `;


        listaEscaneados.appendChild(
            elemento
        );

    }
);


}

/* =====================================================
DETENER ESCANEO
===================================================== */

btnCancelarEscaneo.addEventListener(
"click",
() => {


    detenerEscaneo();

    mensajeEscaneo.textContent =
        "Escaneo cancelado. Pulsa «Escanear producto» para comenzar.";

}


);

async function detenerEscaneo() {


if (
    !lector
) {

    escanerActivo =
        false;

    lectorCamara.classList.remove(
        "activo"
    );

    return;

}


try {

    if (
        escanerActivo
    ) {

        await lector.stop();

    }

} catch (error) {

    console.warn(
        "Error al detener cámara:",
        error
    );

}


try {

    lector.clear();

} catch (error) {

    console.warn(
        "Error limpiando lector:",
        error
    );

}


lector = null;

escanerActivo =
    false;


lectorCamara.classList.remove(
    "activo"
);


btnIniciarEscaneo.disabled =
    false;

btnCancelarEscaneo.disabled =
    true;


estadoEscaner.textContent =
    "Listo";

estadoEscaner.classList.remove(
    "estado-activo"
);

estadoEscaner.classList.add(
    "estado-detenido"
);


}

/* =====================================================
GUARDAR LOTE
===================================================== */

btnGuardarLote.addEventListener(
"click",
guardarLote
);

function guardarLote() {


const nombre =
    nombreLote.value.trim();


if (!nombre) {

    mostrarMensaje(
        "Escribe un nombre para el lote."
    );

    nombreLote.focus();

    return;

}


if (
    loteActual.length === 0
) {

    mostrarMensaje(
        "Escanea al menos un producto antes de guardar."
    );

    return;

}


detenerEscaneo();


const totalProductos =
    loteActual.reduce(
        (
            suma,
            producto
        ) =>
            suma +
            producto.cantidad,
        0
    );


const lote = {

    id:
        Date.now().toString(),

    nombre:
        nombre,

    fecha:
        new Date().toISOString(),

    totalProductos:
        totalProductos,

    totalCodigos:
        loteActual.length,

    productos:
        JSON.parse(
            JSON.stringify(
                loteActual
            )
        )

};


lotes.unshift(
    lote
);


localStorage.setItem(
    "lectorLotes",
    JSON.stringify(
        lotes
    )
);


loteActual = [];

nombreLote.value = "";


mostrarLotes();


mostrarPantalla(
    pantallaPrincipal
);


mostrarMensaje(
    "Lote guardado correctamente."
);


}

/* =====================================================
MOSTRAR LOTES
===================================================== */

function mostrarLotes() {


if (
    lotes.length === 0
) {

    listaLotes.innerHTML = `

        <div class="sin-lotes">

            <div class="icono-vacio">
                📦
            </div>

            <p>
                Aún no tienes lotes guardados.
            </p>

        </div>

    `;

    return;

}


listaLotes.innerHTML =
    "";


lotes.forEach(
    lote => {

        const elemento =
            document.createElement(
                "div"
            );


        elemento.className =
            "lote";


        const fecha =
            new Date(
                lote.fecha
            ).toLocaleString(
                "es-MX"
            );


        elemento.innerHTML = `

            <div>

                <h3>
                    ${escaparHTML(
                        lote.nombre
                    )}
                </h3>

                <p>
                    ${lote.totalCodigos}
                    códigos diferentes ·
                    ${lote.totalProductos}
                    escaneos
                </p>

                <p>
                    ${fecha}
                </p>

            </div>

            <div class="lote-flecha">
                →
            </div>

        `;


        elemento.addEventListener(
            "click",
            () =>
                abrirLote(
                    lote.id
                )
        );


        listaLotes.appendChild(
            elemento
        );

    }
);


}

/* =====================================================
ABRIR LOTE
===================================================== */

function abrirLote(
id
) {


const lote =
    lotes.find(
        elemento =>
            elemento.id === id
    );


if (!lote) {

    mostrarMensaje(
        "No se encontró el lote."
    );

    return;

}


if (
    !lote.productos ||
    lote.productos.length === 0
) {

    mostrarMensaje(
        "Este lote no contiene códigos."
    );

    return;

}


loteActualNombre =
    lote.nombre;


loteActual =
    JSON.parse(
        JSON.stringify(
            lote.productos
        )
    );


indiceRevision =
    0;


tituloLoteRevision.textContent =
    loteActualNombre;


pantallaFinalizado.classList.add(
    "oculto"
);

contenedorRevision.classList.remove(
    "oculto"
);


mostrarPantalla(
    pantallaRevision
);


mostrarCodigoRevision();


}

/* =====================================================
MOSTRAR CODIGO DE REVISION
===================================================== */

function mostrarCodigoRevision() {


if (
    indiceRevision >=
    loteActual.length
) {

    finalizarRevision();

    return;

}


const producto =
    loteActual[
        indiceRevision
    ];


const numero =
    indiceRevision + 1;


const total =
    loteActual.length;


numeroProductoActual.textContent =
    numero;


progresoRevision.textContent =
    `Código ${numero} de ${total}`;


informacionRepeticion.className =
    "informacion-repeticion";


if (
    producto.cantidad > 1
) {

    informacionRepeticion.textContent =
        `Repetido ${producto.cantidad} veces`;

    informacionRepeticion.classList.add(
        "repetido"
    );

} else {

    informacionRepeticion.textContent =
        "";

}


codigoBarrasRevision.innerHTML =
    "";


try {

    generarCodigoSVG(
        producto.codigo
    );

} catch (error) {

    console.error(
        "Error generando código:",
        error
    );

    mostrarMensaje(
        `No se pudo generar el código ${producto.codigo}`
    );

}


}

/* =====================================================
GENERAR SVG
===================================================== */

function generarCodigoSVG(
codigo
) {


const formato =
    detectarFormatoCodigo(
        codigo
    );


JsBarcode(
    codigoBarrasRevision,
    codigo,
    {

        format:
            formato,

        lineColor:
            "#000000",

        background:
            "#ffffff",

        width:
            3,

        height:
            150,

        margin:
            10,

        displayValue:
            false,

        flat:
            false

    }
);


}

/* =====================================================
DETECTAR FORMATO
===================================================== */

function detectarFormatoCodigo(
codigo
) {


if (
    /^\d{13}$/.test(
        codigo
    )
) {

    return "EAN13";

}


if (
    /^\d{8}$/.test(
        codigo
    )
) {

    return "EAN8";

}


if (
    /^\d{12}$/.test(
        codigo
    )
) {

    return "UPC";

}


return "CODE128";


}

/* =====================================================
SIGUIENTE
===================================================== */

btnSiguiente.addEventListener(
"click",
() => {


    indiceRevision++;

    mostrarCodigoRevision();

}


);

/* =====================================================
FINALIZAR
===================================================== */

function finalizarRevision() {


contenedorRevision.classList.add(
    "oculto"
);

pantallaFinalizado.classList.remove(
    "oculto"
);


}

/* =====================================================
MENSAJE
===================================================== */

let temporizadorMensaje = null;

function mostrarMensaje(
texto
) {


mensaje.textContent =
    texto;


mensaje.classList.add(
    "mostrar"
);


clearTimeout(
    temporizadorMensaje
);


temporizadorMensaje =
    setTimeout(
        () => {

            mensaje.classList.remove(
                "mostrar"
            );

        },
        2200
    );


}

/* =====================================================
SEGURIDAD HTML
===================================================== */

function escaparHTML(
texto
) {


return String(texto)

    .replace(
        /&/g,
        "&amp;"
    )

    .replace(
        /</g,
        "&lt;"
    )

    .replace(
        />/g,
        "&gt;"
    )

    .replace(
        /"/g,
        "&quot;"
    )

    .replace(
        /'/g,
        "&#039;"
    );


}
