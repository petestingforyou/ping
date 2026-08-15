import { db } from "./firebase.js";

import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ========================================
// ELEMENTOS HTML
// ========================================

const pantallaUsuario =
    document.getElementById("pantallaUsuario");

const aplicacion =
    document.getElementById("aplicacion");

const usuarioSelect =
    document.getElementById("usuarioSelect");

const btnIniciar =
    document.getElementById("btnIniciar");

const btnReporte =
    document.getElementById("btnReporte");

const btnCambiarUsuario =
    document.getElementById("btnCambiarUsuario");

const usuarioActual =
    document.getElementById("usuarioActual");

const mensajeUsuario =
    document.getElementById("mensajeUsuario");

const codigo =
    document.getElementById("codigo");

const entradaManual =
    document.getElementById("entradaManual");

const btnBuscarManual =
    document.getElementById("btnBuscarManual");

const btnCamara =
    document.getElementById("btnCamara");

const productoEncontrado =
    document.getElementById("productoEncontrado");

const incidenciaContenedor =
    document.getElementById("incidenciaContenedor");

const mensaje =
    document.getElementById("mensaje");


// ========================================
// ESTADO DE LA APLICACIÓN
// ========================================

let usuarioSesion = null;

let html5QrCode = null;

let escaneoEnProceso = false;

let camaraActiva = false;


// ========================================
// INICIO
// ========================================

iniciarAplicacion();


// ========================================
// INICIAR APLICACIÓN
// ========================================

async function iniciarAplicacion() {

    const usuarioGuardado =
        sessionStorage.getItem("usuario");

    if (usuarioGuardado) {

        usuarioSesion = usuarioGuardado;

        mostrarAplicacion();

        return;
    }

    await cargarUsuarios();
}


// ========================================
// CARGAR USUARIOS DESDE FIRESTORE
// ========================================

async function cargarUsuarios() {

    try {

        usuarioSelect.innerHTML = `
            <option value="">
                Selecciona un usuario
            </option>
        `;

        const referencia =
            collection(db, "usuarios");

        const consulta =
            query(
                referencia,
                where("activo", "==", true)
            );

        const resultado =
            await getDocs(consulta);

        resultado.forEach(documento => {

            const datos =
                documento.data();

            if (!datos.nombre) {
                return;
            }

            const opcion =
                document.createElement("option");

            opcion.value =
                datos.nombre;

            opcion.textContent =
                datos.nombre;

            usuarioSelect.appendChild(opcion);

        });

        if (usuarioSelect.options.length === 1) {

            mensajeUsuario.textContent =
                "No existen usuarios activos. " +
                "Agrega primero usuarios en Firestore.";

        } else {

            mensajeUsuario.textContent = "";

        }

    } catch (error) {

        console.error(
            "Error cargando usuarios:",
            error
        );

        mensajeUsuario.textContent =
            "No fue posible cargar los usuarios.";

    }
}


// ========================================
// INICIAR DETECCIONES
// ========================================

btnIniciar.addEventListener(
    "click",
    () => {

        const nombre =
            usuarioSelect.value.trim();

        if (!nombre) {

            mensajeUsuario.textContent =
                "Selecciona un usuario.";

            return;
        }

        usuarioSesion = nombre;

        sessionStorage.setItem(
            "usuario",
            usuarioSesion
        );

        mostrarAplicacion();

    }
);


// ========================================
// MOSTRAR APLICACIÓN
// ========================================

function mostrarAplicacion() {

    pantallaUsuario.classList.add("oculto");

    aplicacion.classList.remove("oculto");

    usuarioActual.textContent =
        usuarioSesion;

    // La cámara ya NO se inicia automáticamente.
    camaraActiva = false;

    html5QrCode = null;

    btnCamara.textContent =
        "📷 Activar cámara";

}


// ========================================
// BOTÓN DE CÁMARA
// ========================================

btnCamara.addEventListener(
    "click",
    async () => {

        if (camaraActiva) {

            await detenerCamara();

            return;
        }

        await iniciarCamara();

    }
);


// ========================================
// CAMBIAR USUARIO
// ========================================

