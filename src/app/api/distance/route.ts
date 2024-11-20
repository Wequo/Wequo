// src/app/api/distance/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const departure = searchParams.get('departure');
  const arrival = searchParams.get('arrival');

  if (!departure || !arrival) {
    return NextResponse.json(
      { error: 'Parámetros de dirección requeridos' },
      { status: 400 }
    );
  }

  console.log('salida', departure);
  console.log('llegada', arrival);

  try {
    // Función para obtener información geocodificada
    async function geocodeLocation(location: string): Promise<{
      coordinates: string | null;
      city: string | null;
    }> {
      const geocodeResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          location
        )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );

      if (!geocodeResponse.ok) {
        throw new Error(`Error de Geocoding API: ${geocodeResponse.status}`);
      }

      const geocodeData = await geocodeResponse.json();

      if (
        geocodeData.results &&
        geocodeData.results.length > 0 &&
        geocodeData.results[0].geometry
      ) {
        const { lat, lng } = geocodeData.results[0].geometry.location;
        const addressComponents = geocodeData.results[0].address_components;

        // Extraer el nombre de la ciudad
        const cityComponent = addressComponents.find((component: any) =>
          component.types.includes('locality')
        );
        const city = cityComponent ? cityComponent.long_name : null;

        return { coordinates: `${lat},${lng}`, city };
      }

      return { coordinates: null, city: null };
    }

    // Geocodificar las ubicaciones
    const departureData = await geocodeLocation(departure);
    const arrivalData = await geocodeLocation(arrival);

    if (!departureData.coordinates || !arrivalData.coordinates) {
      return NextResponse.json(
        { error: 'No se pudieron resolver las ubicaciones.' },
        { status: 400 }
      );
    }

    console.log('Coordenadas de salida', departureData.coordinates);
    console.log('Ciudad de salida', departureData.city);
    console.log('Coordenadas de llegada', arrivalData.coordinates);
    console.log('Ciudad de llegada', arrivalData.city);

    // Realizar la solicitud a Distance Matrix
    const distanceResponse = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${encodeURIComponent(
        departureData.coordinates
      )}&destinations=${encodeURIComponent(
        arrivalData.coordinates
      )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );

    if (!distanceResponse.ok) {
      throw new Error(`Error de Google Distance Matrix API: ${distanceResponse.status}`);
    }

    const distanceData = await distanceResponse.json();

    console.log('respuesta final', JSON.stringify(distanceData.rows));

    // Devolver la distancia junto con las ciudades resueltas
    return NextResponse.json({
      distance: distanceData,
      cities: {
        departure: departureData.city,
        arrival: arrivalData.city,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
