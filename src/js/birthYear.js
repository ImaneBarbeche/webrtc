let birthYear = '';

export function setBirthYear(year) {
  birthYear = year ? parseInt(year, 10) : '';
  const bYear = document.getElementById('birth-year');
  if (!bYear) return;
  if (!birthYear) {
    bYear.textContent = '';
    return;
  }
  bYear.innerHTML = `<i data-lucide="cake" class="lucide"></i> ${birthYear}`;
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

export function getBirthYear() {
  return birthYear;
}
