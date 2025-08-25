STYLE_TEMPLATES = {
    "academic": {
        "sections": ["header", "introduction", "methods", "results", "discussion", "conclusion"],
        "prompts": {
            "header": "... prompt to parse header ...",
            "introduction": "... prompt for intro ...",
        },
        "pdf_settings": {
            "font": ("Arial", 12),
        }
    },
    "technical": {
        "sections": ["header", "abstract", "methods", "results", "conclusion"],
        "prompts": {
            "header": "...",
            "abstract": "...",
        }
    },
    "magazine": {
        "sections": ["header", "title", "author", "lead_paragraph", "main_content"],
        "prompts": {
            "header": "...",
        }
    }
}
