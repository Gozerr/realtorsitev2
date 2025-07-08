export async function geocodeAddress(address: string): Promise<{ lat: number, lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  const response = await fetch(url, { headers: { 'Accept-Language': 'ru' } });
  const data = await response.json();
  if (data && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  return null;
}

export async function getCityByIP(): Promise<string | null> {
  try {
    // 1. SypexGeo (российский, быстрый)
    const sx = await fetch('https://api.sypexgeo.net/json/');
    if (sx.ok) {
      const data = await sx.json();
      if (data && data.city && data.city.name_ru) {
        return data.city.name_ru;
      }
    }
    // 2. ip-api.com (часто работает в РФ)
    const ipapi = await fetch('http://ip-api.com/json/');
    if (ipapi.ok) {
      const data = await ipapi.json();
      if (data && data.city) {
        return data.city;
      }
    }
    // 3. ipapi.co (международный)
    const response = await fetch('https://ipapi.co/json/');
    if (response.ok) {
      const data = await response.json();
      if (data && data.city) {
        return data.city;
      }
    }
    // 4. freeipapi.com (международный)
    const response2 = await fetch('https://freeipapi.com/api/json');
    if (response2.ok) {
      const data2 = await response2.json();
      if (data2 && data2.cityName) {
        return data2.cityName;
      }
    }
    return null;
  } catch (error) {
    console.error('Ошибка определения города по IP:', error);
    return null;
  }
}