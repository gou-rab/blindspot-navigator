import os, requests
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__, static_folder='static', template_folder='templates')

SYSTEM_PROMPT_EN = """You are a real-time obstacle detection AI for visually impaired people.
Analyze the image and detect ALL obstacles, hazards, and important elements.

Respond in this EXACT JSON format:
{
  "danger_level": "safe" | "caution" | "danger",
  "alert": "Short urgent voice alert under 20 words",
  "obstacles": ["obstacle 1", "obstacle 2"],
  "direction": "ahead" | "left" | "right" | "all around" | "clear",
  "advice": "One sentence navigation advice"
}

danger_level rules:
- "safe": path is clear, no immediate hazards
- "caution": obstacles present but not immediately dangerous
- "danger": immediate hazard, person must stop or turn

Focus on: people, walls, steps, stairs, vehicles, furniture, doors, curbs, wet floors, animals.
Be concise and urgent. This is for real-time navigation."""

SYSTEM_PROMPT_BN = """আপনি দৃষ্টি প্রতিবন্ধী মানুষের জন্য একটি রিয়েল-টাইম বাধা শনাক্তকারী AI।
ছবি বিশ্লেষণ করুন এবং সমস্ত বাধা, বিপদ শনাক্ত করুন।

এই EXACT JSON ফরম্যাটে উত্তর দিন:
{
  "danger_level": "safe" | "caution" | "danger",
  "alert": "২০ শব্দের মধ্যে জরুরি বাংলা সতর্কতা",
  "obstacles": ["বাধা ১", "বাধা ২"],
  "direction": "সামনে" | "বামে" | "ডানে" | "চারদিকে" | "পরিষ্কার",
  "advice": "একটি বাক্যে নেভিগেশন পরামর্শ"
}

danger_level নিয়ম:
- "safe": পথ পরিষ্কার
- "caution": বাধা আছে কিন্তু তাৎক্ষণিক বিপদ নেই
- "danger": তাৎক্ষণিক বিপদ, থামতে হবে

মনোযোগ দিন: মানুষ, দেয়াল, সিঁড়ি, যানবাহন, আসবাবপত্র, দরজা।"""


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/scan", methods=["POST"])
def scan():
    try:
        data = request.get_json()
        if not data or "image" not in data:
            return jsonify({"error": "No image provided"}), 400

        image_data = data["image"]
        lang       = data.get("lang", "en")

        if not image_data.startswith("data:"):
            image_data = f"data:image/jpeg;base64,{image_data}"

        system_prompt = SYSTEM_PROMPT_BN if lang == "bn" else SYSTEM_PROMPT_EN

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
                "Content-Type": "application/json"
            },
            json={
                "model": "meta-llama/llama-4-scout-17b-16e-instruct",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {"type": "image_url", "image_url": {"url": image_data}},
                            {"type": "text", "text": "Analyze this scene for obstacles and hazards. Respond only in the JSON format specified."}
                        ]
                    }
                ],
                "max_tokens": 300,
                "response_format": {"type": "json_object"}
            },
            timeout=15
        )

        result = response.json()

        if "error" in result:
            return jsonify({"error": result["error"].get("message", "API error")}), 400

        content = result["choices"][0]["message"]["content"]

        import json
        parsed = json.loads(content)

        # Validate and sanitize
        danger_level = parsed.get("danger_level", "caution")
        if danger_level not in ["safe", "caution", "danger"]:
            danger_level = "caution"

        return jsonify({
            "danger_level": danger_level,
            "alert":        parsed.get("alert", "Obstacle detected. Proceed with caution."),
            "obstacles":    parsed.get("obstacles", []),
            "direction":    parsed.get("direction", "ahead"),
            "advice":       parsed.get("advice", ""),
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
