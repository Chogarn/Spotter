# Whisper (faster-whisper) para pasar a texto las grabaciones de la voz del video,
# sin escucharlas. Se construye una vez:
#   docker build -t spotter-whisper video-demo/herramientas
# PyAV va fijo: las versiones nuevas sacaron un parámetro que faster-whisper 1.1.1 usa.
FROM python:3.12-slim
RUN pip install --no-cache-dir faster-whisper==1.1.1 av==13.1.0 requests
WORKDIR /trabajo
