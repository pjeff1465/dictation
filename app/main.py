# entry point of app
# use this file to run and start FastAPI

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.api.app import router

app = FastAPI()

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

# include API routes
app.include_router(router)
