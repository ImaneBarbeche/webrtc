// Logic for summary view (show/hide)
let summaryOpen = false;

export function toggleSummary(summaryContainer) {
  if (!summaryOpen) {
    summaryContainer.style.visibility = "visible";
    requestAnimationFrame(() => {
      summaryContainer.classList.add("show-summary");
    });
    summaryOpen = true;
  } else {
    summaryContainer.classList.remove("show-summary");
    summaryOpen = false;
  }
}

export function setupSummaryHandlers({ summaryContainer, viewSummaryBtn, closeSummaryBtn }) {
  viewSummaryBtn.addEventListener("click", () => toggleSummary(summaryContainer));
  closeSummaryBtn.addEventListener("click", () => toggleSummary(summaryContainer));
}
