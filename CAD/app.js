import { db } from "./firebase.js";

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    writeBatch,
    addDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ========================================
// ELEMENTOS HTML
// ========================================

const codigo = document.getElementById("codigo");


// ========================================
// ESCANEAR CÓDIGO
// ========================================

function codigoLeido(texto) {

    const codigoLimpio = String(texto).trim();

    if (codigoLimpio === "") {
        return;
    }

    console.log(
        "Código leído:",
        codigoLimpio
    );


    codigo.innerHTML = `
        <p>Buscando producto...</p>

        <p>
            <strong>Código:</strong>
            ${codigoLimpio}
        </p>
    `;


    buscarProducto(codigoLimpio);
}


// ========================================
// BUSCAR PRODUCTO
// ========================================

async function buscarProducto(codigoLeido) {

    try {

        const productosRef =
            collection(db, "productos");


        const consulta =
            query(
                productosRef,
                where(
                    "codigo",
                    "==",
                    codigoLeido
                )
            );


        const resultado =
            await getDocs(consulta);


        if (!resultado.empty) {

            const documento =
                resultado.docs[0];


            const producto =
                documento.data();


            console.log(
                "Producto encontrado:",
                producto
            );


            mostrarProducto(producto);

        } else {

            console.log(
                "Producto no encontrado:",
                codigoLeido
            );


            mostrarProductoNoEncontrado(
                codigoLeido
            );
        }


    } catch (error) {

        console.error(
            "Error consultando Firestore:",
            error
        );


        codigo.innerHTML = `

            <div class="producto-no-encontrado">

                <strong>
                    ❌ Error al consultar Firestore
                </strong>

                <p>
                    Revisa la consola para más información.
                </p>

            </div>

        `;
    }
}


// ========================================
// MOSTRAR PRODUCTO EXISTENTE
// ========================================

async function mostrarProducto(producto) {

    codigo.innerHTML = `

        <div class="producto-encontrado">

            <div class="nombre">
                ${producto.nombre}
            </div>


            <div class="dato">

                <span class="etiqueta">
                    Código:
                </span>

                ${producto.codigo}

            </div>


            <div class="lotes">

                <h3>
                    Lotes registrados
                </h3>

                <p>
                    Consultando lotes...
                </p>

            </div>


            <button
                id="btnRegistrarLote"
                class="btn-guardar"
                type="button"
            >
                + Registrar lote
            </button>

        </div>

    `;


    document
        .getElementById("btnRegistrarLote")
        .addEventListener(
            "click",
            function () {

                mostrarFormularioLote(
                    producto
                );

            }
        );


    await mostrarLotes(producto);
}


// ========================================
// MOSTRAR LOTES
// ========================================

async function mostrarLotes(producto) {

    const contenedor =
        document.querySelector(".lotes");


    if (!contenedor) {
        return;
    }


    try {

        const caducidadesRef =
            collection(
                db,
                "caducidades"
            );


        const consulta =
            query(
                caducidadesRef,
                where(
                    "codigo",
                    "==",
                    producto.codigo
                )
            );


        const resultado =
            await getDocs(consulta);


        if (resultado.empty) {

            contenedor.innerHTML = `

                <h3>
                    Lotes registrados
                </h3>

                <p>
                    No hay lotes registrados.
                </p>

            `;

            return;
        }


        let filas = "";


        resultado.forEach(documento => {

            const lote =
                documento.data();


            filas += `

                <tr>

                    <td>
                        ${lote.lote || ""}
                    </td>

                    <td>
                        ${formatearFecha(
                            lote.caducidad
                        )}
                    </td>

                    <td>
                        ${lote.piezas || 0}
                    </td>

                </tr>

            `;
        });


        contenedor.innerHTML = `

            <h3>
                Lotes registrados
            </h3>


            <div class="tabla-contenedor">

                <table>

                    <thead>

                        <tr>

                            <th>
                                Lote
                            </th>

                            <th>
                                Caducidad
                            </th>

                            <th>
                                Piezas
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        ${filas}

                    </tbody>

                </table>

            </div>

        `;


    } catch (error) {

        console.error(
            "Error consultando lotes:",
            error
        );


        contenedor.innerHTML = `

            <h3>
                Lotes registrados
            </h3>

            <p>
                ❌ No fue posible consultar los lotes.
            </p>

        `;
    }
}


// ========================================
// PRODUCTO NO ENCONTRADO
// ========================================

