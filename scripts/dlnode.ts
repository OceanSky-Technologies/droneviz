import https from "https";
import {
  createWriteStream,
  createReadStream,
  promises as fs,
  existsSync,
} from "fs";
import { URL } from "whatwg-url";
import path from "path";
import unzipper from "unzipper";
import zlib from "zlib";
import tar from "tar";
import { rimraf } from "rimraf";

const nodeVersion = "v23.0.0";

const outputDir = path.join(import.meta.dirname, "../.tauri-build/node");
const extractDir = path.join(outputDir, "tmp");

const nodeDownloads = [
  {
    url: `https://nodejs.org/dist/${nodeVersion}/node-${nodeVersion}-win-x64.zip`,
    name: "droneviz-node-x86_64-pc-windows-msvc.exe",
  },
  {
    url: `https://nodejs.org/dist/${nodeVersion}/node-${nodeVersion}-win-arm64.zip`,
    name: "droneviz-node-aarch64-pc-windows-msvc.exe",
  },
  {
    url: `https://nodejs.org/dist/${nodeVersion}/node-${nodeVersion}-linux-x64.tar.gz`,
    name: "droneviz-node-x86_64-unknown-linux-gnu",
  },
  {
    url: `https://nodejs.org/dist/${nodeVersion}/node-${nodeVersion}-linux-arm64.tar.gz`,
    name: "droneviz-node-aarch64-unknown-linux-gnu",
  },
  {
    url: `https://nodejs.org/dist/${nodeVersion}/node-${nodeVersion}-darwin-x64.tar.gz`,
    name: "droneviz-node-x86_64-apple-darwin",
  },
  {
    url: `https://nodejs.org/dist/${nodeVersion}/node-${nodeVersion}-darwin-arm64.tar.gz`,
    name: "droneviz-node-aarch64-apple-darwin",
  },
];

// Utility function to download a file via https
function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download file: ${response.statusCode}`));
          return;
        }

        response.pipe(file).on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", reject);
  });
}

async function extractTarGz(filePath: string, destDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tarStream = createReadStream(filePath)
      .pipe(zlib.createGunzip()) // Unzip the .gz file
      .pipe(tar.extract({ cwd: destDir })); // Extract the tar

    tarStream.on("finish", resolve);
    tarStream.on("error", reject);
  });
}

async function extractZip(filePath: string, destDir: string) {
  const directory = await unzipper.Open.file(filePath);
  await directory.extract({ path: destDir });
}

// Function to handle the download and extraction of binaries
async function handleDownload(download: { url: string; name: string }) {
  const filename = path.basename(new URL(download.url).pathname);
  const filePath = path.join(extractDir, filename);

  // Download the file
  console.log(`Downloading Node.js from ${download.url}`);
  await downloadFile(download.url, filePath);

  // Handle extraction based on file extension
  if (filename.endsWith(".tar.gz")) {
    await extractTarGz(filePath, extractDir);
    console.log(`Extracted Node.js from ${download.url} to: ${extractDir}`);

    const outputPath = path.join(`${extractDir}/../${download.name}`);
    await fs.rename(
      `${extractDir}/${filename.substring(0, filename.length - ".tar.gz".length)}/bin/node`,
      outputPath,
    );
    console.log(`Stored node executable: ${outputPath}`);
  } else if (filename.endsWith(".zip")) {
    // const extractDir = path.join(outputDir, download.name);
    await extractZip(filePath, extractDir);
    console.log(`Extracted Node.js from ${download.url} to: ${extractDir}`);

    const outputPath = path.join(`${extractDir}/../${download.name}`);
    await fs.rename(
      `${extractDir}/${filename.substring(0, filename.length - ".zip".length)}/node.exe`,
      outputPath,
    );
    console.log(`Stored node executable: ${outputPath}`);
  } else {
    console.log(
      `Downloaded ${download.url} but it has an unknown file extension: ${filename}`,
    );
    process.exit(1);
  }
}

// Main function to loop over the downloads
async function downloadNodeBinaries() {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(extractDir, { recursive: true });

  // Create an array of promises for all download tasks
  const downloadPromises = nodeDownloads.map((download) =>
    handleDownload(download).catch((err) => {
      console.error(`Error downloading or handling ${download.name}:`, err);
    }),
  );

  // Wait for all downloads to complete
  await Promise.all(downloadPromises);

  console.log("All downloads and extractions completed.");
}

async function main() {
  if (existsSync(outputDir)) {
    console.log(`Output folder ${outputDir} exists. Nothing to do.`);
    process.exit(0);
  }

  await rimraf(outputDir); // clean up any previous failed runs
  await downloadNodeBinaries().catch((err) =>
    console.error("Error:", err.stack),
  );
  await rimraf(extractDir); // clean up the temporary extraction folder
  console.log("Finished");
  process.exit(0);
}

main();
