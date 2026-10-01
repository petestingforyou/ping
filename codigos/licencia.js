import { app } from "./firebase.js";

import {
    getFirestore,
    doc,
    getDoc,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// ========================================
// FIRESTORE
// ========================================

const db = getFirestore(app);


// ========================================
// LICENCIA QUE VAMOS A COMPROBAR
// ========================================

const ID_LICENCIA = "free-01";


// ========================================
// CONVERTIR FECHA DD-MM-YY
// ========================================

function convertirFecha(fechaTexto) {

    if (
        typeof fechaTexto !== "string"
    ) {

        return null;

    }


    const partes =
        fechaTexto.split("-");


    if (
        partes.length !== 3
    ) {

        return null;

    }


    const dia =
        Number(partes[0]);


    const mes =
        Number(partes[1]) - 1;


    const anio =
        2000 + Number(partes[2]);


    if (
        !Number.isInteger(dia) ||
        !Number.isInteger(mes) ||
        !Number.isInteger(anio)
    ) {

        return null;

    }


    const fecha =
        new Date(
            anio,
            mes,
            dia,
            23,
            59,
            59,
            999
        );


    return fecha;

}


// ========================================
// VALIDAR LICENCIA
// ========================================

export async function validarLicencia() {

    try {

        const referencia =
            doc(
                db,
                "licencias",
                ID_LICENCIA
            );


        const resultado =
            await getDoc(
                referencia
            );


        // ====================================
        // LICENCIA NO EXISTE
        // ====================================

        if (
            !resultado.exists()
        ) {

            return {

                valida: false,

                motivo:
                    "La licencia no existe."

            };

        }


        // ====================================
        // OBTENER DATOS
        // ====================================

        const datos =
            resultado.data();


        // ====================================
        // LICENCIA DESACTIVADA
        // ====================================

        if (
            datos.activa !== true
        ) {

            return {

                valida: false,

                motivo:
                    "La licencia está desactivada."

            };

        }


        // ====================================
        // FECHA DE INICIO
        // ====================================

        const hoy =
            new Date();


        const fechaInicio =
            convertirFecha(
                datos.fechaInicio
            );


        if (
            !fechaInicio
        ) {

            return {

                valida: false,

                motivo:
                    "La fecha de inicio no es válida."

            };

        }


        // ====================================
        // LICENCIA TODAVÍA NO INICIA
        // ====================================

        if (
            hoy < fechaInicio
        ) {

            return {

                valida: false,

                motivo:
                    "La licencia todavía no está vigente."

            };

        }


        // ====================================
        // FECHA DE VENCIMIENTO
        // ====================================

        const fechaFin =
            convertirFecha(
                datos.fechaFin
            );


        if (
            !fechaFin
        ) {

            return {

                valida: false,

                motivo:
                    "La fecha de vencimiento no es válida."

            };

        }


        // ====================================
        // LICENCIA VENCIDA
        // ====================================

        if (
            hoy > fechaFin
        ) {

            return {

                valida: false,

                motivo:
                    "La licencia ha vencido."

            };

        }


        // ====================================
        // DATOS NUMÉRICOS
        // ====================================

        const limiteCodigos =
            Number(
                datos.limiteCodigos
            ) || 0;


        const codigosGenerados =
            Number(
                datos.codigosGenerados
            ) || 0;


        // ====================================
        // LÍMITE ALCANZADO
        // ====================================

        if (
            limiteCodigos > 0 &&
            codigosGenerados >= limiteCodigos
        ) {

            return {

                valida: false,

                motivo:
                    "La licencia ha alcanzado el límite de códigos."

            };

        }


        // ====================================
        // LICENCIA CORRECTA
        // ====================================

        return {

            valida: true,

            licencia:
                ID_LICENCIA,

            cliente:
                datos.cliente || "",

            fechaInicio:
                datos.fechaInicio || "",

            fechaFin:
                datos.fechaFin || "",

            limiteCodigos,

            codigosGenerados

        };

    } catch (error) {

        console.error(
            "Error al validar licencia:",
            error
        );


        return {

            valida: false,

            motivo:
                "No fue posible verificar la licencia."

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

        // ====================================
        // VALIDAR CANTIDAD
        // ====================================

        if (
            !Number.isInteger(cantidad) ||
            cantidad <= 0
        ) {

            return {

                correcto: false,

                motivo:
                    "La cantidad de códigos no es válida."

            };

        }


        // ====================================
        // REFERENCIA
        // ====================================

        const referencia =
            doc(
                db,
                "licencias",
                ID_LICENCIA
            );


        // ====================================
        // TRANSACCIÓN
        // ====================================

        const resultado =
            await runTransaction(
                db,
                async (transaction) => {

                    const snapshot =
                        await transaction.get(
                            referencia
                        );


                    // =================================
                    // LICENCIA NO EXISTE
                    // =================================

                    if (
                        !snapshot.exists()
                    ) {

                        throw new Error(
                            "La licencia no existe."
                        );

                    }


                    const datos =
                        snapshot.data();


                    const limite =
                        Number(
                            datos.limiteCodigos
                        ) || 0;


                    const actuales =
                        Number(
                            datos.codigosGenerados
                        ) || 0;


                    const nuevoTotal =
                        actuales +
                        cantidad;


                    // =================================
                    // COMPROBAR LÍMITE
                    // =================================

                    if (
                        limite > 0 &&
                        nuevoTotal > limite
                    ) {

                        throw new Error(
                            "La generación supera el límite disponible."
                        );

                    }


                    // =================================
                    // ACTUALIZAR CONTADOR
                    // =================================

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


        return {

            correcto: true,

            codigosGenerados:
                resultado

        };

    } catch (error) {

        console.error(
            "Error al registrar códigos:",
            error
        );


        return {

            correcto: false,

            motivo:
                error.message ||
                "No fue posible registrar los códigos."

        };

    }

}