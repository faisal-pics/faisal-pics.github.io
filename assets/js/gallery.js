class PhotoGallery {
  constructor() {
    this.photoGrid = document.getElementById("photo-grid");
    this.categoryNav = document.getElementById("category-nav");
    this.modal = document.getElementById("photo-modal");
    this.modalImg = document.getElementById("modal-img");
    this.closeModal = document.querySelector(".close-modal");
    this.currentCategory = "all";
    this.photos = [];
    this.repoOwner = "faisal-pics";
    this.repoName = "faisal-pics.github.io";

    this.initializeEventListeners();
    this.scanPhotosDirectory();
  }

  initializeEventListeners() {
    // Modal close button
    this.closeModal.addEventListener("click", () => {
      this.modal.classList.remove("active");
    });

    // Close modal when clicking outside the image
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.modal.classList.remove("active");
      }
    });

    // Close modal with escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.modal.classList.remove("active");
      }
    });
  }

  async scanPhotosDirectory() {
    try {
      // First, get the photos directory contents
      const photosDir = await this.getDirectoryContents("photos");
      if (!photosDir) throw new Error("Photos directory not found");

      // Get contents of each category directory
      const categories = new Set(["all"]);
      this.photos = [];

      for (const item of photosDir) {
        if (item.type === "dir") {
          categories.add(item.name);
          const categoryContents = await this.getDirectoryContents(
            `photos/${item.name}`
          );

          // Add all images from this category
          for (const file of categoryContents) {
            if (this.isImageFile(file.name)) {
              this.photos.push({
                path: `photos/${item.name}/${file.name}`,
                category: item.name,
                filename: file.name,
              });
            }
          }
        } else if (this.isImageFile(item.name)) {
          // Handle images directly in photos directory
          this.photos.push({
            path: `photos/${item.name}`,
            category: "uncategorized",
            filename: item.name,
          });
          categories.add("uncategorized");
        }
      }

      this.createCategoryButtons(Array.from(categories));
      this.displayPhotos();
    } catch (error) {
      console.error("Error scanning photos:", error);
      this.photoGrid.innerHTML = `<div class="loading">Error loading photos: ${error.message}</div>`;
    }
  }

  async getDirectoryContents(path) {
    const apiUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${path}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
    }
    return await response.json();
  }

  isImageFile(filename) {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
  }

  createCategoryButtons(categories) {
    categories.sort((a, b) =>
      a === "all" ? -1 : b === "all" ? 1 : a.localeCompare(b)
    );

    const buttons = categories.map((category) => {
      const button = document.createElement("button");
      button.className = "category-btn" + (category === "all" ? " active" : "");
      button.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      button.addEventListener("click", () => this.filterByCategory(category));
      return button;
    });

    this.categoryNav.append(...buttons);
  }

  filterByCategory(category) {
    this.currentCategory = category;
    document.querySelectorAll(".category-btn").forEach((btn) => {
      btn.classList.toggle(
        "active",
        btn.textContent.toLowerCase() === category
      );
    });
    this.displayPhotos();
  }

  displayPhotos() {
    const filteredPhotos =
      this.currentCategory === "all"
        ? this.photos
        : this.photos.filter(
            (photo) => photo.category === this.currentCategory
          );

    this.photoGrid.innerHTML = "";

    if (filteredPhotos.length === 0) {
      this.photoGrid.innerHTML =
        '<div class="loading">No photos found in this category</div>';
      return;
    }

    filteredPhotos.forEach((photo) => {
      const photoItem = document.createElement("div");
      photoItem.className = "photo-item";

      const img = document.createElement("img");
      img.src = photo.path;
      img.alt = photo.filename;
      img.loading = "lazy";

      photoItem.appendChild(img);
      photoItem.addEventListener("click", () => this.showModal(photo.path));

      this.photoGrid.appendChild(photoItem);
    });
  }

  showModal(imagePath) {
    this.modalImg.src = imagePath;
    this.modal.classList.add("active");
  }
}

// Initialize the gallery when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PhotoGallery();
});
