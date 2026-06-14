# Stage 1: Build the Vite frontend
FROM node:20 AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build the Python backend
FROM python:3.9-slim
WORKDIR /app

# Install dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install uvicorn

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/dist ./dist

# Set environment variables for Railway
ENV PORT=8000
ENV HOST=0.0.0.0

# Expose port
EXPOSE 8000

# Run the FastAPI server
CMD ["sh", "-c", "uvicorn backend.main:app --host $HOST --port $PORT"]
