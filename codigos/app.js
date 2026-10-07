// ========================================
// PASSBAR
// GENERADOR DE CÓDIGOS DE BARRAS
// ========================================

import {
validarLicencia,
registrarCodigosGenerados,
obtenerLicenciaGuardada,
cerrarLicencia
} from "./licencia.js";

// ========================================
// ELEMENTOS HTML
// ========================================

const listaRegistros =
document.getElementById("listaRegistros");

const btnAgregar =
document.getElementById("btnAgregar");

const btnGenerar =
document.getElementById("btnGenerar");

const btnLimpiar =
document.getElementById("btnLimpiar");

const btnImprimir =
document.getElementById("btnImprimir");

const acciones =
document.getElementById("acciones");

const contenedorCodigos =
document.getElementById("contenedorCodigos");

const mensajeInicial =
document.getElementById("mensajeInicial");

const tamanoCodigo =
document.getElementById("tamanoCodigo");

const anchoEtiqueta =
document.getElementById("anchoEtiqueta");

const altoEtiqueta =
document.getElementById("altoEtiqueta");

const altoBarras =
document.getElementById("altoBarras");

const tamanoTexto =
document.getElementById("tamanoTexto");

const pantallaLicencia =
document.getElementById("pantallaLicencia");

const licenciaInput =
document.getElementById("licenciaInput");

const btnActivarLicencia =
document.getElementById("btnActivarLicencia");

const mensajeLicencia =
document.getElementById("mensajeLicencia");

const estadoLicencia =
document.getElementById("estadoLicencia");

// ========================================
// VARIABLES
// ========================================

let contadorRegistros = 0;

let licenciaValida = false;

let datosLicencia = null;

// ========================================
// INICIO DE LA APLICACIÓN
// ========================================

async function iniciarAplicacion() {


agregarRegistro();

await comprobarLicencia();


}

// ========================================
// COMPROBAR LICENCIA GUARDADA
// ========================================

async function comprobarLicencia() {


const licenciaGuardada =
    obtenerLicenciaGuardada();


if (!licenciaGuardada) {

    licenciaValida = false;

    datosLicencia = null;

    actualizarEstadoLicencia(
        "Sin licencia"
    );

    btnGenerar.disabled = false;

    btnGenerar.textContent =
        "Generar todos los códigos";

    return;
}


const resultado =
    await validarLicencia(
        licenciaGuardada
    );


if (!resultado.valida) {

    licenciaValida = false;

    datosLicencia = null;

    cerrarLicencia();

    actualizarEstadoLicencia(
        resultado.motivo
    );

    btnGenerar.disabled = false;

    btnGenerar.textContent =
        "Generar todos los códigos";

    return;
}


activarLicencia(resultado);


}

// ========================================
// ACTIVAR LICENCIA
// ========================================

function activarLicencia(resultado) {


licenciaValida = true;

datosLicencia = resultado;


pantallaLicencia.classList.add(
    "ocultar-licencia"
);


actualizarEstadoLicencia();


btnGenerar.disabled = false;

btnGenerar.textContent =
    "Generar todos los códigos";


}

// ========================================
// MOSTRAR PANTALLA DE LICENCIA
// ========================================

function mostrarPantallaLicencia(
mensaje = ""
) {


pantallaLicencia.classList.remove(
    "ocultar-licencia"
);


licenciaInput.value = "";


mensajeLicencia.textContent =
    mensaje;


setTimeout(() => {

    licenciaInput.focus();

}, 100);


}

// ========================================
// ACTIVAR LICENCIA INGRESADA
// ========================================

async function activarLicenciaIngresada() {


const licencia =
    licenciaInput.value.trim();


if (!licencia) {

    mensajeLicencia.textContent =
        "Ingresa una licencia.";

    licenciaInput.focus();

    return;
}


btnActivarLicencia.disabled = true;

mensajeLicencia.textContent =
    "Comprobando licencia...";


const resultado =
    await validarLicencia(
        licencia
    );


btnActivarLicencia.disabled = false;


if (!resultado.valida) {

    mensajeLicencia.textContent =
        resultado.motivo;

    return;
}


activarLicencia(resultado);

mensajeLicencia.textContent = "";


}

// ========================================
// ACTUALIZAR ESTADO DE LICENCIA
// ========================================

