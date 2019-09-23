function createViz(token) {
    Cesium.Ion.defaultAccessToken = token;
    var viewer = new Cesium.Viewer('cesiumContainer', {
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        vrButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        shouldAnimate: false
    });
}

function getToken() {
    $.ajax({
        url: "/cesiumToken",
        success: createViz,
        error: (xhr, status, error) => console.log(error)
    });
}

$(document).ready(() => getToken());
