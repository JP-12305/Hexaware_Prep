import os
import ollama
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from serpapi import GoogleSearch
from dotenv import load_dotenv
import concurrent.futures

load_dotenv()
app = Flask(__name__)
CORS(app)
def fetch_content_for_module(module_title):
    """Fetches summary, articles, and video for a single module title."""
    try:
        summary_prompt = f"Write a 2-3 sentence summary for the topic: {module_title}."
        summary_response = ollama.chat(model='llama3', messages=[{'role': 'user', 'content': summary_prompt}])
        summary = summary_response['message']['content']

        article_search = GoogleSearch({ "q": f"{module_title} tutorial or guide", "api_key": os.getenv("SERPAPI_API_KEY") })
        article_results = article_search.get_dict()
        articles = [{"title": r.get("title"), "url": r.get("link")} for r in article_results.get("organic_results", [])[:2]]

        video_search = GoogleSearch({ "q": f"{module_title} tutorial", "engine": "youtube", "api_key": os.getenv("SERPAPI_API_KEY") })
        video_results = video_search.get_dict()
        video_data = None
        if "video_results" in video_results and len(video_results["video_results"]) > 0:
            first_video = video_results["video_results"][0]
            video_data = {"title": first_video.get("title"), "youtube_id": first_video.get("video_id")}

        return {
            "title": module_title,
            "summary": summary,
            "articles": articles,
            "video": video_data
        }
    except Exception as e:
        print(f"Error fetching content for '{module_title}': {e}")
        return { "title": module_title, "summary": "Error generating content.", "articles": [], "video": None }


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
            format='json'
        )
        
        return jsonify(json.loads(response['message']['content']))

    except Exception as e:
        print(f"An error occurred in /generate-course: {e}")
        return jsonify({"error": "Failed to generate course structure"}), 500

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

@app.route('/generate-module-content', methods=['POST'])
def generate_module_content():
    try:
        data = request.get_json()
        if not data or 'module_title' not in data:
            return jsonify({"error": "Missing module_title"}), 400

        module_title = data['module_title']
        content = fetch_content_for_module(module_title)
        return jsonify(content)

    except Exception as e:
        print(f"An error occurred in /generate-module-content: {e}")
        return jsonify({"error": "Failed to generate module content"}), 500

@app.route('/generate-remedial-suggestion', methods=['POST'])
def generate_remedial_suggestion():
    try:
        data = request.get_json()
        if not data or 'failed_topic' not in data:
            return jsonify({"error": "Missing failed_topic"}), 400

        failed_topic = data['failed_topic']
        prompt = f"""
        A learner is struggling with the topic of "{failed_topic}". 
        Your task is to generate a new, more foundational or practical module title and a brief justification for why this module would help.
        
        IMPORTANT: Your response MUST be only a single, valid JSON object with keys "suggestedModuleTitle" and "justification".
        """
        
        response = ollama.chat(
            model='llama3',
            messages=[{'role': 'user', 'content': prompt}],
            format='json'
        )
        
        response_data = json.loads(response['message']['content'])

        if 'justification' not in response_data:
            response_data['justification'] = f"This module is recommended to strengthen the user's understanding of {failed_topic}."


        return jsonify(response_data)

    except Exception as e:
        print(f"An error occurred in /generate-remedial-suggestion: {e}")
        return jsonify({"error": "Failed to generate remedial suggestion"}), 500

@app.route('/generate-full-course-content', methods=['POST'])
def generate_full_course_content():
    try:
        data = request.get_json()
        if not data or 'target_role' not in data:
            return jsonify({"error": "Missing target_role"}), 400

        target_role = data['target_role']
        
        course_prompt = f"""
        You are an expert curriculum designer. Generate a course structure for a "{target_role}" based on roadmap.sh.
        The response must be a valid JSON object with keys "name", "description", and "modules".
        "modules" must be an array of 3-5 objects, each with a "title" key.
        """
        course_response = ollama.chat(model='llama3', messages=[{'role': 'user', 'content': course_prompt}], format='json')
        course_data = json.loads(course_response['message']['content'])
        
        module_titles = [module['title'] for module in course_data.get("modules", [])]

        with concurrent.futures.ThreadPoolExecutor() as executor:
            results = executor.map(fetch_content_for_module, module_titles)
        
        course_data['modules'] = list(results)

        return jsonify(course_data)

    except Exception as e:
        print(f"An error occurred in /generate-full-course-content: {e}")
        return jsonify({"error": "Failed to generate full course content"}), 500

if __name__ == '__main__':
    app.run(port=5002, debug=True)
