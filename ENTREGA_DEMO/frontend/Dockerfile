# ETAPA 1: Construcción
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

# CORRECCIÓN 1: Usamos 'npx' y la sintaxis explícita con '=' para que no se confunda
RUN npx ng build --configuration=production

# ... (etapa de build de node igual) ...
FROM nginx:alpine
# ESTA RUTA ES LA QUE SUELE DAR PROBLEMAS EN ANGULAR 17
# Basándonos en tu compilación exitosa, esta es la ruta exacta:
COPY --from=build /app/dist/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]