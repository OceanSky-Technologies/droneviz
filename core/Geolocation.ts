import { updateEgoPosition } from "~/core/EgoPosition";

export let lastPosition: GeolocationPosition | null = null;

const options = {
  enableHighAccuracy: true,
  timeout: 30000,
  maximumAge: 30000,
};

/**
 * Returns a promise to the browser geolocation.
 */
export function getGeolocationAsync(): Promise<GeolocationPosition> {
  if (!navigator.geolocation) {
    throw new Error("Geolocation not supported");
  }

  return new Promise((resolve, reject) => {
    if (lastPosition) return resolve(lastPosition);

    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        console.log("Position fetched:", position);
        lastPosition = position;

        resolve(position);
      },
      (error: GeolocationPositionError) => {
        const errorMessage =
          "Couldn't get your location. Please enable location services and make sure you're connected to the internet. Error: " +
          error.message;

        if (lastPosition) {
          resolve(lastPosition);
          return;
        }

        reject(new Error(errorMessage)); // Reject with an error
      },
      options,
    );
  });
}

export function watchHomePositionUpdates() {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      async (position) => {
        lastPosition = position;
        await updateEgoPosition(position);
      },
      (error) => console.error("Geolocation error: ", error),
      options,
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
  }
}
