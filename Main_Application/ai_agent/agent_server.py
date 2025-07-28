# ai_agent/agent_server.py

import os
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import json

load_dotenv()

app = Flask(__name__)
CORS(app)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash-latest')

@app.route('/generate-course', methods=['POST'])
def generate_course():
    try:
        data = request.get_json()
        if not data or 'target_role' not in data:
            return jsonify({"error": "Missing target_role"}), 400

        target_role = data['target_role']
        prompt = f"""
        You are an expert curriculum designer. Generate a complete course structure for a "{target_role}".
        The response must be a valid JSON object with keys "name", "description", and "modules".
        "modules" must be an array of 3-5 objects, each with a "title" key.
        """

        response = model.generate_content(prompt)
        cleaned_response = response.text.strip().replace("```json", "").replace("```", "")
        json.loads(cleaned_response)
        return cleaned_response, 200, {'Content-Type': 'application/json'}

    except Exception as e:
        print(f"An error occurred in /generate-course: {e}")
        return jsonify({"error": "Failed to generate course structure"}), 500


# This route finds specific learning materials for a single module
@app.route('/generate-module-content', methods=['POST'])
def generate_module_content():
    try:
        data = request.get_json()
        if not data or 'module_title' not in data:
            return jsonify({"error": "Missing module_title"}), 400

        module_title = data['module_title']

        prompt = f"""
        You are an expert learning research assistant. Your task is to find high-quality, publicly available learning resources for a specific topic.
        The topic is: "{module_title}".

        Please provide the following in a valid JSON object format:
        1. A "summary" (string): A 2-3 sentence overview of the topic.
        2. A list of "articles" (array of objects): Find 2-3 relevant articles. Each object must have a "title" and a "url".
        3. A "video" (object): Find one relevant YouTube video. The object must have a "title" and a "youtube_id".

        The response must be a single, valid JSON object. Do not include markdown formatting.
        
        Example response format:
        {{
          "summary": "This module covers the fundamentals of asynchronous programming in JavaScript, including Promises and async/await.",
          "articles": [
            {{ "title": "MDN Web Docs: Asynchronous JavaScript", "url": "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous" }},
            {{ "title": "JavaScript.info: Promises, async/await", "url": "https://javascript.info/async" }}
          ],
          "video": {{ "title": "Async JS Crash Course by Traversy Media", "youtube_id": "PoRJizFvM7s" }}
        }}
        """

        response = model.generate_content(prompt)
        cleaned_response = response.text.strip().replace("```json", "").replace("```", "")
        
        json.loads(cleaned_response)
        
        return cleaned_response, 200, {'Content-Type': 'application/json'}

    except Exception as e:
        print(f"An error occurred in /generate-module-content: {e}")
        return jsonify({"error": "Failed to generate module content"}), 500


if __name__ == '__main__':
    app.run(port=5002, debug=True)
