// Zoom and navigation logic for timeline
export function setupZoomNavigation({ timeline, zoomInBtns, zoomOutBtns, moveBackwardsBtns, moveForwardsBtns }) {
  zoomInBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      timeline.zoomIn(0.5);
    });
  });

  zoomOutBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      timeline.zoomOut(0.5);
    });
  });

  function move(percentage) {
    var range = timeline.getWindow();
    var interval = range.end - range.start;
    timeline.setWindow({
      start: range.start.valueOf() - interval * percentage,
      end: range.end.valueOf() - interval * percentage,
    });
  }

  moveBackwardsBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      move(0.5);
    });
  });
  moveForwardsBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      move(-0.5);
    });
  });
}
