// This script replaces all symbolic links in a directory with their actual files or directories.
// This is necessary because tauri doesn't bundle symbolic links but symlinks exist in the .output/server/node_modules directory.
// Also, the folder ".output/server/node_modules/.nitro" is removed because it is not needed after the symlinks are replaced.
// (All symlinks point to contents of this folder).

// Once tauri supports symlinks or nitro gets an option to disable symlinks, this script can be removed.

import fs from "fs";
import path from "path";

/**
 * Recursively traverses a directory and replaces all symbolic links with their actual files or directories.
 * @param dirPath - The directory to traverse.
 */
async function replaceSymlinks(dirPath: string): Promise<void> {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isSymbolicLink()) {
      try {
        const realPath = await fs.promises.realpath(fullPath);
        const stats = await fs.promises.lstat(realPath);

        // Remove the symlink
        await fs.promises.unlink(fullPath);

        if (stats.isDirectory()) {
          // Copy directory content
          await copyDirectory(realPath, fullPath);
        } else if (stats.isFile()) {
          // Copy file
          await fs.promises.copyFile(realPath, fullPath);
        }

        console.log(`Replaced symlink: ${fullPath}`);
      } catch (error) {
        console.error(`Failed to replace symlink at ${fullPath}:`, error);
      }
    } else if (entry.isDirectory()) {
      // Recursively process subdirectories
      await replaceSymlinks(fullPath);
    }
  }
}

/**
 * Copies the content of a directory recursively.
 * @param src - The source directory.
 * @param dest - The destination directory.
 */
async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.promises.mkdir(dest, { recursive: true });
  const entries = await fs.promises.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}

// Main function to execute the script
(async () => {
  const targetDir = path.resolve(".output/server/node_modules");

  try {
    console.log(`Starting to replace symlinks in: ${targetDir}`);
    await replaceSymlinks(targetDir);
    console.log("All symlinks have been replaced successfully.");
    console.log("Removing .nitro directory");
    await fs.promises.rm(targetDir + "/.nitro", { recursive: true });
  } catch (error) {
    console.error("An error occurred:", error);
  }
})();
