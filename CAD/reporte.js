import { db } from "./firebase.js";

import {
    collection,
    query,
    where,
    getDocs,
    Timestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// ========================================
// ELEMENTOS HTML
// ========================================

const configuracion = document.getElementById("configuracion");
const vistaPrevia = document.getElementById("vistaPrevia");

const mesReporte = document.getElementById("mesReporte");

const btnVistaPrevia = document.getElementById("btnVistaPrevia");
const btnRegresar = document.getElementById("btnRegresar");
const btnGenerarPDF = document.getElementById("btnGenerarPDF");

const mensaje = document.getElementById("mensaje");

const vigenciaCad = document.getElementById("vigenciaCad");
const vigenciaPac = document.getElementById("vigenciaPac");

const mesReporteTexto = document.getElementById("mesReporteTexto");
const vigenciaCadTexto = document.getElementById("vigenciaCadTexto");
const vigenciaPacTexto = document.getElementById("vigenciaPacTexto");

const cuerpoReporte = document.getElementById("cuerpoReporte");
const totalIncidencias = document.getElementById("totalIncidencias");

// ========================================
// ESTADO DEL REPORTE
// ========================================

let incidenciasReporte = [];
let datosReporte = null;

// ========================================
// MES ACTUAL PRESELECCIONADO
// ========================================

const ahora = new Date();

const mesActual =
    `${ahora.getFullYear()}-${String(
        ahora.getMonth() + 1
    ).padStart(2, "0")}`;

mesReporte.value = mesActual;

actualizarVigencias();

// ========================================
// CAMBIO DE MES
// ========================================

mesReporte.addEventListener(
    "change",
    actualizarVigencias
);

function actualizarVigencias() {

    if (!mesReporte.value) {

        vigenciaCad.textContent = "Selecciona un mes";
        vigenciaPac.textContent = "Selecciona un mes";

        return;
    }

    const [anio, mes] =
        mesReporte.value.split("-").map(Number);

    const cad1 = new Date(
        anio,
        mes - 1,
        1
    );

    const cad2 = new Date(
        anio,
        mes,
        1
    );

    const pac = new Date(
        anio,
        mes + 1,
        1
    );

    vigenciaCad.textContent =
        `${nombreMes(cad1)} ${cad1.getFullYear()} + ` +
        `${nombreMes(cad2)} ${cad2.getFullYear()}`;

    vigenciaPac.textContent =
        `${nombreMes(pac)} ${pac.getFullYear()}`;
}

// ========================================
// NOMBRE DEL MES
// ========================================

function nombreMes(fecha) {

    return fecha
        .toLocaleDateString(
            "es-MX",
            {
                month: "long"
            }
        )
        .replace(
            /^\w/,
            letra => letra.toUpperCase()
        );
}

// ========================================
// VER VISTA PREVIA
// ========================================

btnVistaPrevia.addEventListener(
    "click",
    generarVistaPrevia
);

async function generarVistaPrevia() {

    if (!mesReporte.value) {

        mostrarMensaje(
            "Selecciona el mes de revisión."
        );

        return;
    }

    btnVistaPrevia.disabled = true;

    btnVistaPrevia.textContent =
        "Consultando incidencias...";

    mostrarMensaje("");

    try {

        const [anio, mes] =
            mesReporte.value
                .split("-")
                .map(Number);

        const inicio = new Date(
            anio,
            mes - 1,
            1,
            0,
            0,
            0,
            0
        );

        const fin = new Date(
            anio,
            mes,
            1,
            0,
            0,
            0,
            0
        );

        const incidenciasRef =
            collection(
                db,
                "incidencias"
            );

        const consulta = query(

            incidenciasRef,

            where(
                "fechaRegistro",
                ">=",
                Timestamp.fromDate(inicio)
            ),

            where(
                "fechaRegistro",
                "<",
                Timestamp.fromDate(fin)
            )

        );

        const resultado =
            await getDocs(consulta);

        const incidenciasOriginales = [];

        resultado.forEach(documento => {

            const incidencia =
                documento.data();

            incidenciasOriginales.push({

                id: documento.id,

                ...incidencia

            });

        });

        // ========================================
        // AGRUPAR INCIDENCIAS
        // ========================================

        incidenciasReporte =
            agruparIncidencias(
                incidenciasOriginales
            );

        // ========================================
        // ORDENAR
        // ========================================

        incidenciasReporte.sort(
            ordenarIncidencias
        );

        // ========================================
        // DATOS DEL REPORTE
        // ========================================

        datosReporte =
            construirDatosReporte(
                anio,
                mes
            );

        // ========================================
        // CONSTRUIR VISTA
        // ========================================

        construirVistaPrevia();

        configuracion.classList.add(
            "oculto"
        );

        vistaPrevia.classList.remove(
            "oculto"
        );

    } catch (error) {

        console.error(
            "Error generando reporte:",
            error
        );

        mostrarMensaje(
            "❌ No fue posible consultar las incidencias."
        );

    } finally {

        btnVistaPrevia.disabled = false;

        btnVistaPrevia.textContent =
            "Ver vista previa";

    }
}

// ========================================
// AGRUPAR INCIDENCIAS
// ========================================
//
// MISMO código + MISMO lote + MISMA
// fecha de caducidad = SUMAR PIEZAS.
//
// Si cambia el lote o la caducidad,
// se mantiene como una línea diferente.
// ========================================

function agruparIncidencias(incidencias) {

    const grupos = new Map();

    incidencias.forEach(incidencia => {

        const codigo =
            incidencia.codigo ?? "";

        const lote =
            incidencia.lote ?? "";

        const caducidad =
            obtenerClaveFecha(
                incidencia.caducidad
            );

        const clave =
            `${codigo}|||${lote}|||${caducidad}`;

        if (grupos.has(clave)) {

            const existente =
                grupos.get(clave);

            existente.piezas =
                Number(
                    existente.piezas || 0
                ) +
                Number(
                    incidencia.piezas || 0
                );

        } else {

            grupos.set(
                clave,
                {
                    ...incidencia,

                    piezas:
                        Number(
                            incidencia.piezas || 0
                        )
                }
            );

        }

    });

    return Array.from(
        grupos.values()
    );
}

// ========================================
// OBTENER CLAVE DE FECHA
// ========================================

function obtenerClaveFecha(fecha) {

    if (!fecha) {

        return "";
    }

    if (
        typeof fecha.toDate === "function"
    ) {

        const fechaConvertida =
            fecha.toDate();

        return [

            fechaConvertida.getFullYear(),

            String(
                fechaConvertida.getMonth() + 1
            ).padStart(2, "0"),

            String(
                fechaConvertida.getDate()
            ).padStart(2, "0")

        ].join("-");
    }

    if (fecha instanceof Date) {

        return [

            fecha.getFullYear(),

            String(
                fecha.getMonth() + 1
            ).padStart(2, "0"),

            String(
                fecha.getDate()
            ).padStart(2, "0")

        ].join("-");
    }

    const texto =
        String(fecha).trim();

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(texto)
    ) {

        return texto;
    }

    if (
        /^\d{2}\/\d{2}\/\d{4}$/.test(texto)
    ) {

        const [
            dia,
            mes,
            anio
        ] = texto.split("/");

        return `${anio}-${mes}-${dia}`;
    }

    const fechaConvertida =
        new Date(texto);

    if (
        !isNaN(
            fechaConvertida.getTime()
        )
    ) {

        return [

            fechaConvertida.getFullYear(),

            String(
                fechaConvertida.getMonth() + 1
            ).padStart(2, "0"),

            String(
                fechaConvertida.getDate()
            ).padStart(2, "0")

        ].join("-");
    }

    return texto;
}