btnCambiarUsuario.addEventListener(
    "click",
    async () => {

        await detenerCamara();

        sessionStorage.removeItem("usuario");

        usuarioSesion = null;

        aplicacion.classList.add("oculto");

        pantallaUsuario.classList.remove("oculto");

        usuarioSelect.value = "";

        mensajeUsuario.textContent = "";

        productoEncontrado.innerHTML = "";

        incidenciaContenedor.innerHTML = "";

        codigo.textContent =
            "Esperando escaneo...";

        entradaManual.value = "";

        mostrarMensaje("");

        await cargarUsuarios();

    }
);


// ========================================
// IR AL REPORTE
// ========================================

btnReporte.addEventListener(
    "click",
    () => {

        if (!usuarioSesion) {

            alert("No hay un usuario activo.");

            return;
        }

        window.location.href = "reporte.html";

    }
);


// ========================================
// INICIAR CÁMARA
// ========================================

async function iniciarCamara() {

    if (camaraActiva) {
        return;
    }

    try {

        const camaras =
            await Html5Qrcode.getCameras();

        if (
            !camaras ||
            camaras.length === 0
        ) {

            console.error(
                "No se encontraron cámaras."
            );

            mostrarEntradaManual();

            return;
        }

        console.log(
            "Cámaras encontradas:",
            camaras
        );

        html5QrCode =
            new Html5Qrcode("reader");

        // Buscar preferentemente la cámara trasera
        let camaraSeleccionada =
            camaras.find(camara =>
                /back|rear|environment|trasera/i.test(
                    camara.label
                )
            );

        // Si no se identifica por el nombre,
        // utilizar la última cámara disponible
        if (!camaraSeleccionada) {

            camaraSeleccionada =
                camaras[camaras.length - 1];

        }

        console.log(
            "Cámara seleccionada:",
            camaraSeleccionada
        );

        await html5QrCode.start(

            camaraSeleccionada.id,

            {
                fps: 10,

                qrbox: {
                    width: 250,
                    height: 150
                }
            },

            codigoLeido,

            () => {}

        );

        camaraActiva = true;

        btnCamara.textContent =
            "⏹ Detener cámara";

        mostrarMensaje("");

        console.log(
            "Cámara iniciada correctamente."
        );

    } catch (error) {

        console.error(
            "No se pudo utilizar la cámara:",
            error
        );

        camaraActiva = false;

        html5QrCode = null;

        btnCamara.textContent =
            "📷 Activar cámara";

        mostrarEntradaManual();

        mostrarMensaje(
            "No fue posible activar la cámara."
        );

    }
}


// ========================================
// DETENER CÁMARA
// ========================================

async function detenerCamara() {

    if (!html5QrCode) {

        camaraActiva = false;

        btnCamara.textContent =
            "📷 Activar cámara";

        return;

    }

    try {

        if (camaraActiva) {

            await html5QrCode.stop();

        }

    } catch (error) {

        console.error(
            "Error deteniendo cámara:",
            error
        );

    }

    try {

        html5QrCode.clear();

    } catch (error) {

        console.error(
            "Error limpiando lector:",
            error
        );

    }

    html5QrCode = null;

    camaraActiva = false;

    btnCamara.textContent =
        "📷 Activar cámara";

}


// ========================================
// CÓDIGO LEÍDO
// ========================================

async function codigoLeido(texto) {

    if (escaneoEnProceso) {
        return;
    }

    escaneoEnProceso = true;

    codigo.textContent =
        texto;

    // Apagar inmediatamente la cámara
    // después de detectar el código.
    await detenerCamara();

    // Continuar con la búsqueda del producto.
    await buscarProducto(texto);

}


// ========================================
// MOSTRAR ENTRADA MANUAL
// ========================================

function mostrarEntradaManual() {

    const contenedor =
        document.getElementById(
            "entradaManualContenedor"
        );

    if (contenedor) {

        contenedor.style.display =
            "block";

    }
}


// ========================================
// BÚSQUEDA MANUAL
// ========================================

btnBuscarManual.addEventListener(
    "click",
    async () => {

        const texto =
            entradaManual.value.trim();

        if (!texto) {

            mostrarMensaje(
                "Escribe un código."
            );

            return;
        }

        if (escaneoEnProceso) {
            return;
        }

        escaneoEnProceso = true;

        codigo.textContent =
            texto;

        // Por seguridad, apagar la cámara
        // si estuviera activa.
        await detenerCamara();

        await buscarProducto(texto);

    }
);


