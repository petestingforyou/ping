// ========================================
// PASSBAR
// CONTROL DE LICENCIAS
// ========================================

import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// ========================================
// CONFIGURACIÓN
// ========================================

const COLECCION_LICENCIAS = "licencias";

const CLAVE_SESION = "passbar_licencia";


// ========================================
// OBTENER LICENCIA GUARDADA
// ========================================

export function obtenerLicenciaGuardada() {

    return sessionStorage.getItem(
        CLAVE_SESION
    );
}


// ========================================
// GUARDAR LICENCIA EN SESIÓN
// ========================================

function guardarLicencia(licencia) {

    sessionStorage.setItem(
        CLAVE_SESION,
        licencia
    );
}


// ========================================
// ELIMINAR LICENCIA DE SESIÓN
// ========================================

export function cerrarLicencia() {

    sessionStorage.removeItem(
        CLAVE_SESION
    );
}


// ========================================
// CONVERTIR FECHA
// ========================================

function convertirFecha(valor) {

    if (!valor) {
        return null;
    }


    // ------------------------------------
    // FIRESTORE TIMESTAMP
    // ------------------------------------

    if (
        typeof valor.toDate === "function"
    ) {

        return valor.toDate();
    }


    // ------------------------------------
    // DATE
    // ------------------------------------

    if (valor instanceof Date) {

        return valor;
    }


    const texto = String(valor).trim();


    // ------------------------------------
    // DD-MM-YY
    // Ejemplo: 01-10-26
    // ------------------------------------

    if (
        /^\d{2}-\d{2}-\d{2}$/.test(texto)
    ) {

        const partes = texto.split("-");

        const dia = Number(partes[0]);

        const mes = Number(partes[1]);

        let anio = Number(partes[2]);

        anio += anio < 70
            ? 2000
            : 1900;


        const fecha = new Date(
            anio,
            mes - 1,
            dia
        );


        if (
            !isNaN(fecha.getTime())
        ) {

            return fecha;
        }
    }


    // ------------------------------------
    // DD/MM/YY
    // ------------------------------------

    if (
        /^\d{2}\/\d{2}\/\d{2}$/.test(texto)
    ) {

        const partes = texto.split("/");

        const dia = Number(partes[0]);

        const mes = Number(partes[1]);

        let anio = Number(partes[2]);

        anio += anio < 70
            ? 2000
            : 1900;


        const fecha = new Date(
            anio,
            mes - 1,
            dia
        );


        if (
            !isNaN(fecha.getTime())
        ) {

            return fecha;
        }
    }


    // ------------------------------------
    // DD-MM-YYYY
    // ------------------------------------

    if (
        /^\d{2}-\d{2}-\d{4}$/.test(texto)
    ) {

        const partes = texto.split("-");

        const dia = Number(partes[0]);

        const mes = Number(partes[1]);

        const anio = Number(partes[2]);


        const fecha = new Date(
            anio,
            mes - 1,
            dia
        );


        if (
            !isNaN(fecha.getTime())
        ) {

            return fecha;
        }
    }


    // ------------------------------------
    // DD/MM/YYYY
    // ------------------------------------

    if (
        /^\d{2}\/\d{2}\/\d{4}$/.test(texto)
    ) {

        const partes = texto.split("/");

        const dia = Number(partes[0]);

        const mes = Number(partes[1]);

        const anio = Number(partes[2]);


        const fecha = new Date(
            anio,
            mes - 1,
            dia
        );


        if (
            !isNaN(fecha.getTime())
        ) {

            return fecha;
        }
    }


    // ------------------------------------
    // YYYY-MM-DD
    // ------------------------------------

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(texto)
    ) {

        const partes = texto.split("-");

        const anio = Number(partes[0]);

        const mes = Number(partes[1]);

        const dia = Number(partes[2]);


        const fecha = new Date(
            anio,
            mes - 1,
            dia
        );


        if (
            !isNaN(fecha.getTime())
        ) {

            return fecha;
        }
    }


    // ------------------------------------
    // INTENTO GENERAL
    // ------------------------------------

    const fecha = new Date(texto);


    if (
        !isNaN(fecha.getTime())
    ) {

        return fecha;
    }


    return null;
}


// ========================================
// FORMATEAR FECHA
// ========================================