// ========================================
// ORDEN DE INCIDENCIAS
// ========================================

function ordenarIncidencias(a, b) {

    const ordenEstado = {

        "Caducado": 1,

        "Próximo a caducar": 2,

        "Mal estado": 3

    };

    const diferenciaEstado =
        (ordenEstado[a.estado] || 99) -
        (ordenEstado[b.estado] || 99);

    if (diferenciaEstado !== 0) {

        return diferenciaEstado;
    }

    const fechaA =
        convertirFechaOrden(
            a.caducidad
        );

    const fechaB =
        convertirFechaOrden(
            b.caducidad
        );

    return fechaA - fechaB;
}

// ========================================
// CONVERTIR FECHA PARA ORDENAMIENTO
// ========================================

function convertirFechaOrden(fecha) {

    if (!fecha) {

        return new Date(
            9999,
            11,
            31
        );
    }

    if (
        typeof fecha.toDate === "function"
    ) {

        return fecha.toDate();
    }

    if (fecha instanceof Date) {

        return fecha;
    }

    const texto =
        String(fecha);

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(texto)
    ) {

        const [
            anio,
            mes,
            dia
        ] =
            texto.split("-").map(Number);

        return new Date(
            anio,
            mes - 1,
            dia
        );
    }

    if (
        /^\d{2}\/\d{2}\/\d{4}$/.test(texto)
    ) {

        const [
            dia,
            mes,
            anio
        ] =
            texto.split("/").map(Number);

        return new Date(
            anio,
            mes - 1,
            dia
        );
    }

    const fechaConvertida =
        new Date(texto);

    if (
        !isNaN(
            fechaConvertida.getTime()
        )
    ) {

        return fechaConvertida;
    }

    return new Date(
        9999,
        11,
        31
    );
}

