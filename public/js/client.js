var selectedLaunch;
const flyOptions = {
    duration: 1.5
};

function displayLaunches(launchRaw, viewer) {
    const launchLocations = launchRaw.launches.map(i => {
        var location = i.location;
        var pad = location.pads[0];
        return {
            lat: pad.latitude,
            long: pad.longitude
        };
    });

    const imageDimension = 80;
    launchLocations.forEach(l => {
        viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(l.long, l.lat),
            billboard: {
                image: "/images/rocket.png",
                width: imageDimension,
                height: imageDimension
            },
            label: {
                text: `${l.lat}, ${l.long}`,
                font: "8pt monospace",
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth : 2,
                verticalOrigin: Cesium.VerticalOrigin.TOP,
                pixelOffset: new Cesium.Cartesian2(0, imageDimension/2)
            }
        });
    });
}

function getLaunches(viewer) {
    $.ajax({
        url: "/launches",
        headers: {Accept: "application/json"},
        success: data => displayLaunches(data, viewer)
    });
}

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
    viewer.selectedEntityChanged.addEventListener((selected) => {
        selectedLaunch = selected;
        viewer.flyTo(selectedLaunch, flyOptions);
    });
    getLaunches(viewer);
}

function getToken() {
    $.ajax({
        url: "/cesiumToken",
        success: createViz,
        error: (_, __, error) => console.log(error)
    });
}

$(document).ready(() => {
    getToken();
});
