const body = document.body;
const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const progress = document.querySelector(".scroll-progress");
const hero = document.querySelector(".hero");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobileHeaderMedia = window.matchMedia("(max-width: 980px)");
const navLinks = [...document.querySelectorAll(".site-nav a[href^='#']")];
const navSectionTargets = navLinks
  .map((link) => {
    const hash = link.getAttribute("href");
    const id = hash?.slice(1);
    const element = id === "top" ? hero : id ? document.getElementById(id) : null;
    return element ? { id, element } : null;
  })
  .filter(Boolean);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateMobileHeaderGlass(scrollTop) {
  if (!header) return;

  const isMobileHeader = mobileHeaderMedia.matches;
  let glassProgress = 1;

  if (isMobileHeader && hero) {
    const rampDistance = clamp(hero.offsetHeight * 0.36, 260, 460);
    glassProgress = clamp(scrollTop / rampDistance, 0, 1);
  }

  header.style.setProperty("--mobile-header-bg-alpha", (0.58 * glassProgress).toFixed(3));
  header.style.setProperty("--mobile-header-border-alpha", (0.32 * glassProgress).toFixed(3));
  header.style.setProperty("--mobile-header-shadow-alpha", (0.12 * glassProgress).toFixed(3));
  header.style.setProperty("--mobile-header-blur", `${(18 * glassProgress).toFixed(1)}px`);
  header.classList.toggle("is-mobile-intro-clear", isMobileHeader && glassProgress < 0.45);
}

function updateHeaderTheme() {
  if (!header || body.classList.contains("project-modal-open")) return;

  const headerBottom = header.getBoundingClientRect().bottom;
  const sampleY = Math.min(window.innerHeight - 1, Math.max(0, headerBottom + 18));
  const sampleX = Math.min(window.innerWidth - 1, Math.max(0, window.innerWidth / 2));
  const sampledElement = document.elementFromPoint(sampleX, sampleY);
  const themedSection = sampledElement?.closest?.("[data-nav-theme]");

  header.dataset.theme = themedSection?.dataset.navTheme || "light";
}

function updateActiveNavLink() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const documentHeight = document.documentElement.scrollHeight;
  const sampleX = Math.min(window.innerWidth - 1, Math.max(0, window.innerWidth / 2));
  const sampleY = Math.min(window.innerHeight - 1, Math.max(0, window.innerHeight / 2));
  const sampledElement = document.elementFromPoint(sampleX, sampleY);
  let activeId = "";

  if (sampledElement) {
    const sampledTarget = navSectionTargets.find(({ element }) => element === sampledElement || element.contains(sampledElement));
    activeId = sampledTarget?.id || "";
  }

  if (!activeId) {
    const middleTarget = navSectionTargets.find(({ element }) => {
      const bounds = element.getBoundingClientRect();
      return bounds.top <= sampleY && bounds.bottom > sampleY;
    });
    activeId = middleTarget?.id || "";
  }

  if (window.innerHeight + scrollTop >= documentHeight - 4) {
    activeId = "contact";
  }

  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${activeId}`);
  });

  const heroBottom = hero?.getBoundingClientRect().bottom ?? 0;
  body.classList.toggle("is-past-intro", heroBottom <= sampleY);
}

function updateScrollState() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - window.innerHeight;
  const amount = height > 0 ? scrollTop / height : 0;

  header?.classList.toggle("is-scrolled", scrollTop > 20);
  updateMobileHeaderGlass(scrollTop);
  if (progress) progress.style.transform = `scaleX(${amount})`;
  updateActiveNavLink();
  updateHeaderTheme();
}

function scrollToPageBottom(behavior = prefersReducedMotion ? "auto" : "smooth") {
  const maxScrollTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  if (behavior === "instant") {
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, maxScrollTop);
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
    return;
  }

  window.scrollTo({
    top: maxScrollTop,
    behavior,
  });
}

function handleContactHash() {
  if (window.location.hash !== "#contact") return false;
  scrollToPageBottom("instant");
  updateScrollState();
  return true;
}

updateScrollState();
window.addEventListener("scroll", updateScrollState, { passive: true });
window.addEventListener("resize", updateScrollState);
window.addEventListener("load", handleContactHash, { once: true });

if (window.location.hash === "#contact") {
  window.requestAnimationFrame(handleContactHash);
}

navToggle?.addEventListener("click", () => {
  const isOpen = body.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});

nav?.addEventListener("click", (event) => {
  const link = event.target instanceof Element ? event.target.closest("a") : null;
  if (!link) return;

  body.classList.remove("nav-open");
  navToggle?.setAttribute("aria-expanded", "false");
  navToggle?.setAttribute("aria-label", "Open navigation");
  closeProjectModal();
  closeVideoModal();

  if (link.getAttribute("href") === "#contact") {
    event.preventDefault();
    history.pushState(null, "", "#contact");
    scrollToPageBottom(prefersReducedMotion ? "instant" : "smooth");
    window.setTimeout(() => {
      scrollToPageBottom("instant");
      updateActiveNavLink();
    }, prefersReducedMotion ? 0 : 1400);
  }

  window.setTimeout(updateActiveNavLink, 80);
  window.setTimeout(updateActiveNavLink, 500);
});

window.addEventListener("hashchange", () => {
  if (!handleContactHash()) updateActiveNavLink();
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        const delaySeconds = Number.parseFloat(entry.target.style.transitionDelay) || 0;
        window.setTimeout(() => {
          entry.target.style.transitionDelay = "";
        }, 760 + delaySeconds * 1000);
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 6, 5) * 55}ms`;
  revealObserver.observe(element);
});

