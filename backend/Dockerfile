FROM node:20-alpine

RUN apk add --no-cache curl bash git openssl
RUN curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
RUN curl -LO "https://dl.k8s.io/release/v1.29.0/bin/linux/amd64/kubectl" \
    && chmod +x kubectl \
    && mv kubectl /usr/local/bin/

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/server.js .

# Copy and build frontend (Vite)
COPY frontend/package*.json ../frontend/
RUN cd ../frontend && npm install
COPY frontend ../frontend
RUN cd ../frontend && npm run build && mv dist /app/public

EXPOSE 3000

CMD ["node", "server.js"]
