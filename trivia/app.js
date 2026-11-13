
import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    runTransaction,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

/* =====================================================
   TRIVIA ONLINE
   PROGRESO INDEPENDIENTE POR JUGADOR
   AVANCE INMEDIATO AL RESPONDER
   TIEMPO GENERAL DEL CUESTIONARIO
   CIERRE POR TODOS COMPLETADOS O TIEMPO AGOTADO
   CALIFICACION Y RANKING AUTOMATICOS
===================================================== */

/* ELEMENTOS */

const indicadorConexion = document.getElementById("indicadorConexion");
const textoConexion = document.getElementById("textoConexion");

const btnCrearSala = document.getElementById("btnCrearSala");
const btnUnirseSala = document.getElementById("btnUnirseSala");

const panelAcceso = document.getElementById("panelAcceso");
const tituloPanel = document.getElementById("tituloPanel");
const campoCodigo = document.getElementById("campoCodigo");

const nombreJugador = document.getElementById("nombreJugador");
const codigoSala = document.getElementById("codigoSala");

const btnContinuar = document.getElementById("btnContinuar");
const btnCancelar = document.getElementById("btnCancelar");

const mensaje = document.getElementById("mensaje");

/* CONFIGURACION */

const CLAVE_JUGADOR = "trivia_jugador_id";
const CLAVE_SESION = "trivia_sesion_sala";

const LONGITUD_CODIGO = 6;

const CONFIGURACION_INICIAL = {
    cantidadPreguntas: 10,
    duracionMinutos: 5
};

const PUNTOS_RESPUESTA_CORRECTA = 1000;

/* ESTADO */

let tipoAcceso = null;

let jugadorId = obtenerIdentificador();
let nombreActual = "";

let salaActual = null;
let codigoActual = "";

let esAnfitrion = false;

let cancelarEscuchaSala = null;

let opcionSeleccionada = null;
let indiceSeleccionado = -1;

let temporizadorVisual = null;
let temporizadorControl = null;

let renderVersion = 0;
let cargandoSala = false;

let procesandoRespuesta = false;
let procesandoCierre = false;

let respuestasCorrectasCache = {};

/* =====================================================
   IDENTIFICADOR
===================================================== */

function obtenerIdentificador() {
    let id = localStorage.getItem(CLAVE_JUGADOR);

    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(CLAVE_JUGADOR, id);
    }

    return id;
}

/* =====================================================
   ESTILOS
===================================================== */

const estilosJuego = document.createElement("style");

estilosJuego.textContent = `
#panelJuego {
    display:none;
    max-width:700px;
    margin:35px auto;
    padding:25px;
    background:#151c30;
    border:1px solid #29334d;
    border-radius:15px;
    color:white;
    box-sizing:border-box;
}

#panelJuego h2 {
    color:#00d9a5;
    margin-bottom:15px;
}

#panelJuego h3 {
    margin-top:22px;
}

#panelJuego input,
#panelJuego select {
    width:100%;
    padding:12px;
    margin:8px 0 15px;
    border-radius:7px;
    border:1px solid #36415e;
    background:#0c1020;
    color:white;
    font-size:15px;
    box-sizing:border-box;
}

#panelJuego label {
    display:block;
    color:#aeb7ca;
    font-size:14px;
    margin-top:12px;
}

#panelJuego button {
    cursor:pointer;
}

#panelJuego button:disabled {
    opacity:.55;
    cursor:not-allowed;
}

#panelJuego .datosPregunta {
    display:flex;
    justify-content:space-between;
    gap:10px;
    flex-wrap:wrap;
    color:#aeb7ca;
    font-size:13px;
    margin-bottom:18px;
}

#panelJuego .textoPregunta {
    font-size:21px;
    line-height:1.5;
    margin:25px 0;
}

#panelJuego .opcionPregunta {
    display:block;
    width:100%;
    padding:15px;
    margin:10px 0;
    text-align:left;
    border:1px solid #36415e;
    border-radius:8px;
    background:#0c1020;
    color:white;
    font-size:15px;
}

#panelJuego .opcionPregunta.seleccionada {
    border-color:#00d9a5;
    background:#123b35;
}

#panelJuego .opcionPregunta:disabled {
    opacity:.75;
}

#panelJuego .botonesJuego {
    display:flex;
    gap:10px;
    margin-top:20px;
    flex-wrap:wrap;
}

#panelJuego .botonesJuego button {
    flex:1;
    min-width:130px;
}

#panelJuego .codigoSalaGrande {
    font-size:30px;
    font-weight:bold;
    letter-spacing:5px;
    color:#00d9a5;
    background:#0c1020;
    border:1px dashed #00d9a5;
    padding:15px;
    border-radius:10px;
    text-align:center;
    margin:20px 0;
}

#panelJuego .jugadorSala {
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding:13px;
    margin:8px 0;
    background:#0c1020;
    border:1px solid #29334d;
    border-radius:8px;
    gap:10px;
}

#panelJuego .jugadorSala.anfitrion {
    border-color:#00d9a5;
}

#panelJuego .etiquetaAnfitrion {
    color:#00d9a5;
    font-size:12px;
    font-weight:bold;
}

#panelJuego .estadoSala {
    color:#aeb7ca;
    margin:15px 0;
}

#panelJuego .botonSala {
    width:100%;
    padding:13px;
    margin-top:10px;
}

#panelJuego .configuracionSala {
    background:#0c1020;
    border:1px solid #29334d;
    padding:18px;
    border-radius:10px;
    margin-top:22px;
}

#panelJuego .configuracionSala h3 {
    margin-top:0;
    color:#00d9a5;
}

#panelJuego .botonIniciar,
#panelJuego .botonEnviar {
    background:#00a982;
    color:white;
    font-weight:bold;
}

#panelJuego .avisoSala {
    background:#211e19;
    color:#e6ad48;
    padding:12px;
    border-radius:7px;
    font-size:13px;
    line-height:1.5;
    margin-top:18px;
}

#panelJuego .estadoRespuesta {
    background:#0c1020;
    border:1px solid #29334d;
    padding:14px;
    border-radius:8px;
    margin-top:18px;
    line-height:1.6;
}

#panelJuego .temporizador {
    font-size:25px;
    font-weight:bold;
    color:#e6ad48;
    text-align:center;
    margin:20px 0;
}

#panelJuego .temporizador.urgente {
    color:#ff6262;
}

#panelJuego .temporizador.grande {
    font-size:48px;
    font-weight:900;
    padding:15px;
    border:2px solid #ff6262;
    border-radius:12px;
    background:#351b27;
    animation: pulsoTemporizador 1s infinite;
}

@keyframes pulsoTemporizador {
    0%,100% {
        transform:scale(1);
        opacity:1;
    }
    50% {
        transform:scale(1.04);
        opacity:.75;
    }
}

#panelJuego .progresoPregunta {
    height:8px;
    background:#29334d;
    border-radius:10px;
    overflow:hidden;
    margin:15px 0;
}

#panelJuego .progresoPregunta div {
    height:100%;
    background:#00d9a5;
    transition:width .3s;
}

#panelJuego .resultadoFinal {
    text-align:center;
    line-height:1.8;
}

#panelJuego .resultadoFinal h2 {
    font-size:27px;
}

#panelJuego .rankingFila {
    display:grid;
    grid-template-columns:45px 1fr auto;
    align-items:center;
    gap:10px;
    padding:13px;
    margin:8px 0;
    background:#0c1020;
    border:1px solid #29334d;
    border-radius:8px;
    text-align:left;
}

#panelJuego .rankingFila.primero {
    border-color:#e6ad48;
    background:#29251b;
}

#panelJuego .rankingPosicion {
    font-size:20px;
    font-weight:bold;
    color:#00d9a5;
}

#panelJuego .rankingPuntos {
    font-weight:bold;
    color:#00d9a5;
    white-space:nowrap;
}

#panelJuego .resumenJugador {
    background:#0c1020;
    border-radius:8px;
    padding:15px;
    margin:15px 0;
}

#panelJuego .partidaIniciada {
    background:#123b35;
    border:1px solid #00d9a5;
    padding:15px;
    border-radius:10px;
    margin-top:15px;
}

#panelJuego .progresoJugadores {
    background:#0c1020;
    padding:14px;
    border-radius:8px;
    margin-top:18px;
}

#panelJuego .progresoJugadorFila {
    display:flex;
    justify-content:space-between;
    gap:10px;
    padding:8px 0;
    border-bottom:1px solid #29334d;
    font-size:13px;
}

#panelJuego .progresoJugadorFila:last-child {
    border-bottom:none;
}

@media(max-width:600px) {
    #panelJuego {
        padding:18px;
    }

    #panelJuego .textoPregunta {
        font-size:18px;
    }

    #panelJuego .codigoSalaGrande {
        font-size:25px;
    }

    #panelJuego .rankingFila {
        grid-template-columns:35px 1fr auto;
        font-size:13px;
    }

    #panelJuego .temporizador.grande {
        font-size:40px;
    }
}
`;

