
"use strict";

const CLAVE_PRODUCTOS = "desplazamiento_productos";
const CLAVE_MOVIMIENTOS = "desplazamiento_movimientos";
const CLAVE_META_GENERAL = "desplazamiento_meta_general";

let productos = [];
let movimientos = [];
let metaGeneral = 0;

const elemento = (id) => document.getElementById(id);

function leerDatos() {
    try {
        const datosProductos = JSON.parse(localStorage.getItem(CLAVE_PRODUCTOS) || "[]");
        const datosMovimientos = JSON.parse(localStorage.getItem(CLAVE_MOVIMIENTOS) || "[]");
        const datoMeta = Number(localStorage.getItem(CLAVE_META_GENERAL) || 0);

        if (!Array.isArray(datosProductos) || !Array.isArray(datosMovimientos)) {
            throw new Error("Los datos guardados tienen un formato incorrecto.");
        }

        productos = datosProductos.map((p) => ({
            ...p,
            meta: Number.isSafeInteger(Number(p.meta)) && Number(p.meta) >= 0
                ? Number(p.meta)
                : 0
        }));

        movimientos = datosMovimientos;
        metaGeneral = Number.isSafeInteger(datoMeta) && datoMeta >= 0 ? datoMeta : 0;
    } catch (error) {
        alert("No se pudieron leer los datos guardados. No se han eliminado tus datos. Detalle: " + error.message);
        productos = [];
        movimientos = [];
        metaGeneral = 0;
    }
}

function guardarDatos() {
    localStorage.setItem(CLAVE_PRODUCTOS, JSON.stringify(productos));
    localStorage.setItem(CLAVE_MOVIMIENTOS, JSON.stringify(movimientos));
    localStorage.setItem(CLAVE_META_GENERAL, String(metaGeneral));
}

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, (caracter) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

function numeroValido(valor) {
    const numero = Number(valor);
    return Number.isSafeInteger(numero) && numero > 0;
}

function fechaLocal() {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

function formatearFecha(fecha) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) {
        return String(fecha || "Sin fecha");
    }

    const [anio, mes, dia] = fecha.split("-");
    return `${dia}/${mes}/${anio}`;
}

function cambiarSeccion(nombre) {
    document.querySelectorAll(".seccion").forEach((seccion) => {
        seccion.classList.toggle("activa", seccion.id === nombre);
    });

    document.querySelectorAll(".boton-menu").forEach((boton) => {
        boton.classList.toggle("activo", boton.dataset.seccion === nombre);
    });

    if (nombre === "reportes") {
        mostrarReporte();
    }
}

function mostrarProductos() {
    const contenedor = elemento("listaProductos");

    if (productos.length === 0) {
        contenedor.innerHTML = '<div class="vacio">Todavía no hay productos registrados.</div>';
        return;
    }

    contenedor.innerHTML = productos.map((producto) => `
        <article class="elemento-lista">
            <div class="elemento-cabecera">
                <strong>${escaparHTML(producto.nombre)}</strong>
                <div class="acciones-elemento">
                    <button type="button" class="boton secundario boton-pequeno"
                        data-editar-meta="${escaparHTML(producto.id)}">
                        Cambiar meta
                    </button>
                    <button type="button" class="boton peligro boton-pequeno"
                        data-eliminar-producto="${escaparHTML(producto.id)}">
                        Eliminar
                    </button>
                </div>
            </div>
            <p>Meta individual: <strong>${producto.meta.toLocaleString("es-MX")} piezas</strong></p>
        </article>
    `).join("");
}

function actualizarSelector() {
    const selector = elemento("productoMovimiento");
    const valorAnterior = selector.value;

    selector.innerHTML = '<option value="">Selecciona un producto</option>';

    productos.forEach((producto) => {
        const opcion = document.createElement("option");
        opcion.value = producto.id;
        opcion.textContent = producto.nombre;
        selector.appendChild(opcion);
    });

    if (productos.some((producto) => producto.id === valorAnterior)) {
        selector.value = valorAnterior;
    }
}

function mostrarMovimientos() {
    const contenedor = elemento("listaMovimientos");

    const recientes = [...movimientos]
        .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
        .slice(0, 10);

    if (recientes.length === 0) {
        contenedor.innerHTML = '<div class="vacio">Todavía no hay desplazamientos registrados.</div>';
        return;
    }

    contenedor.innerHTML = recientes.map((movimiento) => `
        <article class="elemento-lista">
            <strong>${escaparHTML(movimiento.nombreProducto)}</strong>
            <p>Piezas desplazadas: <strong>${Number(movimiento.cantidad).toLocaleString("es-MX")}</strong></p>
            <p>Fecha: ${escaparHTML(formatearFecha(movimiento.fecha))}</p>
        </article>
    `).join("");
}

