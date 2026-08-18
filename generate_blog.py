import os
import requests
import json
import random
import pathlib

# DeepSeek API Key from GitHub Secrets
API_KEY = os.getenv("DEEPSEEK_API_KEY")
URL = "https://api.deepseek.com/chat/completions"

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

def generate_article():
    selected = random.choice(TOPICS)
    topic = selected["topic"]
    category = selected["tag"]
    
    # Generate Relevant Pollinations AI HD Image URL
    prompt_encoded = requests.utils.quote(selected["img_prompt"])
    image_url = f"https://image.pollinations.ai/prompt/{prompt_encoded}?width=1000&height=600&nologo=true&seed={random.randint(100,999)}"

    # Humanized Emotional Prompt
    prompt_text = (
        f"You are a deeply passionate human historian and master storyteller. Write a deeply moving, highly detailed, and human-like historic article about '{topic}'.\n\n"
        "STRICT HUMAN WRITING RULES:\n"
        "1. Tone: Deeply emotional, dramatic, narrative, and engaging. Write with real human passion as if you lived through history.\n"
        "2. FORBIDDEN AI WORDS: Never use words like 'Delve', 'In conclusion', 'Tapestry', 'Testament', 'Beacon', 'Nesting ground'. Avoid robotic summaries.\n"
        "3. Fact Accuracy & Originality: All facts, dates, and figures must be 100% historically true and 100% unique/copyright-free.\n"
        "4. High SEO Ranking: Structure with a single catchy <h1> title, engaging narrative <h2> subheadings, and well-spaced engaging <p> paragraphs.\n"
        "5. Output Format: Return ONLY raw HTML code (without markdown ```html backticks)."
    )

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }

    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "user", "content": prompt_text}
        ],
        "temperature": 0.7
    }

    try:
        response = requests.post(URL, headers=headers, data=json.dumps(payload), timeout=60)
        if response.status_code == 200:
            res_json = response.json()
            raw_html = res_json['choices'][0]['message']['content'].strip()
            
            # Clean Markdown ticks if present
            raw_html = raw_html.replace("```html", "").replace("```", "").strip()

            # Dynamic link pointing to blog-detail.html with the article title
            encoded_title = requests.utils.quote(topic)
            article_link = f"blog-detail.html?title={encoded_title}"

            # Save / Update blogs.json using absolute path
            blogs_file = str(pathlib.Path(__file__).parent.resolve() / "blogs.json")
            blogs_data = []

            if os.path.exists(blogs_file):
                try:
                    with open(blogs_file, "r", encoding="utf-8") as f:
                        blogs_data = json.load(f)
                except Exception:
                    blogs_data = []

            # Add new blog at top
            blog_entry = {
                "title": topic,
                "category": category,
                "description": f"An emotional and deeply researched exploration into {topic}.",
                "image": image_url,
                "content": raw_html,
                "link": article_link
            }
            blogs_data.insert(0, blog_entry)

            # Save updated file
            with open(blogs_file, "w", encoding="utf-8") as f:
                json.dump(blogs_data, f, indent=2, ensure_ascii=False)

            print("✅ New AI Historical Blog Generated Successfully!")
        else:
            print(f"❌ Error from DeepSeek API: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Exception occurred: {e}")

if __name__ == "__main__":
    generate_article()
    
