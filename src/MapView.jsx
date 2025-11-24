import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Standard McDonald's Marker (roter Pin)
const icon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [32, 32],
});

function MapView({ restaurants, ratings }) {
  const center = [51.1657, 10.4515]; // Deutschland Mitte

  // Alle Restaurants + deren Durchschnitt
  const items = restaurants
    .map((r) => {
      const rRatings = ratings.filter((x) => x.restaurant_id === r.id);
      const avg =
        rRatings.length > 0
          ? rRatings.reduce((s, x) => s + x.stars, 0) / rRatings.length
          : null;

      return { ...r, avg, count: rRatings.length };
    })
    .filter(Boolean);

  return (
    <div style={{ height: "80vh", width: "100%" }}>
      <MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {items.map((r) => (
          <Marker
            key={r.id}
            icon={icon}
            position={[r.lat, r.lng]}
          >
            <Popup>
              <b>{r.name}</b>
              <br />
              {r.avg ? `⭐ ${r.avg.toFixed(1)} / 5 (${r.count})` : "Noch keine Bewertungen"}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MapView;
