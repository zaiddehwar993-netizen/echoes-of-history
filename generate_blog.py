import os
import random
import pathlib
import requests
import json
import re
from google import genai

# Initialize Gemini Client using GitHub Secret GEMINI_API_KEY
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# ----------------------------------------------------------------------
# BIG TOPIC POOL — History + NASA/Space/Science (copyright-free, high-search)
# ----------------------------------------------------------------------
TOPICS = [
    # ---------- History ----------
    {"topic": "The Secrets & Engineering Wonders of Ancient Pyramids", "tag": "Ancient Egypt", "img_prompt": "ancient giza pyramids, golden hour sunset, detailed historic photography, high resolution"},
    {"topic": "The Fall of the Roman Empire: Untold Stories of Courage and Betrayal", "tag": "Roman History", "img_prompt": "ancient rome colosseum, cinematic dramatic lighting, highly detailed historical render"},
    {"topic": "The Golden Age of Islamic Scholars & The House of Wisdom", "tag": "Islamic Golden Age", "img_prompt": "ancient islamic library baghdad, manuscripts, golden lighting, detailed historical interior"},
    {"topic": "Ottoman Empire: Architectural Mastery of Mimar Sinan & Hagia Sophia", "tag": "Ottoman History", "img_prompt": "istanbul hagia sophia, ottoman architecture, majestic evening view, hyperrealistic"},
    {"topic": "The Silk Road: Human Stories Across Ancient Trade Routes", "tag": "Ancient History", "img_prompt": "ancient silk road camel caravan crossing desert, sunset, cinematic historic photography"},
    {"topic": "The Bushido Code: Untold Legacy of Feudal Japan Samurai", "tag": "Asian History", "img_prompt": "samurai warrior standing near cherry blossom, ancient feudal japan, cinematic 8k"},
    {"topic": "Unheard Heroic Stories of World War II & Human Resilience", "tag": "World War II", "img_prompt": "historical world war 2 scene, dramatic emotional atmosphere, ultra realistic photography"},
    {"topic": "Hazrat Umar ibn al-Khattab: Justice, Governance, and Empire Building", "tag": "Islamic History", "img_prompt": "ancient arabian desert city, historic islamic architecture, golden hour, cinematic"},
    {"topic": "Salahuddin Ayyubi: Courage, Chivalry, and the Conquest of Jerusalem", "tag": "Islamic History", "img_prompt": "medieval jerusalem walls, crusader era, dramatic historic painting style render"},
    {"topic": "Tariq ibn Ziyad: The Crossing of Gibraltar and Andalusian Legacy", "tag": "Islamic History", "img_prompt": "strait of gibraltar, medieval ships, dramatic sunset, cinematic historical scene"},
    {"topic": "Cyrus the Great: Human Rights and the Founding of the Persian Empire", "tag": "Persian History", "img_prompt": "ancient persepolis ruins, golden light, majestic historical architecture"},
    {"topic": "Alexander the Great: Tactical Brilliance and the Siege of Tyre", "tag": "Ancient History", "img_prompt": "ancient greek army, siege warfare, dramatic cinematic lighting"},
    {"topic": "Harun al-Rashid: The House of Wisdom and the Islamic Golden Age", "tag": "Islamic Golden Age", "img_prompt": "ancient baghdad palace, golden age islamic art, warm lighting"},
    {"topic": "Suleiman the Magnificent: Lawgiver and Peak of Ottoman Power", "tag": "Ottoman History", "img_prompt": "ottoman sultan palace, topkapi architecture, golden hour, cinematic"},

    # ---------- NASA / Space / Science ----------
    {"topic": "NASA's James Webb Telescope: Deepest Images of the Universe Ever Captured", "tag": "Space Science", "img_prompt": "james webb space telescope, deep space nebula, ultra detailed cosmic photography, 8k"},
    {"topic": "Mars Rover Perseverance: The Hunt for Ancient Life on the Red Planet", "tag": "Space Science", "img_prompt": "mars rover on red planet surface, dusty terrain, nasa mission, realistic space photography"},
    {"topic": "Black Holes Explained: The Invisible Monsters Bending Space and Time", "tag": "Astrophysics", "img_prompt": "black hole accretion disk, deep space, glowing cosmic energy, cinematic 8k render"},
    {"topic": "The Voyager Probes: Humanity's Farthest Journey Into Deep Space", "tag": "Space Exploration", "img_prompt": "voyager space probe, interstellar space, stars background, nasa realistic render"},
    {"topic": "Apollo 11: The Untold Human Story Behind the First Moon Landing", "tag": "Space History", "img_prompt": "apollo astronaut on moon surface, earth in background, nasa historic photography"},
    {"topic": "NASA's Artemis Program: The Race to Return Humans to the Moon", "tag": "Space Exploration", "img_prompt": "artemis rocket launch, night sky, nasa kennedy space center, dramatic lighting"},
    {"topic": "International Space Station: Life and Science 400km Above Earth", "tag": "Space Science", "img_prompt": "international space station orbiting earth, blue planet background, realistic nasa render"},
    {"topic": "Exoplanets Discovered: The Search for Another Earth in the Galaxy", "tag": "Astrophysics", "img_prompt": "distant exoplanet, alien sky, twin suns, cinematic space art, ultra realistic"},
    {"topic": "SpaceX Starship: The Rocket Built to Take Humans to Mars", "tag": "Space Exploration", "img_prompt": "starship rocket launch, flames and smoke, night sky, dramatic cinematic photography"},
    {"topic": "Solar Flares & Space Weather: How the Sun Threatens Earth's Technology", "tag": "Space Science", "img_prompt": "solar flare eruption, sun surface close up, nasa satellite imagery, dramatic orange glow"},
    {"topic": "Hubble Space Telescope: Three Decades of Rewriting the Universe", "tag": "Space Science", "img_prompt": "hubble space telescope, orbiting earth, deep space background, realistic nasa photography"},
    {"topic": "Gravitational Waves: Listening to the Universe's Most Violent Collisions", "tag": "Astrophysics", "img_prompt": "two black holes colliding, gravitational waves ripple effect, deep space cinematic render"},
    {"topic": "The Search for Alien Life: What NASA Is Really Looking For", "tag": "Space Science", "img_prompt": "radio telescope array, night sky full of stars, search for extraterrestrial life, cinematic"},
    {"topic": "Asteroid Impacts: How NASA Is Defending Earth From Space Rocks", "tag": "Space Science", "img_prompt": "asteroid near earth orbit, nasa defense mission, dramatic space scene, realistic render"},
    {"topic": "Chandrayaan & Global Moon Missions: The New Space Race of the 21st Century", "tag": "Space Exploration", "img_prompt": "lunar lander on moon surface, earth rising in background, cinematic space photography"},
]