function actualizarEstadoLicencia(
mensajePersonalizado = null
) {


if (!estadoLicencia) {
    return;
}


if (mensajePersonalizado) {

    estadoLicencia.textContent =
        mensajePersonalizado;

    return;
}


if (!datosLicencia) {

    estadoLicencia.textContent =
        "Sin licencia";

    return;
}


const disponibles =
    datosLicencia.disponibles;


const limite =
    datosLicencia.limiteCodigos;


const generados =
    datosLicencia.codigosGenerados;


if (
    limite > 0 &&
    disponibles !== Infinity
) {

    estadoLicencia.textContent =
        `Licencia: ${datosLicencia.licencia} · ` +
        `Disponibles: ${disponibles} · ` +
        `Generados: ${generados}/${limite}`;

} else {

    estadoLicencia.textContent =
        `Licencia: ${datosLicencia.licencia} · ` +
        `Generados: ${generados}`;
}


}

// ========================================
// CONFIGURACIONES DE TAMAÑO
// ========================================

function obtenerConfiguracionTamano() {


const tipo =
    tamanoCodigo.value;


if (tipo === "pequeno") {

    return {

        ancho: 4,

        alto: 1.2,

        altoBarras: 0.8,

        texto: 8
    };
}


if (tipo === "mediano") {

    return {

        ancho: 5,

        alto: 1.5,

        altoBarras: 1,

        texto: 10
    };
}


if (tipo === "grande") {

    return {

        ancho: 7,

        alto: 2.5,

        altoBarras: 1.7,

        texto: 12
    };
}


return {

    ancho:
        Number(anchoEtiqueta.value) || 5,

    alto:
        Number(altoEtiqueta.value) || 1.5,

    altoBarras:
        Number(altoBarras.value) || 1,

    texto:
        Number(tamanoTexto.value) || 10
};


}

// ========================================
// MOSTRAR / OCULTAR CONFIGURACIÓN
// PERSONALIZADA
// ========================================

function actualizarConfiguracionPersonalizada() {


const personalizada =
    tamanoCodigo.value ===
    "personalizado";


const contenedor =
    document.getElementById(
        "opcionesPersonalizadas"
    );


if (!contenedor) {
    return;
}


if (personalizada) {

    contenedor.classList.remove(
        "oculto"
    );

} else {

    contenedor.classList.add(
        "oculto"
    );
}


}

// ========================================
// AGREGAR REGISTRO
// ========================================

function agregarRegistro() {


contadorRegistros++;


const numero =
    contadorRegistros;


const registro =
    document.createElement("div");


registro.className =
    "registro";


registro.dataset.numero =
    numero;


registro.innerHTML = `

    <div class="registro-header">

        <strong>
            Código ${numero}
        </strong>

        <button
            type="button"
            class="btnEliminarRegistro btn-eliminar-registro"
            title="Eliminar código"
            aria-label="Eliminar código"
        >
            ×
        </button>

    </div>

    <div class="campos-registro">

        <div class="campo">

            <label>
                Usuario
            </label>

            <input
                type="text"
                class="usuario"
                placeholder="Usuario"
                autocomplete="off"
            >

        </div>

        <div class="campo">

            <label>
                Contraseña
            </label>

            <input
                type="text"
                class="contrasena"
                placeholder="Contraseña"
                autocomplete="off"
            >

        </div>

    </div>
`;


listaRegistros.appendChild(
    registro
);


registro.querySelector(
    ".btnEliminarRegistro"
).addEventListener(
    "click",
    () => {

        registro.remove();

        actualizarNumeracion();
    }
);


}

// ========================================
// ACTUALIZAR NUMERACIÓN
// ========================================

function actualizarNumeracion() {


const registros =
    listaRegistros.querySelectorAll(
        ".registro"
    );


registros.forEach(
    (registro, indice) => {

        const numero =
            indice + 1;


        registro.dataset.numero =
            numero;


        const titulo =
            registro.querySelector(
                ".registro-header strong"
            );


        if (titulo) {

            titulo.textContent =
                `Código ${numero}`;
        }
    }
);


}

// ========================================
// OBTENER DATOS DE LOS REGISTROS
// ========================================

function obtenerDatosRegistros() {


const registros =
    listaRegistros.querySelectorAll(
        ".registro"
    );


const datos = [];


registros.forEach(registro => {

    const usuario =
        registro.querySelector(
            ".usuario"
        ).value.trim();


    const contrasena =
        registro.querySelector(
            ".contrasena"
        ).value;


    datos.push({

        usuario,

        contrasena
    });
});


return datos;


}

