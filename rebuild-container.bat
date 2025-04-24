@echo off
echo.
echo ===== INICIANDO RECONSTRUCAO DO CONTAINER =====
echo.

echo Parando containers...
docker-compose down
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Falha ao parar os containers!
    goto :error
)
echo Containers parados com sucesso.
echo.

echo Navegando para o diretorio frontend...
cd C:\intranet-super-nosso\frontend
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Diretorio frontend nao encontrado!
    goto :error
)
echo.

echo Construindo aplicacao frontend...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Falha na construcao do frontend!
    goto :error
)
echo Build do frontend concluido com sucesso.
echo.

echo Retornando ao diretorio raiz...
cd ..
echo.

echo Iniciando containers...
docker-compose up -d
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Falha ao iniciar os containers!
    goto :error
)
echo.
echo ===== RECONSTRUCAO CONCLUIDA COM SUCESSO =====
echo Containers estao rodando em segundo plano.
echo.
goto :end

:error
echo.
echo ===== RECONSTRUCAO FALHOU =====
echo Verifique os erros acima e tente novamente.
echo.
exit /b 1

:end
echo Pressione qualquer tecla para sair...
pause > nul
exit /b 0