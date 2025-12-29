/**
 * Cities of Entre Ríos, Argentina
 * Sorted by population for better UX in selectors
 */

export interface City {
  name: string;
  lat: number;
  lng: number;
  population?: number;
}

export const ENTRE_RIOS_CITIES: City[] = [
  {
    name: "Paraná",
    lat: -31.7333,
    lng: -60.5294,
    population: 247863,
  },
  {
    name: "Concordia",
    lat: -31.3901,
    lng: -58.0209,
    population: 170033,
  },
  {
    name: "Gualeguaychú",
    lat: -33.0095,
    lng: -58.5173,
    population: 109461,
  },
  {
    name: "Concepción del Uruguay",
    lat: -32.4833,
    lng: -58.2333,
    population: 73606,
  },
  {
    name: "Gualeguay",
    lat: -33.1431,
    lng: -59.3086,
    population: 42082,
  },
  {
    name: "Victoria",
    lat: -32.6186,
    lng: -60.1570,
    population: 35767,
  },
  {
    name: "Chajarí",
    lat: -30.7542,
    lng: -57.9867,
    population: 33967,
  },
  {
    name: "La Paz",
    lat: -30.7408,
    lng: -59.6456,
    population: 27956,
  },
  {
    name: "Villaguay",
    lat: -31.8667,
    lng: -59.0333,
    population: 26533,
  },
  {
    name: "Colón",
    lat: -32.2206,
    lng: -58.1417,
    population: 24890,
  },
  {
    name: "Federación",
    lat: -30.9833,
    lng: -57.9000,
    population: 18967,
  },
  {
    name: "Diamante",
    lat: -32.0667,
    lng: -60.6333,
    population: 20740,
  },
  {
    name: "Crespo",
    lat: -32.0333,
    lng: -60.3000,
    population: 20134,
  },
  {
    name: "General Ramírez",
    lat: -32.1667,
    lng: -60.2000,
    population: 14428,
  },
  {
    name: "San José",
    lat: -32.2833,
    lng: -58.1500,
    population: 11318,
  },
  {
    name: "Federal",
    lat: -30.9500,
    lng: -58.7833,
    population: 10863,
  },
  {
    name: "Villa Elisa",
    lat: -32.1667,
    lng: -58.4000,
    population: 10711,
  },
  {
    name: "Nogoyá",
    lat: -32.3833,
    lng: -59.7833,
    population: 10000,
  },
  {
    name: "San Salvador",
    lat: -31.6289,
    lng: -58.5083,
    population: 9574,
  },
  {
    name: "Basavilbaso",
    lat: -32.3667,
    lng: -58.8833,
    population: 9476,
  },
];

/**
 * Default city for fallback scenarios
 */
export const DEFAULT_CITY: City = ENTRE_RIOS_CITIES[0]; // Paraná

/**
 * Find a city by name (case-insensitive)
 */
export function findCityByName(name: string): City | undefined {
  return ENTRE_RIOS_CITIES.find(
    (city) => city.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get city coordinates by name, or return default city
 */
export function getCityCoordinates(cityName?: string): { lat: number; lng: number } {
  if (!cityName) return { lat: DEFAULT_CITY.lat, lng: DEFAULT_CITY.lng };
  
  const city = findCityByName(cityName);
  return city 
    ? { lat: city.lat, lng: city.lng }
    : { lat: DEFAULT_CITY.lat, lng: DEFAULT_CITY.lng };
}
