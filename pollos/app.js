import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getFirestore,
    doc,
    runTransaction,
    onSnapshot,
    serverTimestamp,
    collection,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

/* =====================================================
   FIREBASE
===================================================== */

const firebaseConfig = {
    apiKey: "AIzaSyAP3y5Q2GZ0XL3551da83QV6myx23dD_Fk",
    authDomain: "caceriapollosonline.firebaseapp.com",
    projectId: "caceriapollosonline",
    storageBucket: "caceriapollosonline.firebasestorage.app",
    messagingSenderId: "464338219428",
    appId: "1:464338219428:web:91cc87743c3cec4800d131"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =====================================================
   REGLAS
===================================================== */

const MIN_JUGADORES = 2;
const MAX_JUGADORES = 100;

const FILAS_MAXIMAS = 10;
const COLUMNAS_MAXIMAS = 10;

const POLLOS_MINIMOS = 1;
const POLLOS_MAXIMOS = 10;

const TIEMPO_MINIMO = 5;
const TIEMPO_MAXIMO = 86400;

const LETRAS_COLUMNAS = [
    "A", "B", "C", "D", "E",
    "F", "G", "H", "I", "J"
];

const CLAVE_JUGADOR = "caceria_jugador_id";
const CLAVE_SESION = "caceria_sesion_sala";

/* =====================================================
   IDENTIDAD Y RECUPERACIÓN
===================================================== */

let sesionInicial = null;

try {
    sesionInicial = JSON.parse(
        localStorage.getItem(CLAVE_SESION) || "null"
    );
} catch {
    sesionInicial = null;
}

let jugadorId =
    localStorage.getItem(CLAVE_JUGADOR) ||
    sessionStorage.getItem(CLAVE_JUGADOR) ||
    sesionInicial?.jugadorId ||
    crypto.randomUUID();

localStorage.setItem(CLAVE_JUGADOR, jugadorId);
sessionStorage.setItem(CLAVE_JUGADOR, jugadorId);

/* =====================================================
   VARIABLES
===================================================== */

let codigoActual = null;
let salaActual = null;
let detenerEscucha = null;\nlet detenerEscuchaSalas = null;\nlet codigoSalaSeleccionada = null;

let posicionesSeleccionadas = [];

let operacionEnCurso = false;
let procesandoVencimiento = false;

let intervaloTemporizador = null;
let proximoIntentoVencimiento = 0;

/* Reloj del turno */

let claveTurnoActual = null;
let inicioTurnoMonotono = null;

/* Control de sonidos */

let disparosVistos = new Set();
let primeraCargaDisparos = true;

/* =====================================================
   ELEMENTOS HTML
===================================================== */

const pantallaInicio = document.getElementById("pantallaInicio");
const pantallaSala = document.getElementById("pantallaSala");
const pantallaJuego = document.getElementById("pantallaJuego");

const inputSeudonimo = document.getElementById("seudonimo");
const inputCodigo = document.getElementById("codigoEntrada");
const inputCodigoManual = document.getElementById("codigoEntradaManual");
const panelCrear = document.getElementById("panelCrear");
const panelUnirse = document.getElementById("panelUnirse");
const listaSalasDisponibles = document.getElementById("listaSalasDisponibles");
const accesoSalaSeleccionada = document.getElementById("accesoSalaSeleccionada");
const textoSalaSeleccionada = document.getElementById("textoSalaSeleccionada");
const btnMostrarCrear = document.getElementById("btnMostrarCrear");
const btnMostrarUnirse = document.getElementById("btnMostrarUnirse");
const btnActualizarSalas = document.getElementById("btnActualizarSalas");
const btnUnirseCodigoManual = document.getElementById("btnUnirseCodigoManual");

const configFilas = document.getElementById("configFilas");
const configColumnas = document.getElementById("configColumnas");
const configPollos = document.getElementById("configPollos");
const configTiempo = document.getElementById("configTiempo");
const configJugadores = document.getElementById("configJugadores");

const resumenConfiguracion =
    document.getElementById("resumenConfiguracion");

const btnCrearSala = document.getElementById("btnCrearSala");
const btnUnirseSala = document.getElementById("btnUnirseSala");
const btnCopiarCodigo = document.getElementById("btnCopiarCodigo");
const btnIniciarPartida = document.getElementById("btnIniciarPartida");
const btnGuardarPollos = document.getElementById("btnGuardarPollos");
const btnDeshacerPollo = document.getElementById("btnDeshacerPollo");
const btnSalirSala = document.getElementById("btnSalirSala");
const btnSalirJuego = document.getElementById("btnSalirJuego");
const btnNuevaPartida = document.getElementById("btnNuevaPartida");

const codigoSalaTexto = document.getElementById("codigoSala");
const contadorJugadores = document.getElementById("contadorJugadores");
const listaJugadores = document.getElementById("listaJugadores");
const reglasSalaTexto = document.getElementById("reglasSalaTexto");

const mensajeInicio = document.getElementById("mensajeInicio");
const mensajeSala = document.getElementById("mensajeSala");
const mensajeInicioPartida =
    document.getElementById("mensajeInicioPartida");

const zonaInicioPartida = document.getElementById("zonaInicioPartida");

const tituloFase = document.getElementById("tituloFase");
const textoFase = document.getElementById("textoFase");
const jugadorTurno = document.getElementById("jugadorTurno");

const panelPreparacion = document.getElementById("panelPreparacion");
const panelCombate = document.getElementById("panelCombate");
const panelResultados = document.getElementById("panelResultados");

const panelTemporizador = document.getElementById("panelTemporizador");
const tiempoRestante = document.getElementById("tiempoRestante");

const tableroPreparacion = document.getElementById("tableroPreparacion");
const tableroCombate = document.getElementById("tableroCombate");

const contadorPollos = document.getElementById("contadorPollos");
const mensajePreparacion = document.getElementById("mensajePreparacion");
const mensajeCombate = document.getElementById("mensajeCombate");

const estadoJugadores = document.getElementById("estadoJugadores");
const historialAtaques = document.getElementById("historialAtaques");
const resultadoFinal = document.getElementById("resultadoFinal");

const mensajeNuevaPartida =
    document.getElementById("mensajeNuevaPartida");

/* =====================================================
   CONFIGURACIÓN
===================================================== */

function obtenerConfiguracionPredeterminada() {
    return {
        filas: 10,
        columnas: 10,
        pollosPorJugador: 3,
        tiempoTurno: 8
    };
}

function obtenerConfiguracion() {
    return salaActual?.configuracion ||
        obtenerConfiguracionPredeterminada();
}

function obtenerMaximoJugadores(datos = salaActual) {
    const maximo = Number(datos?.maxJugadores);

    if (
        Number.isInteger(maximo) &&
        maximo >= MIN_JUGADORES &&
        maximo <= MAX_JUGADORES
    ) {
        return maximo;
    }

    return 4;
}

function actualizarResumenConfiguracion() {
    const filas = Number(configFilas.value);
    const columnas = Number(configColumnas.value);
    const pollos = Number(configPollos.value);
    const tiempo = Number(configTiempo.value);
    const jugadores = Number(configJugadores.value);

    resumenConfiguracion.textContent =
        `Tablero: ${filas} × ${columnas} · ` +
        `${pollos} pollo(s) · ` +
        `${tiempo} segundos · ` +
        `${jugadores} jugador(es)`;
}

function validarConfiguracion(configuracion) {
    return (
        Number.isInteger(configuracion.filas) &&
        configuracion.filas >= 2 &&
        configuracion.filas <= FILAS_MAXIMAS &&

        Number.isInteger(configuracion.columnas) &&
        configuracion.columnas >= 1 &&
        configuracion.columnas <= COLUMNAS_MAXIMAS &&

        Number.isInteger(configuracion.pollosPorJugador) &&
        configuracion.pollosPorJugador >= POLLOS_MINIMOS &&
        configuracion.pollosPorJugador <= POLLOS_MAXIMOS &&

        Number.isInteger(configuracion.tiempoTurno) &&
        configuracion.tiempoTurno >= TIEMPO_MINIMO &&
        configuracion.tiempoTurno <= TIEMPO_MAXIMO
    );
}

function validarMaximoJugadores(maximo) {
    return (
        Number.isInteger(maximo) &&
        maximo >= MIN_JUGADORES &&
        maximo <= MAX_JUGADORES
    );
}

function obtenerTextoConfiguracion(configuracion, maximo) {
    return (
        `Tablero: ${configuracion.filas} filas × ` +
        `${configuracion.columnas} columnas. ` +
        `${configuracion.pollosPorJugador} pollo(s) por jugador. ` +
        `${configuracion.tiempoTurno} segundos por turno. ` +
        `Máximo de ${maximo} jugadores.`
    );
}

function obtenerTotalPollos() {
    return obtenerConfiguracion().pollosPorJugador;
}

function obtenerTotalFilas() {
    return obtenerConfiguracion().filas;
}

function obtenerTotalColumnas() {
    return obtenerConfiguracion().columnas;
}

function obtenerCoordenadasDe(configuracion) {
    const coordenadas = [];

    for (let fila = 1; fila <= configuracion.filas; fila++) {
        for (
            let columna = 0;
            columna < configuracion.columnas;
            columna++
        ) {
            coordenadas.push(
                `${LETRAS_COLUMNAS[columna]}${fila}`
            );
        }
    }

    return coordenadas;
}

/* =====================================================
   FUNCIONES GENERALES
===================================================== */

function mostrarMensaje(elemento, texto) {
    if (elemento) elemento.textContent = texto;
}

function obtenerSeudonimo() {
    return inputSeudonimo.value.trim();
}

function referenciaSala(codigo = codigoActual) {
    return doc(db, "salas", codigo);
}

function generarCodigoSala() {
    const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let codigo = "";

    for (let i = 0; i < 6; i++) {
        codigo += caracteres[
            Math.floor(Math.random() * caracteres.length)
        ];
    }

    return codigo;
}

function obtenerJugadorActual() {
    if (!salaActual) return null;

    return salaActual.jugadores.find(
        jugador => jugador.id === jugadorId
    ) || null;
}

function cambiarPantalla(nombre) {
    pantallaInicio.classList.add("oculto");
    pantallaSala.classList.add("oculto");
    pantallaJuego.classList.add("oculto");

    if (nombre === "inicio") {
        pantallaInicio.classList.remove("oculto");
    }

    if (nombre === "sala") {
        pantallaSala.classList.remove("oculto");
    }

    if (nombre === "juego") {
        pantallaJuego.classList.remove("oculto");
    }
}

/* =====================================================
   SESIÓN PERSISTENTE
===================================================== */

function guardarSesionSala(codigo, seudonimo) {
    const sesion = {
        codigo,
        jugadorId,
        seudonimo
    };

    localStorage.setItem(
        CLAVE_SESION,
        JSON.stringify(sesion)
    );

    localStorage.setItem(CLAVE_JUGADOR, jugadorId);
    sessionStorage.setItem(CLAVE_JUGADOR, jugadorId);
}

function limpiarSesionSala() {
    localStorage.removeItem(CLAVE_SESION);
}

function entrarEnSala(codigo, seudonimo = obtenerSeudonimo()) {
    codigoActual = codigo;
    posicionesSeleccionadas = [];
    proximoIntentoVencimiento = 0;

    disparosVistos.clear();
    primeraCargaDisparos = true;

    claveTurnoActual = null;
    inicioTurnoMonotono = null;

    guardarSesionSala(codigo, seudonimo);

    codigoSalaTexto.textContent = codigo;

    cambiarPantalla("sala");
    escucharSala(codigo);
}

function intentarReconectar() {
    let sesion;

    try {
        sesion = JSON.parse(
            localStorage.getItem(CLAVE_SESION) || "null"
        );
    } catch {
        limpiarSesionSala();
        return;
    }

    if (!sesion) return;

    if (
        !sesion.codigo ||
        !/^[A-Z0-9]{6}$/.test(sesion.codigo) ||
        !sesion.jugadorId
    ) {
        limpiarSesionSala();
        return;
    }

    jugadorId = sesion.jugadorId;

    localStorage.setItem(CLAVE_JUGADOR, jugadorId);
    sessionStorage.setItem(CLAVE_JUGADOR, jugadorId);

    inputSeudonimo.value = sesion.seudonimo || "";
    inputCodigo.value = sesion.codigo;

    entrarEnSala(
        sesion.codigo,
        sesion.seudonimo || ""
    );
}

/* =====================================================
   CREAR SALA
===================================================== */

function mostrarOpcionInicio(opcion) {
    panelCrear.classList.toggle("oculto", opcion !== "crear");
    panelUnirse.classList.toggle("oculto", opcion !== "unirse");
    mostrarMensaje(mensajeInicio, "");
    if (opcion === "unirse") escucharSalasDisponibles();
}

function escucharSalasDisponibles() {
    if (detenerEscuchaSalas) return;

    listaSalasDisponibles.innerHTML =
        '<p class="sin-salas">Buscando partidas disponibles...</p>';

    const consulta = query(
        collection(db, "salas"),
        where("estado", "==", "esperando")
    );

    detenerEscuchaSalas = onSnapshot(
        consulta,
        snapshot => {
            const salas = snapshot.docs
                .map(documento => ({ ...documento.data(), codigo: documento.id }))
                .filter(sala => {
                    const jugadores = sala.jugadores || [];
                    const maximo = obtenerMaximoJugadores(sala);
                    return jugadores.length < maximo;
                })
                .sort((a, b) => (b.fechaCreacion || 0) - (a.fechaCreacion || 0));

            renderizarSalasDisponibles(salas);
        },
        error => {
            console.error("Error al consultar salas:", error);
            listaSalasDisponibles.innerHTML =
                '<p class="sin-salas">No fue posible cargar las partidas. Puedes usar el código directamente.</p>';
        }
    );
}

function renderizarSalasDisponibles(salas) {
    listaSalasDisponibles.innerHTML = "";

    if (!salas.length) {
        listaSalasDisponibles.innerHTML =
            '<p class="sin-salas">No hay partidas disponibles en este momento.</p>';
        return;
    }

    salas.forEach(sala => {
        const jugadores = sala.jugadores || [];
        const maximo = obtenerMaximoJugadores(sala);
        const configuracion = sala.configuracion || obtenerConfiguracionPredeterminada();

        const tarjeta = document.createElement("button");
        tarjeta.type = "button";
        tarjeta.className = "tarjeta-sala";
        tarjeta.innerHTML = `
            <span class="tarjeta-sala-cabecera">
                <strong>${escaparTexto(sala.creador || "Anfitrión")}</strong>
                <small>${jugadores.length} / ${maximo} jugadores</small>
            </span>
            <span class="tarjeta-sala-detalle">
                Tablero ${Number(configuracion.filas) || 10} × ${Number(configuracion.columnas) || 10}
                · ${Number(configuracion.pollosPorJugador) || 3} pollos
                · ${Number(configuracion.tiempoTurno) || 8} s por turno
            </span>
            <span class="tarjeta-sala-pie">PARTIDA DISPONIBLE · SELECCIONAR</span>
        `;
        tarjeta.addEventListener("click", () => {
            codigoSalaSeleccionada = sala.codigo;
            inputCodigo.value = "";
            accesoSalaSeleccionada.classList.remove("oculto");
            textoSalaSeleccionada.textContent =
                `Has seleccionado la partida de ${sala.creador || "Anfitrión"}. Solicita al anfitrión el código de acceso.`;
            inputCodigo.focus();
        });
        listaSalasDisponibles.appendChild(tarjeta);
    });
}

function escaparTexto(valor) {
    return String(valor).replace(/[&<>"']/g, caracter => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#039;"
    })[caracter]);
}

