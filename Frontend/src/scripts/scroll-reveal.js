// Scroll Reveal Animation
document.addEventListener('DOMContentLoaded', () => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('revealed');
        }, index * 100); // Stagger the animations
      }
    });
  }, observerOptions);

  // Observe all scroll-reveal elements
  document.querySelectorAll('.scroll-reveal').forEach(el => {
    observer.observe(el);
  });
});
