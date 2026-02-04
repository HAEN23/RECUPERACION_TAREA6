# 1. Imagen base
FROM node:20-alpine

# 2. Directorio de trabajo
WORKDIR /app

# 3. Copiar archivos de dependencias y corregir finales de línea si es necesario
COPY package*.json ./

# 4. Instalar dependencias
# Usamos --no-cache para mantener la imagen ligera
RUN npm install

# 5. Copiar el resto del código de la aplicación
COPY . .

# 6. Exponer el puerto que usa Next.js
EXPOSE 3000

# 7. Comando para iniciar la aplicación en modo de desarrollo
CMD ["npm", "run", "dev"]