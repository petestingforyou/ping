import { db } from "./firebase.js";

import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const codigo = document.getElementById("codigo");

const botonManual = document.getElementById("btnManual");


// ========================================
// CÓDIGO LEÍDO
// ========================================

function codigoLeido(texto) {

    const codigoLimpio = texto.trim();

    console.log("Código leído:", codigoLimpio);

    codigo.innerHTML = `
        <p>Buscando producto...</p>
        <p><strong>Código:</strong> ${codigoLimpio}</p>
    `;

    buscarProducto(codigoLimpio);

}


// ========================================
// BUSCAR PRODUCTO EN FIRESTORE
// ========================================

async function buscarProducto(codigoLeido) {

    try {

        const productosRef = collection(db, "productos");

        const consulta = query(
            productosRef,
            where("codigo", "==", codigoLeido)
        );

        const resultado = await getDocs(consulta);


        // ========================================
        // PRODUCTO ENCONTRADO
        // ========================================

        if (!resultado.empty) {

            const documento = resultado.docs[0];

            const producto = documento.data();

            console.log("Producto encontrado:", producto);

            mostrarProducto(producto);

        }


        // ========================================
        // PRODUCTO NO ENCONTRADO
        // ========================================

        else {

            console.log("Producto no encontrado:", codigoLeido);

            mostrarProductoNoEncontrado(codigoLeido);

        }


    } catch (error) {

        console.error("Error consultando Firestore:", error);

        codigo.innerHTML = `
            <div class="producto-no-encontrado">

                <strong>Error al consultar el producto</strong>

                <p>
                    Revisa la conexión con Firebase.
                </p>

            </div>
        `;

    }

}


// ========================================
// MOSTRAR PRODUCTO
// ========================================

function mostrarProducto(producto) {

    codigo.innerHTML = `

        <div class="nombre">
            ${producto.nombre}
        </div>

        <div class="dato">

            <span class="etiqueta">
                Código:
            </span>

            ${producto.codigo}

        </div>

    `;

}


// ========================================
// PRODUCTO NO ENCONTRADO
// ========================================

function mostrarProductoNoEncontrado(codigoLeido) {

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
            >
                + Dar de alta producto
            </button>

        </div>

    `;


    const botonAlta = document.getElementById("btnAlta");

    botonAlta.addEventListener(
        "click",
        () => mostrarFormularioAlta(codigoLeido)
    );

}


// ========================================
// FORMULARIO PARA DAR DE ALTA
// ========================================

function mostrarFormularioAlta(codigoLeido) {

    codigo.innerHTML = `

        <div class="formulario-producto">

            <h3>Nuevo producto</h3>

            <div class="dato">

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


            <div class="dato">

                <label>
                    Nombre del producto
                </label>

                <input
                    type="text"
                    id="nuevoNombre"
                    placeholder="Nombre del producto"
                >

            </div>


            <button
                id="btnGuardarProducto"
                class="btn-guardar"
            >
                Guardar producto
            </button>

        </div>

    `;


    const botonGuardar =
        document.getElementById("btnGuardarProducto");


    botonGuardar.addEventListener(
        "click",
        guardarProducto
    );

}


// ========================================
// GUARDAR PRODUCTO EN FIRESTORE
// ========================================

async function guardarProducto() {

    const nuevoCodigo =
        document.getElementById("nuevoCodigo").value.trim();

    const nuevoNombre =
        document.getElementById("nuevoNombre").value.trim();


    if (nuevoNombre === "") {

        alert("Escribe el nombre del producto.");

        return;

    }


    try {

        const productosRef =
            collection(db, "productos");


        const consulta = query(
            productosRef,
            where("codigo", "==", nuevoCodigo)
        );


        const resultado =
            await getDocs(consulta);


        // Evitar duplicados

        if (!resultado.empty) {

            alert(
                "Este producto ya existe en el catálogo."
            );

            buscarProducto(nuevoCodigo);

            return;

        }


        // Importaremos addDoc en el siguiente paso
        // para guardar el producto.

        console.log(
            "Producto listo para guardar:",
            nuevoCodigo,
            nuevoNombre
        );


    } catch (error) {

        console.error(
            "Error verificando producto:",
            error
        );

        alert(
            "No fue posible verificar el producto."
        );

    }

}


// ========================================
// CÁMARA
// ========================================

const html5QrCode =
    new Html5Qrcode("reader");


Html5Qrcode.getCameras()

.then(cameras => {

    if (cameras && cameras.length > 0) {

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

            mostrarEntradaManual();

        });

    }

    else {

        console.log(
            "No hay cámaras disponibles"
        );

        mostrarEntradaManual();

    }

})

.catch(error => {

    console.log(
        "No se pudo acceder a la cámara:",
        error
    );

    mostrarEntradaManual();

});


// ========================================
// ENTRADA MANUAL
// ========================================

function mostrarEntradaManual() {

    document.getElementById("manual")
        .style.display = "block";

}


botonManual.addEventListener(
    "click",
    usarCodigoManual
);


function usarCodigoManual() {

    const entrada =
        document.getElementById("entradaManual");

    const texto =
        entrada.value.trim();


    if (texto !== "") {

        codigoLeido(texto);

    }

}