# Learn Axis: AI-Powered Personalized Learning Platform

Learn Axis is a full-stack MERN application designed to provide personalized learning paths and skill-gap analysis for employees within an enterprise. It leverages a microservice architecture with a dedicated Python AI agent to automate content creation and, in the future, assessment and personalization.

## Tech Stack

* **Frontend:** React.js
* **Backend API:** Node.js, Express.js
* **Database:** MongoDB (with Mongoose)
* **AI Agent:** Python, Flask
* **AI Model:** Google Gemini API

---

## Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

-   Node.js and npm installed
-   Python and pip installed
-   Git installed

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd <your-project-directory>
```

### 2. API Key and Environment Setup

This project requires API keys for MongoDB and the Google Gemini API.

#### **A. Get Your MongoDB Connection String**

1.  Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2.  Create a new **free cluster**.
3.  **Create a Database User:** In your cluster, go to **Database Access** -> **Add New Database User**. Create a username and password. **Save this password securely.**
4.  **Whitelist Your IP Address:** Go to **Network Access** -> **Add IP Address**. For local development, the easiest option is to select **"Allow Access From Anywhere"** (which adds `0.0.0.0/0`).
5.  **Get the Connection String:** Go back to your cluster's main page, click **Connect** -> **Connect your application**. Copy the connection string provided.

#### **B. Get Your Google Gemini API Key**

1.  Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Click **"Create API key in new project"**.
3.  Copy the generated API key. **Save this key securely.**

#### **C. Set Up Environment Variables**

You need to create two `.env` files to store your secret keys.

1.  **Node.js Backend (`/server/.env`):**
    -   Create a file named `.env` inside the `server` folder.
    -   Add your MongoDB connection string and a secret for JWT tokens. Replace `<password>` with the database user password you created.

    ```
    # server/.env
    MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/yourDatabaseName?retryWrites=true&w=majority
    JWT_SECRET=your_super_secret_jwt_string_can_be_anything
    ```

2.  **Python AI Agent (`/ai_agent/.env`):**
    -   Create a file named `.env` inside the `ai_agent` folder.
    -   Add your Gemini API key.

    ```
    # ai_agent/.env
    GEMINI_API_KEY=your_google_gemini_api_key_goes_here
    ```

### 3. Install Dependencies

You need to install dependencies for both the Node.js server and the React frontend.

-   **For the Node.js Server:**
    ```bash
    cd server
    npm install
    cd ..
    ```
-   **For the React Frontend:**
    ```bash
    npm install
    ```
-   **For the Python AI Agent:**
    ```bash
    cd ai_agent
    python -m venv venv
    # On Windows:
    venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    pip install Flask Flask-Cors google-generativeai python-dotenv 
    cd ..
    ```


### 4. Running the Application

```bash
cd Main_Application
```

To run the full application, you will need **three separate terminals**.

#### **Terminal 1: Start the Node.js Backend**

```bash
cd server
npm run dev
```
*You should see "MongoDB connected successfully" and "Server is running on port 5001".*

#### **Terminal 2: Start the Python AI Agent**

```bash
cd ai_agent
# Make sure your virtual environment is activated
python agent_server.py
```
*You should see the Flask server running on port 5002.*

#### **Terminal 3: Start the React Frontend**

```bash
# From the root project directory
npm start
```
*Your application will open in your browser, typically at `http://localhost:3000`.*

You are now ready to use the Learn Axis application!
