import { updateEgoPosition } from "~/core/ego-position";

export let lastPosition: GeolocationPosition | null = null;

const options = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
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

        reject(new Error(errorMessage)); // Reject with an error
      },
      options,
    );
  });
}

export function watchHomePositionUpdates() {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      (position) => {
        lastPosition = position;
        updateEgoPosition(position);
      },
      (error) => console.error("Geolocation error: ", error),
      options,
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
  }
}
