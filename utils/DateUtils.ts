export function getFormattedDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Get the month and pad it to two digits
  const day = String(now.getDate()).padStart(2, "0"); // Get the day and pad it to two digits
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

  return `${year}-${month}-${day}_${hours}:${minutes}:${seconds}:${milliseconds}`;
}
