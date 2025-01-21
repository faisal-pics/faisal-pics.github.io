class PhotoGallery {
  constructor() {
    this.photoGrid = document.getElementById("photo-grid");
    this.categoryNav = document.getElementById("category-nav");
    this.modal = document.getElementById("photo-modal");
    this.modalImg = document.getElementById("modal-img");
    this.closeModal = document.querySelector(".close-modal");
    this.currentCategory = "all";
    this.photos = [];

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
      const response = await fetch("photos/");
      if (!response.ok) throw new Error("Failed to scan photos directory");

      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");

      // Get all links that point to image files
      const links = Array.from(doc.querySelectorAll("a")).filter((a) => {
        const href = a.getAttribute("href");
        return href.match(/\.(jpg|jpeg|png|webp)$/i);
      });

      // Extract categories and photos
      const categories = new Set(["all"]);
      this.photos = links.map((link) => {
        const path = link.getAttribute("href");
        const parts = path.split("/");
        const category = parts.length > 1 ? parts[0] : "uncategorized";
        categories.add(category);

        return {
          path: `photos/${path}`,
          category,
          filename: parts[parts.length - 1],
        };
      });

      this.createCategoryButtons(Array.from(categories));
      this.displayPhotos();
    } catch (error) {
      console.error("Error scanning photos directory:", error);
      this.photoGrid.innerHTML =
        '<div class="loading">Error loading photos. Please make sure the photos directory exists and is accessible.</div>';
    }
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
