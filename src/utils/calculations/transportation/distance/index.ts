export async function getPostalCode(address: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );

    if (!response.ok) {
      console.error("Error en la solicitud a la API de Google Geocoding:", response.statusText);
      return null;
    }

    const data = await response.json();
    console.log("Respuesta completa de Google Geocoding API:", data);

    if (data.status === "OK") {
      const addressComponents = data.results[0].address_components;
      console.log("Componentes de dirección:", addressComponents);

      const postalCodeComponent = addressComponents.find((component: any) =>
        component.types.includes("postal_code")
      );

      if (postalCodeComponent) {
        return postalCodeComponent.long_name;
      } else {
        console.error("No se encontró el código postal en los componentes de dirección");
        return null;
      }
    } else {
      console.error("Error en la respuesta de la API de Google Geocoding:", data.status);
      return null;
    }
  } catch (error) {
    console.error("Error al obtener el código postal:", error);
    return null;
  }
}


type getDistanceResponse = {
  distance:number;
  cities: {
    departure:string;
    arrival:string;

  }
}

export async function getDistance(departureAddress: string, arrivalAddress: string): Promise<getDistanceResponse | null> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const url = `${baseUrl}/api/distance/?departure=${encodeURIComponent(departureAddress)}&arrival=${encodeURIComponent(arrivalAddress)}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        console.error("Error en la solicitud al API intermedia:", response.statusText);
        return null;
      }
  
      const data = await response.json();
      if (data.distance.rows[0].elements[0].status === "OK") {
        const distanceInMeters = data.distance.rows[0].elements[0].distance.value;
        const distanceInKm = distanceInMeters / 1000;

        return {
          distance:distanceInKm,
          cities:data.cities
        };
      } else {
        console.error("No se pudo calcular la distancia");
        return null;
      }
    } catch (error) {
      console.error("Error al obtener la distancia:", error);
      return null;
    }
  }
  