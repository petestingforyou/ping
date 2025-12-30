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
    parrafo: "Peso y balanzas justas son del SEÑOR: obra suya son todas las pesas de la bolsa.\nProverbios 16:11\n\nSi hay algo que me disgusta es que alguien se aproveche de otra persona, pensando que no hay quien se dé cuenta o que pueda intervenir; pero en los cielos está el Amo y Señor del universo, y a cada uno dará su pago según corresponda.",
    cita: "Noctis Verba",
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
