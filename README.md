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
        'python3 -m http:server 5500'  
    * Visit http://localhost:5500 to test!

**Note:**  
Frontend is served on localhost:5500  
Backend is served on localhost:8000 

## Whisper
Whisper is being run locally beacause it is free and open-source. It also allows for privacy, meaning audio will not leave our server and your data will not be sent to OpenAI. Running Whisper locally also allows us to add segmenting. Meaning we can add built in equation builders. 