async function crearSala() {
    const seudonimo = obtenerSeudonimo();

    if (!seudonimo) {
        mostrarMensaje(mensajeInicio, "Escribe un seudónimo.");
        return;
    }

    if (operacionEnCurso) return;

    const configuracion = {
        filas: Number(configFilas.value),
        columnas: Number(configColumnas.value),
        pollosPorJugador: Number(configPollos.value),
        tiempoTurno: Number(configTiempo.value)
    };

    const maximoJugadores = Number(configJugadores.value);

    if (!validarConfiguracion(configuracion)) {
        mostrarMensaje(
            mensajeInicio,
            `La configuración no es válida. El tiempo debe estar entre ${TIEMPO_MINIMO} y ${TIEMPO_MAXIMO} segundos.`
        );
        return;
    }

    if (!validarMaximoJugadores(maximoJugadores)) {
        mostrarMensaje(
            mensajeInicio,
            "El máximo de jugadores debe estar entre 2 y 100."
        );
        return;
    }

    operacionEnCurso = true;

    btnCrearSala.disabled = true;
    btnUnirseSala.disabled = true;

    mostrarMensaje(mensajeInicio, "Creando sala...");

    try {
        let codigo = generarCodigoSala();
        let creada = false;

        for (let intento = 0; intento < 5; intento++) {
            const referencia = doc(db, "salas", codigo);

            const datosSala = {
                codigo,
                estado: "esperando",
                maxJugadores: maximoJugadores,
                configuracion,

                creadorId: jugadorId,
                creador: seudonimo,

                jugadores: [
                    {
                        id: jugadorId,
                        nombre: seudonimo,
                        pollos: []
                    }
                ],

                turnoJugadorId: null,
                turnoInicio: null,
                turnoLimite: null,
                turnoInicioServidor: null,
                turnoDuracionMs: null,

                disparos: [],
                eventos: [],

                ganadorId: null,
                fechaCreacion: Date.now()
            };

            const resultado = await runTransaction(
                db,
                async transaccion => {
                    const documento = await transaccion.get(referencia);

                    if (documento.exists()) return false;

                    transaccion.set(referencia, datosSala);
                    return true;
                }
            );

            if (resultado) {
                creada = true;
                break;
            }

            codigo = generarCodigoSala();
        }

        if (!creada) {
            throw new Error(
                "No se pudo generar un código disponible."
            );
        }

        entrarEnSala(codigo, seudonimo);

    } catch (error) {
        console.error(error);

        mostrarMensaje(
            mensajeInicio,
            error.message || "No se pudo crear la sala."
        );

    } finally {
        operacionEnCurso = false;
        btnCrearSala.disabled = false;
        btnUnirseSala.disabled = false;
    }
}

