# Dictation web app 

pip freeze > requirements.txt (to add packages to requirements)

## To run and test whisper locally
In one terminal run the command to start Whisper backend API:  
uvicorn dictation.app:app --reload  
(running on http://localhost:8000) 

Open another terminal and run to start frontend server:  
python3 -m http:server 5500  
Visit http://localhost:5500 to test!

Frontend is served on localhost:5500  
Backend is served on localhost:8000

## Whisper
Whisper is being run locally beacause it is free and open-source. It also allows for privacy, meaning audio will not leave our server and your data will not be sent to OpenAI. Running Whisper locally also allows us to add segmenting. Meaning we can add built in equation builders. 

