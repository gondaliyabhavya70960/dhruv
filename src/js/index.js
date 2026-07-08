// ============================================================
//  Dhruv Pawar — portfolio interactions
//  Vanilla JS: preloader, nav, cursor, reveals, marquee-safe,
//  copy-email, local time. No heavy scroll library needed.
// ============================================================

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