document.head.appendChild(estilosJuego);

/* PANEL */

const panelJuego = document.createElement("section");
panelJuego.id = "panelJuego";

document.querySelector(".contenedor").appendChild(panelJuego);

/* =====================================================
   CONEXION
===================================================== */

if (db) {
    indicadorConexion.classList.add("conectado");
    textoConexion.textContent = "Firebase inicializado";
} else {
    indicadorConexion.classList.add("error");
    textoConexion.textContent = "Error de inicialización";
}

/* =====================================================
   FUNCIONES AUXILIARES
===================================================== */

function crearTexto(tag, contenido, clase = "") {
    const elemento = document.createElement(tag);
    elemento.textContent = contenido;

    if (clase) elemento.className = clase;

    return elemento;
}

function detenerTemporizador() {
    if (temporizadorVisual) {
        clearInterval(temporizadorVisual);
        temporizadorVisual = null;
    }
}

function detenerControlAutomatico() {
    if (temporizadorControl) {
        clearInterval(temporizadorControl);
        temporizadorControl = null;
    }
}

function limpiarSeleccion() {
    opcionSeleccionada = null;
    indiceSeleccionado = -1;
}

function agregarBotonSalir() {
    const salir = crearTexto(
        "button",
        "SALIR DE LA SALA",
        "boton cancelar botonSala"
    );

    salir.addEventListener("click", salirDeSala);
    panelJuego.appendChild(salir);
}

function obtenerFechaMilisegundos(fecha) {
    if (fecha && typeof fecha.toMillis === "function") {
        return fecha.toMillis();
    }

    if (fecha instanceof Date) {
        return fecha.getTime();
    }

    if (typeof fecha === "number") {
        return fecha;
    }

    return null;
}

function obtenerTiempoTotal(datos = salaActual) {
    const configuracion = datos?.configuracion || CONFIGURACION_INICIAL;

    const minutos = Number(
        configuracion.duracionMinutos || CONFIGURACION_INICIAL.duracionMinutos
    );

    return minutos * 60 * 1000;
}

function obtenerInicioPartida(datos = salaActual) {
    return obtenerFechaMilisegundos(datos?.fechaInicio);
}

function obtenerTiempoRestantePartida(datos = salaActual) {
    const inicio = obtenerInicioPartida(datos);

    if (inicio === null) return null;

    return Math.max(
        0,
        obtenerTiempoTotal(datos) - (Date.now() - inicio)
    );
}

function obtenerProgresoJugador(datos = salaActual, id = jugadorId) {
    return datos?.progreso?.[id] || null;
}

function obtenerIndiceJugador(datos = salaActual, id = jugadorId) {
    const progreso = obtenerProgresoJugador(datos, id);

    return Number(progreso?.indice || 0);
}

function obtenerRespuestasJugador(datos = salaActual, id = jugadorId) {
    return datos?.respuestas?.[id] || {};
}

function obtenerRespuestaJugador(indice, datos = salaActual, id = jugadorId) {
    return obtenerRespuestasJugador(datos, id)["p" + indice] || null;
}

function todosLosJugadoresCompletaron(datos) {
    const jugadores = datos?.jugadores || [];
    const total = (datos?.preguntasIds || []).length;

    if (jugadores.length === 0 || total === 0) {
        return false;
    }

    return jugadores.every(jugador => {
        return obtenerIndiceJugador(datos, jugador.id) >= total;
    });
}

/* =====================================================
   ACCESO
===================================================== */

btnCrearSala.addEventListener("click", () => {
    tipoAcceso = "crear";
    tituloPanel.textContent = "CREAR PARTIDA";
    campoCodigo.classList.add("oculto");
    abrirPanel();
});

btnUnirseSala.addEventListener("click", () => {
    tipoAcceso = "unirse";
    tituloPanel.textContent = "UNIRSE A PARTIDA";
    campoCodigo.classList.remove("oculto");
    abrirPanel();
});

