# ETAPA 1: Construcción
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

# Compilamos para producción
RUN npx ng build --configuration=production

# ETAPA 2: Servidor Web
FROM nginx:alpine

# Plantilla de Nginx (se resuelve en runtime con variables de entorno)
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copiamos los archivos compilados a Nginx (Subcarpeta /browser obligatoria en el nuevo builder)
COPY --from=build /app/dist/gestion-frontend/browser /usr/share/nginx/html/

ENV BACKEND_HOST=backend
ENV BACKEND_PORT=8080

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]