
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

const formMovimiento = document.getElementById("formMovimiento");
const productoMovimiento = document.getElementById("productoMovimiento");
const cantidadMovimiento = document.getElementById("cantidadMovimiento");
const listaMovimientos = document.getElementById("listaMovimientos");

const formReporte = document.getElementById("formReporte");
const fechaInicio = document.getElementById("fechaInicio");
const fechaFin = document.getElementById("fechaFin");
const resultadoReporte = document.getElementById("resultadoReporte");

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
                <span class="cantidad">Registrado</span>
            </div>
        `).join("");
    }

    actualizarSelector();
}

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

    // Sumar las piezas de cada producto
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
