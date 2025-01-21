class PhotoGallery {
  constructor() {
    this.photoGrid = document.getElementById("photo-grid");
    this.categoryNav = document.getElementById("category-nav");
    this.modal = document.getElementById("photo-modal");
    this.modalImg = document.getElementById("modal-img");
    this.closeModal = document.querySelector(".close-modal");
    this.prevBtn = document.querySelector(".prev-btn");
    this.nextBtn = document.querySelector(".next-btn");
    this.modalCounter = document.querySelector(".modal-counter");
    this.loadingIndicator = document.querySelector(".loading-indicator");
    this.currentCategory = "all";
    this.currentPhotoIndex = 0;
    this.visiblePhotos = [];
    this.photos = [];
    this.repoOwner = "faisal-pics";
    this.repoName = "faisal-pics.github.io";

    this.initializeEventListeners();
    this.scanPhotosDirectory();
  }

  initializeEventListeners() {
    // Modal close button
    this.closeModal.addEventListener("click", () => this.hideModal());

    // Close modal when clicking outside the image
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.hideModal();
      }
    });

    // Navigation buttons
    this.prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showPreviousImage();
    });
    this.nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showNextImage();
    });

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (!this.modal.classList.contains("active")) return;

      switch (e.key) {
        case "Escape":
          this.hideModal();
          break;
        case "ArrowLeft":
          this.showPreviousImage();
          break;
        case "ArrowRight":
          this.showNextImage();
          break;
      }
    });

    // Image load handling
    this.modalImg.addEventListener("load", () => {
      this.loadingIndicator.classList.remove("active");
      this.modalImg.classList.add("loaded");
    });

    this.modalImg.addEventListener("error", () => {
      this.loadingIndicator.classList.remove("active");
      this.modalImg.classList.remove("loaded");
      this.modalImg.alt = "Failed to load image";
    });
  }

  showPreviousImage() {
    if (this.visiblePhotos.length <= 1) return;
    this.currentPhotoIndex =
      (this.currentPhotoIndex - 1 + this.visiblePhotos.length) %
      this.visiblePhotos.length;
    this.updateModalImage();
  }

  showNextImage() {
    if (this.visiblePhotos.length <= 1) return;
    this.currentPhotoIndex =
      (this.currentPhotoIndex + 1) % this.visiblePhotos.length;
    this.updateModalImage();
  }

  updateModalImage() {
    const photo = this.visiblePhotos[this.currentPhotoIndex];

    // Reset image state
    this.modalImg.classList.remove("loaded");
    this.loadingIndicator.classList.add("active");

    // Update image
    this.modalImg.src = photo.path;
    this.modalImg.alt = photo.filename;

    // Update counter
    this.modalCounter.textContent = `${this.currentPhotoIndex + 1} / ${
      this.visiblePhotos.length
    }`;

    // Update navigation button visibility
    this.prevBtn.style.display = this.visiblePhotos.length > 1 ? "" : "none";
    this.nextBtn.style.display = this.visiblePhotos.length > 1 ? "" : "none";
  }

  showModal(photo) {
    this.visiblePhotos =
      this.currentCategory === "all"
        ? this.photos
        : this.photos.filter((p) => p.category === this.currentCategory);

    this.currentPhotoIndex = this.visiblePhotos.findIndex(
      (p) => p.path === photo.path
    );
    document.body.style.overflow = "hidden";
    this.modal.classList.add("active");
    this.updateModalImage();
  }

  hideModal() {
    document.body.style.overflow = "";
    this.modal.classList.remove("active");
    setTimeout(() => {
      if (!this.modal.classList.contains("active")) {
        this.modalImg.src = "";
        this.modalImg.alt = "";
        this.modalImg.classList.remove("loaded");
      }
    }, 300);
  }

  async scanPhotosDirectory() {
    try {
      const photosDir = await this.getDirectoryContents("photos");
      if (!photosDir) throw new Error("Photos directory not found");

      const categories = new Set(["all"]);
      this.photos = [];

      for (const item of photosDir) {
        if (item.type === "dir") {
          categories.add(item.name);
          const categoryContents = await this.getDirectoryContents(
            `photos/${item.name}`
          );

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
      this.photoGrid.innerHTML = `<div class="message">Error loading photos: ${error.message}</div>`;
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
    return /\.(jpg|jpeg|png|webp)$/i.test(filename);
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
        '<div class="message">No photos found in this category</div>';
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
      photoItem.addEventListener("click", () => this.showModal(photo));

      this.photoGrid.appendChild(photoItem);
    });
  }
}

// Initialize the gallery when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PhotoGallery();
});
