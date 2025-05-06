# Dockerfile para o backend com suporte Oracle
FROM node:18
WORKDIR /app

# Instalar dependências para o Oracle
RUN apt-get update && apt-get install -y \
    libaio1 \
    wget \
    unzip \
	iputils-ping \
    net-tools \
    curl \
    traceroute \
    && rm -rf /var/lib/apt/lists/*

# Instalar Oracle Instant Client
RUN mkdir -p /opt/oracle && \
    cd /opt/oracle && \
    wget https://download.oracle.com/otn_software/linux/instantclient/instantclient-basiclite-linuxx64.zip && \
    unzip instantclient-basiclite-linuxx64.zip && \
    rm instantclient-basiclite-linuxx64.zip && \
    cd /opt/oracle/instantclient* && \
    (ln -s libclntsh.so.21.1 libclntsh.so || true) && \
    (ln -s libocci.so.21.1 libocci.so || true)

# Encontrar e configurar o caminho correto do instantclient
RUN CLIENT_DIR=$(find /opt/oracle -type d -name "instantclient*" | head -n 1) && \
    echo "export LD_LIBRARY_PATH=$CLIENT_DIR:\$LD_LIBRARY_PATH" >> /etc/bash.bashrc && \
    echo "export ORACLE_CLIENT_PATH=$CLIENT_DIR" >> /etc/bash.bashrc

# Configurar variáveis de ambiente para Oracle
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_23_7:$LD_LIBRARY_PATH
ENV ORACLE_CLIENT_PATH=/opt/oracle/instantclient_23_7

# Copiar package.json
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o resto do código
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]