// ============================================================
//  Dhruv Pawar — portfolio interactions
//  Vanilla JS for the basics (preloader, nav, reveals, copy-email,
//  local time) plus a GSAP + ScrollTrigger + Lenis animation layer:
//  smooth scrolling, hero parallax, letter hover, velocity marquee.
// ============================================================

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// Mark JS as available so CSS can apply animation initial states.
document.body.classList.add("js");

// ---------- Preloader ----------
const loader = document.querySelector(".loader");

const finishLoading = () => {
  loader?.classList.add("is-done");
  playHeroIntro();
};

if (prefersReducedMotion) {
  finishLoading();
} else {
  // Let the loader bar play, then reveal.
  window.addEventListener("load", () => setTimeout(finishLoading, 950), {
    once: true,
  });
  // Safety net in case `load` hangs on a slow asset.
  setTimeout(finishLoading, 3500);
}

// ---------- Hero intro ----------
let heroPlayed = false;

function playHeroIntro() {
  if (heroPlayed) return;
  heroPlayed = true;

  document.querySelectorAll("[data-hero-line]").forEach((el, i) => {
    setTimeout(() => el.classList.add("is-in"), 120 + i * 130);
  });

  document.querySelectorAll("[data-hero]").forEach((el, i) => {
    setTimeout(() => el.classList.add("is-in"), 450 + i * 140);
  });

  // Start the stat counters only once the stats are actually fading in —
  // earlier and the animation plays invisibly behind the preloader.
  setTimeout(initStatCounters, 900);

  // Once the line-mask intro has finished, unclip the hero lines so the
  // per-letter hover bounce isn't cut off (same trick the original site
  // used: release the overflow after the intro).
  setTimeout(() => {
    document.querySelector(".hero__title")?.classList.add("is-done");
  }, 1700);
}

// ---------- Sticky nav state ----------
const nav = document.getElementById("js-nav");

const onScrollNav = () => {
  nav?.classList.toggle("is-scrolled", window.scrollY > 24);
};

onScrollNav();
window.addEventListener("scroll", onScrollNav, { passive: true });

// ---------- Mobile menu ----------
const burger = document.getElementById("js-burger");
const menu = document.getElementById("js-menu");

const closeMenu = () => {
  burger?.classList.remove("is-open");
  menu?.classList.remove("is-open");
  burger?.setAttribute("aria-expanded", "false");
};

burger?.addEventListener("click", () => {
  const open = menu?.classList.toggle("is-open");
  burger.classList.toggle("is-open", open);
  burger.setAttribute("aria-expanded", String(Boolean(open)));
  // Keyboard flow: the panel precedes the toggle in the DOM, so move
  // focus into the menu when it opens.
  if (open) menu?.querySelector("a")?.focus();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menu?.classList.contains("is-open")) {
    closeMenu();
    burger?.focus();
  }
});

menu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

// ---------- Scroll progress bar ----------
const progress = document.getElementById("js-progress");

const onScrollProgress = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? window.scrollY / max : 0;
  if (progress) progress.style.transform = `scaleX(${ratio})`;
};

onScrollProgress();
window.addEventListener("scroll", onScrollProgress, { passive: true });
window.addEventListener("resize", onScrollProgress, { passive: true });

// ---------- Reveal on scroll ----------
const revealEls = document.querySelectorAll("[data-reveal]");

if ("IntersectionObserver" in window && !prefersReducedMotion) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

// ---------- Custom cursor (fine pointers only) ----------
const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const dot = document.getElementById("js-cursor-dot");
const ring = document.getElementById("js-cursor-ring");

