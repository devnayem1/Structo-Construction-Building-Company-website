(() => {
  "use strict";

  /*
  |--------------------------------------------------------------------------
  | Template Name: Structo
  | Author: Laralink
  | Version: 1.0.0
  |--------------------------------------------------------------------------
  |--------------------------------------------------------------------------
  | TABLE OF CONTENTS:
  |--------------------------------------------------------------------------
  |
  | 00. Helpers
  |     qs, qsa, exists, siblings, ancestors, isHidden, offsetTop,
  |     contentHeight, prefersReducedMotion, readPref, storePref,
  |     onReady, onLoad
  |
  | 01. Slide & Fade Animations
  | 02. Script Initialization
  | 03. Preloader
  | 04. Mobile Menu
  | 05. Sticky Header
  | 06. Dynamic Background
  | 07. Swiper Slider
  | 08. Scroll Up
  | 09. Accordian
  | 10. Counter Animation
  | 11. 3D Card Rotation
  | 12. Parallax Image
  | 13. Displaced with Scroll
  | 14. AOS Animation
  | 15. Dynamic Contact Form
  | 16. Scroll Slide
  | 17. Theme Switcher
  | 18. Process Progress
  |
  */

  /*===========================================================
    00. Helpers
  =============================================================*/
  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [
    ...scope.querySelectorAll(selector),
  ];
  const exists = (selector) => qs(selector) !== null;

  const siblings = (el, selector) =>
    el.parentElement
      ? [...el.parentElement.children].filter(
          (node) => node !== el && (!selector || node.matches(selector)),
        )
      : [];

  const ancestors = (el, selector) => {
    const matched = [];
    for (let node = el.parentElement; node; node = node.parentElement) {
      if (node.matches(selector)) matched.push(node);
    }
    return matched;
  };

  const isHidden = (el) => getComputedStyle(el).display === "none";

  const offsetTop = (el) => el.getBoundingClientRect().top + window.scrollY;

  /* Content-box height, read off clientHeight so box-sizing never matters. */
  const contentHeight = (el) => {
    const style = getComputedStyle(el);
    return (
      el.clientHeight -
      parseFloat(style.paddingTop) -
      parseFloat(style.paddingBottom)
    );
  };

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const THEME_KEY = "structo-theme";
  const ACCENT_KEY = "structo-accent";

  const readPref = (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  };

  const storePref = (key, value) => {
    try {
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    } catch (e) {
      /* Storage unavailable. */
    }
  };

  const onReady = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      setTimeout(callback, 0);
    }
  };

  const onLoad = (callback) => {
    if (document.readyState === "complete") {
      setTimeout(callback, 0);
    } else {
      window.addEventListener("load", callback, { once: true });
    }
  };

  /*===========================================================
    01. Slide & Fade Animations
  =============================================================*/
  /* Approximates jQuery's "swing" easing. */
  const EASING = "cubic-bezier(0.45, 0, 0.55, 1)";

  /* el -> { animation, direction } */
  const sliding = new WeakMap();

  const COLLAPSED = {
    height: "0px",
    paddingTop: "0px",
    paddingBottom: "0px",
    marginTop: "0px",
    marginBottom: "0px",
  };

  /* Resting box of the element, resolved against its own box-sizing. */
  const expandedBox = (el) => {
    const style = getComputedStyle(el);
    const padding =
      parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const border =
      parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);

    /* scrollHeight is content + padding, so add borders back or take padding off. */
    const height =
      style.boxSizing === "border-box"
        ? el.scrollHeight + border
        : el.scrollHeight - padding;

    return {
      height: `${height}px`,
      paddingTop: style.paddingTop,
      paddingBottom: style.paddingBottom,
      marginTop: style.marginTop,
      marginBottom: style.marginBottom,
    };
  };

  const stopSlide = (el) => {
    const current = sliding.get(el);
    if (current) {
      sliding.delete(el);
      current.animation.cancel();
    }
  };

  const slide = (el, direction, duration) => {
    const current = sliding.get(el);
    if (current && current.direction === direction) return;

    const wasAnimating = Boolean(current);
    stopSlide(el);

    if (direction === "down") {
      if (!wasAnimating && !isHidden(el)) return;
      el.style.removeProperty("display");
      /* Still hidden means a stylesheet is hiding it, so force it open. */
      if (isHidden(el)) el.style.display = "block";
    } else if (!wasAnimating && isHidden(el)) {
      return;
    }

    el.style.overflow = "hidden";

    const frames =
      direction === "down"
        ? [COLLAPSED, expandedBox(el)]
        : [expandedBox(el), COLLAPSED];

    const animation = el.animate(frames, { duration, easing: EASING });
    sliding.set(el, { animation, direction });

    animation.finished
      .then(() => {
        if (sliding.get(el)?.animation !== animation) return;
        sliding.delete(el);
        el.style.removeProperty("overflow");
        el.style.removeProperty("height");
        if (direction === "up") el.style.display = "none";
      })
      .catch(() => {
        /* Cancelled by a newer toggle. */
      });
  };

  const slideDown = (el, duration = 400) => slide(el, "down", duration);
  const slideUp = (el, duration = 400) => slide(el, "up", duration);

  const slideToggle = (el, duration = 400) => {
    const current = sliding.get(el);
    const opening = current ? current.direction === "down" : !isHidden(el);
    slide(el, opening ? "up" : "down", duration);
  };

  const fadeOut = (el, duration = 400, delay = 0) => {
    if (isHidden(el)) return;

    const animation = el.animate(
      [{ opacity: getComputedStyle(el).opacity }, { opacity: 0 }],
      { duration, delay, easing: EASING, fill: "forwards" },
    );

    animation.finished
      .then(() => {
        el.style.display = "none";
        animation.cancel();
      })
      .catch(() => {});
  };

  /*===========================================================
    02. Script Initialization
  =============================================================*/
  applyStoredTheme();

  onLoad(preloader);

  onReady(() => {
    mainNav();
    stickyHeader();
    dynamicBackground();
    swiperInit();
    scrollUp();
    accordian();
    counterAnimationInit();
    scrollSlideInit();
    imageParallax();
    card3DRotate();
    parallaxEffect();
    aosInit();
    dynamicContactForm();
    themeSwitcher();
    processProgress();

    const currentYear = new Date().getFullYear();
    qsa(".cs_getting_year").forEach((el) => {
      el.textContent = currentYear;
    });
  });

  let scrollQueued = false;
  window.addEventListener(
    "scroll",
    () => {
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(() => {
        scrollQueued = false;
        stickyHeader();
        showScrollUp();
        parallaxEffect();
        updateScrollVelocity();
      });
    },
    { passive: true },
  );

  window.addEventListener("resize", () => {
    resetDropdownsOnDesktop();
    slideTracks.forEach(fillTrack);
  });

  /*===========================================================
    03. Preloader
  =============================================================*/
  function preloader() {
    qsa(".cs_preloader_in").forEach((el) => fadeOut(el));
    qsa(".cs_preloader").forEach((el) => fadeOut(el, 600, 150));
  }
  /*===========================================================
    04. Mobile Menu
  =============================================================*/
  function mainNav() {
    qsa(".cs_nav").forEach((nav) => {
      nav.insertAdjacentHTML(
        "beforeend",
        '<span class="cs_menu_toggle"><span></span></span>',
      );
    });

    qsa(".menu-item-has-children").forEach((item) => {
      item.insertAdjacentHTML(
        "beforeend",
        '<span class="cs_menu_dropdown_toggle"><span></span></span>',
      );
    });

    qsa(".cs_menu_toggle").forEach((toggle) => {
      toggle.addEventListener("click", () => {
        toggle.classList.toggle("cs_toggle_active");
        siblings(toggle, ".cs_nav_list_wrap").forEach((wrap) =>
          wrap.classList.toggle("active"),
        );
        qsa(".cs_site_header").forEach((header) =>
          header.classList.toggle("active"),
        );
      });
    });

    qsa(".cs_menu_dropdown_toggle").forEach((toggle) => {
      toggle.addEventListener("click", () => {
        toggle.classList.toggle("active");
        siblings(toggle, "ul").forEach((list) => slideToggle(list));
        toggle.parentElement?.classList.toggle("active");
      });
    });
  }

  function resetDropdownsOnDesktop() {
    if (window.innerWidth < 1200) return;

    qsa(".cs_dropdown_list").forEach((list) => {
      stopSlide(list);
      list.style.removeProperty("display");
      list.style.removeProperty("height");
      list.style.removeProperty("overflow");
    });
  }
  /*===========================================================
    05. Sticky Header
  =============================================================*/
  function stickyHeader() {
    const active = window.scrollY >= 10;
    qsa(".cs_sticky_header").forEach((header) =>
      header.classList.toggle("cs_sticky_active", active),
    );
  }
  /*===========================================================
    06. Dynamic Background
  =============================================================*/
  function dynamicBackground() {
    qsa("[data-src]").forEach((el) => {
      el.style.backgroundImage = `url(${el.getAttribute("data-src")})`;
    });
  }
  /*===========================================================
    07. Swiper Slider
  =============================================================*/
  function swiperInit() {
    if (typeof Swiper === "undefined") {
      console.warn("Swiper library not loaded");
      return;
    }
    const sliders = document.querySelectorAll(".cs_slider");

    sliders.forEach((slider) => {
      const container = slider.querySelector(".cs_slider_container");
      const swiperWrapper = slider.querySelector(".swiper-wrapper");
      if (!container || !swiperWrapper) {
        return;
      }

      /* Read data attributes. */
      let autoPlayVar =
        parseInt(container.getAttribute("data-autoplay"), 10) || 0;
      let autoplaySpdVar = 6000;
      if (autoPlayVar > 1) {
        autoplaySpdVar = autoPlayVar;
        autoPlayVar = 1;
      }

      const speedVar =
        parseInt(container.getAttribute("data-speed"), 10) || 600;
      const loopVar = Boolean(
        parseInt(container.getAttribute("data-loop"), 10),
      );
      const centerVar = Boolean(
        parseInt(container.getAttribute("data-center"), 10),
      );
      const fadeVar = parseInt(container.getAttribute("data-fade-slide")) === 1;

      let slidesPerView =
        parseInt(container.getAttribute("data-slides-per-view"), 10) || 3;

      /* Gap between slides. */
      let gapVar = parseInt(container.getAttribute("data-gap"), 10);
      if (isNaN(gapVar)) {
        gapVar = 24; // fallback
      }

      /* Responsive breakpoints. */
      let breakpoints = {};
      if (container.getAttribute("data-slides-per-view") === "responsive") {
        const xxl =
          parseInt(container.getAttribute("data-xxl-slides"), 10) || 3;
        const xl = parseInt(container.getAttribute("data-xl-slides"), 10) || 3;
        const lg = parseInt(container.getAttribute("data-lg-slides"), 10) || 3;
        const md = parseInt(container.getAttribute("data-md-slides"), 10) || 2;
        const sm = parseInt(container.getAttribute("data-sm-slides"), 10) || 1;
        const xs = parseInt(container.getAttribute("data-xs-slides"), 10) || 1;

        /* Per-breakpoint gaps, falling back to the base gap. */
        const xxlGap =
          parseInt(container.getAttribute("data-xxl-gap"), 10) || gapVar;
        const xlGap =
          parseInt(container.getAttribute("data-xl-gap"), 10) || gapVar;
        const lgGap =
          parseInt(container.getAttribute("data-lg-gap"), 10) || gapVar;
        const mdGap =
          parseInt(container.getAttribute("data-md-gap"), 10) || gapVar;
        const smGap =
          parseInt(container.getAttribute("data-sm-gap"), 10) || gapVar;
        const xsGap =
          parseInt(container.getAttribute("data-xs-gap"), 10) || gapVar;

        breakpoints = {
          1400: { slidesPerView: xxl, spaceBetween: xxlGap },
          1200: { slidesPerView: xl, spaceBetween: xlGap },
          1024: { slidesPerView: lg, spaceBetween: lgGap },
          768: { slidesPerView: md, spaceBetween: mdGap },
          575: { slidesPerView: sm, spaceBetween: smGap },
          0: { slidesPerView: xs, spaceBetween: xsGap },
        };
        slidesPerView =
          parseInt(container.getAttribute("data-add-slides"), 10) || 3;
      }

      /* Navigation & pagination. */
      const nextEl = slider.querySelector(".cs_right_arrow");
      const prevEl = slider.querySelector(".cs_left_arrow");
      const paginationEl = slider.querySelector(".swiper-pagination");
      const hasPagination = paginationEl !== null;

      /* Opt-in: hide an arrow once the track reaches that end. */
      const hideArrowFeature = slider.classList.contains("cs_featured_arrow");

      const updateArrowVisibility = (swiperInstance) => {
        if (window.innerWidth <= 991) {
          if (prevEl) prevEl.style.display = "block";
          if (nextEl) nextEl.style.display = "block";
          return;
        }

        if (!hideArrowFeature || loopVar) return;

        const isBeginning = swiperInstance.isBeginning;
        const isEnd = swiperInstance.isEnd;

        if (prevEl) {
          prevEl.style.display = isBeginning ? "none" : "";
        }

        if (nextEl) {
          nextEl.style.display = isEnd ? "none" : "";
        }
      };

      const swiper = new Swiper(container, {
        loop: loopVar,
        speed: speedVar,
        slidesPerView: slidesPerView,
        slidesPerGroup: 1,
        spaceBetween: gapVar,
        centeredSlides: centerVar,
        effect: fadeVar ? "fade" : "slide",
        autoplay: autoPlayVar
          ? { delay: autoplaySpdVar, disableOnInteraction: false }
          : false,
        navigation: {
          nextEl: nextEl,
          prevEl: prevEl,
        },
        pagination: hasPagination ? { el: paginationEl, clickable: true } : {},
        breakpoints: breakpoints,
        on: {
          init: function () {
            updateArrowVisibility(this);
          },
          slideChange: function () {
            if (slider.closest(".cs_story_of_years")) {
              updateYearIndicators(swiper, slider);
            }
            updateArrowVisibility(this);
          },
          resize: function () {
            updateArrowVisibility(this);
          },
          breakpoint: function () {
            updateArrowVisibility(this);
          },
        },
      });
    });
  }

  /* Lights the year matching the slide now on screen. */
  function updateYearIndicators(swiper, slider) {
    const wrapper = slider.closest(".cs_story_of_years");
    if (!wrapper) return;

    const currentSlide = swiper.slides[swiper.activeIndex];
    const currentYear = currentSlide
      ? currentSlide.getAttribute("data-year")
      : null;

    qsa(".cs_years span", wrapper).forEach((yearSpan) => {
      yearSpan.classList.toggle(
        "active",
        yearSpan.getAttribute("data-year") === currentYear,
      );
    });
  }
  /*===========================================================
    08. Scroll Up
  =============================================================*/
  function scrollUp() {
    qsa(".cs_scrollup").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        window.scrollTo(0, 0);
      });
    });
  }
  function showScrollUp() {
    const visible = window.scrollY >= 350;
    qsa(".cs_scrollup").forEach((button) =>
      button.classList.toggle("active", visible),
    );
  }
  /*===========================================================
    09. Accordian
  =============================================================*/
  function accordian() {
    qsa(".cs_accordian").forEach((item) => {
      const open = item.classList.contains("active");
      qsa(":scope > .cs_accordian_body", item).forEach((body) => {
        body.style.display = open ? "" : "none";
      });
    });

    qsa(".cs_accordian_head").forEach((head) => {
      head.addEventListener("click", () => {
        siblings(head).forEach((body) => slideDown(body, 250));

        const parent = head.parentElement;
        const item = parent && parent.matches(".cs_accordian") ? parent : null;

        if (item) {
          siblings(item).forEach((other) => {
            qsa(":scope > .cs_accordian_body", other).forEach((body) =>
              slideUp(body, 250),
            );
          });
        }

        /* Accordian Active Class */
        ancestors(head, ".cs_accordian").forEach((el) =>
          el.classList.add("active"),
        );

        if (item) {
          siblings(item).forEach((other) => other.classList.remove("active"));
        }
      });
    });
  }
  /*===========================================================
    10. Counter Animation
  =============================================================*/
  const COUNTER_DEFAULT_DURATION = 2000;
  const COUNTER_WHEEL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
  const COUNTER_MAX_TURNS_PER_SECOND = 1.5;

  function counterAnimation(element, target, duration, suffix) {
    const el = typeof element === "string" ? qs(element) : element;
    if (!el) return;

    const to = Number(target);
    if (!Number.isFinite(to)) return;

    const time =
      Number(duration) > 0 ? Number(duration) : COUNTER_DEFAULT_DURATION;
    const tail = suffix == null ? "" : String(suffix);
    const [intPart, fracPart = ""] = Math.abs(to)
      .toFixed(countDecimals(to))
      .split(".");
    const digits = (intPart + fracPart).split("").map(Number);
    const places = [];
    for (let place = intPart.length - 1; place >= -fracPart.length; place--) {
      places.push(place);
    }

    const wheels = buildCounterWheels(el, places, digits, to < 0, tail);
    if (!wheels) {
      el.textContent = formatCounterValue(intPart, fracPart, to < 0) + tail;
      return;
    }
    const maxTurns = Math.round((time / 1000) * COUNTER_MAX_TURNS_PER_SECOND);
    wheels.forEach((wheel) => {
      const fullTurns = Math.floor(
        Math.abs(to) / Math.pow(10, wheel.place + 1),
      );
      const turns = Math.min(fullTurns, Math.max(0, maxTurns - wheel.place));
      wheel.travel = turns * 10 + wheel.finalDigit;
    });

    const settle = () =>
      wheels.forEach((wheel) => spinCounterWheel(wheel, wheel.finalDigit));

    if (prefersReducedMotion()) {
      settle();
      return;
    }

    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / time, 1);

      if (progress >= 1) {
        settle();
        return;
      }

      const remaining = 1 - easeInOutSine(progress);
      wheels.forEach((wheel) => {
        const position = wheel.finalDigit - wheel.travel * remaining;
        spinCounterWheel(wheel, ((position % 10) + 10) % 10);
      });

      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }
  function buildCounterWheels(el, places, digits, negative, suffix) {
    el.textContent = "";

    const inner = document.createElement("span");
    inner.style.cssText = "display:inline;white-space:nowrap;";
    if (negative) inner.appendChild(counterSymbol("-"));

    const wheels = [];

    places.forEach((place, index) => {
      if (place === -1) inner.appendChild(counterSymbol("."));
      else if (index > 0 && place >= 0 && place % 3 === 2) {
        inner.appendChild(counterSymbol(","));
      }

      const digit = document.createElement("span");
      digit.style.cssText = "position:relative;display:inline;";
      const spacer = document.createElement("span");
      spacer.style.cssText = "display:inline;visibility:hidden;";
      spacer.textContent = "0";

      const frame = document.createElement("span");
      frame.style.cssText =
        "display:block;position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;";

      const ribbon = document.createElement("span");
      ribbon.style.cssText =
        "display:block;will-change:transform;backface-visibility:hidden;";
      COUNTER_WHEEL.forEach((number) => {
        const value = document.createElement("span");
        value.style.cssText = "display:block;text-align:center;";
        value.textContent = number;
        ribbon.appendChild(value);
      });

      frame.appendChild(ribbon);
      digit.append(spacer, frame);
      inner.appendChild(digit);

      wheels.push({ place, ribbon, frame, finalDigit: digits[index] });
    });

    if (suffix) inner.appendChild(counterSymbol(suffix));

    el.appendChild(inner);
    const cellHeight = wheels.length
      ? wheels[0].frame.getBoundingClientRect().height
      : 0;

    if (!cellHeight) return null;

    wheels.forEach((wheel) => {
      wheel.cellHeight = cellHeight;
      [...wheel.ribbon.children].forEach((value) => {
        value.style.height = `${cellHeight}px`;
        value.style.lineHeight = `${cellHeight}px`;
      });
    });

    return wheels;
  }

  function spinCounterWheel(wheel, position) {
    const offset = -position * wheel.cellHeight;
    wheel.ribbon.style.transform = `translate3d(0, ${offset}px, 0)`;
  }

  function counterSymbol(character) {
    const symbol = document.createElement("span");
    symbol.style.cssText = "display:inline;";
    symbol.textContent = character;
    return symbol;
  }

  function formatCounterValue(intPart, fracPart, negative) {
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${negative ? "-" : ""}${grouped}${fracPart ? `.${fracPart}` : ""}`;
  }

  function countDecimals(number) {
    const [, fraction = ""] = String(number).split(".");
    return fraction.length;
  }

  function easeInOutSine(t) {
    return (1 - Math.cos(Math.PI * t)) / 2;
  }

  function counterAnimationInit() {
    if (!exists(".cs_counter")) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const { countTo, duration, suffix } = entry.target.dataset;
          counterAnimation(entry.target, countTo, duration, suffix);
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.3,
      },
    );

    qsa(".cs_counter").forEach((counter) => observer.observe(counter));
  }
  /*===========================================================
    11. 3D Card Rotation
  =============================================================*/
  function card3DRotate() {
    qsa(".cardRotation").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const cardRect = card.getBoundingClientRect();
        const mouseX = (e.clientX - cardRect.left) / cardRect.width;
        const mouseY = (e.clientY - cardRect.top) / cardRect.height;

        const rotateY = (mouseX - 0.5) * 10;
        const rotateX = (0.5 - mouseY) * 10;

        card.style.transform = `perspective(1500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        card.style.transition = "transform 0.2s ease";
      });
    });

    qsa(".card").forEach((card) => {
      card.addEventListener("mouseleave", () => {
        card.style.transform =
          "perspective(1500px) rotateX(0deg) rotateY(0deg)";
        card.style.transition = "transform 0.4s ease";
      });
    });
  }
  /*===========================================================
    12. Parallax Image
  =============================================================*/
  function imageParallax() {
    qsa(".imageParallax").forEach((wrapper) => {
      wrapper.addEventListener("mousemove", (e) => {
        const thumbnails = qsa("img, .particleParallax", wrapper);
        const [thumbnail] = thumbnails;
        if (!thumbnail) return;

        const rect = thumbnail.getBoundingClientRect();
        const centerX = thumbnail.offsetWidth / 2;
        const centerY = thumbnail.offsetHeight / 2;
        const mouseX = e.pageX - (rect.left + window.scrollX) - centerX;
        const mouseY = e.pageY - (rect.top + window.scrollY) - centerY;

        const depth = parseFloat(thumbnail.dataset.depth) || 0.2;
        const moveX = mouseX * depth * 0.08;
        const moveY = mouseY * depth * 0.08;
        const isZoomEnabled = Number(thumbnail.dataset.zoom) === 1;

        let transformStyle = `translate(${moveX}px, ${moveY}px)`;

        if (isZoomEnabled) {
          let zoomScale = 1 + (moveX - moveY) * 0.03;
          zoomScale = Math.max(1, Math.min(1.1, zoomScale));
          transformStyle += ` scale(${zoomScale})`;
        }

        thumbnails.forEach((el) => {
          el.style.transform = transformStyle;
          el.style.transition =
            "transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.55)";
        });
      });

      wrapper.addEventListener("mouseleave", () => {
        qsa("img", wrapper).forEach((el) => {
          el.style.transform = "translate(0px, 0px) scale(1)";
          el.style.transition =
            "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.55)";
        });
      });
    });
  }
  /*===========================================================
    13. Displaced with Scroll
  =============================================================*/
  function parallaxEffect() {
    qsa(".cs_parallax").forEach((section) => {
      const windowScroll = window.scrollY,
        windowHeight = document.documentElement.clientHeight,
        barOffset = offsetTop(section),
        barHeight = contentHeight(section),
        barHeightWindowHeight = windowScroll + windowHeight,
        barScrollUp = barOffset <= windowScroll + windowHeight,
        barSctollDown = barOffset + barHeight >= windowScroll;

      if (!(barSctollDown && barScrollUp)) return;

      const calculadedHeight = barHeightWindowHeight - windowHeight;
      const largeEffectPixel = calculadedHeight / 5;
      const mediumEffectPixel = calculadedHeight / 20;
      const miniEffectPixel = calculadedHeight / 30;

      const move = (selector, value) => {
        qsa(selector, section).forEach((el) => {
          el.style.transform = value;
        });
      };

      move(".cs_to_left", `translateX(-${miniEffectPixel}px)`);
      move(".cs_to_right", `translateX(${miniEffectPixel}px)`);
      move(".cs_to_up", `translateY(-${miniEffectPixel}px)`);
      move(".cs_to_down", `translateY(${miniEffectPixel}px)`);
      move(
        ".cs_to_right_up",
        `translate(${miniEffectPixel}px, -${miniEffectPixel}px)`,
      );
      move(
        ".cs_to_left_up",
        `translate(-${miniEffectPixel}px, -${miniEffectPixel}px)`,
      );
      move(
        ".cs_to_right_down",
        `translate(-${miniEffectPixel}px, ${miniEffectPixel}px)`,
      );
      move(
        ".cs_to_left_down",
        `translate(${miniEffectPixel}px, ${miniEffectPixel}px)`,
      );
      move(".cs_to_rotate", `rotate(${mediumEffectPixel}deg)`);
      move(".cs_to_rotate_2", `rotate(-${mediumEffectPixel}deg)`);
      move(".cs_zoom", `scale(${section.dataset.zoom})`);

      qsa(".cs_bg_parallax", section).forEach((el) => {
        el.style.backgroundPosition = `center -${largeEffectPixel}px`;
      });
    });
  }
  /*===========================================================
    14. AOS Animation
  =============================================================*/
  function aosInit() {
    if (typeof AOS === "undefined") {
      console.warn("AOS library not loaded");
      return;
    }
    AOS.init({
      offset: 100,
      duration: 800,
      easing: "ease-in-out",
      once: true,
      mirror: false,
    });
  }
  /*===========================================================
    15. Dynamic Contact Form
  =============================================================*/
  function dynamicContactForm() {
    const form = qs("#cs_form");
    const result = qs("#cs_result");
    if (!form || !result) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const json = JSON.stringify(Object.fromEntries(new FormData(form)));
      result.innerHTML = "Please wait...";

      try {
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: json,
        });

        const data = await response.json();
        if (response.status !== 200) {
          console.log(response);
        }
        result.innerHTML = data.message;
      } catch (error) {
        console.log(error);
        result.innerHTML = "Something went wrong!";
      } finally {
        form.reset();
        setTimeout(() => {
          result.style.display = "none";
        }, 5000);
      }
    });
  }
  /*===========================================================
    16. Scroll Slide
  =============================================================*/
  const BASE_SPEED = 0.6;
  const SCROLL_BOOST = 0.25;
  const VELOCITY_DECAY = 0.9;
  const MAX_VELOCITY = 80;
  const USER_GRACE = 250;

  let slideTracks = [];
  let slideFrame = null;
  let slideLastTime = 0;
  let scrollVelocity = 0;
  let lastScrollY = 0;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function scrollSlideInit() {
    lastScrollY = window.scrollY;

    slideTracks = qsa(".cs_scroll_slide").map((el) => {
      const track = {
        el,
        originals: [...el.children],
        setWidth: 0,
        position: 0,
        appliedLeft: 0,
        userUntil: 0,
        visible: false,
      };

      el.addEventListener(
        "scroll",
        () => {
          if (Math.abs(el.scrollLeft - track.appliedLeft) < 1) return;
          track.position = el.scrollLeft;
          track.userUntil = performance.now() + USER_GRACE;
        },
        { passive: true },
      );

      new IntersectionObserver((entries) => {
        track.visible = entries[0].isIntersecting;
        toggleSlideLoop();
      }).observe(el);

      dragToScroll(track);
      fillTrack(track);
      return track;
    });

    reducedMotion.addEventListener("change", toggleSlideLoop);
    toggleSlideLoop();
  }

  function fillTrack(track) {
    const { el, originals } = track;

    qsa(":scope > [data-cs-clone]", el).forEach((clone) => clone.remove());

    track.setWidth = originals.reduce(
      (total, card) => total + card.getBoundingClientRect().width,
      0,
    );
    if (!track.setWidth) return;

    const copies = Math.ceil(el.clientWidth / track.setWidth) + 1;
    for (let copy = 0; copy < copies; copy += 1) {
      originals.forEach((card) => {
        const clone = card.cloneNode(true);
        clone.setAttribute("data-cs-clone", "");
        clone.setAttribute("aria-hidden", "true");
        el.appendChild(clone);
      });
    }
  }

  function toggleSlideLoop() {
    const wanted =
      !reducedMotion.matches && slideTracks.some((track) => track.visible);

    if (wanted && slideFrame === null) {
      slideLastTime = performance.now();
      slideFrame = requestAnimationFrame(slideStep);
    } else if (!wanted && slideFrame !== null) {
      cancelAnimationFrame(slideFrame);
      slideFrame = null;
    }
  }

  function updateScrollVelocity() {
    const y = window.scrollY;
    const delta = y - lastScrollY;
    lastScrollY = y;

    scrollVelocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, delta));
  }

  function slideStep(now) {
    const frames = Math.min(4, (now - slideLastTime) / 16.667) || 1;
    slideLastTime = now;

    scrollVelocity *= Math.pow(VELOCITY_DECAY, frames);
    const step = (BASE_SPEED + scrollVelocity * SCROLL_BOOST) * frames;

    slideTracks.forEach((track) => {
      const { el, setWidth } = track;
      if (!track.visible || !setWidth) return;

      if (now < track.userUntil) {
        track.position = el.scrollLeft;
        return;
      }

      track.position =
        (((track.position + step) % setWidth) + setWidth) % setWidth;
      el.scrollLeft = track.position;
      track.appliedLeft = el.scrollLeft;
    });

    slideFrame = requestAnimationFrame(slideStep);
  }

  /* A mouse has no horizontal gesture of its own, so add click and drag. */
  function dragToScroll(track) {
    const { el } = track;
    let startX = 0;
    let startLeft = 0;
    let dragging = false;

    el.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch") return;
      dragging = true;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      el.classList.add("cs_dragging");
      el.setPointerCapture(e.pointerId);
    });

    el.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      el.scrollLeft = startLeft - (e.clientX - startX);
    });

    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove("cs_dragging");
      if (el.hasPointerCapture(e.pointerId))
        el.releasePointerCapture(e.pointerId);
    };

    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
  }

  /*===========================================================
    17. Theme Switcher
  =============================================================*/
  function applyStoredTheme() {
    const mode = readPref(THEME_KEY);
    const accent = readPref(ACCENT_KEY);
    if (mode) document.body.classList.toggle("cs_dark", mode === "dark");
    if (accent) document.body.style.setProperty("--accent-color", accent);
  }

  function themeSwitcher() {
    const switcher = qs(".cs_switcher");
    if (!switcher) return;

    const toggle = qs(".cs_switcher_toggle", switcher);
    const options = qsa(".cs_switcher_mode_option", switcher);
    const swatches = qsa(".cs_switcher_color", switcher);

    const applyMode = (mode) => {
      document.body.classList.toggle("cs_dark", mode === "dark");
      options.forEach((option) => {
        const on = option.dataset.mode === mode;
        option.classList.toggle("active", on);
        option.setAttribute("aria-pressed", String(on));
      });
      storePref(THEME_KEY, mode);
    };

    const applyAccent = (color) => {
      if (color) document.body.style.setProperty("--accent-color", color);
      else document.body.style.removeProperty("--accent-color");
      swatches.forEach((swatch) =>
        swatch.classList.toggle("active", swatch.dataset.accent === color),
      );
      storePref(ACCENT_KEY, color);
    };

    const setOpen = (open) => {
      switcher.classList.toggle("active", open);
      toggle.setAttribute("aria-expanded", String(open));
    };

    toggle.addEventListener("click", () =>
      setOpen(!switcher.classList.contains("active")),
    );

    options.forEach((option) =>
      option.addEventListener("click", () => applyMode(option.dataset.mode)),
    );

    swatches.forEach((swatch) =>
      swatch.addEventListener("click", () =>
        applyAccent(swatch.dataset.accent),
      ),
    );

    document.addEventListener("click", (e) => {
      if (!switcher.contains(e.target)) setOpen(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    applyMode(document.body.classList.contains("cs_dark") ? "dark" : "light");
    applyAccent(readPref(ACCENT_KEY));
  }

  /*===========================================================
    18. Process Progress
  =============================================================*/
  const PROCESS_STEP_DELAY = 900;
  const PROCESS_HOLD = 2000;
  const PROCESS_RESTART = 900;

  function processProgress() {
    const steps = qsa(".cs_process_style_1");
    if (!steps.length) return;

    const setComplete = (step, on) =>
      step.classList.toggle("cs_process_complete", on);

    /* Nothing to animate: show the finished track and leave it there. */
    if (prefersReducedMotion()) {
      steps.forEach((step) => setComplete(step, true));
      return;
    }

    let index = 0;
    let timer = null;

    const tick = () => {
      if (index < steps.length) {
        setComplete(steps[index], true);
        index += 1;
        timer = setTimeout(
          tick,
          index < steps.length ? PROCESS_STEP_DELAY : PROCESS_HOLD,
        );
        return;
      }

      steps.forEach((step) => setComplete(step, false));
      index = 0;
      timer = setTimeout(tick, PROCESS_RESTART);
    };

    const start = () => {
      if (timer) return;
      tick();
    };

    const stop = () => {
      clearTimeout(timer);
      timer = null;
      index = 0;
      steps.forEach((step) => setComplete(step, false));
    };

    if (!("IntersectionObserver" in window)) {
      start();
      return;
    }

    const list = steps[0].closest(".cs_process_list") || steps[0].parentElement;

    new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) start();
      else stop();
    }).observe(list);
  }
})();
