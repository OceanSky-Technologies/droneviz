import NodeGeocoder, { type Options } from "node-geocoder";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const options = {
    provider: "openstreetmap",
    headers: {
      "User-Agent": "Droneviz",
    },
  };

  const geocoder = NodeGeocoder(options as Options);

  if (typeof query.text !== "string") {
    throw new Error("Invalid query parameter");
  }

  return await geocoder.geocode(query.text);
});
