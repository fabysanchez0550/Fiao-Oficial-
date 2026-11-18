(() => {
  const photo = document.querySelector(".sale-photo");
  if (!photo) throw new Error("No se encontró el carrusel de historias de Ventas.");

  const image = photo.querySelector("[data-story-image]");
  const caption = photo.querySelector("[data-story-caption]");
  const credit = photo.querySelector("[data-story-credit]");
  const status = photo.querySelector("[data-story-status]");
  const progress = Array.from(photo.querySelectorAll("[data-story-index]"));
  const previous = photo.querySelector("[data-story-previous]");
  const next = photo.querySelector("[data-story-next]");
  const toggle = photo.querySelector("[data-story-toggle]");
  const toggleIcon = toggle && toggle.querySelector("[data-story-toggle-icon]");
  const stories = [
    {
      src: "assets/ventas-panama.jpg",
      alt: "Dos cocos frescos servidos en un puesto de Ciudad de Panamá.",
      caption: "Un fresco de coco para el calor de Panamá.",
      photographer: "Viola Bungard",
      source: "https://www.pexels.com/photo/fresh-coconuts-with-straws-in-panama-city-market-38331049/"
    },
    {
      src: "assets/ventas-parrilla-panama.jpg",
      alt: "Un vendedor prepara chorizos en una parrilla al aire libre en Panamá.",
      caption: "El sabor del puesto, hecho al momento.",
      photographer: "Concep Arroyo",
      source: "https://www.pexels.com/photo/panama-outdoor-bbq-with-smoked-sausages-37839583/"
    },
    {
      src: "assets/ventas-mercado-panama.jpg",
      alt: "Textiles coloridos y una bolsa rotulada PANAMA en un puesto de mercado.",
      caption: "Artesanía con sello panameño.",
      photographer: "Angela Chacón",
      source: "https://www.pexels.com/photo/textile-merchandise-on-market-18063571/"
    },
    {
      src: "assets/ventas-baile-panama.jpg",
      alt: "Una bailarina se presenta en una calle de Ciudad de Panamá mientras un fotógrafo la retrata.",
      caption: "Panamá también se vive en las calles.",
      photographer: "Alejandra Montenegro",
      source: "https://www.pexels.com/photo/woman-dancing-in-street-18049667/"
    },
    {
      src: "assets/ventas-mercado-urbano-panama.jpg",
      alt: "Fotógrafos capturan una escena urbana con puestos de mercado en Panamá.",
      caption: "Un mercado al aire libre, entre gente y movimiento.",
      photographer: "Alejandra Montenegro",
      source: "https://www.pexels.com/photo/group-of-photographers-on-street-in-panama-18049680/"
    },
    {
      src: "assets/ventas-ciudad-panama.jpg",
      alt: "Rascacielos de Ciudad de Panamá al atardecer, junto a la bahía.",
      caption: "La ciudad cambia de ritmo al caer la tarde.",
      photographer: "Mavis Santana",
      source: "https://www.pexels.com/photo/ciudad-panama-28225741/"
    },
    {
      src: "assets/ventas-puerto-panama.jpg",
      alt: "Botes en la bahía con el perfil de Ciudad de Panamá al fondo.",
      caption: "La bahía y la ciudad, frente a frente.",
      photographer: "Wilder Stiven Cardona Lopera",
      source: "https://www.pexels.com/photo/panama-city-skyline-with-boats-in-harbor-31365424/"
    },
    {
      src: "assets/ventas-canal-panama.jpg",
      alt: "Las esclusas del Canal de Panamá y su infraestructura marítima vistas de día.",
      caption: "Las esclusas del Canal, a plena luz.",
      photographer: "Rodolfo Quirós",
      source: "https://www.pexels.com/photo/gray-concrete-buildings-2219139/"
    }
  ];

  if (!image || !caption || !credit || !status || !previous || !next || !toggle || !toggleIcon || progress.length !== stories.length) {
    throw new Error("El carrusel de historias de Ventas no tiene todos sus controles.");
  }

  const duration = 6000;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let currentIndex = 0;
  let isPaused = prefersReducedMotion.matches;
  let timerId = 0;
  let deadline = 0;
  let remaining = duration;
  let resumeWhenVisible = false;
  const preloadedImages = new Set([stories[0].src]);

  const preloadStory = index => {
    const source = stories[index].src;
    if (preloadedImages.has(source)) return;
    const preload = new Image();
    preload.src = source;
    preloadedImages.add(source);
  };

  const updateControls = () => {
    photo.classList.toggle("is-paused", isPaused);
    toggle.setAttribute("aria-pressed", String(!isPaused));
    toggle.setAttribute("aria-label", "Reproducción automática de historias");
    toggleIcon.classList.toggle("bi-play-fill", isPaused);
    toggleIcon.classList.toggle("bi-pause-fill", !isPaused);
  };

  const renderStory = () => {
    const story = stories[currentIndex];
    preloadStory((currentIndex + 1) % stories.length);
    image.classList.add("is-changing");
    image.src = story.src;
    image.alt = story.alt;
    caption.textContent = story.caption;
    credit.href = story.source;
    credit.setAttribute("aria-label", `Créditos de la fotografía: ${story.photographer}, Pexels`);
    credit.title = `Fotografía de ${story.photographer}`;
    status.textContent = `Historia ${currentIndex + 1} de ${stories.length}. ${story.caption}`;

    progress.forEach((button, index) => {
      button.dataset.storyState = index < currentIndex ? "complete" : "upcoming";
      button.removeAttribute("aria-current");
    });
    const activeStory = progress[currentIndex];
    activeStory.dataset.storyState = "active";
    activeStory.setAttribute("aria-current", "step");
    void activeStory.offsetWidth;
    window.requestAnimationFrame(() => image.classList.remove("is-changing"));
  };

  const scheduleNext = () => {
    if (isPaused || document.hidden) return;
    deadline = performance.now() + remaining;
    timerId = window.setTimeout(() => {
      timerId = 0;
      currentIndex = (currentIndex + 1) % stories.length;
      remaining = duration;
      renderStory();
      scheduleNext();
    }, remaining);
  };

  const showStory = index => {
    window.clearTimeout(timerId);
    currentIndex = (index + stories.length) % stories.length;
    remaining = duration;
    renderStory();
    scheduleNext();
  };

  const pause = () => {
    if (isPaused) return;
    remaining = Math.max(0, deadline - performance.now());
    window.clearTimeout(timerId);
    timerId = 0;
    isPaused = true;
    updateControls();
  };

  const resume = () => {
    if (!isPaused) return;
    isPaused = false;
    updateControls();
    if (remaining <= 0) {
      showStory(currentIndex + 1);
      return;
    }
    scheduleNext();
  };

  progress.forEach((button, index) => {
    button.addEventListener("click", () => showStory(index));
  });
  previous.addEventListener("click", () => showStory(currentIndex - 1));
  next.addEventListener("click", () => showStory(currentIndex + 1));
  toggle.addEventListener("click", () => isPaused ? resume() : pause());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      resumeWhenVisible = !isPaused;
      if (resumeWhenVisible) pause();
    } else if (resumeWhenVisible) {
      resumeWhenVisible = false;
      resume();
    }
  });

  updateControls();
  renderStory();
  scheduleNext();
})();
