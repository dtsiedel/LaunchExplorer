function createViz(token) {
    Cesium.Ion.defaultAccessToken = token;
    var viewer = new Cesium.Viewer('cesiumContainer');
}

function getToken() {
    $.ajax({
        url: "/cesiumToken",
        success: createViz,
        error: (xhr, status, error) => console.log(error)
    });
}

$(document).ready(() => getToken());
