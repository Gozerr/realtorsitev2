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
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    if (data && data.city) {
      return data.city;
    }
    return null;
  } catch (error) {
    console.error('Ошибка определения города по IP:', error);
    return null;
  }
}