/* =====================================================
   UNIRSE A UNA SALA
===================================================== */

async function unirseSala() {
    const seudonimo = obtenerSeudonimo();
    const codigoEscrito = inputCodigo.value.trim().toUpperCase();

    if (codigoSalaSeleccionada && codigoEscrito !== codigoSalaSeleccionada) {
        mostrarMensaje(mensajeInicio, "El código de acceso no coincide con la partida seleccionada.");
        return;
    }

    const codigo = (codigoSalaSeleccionada || codigoEscrito).trim().toUpperCase();

    if (!seudonimo) {
        mostrarMensaje(mensajeInicio, "Escribe un seudónimo.");
        return;
    }

    if (!/^[A-Z0-9]{6}$/.test(codigo)) {
        mostrarMensaje(
            mensajeInicio,
            "El código debe tener 6 caracteres."
        );
        return;
    }

    if (operacionEnCurso) return;

    operacionEnCurso = true;

    btnCrearSala.disabled = true;
    btnUnirseSala.disabled = true;

    mostrarMensaje(mensajeInicio, "Buscando sala...");

    try {
        const referencia = referenciaSala(codigo);

        await runTransaction(db, async transaccion => {
            const documento = await transaccion.get(referencia);

            if (!documento.exists()) {
                throw new Error("La sala no existe.");
            }

            const datos = documento.data();
            const jugadores = datos.jugadores || [];

            if (datos.estado !== "esperando") {
                throw new Error("La partida ya comenzó.");
            }

            if (
                jugadores.some(jugador => jugador.id === jugadorId)
            ) {
                return;
            }

            const maximo = obtenerMaximoJugadores(datos);

            if (jugadores.length >= maximo) {
                throw new Error("La sala está llena.");
            }

            const nombreOcupado = jugadores.some(
                jugador =>
                    jugador.nombre.toLowerCase() ===
                    seudonimo.toLowerCase()
            );

            if (nombreOcupado) {
                throw new Error("Ese seudónimo ya está ocupado.");
            }

            transaccion.update(referencia, {
                jugadores: [
                    ...jugadores,
                    {
                        id: jugadorId,
                        nombre: seudonimo,
                        pollos: []
                    }
                ]
            });
        });

        entrarEnSala(codigo, seudonimo);

    } catch (error) {
        console.error(error);

        mostrarMensaje(
            mensajeInicio,
            error.message || "No fue posible entrar a la sala."
        );

    } finally {
        operacionEnCurso = false;
        btnCrearSala.disabled = false;
        btnUnirseSala.disabled = false;
    }
}

/* =====================================================
   SONIDO DE ELIMINACIÓN
===================================================== */

// El archivo debe estar en la carpeta: sound/gallina.mp3
const sonidoMuerte = new Audio("sound/gallina.mp3");
sonidoMuerte.preload = "auto";
sonidoMuerte.volume = 1;

let audioHabilitado = false;

function prepararAudio() {
    // Los navegadores requieren una interacción del usuario
    // antes de permitir la reproducción de sonidos.
    audioHabilitado = true;
}

function reproducirSonidoPollo() {
    if (!audioHabilitado) return;

    try {
        // Se crea una copia para que varios pollos puedan sonar
        // consecutivamente sin cortar la reproducción anterior.
        const audio = sonidoMuerte.cloneNode();

        audio.volume = sonidoMuerte.volume;
        audio.currentTime = 0;

        const reproduccion = audio.play();

        if (reproduccion && typeof reproduccion.catch === "function") {
            reproduccion.catch(error => {
                console.warn("No se pudo reproducir gallina.mp3:", error);
            });
        }

    } catch (error) {
        console.warn("No se pudo reproducir el sonido:", error);
    }
}

function reproducirSonidosEliminacion(cantidad) {
    const total = Math.min(Number(cantidad) || 0, 10);

    for (let i = 0; i < total; i++) {
        setTimeout(() => {
            reproducirSonidoPollo();
        }, i * 230);
    }
}

function obtenerIdentificadorDisparo(disparo) {
    return disparo.id ||
        `${disparo.jugadorId}_${disparo.fecha}_${disparo.coordenada}`;
}

