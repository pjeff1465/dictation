# Dictation web app 

pip freeze > requirements.txt (to add packages to requirements)

## To run web app locally:

1. **Clone project:**  
    'git clone <repo_url>'

2. **Install dependencies:**  
    'pip install -r requirements.txt'

3. **Start server:**
    * In one terminal, start Whisper on backend API:  
            'uvicorn dictation.app:app --reload'  
            (This will run on http://localhost:8000) 
    * Open another terminal, start frontend server from projects root:  
            'python3 -m http.server 5500'  
    * Visit http://localhost:5500 to test!

**Note:**  
Frontend is served on localhost:5500  
Backend is served on localhost:8000 

## Whisper
Whisper is being run locally beacause it is free and open-source. It also allows for privacy, meaning audio will not leave our server and your data will not be sent to OpenAI. Running Whisper locally also allows us to add segmenting. Meaning we can add built in equation builders. 

## Local LLM Cleanup (Ollama)
Ollama is a tool that lets users run LLMs locally on your machine. Ollama manages model downloads, version, and execution for you, making it easier to work with LLMs without dealing with complex setup.  
1. **Install Ollama**  
    **macOS:** 'brew install ollama'  
    **Windows:**  
    * Visit 'https://ollama.com/download'
    * Download and run the .exe installer
2. **After installation, open command prompt and run:**  
    Run REST API via: 'ollama serve'  
    
Local REST API at: 'http://localhost:11434'
Responses generated at: 'http://localhost:11434/api/generate'

### Mistral Via Ollama
Mistral, developed by Mistral AI team, is the specific LLM we chose to use for text cleanup. It is an advanced model designed for natural language tasks. 
    **Download Mistral**
        'ollama pull mistral'