function abrirPanel() {
    panelAcceso.classList.remove("oculto");
    mensaje.textContent = "";
    nombreJugador.value = "";
    codigoSala.value = "";
    nombreJugador.focus();

    panelAcceso.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

btnCancelar.addEventListener("click", () => {
    panelAcceso.classList.add("oculto");
    mensaje.textContent = "";
    tipoAcceso = null;
});

btnContinuar.addEventListener("click", async () => {
    const nombre = nombreJugador.value.trim();
    const codigo = codigoSala.value.trim().toUpperCase();

    if (!nombre) {
        mensaje.textContent = "Escribe tu nombre o alias.";
        nombreJugador.focus();
        return;
    }

    if (nombre.length > 25) {
        mensaje.textContent = "El nombre no puede superar los 25 caracteres.";
        return;
    }

    if (tipoAcceso === "unirse" && !codigo) {
        mensaje.textContent = "Escribe el código de la sala.";
        codigoSala.focus();
        return;
    }

    nombreActual = nombre;

    btnContinuar.disabled = true;
    btnContinuar.textContent = "CONECTANDO...";
    mensaje.textContent = "Conectando con la sala...";

    try {
        if (tipoAcceso === "crear") {
            await crearSala();
        } else if (tipoAcceso === "unirse") {
            await unirseSala(codigo);
        }
    } catch (error) {
        console.error(error);
        mensaje.textContent = "No se pudo completar la operación: " + error.message;
    } finally {
        btnContinuar.disabled = false;
        btnContinuar.textContent = "CONTINUAR";
    }
});

/* =====================================================
   CODIGO DE SALA
===================================================== */

function generarCodigo() {
    const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let codigo = "";

    for (let i = 0; i < LONGITUD_CODIGO; i++) {
        codigo += caracteres[
            Math.floor(Math.random() * caracteres.length)
        ];
    }

    return codigo;
}

/* =====================================================
   CREAR SALA
===================================================== */

async function crearSala() {
    const jugador = {
        id: jugadorId,
        nombre: nombreActual,
        fechaEntrada: Date.now()
    };

    let creada = false;
    let codigo = "";

    for (let intento = 0; intento < 10; intento++) {
        codigo = generarCodigo();

        const referencia = doc(db, "salas", codigo);

        const resultado = await runTransaction(db, async tx => {
            const existente = await tx.get(referencia);

            if (existente.exists()) return false;

            tx.set(referencia, {
                codigo,
                estado: "esperando",

                creadorId: jugadorId,
                creador: nombreActual,

                jugadores: [jugador],

                configuracion: { ...CONFIGURACION_INICIAL },

                preguntasIds: [],

                progreso: {},
                respuestas: {},
                puntuaciones: {},
                preguntasCalificadas: [],

                fechaInicio: null,
                fechaFin: null,

                fechaCreacion: serverTimestamp(),
                fechaActualizacion: serverTimestamp()
            });

            return true;
        });

        if (resultado) {
            creada = true;
            break;
        }
    }

    if (!creada) {
        throw new Error("No fue posible generar un código disponible.");
    }

    codigoActual = codigo;
    esAnfitrion = true;

    guardarSesion();

    panelAcceso.classList.add("oculto");
    mensaje.textContent = "";

    escucharSala(codigo);
}

/* =====================================================
   UNIRSE A SALA
===================================================== */

async function unirseSala(codigo) {
    const referencia = doc(db, "salas", codigo);

    await runTransaction(db, async tx => {
        const documento = await tx.get(referencia);

        if (!documento.exists()) {
            throw new Error("No existe una sala con ese código.");
        }

        const datos = documento.data();

        if (datos.estado !== "esperando") {
            throw new Error("La partida ya comenzó o no acepta participantes.");
        }

        const jugadores = Array.isArray(datos.jugadores)
            ? [...datos.jugadores]
            : [];

        if (jugadores.some(j => j.id === jugadorId)) return;

        const nombreOcupado = jugadores.some(
            j => j.nombre.toLowerCase() === nombreActual.toLowerCase()
        );

        if (nombreOcupado) {
            throw new Error("Ese seudónimo ya está siendo utilizado.");
        }

        jugadores.push({
            id: jugadorId,
            nombre: nombreActual,
            fechaEntrada: Date.now()
        });

        tx.update(referencia, {
            jugadores,
            fechaActualizacion: serverTimestamp()
        });
    });

    codigoActual = codigo;
    esAnfitrion = false;

    guardarSesion();

    panelAcceso.classList.add("oculto");
    mensaje.textContent = "";

    escucharSala(codigo);
}

/* =====================================================
   SESION
===================================================== */

function guardarSesion() {
    localStorage.setItem(CLAVE_SESION, JSON.stringify({
        codigo: codigoActual,
        jugadorId,
        seudonimo: nombreActual
    }));
}

async function recuperarSesion() {
    const guardada = localStorage.getItem(CLAVE_SESION);

    if (!guardada) return;

    try {
        const sesion = JSON.parse(guardada);

        if (
            !sesion.codigo ||
            sesion.jugadorId !== jugadorId ||
            !sesion.seudonimo
        ) {
            localStorage.removeItem(CLAVE_SESION);
            return;
        }

        const referencia = doc(db, "salas", sesion.codigo);
        const documento = await getDoc(referencia);

        if (!documento.exists()) {
            localStorage.removeItem(CLAVE_SESION);
            return;
        }

        const datos = documento.data();

        const existe = (datos.jugadores || []).some(
            j => j.id === jugadorId
        );

        if (!existe) {
            localStorage.removeItem(CLAVE_SESION);
            return;
        }

        codigoActual = sesion.codigo;
        nombreActual = sesion.seudonimo;
        esAnfitrion = datos.creadorId === jugadorId;

        escucharSala(codigoActual);

    } catch (error) {
        console.error("Error recuperando sesión:", error);
    }
}

/* =====================================================
   ESCUCHAR SALA
===================================================== */

function escucharSala(codigo) {
    if (cancelarEscuchaSala) {
        cancelarEscuchaSala();
        cancelarEscuchaSala = null;
    }

    const referencia = doc(db, "salas", codigo);

    cancelarEscuchaSala = onSnapshot(
        referencia,
        documento => {
            if (!documento.exists()) {
                alert("La sala ya no está disponible.");
                limpiarSesion();
                return;
            }

            salaActual = {
                id: documento.id,
                ...documento.data()
            };

            esAnfitrion = salaActual.creadorId === jugadorId;

            const existe = (salaActual.jugadores || []).some(
                j => j.id === jugadorId
            );

            if (!existe) {
                alert("Ya no formas parte de esta sala.");
                limpiarSesion();
                return;
            }

            mostrarSala();

            if (salaActual.estado === "jugando") {
                iniciarControlAutomatico();
            } else {
                detenerControlAutomatico();
            }
        },
        error => {
            console.error("Error de conexión:", error);
            textoConexion.textContent = "Error de conexión con la sala";
            indicadorConexion.classList.add("error");
        }
    );
}

/* =====================================================
   MOSTRAR SALA
===================================================== */

async function mostrarSala() {
    if (!salaActual || cargandoSala) return;

    cargandoSala = true;
    const version = ++renderVersion;

    try {
        detenerTemporizador();

        panelJuego.style.display = "block";
        panelJuego.replaceChildren();

        if (salaActual.estado === "jugando") {
            await mostrarPartidaIniciada(version);
            return;
        }

        if (salaActual.estado === "finalizada") {
            mostrarPartidaFinalizada();
            return;
        }

        mostrarSalaEspera();

    } catch (error) {
        console.error("Error mostrando sala:", error);
    } finally {
        cargandoSala = false;
    }
}

/* =====================================================
   SALA DE ESPERA
===================================================== */

function mostrarSalaEspera() {
    const encabezado = document.createElement("div");
    encabezado.className = "salaCabecera";

    encabezado.append(
        crearTexto("h2", "TRIVIA ONLINE"),
        crearTexto(
            "span",
            esAnfitrion ? "ANFITRIÓN" : "PARTICIPANTE",
            "etiquetaAnfitrion"
        )
    );

    panelJuego.appendChild(encabezado);

    panelJuego.appendChild(crearTexto("h3", "SALA DE ESPERA"));

    panelJuego.appendChild(
        crearTexto("div", salaActual.codigo, "codigoSalaGrande")
    );

    const copiar = crearTexto(
        "button",
        "COPIAR CÓDIGO",
        "boton secundario botonSala"
    );

    copiar.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(salaActual.codigo);
            copiar.textContent = "¡CÓDIGO COPIADO!";
        } catch {
            copiar.textContent = "Código: " + salaActual.codigo;
        }
    });

    panelJuego.appendChild(copiar);

    panelJuego.appendChild(
        crearTexto("p", "Comparte este código con los demás jugadores.", "estadoSala")
    );

    const jugadores = salaActual.jugadores || [];

    panelJuego.appendChild(
        crearTexto("h3", "JUGADORES (" + jugadores.length + ")")
    );

    jugadores.forEach(jugador => {
        const fila = document.createElement("div");
        fila.className = "jugadorSala";

        if (jugador.id === salaActual.creadorId) {
            fila.classList.add("anfitrion");
        }

        fila.append(
            crearTexto(
                "span",
                jugador.nombre + (jugador.id === jugadorId ? " (TÚ)" : "")
            ),
            crearTexto(
                "span",
                jugador.id === salaActual.creadorId ? "ANFITRIÓN" : "JUGADOR",
                "etiquetaAnfitrion"
            )
        );

        panelJuego.appendChild(fila);
    });

    if (esAnfitrion) {
        mostrarConfiguracionAnfitrion();
    } else {
        mostrarConfiguracionParticipante();
    }

    agregarBotonSalir();
}

