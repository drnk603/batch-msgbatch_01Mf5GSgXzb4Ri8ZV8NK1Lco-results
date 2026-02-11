(function() {
  'use strict';

  if (window.__appInit) return;
  window.__appInit = true;

  const State = {
    burgerOpen: false,
    modalsOpen: new Set(),
    formSubmitting: new Set()
  };

  const DOM = {
    burger: null,
    nav: null,
    navList: null,
    navLinks: [],
    forms: [],
    modals: [],
    filterBtns: [],
    mapLoadBtn: null
  };

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[]\]/g, '\$&');
  }

  const Validators = {
    name: (val) => {
      if (!val || val.trim().length < 2) return 'Vārds ir obligāts (vismaz 2 simboli)';
      if (!/^[a-zA-ZÀ-ÿs-']{2,50}$/.test(val)) return 'Vārds satur nederīgas rakstzīmes';
      return null;
    },
    email: (val) => {
      if (!val || !val.trim()) return 'E-pasts ir obligāts';
      if (!/^[^s@]+@[^s@]+.[^s@]+$/.test(val)) return 'E-pasta formāts nav derīgs';
      return null;
    },
    phone: (val) => {
      if (!val || !val.trim()) return 'Tālrunis ir obligāts';
      if (!/^[ds+-()]{7,20}$/.test(val)) return 'Tālruņa numurs nav derīgs';
      return null;
    },
    message: (val) => {
      if (!val || val.trim().length < 10) return 'Ziņojums ir obligāts (vismaz 10 simboli)';
      return null;
    },
    checkbox: (checked) => {
      if (!checked) return 'Jums ir jāpiekrīt';
      return null;
    },
    select: (val) => {
      if (!val || val === '') return 'Lūdzu, izvēlieties opciju';
      return null;
    }
  };

  function showError(input, message) {
    const group = input.closest('.c-form__group') || input.closest('.form-group') || input.parentElement;
    if (!group) return;
    group.classList.add('has-error');
    const errorEl = group.querySelector('.c-form__error') || group.querySelector('[role="alert"]');
    if (errorEl) errorEl.textContent = message;
  }

  function clearError(input) {
    const group = input.closest('.c-form__group') || input.closest('.form-group') || input.parentElement;
    if (!group) return;
    group.classList.remove('has-error');
    const errorEl = group.querySelector('.c-form__error') || group.querySelector('[role="alert"]');
    if (errorEl) errorEl.textContent = '';
  }

  function validateField(input) {
    clearError(input);
    const type = input.type;
    const id = input.id;
    const name = input.name;
    let validator = null;

    if (type === 'checkbox') {
      validator = Validators.checkbox;
      const error = validator(input.checked);
      if (error) {
        showError(input, error);
        return false;
      }
      return true;
    }

    if (type === 'email' || id.includes('email') || name.includes('email')) {
      validator = Validators.email;
    } else if (type === 'tel' || id.includes('phone') || name.includes('phone')) {
      validator = Validators.phone;
    } else if (input.tagName === 'TEXTAREA' || id.includes('message') || name.includes('message')) {
      validator = Validators.message;
    } else if (input.tagName === 'SELECT') {
      validator = Validators.select;
    } else if (id.includes('name') || name.includes('name')) {
      validator = Validators.name;
    }

    if (validator) {
      const error = validator(input.value);
      if (error) {
        showError(input, error);
        return false;
      }
    } else if (input.hasAttribute('required') && !input.value.trim()) {
      showError(input, 'Šis lauks ir obligāts');
      return false;
    }

    return true;
  }

  function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required], input[type="checkbox"][required]');
    let valid = true;
    inputs.forEach(input => {
      if (!validateField(input)) valid = false;
    });
    return valid;
  }

  function notify(message, type) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.setAttribute('role', 'status');
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'c-toast c-toast--' + (type || 'info');
    toast.setAttribute('role', 'alert');
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 5000);
  }

  function BurgerMenu() {
    DOM.burger = document.querySelector('.c-nav__toggle');
    DOM.nav = document.querySelector('.c-nav');
    DOM.navList = document.querySelector('.c-nav__list');
    DOM.navLinks = document.querySelectorAll('.c-nav__link');

    if (!DOM.burger || !DOM.nav) return;

    function close() {
      State.burgerOpen = false;
      DOM.nav.classList.remove('is-open');
      DOM.burger.classList.remove('is-open');
      DOM.burger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('u-no-scroll');
    }

    function open() {
      State.burgerOpen = true;
      DOM.nav.classList.add('is-open');
      DOM.burger.classList.add('is-open');
      DOM.burger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('u-no-scroll');
    }

    function toggle() {
      State.burgerOpen ? close() : open();
    }

    DOM.burger.addEventListener('click', (e) => {
      e.preventDefault();
      toggle();
    });

    document.addEventListener('keydown', (e) => {
      if ((e.key === 'Escape' || e.key === 'Esc') && State.burgerOpen) close();
    });

    document.addEventListener('click', (e) => {
      if (State.burgerOpen && !DOM.nav.contains(e.target) && e.target !== DOM.burger) close();
    });

    DOM.navLinks.forEach(link => {
      link.addEventListener('click', close);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024 && State.burgerOpen) close();
    });
  }

  function ActiveMenu() {
    const path = window.location.pathname;
    const links = document.querySelectorAll('.c-nav__link');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      const linkPath = href.split('#')[0];
      if (linkPath === path || (path === '/' && (linkPath === '/' || linkPath === '/index.html'))) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('is-active');
      } else {
        link.removeAttribute('aria-current');
        link.classList.remove('is-active');
      }
    });
  }

  function SmoothScroll() {
    document.addEventListener('click', (e) => {
      let target = e.target;
      while (target && target.tagName !== 'A') target = target.parentElement;
      if (!target || target.tagName !== 'A') return;
      const href = target.getAttribute('href');
      if (!href || href === '#' || href === '#!') return;
      if (href.startsWith('#') || href.startsWith('/#')) {
        e.preventDefault();
        const hash = href.startsWith('/#') ? href.substring(2) : href.substring(1);
        const el = document.getElementById(hash);
        if (el) {
          const header = document.querySelector('.l-header');
          const offset = header ? header.offsetHeight : 64;
          const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top, behavior: 'smooth' });
          if (history.pushState) history.pushState(null, null, '#' + hash);
        }
      }
    });
  }

  function Forms() {
    DOM.forms = document.querySelectorAll('.c-form');
    DOM.forms.forEach(form => {
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => clearError(input));
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (State.formSubmitting.has(form)) return;
        if (!validateForm(form)) {
          notify('Lūdzu, aizpildiet visus obligātos laukus pareizi', 'error');
          return;
        }

        State.formSubmitting.add(form);
        const btn = form.querySelector('[type="submit"]');
        let originalText = '';
        if (btn) {
          originalText = btn.textContent;
          btn.disabled = true;
          btn.textContent = 'Nosūta...';
        }

        setTimeout(() => {
          State.formSubmitting.delete(form);
          if (btn) {
            btn.disabled = false;
            btn.textContent = originalText;
          }
          window.location.href = '/thank_you.html';
        }, 800);
      });
    });
  }

  function Modals() {
    DOM.modals = document.querySelectorAll('.c-modal');
    const openButtons = document.querySelectorAll('[data-modal]');

    function openModal(id) {
      const modal = document.getElementById(id);
      if (!modal) return;
      State.modalsOpen.add(id);
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('u-no-scroll');
    }

    function closeModal(id) {
      const modal = document.getElementById(id);
      if (!modal) return;
      State.modalsOpen.delete(id);
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      if (State.modalsOpen.size === 0) document.body.classList.remove('u-no-scroll');
    }

    openButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const modalId = btn.getAttribute('data-modal');
        if (modalId) openModal(modalId);
      });
    });

    DOM.modals.forEach(modal => {
      const closeBtn = modal.querySelector('.c-modal__close, [data-modal-close]');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => closeModal(modal.id));
      }
      const overlay = modal.querySelector('.c-modal__overlay');
      if (overlay) {
        overlay.addEventListener('click', () => closeModal(modal.id));
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        State.modalsOpen.forEach(id => closeModal(id));
      }
    });
  }

  function PortfolioFilter() {
    DOM.filterBtns = document.querySelectorAll('.c-filter__btn');
    const items = document.querySelectorAll('.c-portfolio-card');

    if (DOM.filterBtns.length === 0 || items.length === 0) return;

    DOM.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        DOM.filterBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        items.forEach(item => {
          if (filter === 'all' || item.classList.contains('c-portfolio-card--' + filter)) {
            item.classList.remove('u-hidden');
          } else {
            item.classList.add('u-hidden');
          }
        });
      });
    });
  }

  function MapLoader() {
    DOM.mapLoadBtn = document.querySelector('[data-action="load-map"]');
    if (!DOM.mapLoadBtn) return;

    DOM.mapLoadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const placeholder = DOM.mapLoadBtn.closest('.c-map-placeholder');
      if (placeholder) {
        placeholder.innerHTML = '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2175.123!2d24.123!3d56.945!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTbCsDU2JzQyLjAiTiAyNMKwMDcnMjMuMCJF!5e0!3m2!1slv!2slv!4v1234567890" width="100%" height="400" frameborder="0" allowfullscreen="" loading="lazy"></iframe>';
      }
    });
  }

  function ScrollToTop() {
    const btn = document.querySelector('.c-scroll-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        btn.classList.add('is-visible');
      } else {
        btn.classList.remove('is-visible');
      }
    });

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function Init() {
    BurgerMenu();
    ActiveMenu();
    SmoothScroll();
    Forms();
    Modals();
    PortfolioFilter();
    MapLoader();
    ScrollToTop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', Init);
  } else {
    Init();
  }
})();