function obtenerMovimientosPeriodo(inicio, fin) {
    return movimientos.filter((movimiento) =>
        movimiento.fecha >= inicio && movimiento.fecha <= fin
    );
}

function calcularPorcentaje(piezas, meta) {
    if (!meta || meta <= 0) {
        return null;
    }

    return (piezas / meta) * 100;
}

function textoPorcentaje(porcentaje) {
    if (porcentaje === null) {
        return "Sin meta";
    }

    return `${porcentaje.toLocaleString("es-MX", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })}%`;
}

function crearTarjeta(titulo, valor, detalle) {
    return `
        <article class="tarjeta-resumen">
            <p class="etiqueta">${escaparHTML(titulo)}</p>
            <p class="valor">${escaparHTML(valor)}</p>
            <p class="detalle">${escaparHTML(detalle)}</p>
        </article>
    `;
}

function crearBarra(porcentaje, general = false) {
    if (porcentaje === null) {
        return '<p class="nota">Configura una meta para calcular el cumplimiento.</p>';
    }

    const ancho = Math.max(0, Math.min(100, porcentaje));
    let clase = general ? "general" : "incompleto";

    if (porcentaje >= 100) {
        clase = "completo";
    }

    return `
        <div class="progreso" role="progressbar"
            aria-valuemin="0" aria-valuemax="100"
            aria-valuenow="${Math.min(100, porcentaje)}"
            aria-label="Cumplimiento ${escaparHTML(textoPorcentaje(porcentaje))}">
            <div class="progreso-barra ${clase}" style="width:${ancho}%"></div>
        </div>
    `;
}

function mostrarMetaGeneral() {
    elemento("metaGeneral").value = metaGeneral > 0 ? metaGeneral : "";
}

function mostrarReporte() {
    const contenedor = elemento("resultadoReporte");
    const inicio = elemento("fechaInicio").value;
    const fin = elemento("fechaFin").value;

    if (!inicio || !fin) {
        contenedor.innerHTML = '<p class="nota">Selecciona una fecha inicial y una fecha final para consultar el reporte.</p>';
        return;
    }

    if (inicio > fin) {
        contenedor.innerHTML = '<p class="mensaje error">La fecha inicial no puede ser posterior a la fecha final.</p>';
        return;
    }

    const movimientosPeriodo = obtenerMovimientosPeriodo(inicio, fin);

    const totalPiezas = movimientosPeriodo.reduce((total, movimiento) =>
        total + Number(movimiento.cantidad), 0
    );

    const porcentajeGeneral = calcularPorcentaje(totalPiezas, metaGeneral);
    const pendientesGenerales = metaGeneral > 0
        ? Math.max(0, metaGeneral - totalPiezas)
        : null;

    let html = `
        <h3>Resumen general</h3>
        <p class="nota">Periodo: ${escaparHTML(formatearFecha(inicio))} al ${escaparHTML(formatearFecha(fin))}</p>

        <div class="resumen-grid">
            ${crearTarjeta("Meta general", metaGeneral > 0 ? metaGeneral.toLocaleString("es-MX") : "No definida", "Piezas objetivo")}
            ${crearTarjeta("Piezas desplazadas", totalPiezas.toLocaleString("es-MX"), "Todos los productos del periodo")}
            ${crearTarjeta("Cumplimiento general", textoPorcentaje(porcentajeGeneral), "Respecto a la meta general")}
            ${crearTarjeta("Piezas pendientes", pendientesGenerales === null ? "—" : pendientesGenerales.toLocaleString("es-MX"), "Para alcanzar la meta")}
        </div>

        ${crearBarra(porcentajeGeneral, true)}

        <h3>Cumplimiento individual por producto</h3>
        <p class="nota">Las piezas de cada producto se calculan únicamente dentro del periodo seleccionado. Los productos eliminados del catálogo pueden seguir apareciendo si tienen movimientos históricos en ese periodo.</p>
    `;

    const productosReporte = new Map();

    productos.forEach((producto) => {
        productosReporte.set(producto.id, {
            id: producto.id,
            nombre: producto.nombre,
            meta: Number(producto.meta) || 0,
            piezas: 0
        });
    });

    movimientosPeriodo.forEach((movimiento) => {
        const id = movimiento.productoId;

        if (!productosReporte.has(id)) {
            productosReporte.set(id, {
                id,
                nombre: movimiento.nombreProducto || "Producto eliminado",
                meta: 0,
                piezas: 0
            });
        }

        productosReporte.get(id).piezas += Number(movimiento.cantidad);
    });

    const filas = [...productosReporte.values()]
        .filter((producto) => producto.piezas > 0 || productos.some((p) => p.id === producto.id))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

    if (filas.length === 0) {
        html += '<div class="vacio">No hay productos ni movimientos para mostrar en este periodo.</div>';
    } else {
        html += `
            <div class="tabla-contenedor">
                <table class="tabla-reporte">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Meta</th>
                            <th>Desplazadas</th>
                            <th>Pendientes</th>
                            <th>Cumplimiento</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        filas.forEach((producto) => {
            const porcentaje = calcularPorcentaje(producto.piezas, producto.meta);
            const pendientes = producto.meta > 0
                ? Math.max(0, producto.meta - producto.piezas)
                : null;

            html += `
                <tr>
                    <td>${escaparHTML(producto.nombre)}</td>
                    <td>${producto.meta > 0 ? producto.meta.toLocaleString("es-MX") : "Sin meta"}</td>
                    <td>${producto.piezas.toLocaleString("es-MX")}</td>
                    <td>${pendientes === null ? "—" : pendientes.toLocaleString("es-MX")}</td>
                    <td class="cumplimiento-celda">
                        <strong class="porcentaje">${escaparHTML(textoPorcentaje(porcentaje))}</strong>
                        ${crearBarra(porcentaje)}
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
    }

    contenedor.innerHTML = html;
}

