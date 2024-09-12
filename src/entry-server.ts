import { writeFileSync } from "fs";

if (typeof window === "undefined") {
  console.log("entry-server node.js");
  writeFileSync(
    "C:/Users/Martin/Downloads/entry-server.txt",
    "entry-server node.js",
    {
      flag: "w",
    },
  );
} else {
  console.log("entry-server browser");
  writeFileSync(
    "C:/Users/Martin/Downloads/entry-server.txt",
    "entry-server browser",
    {
      flag: "w",
    },
  );
}