// ========================================
// GENERAR TODOS LOS CÓDIGOS
// ========================================

async function generarTodos() {


// ------------------------------------
// SI NO HAY LICENCIA
// ------------------------------------

if (!licenciaValida) {

    mostrarPantallaLicencia(
        "Ingresa una licencia para continuar."
    );

    return;
}


// ------------------------------------
// OBTENER DATOS
// ------------------------------------

const datos =
    obtenerDatosRegistros();


// ------------------------------------
// VALIDAR CAMPOS
// ------------------------------------

for (
    let i = 0;
    i < datos.length;
    i++
) {

    if (
        !datos[i].usuario ||
        !datos[i].contrasena
    ) {

        alert(
            `Completa el usuario y la contraseña del código ${i + 1}.`
        );

        return;
    }
}


// ------------------------------------
// VALIDAR CANTIDAD
// ------------------------------------

if (datos.length === 0) {

    alert(
        "Agrega al menos un código."
    );

    return;
}


// ------------------------------------
// VALIDAR DISPONIBLES
// ------------------------------------

if (
    datosLicencia &&
    datosLicencia.limiteCodigos > 0
) {

    const disponibles =
        Number(
            datosLicencia.disponibles
        );


    if (
        datos.length >
        disponibles
    ) {

        alert(
            `La licencia solo tiene ${disponibles} código(s) disponible(s).`
        );

        return;
    }
}


// ------------------------------------
// BLOQUEAR BOTÓN
// ------------------------------------

btnGenerar.disabled = true;

btnGenerar.textContent =
    "Generando...";


// ------------------------------------
// REGISTRAR CONSUMO
// ------------------------------------

const registro =
    await registrarCodigosGenerados(
        datos.length
    );


// ------------------------------------
// SI FALLA EL REGISTRO
// ------------------------------------

if (!registro.correcto) {

    btnGenerar.disabled = false;

    btnGenerar.textContent =
        "Generar todos los códigos";


    alert(
        registro.motivo
    );


    await comprobarLicencia();

    return;
}


// ------------------------------------
// ACTUALIZAR CONTADOR LOCAL
// ------------------------------------

if (datosLicencia) {

    datosLicencia.codigosGenerados =
        registro.codigosGenerados;


    if (
        datosLicencia.limiteCodigos > 0
    ) {

        datosLicencia.disponibles =
            Math.max(
                0,
                datosLicencia.limiteCodigos -
                registro.codigosGenerados
            );
    }
}


// ------------------------------------
// GENERAR CÓDIGOS
// ------------------------------------

contenedorCodigos.innerHTML =
    "";


if (mensajeInicial) {

    mensajeInicial.style.display =
        "none";
}


datos.forEach(
    (dato, indice) => {

        const etiqueta =
            crearEtiqueta(
                dato,
                indice + 1
            );


        contenedorCodigos.appendChild(
            etiqueta
        );
    }
);


// ------------------------------------
// MOSTRAR ACCIONES
// ------------------------------------

if (acciones) {

    acciones.classList.remove(
        "oculto"
    );
}


btnLimpiar.style.display =
    "inline-block";


btnImprimir.style.display =
    "inline-block";


// ------------------------------------
// ACTUALIZAR ESTADO
// ------------------------------------

actualizarEstadoLicencia();


// ------------------------------------
// COMPROBAR SI SE AGOTÓ
// ------------------------------------

const limiteAlcanzado =
    datosLicencia &&
    datosLicencia.limiteCodigos > 0 &&
    datosLicencia.codigosGenerados >=
        datosLicencia.limiteCodigos;


if (limiteAlcanzado) {

    licenciaValida = false;

    cerrarLicencia();


    btnGenerar.disabled = false;

    btnGenerar.textContent =
        "Activar otra licencia";


    estadoLicencia.textContent =
        "Licencia agotada · Los códigos generados permanecen disponibles";


    alert(
        "Los códigos fueron generados correctamente.\n\n" +
        "La licencia ha alcanzado su límite de códigos.\n\n" +
        "Los códigos generados permanecerán visibles para que puedas descargarlos o imprimirlos."
    );


    return;
}


// ------------------------------------
// LICENCIA TODAVÍA DISPONIBLE
// ------------------------------------

licenciaValida = true;

btnGenerar.disabled = false;

btnGenerar.textContent =
    "Generar todos los códigos";


}

// ========================================
// CREAR ETIQUETA
// ========================================

