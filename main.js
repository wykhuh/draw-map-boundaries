import * as L from "leaflet";

import {
  TerraDraw,
  TerraDrawCircleMode,
  TerraDrawPolygonMode,
  TerraDrawFreehandMode,
  TerraDrawRectangleMode,
  TerraDrawLeafletAdapter,
} from "terra-draw";

import rewind from "@mapbox/geojson-rewind";

const addModeChangeHandler = (draw, currentSelected) => {
  [
    "polygon",
    // "freehand",
    "circle",
    "rectangle",
  ].forEach((mode) => {
    let modeEl = document.getElementById(mode);
    if (!modeEl) return;
    modeEl.addEventListener("click", () => {
      currentSelected.mode = mode;
      draw.setMode(currentSelected.mode);

      if (currentSelected.button) {
        currentSelected.button.style.color = "565656";
      }
      currentSelected.button = document.getElementById(mode);
      currentSelected.button.style.color = "#27ccff";
    });
  });

  const clearEl = document.getElementById("clear");
  if (clearEl) {
    clearEl.addEventListener("click", () => {
      draw.clear();

      let geojsonEl = document.querySelector(".geojson-container");
      if (geojsonEl) {
        geojsonEl.innerHTML = "";
      }
    });
  }
};

const getModes = () => {
  return [
    new TerraDrawPolygonMode({
      snapping: true,
      allowSelfIntersections: false,
    }),
    new TerraDrawRectangleMode(),
    new TerraDrawCircleMode(),
    new TerraDrawFreehandMode(),
  ];
};

let currentSelected = {
  button: undefined,
  mode: "static",
};

let userGeoJSON = {};

const example = {
  geojson: {},
  lng: -118.289,
  lat: 34.017,
  zoom: 13,
  initLeaflet(id) {
    const { lng, lat, zoom } = this;

    const map = L.map(id, {
      center: [lat, lng],
      zoom: zoom + 1, // starting zoom
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const draw = new TerraDraw({
      adapter: new TerraDrawLeafletAdapter({
        lib: L,
        map,
        coordinatePrecision: 9,
      }),
      modes: getModes(),
    });

    draw.start();
    draw.on("finish", (ids, type, a) => {
      const snapshot = draw.getSnapshot();
      userGeoJSON = formatGeojson(snapshot);
      let geojsonEl = document.querySelector(".geojson-container");
      if (geojsonEl) {
        geojsonEl.innerHTML = "";
        geojsonEl.innerHTML = JSON.stringify(formatGeojson(snapshot), null, 2);
      }
    });

    addModeChangeHandler(draw, currentSelected);
  },
};

example.initLeaflet("leaflet-map");

function formatGeojson(items) {
  const features = items.map((item) => {
    return {
      ...item,
      properties: { mode: item.properties.mode },
    };
  });
  let json = {
    type: "FeatureCollection",
    features,
  };

  // https://gis.stackexchange.com/questions/259944/polygons-and-multipolygons-should-follow-the-right-hand-rule
  return rewind(json, false);
}

const downloadEl = document.querySelector(".download");
if (downloadEl) {
  downloadEl.addEventListener("click", () =>
    downloadJSON(userGeoJSON, "boundaries.geojson")
  );
}

function downloadJSON(json, filename) {
  // Turn the JSON object into a string
  const data = JSON.stringify(json, null, 4);

  // Pass the string to a Blob and turn it
  // into an ObjectURL
  const blob = new Blob([data], { type: "text/plain" });
  const jsonObjectUrl = URL.createObjectURL(blob);

  // Create an anchor element, set it's
  // href to be the Object URL we have created
  // and set the download property to be the file name
  // we want to set
  const anchorEl = document.createElement("a");
  anchorEl.href = jsonObjectUrl;
  anchorEl.download = filename;

  // There is no need to actually attach the DOM
  // element but we do need to click on it
  anchorEl.click();

  // We don't want to keep a reference to the file
  // any longer so we release it manually
  URL.revokeObjectURL(jsonObjectUrl);
}
