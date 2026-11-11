import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getFirestore,
    doc,
    runTransaction,
    onSnapshot
} from
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

/* =====================================================
   CONFIGURACIÓN FIREBASE
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
   REGLAS GENERALES
===================================================== */

const MIN_JUGADORES = 2;
const MAX_JUGADORES = 100;

const FILAS_MAXIMAS = 10;
const COLUMNAS_MAXIMAS = 10;

const POLLOS_MINIMOS = 1;
const POLLOS_MAXIMOS = 10;

const TIEMPO_MINIMO = 5;
const TIEMPO_MAXIMO = 20;

const LETRAS_COLUMNAS = [
    "A", "B", "C", "D", "E",
    "F", "G", "H", "I", "J"
];

/* =====================================================
   VARIABLES
===================================================== */

let codigoActual = null;
let salaActual = null;
let detenerEscucha = null;

let posicionesSeleccionadas = [];

let operacionEnCurso = false;
let procesandoVencimiento = false;

let intervaloTemporizador = null;
let proximoIntentoVencimiento = 0;

let jugadorId = sessionStorage.getItem("caceria_jugador_id");

if (!jugadorId) {
    jugadorId = crypto.randomUUID();
    sessionStorage.setItem("caceria_jugador_id", jugadorId);
}

/* =====================================================
   ELEMENTOS HTML
===================================================== */

const pantallaInicio = document.getElementById("pantallaInicio");
const pantallaSala = document.getElementById("pantallaSala");
const pantallaJuego = document.getElementById("pantallaJuego");

const inputSeudonimo = document.getElementById("seudonimo");
const inputCodigo = document.getElementById("codigoEntrada");

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

const codigoSalaTexto = document.getElementById("codigoSala");
const contadorJugadores = document.getElementById("contadorJugadores");
const listaJugadores = document.getElementById("listaJugadores");
const reglasSalaTexto = document.getElementById("reglasSalaTexto");

const mensajeInicio = document.getElementById("mensajeInicio");
const mensajeSala = document.getElementById("mensajeSala");
const mensajeInicioPartida = document.getElementById("mensajeInicioPartida");

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

/* =====================================================
   CONFIGURACIÓN DE LA SALA
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
    elemento.textContent = texto;
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
   CREAR SALA
===================================================== */

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
            "La configuración seleccionada no es válida."
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

                disparos: [],
                eventos: [],

                ganadorId: null,
                fechaCreacion: Date.now()
            };

            const resultado = await runTransaction(
                db,
                async transaccion => {
                    const documento = await transaccion.get(referencia);

                    if (documento.exists()) {
                        return false;
                    }

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

        entrarEnSala(codigo);

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
    const codigo = inputCodigo.value.trim().toUpperCase();

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

            if (jugadores.some(jugador => jugador.id === jugadorId)) {
                return;
            }

            const maximo = obtenerMaximoJugadores(datos);

            if (jugadores.length >= maximo) {
                throw new Error("La sala está llena.");
            }

            const nombreOcupado = jugadores.some(
                jugador =>
                    jugador.nombre.toLowerCase() === seudonimo.toLowerCase()
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

        entrarEnSala(codigo);

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
   ESCUCHAR SALA
===================================================== */

function entrarEnSala(codigo) {
    codigoActual = codigo;
    posicionesSeleccionadas = [];

    proximoIntentoVencimiento = 0;

    codigoSalaTexto.textContent = codigo;

    cambiarPantalla("sala");

    escucharSala(codigo);
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
                mostrarMensaje(
                    mensajeSala,
                    "La sala ya no existe."
                );
                return;
            }

            salaActual = documento.data();

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
                "Error al actualizar la sala."
            );
        }
    );
}

/* =====================================================
   RENDERIZAR SALA DE ESPERA
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
   INICIAR PREPARACIÓN
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
                datos.configuracion || obtenerConfiguracionPredeterminada();

            if (!validarConfiguracion(configuracion)) {
                throw new Error(
                    "La configuración de la sala no es válida."
                );
            }

            const jugadoresPreparados = datos.jugadores.map(jugador => ({
                ...jugador,
                pollos: []
            }));

            transaccion.update(referencia, {
                estado: "colocando",
                jugadores: jugadoresPreparados,

                turnoJugadorId: null,
                turnoInicio: null,
                turnoLimite: null,

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
   RENDERIZAR JUEGO
===================================================== */

