// Responsive Navbar Toggle
const navToggle = document.createElement("div");
navToggle.classList.add("menu-toggle");
navToggle.innerHTML = `
  <span></span>
  <span></span>
  <span></span>
`;
document.querySelector(".navbar").prepend(navToggle);

const navMenu = document.querySelector(".navbar ul");

navToggle.addEventListener("click", () => {
  navMenu.classList.toggle("active");
  navToggle.classList.toggle("open");
});

// Smooth Scroll for Explore Button
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function(e) {
    e.preventDefault();
    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth"
    });
  });
});

// Navbar Background Change on Scroll
window.addEventListener("scroll", () => {
  const navbar = document.querySelector(".navbar");
  if (window.scrollY > 50) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

// Optional: Fade-in Animation for Cards on Scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll(".activity-card, .tutor-card").forEach(el => observer.observe(el));