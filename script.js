/* ===================================================================
   ECHOES OF HISTORY — MAIN JAVASCRIPT
   Rebuilt to premium/production standard.
   Sections:
     1. Config & Utilities
     2. Articles Grid (render, search, category filter)
     3. Platform Impact — animated stat counters
     4. Article Reader Page — text resize + share buttons
     5. Smooth Scroll Navigation
     6. Google Translate Cleanup (removes the top Google bar)
     7. Background Particle Animation (performance tuned)
     8. Bootstrap
   All init functions are defensive: if the matching markup for a
   feature isn't present on the current page, that feature simply
   skips itself — nothing throws, nothing blocks the rest of the site.
=================================================================== */

'use strict';

/* -------------------------------------------------------------- *
 * 1. CONFIG & UTILITIES
 * -------------------------------------------------------------- */

const fallbackArticles = [
    {
        title: "The Golden Age of Islamic Science",
        category: "Islamic Era",
        description: "Discover how Muslim scholars preserved and advanced medicine, mathematics, and astronomy during Europe's Dark Ages.",
        image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=1000&q=80",
        link: "blog-detail.html?title=The%20Golden%20Age%20of%20Islamic%20Science"
    },
    {
        title: "The Rise & Secrets of Ancient Egypt",
        category: "Ancient Civilizations",
        description: "An exploration into the architectural marvels, pharaohs, and engineering behind the Great Pyramids and ancient temples.",
        image: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1000&q=80",
        link: "blog-detail.html?title=The%20Rise%20%26%20Secrets%20of%20Ancient%20Egypt"
    },
    {
        title: "Ottoman Empire: Architecture & Legacy",
        category: "Ottoman History",
        description: "Unveiling the diplomatic power, grand domes, and architectural genius of Mimar Sinan and Hagia Sophia.",
        image: "https://images.unsplash.com/photo-1527838832700-5059252407fa?auto=format&fit=crop&w=1000&q=80",
        link: "blog-detail.html?title=Ottoman%20Empire%3A%20Architecture%20%26%20Legacy"
    }
];

const DEFAULT_CARD_IMAGE = "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1000&q=80";

