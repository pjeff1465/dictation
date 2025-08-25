# Dictation web app 

pip freeze > requirements.txt (to add packages to requirements)

## To run web app locally:

1. **Clone project:**  
    'git clone <repo_url>'

2. **Install dependencies:**  
    'pip install -r requirements.txt'

3. **Start server:**
    * In one terminal start ollama REST API:
        'ollama serve'
    * In another terminal, start backend API (FastAPI + Whisper):  
            'uvicorn app.main:app --reload'  
            (This will run backend + frontend on http://localhost:8000)
    * Visit 'http://localhost:8000' to test web app! 
    * **Optional:** To view frontend files seperately run: 
            'python3 -m http.server 5500'  
        * Then visit http://localhost:5500 

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

##### kill Ollama
Find Process: lsof -i :11434
Kill Process: kill [PID]

#### Sounds from freesound.org

### Download text into PDF
Sending plain text to backend to locally convert to PDF via FPDF (python library)  
PDF file is generated and saved locally on the server and streamed to client  

## Customization
FPDF allows for easy customization of the PDF on the backend to create pdfs that look like a academic paper, research artical, or formal document, etc.  
Creating PDFs on the backend also allows us to easily add images or tables into the text. It also allows for the customization of font style and sizes.  

FPDF allows you to add headers or footers unlike if you did it on the frontend.