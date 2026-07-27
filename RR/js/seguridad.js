// Verificar sesión activa

const usuario = sessionStorage.getItem("usuario");

const rol = sessionStorage.getItem("rol");



// Si no existe sesión regresar al login

if(!usuario || !rol){

    window.location.href = "login.html";

}



// Función para cerrar sesión

export function cerrarSesion(){

    sessionStorage.clear();

    window.location.href = "login.html";

}



// Función para validar rol

export function validarRol(rolPermitido){


    if(rol !== rolPermitido){

        window.location.href = "login.html";

    }


}