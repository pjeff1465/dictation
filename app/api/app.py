# FastAPI app with endpoints
# Backend python with FastAPI (runs on server)

from fastapi import FastAPI, File, UploadFile, APIRouter, Form, Request, HTTPException
#from fastapi.middleware.cors import CORSMiddleware
from app.services.whisper import transcribe
from pydantic import BaseModel
from fastapi.responses import StreamingResponse, JSONResponse
from fpdf import FPDF
from io import BytesIO
from typing import Annotated
from datetime import datetime
#from math import process_math
import tempfile
import shutil
import os
import requests
import re
import json
import httpx
import asyncio


#app = FastAPI()
router = APIRouter()

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
#BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(BASE_DIR, "app", "templates", "formats")

STYLE_TEMPLATES = {
    "academic": {
        "sections": ["Header", "Introduction", "Body", "Conclusion"],
        "prompts": {
            "Header": (
                "Extract the following details as JSON with keys: title, authors, professor. "
                "Example output: {{\"title\": \"...\", \"authors\": \"...\", \"professor\": \"...\"}} "
                "Input text: {text}"
            ),
            "Introduction": "Summarize and parse out the introduction section, keeping main points clear and concise. Do not include information that is in the header. Text: {text}",
            "Body": "Summarize and parse out the main body of the academic paper. Also do not include info from the header this is supposed to be the body section to a paper where the paper is about the intro. Text: {text}",
            "Conclusion": "Summarize the conclusion of the paper. Text: {text}"
        },
        "pdf_settings": {
            "font": ("Arial", 12),
        }
    },
    "magazine": {
        "sections": ["Header", "Lead Paragraph", "Main Content"],
        "prompts": {
            "Header": (
                "Extract the following details as JSON with keys: title, authors. "
                "Example output: {{\"title\": \"...\", \"authors\": \"...\"}}"
                "Input text: {text}"
            ),
            "Lead Paragraph": "Rewrite the lead paragraph to be engaging and clear just like a magazine. Text: {text}",
            "Main Content": "Summarize the main content of the magazine article. And use format of a magazine article. Text: {text}"
        },
        "pdf_settings": {
            "font": ("Times", 12),
        }
    },
    "report": {
        "sections": ["Header", "Abstract", "Introduction", "Methods", "Results", "Discussion", "Appendix"],
        "prompts": {
            "Header": (
                "Extract the following details as JSON with keys: title, authors, department, university, professor. "
                "Example output: {{\"title\": \"...\", \"authors\": \"...\", \"department\": \"...\", \"university\": \"...\", \"professor\": \"...\"}} "
                "Input text: {text}"
            ),
            "Abstract": "Parse out and rewrite the abstract for clarity and conciseness. This is an abstract for a technical paper so do not include information that is in the header. This is about a topic not the people writing it. Which is a one-paragraph summary of the entire study, typically no more than 250 words. Text: {text}",
            "Introduction": "Summarize and parse out the introduction section. Also do not include header information this is an intro for a technical report. Answering the question, What is the topic and why is it worth studying? Text: {text}",
            "Methods": "Summarize, parse out, and rewrite, the methods body of the report. Using the standard format for a methods section of a technical report. Answering the question, What did you do? If possible write all equations in a form where it is an equation and not words. Text: {text}",
            "Results": "Summarize, parse out, and rewrite, the results section of the report. Using the standard format of a results section of a technical report. Answering the question, What did you find? If possible write all equations in a form where it is an equation and not words. Text: {text}",
            "Discussion": "Summarize, parse out, and rewrite the discussion section of the report. Using typical format for a discussion section of a techical report. Answering the question, What is the significance of your results? If possible write all equations in a form where it is an equation and not words. Text: {text}",
            "Appendix": "Summarize, parse out, and rewrite the appendix section of the paper using a typical appendix format for a research technical paper. If appendix section is not needed just leave blank. Appendix is supplementary information (optional): {text}"
        },
        "pdf_settings": {
            "font": ("Times", 12),
        }
    }
}

class TextInput(BaseModel):
    user_input: str # Custom user prompt for ai
    text: str # cleaned-up text result

from fpdf import FPDF

