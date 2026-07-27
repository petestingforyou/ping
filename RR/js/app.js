import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const formulario = document.getElementById("registroForm");

const usuarioSesion = sessionStorage.getItem("usuario");

const mensaje = document.getElementById("mensaje");


document.getElementById("usuarioSesion").textContent = usuarioSesion;


formulario.addEventListener("submit", guardarRegistro);



async function guardarRegistro(e) {

    e.preventDefault();


    const usuario = document.getElementById("usuarioSesion").textContent;

    const folioRetiro = document.getElementById("folioRetiro").value.trim();

    const folioDeposito = document.getElementById("folioDeposito").value.trim();

    const cantidad = document.getElementById("cantidad").value;



    // Verificar si el folio de retiro ya existe

    const consulta = query(
        collection(db, "retiros"),
        where("folioRetiro", "==", folioRetiro)
    );


    const resultado = await getDocs(consulta);



    if (!resultado.empty) {

        mensaje.textContent = "❌ El folio de retiro ya fue registrado.";

        mensaje.style.color = "red";

        return;
    }



    // Guardar registro

    await addDoc(collection(db, "retiros"), {

        usuario: usuario,

        folioRetiro: folioRetiro,

        folioDeposito: folioDeposito,

        cantidad: Number(cantidad),

        fecha: new Date()

    });



    mensaje.textContent = "✅ Registro guardado correctamente.";

    mensaje.style.color = "green";


    formulario.reset();

}