function mostrarMensaje(id, mensaje, tipo) {
    const destino = elemento(id);
    destino.textContent = mensaje;
    destino.className = `mensaje ${tipo || ""}`;
}

function altaProducto(evento) {
    evento.preventDefault();

    const nombre = elemento("nombreProducto").value.trim();
    const meta = Number(elemento("metaProducto").value);

    if (!nombre) {
        alert("Escribe el nombre del producto.");
        return;
    }

    if (!numeroValido(meta)) {
        alert("La meta individual debe ser un número entero mayor que cero.");
        return;
    }

    if (productos.some((producto) =>
        producto.nombre.trim().toLocaleLowerCase() === nombre.toLocaleLowerCase()
    )) {
        alert("Ya existe un producto con ese nombre.");
        return;
    }

    productos.push({
        id: crypto.randomUUID(),
        nombre,
        meta
    });

    try {
        guardarDatos();
    } catch (error) {
        productos.pop();
        alert("No se pudo guardar el producto. Revisa el espacio disponible del navegador.");
        return;
    }

    elemento("formProducto").reset();
    mostrarProductos();
    actualizarSelector();
    mostrarReporte();
}

function cambiarMetaProducto(id) {
    const producto = productos.find((p) => p.id === id);
    if (!producto) return;

    const respuesta = prompt(
        `Ingresa la nueva meta individual para "${producto.nombre}" (piezas):`,
        String(producto.meta || "")
    );

    if (respuesta === null) return;

    const nuevaMeta = Number(respuesta);

    if (!numeroValido(nuevaMeta)) {
        alert("La meta debe ser un número entero mayor que cero.");
        return;
    }

    const metaAnterior = producto.meta;
    producto.meta = nuevaMeta;

    try {
        guardarDatos();
    } catch (error) {
        producto.meta = metaAnterior;
        alert("No se pudo guardar la nueva meta.");
        return;
    }

    mostrarProductos();
    mostrarReporte();
}

function registrarMovimiento(evento) {
    evento.preventDefault();

    const productoId = elemento("productoMovimiento").value;
    const cantidad = Number(elemento("cantidadMovimiento").value);
    const producto = productos.find((p) => p.id === productoId);

    if (!producto) {
        alert("Selecciona un producto registrado.");
        return;
    }

    if (!numeroValido(cantidad)) {
        alert("La cantidad debe ser un número entero mayor que cero.");
        return;
    }

    const movimiento = {
        id: crypto.randomUUID(),
        productoId: producto.id,
        nombreProducto: producto.nombre,
        cantidad,
        fecha: fechaLocal()
    };

    movimientos.push(movimiento);

    try {
        guardarDatos();
    } catch (error) {
        movimientos.pop();
        alert("No se pudo guardar el movimiento. Revisa el espacio disponible del navegador.");
        return;
    }

    elemento("formMovimiento").reset();
    mostrarMovimientos();
    actualizarSelector();
    mostrarReporte();
}

