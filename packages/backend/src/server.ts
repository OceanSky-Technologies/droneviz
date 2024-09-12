import { writeFileSync } from "fs";

console.log("serverrrrr");

if (typeof window === "undefined") console.log("nodeeeee");

console.log("Start Write");
writeFileSync("C:/Users/Martin/Downloads/file.txt", "My name is John", {
  flag: "w",
});
console.log("End Write");
