# handles audio conversion
# converts audio (.ogg or .webm) sent from front to .wav

import ffmpeg
import tempfile

def convert_to_wav(input_path):
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as out_file:
        output_path = out_file.name

    ffmpeg.input(input_path).output(output_path, ac=1, ar=16000).run(quiet=True, overwrite_output=True)
    return output_path