def generate_dynamic_pdf(style: str, sections: dict):
    pdf = FPDF(format='A4', unit='mm')
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # Get font from the style config
    style_config = STYLE_TEMPLATES.get(style.lower(), {})
    font_family, font_size = style_config.get("pdf_settings", {}).get("font", ("Arial", 12))

    # FPDF only supports these fonts natively
    supported_fonts = ["Arial", "Times", "Courier"]
    if font_family not in supported_fonts:
        print(f"[WARNING] Unsupported font '{font_family}' — using Arial instead.")
        font_family = "Arial"

    pdf.set_font(font_family, size=font_size)

    # Title Page (if data is available)
    if any(sections.get(k) for k in ["Title", "Author(s)", "Department", "University", "Professor"]):
        pdf.set_font(font_family, 'B', 20)
        title = sections.get("Title", "")
        if title:
            pdf.cell(0, 10, title, ln=True, align='C')
            pdf.ln(10)

        pdf.set_font(font_family, '', 14)
        for label in ["Author(s)", "Department", "University", "Professor"]:
            value = sections.get(label, "")
            if value:
                pdf.cell(0, 10, f"{label}: {value}", ln=True, align='C')

        pdf.add_page()

    # Add content sections
    for section_title, content in sections.items():
        print(f"[DEBUG PDF] Section: {section_title} | Content: {content[:100]}")
        if section_title in ["Title", "Author(s)", "Department", "University", "Professor"]:
            continue  # skip already shown in title page

        print(f"[ADDING TO PDF] Section: {section_title} | Content: {content[:100]}")

        if content.strip():
            pdf.set_font(font_family, 'B', 16)
            pdf.cell(0, 10, section_title, ln=True)
            pdf.ln(4)

            pdf.set_font(font_family, '', font_size)
            if not isinstance(content, str):
                print(f"[WARNING] Section {section_title} is not a string. Got: {type(content)}")
                continue

            pdf.multi_cell(0, 10, content.strip(), align='J')
            pdf.ln(8)

            # Add footer page number
            # pdf.set_y(-15)
            # pdf.set_font(font_family, 'I', 10)
            # pdf.cell(0, 10, f'Page {pdf.page_no()}', align='C')

    # buffer = BytesIO()
    # pdf.output(buffer)
    # buffer.seek(0)
    pdf_output = pdf.output(dest='S').encode('latin1')
    pdf_buffer = BytesIO(pdf_output)

    return pdf_buffer



@router.get("/templates/formats/{style}")
def get_format_templates(style: str):
    file_path = os.path.join(TEMPLATE_DIR, f"{style}.json")
    print("Looking for template at:", file_path)

    try:
        with open(file_path) as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Format not found")

@router.get("/templates/formats/")
def get_all_format_templates():
    file_path = os.path.join(TEMPLATE_DIR, "formats.json")
    try:
        with open(file_path) as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Formats file not found")

# @router.post("/transcribe")
# async def transcribe_audio(
#         file: UploadFile = File(...),
#         style: str = Form(default="academic"),
#     ):
#     suffix = os.path.splitext(file.filename)[-1] or ".webm"
#     with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
#         shutil.copyfileobj(file.file, temp_file)
#         temp_file_path = temp_file.name

#     raw_text = transcribe(temp_file_path)

#     cleaned_text = re.sub(
#         r"\b(recording|stop recording|pause recording|begin recording|beggin recording|resume recording|recording resumed)[.,!?]?\s*",
#         "",
#         raw_text,
#         flags=re.IGNORECASE
#     ).strip()

#     style_config = STYLE_TEMPLATES.get(style.lower())
#     if not style_config:
#         raise HTTPException(status_code=404, detail="Unsupported style")

#     sections_output = {}
#     for section_name in style_config["sections"]:
#         prompt_template = style_config["prompts"].get(section_name)
#         if not prompt_template:
#             print(f"[SKIP] No prompt template found for section: {section_name}")
#             continue

#         prompt = prompt_template.format(text=cleaned_text)
#         print(f"\n[PROCESSING] Section: {section_name}")
#         print(f"[PROMPT] ->\n{prompt[:500]}")  # print first 500 chars of prompt

#         try:
#             response = requests.post("http://localhost:11434/api/generate", json={
#                 "model": "mistral",
#                 "prompt": prompt,
#                 "stream": False
#             })
#             response.raise_for_status()
#             ai_response = response.json().get("response", "").strip()

#             # Parse header JSON response if needed
#             if section_name.lower() == "header":
#                 try:
#                     parsed_header = json.loads(ai_response)
#                     print(f"[HEADER PARSED] -> {parsed_header}")
#                     #sections_output[section_name] = parsed_header

#                     sections_output["Title"] = parsed_header.get("title", "")
#                     sections_output["Author(s)"] = parsed_header.get("authors", "")
#                     sections_output["Professor"] = parsed_header.get("professor", "")

#                 except Exception as e:
#                     print(f"[HEADER PARSE FAIL] Raw response:\n{ai_response}")
#                     print(f"Failed to parse header section JSON: {e}")
#                     sections_output[section_name] = ai_response
#             else:
#                 print(f"[RESPONSE] {section_name}: {ai_response[:300]}")
#                 sections_output[section_name] = ai_response