const skillCarousel = document.querySelector(".skill-groups");
const skillCarouselMedia = window.matchMedia("(max-width: 980px)");

if (skillCarousel && !prefersReducedMotion) {
  const autoScrollSpeed = 34;
  const manualPauseMs = 5000;
  const middlePauseMs = 1000;
  let autoScrollFrame = null;
  let autoScrollPreviousTime = 0;
  let autoScrollDirection = 1;
  let autoScrollPosition = skillCarousel.scrollLeft;
  let pauseUntil = 0;
  let pointerIsDown = false;
  let internalScrollUntil = 0;
  let middlePauseDirection = 0;

  const getMaxScroll = () => Math.max(0, skillCarousel.scrollWidth - skillCarousel.clientWidth);
  const canAutoScrollSkills = () => skillCarouselMedia.matches && getMaxScroll() > 1;
  const setAutoScrolling = (isAutoScrolling) => {
    skillCarousel.classList.toggle("is-auto-scrolling", isAutoScrolling);
  };
  const pauseForManualScroll = () => {
    autoScrollPosition = skillCarousel.scrollLeft;
    pauseUntil = performance.now() + manualPauseMs;
    setAutoScrolling(false);
  };

  const setInternalScroll = (scrollLeft) => {
    autoScrollPosition = scrollLeft;
    internalScrollUntil = performance.now() + 120;
    skillCarousel.scrollLeft = scrollLeft;
  };

  const stepSkillCarousel = (timestamp) => {
    autoScrollFrame = null;

    if (!autoScrollPreviousTime) autoScrollPreviousTime = timestamp;
    const elapsedSeconds = Math.min(timestamp - autoScrollPreviousTime, 80) / 1000;
    autoScrollPreviousTime = timestamp;

    const shouldAutoScroll = canAutoScrollSkills() && !pointerIsDown && timestamp >= pauseUntil;
    setAutoScrolling(shouldAutoScroll);

    if (shouldAutoScroll) {
      const maxScroll = getMaxScroll();
      const middleScroll = maxScroll / 2;
      const nextScroll = autoScrollPosition + autoScrollDirection * autoScrollSpeed * elapsedSeconds;

      if (nextScroll >= maxScroll) {
        setInternalScroll(maxScroll);
        autoScrollDirection = -1;
        middlePauseDirection = 0;
      } else if (nextScroll <= 0) {
        setInternalScroll(0);
        autoScrollDirection = 1;
        middlePauseDirection = 0;
      } else if (
        maxScroll > 24 &&
        middlePauseDirection !== autoScrollDirection &&
        ((autoScrollDirection > 0 && autoScrollPosition < middleScroll && nextScroll >= middleScroll) ||
          (autoScrollDirection < 0 && autoScrollPosition > middleScroll && nextScroll <= middleScroll))
      ) {
        setInternalScroll(middleScroll);
        middlePauseDirection = autoScrollDirection;
        pauseUntil = timestamp + middlePauseMs;
        setAutoScrolling(false);
      } else {
        setInternalScroll(nextScroll);
      }
    }

    autoScrollFrame = window.requestAnimationFrame(stepSkillCarousel);
  };

  skillCarousel.addEventListener(
    "scroll",
    () => {
      if (
        !canAutoScrollSkills() ||
        performance.now() < internalScrollUntil ||
        skillCarousel.classList.contains("is-auto-scrolling")
      ) {
        return;
      }
      pauseForManualScroll();
    },
    { passive: true }
  );

  skillCarousel.addEventListener("pointerdown", () => {
    pointerIsDown = true;
    autoScrollPosition = skillCarousel.scrollLeft;
    internalScrollUntil = 0;
    middlePauseDirection = 0;
    setAutoScrolling(false);
  });

  window.addEventListener("pointerup", () => {
    pointerIsDown = false;
    autoScrollPosition = skillCarousel.scrollLeft;
  });

  window.addEventListener("pointercancel", () => {
    pointerIsDown = false;
    autoScrollPosition = skillCarousel.scrollLeft;
  });

  skillCarouselMedia.addEventListener?.("change", () => {
    pauseUntil = 0;
    autoScrollPreviousTime = 0;
    autoScrollDirection = 1;
    autoScrollPosition = skillCarousel.scrollLeft;
    middlePauseDirection = 0;
    setAutoScrolling(false);
  });

  autoScrollFrame = window.requestAnimationFrame(stepSkillCarousel);
}