/* =====================================================
   CONFIGURACION
===================================================== */

function mostrarConfiguracionAnfitrion() {
    const configuracion = salaActual.configuracion || CONFIGURACION_INICIAL;

    const contenedor = document.createElement("div");
    contenedor.className = "configuracionSala";

    contenedor.appendChild(crearTexto("h3", "CONFIGURACIÓN"));

    contenedor.appendChild(crearTexto("label", "Cantidad de preguntas"));

    const cantidad = document.createElement("select");
    cantidad.id = "cantidadPreguntas";

    [5, 10, 15, 20, 25, 30, 40, 50, 75, 100].forEach(valor => {
        const opcion = document.createElement("option");
        opcion.value = valor;
        opcion.textContent = valor + " preguntas";
        cantidad.appendChild(opcion);
    });

    cantidad.value = String(configuracion.cantidadPreguntas || 10);
    contenedor.appendChild(cantidad);

    contenedor.appendChild(crearTexto("label", "Duración general del cuestionario"));

    const duracion = document.createElement("select");
    duracion.id = "duracionMinutos";

    [1, 2, 3, 5, 10, 15, 20, 30].forEach(valor => {
        const opcion = document.createElement("option");
        opcion.value = valor;
        opcion.textContent = valor + (valor === 1 ? " minuto" : " minutos");
        duracion.appendChild(opcion);
    });

    duracion.value = String(
        configuracion.duracionMinutos || CONFIGURACION_INICIAL.duracionMinutos
    );

    contenedor.appendChild(duracion);

    const resumen = crearTexto(
        "p",
        "Tiempo total: " + duracion.value + " minutos"
    );

    resumen.style.color = "#00d9a5";
    contenedor.appendChild(resumen);

    duracion.addEventListener("change", actualizarResumen);
    
    function actualizarResumen() {
        resumen.textContent = "Tiempo total: " + duracion.value + " minutos";
    }

    const guardar = crearTexto(
        "button",
        "GUARDAR CONFIGURACIÓN",
        "boton secundario botonSala"
    );

    guardar.addEventListener("click", guardarConfiguracion);

    const iniciar = crearTexto(
        "button",
        "INICIAR PARTIDA",
        "boton botonSala botonIniciar"
    );

    iniciar.addEventListener("click", iniciarPartida);

    contenedor.append(guardar, iniciar);
    panelJuego.appendChild(contenedor);
}

function mostrarConfiguracionParticipante() {
    const configuracion = salaActual.configuracion || CONFIGURACION_INICIAL;

    const contenedor = document.createElement("div");
    contenedor.className = "configuracionSala";

    contenedor.appendChild(crearTexto("h3", "CONFIGURACIÓN"));

    contenedor.appendChild(
        crearTexto("p", "Preguntas: " + configuracion.cantidadPreguntas)
    );

    contenedor.appendChild(
        crearTexto(
            "p",
            "Duración general: " +
            (configuracion.duracionMinutos || CONFIGURACION_INICIAL.duracionMinutos) +
            " minutos"
        )
    );

    contenedor.appendChild(
        crearTexto("p", "Todos comenzarán al mismo tiempo.")
    );

    contenedor.appendChild(
        crearTexto("p", "Cada jugador avanzará a su propio ritmo.")
    );

    contenedor.appendChild(
        crearTexto("p", "Esperando a que el anfitrión inicie la partida.")
    );

    panelJuego.appendChild(contenedor);
}

/* =====================================================
   GUARDAR CONFIGURACION
===================================================== */

async function guardarConfiguracion() {
    if (!esAnfitrion) return;

    const cantidad = Number(document.getElementById("cantidadPreguntas").value);
    const duracion = Number(document.getElementById("duracionMinutos").value);

    if (!Number.isInteger(cantidad) || cantidad < 5 || cantidad > 100) {
        alert("Cantidad de preguntas no válida.");
        return;
    }

    if (![1, 2, 3, 5, 10, 15, 20, 30].includes(duracion)) {
        alert("Duración no válida.");
        return;
    }

    try {
        const referencia = doc(db, "salas", codigoActual);

        await runTransaction(db, async tx => {
            const documento = await tx.get(referencia);

            if (!documento.exists()) throw new Error("La sala no existe.");

            const datos = documento.data();

            if (datos.creadorId !== jugadorId) {
                throw new Error("No eres el anfitrión.");
            }

            if (datos.estado !== "esperando") {
                throw new Error("La partida ya comenzó.");
            }

            tx.update(referencia, {
                configuracion: {
                    cantidadPreguntas: cantidad,
                    duracionMinutos: duracion
                },
                fechaActualizacion: serverTimestamp()
            });
        });

        alert("Configuración guardada.");

    } catch (error) {
        alert("Error: " + error.message);
    }
}

/* =====================================================
   BANCO DE PREGUNTAS
===================================================== */

async function obtenerBancoPreguntas() {
    const consulta = await getDocs(collection(db, "preguntas_publicas"));

    if (consulta.empty) {
        throw new Error("No hay preguntas públicas.");
    }

    const banco = [];

    consulta.forEach(documento => {
        const datos = documento.data();

        if (
            typeof datos.enunciado !== "string" ||
            !Array.isArray(datos.opciones) ||
            datos.opciones.length !== 4
        ) {
            return;
        }

        const validas = datos.opciones.every(opcion =>
            opcion &&
            ["A", "B", "C", "D"].includes(opcion.id) &&
            typeof opcion.texto === "string"
        );

        if (!validas) return;

        banco.push({
            id: documento.id,
            enunciado: datos.enunciado,
            opciones: datos.opciones,
            categoria: datos.categoria || "General",
            dificultad: datos.dificultad || "Normal"
        });
    });

    return banco;
}