function detectarNuevosDisparos(datos) {
    const disparos = datos.disparos || [];

    if (primeraCargaDisparos) {
        disparos.forEach(disparo => {
            disparosVistos.add(
                obtenerIdentificadorDisparo(disparo)
            );
        });

        primeraCargaDisparos = false;
        return;
    }

    for (const disparo of disparos) {
        const identificador =
            obtenerIdentificadorDisparo(disparo);

        if (disparosVistos.has(identificador)) {
            continue;
        }

        disparosVistos.add(identificador);

        if (
            disparo.aciertos &&
            disparo.aciertos.length > 0
        ) {
            const cantidad = disparo.aciertos.reduce(
                (suma, acierto) =>
                    suma + Number(acierto.cantidad || 0),
                0
            );

            reproducirSonidosEliminacion(cantidad);
        }
    }
}

/* =====================================================
   ESCUCHAR SALA Y RECONECTAR
===================================================== */

function manejarSesionInvalida(mensaje) {
    if (detenerEscucha) {
        detenerEscucha();
        detenerEscucha = null;
    }

    limpiarSesionSala();

    codigoActual = null;
    salaActual = null;
    posicionesSeleccionadas = [];

    panelTemporizador.classList.add("oculto");

    cambiarPantalla("inicio");

    mostrarMensaje(mensajeInicio, mensaje);
}

function escucharSala(codigo) {
    if (detenerEscucha) {
        detenerEscucha();
        detenerEscucha = null;
    }

    detenerEscucha = onSnapshot(
        referenciaSala(codigo),

        documento => {
            if (!documento.exists()) {
                manejarSesionInvalida(
                    "La sala ya no existe. Puedes crear o buscar otra."
                );
                return;
            }

            const datos = documento.data();

            const participante = (datos.jugadores || []).some(
                jugador => jugador.id === jugadorId
            );

            if (!participante) {
                manejarSesionInvalida(
                    "Ya no figuras como participante de esta sala. Ingresa nuevamente."
                );
                return;
            }

            detectarNuevosDisparos(datos);

            salaActual = datos;

            actualizarReferenciaTurno(datos);

            if (salaActual.estado === "esperando") {
                cambiarPantalla("sala");
                renderizarSala();

            } else {
                cambiarPantalla("juego");
                renderizarJuego();
            }

            actualizarTemporizador();
        },

        error => {
            console.error(error);

            mostrarMensaje(
                mensajeSala,
                "Error al actualizar la sala. Comprueba tu conexión."
            );
        }
    );
}

/* =====================================================
   SALA DE ESPERA
===================================================== */

function renderizarSala() {
    const jugadores = salaActual.jugadores || [];
    const configuracion = obtenerConfiguracion();
    const maximo = obtenerMaximoJugadores();

    contadorJugadores.textContent =
        `${jugadores.length} / ${maximo}`;

    reglasSalaTexto.textContent =
        obtenerTextoConfiguracion(configuracion, maximo);

    listaJugadores.innerHTML = "";

    jugadores.forEach((jugador, indice) => {
        const elemento = document.createElement("div");
        elemento.className = "jugador";

        const nombre = document.createElement("span");
        nombre.className = "jugador-nombre";
        nombre.textContent = `${indice + 1}. ${jugador.nombre}`;

        elemento.appendChild(nombre);

        if (jugador.id === salaActual.creadorId) {
            const etiqueta = document.createElement("span");
            etiqueta.className = "etiqueta-anfitrion";
            etiqueta.textContent = "ANFITRIÓN";
            elemento.appendChild(etiqueta);
        }

        listaJugadores.appendChild(elemento);
    });

    const soyAnfitrion = salaActual.creadorId === jugadorId;

    if (soyAnfitrion) {
        zonaInicioPartida.classList.remove("oculto");

        btnIniciarPartida.disabled =
            jugadores.length < MIN_JUGADORES ||
            jugadores.length > maximo;

        mostrarMensaje(
            mensajeInicioPartida,
            jugadores.length < MIN_JUGADORES
                ? "Espera a que entre al menos otro jugador."
                : "Puedes comenzar cuando quieras. No necesitas llenar la sala."
        );

    } else {
        zonaInicioPartida.classList.add("oculto");

        mostrarMensaje(
            mensajeSala,
            "Esperando a que el anfitrión comience la partida."
        );
    }
}

/* =====================================================
   INICIAR PARTIDA
===================================================== */

async function iniciarPartida() {
    if (!salaActual || operacionEnCurso) return;

    if (salaActual.creadorId !== jugadorId) {
        mostrarMensaje(
            mensajeInicioPartida,
            "Solo el anfitrión puede comenzar."
        );
        return;
    }

    operacionEnCurso = true;
    btnIniciarPartida.disabled = true;

    try {
        await runTransaction(db, async transaccion => {
            const referencia = referenciaSala();
            const documento = await transaccion.get(referencia);

            if (!documento.exists()) {
                throw new Error("La sala no existe.");
            }

            const datos = documento.data();

            if (datos.estado !== "esperando") {
                throw new Error("La sala ya fue iniciada.");
            }

            if (datos.creadorId !== jugadorId) {
                throw new Error("No eres el anfitrión.");
            }

            const maximo = obtenerMaximoJugadores(datos);

            if (
                !datos.jugadores ||
                datos.jugadores.length < MIN_JUGADORES ||
                datos.jugadores.length > maximo
            ) {
                throw new Error(
                    `Se necesitan entre 2 y ${maximo} jugadores.`
                );
            }

            const configuracion =
                datos.configuracion ||
                obtenerConfiguracionPredeterminada();

            if (!validarConfiguracion(configuracion)) {
                throw new Error(
                    "La configuración de la sala no es válida."
                );
            }

            const jugadoresPreparados = datos.jugadores.map(
                jugador => ({
                    ...jugador,
                    pollos: []
                })
            );

            transaccion.update(referencia, {
                estado: "colocando",
                jugadores: jugadoresPreparados,

                turnoJugadorId: null,
                turnoInicio: null,
                turnoLimite: null,
                turnoInicioServidor: null,
                turnoDuracionMs: null,

                disparos: [],
                eventos: [],

                ganadorId: null,
                fechaInicio: Date.now()
            });
        });

    } catch (error) {
        console.error(error);

        mostrarMensaje(
            mensajeInicioPartida,
            error.message || "No se pudo comenzar."
        );

        btnIniciarPartida.disabled = false;

    } finally {
        operacionEnCurso = false;
    }
}

/* =====================================================
   NUEVA PARTIDA
===================================================== */

async function nuevaPartida() {
    if (!salaActual || operacionEnCurso) return;

    if (salaActual.creadorId !== jugadorId) {
        mostrarMensaje(
            mensajeNuevaPartida,
            "Solo el anfitrión puede iniciar una nueva partida."
        );
        return;
    }

    if (salaActual.estado !== "finalizada") {
        mostrarMensaje(
            mensajeNuevaPartida,
            "La partida actual todavía no ha terminado."
        );
        return;
    }

    operacionEnCurso = true;
    btnNuevaPartida.disabled = true;

    mostrarMensaje(
        mensajeNuevaPartida,
        "Preparando una nueva partida..."
    );

    try {
        await runTransaction(db, async transaccion => {
            const referencia = referenciaSala();
            const documento = await transaccion.get(referencia);

            if (!documento.exists()) {
                throw new Error("La sala ya no existe.");
            }

            const datos = documento.data();

            if (datos.creadorId !== jugadorId) {
                throw new Error("Solo el anfitrión puede reiniciar.");
            }

            if (datos.estado !== "finalizada") {
                throw new Error("La partida no ha terminado.");
            }

            const jugadoresReiniciados =
                (datos.jugadores || []).map(jugador => ({
                    ...jugador,
                    pollos: []
                }));

            const ahora = Date.now();

            transaccion.update(referencia, {
                estado: "colocando",

                jugadores: jugadoresReiniciados,

                turnoJugadorId: null,
                turnoInicio: null,
                turnoLimite: null,
                turnoInicioServidor: null,
                turnoDuracionMs: null,

                disparos: [],
                eventos: [],

                ganadorId: null,

                fechaInicio: ahora,
                fechaReinicio: ahora
            });
        });

        posicionesSeleccionadas = [];
        proximoIntentoVencimiento = 0;

        claveTurnoActual = null;
        inicioTurnoMonotono = null;

        disparosVistos.clear();
        primeraCargaDisparos = true;

    } catch (error) {
        console.error(error);

        mostrarMensaje(
            mensajeNuevaPartida,
            error.message || "No se pudo iniciar la nueva partida."
        );

    } finally {
        operacionEnCurso = false;
        btnNuevaPartida.disabled = false;
    }
}