export function formatearFechaLicencia(valor) {

    const fecha = convertirFecha(valor);


    if (!fecha) {

        return "No definida";
    }


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


// ========================================
// VALIDAR LICENCIA
// ========================================

export async function validarLicencia(
    licenciaIngresada = null
) {

    try {

        let clave = licenciaIngresada;


        // --------------------------------
        // RECUPERAR LICENCIA DE SESIÓN
        // --------------------------------

        if (!clave) {

            clave =
                obtenerLicenciaGuardada();
        }


        if (!clave) {

            return {

                valida: false,

                motivo:
                    "No se ha ingresado una licencia."
            };
        }


        clave = clave.trim();


        if (!clave) {

            return {

                valida: false,

                motivo:
                    "La licencia está vacía."
            };
        }


        // --------------------------------
        // BUSCAR DOCUMENTO
        // --------------------------------

        const referencia = doc(
            db,
            COLECCION_LICENCIAS,
            clave
        );


        const resultado =
            await getDoc(referencia);


        if (!resultado.exists()) {

            return {

                valida: false,

                motivo:
                    "La licencia no existe."
            };
        }


        const datos = resultado.data();


        // --------------------------------
        // LICENCIA ACTIVA
        // --------------------------------

        if (datos.activa !== true) {

            return {

                valida: false,

                motivo:
                    "La licencia está desactivada.",

                licencia: clave,

                cliente:
                    datos.cliente || ""
            };
        }


        // --------------------------------
        // FECHA INICIO
        // --------------------------------

        const fechaInicio =
            convertirFecha(
                datos.fechaInicio
            );


        if (fechaInicio) {

            const ahora = new Date();


            if (ahora < fechaInicio) {

                return {

                    valida: false,

                    motivo:
                        "La licencia todavía no está vigente.",

                    licencia: clave,

                    cliente:
                        datos.cliente || "",

                    fechaInicio:
                        datos.fechaInicio || null,

                    fechaFin:
                        datos.fechaFin || null
                };
            }
        }


        // --------------------------------
        // FECHA FIN
        // --------------------------------

        const fechaFin =
            convertirFecha(
                datos.fechaFin
            );


        if (fechaFin) {

            const ahora = new Date();


            if (ahora > fechaFin) {

                return {

                    valida: false,

                    motivo:
                        "La licencia ha vencido.",

                    licencia: clave,

                    cliente:
                        datos.cliente || "",

                    fechaInicio:
                        datos.fechaInicio || null,

                    fechaFin:
                        datos.fechaFin || null
                };
            }
        }


        // --------------------------------
        // LÍMITE DE CÓDIGOS
        // --------------------------------

        const limiteCodigos =
            Number(
                datos.limiteCodigos || 0
            );


        const codigosGenerados =
            Number(
                datos.codigosGenerados || 0
            );


        const disponibles =
            limiteCodigos > 0

                ? Math.max(
                    0,
                    limiteCodigos -
                    codigosGenerados
                )

                : Infinity;


        // --------------------------------
        // LÍMITE ALCANZADO
        // --------------------------------

        if (
            limiteCodigos > 0 &&
            codigosGenerados >= limiteCodigos
        ) {

            return {

                valida: false,

                motivo:
                    "La licencia ha alcanzado el límite de códigos.",

                licencia: clave,

                cliente:
                    datos.cliente || "",

                activa:
                    datos.activa === true,

                fechaInicio:
                    datos.fechaInicio || null,

                fechaFin:
                    datos.fechaFin || null,

                limiteCodigos,

                codigosGenerados,

                disponibles: 0
            };
        }


        // --------------------------------
        // GUARDAR LICENCIA
        // --------------------------------

        guardarLicencia(clave);


        // --------------------------------
        // LICENCIA CORRECTA
        // --------------------------------

        return {

            valida: true,

            licencia: clave,

            cliente:
                datos.cliente || "",

            activa:
                datos.activa === true,

            fechaInicio:
                datos.fechaInicio || null,

            fechaFin:
                datos.fechaFin || null,

            limiteCodigos,

            codigosGenerados,

            disponibles,

            motivo:
                "Licencia válida"
        };


    } catch (error) {

        console.error(
            "Error validando licencia:",
            error
        );


        return {

            valida: false,

            motivo:
                "No fue posible comprobar la licencia."
        };
    }
}


// ========================================
// REGISTRAR CÓDIGOS GENERADOS
// ========================================

export async function registrarCodigosGenerados(
    cantidad
) {

    try {

        const licencia =
            obtenerLicenciaGuardada();


        if (!licencia) {

            return {

                correcto: false,

                motivo:
                    "No hay una licencia activa."
            };
        }


        const cantidadSolicitada =
            Number(cantidad);


        if (
            !Number.isInteger(
                cantidadSolicitada
            ) ||
            cantidadSolicitada <= 0
        ) {

            return {

                correcto: false,

                motivo:
                    "La cantidad de códigos no es válida."
            };
        }


        // --------------------------------
        // REFERENCIA
        // --------------------------------

        const referencia = doc(
            db,
            COLECCION_LICENCIAS,
            licencia
        );


        // --------------------------------
        // TRANSACCIÓN
        // --------------------------------

        const resultado =
            await runTransaction(
                db,
                async (transaction) => {

                    const documento =
                        await transaction.get(
                            referencia
                        );


                    // -------------------------
                    // LICENCIA NO EXISTE
                    // -------------------------

                    if (
                        !documento.exists()
                    ) {

                        throw new Error(
                            "LICENCIA_NO_EXISTE"
                        );
                    }


                    const datos =
                        documento.data();


                    // -------------------------
                    // ACTIVA
                    // -------------------------

                    if (
                        datos.activa !== true
                    ) {

                        throw new Error(
                            "LICENCIA_DESACTIVADA"
                        );
                    }


                    // -------------------------
                    // FECHA INICIO
                    // -------------------------

                    const fechaInicio =
                        convertirFecha(
                            datos.fechaInicio
                        );


                    if (
                        fechaInicio &&
                        new Date() <
                        fechaInicio
                    ) {

                        throw new Error(
                            "LICENCIA_NO_VIGENTE"
                        );
                    }


                    // -------------------------
                    // FECHA FIN
                    // -------------------------

                    const fechaFin =
                        convertirFecha(
                            datos.fechaFin
                        );


                    if (
                        fechaFin &&
                        new Date() >
                        fechaFin
                    ) {

                        throw new Error(
                            "LICENCIA_VENCIDA"
                        );
                    }


                    // -------------------------
                    // CONTADORES
                    // -------------------------

                    const limite =
                        Number(
                            datos.limiteCodigos || 0
                        );


                    const actual =
                        Number(
                            datos.codigosGenerados || 0
                        );


                    // -------------------------
                    // COMPROBAR LÍMITE
                    // -------------------------

                    if (
                        limite > 0 &&
                        actual +
                        cantidadSolicitada >
                        limite
                    ) {

                        throw new Error(
                            "LIMITE_INSUFICIENTE"
                        );
                    }


                    // -------------------------
                    // NUEVO TOTAL
                    // -------------------------

                    const nuevoTotal =
                        actual +
                        cantidadSolicitada;


                    // -------------------------
                    // ACTUALIZAR
                    // -------------------------

                    transaction.update(
                        referencia,
                        {

                            codigosGenerados:
                                nuevoTotal
                        }
                    );


                    return nuevoTotal;
                }
            );


        // --------------------------------
        // RESULTADO CORRECTO
        // --------------------------------

        return {

            correcto: true,

            codigosGenerados:
                resultado,

            licencia
        };


    } catch (error) {

        console.error(
            "Error registrando códigos:",
            error
        );


        let motivo =
            "No fue posible registrar la generación.";


        switch (error.message) {

            case "LICENCIA_NO_EXISTE":

                motivo =
                    "La licencia ya no existe.";

                break;


            case "LICENCIA_DESACTIVADA":

                motivo =
                    "La licencia está desactivada.";

                break;


            case "LICENCIA_NO_VIGENTE":

                motivo =
                    "La licencia todavía no está vigente.";

                break;


            case "LICENCIA_VENCIDA":

                motivo =
                    "La licencia ha vencido.";

                break;


            case "LIMITE_INSUFICIENTE":

                motivo =
                    "La licencia no tiene suficientes códigos disponibles.";

                break;
        }


        return {

            correcto: false,

            motivo
        };
    }
}