function mezclarArray(array) {
    const resultado = [...array];

    for (let i = resultado.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [resultado[i], resultado[j]] = [resultado[j], resultado[i]];
    }

    return resultado;
}

async function obtenerPreguntaPorId(id) {
    const referencia = doc(db, "preguntas_publicas", id);
    const documento = await getDoc(referencia);

    if (!documento.exists()) return null;

    const datos = documento.data();

    if (
        typeof datos.enunciado !== "string" ||
        !Array.isArray(datos.opciones) ||
        datos.opciones.length !== 4
    ) {
        return null;
    }

    return {
        id: documento.id,
        enunciado: datos.enunciado,
        opciones: datos.opciones,
        categoria: datos.categoria || "General",
        dificultad: datos.dificultad || "Normal"
    };
}

/* =====================================================
   INICIAR PARTIDA
===================================================== */

async function iniciarPartida() {
    if (!esAnfitrion) return;

    const cantidad = Number(document.getElementById("cantidadPreguntas").value);
    const duracion = Number(document.getElementById("duracionMinutos").value);

    const boton = document.querySelector("#panelJuego .botonIniciar");

    if (boton) {
        boton.disabled = true;
        boton.textContent = "PREPARANDO...";
    }

    try {
        const banco = await obtenerBancoPreguntas();

        if (banco.length < cantidad) {
            throw new Error(
                "Hay " + banco.length +
                " preguntas válidas y solicitaste " + cantidad + "."
            );
        }

        const seleccionadas = mezclarArray(banco)
            .slice(0, cantidad)
            .map(p => p.id);

        const referencia = doc(db, "salas", codigoActual);

        await runTransaction(db, async tx => {
            const documento = await tx.get(referencia);

            if (!documento.exists()) throw new Error("La sala no existe.");

            const datos = documento.data();

            if (datos.creadorId !== jugadorId) {
                throw new Error("No eres el anfitrión.");
            }

            if (datos.estado !== "esperando") {
                throw new Error("La partida ya comenzó.");
            }

            const jugadores = datos.jugadores || [];
            const progreso = {};

            for (const jugador of jugadores) {
                progreso[jugador.id] = {
                    indice: 0
                };
            }

            tx.update(referencia, {
                estado: "jugando",

                configuracion: {
                    cantidadPreguntas: cantidad,
                    duracionMinutos: duracion
                },

                preguntasIds: seleccionadas,

                progreso,
                respuestas: {},
                puntuaciones: {},
                preguntasCalificadas: [],

                fechaInicio: serverTimestamp(),
                fechaFin: null,

                fechaActualizacion: serverTimestamp()
            });
        });

        respuestasCorrectasCache = {};
        limpiarSeleccion();

    } catch (error) {
        console.error(error);
        alert("No se pudo iniciar: " + error.message);

        if (boton) {
            boton.disabled = false;
            boton.textContent = "INICIAR PARTIDA";
        }
    }
}

/* =====================================================
   RESPUESTAS CORRECTAS
===================================================== */

function normalizarRespuestaCorrecta(valor) {
    if (typeof valor === "string") {
        return valor.trim().toUpperCase();
    }

    if (valor && typeof valor === "object") {
        if (typeof valor.id === "string") {
            return valor.id.trim().toUpperCase();
        }

        if (typeof valor.opcion === "string") {
            return valor.opcion.trim().toUpperCase();
        }
    }

    return "";
}

async function obtenerRespuestaCorrecta(idPregunta) {
    if (respuestasCorrectasCache[idPregunta]) {
        return respuestasCorrectasCache[idPregunta];
    }

    const referencia = doc(db, "respuestas_privadas", idPregunta);
    const documento = await getDoc(referencia);

    if (!documento.exists()) {
        throw new Error(
            "No existe la respuesta privada para la pregunta " + idPregunta
        );
    }

    const correcta = normalizarRespuestaCorrecta(
        documento.data().respuestaCorrecta
    );

    if (!["A", "B", "C", "D"].includes(correcta)) {
        throw new Error(
            "La respuesta correcta de " + idPregunta +
            " no tiene el formato esperado."
        );
    }

    respuestasCorrectasCache[idPregunta] = correcta;

    return correcta;
}

/* =====================================================
   MOSTRAR PARTIDA
===================================================== */

async function mostrarPartidaIniciada(version) {
    const indice = obtenerIndiceJugador();

    const ids = salaActual.preguntasIds || [];

    if (indice >= ids.length) {
        mostrarPantallaEsperandoResultados();
        return;
    }

    const idPregunta = ids[indice];

    if (!idPregunta) {
        throw new Error("No se encontró el identificador de la pregunta.");
    }

    const pregunta = await obtenerPreguntaPorId(idPregunta);

    if (version !== renderVersion) return;

    if (!salaActual || salaActual.estado !== "jugando") return;

    if (obtenerIndiceJugador() !== indice) return;

    if (!pregunta) {
        throw new Error("No se pudo obtener la pregunta.");
    }

    mostrarPreguntaMultijugador(pregunta, indice);
}

/* =====================================================
   PINTAR PREGUNTA
===================================================== */

