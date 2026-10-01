// ========================================
// CONTROL DE LICENCIA
// ========================================

import {
    validarLicencia,
    registrarCodigosGenerados
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

const mensajeInicial =
    document.getElementById("mensajeInicial");

const contenedorCodigos =
    document.getElementById("contenedorCodigos");

const acciones =
    document.getElementById("acciones");

const btnLimpiar =
    document.getElementById("btnLimpiar");

const btnImprimir =
    document.getElementById("btnImprimir");

const estadoLicencia =
    document.getElementById("estadoLicencia");


// ========================================
// TAMAÑOS
// ========================================

const tamanoCodigo =
    document.getElementById("tamanoCodigo");

const opcionesPersonalizadas =
    document.getElementById("opcionesPersonalizadas");

const anchoEtiqueta =
    document.getElementById("anchoEtiqueta");

const altoEtiqueta =
    document.getElementById("altoEtiqueta");

const altoBarras =
    document.getElementById("altoBarras");

const tamanoTexto =
    document.getElementById("tamanoTexto");


// ========================================
// ESTADO DE LICENCIA
// ========================================

let licenciaValida = false;

let datosLicencia = null;


// ========================================
// CONFIGURACIONES PREDEFINIDAS
// ========================================

const configuracionesTamano = {

    pequeno: {

        anchoCm: 4,

        altoCm: 1.2,

        altoBarrasCm: 0.8,

        fontSize: 8

    },

    mediano: {

        anchoCm: 5,

        altoCm: 1.5,

        altoBarrasCm: 1,

        fontSize: 10

    },

    grande: {

        anchoCm: 7,

        altoCm: 2.5,

        altoBarrasCm: 1.7,

        fontSize: 12

    }

};


// ========================================
// INICIO
// ========================================

iniciarAplicacion();


// ========================================
// INICIAR APLICACIÓN
// ========================================

async function iniciarAplicacion() {

    agregarRegistro();

    await comprobarLicencia();

}


// ========================================
// COMPROBAR LICENCIA
// ========================================

async function comprobarLicencia() {

    estadoLicencia.textContent =
        "Verificando licencia...";

    btnGenerar.disabled = true;

    btnGenerar.textContent =
        "Verificando licencia...";


    const resultado =
        await validarLicencia();


    if (!resultado.valida) {

        licenciaValida = false;

        datosLicencia = null;


        estadoLicencia.textContent =
            "Licencia no válida";


        btnGenerar.disabled = true;

        btnGenerar.textContent =
            "Generación bloqueada";


        alert(
            "No es posible utilizar PassBar.\n\n" +
            resultado.motivo
        );


        return;

    }


    // ====================================
    // LICENCIA VÁLIDA
    // ====================================

    licenciaValida = true;

    datosLicencia = resultado;


    estadoLicencia.textContent =
        "Licencia válida";


    btnGenerar.disabled = false;

    btnGenerar.textContent =
        "Generar todos los códigos";


    console.log(
        "Licencia validada:",
        datosLicencia
    );

}


// ========================================
// CAMBIO DE TAMAÑO
// ========================================

tamanoCodigo.addEventListener(
    "change",
    () => {

        if (
            tamanoCodigo.value ===
            "personalizado"
        ) {

            opcionesPersonalizadas.classList.remove(
                "oculto"
            );

        } else {

            opcionesPersonalizadas.classList.add(
                "oculto"
            );

        }

    }
);


// ========================================
// AGREGAR REGISTRO
// ========================================

btnAgregar.addEventListener(
    "click",
    agregarRegistro
);


function agregarRegistro() {

    const numero =
        listaRegistros.children.length + 1;


    const registro =
        document.createElement("div");

    registro.className =
        "registro";


    registro.innerHTML = `

        <div class="registro-cabecera">

            <span class="registro-numero">
                Código ${numero}
            </span>

            <button
                type="button"
                class="btn-eliminar"
                title="Eliminar código"
            >
                ×
            </button>

        </div>


        <div class="campo">

            <label>
                Usuario
            </label>

            <input
                type="text"
                class="usuario"
                placeholder="Ejemplo: JUAN01"
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
                placeholder="Ejemplo: ABC123"
                autocomplete="off"
            >

        </div>


        <div class="campo">

            <label>
                Información adicional
            </label>

            <input
                type="text"
                class="informacion"
                placeholder="Opcional"
                autocomplete="off"
            >

        </div>

    `;


    const btnEliminar =
        registro.querySelector(
            ".btn-eliminar"
        );


    btnEliminar.addEventListener(
        "click",
        () => {

            registro.remove();

            renumerarRegistros();

        }
    );


    listaRegistros.appendChild(
        registro
    );

}


// ========================================
// RENUMERAR REGISTROS
// ========================================

function renumerarRegistros() {

    const registros =
        listaRegistros.querySelectorAll(
            ".registro"
        );


    registros.forEach(
        (registro, indice) => {

            const numero =
                registro.querySelector(
                    ".registro-numero"
                );

            numero.textContent =
                `Código ${indice + 1}`;

        }
    );

}


// ========================================
// OBTENER CONFIGURACIÓN
// ========================================

function obtenerConfiguracionTamano() {

    const seleccion =
        tamanoCodigo.value;


    if (
        seleccion ===
        "personalizado"
    ) {

        return {

            anchoCm:
                obtenerNumero(
                    anchoEtiqueta.value,
                    5
                ),

            altoCm:
                obtenerNumero(
                    altoEtiqueta.value,
                    1.5
                ),

            altoBarrasCm:
                obtenerNumero(
                    altoBarras.value,
                    1
                ),

            fontSize:
                obtenerNumero(
                    tamanoTexto.value,
                    10
                )

        };

    }


    return configuracionesTamano[
        seleccion
    ];

}


// ========================================
// OBTENER NÚMERO
// ========================================

function obtenerNumero(
    valor,
    valorDefecto
) {

    const numero =
        Number(valor);


    if (
        !Number.isFinite(numero) ||
        numero <= 0
    ) {

        return valorDefecto;

    }


    return numero;

}


// ========================================
// CONVERTIR CM A PIXELES
// ========================================

function cmAPixeles(cm, dpi = 300) {

    return Math.round(
        cm *
        dpi /
        2.54
    );

}


// ========================================
// GENERAR TODOS
// ========================================

btnGenerar.addEventListener(
    "click",
    generarTodos
);


async function generarTodos() {

    // ====================================
    // COMPROBAR LICENCIA
    // ====================================

    if (!licenciaValida) {

        alert(
            "La licencia no es válida. " +
            "No es posible generar códigos."
        );

        return;

    }


    const registros =
        listaRegistros.querySelectorAll(
            ".registro"
        );


    if (
        registros.length === 0
    ) {

        alert(
            "Agrega al menos un código."
        );

        return;

    }


    const configuracion =
        obtenerConfiguracionTamano();


    const datos = [];


    // ====================================
    // LEER REGISTROS
    // ====================================

    for (
        let i = 0;
        i < registros.length;
        i++
    ) {

        const registro =
            registros[i];


        const usuario =
            registro
                .querySelector(".usuario")
                .value
                .trim();


        const contrasena =
            registro
                .querySelector(".contrasena")
                .value
                .trim();


        const informacion =
            registro
                .querySelector(".informacion")
                .value
                .trim();


        // =================================
        // VALIDAR USUARIO
        // =================================

        if (
            !usuario
        ) {

            alert(
                `Escribe el usuario del código ${i + 1}.`
            );


            registro
                .querySelector(".usuario")
                .focus();


            return;

        }


        // =================================
        // VALIDAR CONTRASEÑA
        // =================================

        if (
            !contrasena
        ) {

            alert(
                `Escribe la contraseña del código ${i + 1}.`
            );


            registro
                .querySelector(".contrasena")
                .focus();


            return;

        }


        datos.push({

            usuario,

            contrasena,

            informacion

        });

    }


    // ====================================
    // COMPROBAR DISPONIBLES
    // ====================================

    if (
        datosLicencia &&
        datosLicencia.limiteCodigos > 0
    ) {

        const disponibles =
            datosLicencia.limiteCodigos -
            datosLicencia.codigosGenerados;


        if (
            datos.length >
            disponibles
        ) {

            alert(

                "No hay suficientes códigos disponibles " +
                "en la licencia.\n\n" +

                `Disponibles: ${disponibles}\n` +

                `Solicitados: ${datos.length}`

            );

            return;

        }

    }


    // ====================================
    // DESACTIVAR BOTÓN
    // ====================================

    btnGenerar.disabled = true;

    btnGenerar.textContent =
        "Registrando generación...";


    // ====================================
    // REGISTRAR EN FIRESTORE
    // ====================================

    const resultado =
        await registrarCodigosGenerados(
            datos.length
        );


    // ====================================
    // SI FIRESTORE RECHAZA
    // ====================================

    if (
        !resultado.correcto
    ) {

        btnGenerar.disabled = false;

        btnGenerar.textContent =
            "Generar todos los códigos";


        alert(
            resultado.motivo
        );


        // =================================
        // VOLVER A COMPROBAR LICENCIA
        // =================================

        const licenciaActualizada =
            await validarLicencia();


        if (
            licenciaActualizada.valida
        ) {

            datosLicencia =
                licenciaActualizada;

            licenciaValida =
                true;

        } else {

            licenciaValida =
                false;

            datosLicencia =
                null;

            estadoLicencia.textContent =
                "Licencia no válida";

            btnGenerar.disabled =
                true;

            btnGenerar.textContent =
                "Generación bloqueada";

        }


        return;

    }


    // ====================================
    // ACTUALIZAR CONTADOR LOCAL
    // ====================================

    datosLicencia.codigosGenerados =
        resultado.codigosGenerados;


    // ====================================
    // GENERAR VISTA
    // ====================================

    contenedorCodigos.innerHTML =
        "";


    mensajeInicial.classList.add(
        "oculto"
    );


    acciones.classList.remove(
        "oculto"
    );


    datos.forEach(
        (dato, indice) => {

            crearEtiqueta(
                dato,
                indice + 1,
                configuracion
            );

        }
    );


    // ====================================
    // ACTUALIZAR ESTADO
    // ====================================

    if (
        datosLicencia.limiteCodigos > 0
    ) {

        const restantes =
            datosLicencia.limiteCodigos -
            datosLicencia.codigosGenerados;


        estadoLicencia.textContent =
            `Licencia válida · ${restantes} códigos disponibles`;


        // =================================
        // LLEGÓ AL LÍMITE
        // =================================

        if (
            restantes <= 0
        ) {

            licenciaValida =
                false;


            btnGenerar.disabled =
                true;


            btnGenerar.textContent =
                "Límite alcanzado";


            alert(
                "Los códigos fueron generados correctamente.\n\n" +
                "La licencia ha alcanzado su límite de códigos."
            );


            return;

        }

    }


    // ====================================
    // RESTAURAR BOTÓN
    // ====================================

    btnGenerar.disabled =
        false;


    btnGenerar.textContent =
        "Generar todos los códigos";

}


// ========================================
// CREAR ETIQUETA
// ========================================

function crearEtiqueta(
    dato,
    numero,
    configuracion
) {

    const contenedor =
        document.createElement("div");

    contenedor.className =
        "etiqueta-contenedor";


    const etiqueta =
        document.createElement("div");

    etiqueta.className =
        "etiqueta-codigo";


    etiqueta.style.width =
        `${configuracion.anchoCm}cm`;


    etiqueta.style.height =
        `${configuracion.altoCm}cm`;


    const svg =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );


    svg.classList.add(
        "codigo-svg"
    );


    etiqueta.appendChild(
        svg
    );


    // ====================================
    // INFORMACIÓN VISIBLE
    // ====================================

    const informacionVisible =
        document.createElement("div");

    informacionVisible.className =
        "informacion-visible";


    let textoVisible =
        `Usuario: ${dato.usuario} | Contraseña: ${dato.contrasena}`;


    if (
        dato.informacion
    ) {

        textoVisible +=
            ` | ${dato.informacion}`;

    }


    informacionVisible.textContent =
        textoVisible;


    etiqueta.appendChild(
        informacionVisible
    );


    // ====================================
    // CONTENIDO DEL CÓDIGO
    // ====================================

    let contenido =
        dato.usuario +
        "\t" +
        dato.contrasena;


    if (
        dato.informacion
    ) {

        contenido +=
            "\n" +
            dato.informacion;

    }


    // ====================================
    // GENERAR BARCODE
    // ====================================

    const altoBarrasPixeles =
        cmAPixeles(
            configuracion.altoBarrasCm,
            96
        );


    JsBarcode(
        svg,
        contenido,
        {

            format: "CODE128",

            width: 2,

            height:
                altoBarrasPixeles,

            displayValue: true,

            fontSize:
                configuracion.fontSize,

            textMargin: 3,

            margin: 0,

            background: "#ffffff",

            lineColor: "#111111"

        }
    );


    svg.style.width =
        "100%";


    svg.style.height =
        `${configuracion.altoBarrasCm}cm`;


    svg.style.objectFit =
        "fill";


    // ====================================
    // BOTÓN PNG
    // ====================================

    const btnDescargar =
        document.createElement("button");


    btnDescargar.type =
        "button";


    btnDescargar.className =
        "btn-descargar-png";


    btnDescargar.textContent =
        "Descargar PNG";


    btnDescargar.addEventListener(
        "click",
        () => {

            descargarPNG(
                dato,
                numero,
                configuracion
            );

        }
    );


    contenedor.appendChild(
        etiqueta
    );


    contenedor.appendChild(
        btnDescargar
    );


    contenedorCodigos.appendChild(
        contenedor
    );

}


