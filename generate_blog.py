import os
import random
import pathlib
import requests
import json
from google import genai

# Initialize Gemini Client using GitHub Secret GEMINI_API_KEY
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Wide & Highly Searched Historical Topics
TOPICS = [
    {"topic": "The Secrets & Engineering Wonders of Ancient Pyramids", "tag": "Ancient Egypt", "img_prompt": "ancient giza pyramids, golden hour sunset, detailed historic photography, high resolution"},
    {"topic": "The Fall of the Roman Empire: Untold Stories of Courage and Betrayal", "tag": "Roman History", "img_prompt": "ancient rome colosseum, cinematic dramatic lighting, highly detailed historical render"},
    {"topic": "The Golden Age of Islamic Scholars & The House of Wisdom", "tag": "Islamic Golden Age", "img_prompt": "ancient islamic library baghdad, manuscripts, golden lighting, detailed historical interior"},
    {"topic": "Ottoman Empire: Architectural Mastery of Mimar Sinan & Hagia Sophia", "tag": "Ottoman History", "img_prompt": "istanbul hagia sophia, ottoman architecture, majestic evening view, hyperrealistic"},
    {"topic": "The Silk Road: Human Stories Across Ancient Trade Routes", "tag": "Ancient History", "img_prompt": "ancient silk road camel caravan crossing desert, sunset, cinematic historic photography"},
    {"topic": "The Bushido Code: Untold Legacy of Feudal Japan Samurai", "tag": "Asian History", "img_prompt": "samurai warrior standing near cherry blossom, ancient feudal japan, cinematic 8k"},
    {"topic": "Unheard Heroic Stories of World War II & Human Resilience", "tag": "World War II", "img_prompt": "historical world war 2 scene, dramatic emotional atmosphere, ultra realistic photography"}
]

# Different writing angles — rotated randomly so every article feels unique, not repetitive
WRITING_STYLES = [
    "Write it as an immersive narrative that drops the reader directly into a specific moment or scene, then zooms out to explain its significance.",
    "Write it as an investigative deep-dive, questioning common misconceptions about this topic and revealing lesser-known facts.",
    "Write it centered around one or two specific historical figures, told through their personal decisions, struggles, and consequences.",
    "Write it as a 'cause and effect' exploration — starting with a small event and tracing how it snowballed into major historical consequences.",
    "Write it comparing then vs. now — how this historical event still echoes in the modern world today.",
    "Write it as a dramatic turning-point story, structured around the single most critical decision or battle that changed everything.",
]

OPENING_STYLES = [
    "Start with a vivid sensory scene (sound, smell, sight) instead of a generic historical statement.",
    "Start with a bold, surprising claim or lesser-known fact that challenges what most people believe.",
    "Start with a rhetorical question that makes the reader curious.",
    "Start mid-action, as if the reader is dropped into a critical moment already in progress.",
]

def generate_article():
    selected = random.choice(TOPICS)
    topic = selected["topic"]
    category = selected["tag"]

    chosen_style = random.choice(WRITING_STYLES)
    chosen_opening = random.choice(OPENING_STYLES)

    # Generate Pollinations AI HD Image URL
    prompt_encoded = requests.utils.quote(selected["img_prompt"])
    image_url = f"https://image.pollinations.ai/prompt/{prompt_encoded}?width=1000&height=600&nologo=true&seed={random.randint(100,999)}"

    # Highly Humanized Emotional Prompt (with rotating style/tone)
    prompt_text = (
        f"You are a deeply passionate human historian, master storyteller, and veteran writer. Write a deeply moving, highly detailed, and completely human-like historic article about '{topic}'.\n\n"
        f"WRITING ANGLE FOR THIS ARTICLE: {chosen_style}\n"
        f"OPENING STYLE FOR THIS ARTICLE: {chosen_opening}\n\n"
        "STRICT HUMAN WRITING RULES:\n"
        "1. Tone: Deeply emotional, dramatic, narrative, and engaging. Write with real human passion as if you lived through history yourself.\n"
        "2. Do NOT follow a repetitive template. Vary sentence rhythm, paragraph length, and subheading style naturally each time — sometimes questions, sometimes bold statements, sometimes dates/names as headers.\n"
        "3. FORBIDDEN AI WORDS: Never use cliché AI words like 'Delve', 'In conclusion', 'Tapestry', 'Testament', 'Beacon', 'Nesting ground', 'Moreover', 'Furthermore', 'In summary'.\n"
        "4. Fact Accuracy & Originality: All facts, dates, and historical details must be 100% accurate and unique.\n"
        "5. High SEO Ranking: Structure with a single catchy <h1> title, engaging narrative <h2> subheadings, and well-spaced paragraphs.\n"
        "6. Output Format: Return ONLY raw HTML code (without markdown ```html backticks)."
    )

    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt_text,
        )

        if response and response.text:
            raw_html = response.text.strip()
            raw_html = raw_html.replace("```html", "").replace("```", "").strip()

            encoded_title = requests.utils.quote(topic)
            article_link = f"blog-detail.html?title={encoded_title}"

            blogs_file = str(pathlib.Path(__file__).parent.resolve() / "blogs.json")
            blogs_data = []

            if os.path.exists(blogs_file):
                try:
                    with open(blogs_file, "r", encoding="utf-8") as f:
                        blogs_data = json.load(f)
                except Exception:
                    blogs_data = []

            blog_entry = {
                "title": topic,
                "category": category,
                "summary": f"An emotional and deeply researched exploration into {topic}.",
                "description": f"An emotional and deeply researched exploration into {topic}.",
                "image": image_url,
                "content": raw_html,
                "link": article_link
            }
            blogs_data.insert(0, blog_entry)

            with open(blogs_file, "w", encoding="utf-8") as f:
                json.dump(blogs_data, f, indent=2, ensure_ascii=False)

            print("✅ New Human-Like Historical Blog Generated Successfully with Gemini SDK!")
        else:
            print("❌ Empty response received from Gemini.")
    except Exception as e:
        print(f"❌ Exception occurred: {e}")

if __name__ == "__main__":
    generate_article()
