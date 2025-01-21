Photo Gallery Website - Technical PRD
Overview
A static photo gallery website hosted on GitHub Pages that automatically generates its structure from the file system organization, with no additional metadata files needed.
Core Requirements
File Structure & Organization
Copy/
├── index.html
├── assets/
│   ├── css/
│   └── js/
└── photos/
    ├── nature/
    │   ├── sunset.jpg
    │   └── forest.jpg
    ├── urban/
    │   └── cityscape.jpg
    └── uncategorized/
        └── misc.jpg
Directory-Based Categories

Each subdirectory under /photos/ automatically becomes a category
Photos can only belong to one category (their containing folder)
Photos placed directly in /photos/ are treated as uncategorized
Category names derived from directory names (e.g., "nature" from /photos/nature/)
No JSON or metadata files required

Photo Display

Photos displayed in a responsive grid layout
Grid automatically adjusts based on screen size
Each photo maintains its aspect ratio
Lazy loading for performance
Thumbnails generated from original images on first load
Click to view full-size version

User Interface

Simple category navigation based on directory structure
One-click filtering between categories
"All Photos" view showing entire collection
Clean, minimal design
Mobile-responsive layout
Modal/lightbox for full-size viewing

Technical Requirements

Must work with standard image formats (jpg, png, webp)
Must handle arbitrary directory names (with proper URL encoding)
Must work without server-side processing
Directory scanning must happen client-side
Must handle at least 100 photos across categories
Support for deep linking to specific categories

Performance Requirements

Initial page load under 2 seconds
Smooth scrolling
Progressive image loading
Efficient category switching
Works in modern browsers (last 2 versions)