function crearEtiqueta(
dato,
numero
) {


const configuracion =
    obtenerConfiguracionTamano();


const etiqueta =
    document.createElement("div");


etiqueta.className =
    "codigo-generado";


// ========================================
// SVG VECTORIAL
// ========================================
//
// Se utiliza SVG en lugar de canvas para
// evitar pérdida de nitidez al mostrar
// el código en pantalla.
//
// JsBarcode permite trabajar directamente
// con elementos SVG.
// ========================================

const svg =
    document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
    );


svg.classList.add(
    "codigo-barra"
);


// ------------------------------------
// INFORMACIÓN DEL CÓDIGO
// ------------------------------------

const informacion =
    document.createElement("div");


informacion.className =
    "informacion-codigo";


const usuario =
    document.createElement("div");


usuario.textContent =
    `Usuario: ${dato.usuario}`;


informacion.appendChild(
    usuario
);


// ------------------------------------
// DATOS DEL CÓDIGO
// ------------------------------------

const contenido =
    dato.usuario +
    "\t" +
    dato.contrasena;


// ------------------------------------
// MÁRGENES DEL CÓDIGO
// ------------------------------------

const margenHorizontal =
    Math.max(
        7,
        Math.round(
            configuracion.ancho * 1.4
        )
    );


const margenVertical =
    Math.max(
        3,
        Math.round(
            configuracion.alto * 1.5
        )
    );


const separacionTexto =
    Math.max(
        5,
        Math.round(
            configuracion.texto * 0.45
        )
    );


// ------------------------------------
// GENERAR CODE128 EN SVG
// ------------------------------------

JsBarcode(
    svg,
    contenido,
    {

        format: "CODE128",

        displayValue: true,

        width: 2,

        height:
            configuracion.altoBarras *
            37.795,

        fontSize:
            configuracion.texto,

        marginTop:
            margenVertical,

        marginBottom:
            margenVertical,

        marginLeft:
            margenHorizontal,

        marginRight:
            margenHorizontal,

        textMargin:
            separacionTexto,

        lineColor:
            "#000000",

        background:
            "#ffffff"
    }
);


// ------------------------------------
// FORZAR REPRESENTACIÓN VECTORIAL
// ------------------------------------

svg.setAttribute(
    "shape-rendering",
    "crispEdges"
);


svg.style.display =
    "block";


svg.style.maxWidth =
    "100%";


svg.style.height =
    "auto";


// ------------------------------------
// TAMAÑO DE LA ETIQUETA
// ------------------------------------

etiqueta.style.width =
    `${configuracion.ancho}cm`;


etiqueta.style.minHeight =
    `${configuracion.alto}cm`;


// ------------------------------------
// AGREGAR ELEMENTOS
// ------------------------------------

etiqueta.appendChild(
    svg
);


etiqueta.appendChild(
    informacion
);


// ------------------------------------
// BOTÓN DESCARGAR PNG
// ------------------------------------

const botonDescargar =
    document.createElement("button");


botonDescargar.type =
    "button";


botonDescargar.className =
    "btnDescargar";


botonDescargar.textContent =
    "Descargar PNG";


botonDescargar.addEventListener(
    "click",
    () => {

        descargarPNG(
            svg,
            dato.usuario,
            numero
        );

    }
);


etiqueta.appendChild(
    botonDescargar
);


return etiqueta;


}

// ========================================
// DESCARGAR PNG
// ========================================
//
// El SVG se rasteriza directamente a una
// imagen de 300 DPI.
//
// Esto evita ampliar un canvas pequeño,
// que era una de las causas principales
// del aspecto difuminado.
// ========================================