function renderizarJuego() {
    renderizarEstadoJugadores();
    renderizarHistorial();

    const estado = salaActual.estado;

    if (estado === "colocando") {
        renderizarPreparacion();
        return;
    }

    if (estado === "jugando") {
        renderizarCombate();
        return;
    }

    if (estado === "finalizada") {
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
                datos.configuracion || obtenerConfiguracionPredeterminada();

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

            const jugadores = datos.jugadores.map(jugador => {
                if (jugador.id === jugadorId) {
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

            const todosPreparados = jugadores.every(
                jugador => (jugador.pollos || []).length === cantidad
            );

            const cambios = {
                jugadores
            };

            if (todosPreparados) {
                const ahora = Date.now();

                cambios.estado = "jugando";

                cambios.turnoJugadorId = jugadores[0].id;

                cambios.turnoInicio = ahora;

                cambios.turnoLimite =
                    ahora + configuracion.tiempoTurno * 1000;

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
   DIBUJAR TABLERO DINÁMICO
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
    esquina.textContent = "";

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
        participante => participante.id === salaActual.turnoJugadorId
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
   TEMPORIZADOR COMPARTIDO
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
        !salaActual.turnoLimite
    ) {
        panelTemporizador.classList.add("oculto");
        return;
    }

    panelTemporizador.classList.remove("oculto");

    const diferencia =
        salaActual.turnoLimite - Date.now();

    const segundos = Math.max(
        0,
        Math.ceil(diferencia / 1000)
    );

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

    procesandoVencimiento = true;

    try {
        await runTransaction(db, async transaccion => {
            const referencia = referenciaSala();
            const documento = await transaccion.get(referencia);

            if (!documento.exists()) return;

            const datos = documento.data();

            if (
                datos.estado !== "jugando" ||
                !datos.turnoLimite ||
                Date.now() < datos.turnoLimite
            ) {
                return;
            }

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

            const configuracion =
                datos.configuracion || obtenerConfiguracionPredeterminada();

            transaccion.update(referencia, {
                jugadores,
                eventos,
                turnoJugadorId: siguiente.id,
                turnoInicio: ahora,
                turnoLimite:
                    ahora + configuracion.tiempoTurno * 1000
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

            if (
                !datos.turnoLimite ||
                Date.now() >= datos.turnoLimite
            ) {
                throw new Error("Se agotó el tiempo de tu turno.");
            }

            const configuracion =
                datos.configuracion || obtenerConfiguracionPredeterminada();

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

            const nuevoDisparo = {
                jugadorId,
                jugadorNombre: obtenerNombreJugador(
                    jugadores,
                    jugadorId
                ),
                coordenada,
                aciertos,
                fecha: Date.now()
            };

            disparos.push(nuevoDisparo);

            const activos = obtenerJugadoresActivos(jugadores);

            let nuevoEstado = "jugando";
            let siguienteTurno = null;
            let turnoInicio = null;
            let turnoLimite = null;
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

                    turnoLimite =
                        turnoInicio +
                        configuracion.tiempoTurno * 1000;
                }
            }

            transaccion.update(referencia, {
                jugadores,
                disparos,
                estado: nuevoEstado,
                turnoJugadorId: siguienteTurno,
                turnoInicio,
                turnoLimite,
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

                texto +=
                    ` ¡Impacto! Eliminó ${total} pollo(s).`;

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

    codigoActual = null;
    salaActual = null;

    posicionesSeleccionadas = [];

    operacionEnCurso = false;
    procesandoVencimiento = false;
    proximoIntentoVencimiento = 0;

    listaJugadores.innerHTML = "";
    tableroPreparacion.innerHTML = "";
    tableroCombate.innerHTML = "";

    panelTemporizador.classList.add("oculto");

    cambiarPantalla("inicio");
}

/* =====================================================
   EVENTOS
===================================================== */

btnCrearSala.addEventListener("click", crearSala);

btnUnirseSala.addEventListener("click", unirseSala);

btnCopiarCodigo.addEventListener("click", copiarCodigo);

btnIniciarPartida.addEventListener("click", iniciarPartida);

btnGuardarPollos.addEventListener("click", guardarPollos);

btnDeshacerPollo.addEventListener("click", deshacerPollo);

btnSalirSala.addEventListener("click", salirDelJuego);

btnSalirJuego.addEventListener("click", salirDelJuego);

inputCodigo.addEventListener("input", () => {
    inputCodigo.value = inputCodigo.value.toUpperCase();
});

configFilas.addEventListener("change", actualizarResumenConfiguracion);
configColumnas.addEventListener("change", actualizarResumenConfiguracion);
configPollos.addEventListener("change", actualizarResumenConfiguracion);
configTiempo.addEventListener("change", actualizarResumenConfiguracion);

configJugadores.addEventListener("input", actualizarResumenConfiguracion);

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
   INICIAR TEMPORIZADOR VISUAL
===================================================== */

iniciarTemporizadorVisual();
actualizarResumenConfiguracion();