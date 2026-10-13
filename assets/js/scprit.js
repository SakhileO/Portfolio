// Hero background video slideshow — crossfades between two muted, controls-free clips
(function heroSlides() {
  const vids = Array.from(document.querySelectorAll('.hero-video'));
  if (!vids.length) return;
  let current = 0;

  vids.forEach(v => { v.muted = true; v.removeAttribute('controls'); });

  function goTo(index) {
    const prev = vids[current];
    const next = vids[index];
    next.currentTime = 0;
    const playPromise = next.play();
    if (playPromise) { playPromise.catch(() => { }); }
    next.classList.add('active');
    prev.classList.remove('active');
    current = index;
  }

  vids.forEach((v, i) => {
    v.addEventListener('ended', () => goTo((i + 1) % vids.length));
  });

  const firstPlay = vids[0].play();
  if (firstPlay) { firstPlay.catch(() => { }); }
})();

const header = document.getElementById('siteHeader');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
});

const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => io.observe(el));

// ---------- Mobile nav drawer ----------
(function mobileDrawer() {
  const toggle = document.getElementById('menuToggle');
  const drawer = document.getElementById('mobileDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  const drawerLinks = document.getElementById('drawerLinks');
  const closeBtn = document.getElementById('drawerClose');
  const sourceLinks = document.querySelector('.nav-links');
  if (!toggle || !drawer || !backdrop || !drawerLinks || !sourceLinks) return;

  // Reuse the same links already in the desktop nav, so there's one source of truth per page
  drawerLinks.innerHTML = sourceLinks.innerHTML;

  function openDrawer() {
    drawer.classList.add('active');
    backdrop.classList.add('active');
    toggle.classList.add('active');
    toggle.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('drawer-open');
  }

  function closeDrawer() {
    drawer.classList.remove('active');
    backdrop.classList.remove('active');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('drawer-open');
  }

  toggle.addEventListener('click', () => {
    drawer.classList.contains('active') ? closeDrawer() : openDrawer();
  });
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);
  drawerLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });
})();