function descargarPNG(
svg,
usuario,
numero
) {


const serializer =
    new XMLSerializer();


let svgTexto =
    serializer.serializeToString(
        svg
    );


// ------------------------------------
// ASEGURAR NAMESPACE SVG
// ------------------------------------

if (
    !svgTexto.includes(
        'xmlns="http://www.w3.org/2000/svg"'
    )
) {

    svgTexto =
        svgTexto.replace(
            "<svg",
            '<svg xmlns="http://www.w3.org/2000/svg"'
        );
}


// ------------------------------------
// CREAR BLOB SVG
// ------------------------------------

const blobSVG =
    new Blob(
        [svgTexto],
        {
            type:
                "image/svg+xml;charset=utf-8"
        }
    );


const urlSVG =
    URL.createObjectURL(
        blobSVG
    );


const imagen =
    new Image();


imagen.onload =
    () => {

        // --------------------------------
        // RESOLUCIÓN FINAL: 300 DPI
        // --------------------------------

        const anchoSVG =
            svg.viewBox &&
            svg.viewBox.baseVal &&
            svg.viewBox.baseVal.width
                ? svg.viewBox.baseVal.width
                : parseFloat(
                    svg.getAttribute("width")
                ) || 1;


        const altoSVG =
            svg.viewBox &&
            svg.viewBox.baseVal &&
            svg.viewBox.baseVal.height
                ? svg.viewBox.baseVal.height
                : parseFloat(
                    svg.getAttribute("height")
                ) || 1;


        const DPI =
            300;


        const FACTOR =
            DPI / 96;


        const ancho =
            Math.max(
                1,
                Math.round(
                    anchoSVG *
                    FACTOR
                )
            );


        const alto =
            Math.max(
                1,
                Math.round(
                    altoSVG *
                    FACTOR
                )
            );


        const canvasPNG =
            document.createElement(
                "canvas"
            );


        canvasPNG.width =
            ancho;


        canvasPNG.height =
            alto;


        const contexto =
            canvasPNG.getContext(
                "2d"
            );


        if (!contexto) {

            URL.revokeObjectURL(
                urlSVG
            );

            alert(
                "No fue posible preparar el archivo PNG."
            );

            return;
        }


        // --------------------------------
        // FONDO BLANCO
        // --------------------------------

        contexto.fillStyle =
            "#ffffff";


        contexto.fillRect(
            0,
            0,
            ancho,
            alto
        );


        // --------------------------------
        // EVITAR INTERPOLACIÓN
        // --------------------------------

        contexto.imageSmoothingEnabled =
            false;


        // --------------------------------
        // DIBUJAR SVG A 300 DPI
        // --------------------------------

        contexto.drawImage(
            imagen,
            0,
            0,
            ancho,
            alto
        );


        // --------------------------------
        // CREAR PNG
        // --------------------------------

        canvasPNG.toBlob(
            blob => {

                URL.revokeObjectURL(
                    urlSVG
                );


                if (!blob) {

                    alert(
                        "No fue posible crear el archivo PNG."
                    );

                    return;
                }


                const enlace =
                    document.createElement(
                        "a"
                    );


                const url =
                    URL.createObjectURL(
                        blob
                    );


                enlace.href =
                    url;


                enlace.download =
                    `PassBar_${usuario}_${numero}.png`;


                document.body.appendChild(
                    enlace
                );


                enlace.click();


                document.body.removeChild(
                    enlace
                );


                setTimeout(
                    () => {

                        URL.revokeObjectURL(
                            url
                        );

                    },
                    100
                );

            },
            "image/png"
        );

    };


imagen.onerror =
    () => {

        URL.revokeObjectURL(
            urlSVG
        );


        alert(
            "No fue posible preparar el código para descargarlo."
        );

    };


imagen.src =
    urlSVG;


}

// ========================================
// LIMPIAR VISTA
// ========================================

function limpiarVista() {


contenedorCodigos.innerHTML =
    "";


if (mensajeInicial) {

    mensajeInicial.style.display =
        "flex";
}


if (acciones) {

    acciones.classList.add(
        "oculto"
    );
}


btnLimpiar.style.display =
    "none";


btnImprimir.style.display =
    "none";


}

// ========================================
// EVENTOS
// ========================================

btnAgregar.addEventListener(
"click",
() => {


    agregarRegistro();
}


);

btnGenerar.addEventListener(
"click",
() => {


    if (
        btnGenerar.textContent ===
        "Activar otra licencia"
    ) {

        mostrarPantallaLicencia();

        return;
    }


    generarTodos();
}


);

btnLimpiar.addEventListener(
"click",
() => {


    limpiarVista();
}


);

btnImprimir.addEventListener(
"click",
() => {


    window.print();
}


);

btnActivarLicencia.addEventListener(
"click",
() => {


    activarLicenciaIngresada();
}


);

licenciaInput.addEventListener(
"keydown",
evento => {


    if (
        evento.key === "Enter"
    ) {

        activarLicenciaIngresada();
    }
}


);

tamanoCodigo.addEventListener(
"change",
() => {


    actualizarConfiguracionPersonalizada();
}


);

// ========================================
// INICIALIZAR CONFIGURACIÓN
// ========================================

actualizarConfiguracionPersonalizada();

// ========================================
// INICIAR APLICACIÓN
// ========================================

iniciarAplicacion();