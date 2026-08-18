// Echoes of History - Main JavaScript File (Fully Updated & Fixed)

// Fallback Articles Data in case blogs.json fails or is empty
const fallbackArticles = [
    {
        title: "The Golden Age of Islamic Science",
        category: "Islamic Era",
        description: "Discover how Muslim scholars preserved and advanced medicine, mathematics, and astronomy during Europe's Dark Ages.",
        image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=1000&q=80",
        link: "contact.html"
    },
    {
        title: "The Rise & Secrets of Ancient Egypt",
        category: "Ancient Civilizations",
        description: "An exploration into the architectural marvels, pharaohs, and engineering behind the Great Pyramids and ancient temples.",
        image: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1000&q=80",
        link: "contact.html"
    },
    {
        title: "Ottoman Empire: Architecture & Legacy",
        category: "Ottoman History",
        description: "Unveiling the diplomatic power, grand domes, and architectural genius of Mimar Sinan and Hagia Sophia.",
        image: "https://images.unsplash.com/photo-1527838832700-5059252407fa?auto=format&fit=crop&w=1000&q=80",
        link: "contact.html"
    }
];

// Function to render articles inside .articles-grid
async function renderArticles() {
    const container = document.querySelector('.articles-grid');
    if (!container) return;

    let articlesData = fallbackArticles;

    try {
        const response = await fetch('./blogs.json');
        if (response.ok) {
            const data = await response.json();
            console.log("Fetched blogs.json data:", data);
            
            // Check if data is a valid array with items that actually have a title
            if (Array.isArray(data) && data.length > 0 && data[0].title) {
                articlesData = data;
            }
        } else {
            console.log("Response not OK:", response.status);
        }
    } catch (error) {
        console.log('Error fetching blogs.json:', error);
    }

    container.innerHTML = articlesData.map(article => `
        <article class="article-card">
            <div class="card-img-wrapper">
                <img src="${article.image || 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1000&q=80'}" alt="${article.title || 'History'}">
            </div>
            <div class="card-body">
                <span class="category-tag">${article.category || article.tag || 'History'}</span>
                <h3>${article.title || 'Untitled Article'}</h3>
                <p>${article.description || article.summary || 'Explore this historical event in detail.'}</p>
                <a href="${article.link || 'contact.html'}" class="read-btn">
                    <span>Read Article</span> <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        </article>
    `).join('');
}

// Live Search Filter Function
function filterArticles() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const filter = searchInput.value.toLowerCase();
    const articleCards = document.querySelectorAll('.article-card');

    articleCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const category = card.querySelector('.category-tag').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();

        if (title.includes(filter) || category.includes(filter) || description.includes(filter)) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
}

// Background Particle Canvas Animation (If Hero Canvas Exists)
function initParticles() {
    const canvas = document.getElementById('particlesCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particlesArray = [];
    const numberOfParticles = 50;

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            this.color = 'rgba(212, 175, 55, 0.5)';
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function init() {
        particlesArray = [];
        for (let i = 0; i < numberOfParticles; i++) {
            particlesArray.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
        }
        requestAnimationFrame(animate);
    }

    init();
    animate();

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        init();
    });
}

// Document Load Event Initialization
document.addEventListener('DOMContentLoaded', () => {
    renderArticles();
    initParticles();
});
