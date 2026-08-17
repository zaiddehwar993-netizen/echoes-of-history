const fs = require('fs');
const https = require('https');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Mixed Global & Islamic Historical Topics
const topics = [
  "Hazrat Umar ibn al-Khattab: The Justice, Governance, and Empire Building",
  "Salahuddin Ayyubi: Courage, Chivalry, and the Conquest of Jerusalem",
  "Tariq ibn Ziyad: The Crossing of Gibraltar and Andalusian Legacy",
  "Cyrus the Great: Human Rights and the Founding of the Persian Empire",
  "Alexander the Great: Tactical Brilliance and the Siege of Tyre",
  "Julius Caesar: Crossing the Rubicon and the Fall of the Roman Republic",
  "Harun al-Rashid: The House of Wisdom and the Islamic Golden Age",
  "Napoleon Bonaparte: Strategic Genius and the Battle of Austerlitz",
  "Imam Shamil: The Lion of Dagestan and Resistance in the Caucasus",
  "Suleiman the Magnificent: Lawgiver and Peak of Ottoman Power"
];

const selectedTopic = topics[Math.floor(Math.random() * topics.length)];

const prompt = `Write an extremely powerful, engaging, storytelling-style historical article about: "${selectedTopic}".
Requirements:
1. Return ONLY valid JSON format without markdown wrappers.
2. The article MUST be 100% unique, original, human-like, and plagiarism-free to avoid copyright issues.
3. Keep the tone gripping and educational so the reader never gets bored.
4. Structure:
{
  "id": "unique-slug-id",
  "title": "A Catchy, Unique, and Relevant Headline tailored to the content",
  "tag": "Era/Civilization Tag",
  "image": "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80",
  "summary": "An intriguing 2-sentence hook preview",
  "content": "Full detailed story (4-5 paragraphs) focused on leadership, key historical decisions, and life lessons."
}`;

async function generateBlog() {
  console.log(`Generating article for: ${selectedTopic}`);
  
  const payload = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }]
  });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        const rawText = response.candidates[0].content.parts[0].text;
        const cleanJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const blogArticle = JSON.parse(cleanJsonText);

        blogArticle.id = selectedTopic.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
        blogArticle.date = new Date().toISOString().split('T')[0];

        let blogs = [];
        if (fs.existsSync('blogs.json')) {
          const fileData = fs.readFileSync('blogs.json', 'utf8');
          blogs = JSON.parse(fileData || '[]');
        }

        blogs.unshift(blogArticle);
        fs.writeFileSync('blogs.json', JSON.stringify(blogs, null, 2));
        console.log("Powerful article generated and saved!");

      } catch (err) {
        console.error("Parsing Error:", err, data);
      }
    });
  });

  req.on('error', (e) => console.error("API Error:", e));
  req.write(payload);
  req.end();
}

generateBlog();