function eliminarProducto(id) {
    const producto = productos.find((p) => p.id === id);
    if (!producto) return;

    const confirmar = confirm(
        `¿Deseas eliminar "${producto.nombre}" del catálogo?\n\nSus movimientos históricos se conservarán.`
    );

    if (!confirmar) return;

    const copia = [...productos];
    productos = productos.filter((p) => p.id !== id);

    try {
        guardarDatos();
    } catch (error) {
        productos = copia;
        alert("No se pudo eliminar el producto.");
        return;
    }

    mostrarProductos();
    actualizarSelector();
    mostrarReporte();
}

function eliminarTodosProductos() {
    if (productos.length === 0) {
        alert("No hay productos registrados.");
        return;
    }

    const confirmar = confirm(
        "¿Eliminar todos los productos del catálogo?\n\nLos movimientos históricos se conservarán."
    );

    if (!confirmar) return;

    const copia = [...productos];
    productos = [];

    try {
        guardarDatos();
    } catch (error) {
        productos = copia;
        alert("No se pudieron eliminar los productos.");
        return;
    }

    mostrarProductos();
    actualizarSelector();
    mostrarReporte();
}

function guardarMetaGeneral(evento) {
    evento.preventDefault();

    const nuevaMeta = Number(elemento("metaGeneral").value);

    if (!numeroValido(nuevaMeta)) {
        mostrarMensaje("estadoMetaGeneral", "La meta general debe ser un número entero mayor que cero.", "error");
        return;
    }

    const anterior = metaGeneral;
    metaGeneral = nuevaMeta;

    try {
        guardarDatos();
    } catch (error) {
        metaGeneral = anterior;
        mostrarMensaje("estadoMetaGeneral", "No se pudo guardar la meta general.", "error");
        return;
    }

    mostrarMensaje("estadoMetaGeneral", "Meta general guardada correctamente.", "exito");
    mostrarReporte();
}

