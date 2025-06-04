import requests

file_path = "dictation/sample_text.mp3"
url = "http://127.0.0.1:8000/transcribe"

with open(file_path, "rb") as f:
    files = {"file": (file_path, f, "audio/mpeg")}
    response = requests.post(url, files=files)

print("Response:", response.json())