# Different writing angles — rotated randomly so every article feels unique, not repetitive
WRITING_STYLES = [
    "Write it as an immersive narrative that drops the reader directly into a specific moment or scene, then zooms out to explain its significance.",
    "Write it as an investigative deep-dive, questioning common misconceptions about this topic and revealing lesser-known facts.",
    "Write it centered around one or two specific historical figures or scientists, told through their personal decisions, struggles, and consequences.",
    "Write it as a 'cause and effect' exploration — starting with a small event and tracing how it snowballed into major consequences.",
    "Write it comparing then vs. now — how this event or discovery still echoes in the modern world today.",
    "Write it as a dramatic turning-point story, structured around the single most critical decision, discovery, or moment that changed everything.",
]

OPENING_STYLES = [
    "Start with a vivid sensory scene (sound, smell, sight) instead of a generic statement.",
    "Start with a bold, surprising claim or lesser-known fact that challenges what most people believe.",
    "Start with a rhetorical question that makes the reader curious.",
    "Start mid-action, as if the reader is dropped into a critical moment already in progress.",
]


def get_used_titles(blogs_data):
    """Return a set of all previously published titles (case-insensitive)."""
    return {b.get("title", "").strip().lower() for b in blogs_data}


def pick_unused_topic(blogs_data):
    """Pick a topic that has NEVER been published before. If the whole pool
    is exhausted, ask Gemini itself to invent a brand-new one."""
    used_titles = get_used_titles(blogs_data)
    unused = [t for t in TOPICS if t["topic"].strip().lower() not in used_titles]

    if unused:
        return random.choice(unused)

    # Pool exhausted -> ask AI to invent a completely fresh topic
    print("⚠️ All fixed topics used before. Asking AI to invent a brand-new one...")
    used_list_text = "\n".join(f"- {t}" for t in sorted(used_titles))
    idea_prompt = (
        "Suggest ONE brand-new, highly engaging topic for a history OR NASA/space/science blog article. "
        "It must be completely different from all topics in this list (do not repeat or slightly reword any of them):\n"
        f"{used_list_text}\n\n"
        "Reply with ONLY this exact format, nothing else:\n"
        "TOPIC: <topic title>\n"
        "TAG: <short category tag>\n"
        "IMAGE: <5-8 word visual scene description for an AI image generator>"
    )
    resp = client.models.generate_content(model='gemini-3.6-flash', contents=idea_prompt)
    text = resp.text.strip()

    topic_match = re.search(r"TOPIC:\s*(.+)", text)
    tag_match = re.search(r"TAG:\s*(.+)", text)
    img_match = re.search(r"IMAGE:\s*(.+)", text)

    return {
        "topic": topic_match.group(1).strip() if topic_match else f"New Discovery in Science and History",
        "tag": tag_match.group(1).strip() if tag_match else "General",
        "img_prompt": img_match.group(1).strip() if img_match else "dramatic cinematic historic and scientific scene, 8k",
    }


