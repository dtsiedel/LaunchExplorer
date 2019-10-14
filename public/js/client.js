var launchData;
var cesiumEntities = {};
const dateRegex = /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/;
const flyOptions = {
    duration: 2.5
};

//TODO (future): streetview embed based on lat/long

// Draw the current values in the launchData list to the viewer
function updateMapDisplay(viewer) {
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
                text: "", // no text for now, possibly add back in
                font: "8pt monospace",
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth : 2,
                verticalOrigin: Cesium.VerticalOrigin.TOP,
                pixelOffset: new Cesium.Cartesian2(0, imageDimension/2)
            }
        });
        var launchId = uuidv4();
        l.uuid = launchId;
        entity._uuid = launchId;
        cesiumEntities[launchId] = entity;
    });
}

// Return a div containing the information about this launch
function launchNode(viewer, launchElement) {
    const date = $("<div/>")
        .addClass("launchNodeDate")
        .text("Launch Window Opens: "+launchElement.timeStart);
    const name = $("<div/>")
        .addClass("launchNodeName")
        .text(launchElement.launchName);

    return $("<div/>")
            .addClass("launchNode")
            .append(date)
            .append(name)
            .click(() => select(viewer, cesiumEntities[launchElement.uuid]));;
}

// Reflect the current values in the launchData list on the display
function updateListDisplay(viewer) {
    var list = $("#launchList");
    launchData.forEach(l => {
        list.append( launchNode(viewer, l) );
    });
    list.append($("<div/>").addClass("listTrailing"));
}

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

// Return a <tr>, with three <td> elements in it, with text given by the
// two parameters. The extra td is a spacer in the middle
function selectedLaunchRow(key, value) {
    if (!value) { value = "Unknown"; }
    const keyTd = $("<td/>")
                    .addClass("tdLeft")
                    .append($("<div/>")
                                .addClass("fullSize")
                                .text(key)
                    );
    const valueTd = $("<td/>")
                    .addClass("tdRight")
                    .append($("<div/>")
                                .addClass("fullSize")
                                .text(value)
                    );
    const spacerTd = $("<td/>").addClass("tdSpacer");

    const row = $("<tr/>");
    row.append(keyTd);
    row.append(spacerTd);
    row.append(valueTd);

    return row;
}

// encapsulate logic to check for existence of video link before 
function createStreamButton(videoLink) {
    const containerDiv = $("<div/>").addClass("linkContainer");
    const spacerAbove = $("<div/>").addClass("streamSpacer");
    const spacerBelow = $("<div/>").addClass("streamSpacer");
    const linkDiv = $("<div/>").addClass("streamLink");

    if (videoLink) {
        linkDiv
            .addClass("available");
        const a = $("<a/>")
                    .text("View Launch Stream Live!")
                    .attr("target", "_blank") // open in new tab
                    .attr("href", videoLink);
        linkDiv.append(a);
    } else {
        linkDiv
            .addClass("unavailable")
            .text("Launch Stream Unavailable");
    }
    containerDiv.append(spacerAbove);
    containerDiv.append(linkDiv);
    containerDiv.append(spacerBelow);

    return containerDiv;
}

// display the given launch on the "selected viewer"
function updateSelectedDisplay(selectedLaunch) {
    var selectedDiv = $("#selectedLaunch");
    selectedDiv.empty();

    const title = $("<div/>")
                    .addClass("selectedTitle")
                    .text(selectedLaunch.launchName);
    selectedDiv.append(title);

    const table = $("<table/>")
                    .attr("id", "selectedTable");

    table.append(
        selectedLaunchRow("Pad Location: ", selectedLaunch.location)
    )
    table.append(
        selectedLaunchRow("Agency: ", selectedLaunch.agencyName)
    )
    table.append(
        selectedLaunchRow("Window Start: ", selectedLaunch.timeStart)
    )
    table.append(
        selectedLaunchRow("Window End: ", selectedLaunch.timeStop)
    )
    table.append(
        selectedLaunchRow("Mission Name: ", selectedLaunch.missionName)
    )
    table.append(
        selectedLaunchRow("Mission Type: ", selectedLaunch.missionType)
    )

    selectedDiv.append(table);

    const streamButton = createStreamButton(selectedLaunch.videoLink);
    selectedDiv.append(streamButton);
}

// Called whenever the user selects a new launch by any means. Sets the
// selectedLaunch variable and flies the Cesium viewer to the selected
// element.
function select(viewer, element) {
    if (element) {
        var selectedLaunch = lookupById(element._uuid);
        viewer.flyTo(element, flyOptions);
        updateSelectedDisplay(selectedLaunch);
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
        const pad = (location.pads.length > 0) ? location.pads[0] : {};
        const missions = launch.missions;
        const mission = (missions.length > 0) ? missions[0] : {};
        const rocket = launch.rocket;
        const agency = launch.lsp;
        return {
            lat: pad.latitude,
            long: pad.longitude,
            location: location.name,
            launchName: launch.name,
            padName: pad.name,
            rocketName: rocket.name,
            missionName: mission.name,
            missionType: mission.typeName,
            agencyName: agency.name,
            country: agency.countryCode,
            videoLink: launch.vidURLs[0],
            timeStart: new Date(launch.windowstart).toLocaleString(),
            timeStop: new Date(launch.windowend).toLocaleString(),
        };
    }).sort((a,b)=>a.timeStart-b.timeStart);

    updateMapDisplay(viewer);
    updateListDisplay(viewer);
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
