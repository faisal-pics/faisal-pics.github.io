const fs = require("fs");
const path = require("path");
const piexif = require("piexifjs");
const { execSync } = require("child_process");

// Get staged files
const getStagedFiles = () => {
  try {
    const result = execSync(
      "git diff --cached --name-only --diff-filter=ACM"
    ).toString();
    return result.split("\n").filter((file) => file);
  } catch (error) {
    console.error("Error getting staged files:", error);
    return [];
  }
};

// Check if file is an image
const isImage = (file) => {
  const ext = path.extname(file).toLowerCase();
  return [".jpg", ".jpeg"].includes(ext); // piexifjs only supports JPEG images
};

// Remove EXIF data from an image
const removeExif = (filePath) => {
  try {
    // Read the image file
    const jpeg = fs.readFileSync(filePath);
    const data = jpeg.toString("binary");

    // Remove all EXIF data
    const zeroth = {};
    const exif = {};
    const gps = {};
    const first = {};
    const ifd = {
      "0th": zeroth,
      Exif: exif,
      GPS: gps,
      "1st": first,
    };

    // Create new image without EXIF
    const exifbytes = piexif.dump(ifd);
    const newData = piexif.insert(exifbytes, data);

    // Write the file back
    const newJpeg = Buffer.from(newData, "binary");
    fs.writeFileSync(filePath, newJpeg);

    // Re-stage the file
    execSync(`git add "${filePath}"`);

    console.log(`✓ Removed EXIF from: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
};

// Main function
const main = () => {
  const stagedFiles = getStagedFiles();
  const imageFiles = stagedFiles.filter(isImage);

  if (imageFiles.length === 0) {
    console.log("No JPEG images to process");
    process.exit(0);
  }

  console.log("Removing EXIF data from images...");
  const results = imageFiles.map((file) => removeExif(file));

  if (results.some((result) => !result)) {
    console.error("Failed to process some images");
    process.exit(1);
  }

  console.log("Successfully removed EXIF data from all images");
  process.exit(0);
};

main();