def generate_article():
    blogs_file = str(pathlib.Path(__file__).parent.resolve() / "blogs.json")
    blogs_data = []

    if os.path.exists(blogs_file):
        try:
            with open(blogs_file, "r", encoding="utf-8") as f:
                blogs_data = json.load(f)
        except Exception:
            blogs_data = []

    selected = pick_unused_topic(blogs_data)
    topic = selected["topic"]
    category = selected["tag"]

    chosen_style = random.choice(WRITING_STYLES)
    chosen_opening = random.choice(OPENING_STYLES)

    # Generate Pollinations AI HD Image URL
    prompt_encoded = requests.utils.quote(selected["img_prompt"])
    image_url = f"https://image.pollinations.ai/prompt/{prompt_encoded}?width=1000&height=600&nologo=true&seed={random.randint(100,999)}"

    # Highly Humanized Emotional Prompt — now also generates a unique SEO title + meta description
    prompt_text = (
        f"You are a deeply passionate human historian/science writer, master storyteller, and veteran journalist. "
        f"Write a deeply moving, highly detailed, completely human-like, and 100% original article about '{topic}'.\n\n"
        f"WRITING ANGLE FOR THIS ARTICLE: {chosen_style}\n"
        f"OPENING STYLE FOR THIS ARTICLE: {chosen_opening}\n\n"
        "STRICT RULES:\n"
        "1. Tone: Deeply emotional, dramatic, narrative, and engaging. Write with real human passion.\n"
        "2. Do NOT follow a repetitive template. Vary sentence rhythm, paragraph length, and subheading style naturally.\n"
        "3. FORBIDDEN AI WORDS: Never use 'Delve', 'In conclusion', 'Tapestry', 'Testament', 'Beacon', 'Moreover', 'Furthermore', 'In summary'.\n"
        "4. Fact Accuracy & Originality: All facts must be 100% accurate and worded uniquely — never copy phrasing from any real article, do not quote any source verbatim.\n"
        "5. High SEO Ranking: Use an engaging, click-worthy <h1> title and clear narrative <h2> subheadings.\n\n"
        "OUTPUT FORMAT — reply with EXACTLY this structure, nothing else, no markdown backticks:\n"
        "TITLE: <a catchy, SEO-optimized, trending-style headline for this article, different wording than the raw topic above>\n"
        "DESCRIPTION: <one unique, compelling meta description under 160 characters, written specifically for THIS article>\n"
        "---CONTENT---\n"
        "<the full raw HTML article here, starting with a single <h1> title>"
    )

    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt_text,
        )

        if response and response.text:
            raw_text = response.text.strip()
            raw_text = raw_text.replace("```html", "").replace("```", "").strip()

            title_match = re.search(r"TITLE:\s*(.+)", raw_text)
            desc_match = re.search(r"DESCRIPTION:\s*(.+)", raw_text)
            content_split = raw_text.split("---CONTENT---")

            seo_title = title_match.group(1).strip() if title_match else topic
            seo_description = desc_match.group(1).strip() if desc_match else f"A deep dive into {topic}."
            raw_html = content_split[1].strip() if len(content_split) > 1 else raw_text

            encoded_title = requests.utils.quote(seo_title)
            article_link = f"blog-detail.html?title={encoded_title}"

            blog_entry = {
                "title": seo_title,
                "category": category,
                "summary": seo_description,
                "description": seo_description,
                "image": image_url,
                "content": raw_html,
                "link": article_link
            }
            blogs_data.insert(0, blog_entry)

            with open(blogs_file, "w", encoding="utf-8") as f:
                json.dump(blogs_data, f, indent=2, ensure_ascii=False)

            print(f"✅ New Human-Like Article Generated: {seo_title}")
        else:
            print("❌ Empty response received from Gemini.")
    except Exception as e:
        print(f"❌ Exception occurred: {e}")


if __name__ == "__main__":
    generate_article()
