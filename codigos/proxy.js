// =====================================================
// PASSBAR - PROXY LOCAL
// Comunicación entre Pc.html y Google Apps Script
// =====================================================

const http = require("http");


// =====================================================
// CONFIGURACIÓN
// =====================================================

const PUERTO = 3000;

const API_APPS_SCRIPT =
    "https://script.google.com/macros/s/AKfycbwvG1bVGWD8V0o-fafXariezwgXndnCsmkSD1U8tlZUf2vGbjS0in4mx6Y-AA9t7ef2/exec";

// Esta misma clave deberá existir en Google Apps Script.
const CLAVE_ADMIN =
    "PASSBAR-ADMIN-2026-SEGURA";


// =====================================================
// RESPUESTA
// =====================================================

function responder(
    respuesta,
    codigo,
    datos
) {

    respuesta.writeHead(
        codigo,
        {
            "Content-Type":
                "application/json; charset=utf-8",

            "Access-Control-Allow-Origin":
                "http://127.0.0.1:5500",

            "Access-Control-Allow-Methods":
                "GET, POST, OPTIONS",

            "Access-Control-Allow-Headers":
                "Content-Type"
        }
    );

    respuesta.end(
        JSON.stringify(
            datos
        )
    );

}


// =====================================================
// LEER BODY
// =====================================================

function leerBody(
    solicitud
) {

    return new Promise(
        (
            resolver,
            rechazar
        ) => {

            let datos = "";

            solicitud.on(
                "data",
                fragmento => {

                    datos +=
                        fragmento.toString();

                }
            );

            solicitud.on(
                "end",
                () => {

                    resolver(
                        datos
                    );

                }
            );

            solicitud.on(
                "error",
                error => {

                    rechazar(
                        error
                    );

                }
            );

        }
    );

}


// =====================================================
// SERVIDOR
// =====================================================

const servidor =
    http.createServer(
        async (
            solicitud,
            respuesta
        ) => {

            try {

                // --------------------------------
                // CORS PREFLIGHT
                // --------------------------------

                if (
                    solicitud.method ===
                    "OPTIONS"
                ) {

                    respuesta.writeHead(
                        204,
                        {
                            "Access-Control-Allow-Origin":
                                "http://127.0.0.1:5500",

                            "Access-Control-Allow-Methods":
                                "GET, POST, OPTIONS",

                            "Access-Control-Allow-Headers":
                                "Content-Type"
                        }
                    );

                    respuesta.end();

                    return;

                }


                // --------------------------------
                // RUTA
                // --------------------------------

                if (
                    solicitud.url !== "/" &&
                    !solicitud.url.startsWith(
                        "/api"
                    )
                ) {

                    responder(
                        respuesta,
                        404,
                        {
                            ok: false,
                            error:
                                "Ruta no encontrada."
                        }
                    );

                    return;

                }


                // --------------------------------
                // GET
                // --------------------------------

                if (
                    solicitud.method ===
                    "GET"
                ) {

                    const url =
                        new URL(
                            solicitud.url,
                            `http://localhost:${PUERTO}`
                        );


                    const destino =
                        new URL(
                            API_APPS_SCRIPT
                        );


                    url.searchParams.forEach(
                        (
                            valor,
                            clave
                        ) => {

                            destino.searchParams.set(
                                clave,
                                valor
                            );

                        }
                    );


                    destino.searchParams.set(
                        "claveAdmin",
                        CLAVE_ADMIN
                    );


                    console.log(
                        "GET → Apps Script:",
                        destino.searchParams.toString()
                    );


                    const respuestaAppsScript =
                        await fetch(
                            destino.toString(),
                            {
                                method: "GET",
                                redirect: "follow"
                            }
                        );


                    const texto =
                        await respuestaAppsScript.text();


                    let datos;


                    try {

                        datos =
                            JSON.parse(
                                texto
                            );

                    } catch {

                        datos = {

                            ok: false,

                            error:
                                "Apps Script devolvió una respuesta que no es JSON.",

                            respuesta:
                                texto

                        };

                    }


                    responder(
                        respuesta,
                        respuestaAppsScript.ok
                            ? 200
                            : respuestaAppsScript.status,
                        datos
                    );


                    return;

                }


                // --------------------------------
                // POST
                // --------------------------------

                if (
                    solicitud.method ===
                    "POST"
                ) {

                    const body =
                        await leerBody(
                            solicitud
                        );


                    let datos;


                    try {

                        datos =
                            JSON.parse(
                                body
                            );

                    } catch {

                        responder(
                            respuesta,
                            400,
                            {
                                ok: false,
                                error:
                                    "El cuerpo recibido no es JSON válido."
                            }
                        );

                        return;

                    }


                    datos.claveAdmin =
                        CLAVE_ADMIN;


                    console.log(
                        "POST → Apps Script:",
                        datos.accion
                    );


                    const respuestaAppsScript =
                        await fetch(
                            API_APPS_SCRIPT,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "text/plain;charset=utf-8"
                                },

                                body:
                                    JSON.stringify(
                                        datos
                                    ),

                                redirect:
                                    "follow"
                            }
                        );


                    const texto =
                        await respuestaAppsScript.text();


                    let resultado;


                    try {

                        resultado =
                            JSON.parse(
                                texto
                            );

                    } catch {

                        resultado = {

                            ok: false,

                            error:
                                "Apps Script devolvió una respuesta que no es JSON.",

                            respuesta:
                                texto

                        };

                    }


                    responder(
                        respuesta,
                        respuestaAppsScript.ok
                            ? 200
                            : respuestaAppsScript.status,
                        resultado
                    );


                    return;

                }


                // --------------------------------
                // MÉTODO NO PERMITIDO
                // --------------------------------

                responder(
                    respuesta,
                    405,
                    {
                        ok: false,
                        error:
                            "Método no permitido."
                    }
                );

            } catch (error) {

                console.error(
                    "ERROR DEL PROXY:",
                    error
                );


                responder(
                    respuesta,
                    500,
                    {
                        ok: false,
                        error:
                            error.message ||
                            "Error interno del proxy."
                    }
                );

            }

        }
    );


// =====================================================
// INICIAR
// =====================================================

servidor.listen(
    PUERTO,
    "127.0.0.1",
    () => {

        console.log("");
        console.log(
            "========================================"
        );
        console.log(
            " PASSBAR - PROXY LOCAL"
        );
        console.log(
            "========================================"
        );
        console.log(
            `Servidor: http://127.0.0.1:${PUERTO}`
        );
        console.log(
            "Estado: ACTIVO"
        );
        console.log(
            "========================================"
        );
        console.log("");

    }
);