const video = document.getElementById("video");

async function iniciarCamara() {

    try {

        const stream = await navigator.mediaDevices.getUserMedia({
    video: {
        facingMode: "environment"
    }
});

        video.srcObject = stream;

        await video.play();

        console.log("Cámara iniciada");

    } catch (error) {

        console.error(error);

        alert("No fue posible acceder a la cámara.");

    }

}

iniciarCamara();