// ========================================
// DATOS DEL REPORTE
// ========================================

function construirDatosReporte(
    anio,
    mes
) {

    const fechaRevision =
        new Date(
            anio,
            mes - 1,
            1
        );

    const fechaCad1 =
        new Date(
            anio,
            mes - 1,
            1
        );

    const fechaCad2 =
        new Date(
            anio,
            mes,
            1
        );

    const fechaPac =
        new Date(
            anio,
            mes + 1,
            1
        );

    return {

        revision:
            `${nombreMes(fechaRevision)} ${anio}`,

        cad:
            `${nombreMes(fechaCad1)} ${fechaCad1.getFullYear()} + ` +
            `${nombreMes(fechaCad2)} ${fechaCad2.getFullYear()}`,

        pac:
            `${nombreMes(fechaPac)} ${fechaPac.getFullYear()}`

    };
}

// ========================================
// CONSTRUIR VISTA PREVIA
// ========================================

function construirVistaPrevia() {

    mesReporteTexto.textContent =
        datosReporte.revision;

    vigenciaCadTexto.textContent =
        datosReporte.cad;

    vigenciaPacTexto.textContent =
        datosReporte.pac;

    cuerpoReporte.innerHTML = "";

    if (incidenciasReporte.length === 0) {

        cuerpoReporte.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    style="padding:20px;"
                >

                    No existen incidencias
                    registradas durante este mes.

                </td>

            </tr>

        `;

        totalIncidencias.textContent =
            "0";

        return;
    }

    incidenciasReporte.forEach(
        (
            incidencia,
            indice
        ) => {

            const fila =
                document.createElement("tr");

            const esCaducado =
                incidencia.estado ===
                "Caducado";

            const esPAC =
                incidencia.estado ===
                "Próximo a caducar";

            const esMalEstado =
                incidencia.estado ===
                "Mal estado";

            fila.innerHTML = `

                <td>
                    ${indice + 1}
                </td>

                <td>
                    ${escaparHTML(
                        incidencia.codigo
                    )}
                </td>

                <td class="descripcion">
                    ${escaparHTML(
                        incidencia.nombre
                    )}
                </td>

                <td>
                    ${esCaducado ? "X" : ""}
                </td>

                <td>
                    ${esPAC ? "X" : ""}
                </td>

                <td>
                    ${esMalEstado ? "X" : ""}
                </td>

                <td>
                    ${escaparHTML(
                        incidencia.lote
                    )}
                </td>

                <td>
                    ${formatearFecha(
                        incidencia.caducidad
                    )}
                </td>

                <td>
                    ${incidencia.piezas || 0}
                </td>

            `;

            cuerpoReporte.appendChild(
                fila
            );

        }
    );

    totalIncidencias.textContent =
        incidenciasReporte.length;
}

// ========================================
// REGRESAR A CONFIGURACIÓN
// ========================================

btnRegresar.addEventListener(
    "click",
    function () {

        vistaPrevia.classList.add(
            "oculto"
        );

        configuracion.classList.remove(
            "oculto"
        );

    }
);

// ========================================
// GENERAR PDF
// ========================================

btnGenerarPDF.addEventListener(
    "click",
    generarPDF
);

async function generarPDF() {

    if (incidenciasReporte.length === 0) {

        alert(
            "No existen incidencias para generar el reporte."
        );

        return;
    }

    try {

        btnGenerarPDF.disabled = true;

        btnGenerarPDF.textContent =
            "Generando PDF...";

        await cargarLibreriasPDF();

        const { jsPDF } = window.jspdf;

        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "letter"
        });

        const margen = 12;

        let y = 15;

        const logo =
            document.getElementById(
                "logoReporte"
            );

        if (
            logo &&
            logo.complete &&
            logo.naturalWidth > 0
        ) {

            try {

                doc.addImage(
                    logo,
                    "PNG",
                    margen,
                    y,
                    25,
                    18
                );

            } catch (error) {

                console.log(
                    "No fue posible agregar el logo:",
                    error
                );

            }
        }

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(16);

        doc.text(
            "REPORTE DE PRODUCTOS",
            105,
            y + 7,
            {
                align: "center"
            }
        );

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(9);

        doc.text(
            "Registro mensual de incidencias",
            105,
            y + 13,
            {
                align: "center"
            }
        );

        y += 27;

        doc.setFontSize(8);

        doc.text(
            `Mes de revisión: ${datosReporte.revision}`,
            margen,
            y
        );

        doc.text(
            `Vigencia CAD: ${datosReporte.cad}`,
            margen + 65,
            y
        );

        doc.text(
            `Vigencia PAC: ${datosReporte.pac}`,
            margen + 140,
            y
        );

        y += 8;

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.text(
            "Clasificación:",
            margen,
            y
        );

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.text(
            "CAD = Caducados    PAC = Próximos a caducar    ME = Mal estado",
            margen + 22,
            y
        );

        y += 7;

        const filasPDF =
            incidenciasReporte.map(
                (
                    incidencia,
                    indice
                ) => [

                    indice + 1,

                    incidencia.codigo || "",

                    incidencia.nombre || "",

                    incidencia.estado ===
                    "Caducado"
                        ? "X"
                        : "",

                    incidencia.estado ===
                    "Próximo a caducar"
                        ? "X"
                        : "",

                    incidencia.estado ===
                    "Mal estado"
                        ? "X"
                        : "",

                    incidencia.lote || "",

                    formatearFecha(
                        incidencia.caducidad
                    ),

                    incidencia.piezas || 0

                ]
            );

        doc.autoTable({

            startY: y,

            head: [[
                "#",
                "Código",
                "Descripción",
                "CAD",
                "PAC",
                "ME",
                "Lote",
                "Caducidad",
                "Piezas"
            ]],

            body: filasPDF,

            theme: "grid",

            styles: {

                fontSize: 7,

                cellPadding: 2,

                lineColor: [
                    0,
                    0,
                    0
                ],

                lineWidth: 0.2,

                textColor: [
                    0,
                    0,
                    0
                ]

            },

            headStyles: {

                fillColor: [
                    220,
                    220,
                    220
                ],

                textColor: [
                    0,
                    0,
                    0
                ],

                fontStyle: "bold"

            },

            columnStyles: {

                0: {
                    cellWidth: 8
                },

                1: {
                    cellWidth: 25
                },

                2: {
                    cellWidth: 53
                },

                3: {
                    cellWidth: 10
                },

                4: {
                    cellWidth: 10
                },

                5: {
                    cellWidth: 10
                },

                6: {
                    cellWidth: 20
                },

                7: {
                    cellWidth: 22
                },

                8: {
                    cellWidth: 12
                }

            }

        });

        let firmaY =
            doc.lastAutoTable.finalY + 30;

        if (firmaY > 240) {

            doc.addPage();

            firmaY = 35;
        }

        const posiciones = [
            40,
            105,
            170
        ];

        const nombres = [

            "Colaborador",

            "Administrador de Inventarios",

            "Responsable de Farmacia"

        ];

        posiciones.forEach(
            (
                posicion,
                indice
            ) => {

                doc.line(
                    posicion - 25,
                    firmaY,
                    posicion + 25,
                    firmaY
                );

                doc.setFontSize(8);

                doc.text(
                    nombres[indice],
                    posicion,
                    firmaY + 5,
                    {
                        align: "center"
                    }
                );

            }
        );

        const nombreArchivo =
            `Reporte_Incidencias_${mesReporte.value}.pdf`;

        doc.save(nombreArchivo);

    } catch (error) {

        console.error(
            "Error generando PDF:",
            error
        );

        alert(
            "No fue posible generar el PDF."
        );

    } finally {

        btnGenerarPDF.disabled = false;

        btnGenerarPDF.textContent =
            "🖨 Generar PDF";

    }
}

// ========================================
// CARGAR LIBRERÍAS PDF
// ========================================

function cargarLibreriasPDF() {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            if (
                window.jspdf &&
                window.jspdf.jsPDF
            ) {

                cargarAutoTable(
                    resolve,
                    reject
                );

                return;
            }

            const script =
                document.createElement(
                    "script"
                );

            script.src =
                "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";

            script.onload = () => {

                cargarAutoTable(
                    resolve,
                    reject
                );

            };

            script.onerror = () => {

                reject(
                    new Error(
                        "No se pudo cargar jsPDF."
                    )
                );

            };

            document.head.appendChild(
                script
            );

        }
    );
}

// ========================================
// CARGAR AUTOTABLE
// ========================================

function cargarAutoTable(
    resolve,
    reject
) {

    if (
        window.jspdf &&
        window.jspdf.jsPDF &&
        typeof window.jspdf.jsPDF.prototype.autoTable ===
        "function"
    ) {

        resolve();

        return;
    }

    const script =
        document.createElement(
            "script"
        );

    script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";

    script.onload = () => {

        resolve();

    };

    script.onerror = () => {

        reject(
            new Error(
                "No se pudo cargar jsPDF-AutoTable."
            )
        );

    };

    document.head.appendChild(
        script
    );
}

// ========================================
// FORMATEAR FECHA
// ========================================

function formatearFecha(fecha) {

    if (!fecha) {

        return "";
    }

    if (
        typeof fecha.toDate ===
        "function"
    ) {

        fecha = fecha.toDate();
    }

    if (fecha instanceof Date) {

        return [

            String(
                fecha.getDate()
            ).padStart(2, "0"),

            String(
                fecha.getMonth() + 1
            ).padStart(2, "0"),

            fecha.getFullYear()

        ].join("/");
    }

    const partes =
        String(fecha).split("-");

    if (partes.length === 3) {

        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    return String(fecha);
}

// ========================================
// EVITAR HTML INYECTADO
// ========================================

function escaparHTML(valor) {

    if (
        valor === undefined ||
        valor === null
    ) {

        return "";
    }

    return String(valor)

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

// ========================================
// MENSAJES
// ========================================

function mostrarMensaje(texto) {

    mensaje.textContent = texto;
}