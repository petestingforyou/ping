
/* =====================================================
LECTOR DE LOTES
VERSION 2
ESCANEO INDIVIDUAL
ELIMINACION INDIVIDUAL Y MASIVA DE LOTES
===================================================== */

/* =====================================================
VARIABLES
===================================================== */

let lector = null;
let escanerActivo = false;
let escaneoProcesado = false;

let lotes = [];

try {
    const lotesGuardados = JSON.parse(
        localStorage.getItem("lectorLotes")
    );

    lotes = Array.isArray(lotesGuardados)
        ? lotesGuardados
        : [];
} catch (error) {
    console.error("Error leyendo los lotes guardados:", error);
    lotes = [];
}

let loteActual = [];
let loteActualNombre = "";
let indiceRevision = 0;

/* =====================================================
ELEMENTOS
===================================================== */

const pantallaPrincipal =
    document.getElementById("pantallaPrincipal");

const pantallaNuevoLote =
    document.getElementById("pantallaNuevoLote");

const pantallaRevision =
    document.getElementById("pantallaRevision");

const btnNuevoLote =
    document.getElementById("btnNuevoLote");

const btnVolverPrincipal =
    document.getElementById("btnVolverPrincipal");

const btnVolverLotes =
    document.getElementById("btnVolverLotes");

const btnIniciarEscaneo =
    document.getElementById("btnIniciarEscaneo");

const btnCancelarEscaneo =
    document.getElementById("btnCancelarEscaneo");

const btnGuardarLote =
    document.getElementById("btnGuardarLote");

const btnSiguiente =
    document.getElementById("btnSiguiente");

const btnRegresarLotesFinalizado =
    document.getElementById("btnRegresarLotesFinalizado");

const nombreLote =
    document.getElementById("nombreLote");

const listaLotes =
    document.getElementById("listaLotes");

const listaEscaneados =
    document.getElementById("listaEscaneados");

const contadorEscaneos =
    document.getElementById("contadorEscaneos");

const estadoEscaner =
    document.getElementById("estadoEscaner");

const mensajeEscaneo =
    document.getElementById("mensajeEscaneo");

const lectorCamara =
    document.getElementById("lectorCamara");

const tituloLoteRevision =
    document.getElementById("tituloLoteRevision");

const progresoRevision =
    document.getElementById("progresoRevision");

const numeroProductoActual =
    document.getElementById("numeroProductoActual");

const codigoBarrasRevision =
    document.getElementById("codigoBarrasRevision");

const informacionRepeticion =
    document.getElementById("informacionRepeticion");

const contenedorRevision =
    document.getElementById("contenedorRevision");

const pantallaFinalizado =
    document.getElementById("pantallaFinalizado");

const mensaje =
    document.getElementById("mensaje");

/* =====================================================
ESTILOS DE ELIMINACION
Se agregan desde JavaScript para no modificar CSS.
===================================================== */

function agregarEstilosEliminacion() {
    if (document.getElementById("estilosEliminacionLotes")) {
        return;
    }

    const estilos = document.createElement("style");
    estilos.id = "estilosEliminacionLotes";

    estilos.textContent = `
        .acciones-lotes {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 10px;
            margin: 0 0 16px;
            flex-wrap: wrap;
        }

        .contador-lotes {
            margin-right: auto;
            font-size: 14px;
            opacity: 0.8;
        }

        .btn-eliminar-lote,
        .btn-borrar-todos-lotes {
            border: none;
            border-radius: 9px;
            padding: 10px 14px;
            font: inherit;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s ease,
                        transform 0.2s ease,
                        opacity 0.2s ease;
        }

        .btn-eliminar-lote {
            color: #b42318;
            background: #fff0ee;
            white-space: nowrap;
            flex-shrink: 0;
        }

        .btn-eliminar-lote:hover {
            background: #ffdcd7;
            transform: translateY(-1px);
        }

        .btn-borrar-todos-lotes {
            color: #ffffff;
            background: #b42318;
        }

        .btn-borrar-todos-lotes:hover {
            background: #8f1d14;
            transform: translateY(-1px);
        }

        .btn-eliminar-lote:focus-visible,
        .btn-borrar-todos-lotes:focus-visible {
            outline: 3px solid #8bbcff;
            outline-offset: 3px;
        }

        .lote-contenido {
            min-width: 0;
            flex: 1;
            overflow-wrap: anywhere;
        }

        .lote-acciones {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-left: 12px;
        }

        @media (max-width: 480px) {
            .acciones-lotes {
                align-items: stretch;
            }

            .contador-lotes {
                width: 100%;
                margin-bottom: 4px;
            }

            .btn-borrar-todos-lotes {
                width: 100%;
            }

            .btn-eliminar-lote {
                padding: 9px 10px;
                font-size: 12px;
            }

            .lote-acciones {
                gap: 5px;
                margin-left: 6px;
            }
        }
    `;

    document.head.appendChild(estilos);
}

