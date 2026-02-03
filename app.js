// Centre of WR11 1TD (approx)
const centreLngLat = [-1.9467, 52.0926]; // [lng, lat]

// Create a 100m radius geofence around WR11 1TD
const geofencePolygon = turf.circle(centreLngLat, 0.1, {
  steps: 64,
  units: "kilometers"
});

const statusEl = document.getElementById("status");
const metricsEl = document.getElementById("metrics");

// Initialize Leaflet map
const map = L.map("map").setView([centreLngLat[1], centreLngLat[0]], 16);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

// Draw geofence polygon on the map
const fenceCoords = geofencePolygon.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
const fenceLayer = L.polygon(fenceCoords, {
  color: "blue",
  fillColor: "#3388ff",
  fillOpacity: 0.2
}).addTo(map);

// User marker and path
let userMarker = null;
let userPath = L.polyline([], { color: "purple", weight: 4 }).addTo(map);

// Movement metrics
let totalDistance = 0;
let lastPoint = null;

// Helper to update status text
function setStatus(msg) {
  statusEl.textContent = msg;
}

function updateMetrics() {
  metricsEl.textContent = `Distance: ${totalDistance.toFixed(1)} m`;
}

// Geolocation
if ("geolocation" in navigator) {
  navigator.geolocation.watchPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const latlng = [lat, lng];

      // Update marker
      if (!userMarker) {
        userMarker = L.marker(latlng).addTo(map);
        map.setView(latlng, 17);
      } else {
        userMarker.setLatLng(latlng);
      }

      // Update path
      userPath.addLatLng(latlng);

      // Distance calculation
      if (lastPoint) {
        const from = turf.point([lastPoint[1], lastPoint[0]]);
        const to = turf.point([lng, lat]);
        const dist = turf.distance(from, to, { units: "meters" });
        if (!isNaN(dist)) {
          totalDistance += dist;
          updateMetrics();
        }
      }
      lastPoint = [lat, lng];

      // Geofence check
      const userPoint = turf.point([lng, lat]);
      const inside = turf.booleanPointInPolygon(userPoint, geofencePolygon);

      if (inside) {
        fenceLayer.setStyle({ color: "green", fillColor: "#3cb371" });
        setStatus("You are INSIDE the WR11 1TD geofence.");
      } else {
        fenceLayer.setStyle({ color: "red", fillColor: "#ff6347" });
        setStatus("You are OUTSIDE the WR11 1TD geofence.");
      }

      console.log(`Moved to: ${lat}, ${lng} at ${new Date().toLocaleTimeString()}`);
    },
    (err) => {
      console.error(err);
      setStatus("Unable to get your location: " + err.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 20000
    }
  );
} else {
  setStatus("Geolocation is not supported in this browser.");
}
