#!/bin/bash
# ================================================================
# Script de Respaldo Rápido para RamTask (Base de Datos SQLite)
# ================================================================

DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
BACKUP_FILE="${BACKUP_DIR}/ramtask_backup_${DATE}.tar.gz"

mkdir -p "$BACKUP_DIR"

if [ -f "./data/tasks.db" ]; then
    tar -czf "$BACKUP_FILE" ./data/
    echo "✓ Respaldo generado con éxito en: $BACKUP_FILE"
else
    echo "⚠️ No se encontró ./data/tasks.db. Verifica que la aplicación haya iniciado al menos una vez."
fi