function mostrarPreguntaMultijugador(pregunta, indice) {
    panelJuego.replaceChildren();

    if (indiceSeleccionado !== indice) {
        limpiarSeleccion();
        indiceSeleccionado = indice;
    }

    const encabezado = document.createElement("div");
    encabezado.className = "salaCabecera";

    encabezado.append(
        crearTexto("h2", "TRIVIA ONLINE"),
        crearTexto("span", "PARTICIPANTE", "etiquetaAnfitrion")
    );

    panelJuego.appendChild(encabezado);

    const total = salaActual.preguntasIds.length;

    const datos = document.createElement("div");
    datos.className = "datosPregunta";

    datos.append(
        crearTexto("span", "Jugador: " + nombreActual),
        crearTexto("span", "Pregunta " + (indice + 1) + " de " + total)
    );

    panelJuego.appendChild(datos);

    const temporizador = crearTexto(
        "p",
        "SINCRONIZANDO TIEMPO GENERAL...",
        "temporizador"
    );

    temporizador.id = "temporizadorGeneral";

    panelJuego.appendChild(temporizador);

    const progreso = document.createElement("div");
    progreso.className = "progresoPregunta";

    const barra = document.createElement("div");
    barra.style.width = ((indice + 1) / total * 100) + "%";

    progreso.appendChild(barra);
    panelJuego.appendChild(progreso);

    const categoria = crearTexto(
        "p",
        pregunta.categoria + " | " + pregunta.dificultad
    );

    categoria.style.color = "#00d9a5";
    panelJuego.appendChild(categoria);

    panelJuego.appendChild(
        crearTexto("div", pregunta.enunciado, "textoPregunta")
    );

    const respuestaExistente = obtenerRespuestaJugador(indice);

    const opciones = document.createElement("div");
    opciones.id = "opcionesPregunta";

    pregunta.opciones.forEach(opcion => {
        const boton = crearTexto(
            "button",
            opcion.id + ". " + opcion.texto,
            "opcionPregunta"
        );

        if (opcionSeleccionada === opcion.id) {
            boton.classList.add("seleccionada");
        }

        if (respuestaExistente) {
            boton.disabled = true;

            if (respuestaExistente.opcion === opcion.id) {
                boton.classList.add("seleccionada");
            }
        }

        boton.addEventListener("click", () => {
            if (respuestaExistente || procesandoRespuesta) return;

            if (obtenerTiempoRestantePartida() <= 0) return;

            document.querySelectorAll("#opcionesPregunta button")
                .forEach(b => b.classList.remove("seleccionada"));

            boton.classList.add("seleccionada");
            opcionSeleccionada = opcion.id;

            const enviar = document.getElementById("btnEnviarRespuesta");

            if (enviar) enviar.disabled = false;
        });

        opciones.appendChild(boton);
    });

    panelJuego.appendChild(opciones);

    const enviar = crearTexto(
        "button",
        respuestaExistente ? "RESPUESTA ENVIADA" : "ENVIAR RESPUESTA",
        "boton botonSala botonEnviar"
    );

    enviar.id = "btnEnviarRespuesta";
    enviar.disabled = Boolean(respuestaExistente);

    enviar.addEventListener("click", enviarRespuestaMultijugador);

    panelJuego.appendChild(enviar);

    const estado = document.createElement("div");
    estado.className = "estadoRespuesta";

    estado.append(
        crearTexto(
            "p",
            respuestaExistente
                ? "Tu respuesta fue registrada y calificada."
                : "Selecciona una opción y envía tu respuesta."
        ),
        crearTexto(
            "p",
            "Al responder avanzarás inmediatamente a la siguiente pregunta."
        )
    );

    panelJuego.appendChild(estado);

    iniciarTemporizadorVisual(temporizador, indice);

    panelJuego.appendChild(
        crearTexto(
            "div",
            "Tu avance es independiente. Los demás jugadores continúan a su propio ritmo.",
            "avisoSala"
        )
    );

    agregarBotonSalir();
}

/* =====================================================
   PANTALLA AL TERMINAR LAS PREGUNTAS
===================================================== */

function mostrarPantallaEsperandoResultados() {
    detenerTemporizador();

    panelJuego.replaceChildren();

    const encabezado = document.createElement("div");
    encabezado.className = "salaCabecera";

    encabezado.append(
        crearTexto("h2", "TRIVIA ONLINE"),
        crearTexto("span", "CUESTIONARIO COMPLETADO", "etiquetaAnfitrion")
    );

    panelJuego.appendChild(encabezado);

    panelJuego.appendChild(
        crearTexto("h2", "¡HAS TERMINADO!")
    );

    panelJuego.appendChild(
        crearTexto(
            "p",
            "Ya contestaste todas las preguntas. Ahora puedes esperar a que termine el concurso."
        )
    );

    const temporizador = crearTexto(
        "p",
        "Sincronizando tiempo...",
        "temporizador"
    );

    temporizador.id = "temporizadorGeneral";

    panelJuego.appendChild(temporizador);

    iniciarTemporizadorVisual(temporizador, null);

    mostrarProgresoJugadores();

    panelJuego.appendChild(
        crearTexto(
            "div",
            "Tus respuestas ya fueron calificadas. El resultado final aparecerá cuando todos terminen o se agote el tiempo general.",
            "partidaIniciada"
        )
    );

    agregarBotonSalir();
}

/* =====================================================
   PROGRESO DE LOS JUGADORES
===================================================== */

function mostrarProgresoJugadores() {
    const jugadores = salaActual.jugadores || [];
    const total = (salaActual.preguntasIds || []).length;

    const contenedor = document.createElement("div");
    contenedor.className = "progresoJugadores";

    contenedor.appendChild(
        crearTexto("h3", "PROGRESO DE LOS JUGADORES")
    );

    jugadores.forEach(jugador => {
        const indice = obtenerIndiceJugador(salaActual, jugador.id);

        const fila = document.createElement("div");
        fila.className = "progresoJugadorFila";

        const nombre = jugador.nombre +
            (jugador.id === jugadorId ? " (TÚ)" : "");

        const estado = indice >= total
            ? "COMPLETADO"
            : indice + " de " + total;

        fila.append(
            crearTexto("span", nombre),
            crearTexto("span", estado, "etiquetaAnfitrion")
        );

        contenedor.appendChild(fila);
    });

    panelJuego.appendChild(contenedor);
}

/* =====================================================
   TEMPORIZADOR VISUAL GENERAL
===================================================== */

function iniciarTemporizadorVisual(elemento, indice) {
    detenerTemporizador();

    function actualizar() {
        if (!salaActual || salaActual.estado !== "jugando") {
            detenerTemporizador();
            return;
        }

        if (
            indice !== null &&
            obtenerIndiceJugador() !== indice
        ) {
            detenerTemporizador();
            return;
        }

        const restante = obtenerTiempoRestantePartida();

        if (restante === null) {
            elemento.textContent = "SINCRONIZANDO TIEMPO GENERAL...";
            return;
        }

        const segundos = Math.ceil(restante / 1000);

        if (segundos <= 10) {
            elemento.textContent = segundos > 0
                ? "¡EL TIEMPO TERMINA EN " + segundos + "!"
                : "¡TIEMPO AGOTADO!";

            elemento.classList.add("urgente", "grande");
        } else {
            const minutos = Math.floor(segundos / 60);
            const segundosRestantes = segundos % 60;

            elemento.textContent =
                "TIEMPO GENERAL: " +
                String(minutos).padStart(2, "0") + ":" +
                String(segundosRestantes).padStart(2, "0");

            elemento.classList.remove("urgente", "grande");
        }

        if (restante <= 0) {
            cerrarPartidaPorTiempo();
        }
    }

    actualizar();

    temporizadorVisual = setInterval(actualizar, 250);
}

/* =====================================================
   ENVIAR RESPUESTA
===================================================== */

