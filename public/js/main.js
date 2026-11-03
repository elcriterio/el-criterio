const menuToggle = document.querySelector("#menu-toggle");
const mainNav = document.querySelector("#main-nav");

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

const yearElement = document.querySelector("#current-year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

const dateElement = document.querySelector("#today-date");
if (dateElement) {
  dateElement.textContent = new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());
}
