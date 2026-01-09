/**
 * Bear Hedge - Main JavaScript
 */

(function() {
  'use strict';

  // Elements
  const header = document.getElementById('header');
  const navToggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('nav');

  // Mobile Navigation Toggle
  if (navToggle && nav) {
    navToggle.addEventListener('click', function() {
      navToggle.classList.toggle('nav-toggle--active');
      nav.classList.toggle('nav--open');

      const isOpen = nav.classList.contains('nav--open');
      navToggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close nav when clicking a link
    nav.querySelectorAll('.nav__link').forEach(function(link) {
      link.addEventListener('click', function() {
        navToggle.classList.remove('nav-toggle--active');
        nav.classList.remove('nav--open');
        document.body.style.overflow = '';
      });
    });

    // Close nav on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && nav.classList.contains('nav--open')) {
        navToggle.classList.remove('nav-toggle--active');
        nav.classList.remove('nav--open');
        document.body.style.overflow = '';
      }
    });
  }

  // Header scroll effect
  if (header) {
    let lastScroll = 0;

    function updateHeader() {
      const currentScroll = window.pageYOffset;

      if (currentScroll > 100) {
        header.classList.add('header--scrolled');
      } else {
        header.classList.remove('header--scrolled');
      }

      lastScroll = currentScroll;
    }

    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader(); // Initial check
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Simple fade-in animation on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe elements that should animate
  document.querySelectorAll('.philosophy__item, .story__content, .timeline__item').forEach(function(el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

})();