if (fine && dot && ring && !prefersReducedMotion) {
  let mx = -100;
  let my = -100;
  let rx = -100;
  let ry = -100;

  window.addEventListener(
    "mousemove",
    (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx - 3}px, ${my - 3}px)`;
    },
    { passive: true }
  );

  const lerp = () => {
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    ring.style.transform = `translate(${rx - 17}px, ${ry - 17}px)`;
    requestAnimationFrame(lerp);
  };
  requestAnimationFrame(lerp);

  document.querySelectorAll("a, button").forEach((el) => {
    el.addEventListener("mouseenter", () => ring.classList.add("is-active"));
    el.addEventListener("mouseleave", () => ring.classList.remove("is-active"));
  });
}

// ---------- Project card pointer sheen ----------
document.querySelectorAll(".project").forEach((card) => {
  card.addEventListener(
    "mousemove",
    (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    },
    { passive: true }
  );
});

// ---------- Copy email ----------
const copyButton = document.getElementById("js-copy-email");
const copyLabel = document.getElementById("js-copy-label");

copyButton?.addEventListener("click", async () => {
  const email = copyButton.dataset.email || "";
  try {
    await navigator.clipboard.writeText(email);
  } catch {
    // Clipboard API unavailable (e.g. insecure context) — fall back.
    const input = document.createElement("input");
    input.value = email;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }

  if (copyLabel) {
    copyLabel.textContent = "Copied to clipboard!";
    setTimeout(() => {
      copyLabel.textContent = email;
    }, 2000);
  }
});

// ---------- Count-up hero stats (started from playHeroIntro) ----------
const runCountUp = (el) => {
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || "";
  const duration = 1300;
  let start;

  const tick = (ts) => {
    if (start === undefined) start = ts;
    const p = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = `${Math.round(target * eased)}${suffix}`;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

function initStatCounters() {
  const stats = document.querySelectorAll(".stat__value[data-count]");
  if (!stats.length || !("IntersectionObserver" in window) || prefersReducedMotion) {
    return; // static values in the markup remain
  }

  const statIo = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runCountUp(entry.target);
          statIo.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  stats.forEach((el) => statIo.observe(el));
}

// ---------- Scrollspy: highlight the section in view ----------
const sectionLinks = new Map(); // section element -> [nav links]
document.querySelectorAll('.nav__link[href^="#"]').forEach((link) => {
  const section = document.querySelector(link.getAttribute("href"));
  if (!section) return;
  sectionLinks.set(section, [...(sectionLinks.get(section) || []), link]);
});

if (sectionLinks.size && "IntersectionObserver" in window) {
  const clearSpy = () => {
    document.querySelectorAll(".nav__link.is-active").forEach((a) => {
      a.classList.remove("is-active");
      a.removeAttribute("aria-current");
    });
  };

  const spyIo = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        clearSpy();
        (sectionLinks.get(entry.target) || []).forEach((link) => {
          link.classList.add("is-active");
          link.setAttribute("aria-current", "true");
        });
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  sectionLinks.forEach((_, section) => spyIo.observe(section));
  // Observing the hero (mapped to no link) clears the highlight when the
  // user scrolls back to the top.
  const hero = document.getElementById("js-hero");
  if (hero) spyIo.observe(hero);
}

// ---------- 3D tilt on project cards (fine pointers only) ----------
if (fine && !prefersReducedMotion) {
  // The reveal rule transitions transform over 0.9s, which would make the
  // tilt swim behind the pointer — override with a short inline transition
  // while the pointer is over the card.
  const TILT_TRANSITION =
    "transform 0.12s ease-out, background 0.45s var(--ease), " +
    "border-color 0.45s var(--ease), box-shadow 0.45s var(--ease)";

  document.querySelectorAll(".project").forEach((card) => {
    card.addEventListener("mouseenter", () => {
      if (card.classList.contains("is-visible")) {
        card.style.transition = TILT_TRANSITION;
      }
    });
    card.addEventListener(
      "mousemove",
      (e) => {
        if (!card.classList.contains("is-visible")) return;
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${py * -3.5}deg) rotateY(${px * 3.5}deg) translateY(-4px)`;
      },
      { passive: true }
    );
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
      setTimeout(() => {
        card.style.transition = "";
      }, 300);
    });
  });

  // Magnetic pull on primary buttons
  document.querySelectorAll(".btn--primary").forEach((btn) => {
    btn.addEventListener(
      "mousemove",
      (e) => {
        const rect = btn.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        btn.style.transform = `translate(${px * 8}px, ${py * 6 - 2}px)`;
      },
      { passive: true }
    );
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
    });
  });
}

// ---------- Local time (IST) ----------
const timeEl = document.getElementById("js-time");

const renderTime = () => {
  if (!timeEl) return;
  timeEl.textContent = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date());
};

renderTime();
setInterval(renderTime, 30_000);

