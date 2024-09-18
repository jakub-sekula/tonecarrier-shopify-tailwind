const containers = document.querySelectorAll(".click-zoom-container");

containers.forEach((container) => {
  const img = container.querySelector("img");

  let isZooming = false;
  let scale = 1;
  let targetScale = 1;
  let x = 0, y = 0;
  let startTime;
  let duration = 500; // Transition duration in milliseconds (adjustable)
  let animationFrameId;
  let isZoomedIn = false; // Track whether the image is zoomed in or not

  // Default sizes for the image (small image when not zoomed)
  const defaultSizes = "100px";

  // High-res sizes (large image when zoomed)
  const highResSizes = "3840px";

  // Set the default sizes initially
  img.sizes = defaultSizes;

  // Cubic bezier function for (.17, .67, .83, .67)
  function cubicBezier(t, p0, p1, p2, p3) {
    const u = 1 - t;
    return (3 * u * u * t * p1) + (3 * u * t * t * p2) + (t * t * t * p3);
  }

  // Function to apply cubic-bezier(.17, .67, .83, .67) easing
  function applyCubicBezierEaseOut(t) {
    return cubicBezier(t, 0.17, 0.67, 0.83, 0.67);
  }

// Function to update transform origin based on mouse or touch position
function updateTransformOrigin(e) {
const rect = container.getBoundingClientRect();

// Check if the event is a touch event
if (e.touches) {
  // Use touch positions for mobile
  x = e.touches[0].X - rect.left;
  y = e.touches[0].Y - rect.top;
} else {
  // Use mouse positions for desktop
  x = e.clientX - rect.left;
  y = e.clientY - rect.top;
}

// Update the transform origin based on calculated x, y
img.style.transformOrigin = `${x}px ${y}px`;
}

  // Mouse move event to track cursor when hovering over the container
  container.addEventListener("mousemove", (e) => {
    updateTransformOrigin(e); // Always track mouse movement, even when not zoomed
  });

  // Click event to toggle zoom
  container.addEventListener("click", () => {
    if (isZoomedIn) {
      // If already zoomed in, click to unzoom
      targetScale = 1;
      img.sizes = defaultSizes; // Switch back to low-res
      img.classList.remove("zoomed-in");
      isZoomedIn = false;
    } else {
      // Zoom in on first click
      targetScale = 3; // Zoom scale factor
      img.sizes = highResSizes; // Use high-res image
      img.classList.add("zoomed-in");
      isZoomedIn = true;
    }

    if (!isZooming) {
      isZooming = true;
      startTime = null;
      requestAnimationFrame(animateZoom);
    }
  });

  function animateZoom(timestamp) {
    if (!startTime) startTime = timestamp;

    // Calculate the progress of the animation based on the target duration
    const elapsed = timestamp - startTime;
    let progress = Math.min(elapsed / duration, 1); // Clamp progress between 0 and 1

    // Apply cubic bezier easing to the progress
    let easedProgress = applyCubicBezierEaseOut(progress);

    // Calculate new scale based on easing
    scale = scale + (targetScale - scale) * easedProgress;

    img.style.transform = `scale(${scale})`;

    // Continue animation if the progress is less than 1 (i.e., the animation hasn't completed)
    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animateZoom);
    } else {
      scale = targetScale; // Ensure final scale matches target
      img.style.transform = `scale(${scale})`;
      isZooming = false;
    }
  }
});