// ========================================
// DESCARGAR PNG
// SOLO LAS BARRAS DEL CÓDIGO
// ========================================

function descargarPNG(
    dato,
    numero,
    configuracion
) {

    // =====================================
    // RECONSTRUIR EL CONTENIDO
    // =====================================

    let contenido =
        dato.usuario +
        "\t" +
        dato.contrasena;


    if (
        dato.informacion
    ) {

        contenido +=
            "\n" +
            dato.informacion;

    }


    // =====================================
    // TAMAÑO FINAL DEL PNG
    // 300 DPI
    // =====================================

    const anchoPx =
        cmAPixeles(
            configuracion.anchoCm,
            300
        );


    const altoPx =
        cmAPixeles(
            configuracion.altoCm,
            300
        );


    const altoBarrasPx =
        cmAPixeles(
            configuracion.altoBarrasCm,
            300
        );


    // =====================================
    // CREAR SVG EXCLUSIVO PARA EL PNG
    // =====================================

    const svgPNG =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );


    svgPNG.setAttribute(
        "xmlns",
        "http://www.w3.org/2000/svg"
    );


    svgPNG.setAttribute(
        "width",
        anchoPx
    );


    svgPNG.setAttribute(
        "height",
        altoPx
    );


    svgPNG.setAttribute(
        "viewBox",
        `0 0 ${anchoPx} ${altoPx}`
    );


    // =====================================
    // FONDO BLANCO
    // =====================================

    const fondo =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
        );


    fondo.setAttribute(
        "x",
        "0"
    );


    fondo.setAttribute(
        "y",
        "0"
    );


    fondo.setAttribute(
        "width",
        anchoPx
    );


    fondo.setAttribute(
        "height",
        altoPx
    );


    fondo.setAttribute(
        "fill",
        "#ffffff"
    );


    svgPNG.appendChild(
        fondo
    );


    // =====================================
    // SVG DEL CÓDIGO DE BARRAS
    // =====================================

    const barcode =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );


    barcode.setAttribute(
        "x",
        "0"
    );


    barcode.setAttribute(
        "y",
        Math.round(
            (
                altoPx -
                altoBarrasPx
            ) / 2
        )
    );


    barcode.setAttribute(
        "width",
        anchoPx
    );


    barcode.setAttribute(
        "height",
        altoBarrasPx
    );


    svgPNG.appendChild(
        barcode
    );


    // =====================================
    // GENERAR SOLO LAS BARRAS
    // =====================================

    JsBarcode(
        barcode,
        contenido,
        {

            format: "CODE128",

            width: 2,

            height:
                altoBarrasPx,

            displayValue: false,

            margin: 0,

            background: "#ffffff",

            lineColor: "#111111"

        }
    );


    // =====================================
    // SERIALIZAR SVG
    // =====================================

    const svgString =
        new XMLSerializer()
            .serializeToString(
                svgPNG
            );


    const svgBlob =
        new Blob(
            [svgString],
            {
                type:
                    "image/svg+xml;charset=utf-8"
            }
        );


    const svgUrl =
        URL.createObjectURL(
            svgBlob
        );


    const imagen =
        new Image();


    imagen.onload =
        () => {

            // =================================
            // CANVAS FINAL
            // =================================

            const canvas =
                document.createElement(
                    "canvas"
                );


            canvas.width =
                anchoPx;


            canvas.height =
                altoPx;


            const contexto =
                canvas.getContext(
                    "2d"
                );


            // =================================
            // FONDO BLANCO
            // =================================

            contexto.fillStyle =
                "#ffffff";


            contexto.fillRect(
                0,
                0,
                anchoPx,
                altoPx
            );


            // =================================
            // DIBUJAR SOLO EL BARCODE
            // =================================

            contexto.drawImage(

                imagen,

                0,

                0,

                anchoPx,

                altoPx

            );


            // =================================
            // CREAR PNG
            // =================================

            canvas.toBlob(

                (pngBlob) => {

                    if (!pngBlob) {

                        alert(
                            "No fue posible generar el archivo PNG."
                        );

                        URL.revokeObjectURL(
                            svgUrl
                        );

                        return;

                    }


                    const enlace =
                        document.createElement(
                            "a"
                        );


                    const nombreUsuario =
                        limpiarNombreArchivo(
                            dato.usuario
                        );


                    const pngUrl =
                        URL.createObjectURL(
                            pngBlob
                        );


                    enlace.href =
                        pngUrl;


                    enlace.download =
                        `PassBar_${nombreUsuario}_${numero}.png`;


                    document.body.appendChild(
                        enlace
                    );


                    enlace.click();


                    enlace.remove();


                    URL.revokeObjectURL(
                        pngUrl
                    );


                    URL.revokeObjectURL(
                        svgUrl
                    );

                },

                "image/png"

            );

        };


    imagen.onerror =
        () => {

            URL.revokeObjectURL(
                svgUrl
            );


            alert(
                "No fue posible convertir el código a PNG."
            );

        };


    imagen.src =
        svgUrl;

}


// ========================================
// LIMPIAR NOMBRE DE ARCHIVO
// ========================================

function limpiarNombreArchivo(
    nombre
) {

    return nombre
        .replace(
            /[^a-zA-Z0-9_-]/g,
            "_"
        )
        .substring(
            0,
            40
        );

}


// ========================================
// LIMPIAR VISTA
// ========================================

btnLimpiar.addEventListener(
    "click",
    () => {

        contenedorCodigos.innerHTML =
            "";

        acciones.classList.add(
            "oculto"
        );

        mensajeInicial.classList.remove(
            "oculto"
        );

    }
);


// ========================================
// IMPRIMIR
// ========================================

btnImprimir.addEventListener(
    "click",
    () => {

        window.print();

    }
);

