# entry point of app
# use this file to run and start FastAPI

from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.requests import Request
from app.api.app import router
from app.api import app as pdf_router
from io import BytesIO
from fpdf import FPDF
import json

app = FastAPI()
app.include_router(router, prefix="/api")

# allow requests from the frontend (localhost:5500 is where frontend is served)
app.add_middleware(
    CORSMiddleware,
    allow_origins = ["http://localhost:5500"], # or use localhost:5500
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

# mount static files (CSS, js)
app.mount("/static", StaticFiles(directory="app/static"), name="static")
# Jinja2 template directory
templates = Jinja2Templates(directory="app/templates")

# Routes for different pages
# home page
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Dictation page
@app.get("/dictation", response_class=HTMLResponse)
async def about(request: Request):
    return templates.TemplateResponse("dictation.html", {"request": request})

# Clean-up Page
@app.get("/clean", response_class=HTMLResponse)
async def about(request: Request):
    return templates.TemplateResponse("clean.html", {"request": request})

# Create Paper page
@app.get("/paper", response_class=HTMLResponse)
async def about(request: Request):
    return templates.TemplateResponse("paper.html", {"request": request})

# # paper format
# @router.get("/templates/formats/{style}")
# def get_format_template(style: str):
#     try:
#         with open(f"templates/formats/{style}.json") as f:
#             return json.load(f)
#     except FileNotFoundError:
#         raise HTTPException(status_code=404, detail="Format not found")


# @app.post("/download-pdf")
# def create_pdf(transcription_text: str = Form(...)):
#     pdf = FPDF()
#     pdf.add_page()
#     pdf.set_font("Arial", size=12)

#     for line in transcription_text.splitlines():
#         pdf.multi_cell(0, 10, line)

#     pdf_bytes = pdf.output(dest='S').encode('latin1')
#     buffer = BytesIO(pdf_bytes)

#     return StreamingResponse(buffer, media_type="application/pdf", headers={
#         "Content-Disposition": "attachment; filename=transcription.pdf"
#     })

# include API routes
app.include_router(router)
app.include_router(pdf_router.router)