async function enviarRespuestaMultijugador() {
    if (procesandoRespuesta) return;

    if (!salaActual || salaActual.estado !== "jugando") return;

    if (!opcionSeleccionada) {
        alert("Selecciona una respuesta.");
        return;
    }

    const indice = obtenerIndiceJugador();
    const opcion = opcionSeleccionada;

    const idPregunta = salaActual.preguntasIds?.[indice];

    if (!idPregunta) return;

    const restanteTotal = obtenerTiempoRestantePartida();

    if (restanteTotal === null) {
        alert("El tiempo general todavía se está sincronizando.");
        return;
    }

    if (restanteTotal <= 0) {
        alert("Se terminó el tiempo del concurso.");
        return;
    }

    procesandoRespuesta = true;

    const boton = document.getElementById("btnEnviarRespuesta");

    if (boton) {
        boton.disabled = true;
        boton.textContent = "CALIFICANDO...";
    }

    try {
        const correcta = await obtenerRespuestaCorrecta(idPregunta);

        const referencia = doc(db, "salas", codigoActual);

        await runTransaction(db, async tx => {
            const documento = await tx.get(referencia);

            if (!documento.exists()) {
                throw new Error("La sala no existe.");
            }

            const datos = documento.data();

            if (datos.estado !== "jugando") {
                throw new Error("La partida ya terminó.");
            }

            const jugadores = datos.jugadores || [];

            const jugadorExiste = jugadores.some(
                j => j.id === jugadorId
            );

            if (!jugadorExiste) {
                throw new Error("No formas parte de esta sala.");
            }

            const inicioPartida = obtenerFechaMilisegundos(
                datos.fechaInicio
            );

            if (inicioPartida === null) {
                throw new Error("No se encontró la fecha de inicio.");
            }

            const limite = inicioPartida + obtenerTiempoTotal(datos);

            if (Date.now() >= limite) {
                throw new Error("Se terminó el tiempo del concurso.");
            }

            const progreso = { ...(datos.progreso || {}) };
            const progresoJugador = progreso[jugadorId];

            if (!progresoJugador) {
                throw new Error("No se encontró tu progreso.");
            }

            if (Number(progresoJugador.indice || 0) !== indice) {
                throw new Error("Tu pregunta ya cambió. Actualizando...");
            }

            const respuestas = { ...(datos.respuestas || {}) };

            const respuestasJugador = {
                ...(respuestas[jugadorId] || {})
            };

            const clave = "p" + indice;

            if (respuestasJugador[clave]) {
                throw new Error("Ya enviaste una respuesta.");
            }

            const esCorrecta = opcion === correcta;

            respuestasJugador[clave] = {
                opcion,
                correcta: esCorrecta,
                fechaRespuesta: Date.now()
            };

            respuestas[jugadorId] = respuestasJugador;

            /*
             * ACTUALIZAR PUNTUACION
             */

            const puntuaciones = {
                ...(datos.puntuaciones || {})
            };

            const puntuacion = {
                ...(puntuaciones[jugadorId] || {
                    nombre: nombreActual,
                    puntos: 0,
                    correctas: 0,
                    respondidas: 0
                })
            };

            puntuacion.nombre = nombreActual;
            puntuacion.respondidas =
                Number(puntuacion.respondidas || 0) + 1;

            if (esCorrecta) {
                puntuacion.correctas =
                    Number(puntuacion.correctas || 0) + 1;

                puntuacion.puntos =
                    Number(puntuacion.puntos || 0) +
                    PUNTOS_RESPUESTA_CORRECTA;
            }

            puntuaciones[jugadorId] = puntuacion;

            /*
             * AVANZAR SOLAMENTE A ESTE JUGADOR
             */

            const total = (datos.preguntasIds || []).length;
            const siguiente = indice + 1;

            progreso[jugadorId] = {
                indice: siguiente
            };

            const calificadas = [
                ...(datos.preguntasCalificadas || [])
            ];

            const claveCalificada = jugadorId + ":" + clave;

            if (!calificadas.includes(claveCalificada)) {
                calificadas.push(claveCalificada);
            }

            /*
             * COMPROBAR SI TODOS TERMINARON
             */

            const todosCompletaron = jugadores.length > 0 &&
                jugadores.every(jugador => {
                    const indiceJugador = Number(
                        progreso[jugador.id]?.indice || 0
                    );

                    return indiceJugador >= total;
                });

            const actualizacion = {
                respuestas,
                puntuaciones,
                progreso,
                preguntasCalificadas: calificadas,
                fechaActualizacion: serverTimestamp()
            };

            /*
             * PRIMERA CONDICION DE CIERRE:
             * TODOS LOS JUGADORES COMPLETARON.
             */

            if (todosCompletaron) {
                actualizacion.estado = "finalizada";
                actualizacion.fechaFin = serverTimestamp();
            }

            tx.update(referencia, actualizacion);
        });

        limpiarSeleccion();

    } catch (error) {
        console.error("Error enviando respuesta:", error);
        alert("No se pudo enviar: " + error.message);

        if (boton) {
            boton.disabled = false;
            boton.textContent = "ENVIAR RESPUESTA";
        }

    } finally {
        procesandoRespuesta = false;
    }
}

/* =====================================================
   CONTROL AUTOMATICO
   SOLO VIGILA EL TIEMPO GENERAL
===================================================== */

function iniciarControlAutomatico() {
    if (temporizadorControl) return;

    procesarAvanceAutomatico();

    temporizadorControl = setInterval(() => {
        procesarAvanceAutomatico();
    }, 500);
}

async function procesarAvanceAutomatico() {
    if (
        procesandoCierre ||
        !salaActual ||
        salaActual.estado !== "jugando" ||
        !codigoActual
    ) {
        return;
    }

    const restanteTotal = obtenerTiempoRestantePartida();

    if (restanteTotal === null) return;

    if (restanteTotal <= 0) {
        await cerrarPartidaPorTiempo();
    }
}

/* =====================================================
   CERRAR POR TIEMPO GENERAL
   SEGUNDA CONDICION DE CIERRE
===================================================== */

async function cerrarPartidaPorTiempo() {
    if (procesandoCierre || !codigoActual) return;

    procesandoCierre = true;

    try {
        const referencia = doc(db, "salas", codigoActual);

        await runTransaction(db, async tx => {
            const documento = await tx.get(referencia);

            if (!documento.exists()) return;

            const datos = documento.data();

            if (datos.estado !== "jugando") return;

            const inicio = obtenerFechaMilisegundos(datos.fechaInicio);

            if (inicio === null) return;

            const limite = inicio + obtenerTiempoTotal(datos);

            if (Date.now() < limite) return;

            /*
             * EL TIEMPO GENERAL TERMINÓ.
             * SE CIERRA LA PARTIDA AUNQUE HAYA
             * JUGADORES QUE NO HAYAN TERMINADO.
             *
             * NO SE AGREGAN PUNTOS POR PREGUNTAS
             * QUE NO FUERON CONTESTADAS.
             */

            tx.update(referencia, {
                estado: "finalizada",
                fechaFin: serverTimestamp(),
                fechaActualizacion: serverTimestamp()
            });
        });

    } catch (error) {
        console.error("Error cerrando partida:", error);
    } finally {
        procesandoCierre = false;
    }
}

/* =====================================================
   RESULTADOS Y RANKING
===================================================== */