// ========================================
// BUSCAR PRODUCTO
// ========================================

async function buscarProducto(codigoBuscado) {

    mostrarMensaje(
        "Buscando producto..."
    );

    productoEncontrado.innerHTML = "";

    incidenciaContenedor.innerHTML = "";

    try {

        const referencia =
            collection(db, "productos");

        const consulta =
            query(
                referencia,
                where(
                    "codigo",
                    "==",
                    codigoBuscado
                )
            );

        const resultado =
            await getDocs(consulta);

        if (resultado.empty) {

            mostrarProductoNoEncontrado(
                codigoBuscado
            );

            return;
        }

        let producto = null;

        resultado.forEach(documento => {

            producto = {
                id: documento.id,
                ...documento.data()
            };

        });

        mostrarProducto(producto);

    } catch (error) {

        console.error(
            "Error buscando producto:",
            error
        );

        mostrarMensaje(
            "No fue posible consultar el producto."
        );

    } finally {

        setTimeout(() => {

            escaneoEnProceso = false;

        }, 1000);

    }
}


// ========================================
// MOSTRAR PRODUCTO
// ========================================

function mostrarProducto(producto) {

    productoEncontrado.innerHTML = `

        <div class="tarjeta-producto">

            <h2>
                Producto encontrado
            </h2>

            <p>
                <strong>Código:</strong>
                ${escaparHTML(producto.codigo)}
            </p>

            <p>
                <strong>Descripción:</strong>
                ${escaparHTML(producto.nombre)}
            </p>

        </div>

    `;

    mostrarFormularioIncidencia(producto);

    mostrarMensaje("");
}


// ========================================
// PRODUCTO NO ENCONTRADO
// ========================================

function mostrarProductoNoEncontrado(codigoBuscado) {

    productoEncontrado.innerHTML = `

        <div class="tarjeta-producto no-encontrado">

            <h2>
                Producto no encontrado
            </h2>

            <p>
                El código
                <strong>
                    ${escaparHTML(codigoBuscado)}
                </strong>
                no existe en el catálogo.
            </p>

            <button
                type="button"
                id="btnRegistrarProducto"
            >
                Registrar producto
            </button>

        </div>

    `;

    incidenciaContenedor.innerHTML = "";

    document
        .getElementById("btnRegistrarProducto")
        .addEventListener(
            "click",
            () => {

                mostrarFormularioProducto(
                    codigoBuscado
                );

            }
        );

    mostrarMensaje("");
}


// ========================================
// FORMULARIO NUEVO PRODUCTO
// ========================================

function mostrarFormularioProducto(codigoProducto) {

    incidenciaContenedor.innerHTML = `

        <div class="tarjeta-formulario">

            <h2>
                Registrar producto
            </h2>

            <label for="nuevoCodigo">
                Código
            </label>

            <input
                id="nuevoCodigo"
                type="text"
                value="${escaparHTML(codigoProducto)}"
                readonly
            >

            <label for="nuevoNombre">
                Nombre del producto
            </label>

            <input
                id="nuevoNombre"
                type="text"
                placeholder="Nombre del producto"
            >

            <button
                type="button"
                id="btnGuardarProducto"
            >
                Guardar producto
            </button>

        </div>

    `;

    document
        .getElementById("btnGuardarProducto")
        .addEventListener(
            "click",
            guardarProducto
        );

}


// ========================================
// GUARDAR PRODUCTO
// ========================================

async function guardarProducto() {

    const codigoProducto =
        document
            .getElementById("nuevoCodigo")
            .value
            .trim();

    const nombreProducto =
        document
            .getElementById("nuevoNombre")
            .value
            .trim();

    if (!codigoProducto) {

        alert(
            "El código es obligatorio."
        );

        return;
    }

    if (!nombreProducto) {

        alert(
            "Escribe el nombre del producto."
        );

        return;
    }

    try {

        const productos =
            collection(db, "productos");

        const consulta =
            query(
                productos,
                where(
                    "codigo",
                    "==",
                    codigoProducto
                )
            );

        const existente =
            await getDocs(consulta);

        if (!existente.empty) {

            alert(
                "Este producto ya existe."
            );

            buscarProducto(codigoProducto);

            return;
        }

        await addDoc(

            productos,

            {
                codigo:
                    codigoProducto,

                nombre:
                    nombreProducto,

                fechaRegistro:
                    serverTimestamp()
            }

        );

        mostrarMensaje(
            "Producto registrado correctamente."
        );

        await buscarProducto(
            codigoProducto
        );

    } catch (error) {

        console.error(
            "Error guardando producto:",
            error
        );

        alert(
            "No fue posible guardar el producto."
        );

    }
}


