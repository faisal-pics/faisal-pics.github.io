const fs = require("fs");
const path = require("path");
const piexif = require("piexifjs");
const sharp = require("sharp");
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
  return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
};

// Process JPEG with EXIF removal
const processJpeg = async (filePath) => {
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
    const newJpeg = Buffer.from(newData, "binary");

    // Compress with sharp
    await sharp(newJpeg)
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile(`${filePath}.tmp`);

    // Replace original with compressed version
    fs.renameSync(`${filePath}.tmp`, filePath);
    return true;
  } catch (error) {
    console.error(`Error processing JPEG ${filePath}:`, error);
    return false;
  }
};

// Process other image formats with just compression
const processOtherImage = async (filePath) => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const image = sharp(filePath);

    switch (ext) {
      case ".png":
        await image
          .png({ quality: 85, compressionLevel: 9 })
          .toFile(`${filePath}.tmp`);
        break;
      case ".webp":
        await image.webp({ quality: 85 }).toFile(`${filePath}.tmp`);
        break;
      default:
        return false;
    }

    // Replace original with compressed version
    fs.renameSync(`${filePath}.tmp`, filePath);
    return true;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
};

// Process a single image
const processImage = async (filePath) => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    let success;

    // Get original file size
    const originalSize = fs.statSync(filePath).size;

    // Process based on file type
    if ([".jpg", ".jpeg"].includes(ext)) {
      success = await processJpeg(filePath);
    } else {
      success = await processOtherImage(filePath);
    }

    if (success) {
      // Get new file size
      const newSize = fs.statSync(filePath).size;
      const reduction = (
        ((originalSize - newSize) / originalSize) *
        100
      ).toFixed(1);

      // Re-stage the file
      execSync(`git add "${filePath}"`);
      console.log(`✓ Processed ${filePath} (${reduction}% smaller)`);
    }

    return success;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
};

// Main function
const main = async () => {
  const stagedFiles = getStagedFiles();
  const imageFiles = stagedFiles.filter(isImage);

  if (imageFiles.length === 0) {
    console.log("No images to process");
    process.exit(0);
  }

  console.log("Processing images...");
  const results = await Promise.all(imageFiles.map(processImage));

  if (results.some((result) => !result)) {
    console.error("Failed to process some images");
    process.exit(1);
  }

  console.log("Successfully processed all images");
  process.exit(0);
};

main();