/** Escapes text before it is dropped into innerHTML, avoiding markup/XSS from JSON data. */
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/** Small debounce helper so search filtering doesn't run on every keystroke. */
function debounce(fn, delay = 150) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/** Lightweight on-screen toast for feedback (e.g. "Link copied!"). */
function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.setAttribute('role', 'status');
    toast.style.cssText = `
        position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
        background: #14140f; color: #d4af37; padding: 10px 22px;
        border: 1px solid #d4af37; border-radius: 30px; font-size: 14px;
        z-index: 99999; opacity: 0; transition: opacity .25s ease;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4); pointer-events: none;
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = '1'; });
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 250);
    }, 2000);
}

/* -------------------------------------------------------------- *
 * 2. ARTICLES GRID — render, live search, category filter
 * -------------------------------------------------------------- */

let activeCategory = 'all';

async function renderArticles() {
    const container = document.querySelector('.articles-grid');
    if (!container) return;

    let articlesData = fallbackArticles;

    try {
        const response = await fetch('./blogs.json');
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0 && data[0].title) {
                articlesData = data;
            }
        }
    } catch (error) {
        console.warn('Echoes of History: could not load blogs.json, using fallback articles.', error);
    }

    container.innerHTML = articlesData.map(article => `
        <article class="article-card">
            <div class="card-img-wrapper">
                <img src="${escapeHTML(article.image || DEFAULT_CARD_IMAGE)}" alt="${escapeHTML(article.title || 'History')}" loading="lazy">
            </div>
            <div class="card-body">
                <span class="category-tag">${escapeHTML(article.category || article.tag || 'History')}</span>
                <h3>${escapeHTML(article.title || 'Untitled Article')}</h3>
                <p>${escapeHTML(article.description || article.summary || 'Explore this historical event in detail.')}</p>
                <a href="${escapeHTML(article.link || 'contact.html')}" class="read-btn">
                    <span>Read Article</span> <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        </article>
    `).join('');

    // Category tags now exist in the DOM — wire up the filter pills.
    initCategoryFilters();
    applyFilters();
}

/** Shows/creates a "no results" message when a filter combo matches nothing. */
function toggleEmptyState(visibleCount) {
    const container = document.querySelector('.articles-grid');
    if (!container) return;
    let emptyMsg = container.parentElement.querySelector('.no-articles-msg');

    if (visibleCount === 0) {
        if (!emptyMsg) {
            emptyMsg = document.createElement('p');
            emptyMsg.className = 'no-articles-msg';
            emptyMsg.textContent = 'No articles match your search just yet — try a different keyword or category.';
            emptyMsg.style.cssText = 'text-align:center; opacity:0.7; padding:24px 12px; grid-column: 1 / -1;';
            container.after(emptyMsg);
        }
        emptyMsg.style.display = 'block';
    } else if (emptyMsg) {
        emptyMsg.style.display = 'none';
    }
}

/** Unified filter: combines the search box value with the active category pill. */
function applyFilters() {
    const searchInput = document.getElementById('searchInput');
    const term = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const cards = document.querySelectorAll('.article-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const category = card.querySelector('.category-tag')?.textContent.toLowerCase() || '';
        const description = card.querySelector('p')?.textContent.toLowerCase() || '';

        const matchesSearch = !term || title.includes(term) || category.includes(term) || description.includes(term);
        const matchesCategory = activeCategory === 'all' || category === activeCategory;
        const visible = matchesSearch && matchesCategory;

        card.style.display = visible ? 'flex' : 'none';
        if (visible) visibleCount++;
    });

    toggleEmptyState(visibleCount);
}

/** Kept for backward-compatibility: HTML may still call filterArticles() via oninput/onkeyup. */
function filterArticles() {
    applyFilters();
}

/**
 * Wires up the category pills ("All", "Roman History", etc.) that sit above the
 * articles grid. Detected by matching their text against the categories actually
 * present in the rendered cards — no fixed class name required, so this keeps
 * working even if the pill markup changes slightly.
 */
function initCategoryFilters() {
    const grid = document.querySelector('.articles-grid');
    if (!grid) return;
    const section = grid.closest('section') || grid.parentElement;
    if (!section) return;

    const categories = new Set();
    document.querySelectorAll('.category-tag').forEach(tag => {
        categories.add(tag.textContent.trim().toLowerCase());
    });

    const candidates = Array.from(section.querySelectorAll('*')).filter(el =>
        !grid.contains(el) && el.children.length === 0
    );

    const pills = candidates.filter(el => {
        const text = el.textContent.trim().toLowerCase();
        return text === 'all' || categories.has(text);
    });

    if (!pills.length) return;

    pills.forEach(pill => {
        // Avoid double-binding if renderArticles() runs more than once.
        if (pill.dataset.filterBound === 'true') return;
        pill.dataset.filterBound = 'true';
        pill.style.cursor = 'pointer';

        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeCategory = pill.textContent.trim().toLowerCase();
            applyFilters();
        });
    });
}

/* -------------------------------------------------------------- *
 * 3. PLATFORM IMPACT — animated stat counters (50+, 100+, ...)
 * -------------------------------------------------------------- */

const NUMBER_PATTERN = /^\d[\d,]*\s*[%+]?$/;

/** Finds every "leaf" element (no child elements) whose text is a bare number like "50+". */
function getNumberLeafNodes(root) {
    return Array.from(root.querySelectorAll('*')).filter(el =>
        el.children.length === 0 && NUMBER_PATTERN.test(el.textContent.trim())
    );
}

/** Locates the "Platform Impact" section without relying on a specific class name. */
function findImpactContainer() {
    const candidates = document.querySelectorAll('h1, h2, h3, h4, span, p, div');
    let headingEl = null;

    for (const el of candidates) {
        if (el.children.length === 0 && el.textContent.trim().toLowerCase() === 'platform impact') {
            headingEl = el;
            break;
        }
    }
    if (!headingEl) return null;

    let container = headingEl.parentElement;
    for (let i = 0; i < 6 && container; i++) {
        if (getNumberLeafNodes(container).length >= 2) return container;
        container = container.parentElement;
    }
    return null;
}

function animateCount(el) {
    const raw = el.textContent.trim();
    const suffix = raw.replace(/[\d,]/g, '');
    const target = parseInt(raw.replace(/[^\d]/g, ''), 10);
    if (isNaN(target)) return;

    const duration = 1400;
    const start = performance.now();

    function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
        el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
        if (progress < 1) {
            requestAnimationFrame(tick);
        } else {
            el.textContent = target.toLocaleString() + suffix;
        }
    }
    requestAnimationFrame(tick);
}

function initStatCounters() {
    const container = findImpactContainer();
    if (!container) return;
    const numberEls = getNumberLeafNodes(container);
    if (!numberEls.length) return;

    const animated = new WeakSet();
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animated.has(entry.target)) {
                animated.add(entry.target);
                animateCount(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4 });

    numberEls.forEach(el => observer.observe(el));
}

/* -------------------------------------------------------------- *
 * 4. ARTICLE READER PAGE — text resize (A- / A+) + share buttons
 * -------------------------------------------------------------- */

/** Finds the article body by locating the container with the most <p> children. */
function findArticleContentContainer() {
    const paragraphs = document.querySelectorAll('p');
    if (!paragraphs.length) return null;

    const counts = new Map();
    paragraphs.forEach(p => {
        const parent = p.parentElement;
        if (!parent) return;
        counts.set(parent, (counts.get(parent) || 0) + 1);
    });

    let best = null, bestCount = 0;
    counts.forEach((count, parent) => {
        if (count > bestCount) { best = parent; bestCount = count; }
    });
    return best;
}

function initTextResize() {
    const leafEls = Array.from(document.querySelectorAll('button, span, div, a')).filter(el => el.children.length === 0);
    const decreaseBtn = leafEls.find(el => ['a-', 'a−', 'a -'].includes(el.textContent.trim().toLowerCase()));
    const increaseBtn = leafEls.find(el => el.textContent.trim().toLowerCase() === 'a+');
    if (!decreaseBtn || !increaseBtn) return;

    const content = findArticleContentContainer();
    if (!content) return;

    const MIN = 0.85, MAX = 1.4, STEP = 0.1;
    let scale = 1;

    function apply() {
        content.style.fontSize = scale.toFixed(2) + 'em';
        content.style.transition = 'font-size .2s ease';
    }

    decreaseBtn.addEventListener('click', () => {
        scale = Math.max(MIN, +(scale - STEP).toFixed(2));
        apply();
    });
    increaseBtn.addEventListener('click', () => {
        scale = Math.min(MAX, +(scale + STEP).toFixed(2));
        apply();
    });
}

/** Wires WhatsApp / X / Facebook / Copy-Link share icons (Font Awesome classes). */
function initShareButtons() {
    const pageUrl = window.location.href;
    const titleEl = document.querySelector('h1');
    const pageTitle = titleEl ? titleEl.textContent.trim() : document.title;

    const wireLink = (iconSelector, buildHref) => {
        const icon = document.querySelector(iconSelector);
        const link = icon?.closest('a');
        if (link) link.href = buildHref();
    };

    wireLink('.fa-whatsapp', () =>
        `https://wa.me/?text=${encodeURIComponent(pageTitle + ' — ' + pageUrl)}`);
    wireLink('.fa-x-twitter, .fa-twitter', () =>
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(pageTitle)}&url=${encodeURIComponent(pageUrl)}`);
    wireLink('.fa-facebook-f, .fa-facebook', () =>
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`);

    const linkIcon = document.querySelector('.fa-link, .fa-copy');
    const linkTrigger = linkIcon?.closest('a, button') || linkIcon;
    if (linkTrigger) {
        linkTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            if (navigator.clipboard) {
                navigator.clipboard.writeText(pageUrl).then(() => showToast('Link copied!'));
            }
        });
    }
}