#         except Exception as e:
#             print(f"LLM error on section {section_name}:", e)
#             sections_output[section_name] = ""

#     return {"sections": sections_output}
@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    style: str = Form(default="academic"),
    ):
    
    suffix = os.path.splitext(file.filename)[-1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_file_path = temp_file.name

    raw_text = transcribe(temp_file_path)

    # Clean transcribed text
    cleaned_text = re.sub(
        r"\b(recording|stop recording|pause recording|begin recording|beggin recording|resume recording|recording resumed)[.,!?]?\s*",
        "",
        raw_text,
        flags=re.IGNORECASE
    ).strip()

    # Get style template
    style_config = STYLE_TEMPLATES.get(style.lower())
    if not style_config:
        raise HTTPException(status_code=404, detail="Unsupported style")

    sections_output = {}

    for section_name in style_config["sections"]:
        prompt_template = style_config["prompts"].get(section_name)
        if not prompt_template:
            print(f"[SKIP] No prompt template for section: {section_name}")
            continue

        prompt = prompt_template.format(text=cleaned_text)
        print(f"\n[PROCESSING] Section: {section_name}")
        print(f"[PROMPT] ->\n{prompt[:500]}")

        try:
            response = requests.post("http://localhost:11434/api/generate", json={
                "model": "mistral",
                "prompt": prompt,
                "stream": False
            })
            response.raise_for_status()
            ai_response = response.json().get("response", "").strip()
            print(f"[RAW AI RESPONSE] {ai_response}")

            if section_name.lower() == "header":
                try:
                    parsed_header = json.loads(ai_response)
                    print(f"[HEADER PARSED] -> {parsed_header}")

                    # Use consistent lowercase keys or whatever your PDF function expects
                    sections_output["Title"] = parsed_header.get("title", "")
                    sections_output["Author(s)"] = parsed_header.get("authors", "")
                    sections_output["Professor"] = parsed_header.get("professor", "")
                    sections_output["Department"] = parsed_header.get("department", "")
                    sections_output["University"] = parsed_header.get("university", "")

                except Exception as e:
                    print(f"[HEADER PARSE FAIL] Raw:\n{ai_response}")
                    print(f"[ERROR] Failed to parse header JSON: {e}")
                    sections_output["Header"] = ai_response  # fallback to raw string
            else:
                print(f"[RESPONSE] {section_name}: {ai_response[:300]}")
                sections_output[section_name] = ai_response

        except Exception as e:
            error_msg = f"[ERROR] LLM error on section '{section_name}': {e}"
            print(error_msg)
            sections_output[section_name] = error_msg

    return {"sections": sections_output}


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

@router.post("/download-pdf")
async def download_pdf(transcription_text: str = Form(...)):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    # pdf.multi_cell(0, 10, transcription_text)

    for line in transcription_text.splitlines():
        pdf.multi_cell(0, 10, line)

    #pdf_output = BytesIO()
    #pdf_bytes = pdf.output(dest='S').encode('latin1')
    # pdf_output = BytesIO()
    # pdf_output.write(pdf_bytes)
    # pdf_output.seek(0)
    try:
        pdf_bytes = pdf.output(dest='S').encode('latin1')
    except UnicodeEncodeError as e:
        print(f"[Encoding Error] {e}")
        pdf_bytes = pdf.output(dest='S').encode('ascii', errors='replace')

    buffer = BytesIO(pdf_bytes)
    buffer.seek(0)
    # buffer.seek(0)

    return StreamingResponse(
        buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": "attachment; filename=transcription.pdf"}
    )

async def fetch_ai_summary(client, section_key, raw_text, prompt_template):
    try:
        prompt = prompt_template.format(text=raw_text)
        print(f"[DEBUG] Calling LLM for {section_key} with prompt:\n{prompt[:300]}...\n")

        response = await client.post("http://host.docker.internal:11434/api/generate", json={
            "model": "mistral",
            "prompt": prompt,
            "stream": False
        })
        response.raise_for_status()

        #response_text = await response.text()
        data = await response.json()
        result = data.get("response", "").strip()

        print(f"[DEBUG] Response for {section_key}: {result[:100]}")

        # try:
        #     #result = response.json().get("response", "{}")
        #     json_response = await response.json()
        #     result = json_response.get("response", "{}")
        #     if "results" in json_response and len(json_response["results"]) > 0:
        #         result = json_response["results"][0].get("text", "")
            
        # except json.JSONDecodeError:
        #     print(f"[ERROR] Failed to parse JSON response for {section_key}")
        #     result = ""
        return section_key, result
    except Exception as e:
        import traceback
        print(f"[ERROR] AI call failed for section {section_key}: {e}")
        traceback.print_exc()

        return section_key, ""

@router.post("/paper")
async def create_paper_format(request: Request, style: str = Form(default="academic-paper")):
    form = await request.form()
    print("[DEBUG] Raw form:", dict(form))

    print("Form keys:", list(form.keys()))

    style_config = STYLE_TEMPLATES.get(style.lower())
    if not style_config:
        raise HTTPException(status_code=400, detail="Unsupported style")

    def normalize_key(key):
        return key.lower().replace(" ", "").replace("-", "")

    # form_data = {normalize_key(k): v for k, v in form.items()}

    async with httpx.AsyncClient() as client:
        tasks = []

        #form_data = {k.lower(): v for k, v in form.items()}

        # section_key_normalized = normalize_key(section_key)
        # raw_text = form_data.get(section_key_normalized, "")
        normalized_form_data = {normalize_key(k): v for k, v in form.items()}

    # Build a mapping from normalized -> original section key
        normalized_section_keys = {
            normalize_key(section_key): section_key
            for section_key in style_config["sections"]
        }

        for normalized_key, original_key in normalized_section_keys.items():
            raw_text = normalized_form_data.get(normalized_key, "")

            print(f"[Section: {original_key}] Normalized Key: {normalized_key}, Text: {raw_text[:30]}...")

            prompt_template = style_config["prompts"].get(original_key)
            if prompt_template and raw_text.strip():
                tasks.append(fetch_ai_summary(client, original_key, raw_text, prompt_template))
            else:
                print(f"[SKIPPED] No prompt for '{original_key}' or input is empty.")
                tasks.append(asyncio.sleep(0, result=(original_key, raw_text)))

        results = await asyncio.gather(*tasks)

        print("[DEBUG] Raw AI section results:")
        for key, val in results:
            print(f" - {key}: {val[:80]}")

    sections = {}
    for section_key, result in results:
        if section_key.lower() == "header":
            try:
                parsed = json.loads(result)
            except json.JSONDecodeError as e:
                print(f"[ERROR] Failed to parse header JSON: {e}")
                print(f"[RAW HEADER OUTPUT]: {result}")
                parsed = {}

            # if isinstance(parsed, dict) and section_key.lower() == "header":
            sections["Title"] = parsed.get("title", "")
            sections["Author(s)"] = parsed.get("authors", "")
            sections["Department"] = parsed.get("department", "")
            sections["University"] = parsed.get("university", "")
            sections["Professor"] = parsed.get("professor", "") 
        else:
            if not isinstance(result, str):
                result = str(result)

            sections[section_key] = result.strip()
            #sections[section_key.capitalize()] = result.strip()
            # sections[section_key.capitalize()] = result.strip()

    print("Sections to be added to PDF:", sections)

    # pdf = generate_dynamic_pdf(style, sections)

    # pdf_bytes = pdf.output(dest='S').encode('latin1')
    # buffer = BytesIO(pdf_bytes)
    # #pdf.output(buffer)
    # buffer.seek(0)

    print("[DEBUG] Final sections:", sections)

    pdf_buffer = generate_dynamic_pdf(style, sections)

    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers={
        "Content-Disposition": "attachment; filename=paper_format.pdf"
    })

