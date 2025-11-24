import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// Beispiel-McDonald's-Filialen in DE (kannst du erweitern)
const RESTAURANTS = [
  // Augsburg
  { id: 1, name: "McDonald's Augsburg City", city: "Augsburg", lat: 48.36686, lng: 10.89804 },
  { id: 2, name: "McDonald's Augsburg B17", city: "Augsburg", lat: 48.35379, lng: 10.85483 },
  // München
  { id: 3, name: "McDonald's München Marienplatz", city: "München", lat: 48.13736, lng: 11.57549 },
  { id: 4, name: "McDonald's München HBF", city: "München", lat: 48.14023, lng: 11.55857 },
  // Hamburg
  { id: 5, name: "McDonald's Hamburg HBF", city: "Hamburg", lat: 53.55265, lng: 10.0069 },
  { id: 6, name: "McDonald's Hamburg Mönckebergstraße", city: "Hamburg", lat: 53.55047, lng: 10.00134 },
  // Berlin
  { id: 7, name: "McDonald's Berlin Alexanderplatz", city: "Berlin", lat: 52.52192, lng: 13.41321 },
  { id: 8, name: "McDonald's Berlin HBF", city: "Berlin", lat: 52.52508, lng: 13.36941 },
  // Köln
  { id: 9, name: "McDonald's Köln Dom", city: "Köln", lat: 50.9413, lng: 6.9583 },
  // Frankfurt
  { id: 10, name: "McDonald's Frankfurt Zeil", city: "Frankfurt", lat: 50.11552, lng: 8.68341 },
];

