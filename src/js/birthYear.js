let birthYear = '';

export function setBirthYear(year) {
  birthYear = year ? parseInt(year, 10) : '';
  // Update sticky display
  const timelineContainer = document.getElementById('timeline');
  let sticky = document.getElementById('birth-sticky');
  if (!timelineContainer) return;
  if (!birthYear) {
    if (sticky) sticky.remove();
    if (window.timeline && window.timeline.redraw) window.timeline.redraw();
    return;
  }
  if (!sticky) {
    sticky = document.createElement('div');
    sticky.id = 'birth-sticky';
    sticky.style.position = 'sticky';
    sticky.style.top = '0px';
    sticky.style.zIndex = '1000';
    sticky.style.background = '#fff';
    sticky.style.border = 'none';
    sticky.style.borderRadius = '0';
    sticky.style.padding = '4px 0';
    sticky.style.margin = '0 auto';
    sticky.style.width = 'fit-content';
    sticky.style.fontWeight = 'bold';
    sticky.style.textAlign = 'center';
    sticky.style.fontSize = '1.1em';
    sticky.innerText = birthYear;
    timelineContainer.parentNode.insertBefore(sticky, timelineContainer);
  } else {
    sticky.innerText = birthYear;
  }
  if (window.timeline && window.timeline.redraw) window.timeline.redraw();
}

export function getBirthYear() {
  return birthYear;
}
