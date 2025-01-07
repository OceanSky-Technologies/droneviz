import { Attitude, GlobalPositionInt } from "mavlink-mappings/dist/lib/common";

export function equals<T>(first: T, second: T): boolean {
  if (!(first instanceof Object) || !(second instanceof Object)) {
    return false;
  }

  if (first.constructor !== second.constructor) {
    return false;
  }

  let firstCopy = { ...first };
  let secondCopy = { ...second };

  // Remove timestamp from messages
  if (first instanceof GlobalPositionInt) {
    delete (firstCopy as any).timeBootMs;
    delete (secondCopy as any).timeBootMs;
  } else if (first instanceof Attitude) {
    delete (firstCopy as any).timeBootMs;
    delete (secondCopy as any).timeBootMs;
  } else {
    throw new Error("Unsupported message type: " + first.constructor);
  }

  // Perform a deep comparison or customize the equality logic as needed
  return JSON.stringify(firstCopy) === JSON.stringify(secondCopy);
}
