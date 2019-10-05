var launchData;
var selectedLaunch;
const dateRegex = /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/;
const flyOptions = {
    duration: 2.5
};

//TODO: display list of launches, with selection
//TODO (future): streetview embed based on lat/long

// launchLibrary seems to return dates in a non-compliant version of ISO
// that javascript can't recognize. This function tries to return a Date
// object by slicing up the string. Returns null if it can't
function parseLaunchDate(dateString) {
    if (!dateString) { return null; }

    var match = dateString.match(dateRegex)
    if (!match) { return null; }
    match = match.slice(1); // drop full match, keep capture groups
    match[1] -= 1;          // month index offset :(
    return new Date(...match);
}

// UUID generator pulled from:
// https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// given a uuid of a launch, grab the info map from the launchData, returning
// null if it does not exist.
function lookupById(uuid) {
    var filtered = launchData.filter(l => {
        return l.uuid === uuid
    });
    return (filtered.length < 1) ? null : filtered[0];
}

// Called whenever the user selects a new launch by any means. Sets the
// selectedLaunch variable and flies the Cesium viewer to the selected
// element.
function select(viewer, element) {
    if (element) {
        selectedLaunch = lookupById(element._uuid);
        console.log(selectedLaunch);
        viewer.flyTo(element, flyOptions);
    } else {
        console.error("Selected element was null or undefined");
    }
}

function displayLaunches(launchRaw, viewer) {
    // extract useful information into a flat structure, and parse
    // some pieces to be more useful. Sort by date from soonest to
    // latest.
    launchData = launchRaw.launches.map(launch => {
        const location = launch.location;
        const pad = location.pads[0];
        const rocket = launch.rocket;
        return {
            lat: pad.latitude,
            long: pad.longitude,
            launchName: launch.name,
            padName: pad.name,
            rocketName: rocket.name,
            videoLink: launch.vidUrl,
            timeStart: parseLaunchDate(launch.isostart)
        };
    }).sort((a,b)=>a.timeStart-b.timeStart);

    const imageDimension = 80;
    launchData.forEach(l => {
        var entity = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(l.long, l.lat),
            billboard: {
                image: "/images/rocket.png",
                width: imageDimension,
                height: imageDimension
            },
            label: {
                text: l.rocketName,
                font: "8pt monospace",
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth : 2,
                verticalOrigin: Cesium.VerticalOrigin.TOP,
                pixelOffset: new Cesium.Cartesian2(0, imageDimension/2)
            }
        });
        var launchId = uuidv4();
        entity._uuid = launchId;
        l.uuid = launchId;
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
        select(viewer, selected);
    });
    getLaunches(viewer);
}

function getToken() {
    $.ajax({
        url: "/cesiumToken",
        success: createViz,
        error: (_, __, error) => console.error(error)
    });
}

$(document).ready(() => {
    getToken();
});