/* =====================================================
   RENDERIZAR JUEGO
===================================================== */

function renderizarJuego() {
    renderizarEstadoJugadores();
    renderizarHistorial();

    if (salaActual.estado === "colocando") {
        renderizarPreparacion();
        return;
    }

    if (salaActual.estado === "jugando") {
        renderizarCombate();
        return;
    }

    if (salaActual.estado === "finalizada") {
        renderizarResultados();
    }
}

/* =====================================================
   PREPARACIÓN DE POLLOS
===================================================== */

function renderizarPreparacion() {
    tituloFase.textContent = "Preparación de los pollos";

    const total = obtenerTotalPollos();

    textoFase.textContent =
        `Cada jugador debe esconder ${total} pollo(s) en el tablero.`;

    panelPreparacion.classList.remove("oculto");
    panelCombate.classList.add("oculto");
    panelResultados.classList.add("oculto");
    panelTemporizador.classList.add("oculto");

    const jugador = obtenerJugadorActual();

    if (!jugador) {
        mostrarMensaje(
            mensajePreparacion,
            "No apareces como participante de esta sala."
        );
        return;
    }

    const pollosGuardados = jugador.pollos || [];

    if (pollosGuardados.length >= total) {
        jugadorTurno.textContent = "Preparación completada";

        mostrarMensaje(
            mensajePreparacion,
            "Tus pollos están colocados. Esperando a los demás jugadores."
        );

        tableroPreparacion.innerHTML = "";
        contadorPollos.textContent = `${total} / ${total}`;

        btnGuardarPollos.classList.add("oculto");
        btnDeshacerPollo.classList.add("oculto");

        return;
    }

    jugadorTurno.textContent = "Coloca tus pollos";

    btnGuardarPollos.classList.remove("oculto");
    btnDeshacerPollo.classList.remove("oculto");

    contadorPollos.textContent =
        `${posicionesSeleccionadas.length} / ${total}`;

    btnGuardarPollos.disabled =
        posicionesSeleccionadas.length !== total;

    btnDeshacerPollo.disabled =
        posicionesSeleccionadas.length === 0;

    dibujarTablero(
        tableroPreparacion,
        coordenada => seleccionarPollo(coordenada),
        posicionesSeleccionadas,
        [],
        []
    );

    mostrarMensaje(
        mensajePreparacion,
        "Selecciona las casillas. Puedes repetir una coordenada."
    );
}

function seleccionarPollo(coordenada) {
    const jugador = obtenerJugadorActual();
    const total = obtenerTotalPollos();

    if (!jugador) return;
    if ((jugador.pollos || []).length >= total) return;
    if (posicionesSeleccionadas.length >= total) return;

    posicionesSeleccionadas.push(coordenada);
    renderizarPreparacion();
}

function deshacerPollo() {
    if (posicionesSeleccionadas.length === 0) return;

    posicionesSeleccionadas.pop();
    renderizarPreparacion();
}

async function guardarPollos() {
    const total = obtenerTotalPollos();

    if (
        posicionesSeleccionadas.length !== total ||
        operacionEnCurso
    ) {
        return;
    }

    const posiciones = [...posicionesSeleccionadas];

    operacionEnCurso = true;

    btnGuardarPollos.disabled = true;
    btnDeshacerPollo.disabled = true;

    mostrarMensaje(
        mensajePreparacion,
        "Guardando tus posiciones..."
    );

    try {
        await runTransaction(db, async transaccion => {
            const referencia = referenciaSala();
            const documento = await transaccion.get(referencia);

            if (!documento.exists()) {
                throw new Error("La sala no existe.");
            }

            const datos = documento.data();

            if (datos.estado !== "colocando") {
                throw new Error("La preparación ya terminó.");
            }

            const configuracion =
                datos.configuracion ||
                obtenerConfiguracionPredeterminada();

            const cantidad = configuracion.pollosPorJugador;
            const coordenadasValidas =
                obtenerCoordenadasDe(configuracion);

            if (
                posiciones.length !== cantidad ||
                !posiciones.every(posicion =>
                    coordenadasValidas.includes(posicion)
                )
            ) {
                throw new Error(
                    "Las posiciones seleccionadas no son válidas."
                );
            }

            let jugadorEncontrado = false;

            const jugadores = datos.jugadores.map(jugador => {
                if (jugador.id === jugadorId) {
                    jugadorEncontrado = true;

                    if ((jugador.pollos || []).length === cantidad) {
                        throw new Error("Ya colocaste tus pollos.");
                    }

                    return {
                        ...jugador,
                        pollos: posiciones
                    };
                }

                return jugador;
            });

            if (!jugadorEncontrado) {
                throw new Error("Ya no figuras en esta sala.");
            }

            const todosPreparados = jugadores.every(
                jugador => (jugador.pollos || []).length === cantidad
            );

            const cambios = { jugadores };

            if (todosPreparados) {
                const ahora = Date.now();
                const duracion = configuracion.tiempoTurno * 1000;

                cambios.estado = "jugando";
                cambios.turnoJugadorId = jugadores[0].id;
                cambios.turnoInicio = ahora;
                cambios.turnoLimite = ahora + duracion;

                cambios.turnoInicioServidor = serverTimestamp();
                cambios.turnoDuracionMs = duracion;

                cambios.eventos = [];
            }

            transaccion.update(referencia, cambios);
        });

        posicionesSeleccionadas = [];

    } catch (error) {
        console.error(error);

        mostrarMensaje(
            mensajePreparacion,
            error.message || "No se pudieron guardar las posiciones."
        );

    } finally {
        operacionEnCurso = false;
    }
}

/* =====================================================
   DIBUJAR TABLERO
===================================================== */

