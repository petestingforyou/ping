var arrayData=new Array();
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

const datos = {
    nombre: "Juan Pérez",
    edad: 30,
    profesion: "Desarrollador Web"
};

// Seleccionamos el elemento donde queremos mostrar los datos
const contenedor = document.getElementById("datos");

// Creamos el contenido HTML que queremos mostrar
contenedor.innerHTML = `
    <p>Nombre: ${datos.nombre}</p>
    <p>Edad: ${datos.edad} años</p>
    <p>Profesión: ${datos.profesion}</p>
`;