/* -------------------------------------------------------------- *
 * 5. SMOOTH SCROLL NAVIGATION
 * -------------------------------------------------------------- */

function initSmoothScrollNav() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        const id = link.getAttribute('href').slice(1);
        if (!id) return;
        link.addEventListener('click', (e) => {
            const target = document.getElementById(id);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

/* -------------------------------------------------------------- *
 * 6. GOOGLE TRANSLATE CLEANUP
 *    Removes the ugly "Google — Translated to: Urdu" bar and the
 *    page-jump it causes, without touching the translation feature
 *    itself.
 * -------------------------------------------------------------- */

function cleanGoogleTranslateArtifacts() {
    const style = document.createElement('style');
    style.textContent = `
        .goog-te-banner-frame, .goog-te-balloon-frame, iframe.skiptranslate {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
        }
        body { top: 0 !important; position: static !important; }
        .goog-text-highlight { background: none !important; box-shadow: none !important; }
        #google_translate_element { display: none !important; }
    `;
    document.head.appendChild(style);

    const resetOffset = () => {
        document.body.style.top = '0px';
        document.documentElement.style.top = '0px';
    };
    resetOffset();

    // Google re-applies an inline "top" offset to <body> the moment it translates —
    // this watcher instantly reverts it, so the page never visibly jumps.
    const observer = new MutationObserver(resetOffset);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
}

/* -------------------------------------------------------------- *
 * 7. BACKGROUND PARTICLE ANIMATION (performance tuned)
 * -------------------------------------------------------------- */

function initParticles() {
    const canvas = document.getElementById('particlesCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const isMobile = window.innerWidth < 768;
    const numberOfParticles = isMobile ? 25 : 50;

    let particlesArray = [];
    let animationId = null;
    let width = window.innerWidth;
    let height = window.innerHeight;

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 2 + 1;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            this.color = 'rgba(212, 175, 55, 0.5)';
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x < 0 || this.x > width) this.speedX *= -1;
            if (this.y < 0 || this.y > height) this.speedY *= -1;
        }
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function init() {
        particlesArray = [];
        for (let i = 0; i < numberOfParticles; i++) particlesArray.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particlesArray.forEach(p => { p.update(); p.draw(); });
        animationId = requestAnimationFrame(animate);
    }

    resize();
    init();
    animate();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { resize(); init(); }, 200);
    }, { passive: true });

    // Pause the animation loop when the tab isn't visible — saves battery/CPU.
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationId);
        } else {
            animate();
        }
    });
}

/* -------------------------------------------------------------- *
 * 8. BOOTSTRAP
 *    Each feature is wrapped in try/catch so that a missing element
 *    on one page (e.g. no particles canvas on blog-detail.html)
 *    never breaks the rest of the site.
 * -------------------------------------------------------------- */
function safeInit(fn, label) {
    try {
        fn();
    } catch (err) {
        console.warn(`Echoes of History: "${label}" skipped —`, err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    safeInit(cleanGoogleTranslateArtifacts, 'google-translate-cleanup');
    safeInit(renderArticles, 'render-articles');
    safeInit(initStatCounters, 'stat-counters');
    safeInit(initTextResize, 'text-resize');
    safeInit(initShareButtons, 'share-buttons');
    safeInit(initSmoothScrollNav, 'smooth-scroll-nav');
    safeInit(initParticles, 'particles');
});
