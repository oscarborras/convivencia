# comando a ejecutar para que funcione la conexión mcp con supabase-local:
# Requisitos: conexión previa a la VPN del centro

# servidor Supabase desarrollo: 172.20.250.41
ssh -L localhost:8080:localhost:8000 root@172.20.250.41


#Para Google Auth
ssh -L 0.0.0.0:8000:localhost:8000 root@172.20.250.41