// Entfernung in km (Haversine)
function distanceInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ⭐ Sterne-Komponente
function StarRating({ value, onChange }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {stars.map((star) => (
        <span
          key={star}
          onClick={() => onChange(star)}
          style={{
            cursor: "pointer",
            fontSize: 22,
            color: star <= value ? "#f5b000" : "#d3d3d3",
            userSelect: "none",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function sauceLabel(value) {
  if (value <= 2) return "zu wenig";
  if (value === 3) return "perfekt";
  return "zu viel";
}

function App() {
  const [view, setView] = useState("home"); // "home" | "rate"
  const [location, setLocation] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    consistency: "cremig",
    stars: 4,
    hasChoco: false,
    sauceAmount: 3,
    comment: "",
    photos: [],
  });

  // Ratings beim Start laden
  useEffect(() => {
    const loadRatings = async () => {
      setLoadingRatings(true);
      const { data, error } = await supabase
        .from("ratings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fehler beim Laden der Ratings:", error);
      } else if (data) {
        const mapped = data.map((row) => ({
          id: row.id,
          restaurantId: row.restaurant_id,
          consistency: row.consistency,
          stars: row.stars,
          hasChoco: row.has_choco,
          sauceAmount: row.sauce_amount,
          comment: row.comment || "",
          createdAt: row.created_at,
          photos: [],
        }));
        setRatings(mapped);
      }
      setLoadingRatings(false);
    };

    loadRatings();
  }, []);

  function handleGetLocation() {
    if (!navigator.geolocation) {
      alert("Dein Browser unterstützt keine Standortabfrage.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng });
      },
      () => {
        alert("Konnte Standort nicht abrufen.");
      }
    );
  }

  function handleCommentChange(e) {
    setForm((prev) => ({ ...prev, comment: e.target.value }));
  }
  function handleConsistencyChange(value) {
    setForm((prev) => ({ ...prev, consistency: value }));
  }
  function handleHasChocoChange(e) {
    setForm((prev) => ({ ...prev, hasChoco: e.target.checked }));
  }
  function handleSauceChange(e) {
    setForm((prev) => ({ ...prev, sauceAmount: Number(e.target.value) }));
  }
  function handleStarsChange(value) {
    setForm((prev) => ({ ...prev, stars: value }));
  }
  function handlePhotoChange(e) {
    const files = Array.from(e.target.files || []);
    const urls = files.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setForm((prev) => ({ ...prev, photos: urls }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedRestaurant) {
      alert("Bitte zuerst eine McDonald's-Filiale auswählen.");
      return;
    }

    setSaving(true);

    const payload = {
      restaurant_id: selectedRestaurant.id,
      consistency: form.consistency,
      stars: form.stars,
      has_choco: form.hasChoco,
      sauce_amount: form.sauceAmount,
      comment: form.comment,
    };

    const { data, error } = await supabase
      .from("ratings")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Supabase-Fehler:", error);
      alert("Bewertung konnte nicht gespeichert werden." + error.message);
      setSaving(false);
      return;
    }

    const newRating = {
      id: data.id,
      restaurantId: data.restaurant_id,
      consistency: data.consistency,
      stars: data.stars,
      hasChoco: data.has_choco,
      sauceAmount: data.sauce_amount,
      comment: data.comment || "",
      createdAt: data.created_at,
      photos: form.photos,
    };

    setRatings((prev) => [newRating, ...prev]);
    setForm((prev) => ({ ...prev, comment: "", photos: [] }));
    setSaving(false);
  }

  const ratingsForSelected = selectedRestaurant
    ? ratings.filter((r) => r.restaurantId === selectedRestaurant.id)
    : [];

  const averageScoreForSelected =
    ratingsForSelected.length > 0
      ? (
          ratingsForSelected.reduce((sum, r) => sum + r.stars, 0) /
          ratingsForSelected.length
        ).toFixed(1)
      : null;

  const restaurantsWithDistance = location
    ? RESTAURANTS.map((r) => ({
        ...r,
        distance: distanceInKm(location.lat, location.lng, r.lat, r.lng),
      })).sort((a, b) => a.distance - b.distance)
    : RESTAURANTS;

  const filteredRestaurants = restaurantsWithDistance.filter((r) =>
    (r.name + " " + r.city).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const restaurantRatingsMap = RESTAURANTS.map((rest) => {
    const rRatings = ratings.filter((r) => r.restaurantId === rest.id);
    const avg =
      rRatings.length > 0
        ? rRatings.reduce((sum, rr) => sum + rr.stars, 0) / rRatings.length
        : null;
    return { ...rest, averageStars: avg };
  })
    .filter((r) => r.averageStars != null)
    .sort((a, b) => b.averageStars - a.averageStars)
    .slice(0, 3);

  // ---------- UI-Teile ----------

  function renderNav() {
    return (
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 26 }}>🍦</span>
          <span style={{ fontWeight: 700, fontSize: 20 }}>McFlurry-Rating</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setView("home")}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: view === "home" ? "#4c6fff" : "#ecefff",
              color: view === "home" ? "#fff" : "#333",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Home
          </button>
          <button
            onClick={() => setView("rate")}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: view === "rate" ? "#4c6fff" : "#ecefff",
              color: view === "rate" ? "#fff" : "#333",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Bewerten
          </button>
        </div>
      </nav>
    );
  }

  function renderHome() {
    return (
      <>
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 24,
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 34,
                marginBottom: 8,
              }}
            >
              Finde den besten McFlurry in deiner Stadt.
            </h1>
            <p style={{ fontSize: 16, color: "#555", marginBottom: 16 }}>
              Bewerte Konsistenz, Schoko-Level und Soße für jede McDonald&apos;s-Filiale
              und sieh, welche Stores die heißesten McFlurry-Hypes haben.
            </p>
            <button
              onClick={() => setView("rate")}
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                border: "none",
                background:
                  "linear-gradient(135deg, #ffcc00 0%, #ff9900 100%)",
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Jetzt bewerten 🚀
            </button>
          </div>
          <div
            style={{
              background:
                "radial-gradient(circle at top, #ffe9a3, #ffd1ef 40%, #c7d3ff 80%)",
              borderRadius: 24,
              padding: 20,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 50, marginBottom: 8 }}>🍦</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
              Dein McFlurry, dein Urteil.
            </div>
            <div style={{ fontSize: 13, color: "#444" }}>
              Teile deine Meinung zu cremig vs. eisig, zu viel vs. perfekt
              Soße und Schoko-Vibes.
            </div>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>🔥 Hottakes</h2>
          {restaurantRatingsMap.length === 0 ? (
            <p style={{ fontSize: 14, color: "#666" }}>
              Noch keine Hottakes – starte mit der ersten Bewertung.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              {restaurantRatingsMap.map((r) => (
                <div
                  key={r.id}
                  style={{
                    flex: "1 1 220px",
                    borderRadius: 12,
                    padding: 12,
                    background: "#f8fafc",
                    border: "1px solid #e0e7ff",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setSelectedRestaurant(r);
                    setView("rate");
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: 4,
                      fontSize: 14,
                    }}
                  >
                    {r.name}
                  </div>
                  <div style={{ fontSize: 13, color: "#555" }}>
                    {r.city} · ⭐ {r.averageStars.toFixed(1)}/5
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </>
    );
  }

  function renderRate() {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1.6fr",
          gap: 24,
        }}
      >
        {/* Linke Seite: Standort + Liste */}
        <section>
          <button
            onClick={handleGetLocation}
            style={{
              padding: "10px 18px",
              fontSize: 15,
              cursor: "pointer",
              marginBottom: 12,
              borderRadius: 999,
              border: "none",
              background: "linear-gradient(135deg, #ffcc00 0%, #ff9900 100%)",
              color: "#222",
              fontWeight: 600,
            }}
          >
            📍 Standort verwenden
          </button>

          {location && (
            <div
              style={{
                background: "#f7fafc",
                padding: 10,
                borderRadius: 12,
                fontSize: 13,
                marginBottom: 14,
              }}
            >
              <strong>Dein Standort:</strong>
              <div>Breite: {location.lat.toFixed(5)}</div>
              <div>Länge: {location.lng.toFixed(5)}</div>
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, color: "#555" }}>
              McDonald&apos;s suchen:
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="z. B. München, Hamburg, Augsburg…"
              style={{
                width: "100%",
                marginTop: 4,
                padding: 8,
                borderRadius: 999,
                border: "1px solid #d0d7e2",
                fontSize: 13,
              }}
            />
          </div>

          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            McDonald&apos;s-Stores
          </h2>
          <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
            {filteredRestaurants.length === 0 ? (
              <li style={{ fontSize: 13, color: "#777" }}>
                Keine Filiale gefunden.
              </li>
            ) : (
              filteredRestaurants.map((rest) => (
                <li
                  key={rest.id}
                  onClick={() => setSelectedRestaurant(rest)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    marginBottom: 8,
                    cursor: "pointer",
                    background:
                      selectedRestaurant?.id === rest.id ? "#e6f0ff" : "#f7f7f7",
                    border:
                      selectedRestaurant?.id === rest.id
                        ? "1px solid #4c6fff"
                        : "1px solid #e0e0e0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 14,
                  }}
                >
                  <span>
                    {rest.name}
                    <span style={{ color: "#777", fontSize: 12 }}>
                      {" "}
                      · {rest.city}
                    </span>
                  </span>
                  {location && rest.distance != null && (
                    <span style={{ color: "#555", fontSize: 13 }}>
                      {rest.distance.toFixed(1)} km
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        </section>

        {/* Rechte Seite: Detail + Bewertung */}
        <section>
          {!selectedRestaurant && (
            <p style={{ color: "#666", marginTop: 8 }}>
              Wähle links eine McDonald&apos;s-Filiale aus, um McFlurrys zu
              bewerten.
            </p>
          )}

          {selectedRestaurant && (
            <div>
              <h2 style={{ fontSize: 20, marginBottom: 6 }}>
                {selectedRestaurant.name}
              </h2>

              {averageScoreForSelected ? (
                <p style={{ marginBottom: 12 }}>
                  ⭐ Durchschnittliche McFlurry-Bewertung:{" "}
                  <b>{averageScoreForSelected}/5</b>
                </p>
              ) : (
                <p style={{ marginBottom: 12, color: "#666" }}>
                  Noch keine Bewertungen für McFlurry hier.
                </p>
              )}

              <div
                style={{
                  background: "#f8fafc",
                  padding: 14,
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>
                  Bewertung abgeben
                </h3>
                <form onSubmit={handleSubmit}>
                  {/* Konsistenz */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 14, marginBottom: 4 }}>
                      Konsistenz:
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {["eisig", "cremig", "weich"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleConsistencyChange(c)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 999,
                            border:
                              form.consistency === c
                                ? "1px solid #4c6fff"
                                : "1px solid #d0d7e2",
                            background:
                              form.consistency === c ? "#e6f0ff" : "#ffffff",
                            cursor: "pointer",
                            fontSize: 13,
                            textTransform: "capitalize",
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sterne */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 14, marginBottom: 4 }}>
                      Sternebewertung:
                    </div>
                    <StarRating
                      value={form.stars}
                      onChange={handleStarsChange}
                    />
                  </div>

                  {/* Schoko */}
                  <div style={{ marginBottom: 10, fontSize: 14 }}>
                    <label style={{ display: "flex", alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={form.hasChoco}
                        onChange={handleHasChocoChange}
                        style={{ marginRight: 6 }}
                      />
                      Es gab Schoko-McFlurry
                    </label>
                  </div>

                  {/* Soße */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 14, marginBottom: 4 }}>
                      Soßenmenge: <b>{sauceLabel(form.sauceAmount)}</b>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={form.sauceAmount}
                      onChange={handleSauceChange}
                      style={{ width: "100%" }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 11,
                        color: "#777",
                        marginTop: 2,
                      }}
                    >
                      <span>zu wenig</span>
                      <span>perfekt</span>
                      <span>zu viel</span>
                    </div>
                  </div>

                  {/* Kommentar */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 14, marginBottom: 4 }}>
                      Kommentar:
                    </div>
                    <textarea
                      value={form.comment}
                      onChange={handleCommentChange}
                      rows="3"
                      style={{
                        width: "100%",
                        padding: 8,
                        borderRadius: 8,
                        border: "1px solid #d0d7e2",
                        fontSize: 13,
                      }}
                      placeholder="Wie war dein McFlurry insgesamt?"
                    />
                  </div>

                  {/* Fotos (nur lokal) */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 14, marginBottom: 4 }}>
                      Fotos hochladen:
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
                      style={{ fontSize: 13 }}
                    />
                    {form.photos.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          marginTop: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        {form.photos.map((p, idx) => (
                          <img
                            key={idx}
                            src={p.url}
                            alt={p.name}
                            style={{
                              width: 70,
                              height: 70,
                              objectFit: "cover",
                              borderRadius: 8,
                              border: "1px solid #d0d7e2",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: "8px 16px",
                      fontSize: 14,
                      cursor: "pointer",
                      borderRadius: 999,
                      border: "none",
                      background: saving ? "#9aa5ff" : "#4c6fff",
                      color: "#fff",
                      fontWeight: 600,
                    }}
                  >
                    {saving ? "Speichere..." : "Bewertung speichern"}
                  </button>
                </form>
              </div>

              {/* Bewertungen */}
              <div>
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>Bewertungen</h3>
                {ratingsForSelected.length === 0 ? (
                  <p style={{ color: "#666" }}>Noch keine Bewertungen.</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {ratingsForSelected.map((r) => (
                      <li
                        key={r.id}
                        style={{
                          marginBottom: 10,
                          padding: 10,
                          borderRadius: 10,
                          background: "#f7f7f7",
                          fontSize: 13,
                        }}
                      >
                        <div style={{ marginBottom: 4 }}>
                          ⭐ {r.stars.toFixed(1)}/5 · Konsistenz:{" "}
                          {r.consistency}
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          Soße: {sauceLabel(r.sauceAmount)} ·{" "}
                          {r.hasChoco
                            ? "mit Schoko-McFlurry"
                            : "ohne Schoko-McFlurry"}
                        </div>
                        {r.comment && (
                          <div style={{ fontStyle: "italic" }}>
                            „{r.comment}“
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f4f5fb 0%, #fef6ff 40%, #f0f4ff 100%)",
        padding: "30px 16px",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
        }}
      >
        {renderNav()}
        {loadingRatings && (
          <p style={{ fontSize: 13, color: "#777" }}>
            Lade Bewertungen aus der Datenbank…
          </p>
        )}
        {view === "home" ? renderHome() : renderRate()}
      </div>
    </div>
  );
}

export default App;
