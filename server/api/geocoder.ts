import NodeGeocoder, { type Options } from "node-geocoder";
import { setHttpHeaders } from "~/server/utils/headers";
import { defineEventHandler, getQuery } from "h3";

interface QueryInterface {
  text: string;
}

export default defineEventHandler(async (event) => {
  const query: QueryInterface = getQuery<QueryInterface>(event);

  setHttpHeaders(event);

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
