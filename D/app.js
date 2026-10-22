"use strict";

// Almacenamiento local del navegador
const CLAVE_PRODUCTOS = "desplazamiento_productos";
const CLAVE_MOVIMIENTOS = "desplazamiento_movimientos";

// Obtener datos guardados
function leerDatos(clave) {
    try {
        const datos = localStorage.getItem(clave);
        const resultado = datos ? JSON.parse(datos) : [];
        return Array.isArray(resultado) ? resultado : [];
    } catch (error) {
        console.error("Error al leer los datos:", error);
        return [];
    }
}

let productos = leerDatos(CLAVE_PRODUCTOS);
let movimientos = leerDatos(CLAVE_MOVIMIENTOS);

// Elementos de la página
const formProducto = document.getElementById("formProducto");
const nombreProducto = document.getElementById("nombreProducto");
const listaProductos = document.getElementById("listaProductos");
const eliminarTodosProductos = document.getElementById("eliminarTodosProductos");

const formMovimiento = document.getElementById("formMovimiento");
const productoMovimiento = document.getElementById("productoMovimiento");
const cantidadMovimiento = document.getElementById("cantidadMovimiento");
const listaMovimientos = document.getElementById("listaMovimientos");

const formReporte = document.getElementById("formReporte");
const fechaInicio = document.getElementById("fechaInicio");
const fechaFin = document.getElementById("fechaFin");
const resultadoReporte = document.getElementById("resultadoReporte");

const descargarRespaldo = document.getElementById("descargarRespaldo");
const archivoRespaldo = document.getElementById("archivoRespaldo");
const restaurarRespaldo = document.getElementById("restaurarRespaldo");
const estadoRespaldo = document.getElementById("estadoRespaldo");

// Fecha local en formato YYYY-MM-DD
function obtenerFechaLocal() {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}