function mostrarPartidaFinalizada() {
    detenerTemporizador();
    detenerControlAutomatico();

    panelJuego.replaceChildren();

    const resultado = document.createElement("div");
    resultado.className = "resultadoFinal";

    resultado.appendChild(
        crearTexto("h2", "¡PARTIDA FINALIZADA!")
    );

    const jugadores = (salaActual.jugadores || []).map(jugador => {
        const datos = salaActual.puntuaciones?.[jugador.id] || {};

        return {
            id: jugador.id,
            nombre: jugador.nombre,
            puntos: Number(datos.puntos || 0),
            correctas: Number(datos.correctas || 0),
            respondidas: Number(datos.respondidas || 0),
            progreso: obtenerIndiceJugador(salaActual, jugador.id)
        };
    });

    const total = (salaActual.preguntasIds || []).length;

    const todosCompletaron = jugadores.length > 0 &&
        jugadores.every(jugador => jugador.progreso >= total);

    resultado.appendChild(
        crearTexto(
            "p",
            todosCompletaron
                ? "Todos los jugadores completaron el cuestionario."
                : "El tiempo general del concurso se agotó."
        )
    );

    resultado.appendChild(
        crearTexto(
            "p",
            "Estas son las puntuaciones finales."
        )
    );

    jugadores.sort((a, b) => {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        if (b.correctas !== a.correctas) return b.correctas - a.correctas;
        return a.nombre.localeCompare(b.nombre);
    });

    resultado.appendChild(crearTexto("h3", "CLASIFICACIÓN FINAL"));

    if (jugadores.length === 0) {
        resultado.appendChild(crearTexto("p", "No hay resultados."));
    }

    jugadores.forEach((jugador, posicion) => {
        const fila = document.createElement("div");
        fila.className = "rankingFila";

        if (posicion === 0 && jugador.puntos > 0) {
            fila.classList.add("primero");
        }

        fila.append(
            crearTexto(
                "span",
                posicion === 0 ? "🥇" :
                posicion === 1 ? "🥈" :
                posicion === 2 ? "🥉" :
                String(posicion + 1),
                "rankingPosicion"
            ),
            crearTexto(
                "span",
                jugador.nombre +
                (jugador.id === jugadorId ? " (TÚ)" : "")
            ),
            crearTexto(
                "span",
                jugador.puntos.toLocaleString("es-MX") + " pts",
                "rankingPuntos"
            )
        );

        resultado.appendChild(fila);

        const detalle = crearTexto(
            "p",
            jugador.correctas + " correctas | " +
            jugador.respondidas + " respondidas | " +
            jugador.progreso + " preguntas recorridas"
        );

        detalle.style.color = "#aeb7ca";
        detalle.style.fontSize = "13px";

        resultado.appendChild(detalle);
    });

    const miResultado = jugadores.find(j => j.id === jugadorId);

    if (miResultado) {
        const resumen = document.createElement("div");
        resumen.className = "resumenJugador";

        resumen.append(
            crearTexto("h3", "TUS RESULTADOS"),
            crearTexto("p", "Puntos: " + miResultado.puntos),
            crearTexto("p", "Respuestas correctas: " + miResultado.correctas),
            crearTexto("p", "Respuestas enviadas: " + miResultado.respondidas),
            crearTexto(
                "p",
                "Preguntas recorridas: " + miResultado.progreso
            )
        );

        resultado.appendChild(resumen);
    }

    resultado.appendChild(
        crearTexto(
            "p",
            "Respuestas calificadas: " +
            (salaActual.preguntasCalificadas || []).length
        )
    );

    panelJuego.appendChild(resultado);

    if (esAnfitrion) {
        const reiniciar = crearTexto(
            "button",
            "JUGAR OTRA PARTIDA",
            "boton botonSala botonIniciar"
        );

        reiniciar.addEventListener("click", reiniciarSala);
        panelJuego.appendChild(reiniciar);
    }

    agregarBotonSalir();
}

/* =====================================================
   REINICIAR SALA
===================================================== */

async function reiniciarSala() {
    if (!esAnfitrion) return;

    const confirmar = confirm(
        "¿Quieres preparar otra partida en esta misma sala? Se borrarán las puntuaciones y respuestas anteriores."
    );

    if (!confirmar) return;

    try {
        const referencia = doc(db, "salas", codigoActual);

        await runTransaction(db, async tx => {
            const documento = await tx.get(referencia);

            if (!documento.exists()) {
                throw new Error("La sala no existe.");
            }

            const datos = documento.data();

            if (datos.creadorId !== jugadorId) {
                throw new Error("No eres el anfitrión.");
            }

            tx.update(referencia, {
                estado: "esperando",

                preguntasIds: [],

                progreso: {},
                respuestas: {},
                puntuaciones: {},
                preguntasCalificadas: [],

                fechaInicio: null,
                fechaFin: null,

                fechaActualizacion: serverTimestamp()
            });
        });

        respuestasCorrectasCache = {};
        limpiarSeleccion();

    } catch (error) {
        alert("No se pudo reiniciar: " + error.message);
    }
}

/* =====================================================
   SALIR DE SALA
===================================================== */

async function salirDeSala() {
    if (!codigoActual) {
        limpiarSesion();
        return;
    }

    const confirmar = confirm("¿Seguro que deseas salir de la sala?");
    if (!confirmar) return;

    const codigo = codigoActual;
    const referencia = doc(db, "salas", codigo);

    try {
        await runTransaction(db, async tx => {
            const documento = await tx.get(referencia);

            if (!documento.exists()) return;

            const datos = documento.data();

            if (datos.creadorId === jugadorId) {
                tx.delete(referencia);
                return;
            }

            const jugadores = (datos.jugadores || []).filter(
                jugador => jugador.id !== jugadorId
            );

            const progreso = { ...(datos.progreso || {}) };
            const respuestas = { ...(datos.respuestas || {}) };
            const puntuaciones = { ...(datos.puntuaciones || {}) };

            delete progreso[jugadorId];
            delete respuestas[jugadorId];
            delete puntuaciones[jugadorId];

            tx.update(referencia, {
                jugadores,
                progreso,
                respuestas,
                puntuaciones,
                fechaActualizacion: serverTimestamp()
            });
        });

        limpiarSesion();

    } catch (error) {
        console.error(error);
        alert("No se pudo salir: " + error.message);
    }
}

/* =====================================================
   LIMPIAR SESION
===================================================== */

function limpiarSesion() {
    detenerTemporizador();
    detenerControlAutomatico();

    if (cancelarEscuchaSala) {
        cancelarEscuchaSala();
        cancelarEscuchaSala = null;
    }

    localStorage.removeItem(CLAVE_SESION);

    codigoActual = "";
    nombreActual = "";

    salaActual = null;
    esAnfitrion = false;

    limpiarSeleccion();

    respuestasCorrectasCache = {};

    renderVersion++;
    cargandoSala = false;

    procesandoRespuesta = false;
    procesandoCierre = false;

    panelJuego.style.display = "none";
    panelJuego.replaceChildren();

    panelAcceso.classList.add("oculto");
    mensaje.textContent = "";
}

/* =====================================================
   INICIO
===================================================== */

recuperarSesion();

console.log(
    "TRIVIA ONLINE: cierre por finalización de todos los jugadores o tiempo general."
);
