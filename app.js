let textoExtraido = "";

async function extraerTexto() {
  const file = document.getElementById("pdfInput").files[0];

  if (!file) {
    alert("Selecciona un PDF");
    return;
  }

  const fileReader = new FileReader();

  fileReader.onload = async function () {
    const typedarray = new Uint8Array(this.result);

    const pdf = await pdfjsLib.getDocument(typedarray).promise;

    textoExtraido = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      let page = await pdf.getPage(i);
      let content = await page.getTextContent();

      let strings = content.items.map(item => item.str);
      textoExtraido += strings.join(" ") + "\n";
    }

    document.getElementById("output").innerText = textoExtraido;
  };

  fileReader.readAsArrayBuffer(file);
}
function descargarTXT() {
  const blob = new Blob([textoExtraido], { type: "text/plain" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "resultado.txt";
  link.click();
}
