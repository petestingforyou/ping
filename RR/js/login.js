import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";



const formulario = document.getElementById("loginForm");

const mensaje = document.getElementById("mensaje");



formulario.addEventListener("submit", validarLogin);





// Generar hash SHA-256

async function generarHash(texto){


    const encoder = new TextEncoder();


    const datos = encoder.encode(texto);


    const hash = await crypto.subtle.digest(
        "SHA-256",
        datos
    );


    const arreglo = Array.from(
        new Uint8Array(hash)
    );


    return arreglo.map(

        b => b.toString(16).padStart(2,"0")

    ).join("");

}






async function validarLogin(e){


    e.preventDefault();



    const usuario = document.getElementById("usuario").value.trim();

    const password = document.getElementById("password").value.trim();




    if(usuario === "" || password === ""){


        mensaje.style.color="red";

        mensaje.textContent =
        "Complete todos los campos.";

        return;

    }




    try{


        // Buscar documento por ID

        const referencia = doc(
            db,
            "usuarios",
            usuario
        );



        const resultado = await getDoc(referencia);




        if(!resultado.exists()){


            mensaje.style.color="red";

            mensaje.textContent =
            "Usuario no encontrado.";

            return;

        }





        const datos = resultado.data();





        // Convertir contraseña ingresada a hash

        const hash = await generarHash(password);





        if(hash !== datos.passwordHash){


            mensaje.style.color="red";

            mensaje.textContent =
            "Contraseña incorrecta.";

            return;

        }






        // Guardar sesión

        sessionStorage.setItem(
            "usuario",
            datos.usuario
        );


        sessionStorage.setItem(
            "rol",
            datos.rol
        );







        // Enviar según rol


        if(datos.rol === "captura"){


            window.location.href = "index.html";


        }



        if(datos.rol === "consultor"){


            window.location.href = "consulta.html";


        }





    }catch(error){


        console.error(error);


        mensaje.style.color="red";

        mensaje.textContent =
        "Error al iniciar sesión.";


    }


}