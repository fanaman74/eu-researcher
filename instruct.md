# System Instructions: Building the Legal Data Hunter Web App

You are an expert Python full-stack developer. Your task is to write the complete code for a web application that allows users to search global legal documents using natural language. 

The application will use **Streamlit** for the frontend UI and the **Gemini API (gemini-1.5-flash)** as the AI reasoning engine. Crucially, Gemini will use **Function Calling** to interact with the **Legal Data Hunter REST API**.

Please generate the complete, ready-to-run `app.py` file based on the following specifications:

## 1. Environment & Setup
* The app requires two environment variables: `GEMINI_API_KEY` and `LDH_API_KEY`.
* Use the `google.generativeai` library for Gemini.
* Use the `requests` library for calling the Legal Data Hunter API.
* Use `streamlit` for the chat interface.

## 2. Tool Definitions (Function Calling)
You must define Python functions with clear docstrings and type hints so Gemini knows how and when to use them.

### Tool A: `search_legal_data`
* **Purpose**: Searches the legal database for specific concepts, cases, or laws.
* **Endpoint**: `POST https://legaldatahunter.com/v1/search`
* **Headers**: 
    * `Authorization: Bearer <LDH_API_KEY>`
    * `Content-Type: application/json`
* **Payload**: 
    * `q` (string): The search query.
    * `namespace` (string): Default to `"case_law"`.
    * `top_k` (int): Default to `5`.
* **Returns**: The JSON response from the API (or an error dictionary if it fails).

## 3. Gemini Model Initialization
* Configure the Gemini API key.
* Initialize the model `gemini-1.5-flash`.
* Pass the `search_legal_data` function in the `tools` array.
* Start a chat session with `enable_automatic_function_calling=True`. Store this chat session in Streamlit's `st.session_state` so the conversation history is maintained across reruns.

## 4. Streamlit UI Build
* Set the page title to "Legal Data Hunter AI".
* Create a clean chat interface using `st.chat_message` and `st.chat_input`.
* When the user submits a message:
    1. Display the user's message in the chat UI.
    2. Send the message to the Gemini chat session (`chat.send_message()`).
    3. Gemini will automatically trigger the `search_legal_data` tool if it determines it needs legal context. 
    4. Once Gemini finishes processing the tool's JSON response, it will generate a natural language answer. Display this final text answer in the chat UI.
* Ensure all message history is correctly rendered from `st.session_state` on page load.

## 5. Error Handling
* Include basic `try-except` blocks for the API calls to handle network issues gracefully and return those errors to Gemini so it can inform the user.