/* =====================================================
BARRA DE ACCIONES DE LOTES
===================================================== */

function prepararAccionesLotes() {
    if (!listaLotes || !listaLotes.parentNode) {
        return;
    }

    agregarEstilosEliminacion();

    let acciones = document.getElementById("accionesLotes");

    if (!acciones) {
        acciones = document.createElement("div");
        acciones.id = "accionesLotes";
        acciones.className = "acciones-lotes";

        const contador = document.createElement("span");
        contador.id = "contadorLotes";
        contador.className = "contador-lotes";

        const btnBorrarTodos = document.createElement("button");
        btnBorrarTodos.id = "btnBorrarTodosLotes";
        btnBorrarTodos.type = "button";
        btnBorrarTodos.className = "btn-borrar-todos-lotes";
        btnBorrarTodos.textContent = "🗑 Borrar todos los lotes";

        btnBorrarTodos.addEventListener(
            "click",
            borrarTodosLosLotes
        );

        acciones.appendChild(contador);
        acciones.appendChild(btnBorrarTodos);

        listaLotes.parentNode.insertBefore(
            acciones,
            listaLotes
        );
    }
}

/* =====================================================
INICIO
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    prepararAccionesLotes();
    mostrarLotes();
});

/* =====================================================
CAMBIO DE PANTALLA
===================================================== */

function mostrarPantalla(pantalla) {
    pantallaPrincipal.classList.remove("activa");
    pantallaNuevoLote.classList.remove("activa");
    pantallaRevision.classList.remove("activa");

    pantalla.classList.add("activa");
}

/* =====================================================
NUEVO LOTE
===================================================== */

btnNuevoLote.addEventListener("click", () => {
    prepararNuevoLote();
    mostrarPantalla(pantallaNuevoLote);
});

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

btnVolverPrincipal.addEventListener("click", () => {
    detenerEscaneo();
    mostrarPantalla(pantallaPrincipal);
});

/* =====================================================
VOLVER LOTES
===================================================== */

btnVolverLotes.addEventListener("click", () => {
    mostrarPantalla(pantallaPrincipal);

    pantallaFinalizado.classList.add("oculto");
    contenedorRevision.classList.remove("oculto");
});

btnRegresarLotesFinalizado.addEventListener("click", () => {
    mostrarPantalla(pantallaPrincipal);

    pantallaFinalizado.classList.add("oculto");
    contenedorRevision.classList.remove("oculto");
});

/* =====================================================
INICIAR ESCANEO
===================================================== */

btnIniciarEscaneo.addEventListener("click", iniciarEscaneo);