// Evitar que los nombres se interpreten como código HTML
function escaparHTML(valor) {
    return String(valor).replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

// Guardar información en localStorage
function guardarDatos() {
    try {
        localStorage.setItem(
            CLAVE_PRODUCTOS,
            JSON.stringify(productos)
        );

        localStorage.setItem(
            CLAVE_MOVIMIENTOS,
            JSON.stringify(movimientos)
        );

        return true;
    } catch (error) {
        console.error("No se pudieron guardar los datos:", error);

        alert(
            "No fue posible guardar los datos. " +
            "Revisa el espacio disponible del navegador."
        );

        return false;
    }
}

// Mostrar mensajes del apartado de respaldos
function mostrarEstadoRespaldo(mensaje, esError = false) {
    estadoRespaldo.textContent = mensaje;
    estadoRespaldo.classList.remove("oculto", "error");

    if (esError) {
        estadoRespaldo.classList.add("error");
    }
}

// Cambiar entre apartados
document.querySelectorAll(".boton-menu").forEach(boton => {
    boton.addEventListener("click", () => {
        document.querySelectorAll(".boton-menu").forEach(elemento => {
            elemento.classList.remove("activo");
        });

        boton.classList.add("activo");

        document.querySelectorAll(".seccion").forEach(seccion => {
            seccion.classList.add("oculto");
        });

        document.getElementById(boton.dataset.seccion)
            .classList.remove("oculto");

        if (boton.dataset.seccion === "reportes") {
            mostrarReporte();
        }
    });
});

// 1. Alta de productos
formProducto.addEventListener("submit", evento => {
    evento.preventDefault();

    const nombre = nombreProducto.value.trim();

    if (!nombre) {
        alert("Escribe el nombre del producto.");
        return;
    }

    const duplicado = productos.some(producto =>
        producto.nombre.toLocaleLowerCase("es-MX") ===
        nombre.toLocaleLowerCase("es-MX")
    );

    if (duplicado) {
        alert("Este producto ya está registrado.");
        return;
    }

    const productoNuevo = {
        id: crypto.randomUUID(),
        nombre: nombre
    };

    productos.push(productoNuevo);

    if (!guardarDatos()) {
        productos.pop();
        return;
    }

    formProducto.reset();
    mostrarProductos();

    alert("Producto registrado correctamente.");
});

// Mostrar productos registrados
function mostrarProductos() {
    if (productos.length === 0) {
        listaProductos.innerHTML =
            '<p class="mensaje">Todavía no hay productos registrados.</p>';
    } else {
        listaProductos.innerHTML = productos.map(producto => `
            <div class="item">
                <span class="nombre-item">
                    ${escaparHTML(producto.nombre)}
                </span>

                <button
                    type="button"
                    class="boton-eliminar"
                    data-eliminar-producto="${escaparHTML(producto.id)}"
                    aria-label="Eliminar ${escaparHTML(producto.nombre)}"
                >
                    Eliminar
                </button>
            </div>
        `).join("");
    }

    eliminarTodosProductos.disabled = productos.length === 0;
    actualizarSelector();
}

// Eliminar un producto sin borrar su historial
listaProductos.addEventListener("click", evento => {
    const boton = evento.target.closest("[data-eliminar-producto]");

    if (!boton) {
        return;
    }

    const id = boton.dataset.eliminarProducto;
    const producto = productos.find(item => item.id === id);

    if (!producto) {
        alert("No se encontró el producto seleccionado.");
        return;
    }

    const confirmar = confirm(
        `¿Deseas eliminar el producto "${producto.nombre}"?\n\n` +
        "Sus movimientos históricos se conservarán en los reportes."
    );

    if (!confirmar) {
        return;
    }

    const indice = productos.findIndex(item => item.id === id);
    const eliminado = productos.splice(indice, 1)[0];

    if (!guardarDatos()) {
        productos.splice(indice, 0, eliminado);
        return;
    }

    mostrarProductos();
    alert("Producto eliminado. Su historial se ha conservado.");
});

// Eliminar todos los productos
eliminarTodosProductos.addEventListener("click", () => {
    if (productos.length === 0) {
        alert("No hay productos para eliminar.");
        return;
    }

    const confirmar = confirm(
        `¿Deseas eliminar los ${productos.length} productos registrados?\n\n` +
        "Esta acción eliminará el catálogo de productos, " +
        "pero conservará todos los movimientos históricos."
    );

    if (!confirmar) {
        return;
    }

    const productosAnteriores = [...productos];
    productos = [];

    if (!guardarDatos()) {
        productos = productosAnteriores;
        return;
    }

    mostrarProductos();
    alert("Se eliminaron todos los productos. El historial se conserva.");
});

// Llenar el selector de productos
function actualizarSelector() {
    const valorAnterior = productoMovimiento.value;

    productoMovimiento.innerHTML =
        '<option value="">Selecciona un producto</option>';

    productos.forEach(producto => {
        const opcion = document.createElement("option");

        opcion.value = producto.id;
        opcion.textContent = producto.nombre;

        productoMovimiento.appendChild(opcion);
    });

    if (productos.some(producto => producto.id === valorAnterior)) {
        productoMovimiento.value = valorAnterior;
    }

    productoMovimiento.disabled = productos.length === 0;
}

// 2. Registrar desplazamiento
formMovimiento.addEventListener("submit", evento => {
    evento.preventDefault();

    const idProducto = productoMovimiento.value;
    const cantidad = Number(cantidadMovimiento.value);

    const producto = productos.find(item => item.id === idProducto);

    if (!producto) {
        alert("Selecciona un producto válido.");
        return;
    }

    if (!Number.isSafeInteger(cantidad) || cantidad < 1) {
        alert("Introduce un número entero de piezas mayor que cero.");
        return;
    }

    const movimientoNuevo = {
        id: crypto.randomUUID(),
        productoId: producto.id,
        nombreProducto: producto.nombre,
        cantidad: cantidad,
        fecha: obtenerFechaLocal()
    };

    movimientos.push(movimientoNuevo);

    if (!guardarDatos()) {
        movimientos.pop();
        return;
    }

    formMovimiento.reset();

    mostrarMovimientos();
    mostrarReporte();

    alert("Desplazamiento registrado correctamente.");
});

// Mostrar los últimos 10 movimientos
function mostrarMovimientos() {
    if (movimientos.length === 0) {
        listaMovimientos.innerHTML =
            '<p class="mensaje">Todavía no hay movimientos registrados.</p>';
        return;
    }

    const recientes = [...movimientos]
        .sort((a, b) =>
            b.fecha.localeCompare(a.fecha) ||
            b.id.localeCompare(a.id)
        )
        .slice(0, 10);

    listaMovimientos.innerHTML = recientes.map(movimiento => `
        <div class="item">
            <div>
                <div class="nombre-item">
                    <strong>${escaparHTML(movimiento.nombreProducto)}</strong>
                </div>
                <small>${escaparHTML(movimiento.fecha)}</small>
            </div>

            <span class="cantidad">
                ${movimiento.cantidad} piezas
            </span>
        </div>
    `).join("");
}

// 3. Consultar reporte por rango de fechas
formReporte.addEventListener("submit", evento => {
    evento.preventDefault();

    if (fechaInicio.value > fechaFin.value) {
        alert("La fecha inicial no puede ser posterior a la fecha final.");
        return;
    }

    mostrarReporte();
});

function mostrarReporte() {
    const inicio = fechaInicio.value;
    const fin = fechaFin.value;

    if (!inicio || !fin) {
        resultadoReporte.innerHTML =
            '<p class="mensaje">Selecciona las fechas del reporte.</p>';
        return;
    }

    if (inicio > fin) {
        resultadoReporte.innerHTML =
            '<p class="mensaje error">El rango de fechas no es válido.</p>';
        return;
    }

    const filtrados = movimientos.filter(movimiento =>
        movimiento.fecha >= inicio &&
        movimiento.fecha <= fin
    );

    const totales = new Map();

    filtrados.forEach(movimiento => {
        const id = movimiento.productoId;

        if (!totales.has(id)) {
            totales.set(id, {
                nombre: movimiento.nombreProducto,
                piezas: 0
            });
        }

        const registro = totales.get(id);
        registro.piezas += movimiento.cantidad;
    });

    const totalGeneral = filtrados.reduce(
        (suma, movimiento) => suma + movimiento.cantidad,
        0
    );

    const totalMovimientos = filtrados.length;

    let filas = "";

    if (totales.size === 0) {
        filas = `
            <tr>
                <td colspan="2">No hay desplazamientos en estas fechas.</td>
            </tr>
        `;
    } else {
        filas = [...totales.values()]
            .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
            .map(registro => `
                <tr>
                    <td>${escaparHTML(registro.nombre)}</td>
                    <td>${registro.piezas.toLocaleString("es-MX")}</td>
                </tr>
            `).join("");
    }

    resultadoReporte.innerHTML = `
        <div class="resumen">
            <div class="tarjeta-resumen">
                <p>Total de piezas</p>
                <strong>${totalGeneral.toLocaleString("es-MX")}</strong>
            </div>

            <div class="tarjeta-resumen">
                <p>Movimientos</p>
                <strong>${totalMovimientos.toLocaleString("es-MX")}</strong>
            </div>
        </div>

        <p>
            <strong>Periodo:</strong>
            ${escaparHTML(inicio)} al ${escaparHTML(fin)}
        </p>

        <div class="tabla-contenedor">
            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Piezas desplazadas</th>
                    </tr>
                </thead>
                <tbody>
                    ${filas}
                    <tr class="total">
                        <td>TOTAL GENERAL</td>
                        <td>${totalGeneral.toLocaleString("es-MX")}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

// 4. Descargar respaldo completo en formato JSON
descargarRespaldo.addEventListener("click", () => {
    const respaldo = {
        aplicacion: "Control de Desplazamiento",
        version: 1,
        fechaRespaldo: new Date().toISOString(),
        productos: productos,
        movimientos: movimientos
    };

    try {
        const contenido = JSON.stringify(respaldo, null, 2);

        const archivo = new Blob(
            [contenido],
            { type: "application/json;charset=utf-8" }
        );

        const url = URL.createObjectURL(archivo);
        const enlace = document.createElement("a");

        enlace.href = url;
        enlace.download = `respaldo_desplazamiento_${obtenerFechaLocal()}.json`;

        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();

        URL.revokeObjectURL(url);

        mostrarEstadoRespaldo(
            `Respaldo descargado correctamente. Incluye ` +
            `${productos.length} productos y ${movimientos.length} movimientos.`
        );
    } catch (error) {
        console.error("Error al generar el respaldo:", error);

        mostrarEstadoRespaldo(
            "No fue posible generar el archivo de respaldo.",
            true
        );
    }
});

// Comprobar que el respaldo tenga la estructura esperada
function validarRespaldo(datos) {
    if (
        !datos ||
        datos.aplicacion !== "Control de Desplazamiento" ||
        datos.version !== 1 ||
        !Array.isArray(datos.productos) ||
        !Array.isArray(datos.movimientos)
    ) {
        throw new Error(
            "El archivo no corresponde a un respaldo válido de esta aplicación."
        );
    }

    const idsProductos = new Set();

    for (const producto of datos.productos) {
        if (
            !producto ||
            typeof producto.id !== "string" ||
            !producto.id ||
            typeof producto.nombre !== "string" ||
            !producto.nombre.trim()
        ) {
            throw new Error("El respaldo contiene un producto inválido.");
        }

        if (idsProductos.has(producto.id)) {
            throw new Error("El respaldo contiene identificadores duplicados.");
        }

        idsProductos.add(producto.id);
    }

    const idsMovimientos = new Set();

    for (const movimiento of datos.movimientos) {
        if (
            !movimiento ||
            typeof movimiento.id !== "string" ||
            !movimiento.id ||
            typeof movimiento.productoId !== "string" ||
            typeof movimiento.nombreProducto !== "string" ||
            !movimiento.nombreProducto.trim() ||
            !Number.isSafeInteger(movimiento.cantidad) ||
            movimiento.cantidad < 1 ||
            typeof movimiento.fecha !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(movimiento.fecha)
        ) {
            throw new Error("El respaldo contiene un movimiento inválido.");
        }

        if (idsMovimientos.has(movimiento.id)) {
            throw new Error("El respaldo contiene movimientos duplicados.");
        }

        idsMovimientos.add(movimiento.id);
    }

    return true;
}

// 5. Restaurar respaldo seleccionado
restaurarRespaldo.addEventListener("click", async () => {
    const archivo = archivoRespaldo.files[0];

    if (!archivo) {
        mostrarEstadoRespaldo(
            "Primero selecciona un archivo de respaldo.",
            true
        );
        return;
    }

    if (!archivo.name.toLowerCase().endsWith(".json")) {
        mostrarEstadoRespaldo(
            "Selecciona un archivo JSON de respaldo.",
            true
        );
        return;
    }

    if (archivo.size > 20 * 1024 * 1024) {
        mostrarEstadoRespaldo(
            "El archivo supera el límite permitido de 20 MB.",
            true
        );
        return;
    }

    const confirmar = confirm(
        "ATENCIÓN: restaurar el respaldo reemplazará todos los productos " +
        "y movimientos actuales por los del archivo seleccionado.\n\n" +
        "Si necesitas conservar los datos actuales, descarga primero " +
        "un respaldo.\n\n¿Deseas continuar?"
    );

    if (!confirmar) {
        return;
    }

    restaurarRespaldo.disabled = true;

    try {
        const texto = await archivo.text();
        const datos = JSON.parse(texto);

        validarRespaldo(datos);

        const productosAnteriores = productos;
        const movimientosAnteriores = movimientos;

        // Conservar copias de seguridad de los valores actuales
        const almacenamientoAnteriorProductos =
            localStorage.getItem(CLAVE_PRODUCTOS);

        const almacenamientoAnteriorMovimientos =
            localStorage.getItem(CLAVE_MOVIMIENTOS);

        productos = datos.productos.map(producto => ({
            id: producto.id,
            nombre: producto.nombre.trim()
        }));

        movimientos = datos.movimientos.map(movimiento => ({
            id: movimiento.id,
            productoId: movimiento.productoId,
            nombreProducto: movimiento.nombreProducto,
            cantidad: movimiento.cantidad,
            fecha: movimiento.fecha
        }));

        if (!guardarDatos()) {
            // Recuperar los datos que estaban en memoria
            productos = productosAnteriores;
            movimientos = movimientosAnteriores;

            // Intentar restaurar también los valores originales almacenados
            try {
                if (almacenamientoAnteriorProductos === null) {
                    localStorage.removeItem(CLAVE_PRODUCTOS);
                } else {
                    localStorage.setItem(
                        CLAVE_PRODUCTOS,
                        almacenamientoAnteriorProductos
                    );
                }

                if (almacenamientoAnteriorMovimientos === null) {
                    localStorage.removeItem(CLAVE_MOVIMIENTOS);
                } else {
                    localStorage.setItem(
                        CLAVE_MOVIMIENTOS,
                        almacenamientoAnteriorMovimientos
                    );
                }
            } catch (errorAlmacenamiento) {
                console.error(
                    "No se pudo recuperar completamente el almacenamiento:",
                    errorAlmacenamiento
                );
            }

            return;
        }

        mostrarProductos();
        mostrarMovimientos();
        mostrarReporte();

        archivoRespaldo.value = "";

        mostrarEstadoRespaldo(
            `Respaldo restaurado correctamente. Se recuperaron ` +
            `${productos.length} productos y ${movimientos.length} movimientos.`
        );

        alert("La información del respaldo se restauró correctamente.");
    } catch (error) {
        console.error("Error al restaurar el respaldo:", error);

        mostrarEstadoRespaldo(
            error instanceof SyntaxError
                ? "El archivo no contiene JSON válido o está dañado."
                : error.message || "No fue posible restaurar el respaldo.",
            true
        );
    } finally {
        restaurarRespaldo.disabled = false;
    }
});

// Inicializar la aplicación
function iniciarAplicacion() {
    const hoy = obtenerFechaLocal();

    fechaInicio.value = hoy;
    fechaFin.value = hoy;

    mostrarProductos();
    mostrarMovimientos();
    mostrarReporte();
}

iniciarAplicacion();