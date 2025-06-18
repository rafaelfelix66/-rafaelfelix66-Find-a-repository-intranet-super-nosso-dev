# Dockerfile para o backend com Oracle Client 23c - Debian
FROM node:18
WORKDIR /app

# Instalar dependencias para o Oracle (Debian packages)
RUN apt-get update && apt-get install -y \
    libaio-dev \
    libaio1 \
    wget \
    unzip \
    iputils-ping \
    net-tools \
    curl \
    traceroute \
    && rm -rf /var/lib/apt/lists/*

# Instalar Oracle Instant Client 23c
RUN mkdir -p /opt/oracle && \
    cd /opt/oracle && \
    wget -O instantclient-basic-linux.x64-23.8.0.25.04.zip "https://download.oracle.com/otn_software/linux/instantclient/2380000/instantclient-basic-linux.x64-23.8.0.25.04.zip" && \
    unzip instantclient-basic-linux.x64-23.8.0.25.04.zip && \
    rm instantclient-basic-linux.x64-23.8.0.25.04.zip

# Configurar Oracle Client
RUN CLIENT_DIR=$(find /opt/oracle -type d -name "instantclient*" | head -n 1) && \
    echo "Oracle Client configurado em: $CLIENT_DIR" && \
    chmod +x "$CLIENT_DIR"/*.so* && \
    echo "$CLIENT_DIR" > /etc/ld.so.conf.d/oracle-instantclient.conf && \
    ldconfig

# Configurar variaveis de ambiente para Oracle
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_23_8:$LD_LIBRARY_PATH
ENV ORACLE_CLIENT_PATH=/opt/oracle/instantclient_23_8
ENV ORACLE_HOME=/opt/oracle/instantclient_23_8

# Verificar se libaio esta disponivel
RUN echo "=== VERIFICACAO LIBAIO ===" && \
    ldconfig -p | grep libaio && \
    echo "=== VERIFICACAO ORACLE CLIENT ===" && \
    ls -la /opt/oracle/instantclient_23_8/libclntsh.so && \
    echo "=== TESTE DEPENDENCIAS ===" && \
    ldd /opt/oracle/instantclient_23_8/libclntsh.so | head -10

# Copiar package.json
COPY package*.json ./

# Instalar dependencias Node.js
RUN npm install

# Copiar o resto do codigo
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]