function dibujarTablero(
    contenedor,
    alSeleccionar,
    seleccionadas = [],
    propias = [],
    disparos = []
) {
    contenedor.innerHTML = "";

    const filas = obtenerTotalFilas();
    const columnas = obtenerTotalColumnas();

    contenedor.style.gridTemplateColumns =
        `repeat(${columnas + 1}, minmax(0, 1fr))`;

    const esquina = document.createElement("div");
    esquina.className = "celda etiqueta";
    contenedor.appendChild(esquina);

    for (let columna = 0; columna < columnas; columna++) {
        const etiqueta = document.createElement("div");
        etiqueta.className = "celda etiqueta";
        etiqueta.textContent = LETRAS_COLUMNAS[columna];
        contenedor.appendChild(etiqueta);
    }

    for (let fila = 1; fila <= filas; fila++) {
        const etiquetaFila = document.createElement("div");
        etiquetaFila.className = "celda etiqueta";
        etiquetaFila.textContent = fila;
        contenedor.appendChild(etiquetaFila);

        for (let columna = 0; columna < columnas; columna++) {
            const coordenada =
                `${LETRAS_COLUMNAS[columna]}${fila}`;

            const celda = document.createElement("button");

            celda.type = "button";
            celda.className = "celda";
            celda.dataset.coordenada = coordenada;

            const cantidadSeleccionada =
                seleccionadas.filter(
                    posicion => posicion === coordenada
                ).length;

            const cantidadPropia =
                propias.filter(
                    posicion => posicion === coordenada
                ).length;

            if (cantidadSeleccionada > 0) {
                celda.classList.add("seleccionada");

                celda.textContent =
                    cantidadSeleccionada > 1
                        ? `🐔×${cantidadSeleccionada}`
                        : "🐔";
            }

            if (cantidadPropia > 0) {
                celda.classList.add("propio");

                celda.textContent =
                    cantidadPropia > 1
                        ? `🐔×${cantidadPropia}`
                        : "🐔";
            }

            const disparo = disparos.find(
                tiro => tiro.coordenada === coordenada
            );

            if (disparo) {
                celda.classList.add(
                    disparo.aciertos && disparo.aciertos.length
                        ? "impacto"
                        : "atacada"
                );

                celda.textContent =
                    disparo.aciertos && disparo.aciertos.length
                        ? "✕"
                        : "•";
            }

            celda.addEventListener("click", () => {
                alSeleccionar(coordenada);
            });

            contenedor.appendChild(celda);
        }
    }
}

/* =====================================================
   JUGADORES ACTIVOS
===================================================== */

function obtenerJugadoresActivos(jugadores) {
    return jugadores.filter(
        jugador => (jugador.pollos || []).length > 0
    );
}

function obtenerSiguienteJugador(jugadores, jugadorActualId) {
    if (!jugadores.length) return null;

    const indiceActual = jugadores.findIndex(
        jugador => jugador.id === jugadorActualId
    );

    for (let paso = 1; paso <= jugadores.length; paso++) {
        const indice = indiceActual < 0
            ? paso - 1
            : (indiceActual + paso) % jugadores.length;

        const candidato = jugadores[indice];

        if ((candidato.pollos || []).length > 0) {
            return candidato;
        }
    }

    return null;
}

/* =====================================================
   RELOJ DEL TURNO
===================================================== */

/*
   Firestore genera turnoInicioServidor.

   performance.now() mide el tiempo transcurrido en el
   dispositivo sin depender de la hora configurada por
   el usuario en su computadora o teléfono.

   El reloj se ancla una sola vez por turno. Las siguientes
   actualizaciones de Firestore no reinician el contador.
*/

function obtenerClaveTurno(datos) {
    const inicio = datos.turnoInicioServidor;

    if (inicio && typeof inicio.toMillis === "function") {
        return `servidor_${inicio.toMillis()}_${datos.turnoJugadorId}`;
    }

    return `anterior_${datos.turnoInicio}_${datos.turnoJugadorId}`;
}

function actualizarReferenciaTurno(datos) {
    const nuevaClave = obtenerClaveTurno(datos);

    if (nuevaClave !== claveTurnoActual) {
        claveTurnoActual = nuevaClave;
        inicioTurnoMonotono = performance.now();
        proximoIntentoVencimiento = 0;
    }
}

function obtenerDuracionTurno(datos) {
    if (
        Number.isFinite(datos.turnoDuracionMs) &&
        datos.turnoDuracionMs > 0
    ) {
        return datos.turnoDuracionMs;
    }

    const configuracion =
        datos.configuracion ||
        obtenerConfiguracionPredeterminada();

    return Number(configuracion.tiempoTurno) * 1000;
}

function obtenerTiempoTranscurrido(datos) {
    if (
        datos.turnoInicioServidor &&
        typeof datos.turnoInicioServidor.toMillis === "function"
    ) {
        if (inicioTurnoMonotono === null) {
            actualizarReferenciaTurno(datos);
        }

        return Math.max(
            0,
            performance.now() - inicioTurnoMonotono
        );
    }

    /*
       Compatibilidad con salas que todavía utilizan
       el formato anterior del temporizador.
    */

    return Math.max(
        0,
        Date.now() - Number(datos.turnoInicio || Date.now())
    );
}

function turnoVencido(datos) {
    return (
        obtenerTiempoTranscurrido(datos) >=
        obtenerDuracionTurno(datos)
    );
}

/* =====================================================
   COMBATE
===================================================== */

function renderizarCombate() {
    tituloFase.textContent = "Combate";

    textoFase.textContent =
        "Ataca una coordenada para intentar eliminar pollos de tus rivales.";

    panelPreparacion.classList.add("oculto");
    panelCombate.classList.remove("oculto");
    panelResultados.classList.add("oculto");

    const jugador = obtenerJugadorActual();

    if (!jugador) {
        mostrarMensaje(
            mensajeCombate,
            "No apareces como participante de esta sala."
        );
        return;
    }

    const jugadoresActivos = obtenerJugadoresActivos(
        salaActual.jugadores
    );

    const turno = jugadoresActivos.find(
        participante =>
            participante.id === salaActual.turnoJugadorId
    );

    jugadorTurno.textContent = turno
        ? turno.nombre
        : "Esperando...";

    const esMiTurno =
        salaActual.turnoJugadorId === jugadorId;

    const disparosPropios = (salaActual.disparos || []).filter(
        tiro => tiro.jugadorId === jugadorId
    );

    const coordenadasAtacadas = disparosPropios.map(
        tiro => tiro.coordenada
    );

    dibujarTablero(
        tableroCombate,
        coordenada => atacar(coordenada),
        [],
        jugador.pollos || [],
        disparosPropios
    );

    const botones = tableroCombate.querySelectorAll(
        "button.celda[data-coordenada]"
    );

    botones.forEach(boton => {
        const coordenada = boton.dataset.coordenada;

        boton.disabled =
            !esMiTurno ||
            coordenadasAtacadas.includes(coordenada) ||
            salaActual.estado !== "jugando";
    });

    if (!esMiTurno) {
        mostrarMensaje(
            mensajeCombate,
            turno
                ? `Es el turno de ${turno.nombre}.`
                : "Esperando el siguiente turno."
        );

    } else {
        mostrarMensaje(
            mensajeCombate,
            "¡Es tu turno! Selecciona una casilla para atacar."
        );
    }

    actualizarTemporizador();
}

/* =====================================================
   TEMPORIZADOR
===================================================== */

function iniciarTemporizadorVisual() {
    if (intervaloTemporizador) return;

    intervaloTemporizador = setInterval(
        actualizarTemporizador,
        200
    );
}

function actualizarTemporizador() {
    if (
        !salaActual ||
        salaActual.estado !== "jugando" ||
        !salaActual.turnoJugadorId
    ) {
        panelTemporizador.classList.add("oculto");
        return;
    }

    actualizarReferenciaTurno(salaActual);

    panelTemporizador.classList.remove("oculto");

    const duracion = obtenerDuracionTurno(salaActual);
    const transcurrido = obtenerTiempoTranscurrido(salaActual);

    const diferencia = Math.max(
        0,
        duracion - transcurrido
    );

    const segundos = Math.ceil(diferencia / 1000);

    tiempoRestante.textContent = segundos;

    panelTemporizador.classList.toggle(
        "urgente",
        segundos <= 3
    );

    if (
        diferencia <= 0 &&
        !procesandoVencimiento &&
        Date.now() >= proximoIntentoVencimiento
    ) {
        pasarTurnoPorTiempo();
    }
}

