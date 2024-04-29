var arrayData=new array();
var archivoTxt=newXMLHTTPRequest();
var fileRuta=datos.txt
var dataSum=0;

archivoTxt.open("Get",fileRuta,false);
archivoTxt.send(null);
var txt=archivoTxt.responseText;

for(var i=0; i<txt.length;i++){
arrayData.push(txt[i]);
}
arrayData.foreach(function(data){
console.log(data);
dataSum+=parseInt(data);
});

if (dataSum==0){
console.log ('inserte dato');