const canTiltCards = window.matchMedia("(hover: hover) and (pointer: fine)").matches && !prefersReducedMotion;

document.querySelectorAll("[data-tilt]").forEach((card) => {
  let frame = null;
  let latestEvent = null;

  const applyTilt = () => {
    frame = null;
    if (!latestEvent) return;

    const bounds = card.getBoundingClientRect();
    const pointerX = latestEvent.clientX - bounds.left;
    const pointerY = latestEvent.clientY - bounds.top;
    const x = pointerX / bounds.width - 0.5;
    const y = pointerY / bounds.height - 0.5;

    card.style.setProperty("--card-rotate-x", `${(y * -6).toFixed(2)}deg`);
    card.style.setProperty("--card-rotate-y", `${(x * 7).toFixed(2)}deg`);
    card.style.setProperty("--shine-x", `${((pointerX / bounds.width) * 100).toFixed(2)}%`);
    card.style.setProperty("--shine-y", `${((pointerY / bounds.height) * 100).toFixed(2)}%`);
  };

  const queueTilt = (event) => {
    latestEvent = event;
    if (!frame) frame = window.requestAnimationFrame(applyTilt);
  };

  const resetTilt = () => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = null;
    latestEvent = null;
    card.classList.remove("is-tilting");
    card.style.setProperty("--card-rotate-x", "0deg");
    card.style.setProperty("--card-rotate-y", "0deg");
    card.style.setProperty("--card-lift", "0px");
    card.style.setProperty("--shine-x", "50%");
    card.style.setProperty("--shine-y", "50%");
  };

  card.addEventListener("pointerenter", (event) => {
    if (!canTiltCards) return;
    card.classList.add("is-tilting");
    card.style.setProperty("--card-lift", "-6px");
    queueTilt(event);
  });

  card.addEventListener("pointermove", (event) => {
    if (!canTiltCards) return;
    queueTilt(event);
  });

  card.addEventListener("pointerleave", resetTilt);
  card.addEventListener("pointercancel", resetTilt);
});

if (hero && !prefersReducedMotion) {
  hero.addEventListener("pointermove", (event) => {
    const bounds = hero.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * -14;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -10;
    hero.style.setProperty("--parallax-x", `${x}px`);
    hero.style.setProperty("--parallax-y", `${y}px`);
  });

  hero.addEventListener("pointerleave", () => {
    hero.style.setProperty("--parallax-x", "0px");
    hero.style.setProperty("--parallax-y", "0px");
  });
}

