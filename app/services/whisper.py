# loads Whisper model and transcribes audio

import whisper
import os
from fastapi import UploadFile
from app.services.audio_utils import convert_to_wav

model = whisper.load_model("medium")

def transcribe(file_path):
    wav_path = convert_to_wav(file_path)
    result = model.transcribe(wav_path)
    os.remove(wav_path)
    return result["text"]
