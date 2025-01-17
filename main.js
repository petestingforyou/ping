/* var arrayData=new Array();
var archivoTxt=new XMLHttpRequest();
var fileRuta='datos.txt';
var dataSum=0;

archivoTxt.open("Get",fileRuta,false);
archivoTxt.send(null);
var txt=archivoTxt.responseText;

for(var i=0; i<txt.length;i++){
arrayData.push(txt[i]);
}
arrayData.forEach(function(data){
console.log(data);
dataSum+=parseInt(data);
});

if (dataSum==0){
console.log ('inserte dato');}
else {
console.log ('la sumas es:'+dataSum);}
*/
const datos = {
    parrafo: "<p>A veces solemos exaltar las virtudes de los grandes hombres de la biblia, llegando a tener una percepción que los hace casi inhumanos, es decir que no se adolecen de pasiones como las nuestras, y eso nos lleva a pensar que quizás hay algo en nosotros que no es suficiente para proseguir este camino, y lejos de alentarnos caemos en el desatino. Pero si observas un poco más podrás ver que también ellos calleron en desesperación, pero su resolución de creer en Dios no los abandono.</p> </br>

<p>Job dijo:</br>
Porque las saetas del Todopoderoso están en mí, cuyo veneno bebe mi espíritu; y terrores de Dios me combaten.</p></br>

<p>¿Cuál es mi fortaleza para esperar aún? ¿y cuál mi fin para dilatar mi vida?</p>",
    cita: "referencia Job 6:4,11",
};

// Seleccionamos el elemento donde queremos mostrar los datos
const contenedor = document.getElementById("parrafo");
const contenedor2 = document.getElementById("cita");

// Creamos el contenido HTML que queremos mostrar
contenedor.innerHTML = `
    ${datos.parrafo}
    `;
contenedor2.innerHTML = `
    ${datos.cita}
    `;
