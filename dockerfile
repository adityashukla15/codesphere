
# Stage 1: Build the Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY ./frontend/package*.json ./
RUN npm install

COPY ./frontend/ .
RUN npm run build


# Stage 2: Build the Backend
FROM node:20-alpine

WORKDIR /app

COPY ./Backend/package*.json ./
RUN npm install

COPY ./Backend/ .

# Copy frontend build files into Backend/public
COPY --from=frontend-builder /app/dist/ ./public/

EXPOSE 3000

CMD ["node", "server.js"]
