# FastAPI app with endpoints
# Backend python with FastAPI (runs on server)

from fastapi import FastAPI, File, UploadFile, APIRouter, Form
#from fastapi.middleware.cors import CORSMiddleware
from app.services.whisper import transcribe
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
from fpdf import FPDF
from io import BytesIO
#from math import process_math
import tempfile
import shutil
import os
import requests


#app = FastAPI()
router = APIRouter()

class TextInput(BaseModel):
    user_input: str # Custom user prompt for ai
    text: str # cleaned-up text result

# # allow requests from the frontend (localhost:5500 is where frontend is served)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins = ["http://localhost:5500"], # or use localhost:5500
#     allow_credentials = True,
#     allow_methods = ["*"],
#     allow_headers = ["*"],
# )

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[-1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_file_path = temp_file.name

    text = transcribe(temp_file_path)

    return {"transcription": text}

# clean text using given prompt
@router.post("/dictation")
async def dictation(person: str = Form(...), reason: str = Form(...)):
    prompt = f"Can you help edit and perfect my writing? Keep my original thoughts the same do not add a ton of information I just want it to be revised and my grammar to be improved. I am writing this for my {person} and it will be used for {reason}"
    
    response = requests.post("http://localhost:11434/api/generate", json={
        "model": "mistral",
        "prompt": prompt,
        "stream": False
    })

    result = response.json()
    return {"cleaned": result.get("response", "No response from model.")}
    # return {"person": person, "reason": reason}

# clean transcribed audio using user customized prompt
@router.post("/clean")
async def clean_transcribe(payload: TextInput):
    prompt = f"{payload.user_input}: {payload.text}"

    response = requests.post("http://localhost:11434/api/generate", json={
        "model": "mistral",
        "prompt": prompt,
        "stream": False
    })
    
    result = response.json()
    return {"cleaned": result.get("response", "No response from model.")}

@router.post("/download")
async def download_pdf(transcription_text: str = Form(...)):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 10, transcription_text)

    pdf_output = BytesIO()
    pdf.output(pdf_output)
    pdf_output.seek(0)

    return StreamingResponse(
        pdf_output, 
        media_type="application/pdf", 
        headers={"Content-Disposition": "attachment; filename=transcription.pdf"}
    )