const projectDetails = [
  {
    id: "interval-timer",
    type: "iOS app",
    title: "Interval Timer App",
    summary:
      "A SwiftUI interval timer built around calisthenics workouts, with configurable sets, reps, rest durations, stopwatch behavior, sound alerts, and saved preferences across sessions.",
    images: [
      {
        src: "assets/images/interval-timer-app.png",
        alt: "Three iPhone screens showing the Interval Timer app interface",
      },
    ],
    links: [{ label: "GitHub repository", href: "https://github.com/yegory/WorkoutIntervalTimer" }],
    tags: ["Swift", "SwiftUI", "UserDefaults", "Audio alerts", "Mobile UX"],
    sections: [
      {
        title: "Questions Addressed",
        items: [
          "How to integrate sound alerts without disrupting background audio.",
          "How to make workout setup feel fast, clear, and easy to adjust.",
          "How to keep a timer and stopwatch running together without hurting responsiveness.",
        ],
      },
      {
        title: "Development Steps",
        ordered: true,
        items: [
          "Learned Swift and SwiftUI fundamentals for iOS app development.",
          "Defined workout timer use cases around sets, reps, rest, and alert preferences.",
          "Built the timer core, then added stopwatch behavior and persistent preferences.",
          "Designed navigation screens and interactions for setup and active workout flows.",
          "Integrated background sound alerts and planned room for future sidebar features.",
        ],
      },
      {
        title: "Key Takeaways",
        items: [
          "Built confidence with SwiftUI and mobile state management.",
          "Practiced user-centered design around a tool I use in real workouts.",
          "Learned how concurrent time-based features affect perceived app quality.",
        ],
      },
    ],
  },
  {
    id: "formula1-dbms",
    type: "Database system",
    title: "Formula 1 DBMS",
    summary:
      "A Java Swing and Oracle Database application for managing Formula 1 athletes, teams, cars, sponsorships, race outcomes, and historical performance through a normalized relational model.",
    images: [
      {
        src: "assets/images/formula1-dbms.png",
        alt: "Entity relationship diagram for a Formula 1 database system",
      },
    ],
    links: [{ label: "Implemented queries PDF", href: "assets/docs/implemented-queries.pdf" }],
    tags: ["Java", "Java Swing", "JDBC", "SQL", "Oracle DB", "3NF"],
    sections: [
      {
        title: "Questions Addressed",
        items: [
          "How can custom SQL queries retrieve athlete and race information through JDBC?",
          "How should referential constraints be modeled so the database stays consistent?",
          "How can CRUD operations in a Java Swing GUI stay aligned with the underlying schema?",
        ],
      },
      {
        title: "Implementation Details",
        items: [
          "Modeled athletes, teams, races, cars, and sponsors in an ER design normalized to 3NF.",
          "Wrote SQL DDL and contributed DML commands for data creation and query workflows.",
          "Adjusted schema details around Oracle limitations while preserving data integrity.",
          "Documented project milestones and reached 96% of the stated requirements.",
        ],
      },
      {
        title: "Outcome",
        text:
          "The result was a database-backed prototype that made race and athlete data easier to inspect, compare, update, and validate through a desktop interface.",
      },
    ],
  },
  {
    id: "ubc-course-room-explorer",
    type: "Backend query engine",
    title: "UBC Course and Room Explorer",
    summary:
      "A TypeScript and Node.js query application for extracting insights from dynamic JSON datasets, exposed through an API and built iteratively against strict customer specifications.",
    images: [
      {
        src: "assets/images/ubc-course-room-explorer.png",
        alt: "Facade architecture diagram for the UBC Course and Room Explorer project",
      },
    ],
    links: [],
    tags: ["TypeScript", "Node.js", "Mocha.js", "Chai.js", "Postman", "Agile"],
    sections: [
      {
        title: "Questions Addressed",
        items: [
          "How can a query engine support efficient access over changing JSON data structures?",
          "How should tests cover broad query behavior without becoming brittle?",
          "How can the application be structured for maintainability under an Agile workflow?",
        ],
      },
      {
        title: "Implementation Details",
        items: [
          "Designed components around a facade architecture for cleaner query handling.",
          "Built Mocha and Chai tests to validate expected behavior across query cases.",
          "Implemented a generic query approach for dynamic JSON data access.",
          "Used Postman to test API behavior with binary dataset uploads.",
        ],
      },
      {
        title: "Outcome",
        text:
          "The project strengthened my backend testing habits, API design instincts, and ability to translate customer-facing specifications into reliable implementation details.",
      },
    ],
  },
  {
    id: "sentiment-analysis",
    type: "Machine learning CLI",
    title: "Sentiment Analysis with Naive Bayes",
    summary:
      "A pure Haskell command-line classifier for training on review datasets, preprocessing text, saving model state, validating accuracy, and predicting sentiment from user input.",
    images: [
      {
        src: "assets/images/sentiment-analysis.png",
        alt: "Sentiment analysis project diagram with Haskell and Naive Bayes classification",
      },
    ],
    links: [{ label: "GitHub repository", href: "https://github.com/yegory/NaiveBayes" }],
    tags: ["Haskell", "Naive Bayes", "aeson JSON", "CLI", "Text preprocessing"],
    sections: [
      {
        title: "Questions Addressed",
        items: [
          "How can a Naive Bayes classifier be implemented in Haskell for text classification?",
          "Which preprocessing steps improve reliability for sentiment analysis?",
          "How can a CLI make model training, validation, and prediction usable?",
        ],
      },
      {
        title: "Implementation Details",
        items: [
          "Cleaned text data by removing noise, symbols, and punctuation.",
          "Supported randomized selection for training and testing datasets.",
          "Saved model state for future prediction sessions.",
          "Validated the model on review data and reached accuracy above 85%.",
        ],
      },
      {
        title: "Learning Outcomes",
        text:
          "The project deepened my experience with functional programming, Cabal projects, file handling, maps and sets, JSON serialization, and the practical tradeoffs of implementing machine learning logic from scratch.",
      },
    ],
  },
];