async function iniciarEscaneo() {
    if (escanerActivo) {
        return;
    }

    escaneoProcesado = false;

    try {
        lector = new Html5Qrcode("lectorCamara");

        const configuracion = {
            fps: 10,

            qrbox: function (ancho, alto) {
                const anchoCaja = Math.floor(ancho * 0.85);

                const altoCaja = Math.floor(
                    Math.min(180, alto * 0.45)
                );

                return {
                    width: anchoCaja,
                    height: altoCaja
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

        lectorCamara.classList.add("activo");

        await lector.start(
            { facingMode: "environment" },
            configuracion,
            codigoDetectado,
            errorLectura
        );

        escanerActivo = true;

        btnIniciarEscaneo.disabled = true;
        btnCancelarEscaneo.disabled = false;

        estadoEscaner.textContent = "Escaneando";

        estadoEscaner.classList.remove("estado-detenido");
        estadoEscaner.classList.add("estado-activo");

        mensajeEscaneo.textContent =
            "Apunta la cámara al código de barras.";

    } catch (error) {
        console.error("Error iniciando cámara:", error);

        lector = null;
        escanerActivo = false;

        lectorCamara.classList.remove("activo");

        btnIniciarEscaneo.disabled = false;
        btnCancelarEscaneo.disabled = true;

        mostrarMensaje(
            "No fue posible iniciar la cámara. Revisa los permisos del navegador."
        );
    }
}

/* =====================================================
CODIGO DETECTADO
===================================================== */

async function codigoDetectado(texto, resultado) {
    if (escaneoProcesado) {
        return;
    }

    const codigo = String(texto).trim();

    if (!codigo) {
        return;
    }

    escaneoProcesado = true;

    realizarConfirmacion();
    agregarCodigo(codigo);

    await detenerEscaneo();

    mensajeEscaneo.textContent =
        "✅ Producto agregado. Pulsa «Escanear producto» para continuar.";
}

/* =====================================================
CONFIRMACION
===================================================== */

function realizarConfirmacion() {
    if ("vibrate" in navigator) {
        navigator.vibrate(180);
    }

    mostrarMensaje("✓ Código detectado");
}

/* =====================================================
ERROR DE LECTURA
===================================================== */

function errorLectura(error) {
    // Los errores de lectura continua no necesitan mostrarse.
}

/* =====================================================
AGREGAR CODIGO
===================================================== */

function agregarCodigo(codigo) {
    const existente = loteActual.find(
        producto => producto.codigo === codigo
    );

    if (existente) {
        existente.cantidad++;

        mostrarMensaje(
            `Código repetido: ${existente.cantidad} veces`
        );
    } else {
        loteActual.push({
            codigo: codigo,
            cantidad: 1
        });

        mostrarMensaje("Código agregado");
    }

    actualizarListaEscaneados();
}

/* =====================================================
ACTUALIZAR LISTA ESCANEADOS
===================================================== */

function actualizarListaEscaneados() {
    const total = loteActual.reduce(
        (suma, producto) => suma + producto.cantidad,
        0
    );

    contadorEscaneos.textContent =
        `${total} productos escaneados · ${loteActual.length} códigos diferentes`;

    if (loteActual.length === 0) {
        listaEscaneados.innerHTML = `
            <div class="sin-productos">
                Todavía no has escaneado productos.
            </div>
        `;

        return;
    }

    listaEscaneados.innerHTML = "";

    loteActual.forEach(producto => {
        const elemento = document.createElement("div");

        elemento.className = "producto-escaneado";

        if (producto.cantidad > 1) {
            elemento.classList.add("producto-repetido");
        }

        elemento.innerHTML = `
            <div class="producto-codigo">
                ${escaparHTML(producto.codigo)}
            </div>

            <div class="producto-cantidad">
                ${producto.cantidad}
            </div>
        `;

        listaEscaneados.appendChild(elemento);
    });
}

/* =====================================================
DETENER ESCANEO
===================================================== */

btnCancelarEscaneo.addEventListener("click", () => {
    detenerEscaneo();

    mensajeEscaneo.textContent =
        "Escaneo cancelado. Pulsa «Escanear producto» para comenzar.";
});

async function detenerEscaneo() {
    if (!lector) {
        escanerActivo = false;

        lectorCamara.classList.remove("activo");

        btnIniciarEscaneo.disabled = false;
        btnCancelarEscaneo.disabled = true;

        return;
    }

    try {
        if (escanerActivo) {
            await lector.stop();
        }
    } catch (error) {
        console.warn("Error al detener cámara:", error);
    }

    try {
        lector.clear();
    } catch (error) {
        console.warn("Error limpiando lector:", error);
    }

    lector = null;
    escanerActivo = false;

    lectorCamara.classList.remove("activo");

    btnIniciarEscaneo.disabled = false;
    btnCancelarEscaneo.disabled = true;

    estadoEscaner.textContent = "Listo";

    estadoEscaner.classList.remove("estado-activo");
    estadoEscaner.classList.add("estado-detenido");
}

/* =====================================================
GUARDAR LOTE
===================================================== */

btnGuardarLote.addEventListener("click", guardarLote);

function guardarLote() {
    const nombre = nombreLote.value.trim();

    if (!nombre) {
        mostrarMensaje("Escribe un nombre para el lote.");
        nombreLote.focus();
        return;
    }

    if (loteActual.length === 0) {
        mostrarMensaje(
            "Escanea al menos un producto antes de guardar."
        );

        return;
    }

    detenerEscaneo();

    const totalProductos = loteActual.reduce(
        (suma, producto) => suma + producto.cantidad,
        0
    );

    const lote = {
        id: Date.now().toString(),

        nombre: nombre,

        fecha: new Date().toISOString(),

        totalProductos: totalProductos,

        totalCodigos: loteActual.length,

        productos: JSON.parse(JSON.stringify(loteActual))
    };

    lotes.unshift(lote);

    if (!guardarLotesEnAlmacenamiento()) {
        lotes.shift();

        mostrarMensaje(
            "No se pudo guardar el lote en el navegador."
        );

        return;
    }

    loteActual = [];
    nombreLote.value = "";

    mostrarLotes();
    mostrarPantalla(pantallaPrincipal);

    mostrarMensaje("Lote guardado correctamente.");
}

/* =====================================================
GUARDAR LOTES EN LOCALSTORAGE
===================================================== */

function guardarLotesEnAlmacenamiento() {
    try {
        localStorage.setItem(
            "lectorLotes",
            JSON.stringify(lotes)
        );

        return true;
    } catch (error) {
        console.error("Error guardando lotes:", error);
        return false;
    }
}

/* =====================================================
MOSTRAR LOTES
===================================================== */

function mostrarLotes() {
    if (!listaLotes) {
        return;
    }

    prepararAccionesLotes();

    const contador = document.getElementById("contadorLotes");
    const btnBorrarTodos = document.getElementById(
        "btnBorrarTodosLotes"
    );

    if (contador) {
        contador.textContent = lotes.length === 1
            ? "1 lote guardado"
            : `${lotes.length} lotes guardados`;
    }

    if (btnBorrarTodos) {
        btnBorrarTodos.style.display =
            lotes.length > 0 ? "inline-block" : "none";
    }

    if (lotes.length === 0) {
        listaLotes.innerHTML = `
            <div class="sin-lotes">
                <div class="icono-vacio">📦</div>
                <p>Aún no tienes lotes guardados.</p>
            </div>
        `;

        return;
    }

    listaLotes.innerHTML = "";

    lotes.forEach(lote => {
        const elemento = document.createElement("div");

        elemento.className = "lote";

        const fecha = lote.fecha
            ? new Date(lote.fecha).toLocaleString("es-MX")
            : "Fecha no disponible";

        const contenido = document.createElement("div");
        contenido.className = "lote-contenido";

        const titulo = document.createElement("h3");
        titulo.textContent = lote.nombre || "Lote sin nombre";

        const resumen = document.createElement("p");
        resumen.textContent =
            `${Number(lote.totalCodigos) || 0} códigos diferentes · ` +
            `${Number(lote.totalProductos) || 0} escaneos`;

        const fechaTexto = document.createElement("p");
        fechaTexto.textContent = fecha;

        contenido.appendChild(titulo);
        contenido.appendChild(resumen);
        contenido.appendChild(fechaTexto);

        const acciones = document.createElement("div");
        acciones.className = "lote-acciones";

        const btnEliminar = document.createElement("button");
        btnEliminar.type = "button";
        btnEliminar.className = "btn-eliminar-lote";
        btnEliminar.textContent = "🗑 Eliminar";
        btnEliminar.setAttribute(
            "aria-label",
            `Eliminar lote ${lote.nombre || ""}`
        );

        btnEliminar.addEventListener("click", evento => {
            evento.stopPropagation();
            eliminarLote(lote.id);
        });

        const flecha = document.createElement("div");
        flecha.className = "lote-flecha";
        flecha.textContent = "→";

        acciones.appendChild(btnEliminar);
        acciones.appendChild(flecha);

        elemento.appendChild(contenido);
        elemento.appendChild(acciones);

        elemento.addEventListener("click", () => {
            abrirLote(lote.id);
        });

        listaLotes.appendChild(elemento);
    });
}

/* =====================================================
ELIMINAR UN LOTE
===================================================== */

function eliminarLote(id) {
    const lote = lotes.find(elemento => elemento.id === id);

    if (!lote) {
        mostrarMensaje("No se encontró el lote que deseas eliminar.");
        return;
    }

    const confirmar = window.confirm(
        `¿Seguro que deseas eliminar el lote "${lote.nombre}"?\n\n` +
        "Esta acción no se puede deshacer."
    );

    if (!confirmar) {
        return;
    }

    const lotesAnteriores = lotes;

    lotes = lotes.filter(elemento => elemento.id !== id);

    if (!guardarLotesEnAlmacenamiento()) {
        lotes = lotesAnteriores;

        mostrarMensaje(
            "No se pudo eliminar el lote. Inténtalo nuevamente."
        );

        return;
    }

    mostrarLotes();

    mostrarMensaje(
        `Lote "${lote.nombre}" eliminado correctamente.`
    );
}

/* =====================================================
ELIMINAR TODOS LOS LOTES
===================================================== */

function borrarTodosLosLotes() {
    if (lotes.length === 0) {
        mostrarMensaje("No hay lotes guardados para eliminar.");
        return;
    }

    const cantidad = lotes.length;

    const confirmar = window.confirm(
        `¿Seguro que deseas eliminar TODOS los lotes guardados?\n\n` +
        `Se eliminarán ${cantidad} ${cantidad === 1 ? "lote" : "lotes"}.\n\n` +
        "Esta acción no se puede deshacer."
    );

    if (!confirmar) {
        return;
    }

    const lotesAnteriores = lotes;

    lotes = [];

    if (!guardarLotesEnAlmacenamiento()) {
        lotes = lotesAnteriores;

        mostrarMensaje(
            "No se pudieron eliminar los lotes. Inténtalo nuevamente."
        );

        return;
    }

    mostrarLotes();

    mostrarMensaje(
        `Se eliminaron ${cantidad} ${cantidad === 1 ? "lote" : "lotes"}.`
    );
}

/* =====================================================
ABRIR LOTE
===================================================== */

function abrirLote(id) {
    const lote = lotes.find(elemento => elemento.id === id);

    if (!lote) {
        mostrarMensaje("No se encontró el lote.");
        return;
    }

    if (!lote.productos || lote.productos.length === 0) {
        mostrarMensaje("Este lote no contiene códigos.");
        return;
    }

    loteActualNombre = lote.nombre;

    loteActual = JSON.parse(
        JSON.stringify(lote.productos)
    );

    indiceRevision = 0;

    tituloLoteRevision.textContent = loteActualNombre;

    pantallaFinalizado.classList.add("oculto");
    contenedorRevision.classList.remove("oculto");

    mostrarPantalla(pantallaRevision);
    mostrarCodigoRevision();
}

/* =====================================================
MOSTRAR CODIGO DE REVISION
===================================================== */

function mostrarCodigoRevision() {
    if (indiceRevision >= loteActual.length) {
        finalizarRevision();
        return;
    }

    const producto = loteActual[indiceRevision];

    const numero = indiceRevision + 1;
    const total = loteActual.length;

    numeroProductoActual.textContent = numero;
    progresoRevision.textContent = `Código ${numero} de ${total}`;

    informacionRepeticion.className = "informacion-repeticion";

    if (producto.cantidad > 1) {
        informacionRepeticion.textContent =
            `Repetido ${producto.cantidad} veces`;

        informacionRepeticion.classList.add("repetido");
    } else {
        informacionRepeticion.textContent = "";
    }

    codigoBarrasRevision.innerHTML = "";

    try {
        generarCodigoSVG(producto.codigo);
    } catch (error) {
        console.error("Error generando código:", error);

        mostrarMensaje(
            `No se pudo generar el código ${producto.codigo}`
        );
    }
}

/* =====================================================
GENERAR SVG
===================================================== */

function generarCodigoSVG(codigo) {
    const formato = detectarFormatoCodigo(codigo);

    JsBarcode(
        codigoBarrasRevision,
        codigo,
        {
            format: formato,
            lineColor: "#000000",
            background: "#ffffff",
            width: 3,
            height: 150,
            margin: 10,
            displayValue: false,
            flat: false
        }
    );
}

/* =====================================================
DETECTAR FORMATO
===================================================== */

function detectarFormatoCodigo(codigo) {
    if (/^\d{13}$/.test(codigo)) {
        return "EAN13";
    }

    if (/^\d{8}$/.test(codigo)) {
        return "EAN8";
    }

    if (/^\d{12}$/.test(codigo)) {
        return "UPC";
    }

    return "CODE128";
}

/* =====================================================
SIGUIENTE
===================================================== */

btnSiguiente.addEventListener("click", () => {
    indiceRevision++;
    mostrarCodigoRevision();
});

/* =====================================================
FINALIZAR
===================================================== */

function finalizarRevision() {
    contenedorRevision.classList.add("oculto");
    pantallaFinalizado.classList.remove("oculto");
}

/* =====================================================
MENSAJE
===================================================== */

let temporizadorMensaje = null;

function mostrarMensaje(texto) {
    mensaje.textContent = texto;

    mensaje.classList.add("mostrar");

    clearTimeout(temporizadorMensaje);

    temporizadorMensaje = setTimeout(() => {
        mensaje.classList.remove("mostrar");
    }, 2200);
}

/* =====================================================
SEGURIDAD HTML
===================================================== */

function escaparHTML(texto) {
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =====================================================
RESPALDO Y RESTAURACION DE LOTES
LOTES-SCANNER-01
===================================================== */

function inicializarRespaldoLotes() {
    const acciones = document.getElementById("accionesLotes");
    const lista = document.getElementById("listaLotes");

    if (!acciones || !lista) {
        console.error("No se encontró el área de lotes.");
        return;
    }

    if (document.getElementById("btnDescargarRespaldo")) {
        return;
    }

    const estilos = document.createElement("style");
    estilos.textContent = `
        .acciones-respaldo {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            width: 100%;
            margin-top: 8px;
        }

        .btn-respaldo {
            flex: 1;
            min-width: 145px;
            padding: 11px 14px;
            border: 0;
            border-radius: 9px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            background: #e8f1ff;
            color: #174ea6;
        }

        .btn-respaldo:hover {
            filter: brightness(0.96);
        }

        .btn-respaldo:focus-visible {
            outline: 3px solid #8bbcff;
            outline-offset: 2px;
        }

        @media (max-width: 420px) {
            .acciones-respaldo {
                flex-direction: column;
            }

            .btn-respaldo {
                width: 100%;
            }
        }
    `;

    document.head.appendChild(estilos);

    const contenedor = document.createElement("div");
    contenedor.className = "acciones-respaldo";

    const btnDescargar = document.createElement("button");
    btnDescargar.id = "btnDescargarRespaldo";
    btnDescargar.type = "button";
    btnDescargar.className = "btn-respaldo";
    btnDescargar.textContent = "⬇ Descargar respaldo";

    const btnCargar = document.createElement("button");
    btnCargar.id = "btnCargarRespaldo";
    btnCargar.type = "button";
    btnCargar.className = "btn-respaldo";
    btnCargar.textContent = "⬆ Cargar respaldo";

    const selector = document.createElement("input");
    selector.type = "file";
    selector.accept = ".json,application/json";
    selector.hidden = true;
    selector.id = "archivoRespaldoLotes";

    btnDescargar.addEventListener("click", descargarRespaldoLotes);

    btnCargar.addEventListener("click", () => {
        selector.click();
    });

    selector.addEventListener("change", async () => {
        const archivo = selector.files && selector.files[0];

        if (!archivo) {
            return;
        }

        try {
            await importarRespaldoLotes(archivo);
        } finally {
            // Permite seleccionar nuevamente el mismo archivo.
            selector.value = "";
        }
    });

    contenedor.appendChild(btnDescargar);
    contenedor.appendChild(btnCargar);

    acciones.appendChild(contenedor);
    acciones.appendChild(selector);
}

/* =====================================================
DESCARGAR RESPALDO
===================================================== */

function descargarRespaldoLotes() {
    try {
        const contenido = {
            aplicacion: "LOTES-SCANNER-01",
            versionRespaldo: 1,
            fechaExportacion: new Date().toISOString(),
            cantidadLotes: lotes.length,
            lotes: lotes
        };

        const archivo = new Blob(
            [JSON.stringify(contenido, null, 2)],
            { type: "application/json;charset=utf-8" }
        );

        const url = URL.createObjectURL(archivo);
        const enlace = document.createElement("a");

        const fecha = new Date().toISOString()
            .replace(/:/g, "-")
            .replace(/\..+/, "");

        enlace.href = url;
        enlace.download = `respaldo-lotes-${fecha}.json`;

        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);

        mostrarMensaje(
            `Respaldo descargado. Lotes incluidos: ${lotes.length}.`
        );
    } catch (error) {
        console.error("Error descargando respaldo:", error);

        mostrarMensaje("No se pudo generar el respaldo.");
    }
}

/* =====================================================
VALIDAR ESTRUCTURA DEL RESPALDO
===================================================== */

function validarRespaldoLotes(datos) {
    if (
        !datos ||
        typeof datos !== "object" ||
        !Array.isArray(datos.lotes)
    ) {
        return false;
    }

    if (
        datos.aplicacion !== "LOTES-SCANNER-01" ||
        datos.versionRespaldo !== 1
    ) {
        return false;
    }

    const ids = new Set();

    for (const lote of datos.lotes) {
        if (
            !lote ||
            typeof lote !== "object" ||
            typeof lote.id !== "string" ||
            !lote.id.trim() ||
            typeof lote.nombre !== "string" ||
            !Array.isArray(lote.productos)
        ) {
            return false;
        }

        if (ids.has(lote.id)) {
            return false;
        }

        ids.add(lote.id);

        for (const producto of lote.productos) {
            if (
                !producto ||
                typeof producto.codigo !== "string" ||
                !producto.codigo.trim() ||
                !Number.isSafeInteger(producto.cantidad) ||
                producto.cantidad < 1
            ) {
                return false;
            }
        }
    }

    return true;
}

/* =====================================================
CARGAR Y RESTAURAR RESPALDO
===================================================== */

async function importarRespaldoLotes(archivo) {
    if (archivo.size > 20 * 1024 * 1024) {
        mostrarMensaje("El archivo supera el límite de 20 MB.");
        return;
    }

    let datos;

    try {
        const texto = await archivo.text();
        datos = JSON.parse(texto);
    } catch (error) {
        mostrarMensaje("El archivo no contiene JSON válido.");
        return;
    }

    if (!validarRespaldoLotes(datos)) {
        mostrarMensaje(
            "El archivo no es un respaldo válido de LOTES-SCANNER-01."
        );
        return;
    }

    const lotesImportados = datos.lotes;

    const modalidad = window.prompt(
        `Respaldo válido: ${lotesImportados.length} lotes.\n\n` +
        "Escribe COMBINAR para conservar tus lotes actuales e incorporar los nuevos.\n\n" +
        "Escribe REEMPLAZAR para sustituir los lotes actuales por los del respaldo.\n\n" +
        "Cancela o deja vacío para no hacer cambios."
    );

    if (!modalidad) {
        mostrarMensaje("Importación cancelada.");
        return;
    }

    const opcion = modalidad.trim().toUpperCase();

    if (opcion !== "COMBINAR" && opcion !== "REEMPLAZAR") {
        mostrarMensaje(
            "Opción no reconocida. Escribe COMBINAR o REEMPLAZAR."
        );
        return;
    }

    let nuevosLotes;

    if (opcion === "COMBINAR") {
        const idsExistentes = new Set(
            lotes.map(lote => lote.id)
        );

        const importables = lotesImportados.filter(
            lote => !idsExistentes.has(lote.id)
        );

        nuevosLotes = [...lotes, ...importables];

        if (importables.length === 0) {
            mostrarMensaje(
                "No hay lotes nuevos para incorporar."
            );
            return;
        }

        const confirmar = window.confirm(
            `Se incorporarán ${importables.length} lotes nuevos.\n` +
            `${lotesImportados.length - importables.length} lotes ` +
            "se omitieron porque sus identificadores ya existen.\n\n" +
            "¿Deseas continuar?"
        );

        if (!confirmar) {
            mostrarMensaje("Importación cancelada.");
            return;
        }
    } else {
        const confirmar = window.confirm(
            `ATENCIÓN: se reemplazarán los ${lotes.length} lotes actuales ` +
            `por los ${lotesImportados.length} lotes del respaldo.\n\n` +
            "Esta acción no se puede deshacer desde la aplicación.\n\n" +
            "Se recomienda descargar un respaldo de los lotes actuales antes de continuar.\n\n" +
            "¿Confirmas que deseas reemplazarlos?"
        );

        if (!confirmar) {
            mostrarMensaje("Importación cancelada.");
            return;
        }

        nuevosLotes = lotesImportados;
    }

    const lotesAnteriores = lotes;

    lotes = nuevosLotes;

    try {
        localStorage.setItem(
            "lectorLotes",
            JSON.stringify(lotes)
        );
    } catch (error) {
        console.error("Error guardando lotes importados:", error);

        lotes = lotesAnteriores;

        mostrarMensaje(
            "No se pudo guardar la importación. Comprueba el espacio disponible."
        );

        return;
    }

    mostrarLotes();

    const cantidadFinal = lotes.length;

    mostrarMensaje(
        `Respaldo restaurado. Ahora tienes ${cantidadFinal} lotes.`
    );
}

/* =====================================================
INICIALIZAR OPCIONES DE RESPALDO
===================================================== */

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        inicializarRespaldoLotes
    );
} else {
    inicializarRespaldoLotes();
}