// ========================================
// FORMULARIO DE INCIDENCIA
// ========================================

function mostrarFormularioIncidencia(producto) {

    incidenciaContenedor.innerHTML = `

        <div class="tarjeta-formulario">

            <h2>
                Registrar incidencia
            </h2>

            <label for="tipoIncidencia">
                Tipo de incidencia
            </label>

            <select id="tipoIncidencia">

                <option value="Caducado">
                    Caducado
                </option>

                <option value="Próximo a caducar">
                    Próximo a caducar
                </option>

                <option value="Mal estado">
                    Mal estado
                </option>

            </select>

            <label for="loteIncidencia">
                Lote
            </label>

            <input
                id="loteIncidencia"
                type="text"
                placeholder="Número de lote"
            >

            <label for="caducidadIncidencia">
                Fecha de caducidad
            </label>

            <input
                id="caducidadIncidencia"
                type="date"
            >

            <label for="piezasIncidencia">
                Número de piezas
            </label>

            <input
                id="piezasIncidencia"
                type="number"
                min="1"
                step="1"
                value="1"
            >

            <button
                type="button"
                id="btnGuardarIncidencia"
            >
                Registrar incidencia
            </button>

        </div>

    `;

    document
        .getElementById("btnGuardarIncidencia")
        .addEventListener(
            "click",
            () => {

                guardarIncidencia(producto);

            }
        );

}


// ========================================
// GUARDAR INCIDENCIA
// ========================================

async function guardarIncidencia(producto) {

    const tipo =
        document
            .getElementById("tipoIncidencia")
            .value;

    const lote =
        document
            .getElementById("loteIncidencia")
            .value
            .trim();

    const caducidad =
        document
            .getElementById("caducidadIncidencia")
            .value;

    const piezas =
        Number(
            document
                .getElementById("piezasIncidencia")
                .value
        );

    if (!lote) {

        alert(
            "Escribe el lote."
        );

        return;
    }

    if (
        tipo !== "Mal estado" &&
        !caducidad
    ) {

        alert(
            "Selecciona la fecha de caducidad."
        );

        return;
    }

    if (
        !piezas ||
        piezas <= 0
    ) {

        alert(
            "La cantidad de piezas debe ser mayor que cero."
        );

        return;
    }

    if (!usuarioSesion) {

        alert(
            "No existe un usuario activo."
        );

        return;
    }

    try {

        await addDoc(

            collection(db, "incidencias"),

            {
                codigo:
                    producto.codigo,

                nombre:
                    producto.nombre,

                estado:
                    tipo,

                lote:
                    lote,

                caducidad:
                    caducidad || "",

                piezas:
                    piezas,

                usuario:
                    usuarioSesion,

                fechaRegistro:
                    serverTimestamp()
            }

        );

        mostrarMensaje(
            "✓ Incidencia registrada correctamente."
        );

        incidenciaContenedor.innerHTML = "";

        setTimeout(() => {

            productoEncontrado.innerHTML = "";

            codigo.textContent =
                "Esperando escaneo...";

            entradaManual.value = "";

            mostrarMensaje("");

        }, 1500);

    } catch (error) {

        console.error(
            "Error guardando incidencia:",
            error
        );

        alert(
            "No fue posible registrar la incidencia."
        );

    }

}


// ========================================
// ESCAPAR HTML
// ========================================

function escaparHTML(valor) {

    if (
        valor === undefined ||
        valor === null
    ) {

        return "";

    }

    return String(valor)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


// ========================================
// MENSAJES
// ========================================

function mostrarMensaje(texto) {

    mensaje.textContent =
        texto;

}