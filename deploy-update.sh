#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Quick Deploy Update for Account Service ===${NC}\n"

CLUSTER_NAME="account-service-cluster"

# Check if cluster exists
if ! kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
    echo -e "${YELLOW}Cluster '${CLUSTER_NAME}' not found. Please run ./setup-kind.sh first.${NC}"
    exit 1
fi

echo -e "${GREEN}Rebuilding Docker image...${NC}"
docker build -t account-service:latest .

echo -e "${GREEN}Loading image into Kind cluster...${NC}"
kind load docker-image account-service:latest --name ${CLUSTER_NAME}

echo -e "${GREEN}Restarting deployment...${NC}"
kubectl rollout restart deployment account-service -n account-services

echo -e "${GREEN}Waiting for rollout to complete...${NC}"
kubectl rollout status deployment account-service -n account-services

echo -e "\n${GREEN}✓ Deployment updated successfully!${NC}"
echo -e "${YELLOW}Application URL: http://localhost:30000${NC}"
echo -e "${YELLOW}Postman Insights: Enabled with project svc_4pmaWuBOi34TWjiMyL4CAZ${NC}\n"