const videoClips = [
  {
    title: "Muscle Ups",
    summary: "Explosive calisthenics pulling and transition practice.",
    src: "assets/videos/calisthenics-1.mp4",
    poster: "assets/images/calisthenics-1-poster.jpg",
    orientation: "portrait",
  },
  {
    title: "Back Lever",
    summary: "Static strength and body-line control work.",
    src: "assets/videos/calisthenics-2.mp4",
    poster: "assets/images/calisthenics-2-poster.jpg",
    orientation: "landscape",
  },
];

const modal = document.querySelector("[data-project-modal]");
const modalDialog = modal?.querySelector(".project-modal__dialog");
const modalImage = modal?.querySelector("[data-modal-image]");
const modalThumbs = modal?.querySelector("[data-modal-thumbs]");
const modalType = modal?.querySelector("[data-modal-type]");
const modalTitle = modal?.querySelector("[data-modal-title]");
const modalSummary = modal?.querySelector("[data-modal-summary]");
const modalLinks = modal?.querySelector("[data-modal-links]");
const modalSections = modal?.querySelector("[data-modal-sections]");
const modalTags = modal?.querySelector("[data-modal-tags]");
const modalPrev = modal?.querySelector("[data-modal-prev]");
const modalNext = modal?.querySelector("[data-modal-next]");
const modalCloseButton = modal?.querySelector("button[data-modal-close]");
let activeProjectIndex = 0;
let lastFocusedElement = null;
let modalCloseTimer = null;

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function setGalleryImage(project, imageIndex) {
  const image = project.images[imageIndex];
  modalImage.src = image.src;
  modalImage.alt = image.alt;

  modalThumbs.querySelectorAll("button").forEach((button, index) => {
    const active = index === imageIndex;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-current", active ? "true" : "false");
  });
}

