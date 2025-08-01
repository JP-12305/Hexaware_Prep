import os
import ollama
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from serpapi import GoogleSearch
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)

# Agent 1: Generates the high-level course structure using your local Llama3 model
@app.route('/generate-course', methods=['POST'])
def generate_course():
    try:
        data = request.get_json()
        if not data or 'target_role' not in data:
            return jsonify({"error": "Missing target_role"}), 400

        target_role = data['target_role']
        
        prompt = f"""
        You are an expert curriculum designer. Your task is to generate a complete course structure for someone in the role of a "{target_role}".
        You must base the structure and topics on the official developer roadmap for that role found on roadmap.sh.
        
        IMPORTANT: Your response MUST be only a single, valid JSON object. Do not include any text, explanation, or markdown formatting before or after the JSON object.
        
        The JSON object must have the following keys:
        - "name": A concise and professional course title.
        - "description": A brief, one-sentence summary of the course.
        - "modules": An array of 3 to 5 objects, where each object has a single key "title" representing a learning module.
        """
        
        response = ollama.chat(
            model='llama3',
            messages=[{'role': 'user', 'content': prompt}],
            format='json' # This tells Llama3 to output JSON
        )
        
        # The response content is already a JSON object
        return jsonify(json.loads(response['message']['content']))

    except Exception as e:
        print(f"An error occurred in /generate-course: {e}")
        return jsonify({"error": "Failed to generate course structure"}), 500

# Agent 2: Generates a proficiency assessment
@app.route('/generate-proficiency-assessment', methods=['POST'])
def generate_proficiency_assessment():
    try:
        data = request.get_json()
        if not data or 'target_role' not in data:
            return jsonify({"error": "Missing target_role"}), 400

        target_role = data['target_role']
        prompt = f"""
        You are an expert technical assessor. Create a 5-question multiple-choice proficiency quiz on "{target_role}".
        Base the question topics on the key areas from the official roadmap on roadmap.sh.
        
        IMPORTANT: Your response MUST be only a single, valid JSON object with a single key "questions".
        
        "questions" must be an array of 5 objects, where each object has keys "questionText", "options", "correctAnswer", and "topic". The "correctAnswer" must be the full string text of the correct option.
        """
        
        response = ollama.chat(
            model='llama3',
            messages=[{'role': 'user', 'content': prompt}],
            format='json'
        )
        
        return jsonify(json.loads(response['message']['content']))

    except Exception as e:
        print(f"An error occurred in /generate-proficiency-assessment: {e}")
        return jsonify({"error": "Failed to generate assessment"}), 500

# Agent 3: Generates rich content for a single module
@app.route('/generate-module-content', methods=['POST'])
def generate_module_content():
    try:
        data = request.get_json()
        if not data or 'module_title' not in data:
            return jsonify({"error": "Missing module_title"}), 400

        module_title = data['module_title']

        # Step 1: Generate summary with Ollama
        summary_prompt = f"Write a 2-3 sentence summary for the topic: {module_title}."
        summary_response = ollama.chat(model='llama3', messages=[{'role': 'user', 'content': summary_prompt}])
        summary = summary_response['message']['content']

        # Step 2: Search for articles using SerpApi
        article_search = GoogleSearch({ "q": f"{module_title} tutorial or guide", "api_key": os.getenv("SERPAPI_API_KEY") })
        article_results = article_search.get_dict()
        articles = [{"title": r.get("title"), "url": r.get("link")} for r in article_results.get("organic_results", [])[:2]]

        # Step 3: Search for a video using SerpApi
        video_search = GoogleSearch({ "q": f"{module_title} tutorial", "engine": "youtube", "api_key": os.getenv("SERPAPI_API_KEY") })
        video_results = video_search.get_dict()
        video_data = None
        if "video_results" in video_results and len(video_results["video_results"]) > 0:
            first_video = video_results["video_results"][0]
            video_data = {"title": first_video.get("title"), "youtube_id": first_video.get("video_id")}

        return jsonify({
            "summary": summary,
            "articles": articles,
            "video": video_data
        })

    except Exception as e:
        print(f"An error occurred in /generate-module-content: {e}")
        return jsonify({"error": "Failed to generate module content"}), 500

# Optimized Agent: Generates a full, content-rich course in one flow
@app.route('/generate-full-course-content', methods=['POST'])
def generate_full_course_content():
    try:
        data = request.get_json()
        if not data or 'target_role' not in data:
            return jsonify({"error": "Missing target_role"}), 400

        target_role = data['target_role']
        
        # Step 1: Generate the high-level module titles with Ollama
        course_prompt = f"""
        You are an expert curriculum designer. Generate a course structure for a "{target_role}" based on roadmap.sh.
        The response must be a valid JSON object with keys "name", "description", and "modules".
        "modules" must be an array of 3-5 objects, each with a "title" key.
        """
        course_response = ollama.chat(model='llama3', messages=[{'role': 'user', 'content': course_prompt}], format='json')
        course_data = json.loads(course_response['message']['content'])
        
        # Step 2: Loop through titles and generate rich content for each
        for module in course_data.get("modules", []):
            module_title = module.get("title")
            if not module_title:
                continue

            # Generate summary
            summary_prompt = f"Write a 2-3 sentence summary for the topic: {module_title}."
            summary_response = ollama.chat(model='llama3', messages=[{'role': 'user', 'content': summary_prompt}])
            module['summary'] = summary_response['message']['content']

            # Search for articles
            article_search = GoogleSearch({ "q": f"{module_title} tutorial or guide", "api_key": os.getenv("SERPAPI_API_KEY") })
            article_results = article_search.get_dict()
            module['articles'] = [{"title": r.get("title"), "url": r.get("link")} for r in article_results.get("organic_results", [])[:2]]

            # Search for video
            video_search = GoogleSearch({ "q": f"{module_title} tutorial", "engine": "youtube", "api_key": os.getenv("SERPAPI_API_KEY") })
            video_results = video_search.get_dict()
            if "video_results" in video_results and len(video_results["video_results"]) > 0:
                first_video = video_results["video_results"][0]
                module['video'] = {"title": first_video.get("title"), "youtube_id": first_video.get("video_id")}
            else:
                module['video'] = None

        return jsonify(course_data)

    except Exception as e:
        print(f"An error occurred in /generate-full-course-content: {e}")
        return jsonify({"error": "Failed to generate full course content"}), 500

if __name__ == '__main__':
    app.run(port=5002, debug=True)