function mostrarProductoNoEncontrado(
    codigoLeido
) {

    codigo.innerHTML = `

        <div class="producto-no-encontrado">

            <strong>
                ⚠️ Producto no encontrado
            </strong>


            <div class="dato">

                <span class="etiqueta">
                    Código:
                </span>

                ${codigoLeido}

            </div>


            <button
                id="btnAlta"
                class="btn-alta"
                type="button"
            >
                + Dar de alta producto
            </button>

        </div>

    `;


    document
        .getElementById("btnAlta")
        .addEventListener(
            "click",
            function () {

                mostrarFormularioAlta(
                    codigoLeido
                );

            }
        );
}


// ========================================
// FORMULARIO ALTA PRODUCTO
// ========================================

function mostrarFormularioAlta(
    codigoLeido
) {

    codigo.innerHTML = `

        <div class="formulario-producto">

            <h3>
                Nuevo producto
            </h3>


            <div class="campo">

                <label>
                    Código
                </label>

                <input
                    type="text"
                    id="nuevoCodigo"
                    value="${codigoLeido}"
                    readonly
                >

            </div>


            <div class="campo">

                <label>
                    Nombre del producto
                </label>

                <input
                    type="text"
                    id="nuevoNombre"
                    placeholder="Nombre del producto"
                >

            </div>


            <div class="campo">

                <label>
                    Lote
                </label>

                <input
                    type="text"
                    id="nuevoLote"
                    placeholder="Número de lote"
                >

            </div>


            <div class="campo">

                <label>
                    Fecha de caducidad
                </label>

                <input
                    type="date"
                    id="nuevaCaducidad"
                >

            </div>


            <div class="campo">

                <label>
                    Número de piezas
                </label>

                <input
                    type="number"
                    id="nuevasPiezas"
                    min="1"
                    step="1"
                    placeholder="Cantidad"
                >

            </div>


            <button
                id="btnGuardarProducto"
                class="btn-guardar"
                type="button"
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
// GUARDAR PRODUCTO NUEVO
// ========================================

async function guardarProducto() {

    const nuevoCodigo =
        document
            .getElementById("nuevoCodigo")
            .value
            .trim();


    const nuevoNombre =
        document
            .getElementById("nuevoNombre")
            .value
            .trim();


    const nuevoLote =
        document
            .getElementById("nuevoLote")
            .value
            .trim();


    const nuevaCaducidad =
        document
            .getElementById("nuevaCaducidad")
            .value;


    const nuevasPiezas =
        document
            .getElementById("nuevasPiezas")
            .value;


    // ====================================
    // VALIDACIONES
    // ====================================

    if (nuevoCodigo === "") {

        alert(
            "El código es obligatorio."
        );

        return;
    }


    if (nuevoNombre === "") {

        alert(
            "El nombre del producto es obligatorio."
        );

        return;
    }


    if (nuevoLote === "") {

        alert(
            "El lote es obligatorio."
        );

        return;
    }


    if (nuevaCaducidad === "") {

        alert(
            "La fecha de caducidad es obligatoria."
        );

        return;
    }


    if (nuevasPiezas === "") {

        alert(
            "El número de piezas es obligatorio."
        );

        return;
    }


    const piezas =
        Number(nuevasPiezas);


    if (
        !Number.isInteger(piezas) ||
        piezas <= 0
    ) {

        alert(
            "Las piezas deben ser un número entero mayor que cero."
        );

        return;
    }


    try {

        // ================================
        // COMPROBAR SI YA EXISTE
        // ================================

        const productosRef =
            collection(
                db,
                "productos"
            );


        const consulta =
            query(
                productosRef,
                where(
                    "codigo",
                    "==",
                    nuevoCodigo
                )
            );


        const resultado =
            await getDocs(consulta);


        if (!resultado.empty) {

            alert(
                "Este producto ya existe."
            );


            buscarProducto(
                nuevoCodigo
            );


            return;
        }


        // ================================
        // CREAR PRODUCTO Y LOTE
        // ================================

        const batch =
            writeBatch(db);


        const productoRef =
            doc(
                collection(
                    db,
                    "productos"
                )
            );


        batch.set(
            productoRef,
            {
                codigo: nuevoCodigo,
                nombre: nuevoNombre
            }
        );


        const caducidadRef =
            doc(
                collection(
                    db,
                    "caducidades"
                )
            );


        batch.set(
            caducidadRef,
            {
                codigo: nuevoCodigo,
                nombre: nuevoNombre,
                lote: nuevoLote,
                caducidad: nuevaCaducidad,
                piezas: piezas
            }
        );


        await batch.commit();


        console.log(
            "Producto guardado correctamente."
        );


        mostrarProductoGuardado(
            nuevoCodigo,
            nuevoNombre,
            nuevoLote,
            nuevaCaducidad,
            piezas
        );


    } catch (error) {

        console.error(
            "Error guardando producto:",
            error
        );


        codigo.innerHTML = `

            <div class="producto-no-encontrado">

                <strong>
                    ❌ No fue posible guardar
                </strong>

            </div>

        `;
    }
}


// ========================================
// FORMULARIO NUEVO LOTE
// ========================================

function mostrarFormularioLote(
    producto
) {

    codigo.innerHTML = `

        <div class="formulario-producto">

            <h3>
                Registrar lote
            </h3>


            <div class="producto-resumen">

                <strong>
                    ${producto.nombre}
                </strong>

                <br>

                Código:
                ${producto.codigo}

            </div>


            <div class="campo">

                <label>
                    Lote
                </label>

                <input
                    type="text"
                    id="loteRegistro"
                    placeholder="Número de lote"
                >

            </div>


            <div class="campo">

                <label>
                    Fecha de caducidad
                </label>

                <input
                    type="date"
                    id="caducidadRegistro"
                >

            </div>


            <div class="campo">

                <label>
                    Número de piezas
                </label>

                <input
                    type="number"
                    id="piezasRegistro"
                    min="1"
                    step="1"
                    placeholder="Cantidad"
                >

            </div>


            <button
                id="btnGuardarLote"
                class="btn-guardar"
                type="button"
            >
                Guardar lote
            </button>

        </div>

    `;


    document
        .getElementById("btnGuardarLote")
        .addEventListener(
            "click",
            function () {

                guardarLote(producto);

            }
        );
}


// ========================================
// GUARDAR / ACTUALIZAR LOTE
// ========================================

async function guardarLote(
    producto
) {

    const lote =
        document
            .getElementById("loteRegistro")
            .value
            .trim();


    const caducidad =
        document
            .getElementById("caducidadRegistro")
            .value;


    const piezasTexto =
        document
            .getElementById("piezasRegistro")
            .value;


    // ====================================
    // VALIDACIONES
    // ====================================

    if (lote === "") {

        alert(
            "El lote es obligatorio."
        );

        return;
    }


    if (caducidad === "") {

        alert(
            "La fecha de caducidad es obligatoria."
        );

        return;
    }


    if (piezasTexto === "") {

        alert(
            "El número de piezas es obligatorio."
        );

        return;
    }


    const piezas =
        Number(piezasTexto);


    if (
        !Number.isInteger(piezas) ||
        piezas <= 0
    ) {

        alert(
            "Las piezas deben ser un número entero mayor que cero."
        );

        return;
    }


    try {

        const caducidadesRef =
            collection(
                db,
                "caducidades"
            );


        // =================================
        // BUSCAR MISMO PRODUCTO + MISMO LOTE
        // =================================

        const consulta =
            query(

                caducidadesRef,

                where(
                    "codigo",
                    "==",
                    producto.codigo
                ),

                where(
                    "lote",
                    "==",
                    lote
                )

            );


        const resultado =
            await getDocs(consulta);


        // =================================
        // MISMO LOTE → ACTUALIZAR
        // =================================

        if (!resultado.empty) {

            const documento =
                resultado.docs[0];


            const referencia =
                doc(
                    db,
                    "caducidades",
                    documento.id
                );


            await updateDoc(
                referencia,
                {
                    caducidad: caducidad,
                    piezas: piezas
                }
            );


            console.log(
                "Lote actualizado."
            );


            mostrarLoteActualizado(
                producto,
                lote,
                caducidad,
                piezas
            );


            return;
        }


        // =================================
        // LOTE DIFERENTE → CREAR
        // =================================

        await addDoc(
            caducidadesRef,
            {
                codigo: producto.codigo,
                nombre: producto.nombre,
                lote: lote,
                caducidad: caducidad,
                piezas: piezas
            }
        );


        console.log(
            "Nuevo lote registrado."
        );


        mostrarLoteGuardado(
            producto,
            lote,
            caducidad,
            piezas
        );


    } catch (error) {

        console.error(
            "Error guardando lote:",
            error
        );


        codigo.innerHTML = `

            <div class="producto-no-encontrado">

                <strong>
                    ❌ No fue posible guardar el lote
                </strong>

            </div>

        `;
    }
}


// ========================================
// MOSTRAR PRODUCTO GUARDADO
// ========================================

function mostrarProductoGuardado(
    codigoProducto,
    nombre,
    lote,
    caducidad,
    piezas
) {

    codigo.innerHTML = `

        <div class="producto-guardado">

            <h3>
                ✅ Producto guardado
            </h3>


            <div class="nombre">
                ${nombre}
            </div>


            <div class="dato">

                <span class="etiqueta">
                    Código:
                </span>

                ${codigoProducto}

            </div>


            <div class="dato">

                <span class="etiqueta">
                    Lote:
                </span>

                ${lote}

            </div>


            <div class="dato">

                <span class="etiqueta">
                    Caducidad:
                </span>

                ${formatearFecha(
                    caducidad
                )}

            </div>


            <div class="dato">

                <span class="etiqueta">
                    Piezas:
                </span>

                ${piezas}

            </div>

        </div>

    `;
}


// ========================================
// MOSTRAR LOTE NUEVO
// ========================================

function mostrarLoteGuardado(
    producto,
    lote,
    caducidad,
    piezas
) {

    codigo.innerHTML = `

        <div class="producto-guardado">

            <h3>
                ✅ Lote registrado
            </h3>


            <div class="nombre">
                ${producto.nombre}
            </div>


            <div class="dato">

                <span class="etiqueta">
                    Código:
                </span>

                ${producto.codigo}

            </div>


            <div class="dato">

                <span class="etiqueta">
                    Lote:
                </span>

                ${lote}

            </div>


            <div class="dato">

                <span class="etiqueta">
                    Caducidad:
                </span>

                ${formatearFecha(
                    caducidad
                )}

            </div>


            <div class="dato">

                <span class="etiqueta">
                    Piezas:
                </span>

                ${piezas}

            </div>

        </div>

    `;
}


// ========================================
// MOSTRAR LOTE ACTUALIZADO
// ========================================

function mostrarLoteActualizado(
    producto,
    lote,
    caducidad,
    piezas
) {

    codigo.innerHTML = `

        <div class="producto-guardado">

            <h3>
                🔄 Lote actualizado
            </h3>


            <div class="nombre">
                ${producto.nombre}
            </div>


            <div class="dato">

                <span class="etiqueta">
                    Código:
                </span>

                ${producto.codigo}

            </div>


            <div class="dato">

                <span class="etiqueta">
                    Lote:
                </span>

                ${lote}

            </div>


            <div class="dato">

                <span class="etiqueta">
                    Caducidad:
                </span>

                ${formatearFecha(
                    caducidad
                )}

            </div>


            <div class="dato">

                <span class="etiqueta">
                    Piezas:
                </span>

                ${piezas}

            </div>

        </div>

    `;
}


// ========================================
// FORMATEAR FECHA
// ========================================

function formatearFecha(fecha) {

    if (!fecha) {
        return "";
    }


    // Si Firestore devuelve Timestamp

    if (
        typeof fecha.toDate === "function"
    ) {

        const fechaReal =
            fecha.toDate();


        const dia =
            String(
                fechaReal.getDate()
            ).padStart(2, "0");


        const mes =
            String(
                fechaReal.getMonth() + 1
            ).padStart(2, "0");


        const anio =
            fechaReal.getFullYear();


        return `${dia}/${mes}/${anio}`;
    }


    // Si es una fecha tipo:
    // 2026-08-20

    const partes =
        String(fecha).split("-");


    if (partes.length === 3) {

        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }


    return fecha;
}


// ========================================
// LECTOR DE CÓDIGOS
// ========================================

const html5QrCode =
    new Html5Qrcode("reader");


Html5Qrcode.getCameras()

    .then(cameras => {

        if (
            cameras &&
            cameras.length > 0
        ) {

            console.log(
                "Cámaras encontradas:",
                cameras
            );


            html5QrCode.start(

                {
                    facingMode: {
                        exact: "environment"
                    }
                },

                {
                    fps: 10,

                    qrbox: {
                        width: 250,
                        height: 250
                    }
                },

                codigoLeido

            )

            .catch(error => {

                console.log(
                    "Error al iniciar cámara:",
                    error
                );

                console.log(
                    "La entrada manual sigue disponible."
                );

            });

        } else {

            console.log(
                "No hay cámaras disponibles."
            );

            console.log(
                "Utiliza la entrada manual."
            );
        }

    })

    .catch(error => {

        console.log(
            "No se pudo acceder a la cámara:",
            error
        );

        console.log(
            "Utiliza la entrada manual."
        );

    });


// ========================================
// ENTRADA MANUAL
// ========================================

const botonManual =
    document.getElementById(
        "btnManual"
    );


botonManual.addEventListener(
    "click",
    usarCodigoManual
);


function usarCodigoManual() {

    const entrada =
        document.getElementById(
            "entradaManual"
        );


    const texto =
        entrada.value.trim();


    console.log(
        "Código ingresado manualmente:",
        texto
    );


    if (texto === "") {

        alert(
            "Ingresa un código de barras."
        );

        entrada.focus();

        return;
    }


    codigoLeido(texto);


    entrada.value = "";

}