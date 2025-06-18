# Save this as test_imports.py
try:
    import numpy
    print(f"NumPy version: {numpy.__version__}")
    
    import torch
    print(f"PyTorch version: {torch.__version__}")
    
    print("Testing torch operations...")
    x = torch.rand(5, 3)
    print(x)
    
    print("Importing Whisper...")
    import whisper
    print("Whisper imported successfully!")
    
    print("Loading Whisper model...")
    model = whisper.load_model("tiny")  # Use tiny for faster loading
    print("Model loaded successfully!")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()