function renderProject(project) {
  const previousProject = projectDetails[(activeProjectIndex - 1 + projectDetails.length) % projectDetails.length];
  const nextProject = projectDetails[(activeProjectIndex + 1) % projectDetails.length];

  modalType.textContent = project.type;
  modalTitle.textContent = project.title;
  modalSummary.textContent = project.summary;

  modalThumbs.replaceChildren();
  project.images.forEach((image, index) => {
    if (project.images.length <= 1) return;

    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `Show ${project.title} image ${index + 1}`);

    const thumb = document.createElement("img");
    thumb.src = image.src;
    thumb.alt = "";

    button.append(thumb);
    button.addEventListener("click", () => setGalleryImage(project, index));
    modalThumbs.append(button);
  });
  setGalleryImage(project, 0);

  modalLinks.replaceChildren();
  project.links.forEach((link) => {
    const anchor = createTextElement("a", "", link.label);
    anchor.href = link.href;
    anchor.target = "_blank";
    anchor.rel = "noreferrer";
    modalLinks.append(anchor);
  });
  modalLinks.hidden = project.links.length === 0;

  modalSections.replaceChildren();
  project.sections.forEach((sectionData) => {
    const section = document.createElement("section");
    section.append(createTextElement("h3", "", sectionData.title));

    if (sectionData.text) {
      section.append(createTextElement("p", "", sectionData.text));
    }

    if (sectionData.items) {
      const list = document.createElement(sectionData.ordered ? "ol" : "ul");
      sectionData.items.forEach((item) => list.append(createTextElement("li", "", item)));
      section.append(list);
    }

    modalSections.append(section);
  });

  modalTags.replaceChildren();
  project.tags.forEach((tag) => modalTags.append(createTextElement("span", "", tag)));

  modalPrev.setAttribute("aria-label", `Open previous project: ${previousProject.title}`);
  modalNext.setAttribute("aria-label", `Open next project: ${nextProject.title}`);
}

function openProject(index) {
  if (!modal) return;

  activeProjectIndex = index;
  renderProject(projectDetails[activeProjectIndex]);

  if (modalCloseTimer) window.clearTimeout(modalCloseTimer);
  lastFocusedElement = document.activeElement;
  modal.hidden = false;
  body.classList.add("project-modal-open");

  window.requestAnimationFrame(() => {
    modal.classList.add("is-open");
    modalCloseButton?.focus({ preventScroll: true });
  });
}

function openProjectById(projectId) {
  const index = projectDetails.findIndex((project) => project.id === projectId);
  if (index >= 0) openProject(index);
}

function closeProjectModal() {
  if (!modal || modal.hidden) return;

  body.classList.remove("project-modal-open");
  modal.classList.remove("is-open");
  updateScrollState();
  modalCloseTimer = window.setTimeout(() => {
    modal.hidden = true;
  }, 260);

  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus({ preventScroll: true });
  }
}

function showAdjacentProject(direction) {
  activeProjectIndex = (activeProjectIndex + direction + projectDetails.length) % projectDetails.length;
  renderProject(projectDetails[activeProjectIndex]);
  modalDialog?.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
}

document.querySelectorAll("[data-project-open]").forEach((card) => {
  card.addEventListener("click", () => openProjectById(card.dataset.projectOpen));
  if (card.tagName !== "BUTTON") {
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openProjectById(card.dataset.projectOpen);
    });
  }
});

modal?.addEventListener("click", (event) => {
  if (event.target.closest("[data-modal-close]")) closeProjectModal();
});

modalPrev?.addEventListener("click", () => showAdjacentProject(-1));
modalNext?.addEventListener("click", () => showAdjacentProject(1));

const videoModal = document.querySelector("[data-video-modal]");
const videoModalDialog = videoModal?.querySelector(".project-modal__dialog");
const videoPlayer = videoModal?.querySelector("[data-video-player]");
const videoTitle = videoModal?.querySelector("[data-video-title]");
const videoSummary = videoModal?.querySelector("[data-video-summary]");
const videoThumbs = videoModal?.querySelector("[data-video-thumbs]");
const videoCloseButton = videoModal?.querySelector("button[data-video-modal-close]");
let activeVideoIndex = 0;
let videoCloseTimer = null;

