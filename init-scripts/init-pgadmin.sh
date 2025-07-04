#!/bin/bash

# Ждем запуска pgAdmin
sleep 10

# Создаем файл с настройками сервера
cat > /tmp/servers.json << EOF
{
    "Servers": {
        "1": {
            "Name": "Real Estate Database",
            "Group": "Servers",
            "Host": "postgres",
            "Port": 5432,
            "MaintenanceDB": "realtorsite",
            "Username": "postgres",
            "SSLMode": "prefer",
            "SSLCert": "<STORAGE_DIR>/.postgresql/postgresql.crt",
            "SSLKey": "<STORAGE_DIR>/.postgresql/postgresql.key",
            "SSLCompression": 0,
            "Timeout": 10,
            "UseSSHTunnel": 0,
            "TunnelHost": "",
            "TunnelPort": "22",
            "TunnelUsername": "",
            "TunnelAuthentication": 0
        }
    }
}
EOF

# Копируем настройки в pgAdmin
cp /tmp/servers.json /var/lib/pgadmin/servers.json

echo "pgAdmin server configuration completed" 