// ============================================================
//  GSAP + Lenis animation layer (skipped under reduced motion —
//  the CSS/IO fallbacks above keep the site fully usable)
// ============================================================
if (!prefersReducedMotion) {
  // ---------- Smooth scrolling ----------
  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Route anchor navigation through Lenis so it stays smooth. No extra
  // offset: Lenis already honors the CSS scroll-padding-top. Native
  // semantics are preserved: modified clicks pass through, the URL hash
  // still updates, and focus moves to the target section.
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }
      const target = a.getAttribute("href");
      const section = target.length > 1 && document.querySelector(target);
      if (!section) return;
      e.preventDefault();
      history.pushState(null, "", target);
      lenis.scrollTo(section, {
        duration: 1.2,
        onComplete: () => {
          if (!section.hasAttribute("tabindex")) {
            section.setAttribute("tabindex", "-1");
          }
          section.focus({ preventScroll: true });
        },
      });
    });
  });

  // ---------- Hero title: horizontal parallax on scroll ----------
  const heroLines = document.querySelectorAll(".hero__title .hero__line");
  if (heroLines.length === 3) {
    const speeds = [7, -9, 5];
    heroLines.forEach((line, i) => {
      gsap.to(line, {
        xPercent: speeds[i],
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    });
  }

  // ---------- Hero name: per-letter hover bounce ----------
  // Splitting into spans would make screen readers announce the h1
  // letter-by-letter, so give the heading a single accessible name first.
  const heroTitle = document.querySelector(".hero__title");
  if (heroTitle) {
    heroTitle.setAttribute(
      "aria-label",
      heroTitle.textContent.replace(/\s+/g, " ").trim()
    );
  }

  document
    .querySelectorAll(".hero__title .hero__line:nth-child(-n+2) .hero__word")
    .forEach((word) => {
      const text = word.textContent;
      word.textContent = "";
      [...text].forEach((ch) => {
        const span = document.createElement("span");
        span.className = "hero__char";
        span.textContent = ch;
        word.appendChild(span);
      });
    });

  document.querySelectorAll(".hero__char").forEach((char) => {
    char.addEventListener("mouseenter", () => {
      if (gsap.isTweening(char)) return;
      gsap.to(char, {
        yPercent: -16,
        duration: 0.18,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
        onComplete: () => gsap.set(char, { yPercent: 0 }),
      });
    });
  });

  // ---------- Aurora blobs: vertical parallax ----------
  // The blobs' own drift is a CSS transform animation, so the parallax
  // rides on the independent `translate` property (see SCSS) instead.
  [
    [".bg__aurora--1", "140px"],
    [".bg__aurora--2", "-110px"],
    [".bg__aurora--3", "90px"],
  ].forEach(([sel, y]) => {
    gsap.to(sel, {
      "--par-y": y,
      ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: 1.2 },
    });
  });

  // ---------- Section titles: subtle horizontal drift in ----------
  document.querySelectorAll(".section__title").forEach((title) => {
    gsap.fromTo(
      title,
      { xPercent: -3 },
      {
        xPercent: 0,
        ease: "none",
        scrollTrigger: {
          trigger: title,
          start: "top 95%",
          end: "top 45%",
          scrub: true,
        },
      }
    );
  });

  // ---------- Contact marquee: scroll-velocity reactive ----------
  const marqueeTrack = document.querySelector(".contact__marquee-track");
  const marqueeWrap = document.querySelector(".contact__marquee");
  if (marqueeTrack && marqueeWrap) {
    marqueeTrack.classList.add("is-gsap"); // disables the CSS fallback animation
    const marqueeTween = gsap.to(marqueeTrack, {
      xPercent: -50,
      ease: "none",
      duration: 24,
      repeat: -1,
    });

    lenis.on("scroll", (e) => {
      const boost = Math.min(Math.abs(e.velocity) / 10, 2.5);
      marqueeTween.timeScale(marqueeWrap.matches(":hover") ? 0 : 1 + boost);
      gsap.to(marqueeTrack, {
        skewX: gsap.utils.clamp(-5, 5, e.velocity * -0.12),
        duration: 0.4,
        overwrite: "auto",
      });
    });

    // Preserve the pause-on-hover behavior the CSS version had.
    marqueeWrap.addEventListener("mouseenter", () => marqueeTween.timeScale(0));
    marqueeWrap.addEventListener("mouseleave", () => marqueeTween.timeScale(1));
  }
}
