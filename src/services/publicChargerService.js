import api from "./api";

// Public EV chargers (OpenStreetMap + Open Charge Map) — backend se
export const publicChargerService = {
  async getNearby({ lat, lng, radiusKm = 15 }) {
    const response = await api.get("/public-chargers", {
      params: { lat: lat.toFixed(5), lng: lng.toFixed(5), radius: Math.round(radiusKm) },
    });
    return response.data?.data || { chargers: [] };
  },
};

export default publicChargerService;