// ---------- About section: scoped Three.js particle/network background ----------
(function aboutScene() {
  const section = document.getElementById('about');
  const canvas = document.getElementById('aboutBg');
  if (!section || !canvas || typeof THREE === 'undefined') return;

  let width = section.clientWidth;
  let height = section.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.z = 50;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 1));
  const blueLight = new THREE.PointLight(0x5b9dff, 7);
  blueLight.position.set(30, 20, 25);
  scene.add(blueLight);
  const deepLight = new THREE.PointLight(0x2f6fed, 5);
  deepLight.position.set(-25, -20, 20);
  scene.add(deepLight);

  // Particles
  const particleCount = 2200;
  const positions = [];
  for (let i = 0; i < particleCount; i++) {
    positions.push((Math.random() - 0.5) * 260, (Math.random() - 0.5) * 260, (Math.random() - 0.5) * 260);
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({
    color: 0x5b9dff, size: 0.4, transparent: true, opacity: 0.7
  }));
  scene.add(particles);

  // Floating wireframe cubes
  const cubes = [];
  for (let i = 0; i < 16; i++) {
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshStandardMaterial({ color: 0x2f6fed, wireframe: true, transparent: true, opacity: 0.5 })
    );
    cube.position.set((Math.random() - 0.5) * 90, (Math.random() - 0.5) * 90, (Math.random() - 0.5) * 60);
    cube.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
    cubes.push(cube);
    scene.add(cube);
  }

  // Wireframe spheres
  const spheres = [];
  for (let i = 0; i < 7; i++) {
    const sphere = new THREE.Mesh(
      new THREE.IcosahedronGeometry(3, 1),
      new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.18 })
    );
    sphere.position.set((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 50);
    spheres.push(sphere);
    scene.add(sphere);
  }

  // Network nodes + connecting lines
  const nodeGroup = new THREE.Group();
  const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x5b9dff });
  const nodePositions = [];
  for (let i = 0; i < 22; i++) {
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), nodeMaterial);
    node.position.set((Math.random() - 0.5) * 70, (Math.random() - 0.5) * 70, (Math.random() - 0.5) * 35);
    nodePositions.push(node.position);
    nodeGroup.add(node);
  }
  scene.add(nodeGroup);

  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x2f6fed, transparent: true, opacity: 0.25 });
  for (let i = 0; i < nodePositions.length - 1; i++) {
    const geometry = new THREE.BufferGeometry().setFromPoints([nodePositions[i], nodePositions[i + 1]]);
    scene.add(new THREE.Line(geometry, lineMaterial));
  }

  // Floating code snippets
  const floatingTexts = [];
  const codeWords = ['</>', '{ }', 'Flutter', 'React', 'Git', 'SQL', 'API', 'JS'];
  const fontLoader = new THREE.FontLoader();
  fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
    codeWords.forEach((word, i) => {
      const geometry = new THREE.TextGeometry(word, { font, size: 1.1, height: 0.05 });
      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xf3ebe1 }));
      mesh.position.set((Math.random() - 0.5) * 70, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 35);
      mesh.userData.speed = 0.002 + Math.random() * 0.002;
      floatingTexts.push(mesh);
      scene.add(mesh);
    });
  });

  // Mouse parallax, scoped to this section only
  let mouseX = 0, mouseY = 0;
  section.addEventListener('mousemove', (e) => {
    const rect = section.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  });

  // Pause rendering when the section is off-screen to save resources
  let isVisible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
    }, { threshold: 0.05 }).observe(section);
  }

  function animate() {
    requestAnimationFrame(animate);
    if (!isVisible) return;

    particles.rotation.y += 0.0006;

    cubes.forEach((cube, i) => {
      cube.rotation.x += 0.003;
      cube.rotation.y += 0.003;
      cube.position.y += Math.sin(Date.now() * 0.001 + i) * 0.01;
    });

    spheres.forEach((sphere, i) => {
      sphere.rotation.x += 0.0015;
      sphere.rotation.y += 0.0015;
      sphere.position.x += Math.sin(Date.now() * 0.0005 + i) * 0.003;
    });

    nodeGroup.rotation.y += 0.001;

    floatingTexts.forEach((text, i) => {
      text.position.y += Math.sin(Date.now() * text.userData.speed + i) * 0.01;
      text.rotation.y += 0.003;
    });

    camera.position.x += (mouseX * 6 - camera.position.x) * 0.03;
    camera.position.y += (-mouseY * 6 - camera.position.y) * 0.03;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    width = section.clientWidth;
    height = section.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });
})();