async function pasarTurnoPorTiempo() {
    if (
        procesandoVencimiento ||
        !codigoActual ||
        !salaActual ||
        salaActual.estado !== "jugando"
    ) {
        return;
    }

    if (!turnoVencido(salaActual)) return;

    procesandoVencimiento = true;

    const claveTurnoQueVence = claveTurnoActual;

    try {
        await runTransaction(db, async transaccion => {
            const referencia = referenciaSala();
            const documento = await transaccion.get(referencia);

            if (!documento.exists()) return;

            const datos = documento.data();

            if (
                datos.estado !== "jugando" ||
                !datos.turnoJugadorId ||
                obtenerClaveTurno(datos) !== claveTurnoQueVence
            ) {
                return;
            }

            /*
               Comprobamos el vencimiento nuevamente dentro
               de la transacción. Si otro jugador ya cambió
               el turno, la clave ya no coincidirá.
            */

            if (!turnoVencido(datos)) return;

            const jugadores = datos.jugadores.map(jugador => ({
                ...jugador,
                pollos: [...(jugador.pollos || [])]
            }));

            const jugadorQuePerdioTurno = jugadores.find(
                jugador => jugador.id === datos.turnoJugadorId
            );

            if (!jugadorQuePerdioTurno) return;

            const eventos = [...(datos.eventos || [])];

            eventos.push({
                tipo: "tiempo_agotado",
                jugadorId: jugadorQuePerdioTurno.id,
                jugadorNombre: jugadorQuePerdioTurno.nombre,
                fecha: Date.now()
            });

            const activos = obtenerJugadoresActivos(jugadores);

            if (activos.length <= 1) {
                transaccion.update(referencia, {
                    estado: "finalizada",
                    jugadores,
                    eventos,
                    turnoJugadorId: null,
                    turnoInicio: null,
                    turnoLimite: null,
                    turnoInicioServidor: null,
                    turnoDuracionMs: null,
                    ganadorId: activos.length === 1
                        ? activos[0].id
                        : null
                });

                return;
            }

            const siguiente = obtenerSiguienteJugador(
                jugadores,
                datos.turnoJugadorId
            );

            if (!siguiente) return;

            const ahora = Date.now();
            const duracion = obtenerDuracionTurno(datos);

            transaccion.update(referencia, {
                jugadores,
                eventos,
                turnoJugadorId: siguiente.id,
                turnoInicio: ahora,
                turnoLimite: ahora + duracion,
                turnoInicioServidor: serverTimestamp(),
                turnoDuracionMs: duracion
            });
        });

        proximoIntentoVencimiento = 0;

    } catch (error) {
        console.error(
            "No se pudo avanzar el turno automáticamente:",
            error
        );

        proximoIntentoVencimiento = Date.now() + 1000;

    } finally {
        procesandoVencimiento = false;
    }
}

/* =====================================================
   ATACAR
===================================================== */

async function atacar(coordenada) {
    if (operacionEnCurso || !salaActual) return;

    const disparosPropios = (salaActual.disparos || []).filter(
        tiro => tiro.jugadorId === jugadorId
    );

    if (
        disparosPropios.some(
            tiro => tiro.coordenada === coordenada
        )
    ) {
        mostrarMensaje(
            mensajeCombate,
            "Ya atacaste esa coordenada."
        );
        return;
    }

    operacionEnCurso = true;

    /*
       El identificador se genera fuera de la transacción
       para que no cambie si Firestore vuelve a intentarla.
    */

    const identificadorDisparo = crypto.randomUUID();

    try {
        await runTransaction(db, async transaccion => {
            const referencia = referenciaSala();
            const documento = await transaccion.get(referencia);

            if (!documento.exists()) {
                throw new Error("La sala ya no existe.");
            }

            const datos = documento.data();

            if (datos.estado !== "jugando") {
                throw new Error("La partida no está en combate.");
            }

            if (datos.turnoJugadorId !== jugadorId) {
                throw new Error("No es tu turno.");
            }

            if (turnoVencido(datos)) {
                throw new Error("Se agotó el tiempo de tu turno.");
            }

            const configuracion =
                datos.configuracion ||
                obtenerConfiguracionPredeterminada();

            const coordenadasValidas =
                obtenerCoordenadasDe(configuracion);

            if (!coordenadasValidas.includes(coordenada)) {
                throw new Error("La coordenada no pertenece al tablero.");
            }

            const disparos = [...(datos.disparos || [])];

            if (
                disparos.some(
                    tiro =>
                        tiro.jugadorId === jugadorId &&
                        tiro.coordenada === coordenada
                )
            ) {
                throw new Error("Ya atacaste esa coordenada.");
            }

            const jugadores = datos.jugadores.map(jugador => ({
                ...jugador,
                pollos: [...(jugador.pollos || [])]
            }));

            const aciertos = [];

            jugadores.forEach(jugador => {
                if (jugador.id === jugadorId) return;

                const antes = jugador.pollos.length;

                jugador.pollos = jugador.pollos.filter(
                    posicion => posicion !== coordenada
                );

                if (jugador.pollos.length < antes) {
                    aciertos.push({
                        jugadorId: jugador.id,
                        nombre: jugador.nombre,
                        cantidad: antes - jugador.pollos.length
                    });
                }
            });

            disparos.push({
                id: identificadorDisparo,
                jugadorId,
                jugadorNombre: obtenerNombreJugador(
                    jugadores,
                    jugadorId
                ),
                coordenada,
                aciertos,
                fecha: Date.now()
            });

            const activos = obtenerJugadoresActivos(jugadores);

            let nuevoEstado = "jugando";
            let siguienteTurno = null;
            let turnoInicio = null;
            let turnoLimite = null;
            let turnoInicioServidor = null;
            let turnoDuracionMs = null;
            let ganadorId = null;

            if (activos.length <= 1) {
                nuevoEstado = "finalizada";

                ganadorId = activos.length === 1
                    ? activos[0].id
                    : null;

            } else {
                const siguiente = obtenerSiguienteJugador(
                    jugadores,
                    jugadorId
                );

                if (siguiente) {
                    siguienteTurno = siguiente.id;
                    turnoInicio = Date.now();

                    turnoDuracionMs =
                        Number(configuracion.tiempoTurno) * 1000;

                    turnoLimite =
                        turnoInicio + turnoDuracionMs;

                    turnoInicioServidor = serverTimestamp();
                }
            }

            transaccion.update(referencia, {
                jugadores,
                disparos,
                estado: nuevoEstado,
                turnoJugadorId: siguienteTurno,
                turnoInicio,
                turnoLimite,
                turnoInicioServidor,
                turnoDuracionMs,
                ganadorId
            });
        });

    } catch (error) {
        console.error(error);

        mostrarMensaje(
            mensajeCombate,
            error.message || "No se pudo realizar el ataque."
        );

    } finally {
        operacionEnCurso = false;
    }
}

function obtenerNombreJugador(jugadores, id) {
    const jugador = jugadores.find(
        participante => participante.id === id
    );

    return jugador ? jugador.nombre : "Jugador";
}

/* =====================================================
   ESTADO DE JUGADORES
===================================================== */

