# FastAPI app with endpoints
# Backend python with FastAPI (runs on server)

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from dictation.transcriber import transcribe
#from math import process_math
import tempfile
import shutil
import os


app = FastAPI()

# allow requests from the frontend (localhost:5500 is where frontend is served)
app.add_middleware(
    CORSMiddleware,
    allow_origins = ["http://localhost:5500"], # or use localhost:5500
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[-1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_file_path = temp_file.name

    text = transcribe(temp_file_path)

    return {"transcription": text}