// ---------- Project modal ----------
const projectData = {
  fieldops: {
    tag: 'Mobile App',
    title: 'Flutter Field Ops',
    overview: 'Flutter Field Ops is a cross-platform field-service app built for on-site technicians. It streamlines job dispatch, lets crews work offline in low-signal areas, and syncs everything back the moment a connection returns.',
    tools: 'Flutter / Dart',
    platforms: 'iOS, Android',
    features: 'Offline-first data sync, real-time job dispatch, GPS check-in, photo-based job reports, push notifications',
    state: 'Provider, Riverpod',
    links: [{ label: '– Contact Me', url: '#contact' }]
  },
  amantungwa: {
    tag: 'Web Browser',
    title: 'AmaNtungwa Ka Mbulazi',
    overview: 'AmaNtungwa Ka Mbulazi International is a socio-economic, member-based organization established in 2025 to unite descendants of Mntungwa, son of Mbulazi. The platform focuses on cultural heritage preservation, community development, member engagement, business initiatives, and socio-economic empowerment through educational, social, and cultural programs.',
    tools: 'WordPress CMS, PHP, HTML5, CSS3, JavaScript, Google Forms Integration',
    platforms: 'Web Browser (Desktop, Tablet, Mobile)',
    features: 'User Registration & Login, Membership Management, News & Announcements, Events & Conference Registration, Gallery, Online Shop, Branch Directory, Contact System, Social Media Integration',
    state: 'Server-side Session Management & Database-driven Content Management',
    links: [{ label: '– Contact Me', url: 'portfolio.html#contact' },
    { label: 'Live Demo', url: 'https://amantungwa.co.za/' }
    ],
  },
  reflection: {
    tag: 'Mobile App',
    title: 'Reflection Notes',
    overview: 'This is a practical educational mobile application that addresses a real problem faced by IT students—keeping track of completed units while reinforcing knowledge through active recall. The project demonstrates good Flutter fundamentals and clean UI design.',
    tools: 'Flutter / Dart',
    platforms: 'Android, iOS',
    features: 'Unit-by-unit reflections log, tap-to-reveal flashcard quizzes, per-question feedback, progress tracking',
    state: 'Provider',
    links: [{ label: '– Contact Me', url: 'portfolio.html#contact' },
    { label: 'GitHub', url: 'https://github.com/SakhileO/Assignment_2023.git' }
    ],
    images: [
      { src: 'assets/elearning-welcome.png', label: 'Welcome Screen' },
      { src: 'assets/elearning-reflection.png', label: 'Unit Reflections' },
      { src: 'assets/elearning-flashcard.png', label: 'Flashcards' }
    ]
  },
  iosg: {
    tag: 'Web/Reseller & Repair',
    title: 'iOS Gadgets & Repair Hub',
    overview: 'iOS Gadgets & Repair Hub is a local iPhone reseller and repair specialist based in Bloemfontein, Free State. The platform showcases quality pre-owned iPhones, accessories, and trusted repair services, all in one place. Customers can browse featured iPhone models, explore repair offerings (screen replacement, battery swaps, and more), read testimonials, and submit enquiries via WhatsApp or the contact form. The site serves as both a product catalogue and a service booking gateway for the local community.',
    tools: 'React.js, JavaScript, Vite, Tailwind CSS, Vercel Deployment',
    platforms: 'Web Browser (Desktop & Mobile Responsive)',
    features: 'iPhone reseller catalogue, accessory listings, repair service showcase, featured iPhone models section, customer testimonials, enquiry/contact form, WhatsApp integration, location & business hours display, trust badges (genuine products, warranty on repairs, certified technicians)',
    state: 'React Hooks (useState/useEffect for UI state and form handling)',
    links: [
        { label: '– Contact Me', url: 'portfolio.html#contact' },
        { label: 'Live Demo', url: 'https://ios-gadgets.onrender.com/' }
    ],
    images: [
        { src: 'assets/images/iosg/img1.png', label: 'Hero — Your iPhone. Your Style.' },
        { src: 'assets/images/iosg/img2.png', label: 'Featured iPhones' },
        { src: 'assets/images/iosg/img3.png', label: 'Why Choose Us' },
        { src: 'assets/images/iosg/img4.png', label: 'Repair Services' },
        { src: 'assets/images/iosg/img5.png', label: 'Customer Testimonials' },
        { src: 'assets/images/iosg/img6.png', label: 'Contact & Location' },
        { src: 'assets/images/iosg/img7.png', label: 'Mobile Responsive View' }
    ]
},


  erisnclock: {
    tag: 'Web/Mobile App',
    title: 'Eris Clock-In Dashboard',
    overview: 'Eris Clock-In is a workforce attendance and employee management platform designed to streamline clock-ins, attendance monitoring, employee tracking, and workforce reporting. The system provides administrators and supervisors with real-time visibility into employee activities while simplifying attendance management across multiple regions and teams.',
    tools: 'React.js, JavaScript/TypeScript, REST APIs, Vercel Deployment',
    platforms: 'Web Browser (Desktop & Mobile Responsive)',
    features: 'Employee clock-in/out tracking, attendance management, dashboard analytics, workforce monitoring, reporting system, user management, role-based access',
    state: 'Likely Context API, Redux, Zustand, or React Hooks (frontend state management)',
    links: [{ label: '– Contact Me', url: 'portfolio.html#contact' },
    { label: 'Live Demo', url: 'https://erisn-clock-in-frontend.vercel.app/' }
    ],
  },
  WeatherFlow: {
    tag: 'Mobile App',
    title: 'WeatherFlow',
    overview: 'WeatherFlow is a modern mobile weather application that provides users with real-time weather information, forecasts, and location-based weather updates. The project demonstrates strong Flutter development skills, API integration, state management, and responsive UI design while delivering a practical everyday utility.',
    tools: 'Flutter / Dart',
    platforms: 'Android, iOS',
    features: 'Real-time weather updates, location-based forecasts, weather search, temperature and condition tracking, responsive UI and Weather API / OpenWeather-based weather services',
    state: 'Provider',
    links: [{ label: '– Contact Me', url: 'portfolio.html#contact' },
    { label: 'GitHub', url: 'https://github.com/SakhileO/WeatherFlow' },
    { label: 'Live Demo', url: 'https://2nnq52cs-5173.inc1.devtunnels.ms/' }],
    images: [
      { src: 'assets/images/WeatherFlow/weatherflow_1.png', label: 'WeatherFlow' },
      { src: 'assets/images/WeatherFlow/weatherflow_2.png', label: 'WeatherFlow' },
    ]
  },
  notereflection: {
    tag: 'Mobile App',
    title: 'Note Reflection',
    overview: 'A unit-by-unit reflection journal for IT students. Learners log takeaways after each course unit and build a personal, searchable study trail as they progress.',
    tools: 'Flutter / Firebase',
    platforms: 'Android, iOS',
    features: 'Unit-based reflection log, searchable notes, progress trail, distraction-free writing view',
    state: 'Provider',
    links: [{ label: '– Contact Me', url: 'portfolio.html#contact' },
    { label: 'GitHub', url: 'https://github.com/SakhileO/Assignment_2023.git' }
    ],
    images: [

    ]
  },
  itcourse: {
    tag: 'Mobile App',
    title: 'IT Course Platform',
    overview: 'A complete e-learning application built for Information Technology students, combining structured lessons, quizzes, and progress tracking in one place.',
    tools: 'Flutter / Firebase / Provider',
    platforms: 'Android, iOS',
    features: 'Structured lessons, quizzes, progress tracking, cloud-synced content via Cloud Firestore',
    state: 'Provider',
    links: [{ label: '– Contact Me', url: 'portfolio.html#contact' }],
    images: [
      { src: 'assets/images/ITE-LearningPlatform/img1.jpeg', label: 'Welcome Screen' },
      { src: 'assets/images/ITE-LearningPlatform/img2.jpeg', label: 'Login' },
      { src: 'assets/images/ITE-LearningPlatform/img3.jpeg', label: 'Create Account' },
      { src: 'assets/images/ITE-LearningPlatform/img4.jpeg', label: 'Home Screen' },
      { src: 'assets/images/ITE-LearningPlatform/img5.jpeg', label: 'Software Screen' },
      { src: 'assets/images/ITE-LearningPlatform/img6.jpeg', label: 'Network Screen' },
      { src: 'assets/images/ITE-LearningPlatform/img7.jpeg', label: 'More Options' }
    ]
  },
  dogwalking: {
    tag: 'Web Platform',
    title: 'UI Dog Walking & Pet Care',
    overview: 'A modern, responsive landing page built for a pet care business, focused on clean UI and subtle animation to make booking a walk feel effortless.',
    tools: 'HTML / CSS / JavaScript',
    platforms: 'Web (responsive)',
    features: 'Responsive layout, animated UI details, service showcase, contact/booking section',
    state: 'N/A',
    links: [
      { label: 'GitHub', url: 'https://github.com/SakhileO/UI-DOG-WALKING-AND-PET-CARE' },
      { label: 'Live Demo', url: 'https://sakhileo.github.io/UI-DOG-WALKING-AND-PET-CARE/' }
    ]
  },
  Lobot_v1: {
    tag: 'Web Platform',
    title: 'Lobot Car Spa',
    overview: 'Lobot v1 is a modern AI-powered chatbot web application that provides users with an interactive conversational interface. The application features a clean, responsive design with smooth animations and an intuitive user experience. It allows users to interact with an AI assistant through a chat interface while maintaining a lightweight and fast web experience. The project is built using the latest Next.js App Router architecture, making it scalable, SEO-friendly, and optimized for modern browsers.',
    tools: 'Next.js 15+ / React 19 / TypeScript / HTML5 / CSS3 / Git / GitHub / GitHub Pages / Visual Studio Code / Responsive Web Design / Component-Based Architecture / Modern UI Animations / AI Chat Interface Design',
    platforms: 'Desktop Browsers / Mobile Browsers / Tablets / Progressive Web Compatible / Cross-Platform Web Application',
    features: 'AI-powered conversational chatbot interface / Real-time chat experience / Responsive layout for all screen sizes / Modern and minimal user interface / Fast page loading / Smooth animations and transitions / Component-based architecture / Optimized performance using Next.js / SEO-friendly application structure / Scalable codebase for future AI integrations / Clean navigation and user-friendly interaction / Modern typography using Geist fonts',
    state: 'React Hooks / Local Component State / Props-Based Data Flow',
    links: [
      { label: 'GitHub', url: 'https://github.com/SakhileO/Lobot_v1' },
      { label: 'Live Demo', url: 'https://sakhileo.github.io/Lobot_v1/' }
    ]
  },
  myportfolio: {
    tag: 'Web Platform',
    title: 'My Portfolio',
    overview: 'A modern, responsive personal portfolio website designed to showcase your professional profile, technical skills, projects, certifications, and contact information. The website serves as a digital resume for recruiters and potential clients, emphasizing clean UI/UX, smooth navigation, and responsive design across devices. It is hosted on GitHub Pages for fast and reliable deployment.',
    tools: 'Visual Studio Code / Git / GitHub / GitHub Pages / Font Awesome / Google Fonts / Responsive Web Design / CSS Flexbox / CSS Grid / CSS Animations & Transitions',
    platforms: 'Desktop / Laptop / Tablet / Mobile Devices / Modern Web Browsers (Chrome, Edge, Firefox, Safari)',
    features: 'Responsive single-page portfolio / Interactive hero section / About Me section / Technical skills showcase / Project portfolio with live demos / Work experience timeline / Education and certifications / Contact section / Social media integration / Downloadable CV/Resume / Smooth scrolling navigation / Animated UI elements / Mobile-friendly navigation / GitHub Pages deployment',
    state: 'JavaScript variables / DOM manipulation / Event listeners / Local UI state (navigation toggles, animations, active sections)',
    links: [{ label: 'GitHub', url: 'https://github.com/SakhileO/My-Portfolio' },
    { label: 'Live Demo', url: 'https://sakhileo.github.io/My-Portfolio/' }]
  },
  myportfolio3D: {
    tag: 'Web Platform',
    title: 'My Portfolio',
    overview: "A multi-page personal portfolio for Sakhile Nkosi, a Software Developer and IT Support Specialist. It's built as four static HTML pages sharing a common design system and JS/CSS base a Home/hero page, an About page, an Experience timeline, and a Projects showcase each with its own scoped Three.js background scene, tied together with a shared dark blue/black theme, a project-detail modal system, and video/image backgrounds throughout.",
    tools: 'Three.js (WebGL 3D scenes), Google Fonts (JetBrains Mono, Inter), Font Awesome (icons on some pages), GSAP + ScrollTrigger (loaded on the Experience page), IntersectionObserver API (scroll-reveal + pause-offscreen 3D), native video/canvas elements no build tooling, no framework, no bundler',
    platforms: 'Web (responsive desktop/tablet/mobile), deployed via Netlify',
    features: 'Full-viewport crossfading hero video background. Multi-page navigation with a shared header/nav and consistent design tokens across pages. Background-video sections (Projects/Skills) with dark overlays for legibility',
    state: 'N/A',
    links: [{ label: '– Contact Me', url: 'portfolio.html#contact' }]
  },
  flashcard: {
    tag: 'Mobile App',
    title: 'Flashcard',
    overview: 'A flashcards mobile application built with Flutter that helps users test their knowledge of software development and networking concepts. The app presents a series of questions and answers in an interactive flip-card format, with progress tracking and navigation between cards.',
    tools: 'Flutter, Dart, flip_card (for card flipping animations), font_awesome_flutter (for icons), Material Design',
    platforms: 'Android, iOS, Web, Windows, macOS, Linux (cross-platform via Flutter)',
    features: 'Interactive flip-card interface with a question on the front and answer on the back. Progress bar showing completion status (10 questions). Navigation buttons to move between cards. Pre-loaded flashcards covering Agile methodology, RESTful APIs, design patterns, OSI model, TCP vs UDP, DNS, switches vs routers, and NAT.',
    state: 'Active development',
    links: [{ label: '– Live Demo', url: 'https://github.com/SakhileO/Flashcard' }],
    images: [
      { src: 'assets/images/flashcard/img1.jpeg', label: 'Welcome Screen' },
      { src: 'assets/images/flashcard/img2.jpeg', label: 'Login' },
      { src: 'assets/images/flashcard/img3.jpeg', label: 'Create Account' },
      { src: 'assets/images/flashcard/img4.jpeg', label: 'Home Screen' },
      { src: 'assets/images/flashcard/img5.jpeg', label: 'Software Screen' }
    ]
  }

};

