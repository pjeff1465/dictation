# loads Whisper model and transcribes audio

import whisper
from fastapi import UploadFile
from dictation.audio_utils import convert_to_wav

model = whisper.load_model("base")

def transcribe(file_path):
    wav_path = convert_to_wav(file_path)
    result = model.transcribe(wav_path)
    return result["text"]