@router.post("/paper-preview")
async def preview_paper(request: Request):
    form = await request.form()
    style = form.get("style", "academic").lower()
    style_config = STYLE_TEMPLATES.get(style)
    if not style_config:
        raise HTTPException(status_code=400, detail="Unknown style")

    parsed_sections = {}

    async with httpx.AsyncClient() as client:
        for section_key in style_config["sections"]:
            raw_text = form.get(section_key) or form.get(section_key.lower()) or ""
            prompt_template = style_config["prompts"].get(section_key)

            if prompt_template and raw_text.strip():
                prompt = prompt_template.format(text=raw_text)
                try:
                    #response = await client.post("http://localhost:11434/api/generate", json={
                    response = await client.post("http://host.docker.internal:11434/api/generate", json={

                        "model": "mistral",
                        "prompt": prompt,
                        "stream": False
                    })
                    response.raise_for_status()
                    result = response.json().get("response", "")
                    parsed_sections[section_key] = result.strip()
                except Exception as e:
                    parsed_sections[section_key] = f"[Error generating section: {e}]"
            else:
                parsed_sections[section_key] = raw_text.strip()

    return JSONResponse(parsed_sections)


# @router.post("/paper")
# async def create_paper_format(request: Request, style: str = Form(default="academic-paper")):
#     form = await request.form()
#     print("Form keys:", list(form.keys()))

