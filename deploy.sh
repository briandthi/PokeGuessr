#!/bin/bash

# Script de déploiement pour horny
set -e

echo "🚀 Début du déploiement..."

# Ce script déploie le service Docker Compose "zf" (exposé via Traefik)
# L'accès local direct (localhost:3001) n'est plus disponible, accès via le reverse proxy (zf.thibaultbriand.fr)

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

# Vérifier si Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

# Arrêter les conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
docker-compose down || true

# Supprimer les images non utilisées (optionnel)
echo "🧹 Nettoyage des images non utilisées..."
docker image prune -f

# Build et démarrage
echo "🔨 Build et démarrage des conteneurs..."
docker-compose up --build -d

# Vérifier le status
echo "✅ Vérification du status..."
sleep 5
docker-compose ps

# Test de santé désactivé : accès local direct supprimé (reverse proxy Traefik obligatoire)
echo "🏥 Test de santé désactivé (accès via Traefik uniquement)"
echo "🎉 Déploiement terminé ! Accédez à l'application via le reverse proxy (zf.thibaultbriand.fr)"
