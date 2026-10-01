import io
import sys

from faster_whisper import WhisperModel

sys.stdout.reconfigure(encoding="utf-8")

modelo = WhisperModel(sys.argv[1], device="cpu", compute_type="int8")
audio = io.BytesIO(sys.stdin.buffer.read())
trechos, _ = modelo.transcribe(audio, language="pt")

print(" ".join(trecho.text.strip() for trecho in trechos))