#     sections = {}

#     style_config = STYLE_TEMPLATES.get(style.lower())
#     if not style_config:
#         raise HTTPException(status_code=400, detail="Unsupported style")

#     for section_key in style_config["sections"]:
#         raw_text = form.get(section_key) or form.get(section_key.lower()) or ""
#         prompt_template = style_config["prompts"].get(section_key)

#         if prompt_template and raw_text.strip():
#             prompt = prompt_template.format(text=raw_text)
#             try:
#                 response = requests.post("http://localhost:11434/api/generate", json={
#                     "model": "mistral",
#                     "prompt": prompt,
#                     "stream": False
#                 })
#                 response.raise_for_status()
#                 result = response.json().get("response", "{}")
#             except Exception as e:
#                 print(f"Error during AI call for section {section_key}: {e}")
#                 continue

#             try:
#                 parsed = json.loads(result)
#             except json.JSONDecodeError:
#                 print(f"Failed to aprse JSON for section {section_key}: {result}")
#                 parsed = {}

#             # handle parsed content or fallback to raw_text
#             if isinstance(parsed, dict):
#                 # flatten if header or use parsed summary
#                 if section_key.lower() == "header":
#                     sections["Title"] = parsed.get("title", "")
#                     sections["Author(s)"] = parsed.get("authors", "")
#                     sections["Department"] = parsed.get("department", "")
#                     sections["University"] = parsed.get("university", "")
#                 else:
#                     #sections[section_key.capitalize()] = parsed.get("summary", raw_text)
#                     sections[section_key.capitalize()] = result.strip() or raw_text
#             else:
#                 sections[section_key.capitalize()] = raw_text
#         else:
#             sections[section_key.capitalize()] = raw_text

#     # pass style_config["pdf_settings"] to customize PDF generation if needed
#     pdf = generate_dynamic_pdf(style, sections)

#     pdf_output = BytesIO()
#     pdf_bytes = pdf.output(dest='S').encode('latin1')
#     pdf_output.write(pdf_bytes)
#     # pdf.output(pdf_output)
#     #pdf.output = pdf.output(dest='S').encode('latin-1')
#     pdf_output.seek(0)

#     return StreamingResponse(pdf_output, media_type="application/pdf", headers={
#         "Content-Disposition": "attachment; filename=paper_format.pdf"
#     })

@router.post("/paper-format")
async def paper_format(request: Request):
    form = await request.form()
    style = form.get("style", "academic")

    sections = {key: value for key, value in form.items() if key != "style"}

    # pdf = generate_dynamic_pdf(style, sections)
    # pdf_output = pdf.output(dest='S').encode('latin1')
    # pdf_buffer = BytesIO(pdf_output)

    pdf_buffer = generate_dynamic_pdf(style, sections)

    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers={
        "Content-Disposition": "inline; filename=paper_format.pdf"
    })

@router.post("/generate-pdf")
async def generate_pdf(sections: Annotated[list[dict], Form(...)]):
    pdf = FPDF(format='A4', unit='mm')
    pdf.add_page()

    pdf.set_font("Arial", '', 12)
    for section in sections:
        title = section.get("title", "")
        content = section.get("content", "")

        if title:
            # pdf.set_font("Arial", '', 12)
            # pdf.multi_cell(0, 10, content)
            # pdf.ln(5)
            pdf.multi_cell(0, 10, title, align='L')
            pdf.ln(2)
        
        if content:
            pdf.multi_cell(0, 10, content)
            pdf.ln(5)
    
    buffer = BytesIO()
    pdf.output(buffer)
    buffer.seek(0)

    return StreamingResponse(buffer, media_type="application/pdf", headers = {
        "Content-Disposition": "inline; filename=custom_paper.pdf"
    })



@router.post("/transcribe/full")
async def transcribe_full_audio(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[-1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_file_path = temp_file.name

    try:
        full_text = transcribe(temp_file_path)
        # Your parsing logic to split full_text into sections based on style template
        # Example of splitting into dummy sections:
        sections = {
            "header": {
                "title": "Extracted Title",
                "authors": "Extracted Authors"
            },
            "introduction": "Extracted introduction text...",
            "body": "Extracted body text...",
            "conclusion": "Extracted conclusion text..."
        }

        # Replace above with real parsing logic and calls to your LLM

        return {"sections": sections}
    except Exception as e:
        print(f"Error in /transcribe/full: {e}")
        raise HTTPException(status_code=500, detail=str(e))