const modal = document.getElementById('projectModal');
const modalTag = document.getElementById('modalTag');
const modalTitle = document.getElementById('modalTitle');
const modalOverview = document.getElementById('modalOverview');
const modalSpecs = document.getElementById('modalSpecs');
const modalLinks = document.getElementById('modalLinks');
const modalLinksBlock = document.getElementById('modalLinksBlock');
const modalGallery = document.getElementById('modalGallery');
const modalGalleryBlock = document.getElementById('modalGalleryBlock');
const modalClose = document.getElementById('modalClose');

const specIcons = {
  tools: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  platforms: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
  features: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l1.9 5.8H20l-4.9 3.6 1.9 5.8L12 13.6l-5 3.6 1.9-5.8L4 7.8h6.1z"/></svg>',
  state: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="4" height="16"/><rect x="10" y="4" width="4" height="16"/><rect x="17" y="4" width="4" height="16"/></svg>'
};

function openProjectModal(key) {
  const data = projectData[key];
  if (!data) return;

  modalTag.textContent = data.tag;
  modalTitle.textContent = data.title;
  modalOverview.textContent = data.overview;

  modalSpecs.innerHTML = `
      <div class="spec-row">
        <div class="spec-icon">${specIcons.tools}</div>
        <div class="spec-label">Tools &amp; Technologies</div>
        <div class="spec-value">${data.tools}</div>
      </div>
      <div class="spec-row">
        <div class="spec-icon">${specIcons.platforms}</div>
        <div class="spec-label">Available Platforms</div>
        <div class="spec-value">${data.platforms}</div>
      </div>
      <div class="spec-row">
        <div class="spec-icon">${specIcons.features}</div>
        <div class="spec-label">Features</div>
        <div class="spec-value">${data.features}</div>
      </div>
      <div class="spec-row">
        <div class="spec-icon">${specIcons.state}</div>
        <div class="spec-label">State Management</div>
        <div class="spec-value">${data.state}</div>
      </div>
    `;

  const links = data.links || [];
  if (links.length) {
    modalLinks.innerHTML = links.map(l => `<a href="${l.url}" target="_blank" rel="noopener">${l.label} ↗</a>`).join('');
    modalLinksBlock.style.display = '';
  } else {
    modalLinksBlock.style.display = 'none';
  }

  if (data.images && data.images.length) {
    modalGallery.innerHTML = data.images.map(img => `
        <div class="gallery-shot">
          <img src="${img.src}" alt="${img.label}" loading="lazy">
        </div>
      `).join('');
    modalGalleryBlock.style.display = '';
  } else {
    modalGalleryBlock.style.display = 'none';
  }

  modal.classList.add('active');
  document.body.classList.add('modal-open');
}

function closeProjectModal() {
  modal.classList.remove('active');
  document.body.classList.remove('modal-open');
}

document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('click', () => openProjectModal(card.dataset.project));
});

if (modal && modalClose) {
  modalClose.addEventListener('click', closeProjectModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeProjectModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProjectModal();
  });
}