function renderizarEstadoJugadores() {
    estadoJugadores.innerHTML = "";

    salaActual.jugadores.forEach((jugador, indice) => {
        const elemento = document.createElement("div");
        elemento.className = "jugador";

        const nombre = document.createElement("span");
        nombre.className = "jugador-nombre";
        nombre.textContent = `${indice + 1}. ${jugador.nombre}`;

        const datos = document.createElement("span");
        datos.className = "jugador-datos";

        const cantidad = (jugador.pollos || []).length;

        if (salaActual.estado === "colocando") {
            datos.textContent = cantidad > 0
                ? `${cantidad} / ${obtenerTotalPollos()} colocados`
                : "Preparando...";

        } else {
            datos.textContent = cantidad > 0
                ? `${cantidad} pollo(s) restante(s)`
                : "ELIMINADO";
        }

        elemento.appendChild(nombre);
        elemento.appendChild(datos);

        estadoJugadores.appendChild(elemento);
    });
}

/* =====================================================
   HISTORIAL
===================================================== */

function renderizarHistorial() {
    historialAtaques.innerHTML = "";

    const disparos = (salaActual.disparos || []).map(tiro => ({
        ...tiro,
        tipoRegistro: "ataque"
    }));

    const eventos = (salaActual.eventos || []).map(evento => ({
        ...evento,
        tipoRegistro: "evento"
    }));

    const registros = [...disparos, ...eventos].sort(
        (a, b) => (b.fecha || 0) - (a.fecha || 0)
    );

    if (registros.length === 0) {
        const vacio = document.createElement("p");

        vacio.className = "historial-vacio";
        vacio.textContent = "Todavía no hay movimientos.";

        historialAtaques.appendChild(vacio);
        return;
    }

    registros.forEach(registro => {
        const elemento = document.createElement("div");
        elemento.className = "historial-item";

        let texto = "";

        if (registro.tipoRegistro === "evento") {
            texto =
                `${registro.jugadorNombre} no realizó un ataque a tiempo. ` +
                "Su turno fue omitido automáticamente.";

        } else {
            texto =
                `${registro.jugadorNombre} atacó ${registro.coordenada}.`;

            if (
                registro.aciertos &&
                registro.aciertos.length > 0
            ) {
                const total = registro.aciertos.reduce(
                    (suma, acierto) => suma + acierto.cantidad,
                    0
                );

                texto += ` ¡Impacto! Eliminó ${total} pollo(s).`;

            } else {
                texto += " No hubo impacto.";
            }
        }

        elemento.textContent = texto;
        historialAtaques.appendChild(elemento);
    });
}

/* =====================================================
   RESULTADOS
===================================================== */

function renderizarResultados() {
    tituloFase.textContent = "Partida finalizada";

    textoFase.textContent =
        "La partida ha terminado.";

    panelPreparacion.classList.add("oculto");
    panelCombate.classList.add("oculto");
    panelResultados.classList.remove("oculto");
    panelTemporizador.classList.add("oculto");

    jugadorTurno.textContent = "Finalizado";

    const ganador = salaActual.jugadores.find(
        jugador => jugador.id === salaActual.ganadorId
    );

    resultadoFinal.innerHTML = "";

    const mensaje = document.createElement("div");

    if (ganador) {
        mensaje.className = "resultado-ganador";
        mensaje.textContent =
            `🏆 ¡${ganador.nombre} ha ganado la partida!`;

    } else {
        mensaje.className = "resultado-empate";
        mensaje.textContent = "La partida terminó sin ganador.";
    }

    resultadoFinal.appendChild(mensaje);

    const soyAnfitrion =
        salaActual.creadorId === jugadorId;

    btnNuevaPartida.classList.toggle(
        "oculto",
        !soyAnfitrion
    );

    btnNuevaPartida.disabled = false;

    if (soyAnfitrion) {
        mostrarMensaje(
            mensajeNuevaPartida,
            "Puedes iniciar otra partida con los mismos jugadores y las mismas reglas."
        );
    } else {
        mostrarMensaje(
            mensajeNuevaPartida,
            "Esperando a que el anfitrión inicie una nueva partida."
        );
    }
}

/* =====================================================
   COPIAR CÓDIGO
===================================================== */

async function copiarCodigo() {
    if (!codigoActual) return;

    try {
        await navigator.clipboard.writeText(codigoActual);

        btnCopiarCodigo.textContent = "¡CÓDIGO COPIADO!";

        setTimeout(() => {
            btnCopiarCodigo.textContent = "COPIAR CÓDIGO";
        }, 1800);

    } catch (error) {
        console.error(error);

        mostrarMensaje(
            mensajeSala,
            "No fue posible copiar el código."
        );
    }
}

/* =====================================================
   SALIR
===================================================== */

function salirDelJuego() {
    if (detenerEscucha) {
        detenerEscucha();
        detenerEscucha = null;
    }

    limpiarSesionSala();

    codigoActual = null;
    salaActual = null;

    posicionesSeleccionadas = [];

    operacionEnCurso = false;
    procesandoVencimiento = false;
    proximoIntentoVencimiento = 0;

    claveTurnoActual = null;
    inicioTurnoMonotono = null;

    disparosVistos.clear();
    primeraCargaDisparos = true;

    listaJugadores.innerHTML = "";
    tableroPreparacion.innerHTML = "";
    tableroCombate.innerHTML = "";

    panelTemporizador.classList.add("oculto");

    cambiarPantalla("inicio");

    mostrarMensaje(mensajeInicio, "");
}

/* =====================================================
   EVENTOS
===================================================== */

btnMostrarCrear.addEventListener("click", () => mostrarOpcionInicio("crear"));
btnMostrarUnirse.addEventListener("click", () => mostrarOpcionInicio("unirse"));
btnActualizarSalas.addEventListener("click", () => {
    if (detenerEscuchaSalas) {
        detenerEscuchaSalas();
        detenerEscuchaSalas = null;
    }
    escucharSalasDisponibles();
});
btnUnirseCodigoManual.addEventListener("click", () => {
    codigoSalaSeleccionada = null;
    inputCodigo.value = inputCodigoManual.value.trim().toUpperCase();
    unirseSala();
});
btnCrearSala.addEventListener("click", crearSala);
btnUnirseSala.addEventListener("click", unirseSala);
btnCopiarCodigo.addEventListener("click", copiarCodigo);
btnIniciarPartida.addEventListener("click", iniciarPartida);
btnGuardarPollos.addEventListener("click", guardarPollos);
btnDeshacerPollo.addEventListener("click", deshacerPollo);
btnSalirSala.addEventListener("click", salirDelJuego);
btnSalirJuego.addEventListener("click", salirDelJuego);
btnNuevaPartida.addEventListener("click", nuevaPartida);

/* Habilitar el audio después de una interacción del usuario. */

document.addEventListener("pointerdown", prepararAudio);
document.addEventListener("keydown", prepararAudio);

inputCodigoManual.addEventListener("input", () => {
    inputCodigoManual.value = inputCodigoManual.value.toUpperCase();
});

inputCodigo.addEventListener("input", () => {
    inputCodigo.value = inputCodigo.value.toUpperCase();
});

configFilas.addEventListener(
    "change",
    actualizarResumenConfiguracion
);

configColumnas.addEventListener(
    "change",
    actualizarResumenConfiguracion
);

configPollos.addEventListener(
    "change",
    actualizarResumenConfiguracion
);

configTiempo.addEventListener(
    "input",
    actualizarResumenConfiguracion
);

configJugadores.addEventListener(
    "input",
    actualizarResumenConfiguracion
);

configJugadores.addEventListener("change", () => {
    const valor = Number(configJugadores.value);

    if (valor < MIN_JUGADORES) {
        configJugadores.value = MIN_JUGADORES;
    }

    if (valor > MAX_JUGADORES) {
        configJugadores.value = MAX_JUGADORES;
    }

    actualizarResumenConfiguracion();
});

/* =====================================================
   INICIAR
===================================================== */

iniciarTemporizadorVisual();
actualizarResumenConfiguracion();

intentarReconectar();