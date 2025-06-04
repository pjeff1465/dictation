# Create dictation web app 

pip freeze > requirements.txt (to add packages to requirements)

## To run and test whisper 
Run Whisper (in different terminal)
python -m 

Run the FastAPI and go to http://localhost:8000
uvicorn dictation.app:app --reload

Frontend is served on localhost:5500
Backend is served on localhost:8000

## Whisper
Whisper is being run locally beacause it is free and open-source. It also allows for privacy, meaning audio will not leave our server and your data will not be sent to OpenAI. Running Whisper locally also allows us to add segmenting. Meaning we can add built in equation builders. 