function renderVideoThumbs() {
  if (!videoThumbs || videoThumbs.children.length === videoClips.length) return;

  videoThumbs.replaceChildren();
  videoClips.forEach((clip, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "video-modal__thumb";
    button.setAttribute("aria-label", `Show ${clip.title} video`);

    const image = document.createElement("img");
    image.src = clip.poster;
    image.alt = "";

    const playIcon = document.createElement("span");
    playIcon.className = "video-modal__play-icon";
    playIcon.setAttribute("aria-hidden", "true");
    playIcon.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path d="M8 5v14l11-7z"></path></svg>';

    const label = createTextElement("span", "video-modal__thumb-label", clip.title);

    button.append(image, playIcon, label);
    button.addEventListener("click", () => setActiveVideo(index));
    videoThumbs.append(button);
  });
}

function setActiveVideo(index) {
  if (!videoModal || !videoPlayer || !videoTitle || !videoSummary || !videoThumbs) return;

  activeVideoIndex = (index + videoClips.length) % videoClips.length;
  const clip = videoClips[activeVideoIndex];

  videoModal.classList.toggle("is-portrait", clip.orientation === "portrait");
  videoTitle.textContent = clip.title;
  videoSummary.textContent = clip.summary;

  videoPlayer.pause();
  videoPlayer.poster = clip.poster;
  videoPlayer.src = clip.src;
  videoPlayer.load();

  videoThumbs.querySelectorAll("button").forEach((button, thumbIndex) => {
    const active = thumbIndex === activeVideoIndex;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-current", active ? "true" : "false");
  });
}

function openVideoModal(index = 0) {
  if (!videoModal) return;

  renderVideoThumbs();
  setActiveVideo(index);

  if (videoCloseTimer) window.clearTimeout(videoCloseTimer);
  lastFocusedElement = document.activeElement;
  videoModal.hidden = false;
  body.classList.add("project-modal-open");

  window.requestAnimationFrame(() => {
    videoModal.classList.add("is-open");
    videoCloseButton?.focus({ preventScroll: true });
  });
}

function closeVideoModal() {
  if (!videoModal || videoModal.hidden) return;

  videoPlayer?.pause();
  videoPlayer?.removeAttribute("src");
  videoPlayer?.removeAttribute("poster");
  videoPlayer?.load();
  body.classList.remove("project-modal-open");
  videoModal.classList.remove("is-open");
  updateScrollState();
  videoCloseTimer = window.setTimeout(() => {
    videoModal.hidden = true;
  }, 260);

  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus({ preventScroll: true });
  }
}

function showAdjacentVideo(direction) {
  setActiveVideo(activeVideoIndex + direction);
  videoModalDialog?.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
}

function bindVideoTriggers() {
  document.querySelectorAll("[data-video-modal-open]").forEach((trigger) => {
    if (trigger.dataset.videoTriggerBound) return;
    trigger.dataset.videoTriggerBound = "true";
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openVideoModal(0);
    });
  });
}

bindVideoTriggers();
window.addEventListener("load", bindVideoTriggers, { once: true });

videoModal?.addEventListener("click", (event) => {
  if (event.target.closest("[data-video-modal-close]")) closeVideoModal();
});

document.addEventListener("keydown", (event) => {
  const projectModalIsOpen = Boolean(modal && !modal.hidden);
  const videoModalIsOpen = Boolean(videoModal && !videoModal.hidden);
  const activeModal = projectModalIsOpen ? modal : videoModalIsOpen ? videoModal : null;

  if (!activeModal) return;

  if (event.key === "Escape") {
    if (projectModalIsOpen) closeProjectModal();
    if (videoModalIsOpen) closeVideoModal();
    return;
  }

  if (event.key === "ArrowLeft" && projectModalIsOpen) {
    showAdjacentProject(-1);
    return;
  }

  if (event.key === "ArrowRight" && projectModalIsOpen) {
    showAdjacentProject(1);
    return;
  }

  if (event.key === "ArrowLeft" && videoModalIsOpen) {
    showAdjacentVideo(-1);
    return;
  }

  if (event.key === "ArrowRight" && videoModalIsOpen) {
    showAdjacentVideo(1);
    return;
  }

  if (event.key !== "Tab") return;

  const focusable = [...activeModal.querySelectorAll("a[href], button:not([disabled]), video[controls]")].filter(
    (element) => element.offsetParent !== null
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (!first || !last) return;

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