function descargarRespaldo() {
    const respaldo = {
        aplicacion: "Control de Desplazamiento",
        version: 2,
        fechaRespaldo: new Date().toISOString(),
        metaGeneral,
        productos,
        movimientos
    };

    const contenido = JSON.stringify(respaldo, null, 2);
    const archivo = new Blob([contenido], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `respaldo_desplazamiento_${fechaLocal()}.json`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
    mostrarMensaje("estadoRespaldo", "Respaldo descargado. Guárdalo en un lugar seguro.", "exito");
}

function validarRespaldo(datos) {
    if (!datos || typeof datos !== "object" ||
        !Array.isArray(datos.productos) ||
        !Array.isArray(datos.movimientos)) {
        throw new Error("El archivo no tiene la estructura de un respaldo válido.");
    }

    const idsProductos = new Set();

    const productosValidos = datos.productos.map((producto) => {
        if (!producto || typeof producto.id !== "string" ||
            typeof producto.nombre !== "string" ||
            !producto.nombre.trim()) {
            throw new Error("Se encontró un producto con información inválida.");
        }

        if (idsProductos.has(producto.id)) {
            throw new Error("El respaldo contiene identificadores de producto duplicados.");
        }
        idsProductos.add(producto.id);

        const meta = producto.meta === undefined ? 0 : Number(producto.meta);

        if (!Number.isSafeInteger(meta) || meta < 0) {
            throw new Error(`La meta del producto "${producto.nombre}" no es válida.`);
        }

        return {
            id: producto.id,
            nombre: producto.nombre.trim(),
            meta
        };
    });

    const idsMovimientos = new Set();

    const movimientosValidos = datos.movimientos.map((movimiento) => {
        if (!movimiento || typeof movimiento.id !== "string" ||
            typeof movimiento.productoId !== "string" ||
            typeof movimiento.nombreProducto !== "string" ||
            !Number.isSafeInteger(Number(movimiento.cantidad)) ||
            Number(movimiento.cantidad) <= 0 ||
            !/^\d{4}-\d{2}-\d{2}$/.test(String(movimiento.fecha))) {
            throw new Error("Se encontró un movimiento con información inválida.");
        }

        if (idsMovimientos.has(movimiento.id)) {
            throw new Error("El respaldo contiene identificadores de movimiento duplicados.");
        }
        idsMovimientos.add(movimiento.id);

        return {
            id: movimiento.id,
            productoId: movimiento.productoId,
            nombreProducto: movimiento.nombreProducto,
            cantidad: Number(movimiento.cantidad),
            fecha: movimiento.fecha
        };
    });

    const meta = datos.metaGeneral === undefined ? 0 : Number(datos.metaGeneral);

    if (!Number.isSafeInteger(meta) || meta < 0) {
        throw new Error("La meta general del respaldo no es válida.");
    }

    return {
        productos: productosValidos,
        movimientos: movimientosValidos,
        metaGeneral: meta
    };
}

async function restaurarRespaldo() {
    const archivoInput = elemento("archivoRespaldo");
    const archivo = archivoInput.files[0];

    if (!archivo) {
        mostrarMensaje("estadoRespaldo", "Primero selecciona un archivo JSON.", "error");
        return;
    }

    if (archivo.size > 20 * 1024 * 1024) {
        mostrarMensaje("estadoRespaldo", "El archivo supera el límite de 20 MB.", "error");
        return;
    }

    try {
        const texto = await archivo.text();
        const datos = JSON.parse(texto);
        const validados = validarRespaldo(datos);

        const confirmar = confirm(
            "Restaurar este respaldo reemplazará los productos, movimientos y metas actuales.\n\n¿Deseas continuar?"
        );

        if (!confirmar) return;

        const copiaAnterior = {
            productos,
            movimientos,
            metaGeneral
        };

        productos = validados.productos;
        movimientos = validados.movimientos;
        metaGeneral = validados.metaGeneral;

        try {
            guardarDatos();
        } catch (error) {
            productos = copiaAnterior.productos;
            movimientos = copiaAnterior.movimientos;
            metaGeneral = copiaAnterior.metaGeneral;

            try {
                guardarDatos();
            } catch (errorRestauracion) {
                console.error("No fue posible recuperar todos los datos anteriores:", errorRestauracion);
            }

            throw new Error("No se pudo guardar el respaldo en el navegador. Los datos anteriores se han recuperado cuando fue posible.");
        }

        mostrarProductos();
        actualizarSelector();
        mostrarMovimientos();
        mostrarMetaGeneral();
        mostrarReporte();

        mostrarMensaje("estadoMetaGeneral", "Meta general cargada desde el respaldo.", "exito");
        mostrarMensaje("estadoRespaldo", "Respaldo restaurado correctamente.", "exito");
        archivoInput.value = "";
    } catch (error) {
        mostrarMensaje("estadoRespaldo", `No se pudo restaurar el respaldo: ${error.message}`, "error");
    }
}

function establecerFechasIniciales() {
    const hoy = fechaLocal();
    elemento("fechaInicio").value = hoy;
    elemento("fechaFin").value = hoy;
}

function iniciarAplicacion() {
    leerDatos();

    document.querySelectorAll(".boton-menu").forEach((boton) => {
        boton.addEventListener("click", () => cambiarSeccion(boton.dataset.seccion));
    });

    elemento("formProducto").addEventListener("submit", altaProducto);
    elemento("formMovimiento").addEventListener("submit", registrarMovimiento);
    elemento("formMetaGeneral").addEventListener("submit", guardarMetaGeneral);
    elemento("formReporte").addEventListener("submit", (evento) => {
        evento.preventDefault();
        mostrarReporte();
    });

    elemento("listaProductos").addEventListener("click", (evento) => {
        const botonEliminar = evento.target.closest("[data-eliminar-producto]");
        const botonMeta = evento.target.closest("[data-editar-meta]");

        if (botonEliminar) {
            eliminarProducto(botonEliminar.dataset.eliminarProducto);
        } else if (botonMeta) {
            cambiarMetaProducto(botonMeta.dataset.editarMeta);
        }
    });

    elemento("eliminarTodosProductos").addEventListener("click", eliminarTodosProductos);
    elemento("descargarRespaldo").addEventListener("click", descargarRespaldo);
    elemento("restaurarRespaldo").addEventListener("click", restaurarRespaldo);

    mostrarProductos();
    actualizarSelector();
    mostrarMovimientos();
    mostrarMetaGeneral();
    establecerFechasIniciales();
    mostrarReporte();
}

document.addEventListener("DOMContentLoaded", iniciarAplicacion);
