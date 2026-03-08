#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Account Service - Kind Cluster Setup ===${NC}\n"

# Check if kind is installed
if ! command -v kind &> /dev/null; then
    echo -e "${RED}Error: kind is not installed${NC}"
    echo -e "Install kind with one of the following methods:\n"
    echo -e "  macOS (Homebrew):   ${YELLOW}brew install kind${NC}"
    echo -e "  Linux:              ${YELLOW}curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64 && chmod +x ./kind && sudo mv ./kind /usr/local/bin/kind${NC}"
    echo -e "  Or visit: https://kind.sigs.k8s.io/docs/user/quick-start/#installation\n"
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    echo -e "Install kubectl: https://kubernetes.io/docs/tasks/tools/\n"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Error: Docker is not running${NC}"
    echo -e "Please start Docker Desktop and try again.\n"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites check passed${NC}\n"

# Create kind cluster
CLUSTER_NAME="account-service-cluster"

if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
    echo -e "${YELLOW}Cluster '${CLUSTER_NAME}' already exists${NC}"
    read -p "Do you want to delete and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Deleting existing cluster...${NC}"
        kind delete cluster --name ${CLUSTER_NAME}
    else
        echo -e "${GREEN}Using existing cluster${NC}\n"
    fi
fi

if ! kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
    echo -e "${GREEN}Creating Kind cluster: ${CLUSTER_NAME}${NC}"
    kind create cluster --name ${CLUSTER_NAME} --config - <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 30000
    hostPort: 30000
    protocol: TCP
EOF
    echo -e "${GREEN}✓ Cluster created successfully${NC}\n"
else
    echo -e "${GREEN}✓ Using existing cluster${NC}\n"
fi

# Set kubectl context
echo -e "${GREEN}Setting kubectl context...${NC}"
kubectl cluster-info --context kind-${CLUSTER_NAME}

# Build Docker image
echo -e "\n${GREEN}Building Docker image...${NC}"
docker build -t account-service:latest .
echo -e "${GREEN}✓ Image built successfully${NC}\n"

# Load image into kind cluster
echo -e "${GREEN}Loading image into Kind cluster...${NC}"
kind load docker-image account-service:latest --name ${CLUSTER_NAME}
echo -e "${GREEN}✓ Image loaded successfully${NC}\n"

# Deploy application
echo -e "${GREEN}Deploying application to Kubernetes...${NC}"
kubectl apply -k k8s/
echo -e "${GREEN}✓ Application deployed${NC}\n"

# Deploy Postman Insights Agent
echo -e "${GREEN}Deploying Postman Insights Agent...${NC}"
echo -e "${YELLOW}Note: The Insights Agent monitors API traffic in the cluster${NC}"
echo -e "${YELLOW}Postman Insights is configured with:${NC}"
echo -e "  - Project ID: svc_4pmaWuBOi34TWjiMyL4CAZ"
echo -e "  - Repro Mode: Enabled"
echo -e "${GREEN}✓ Insights Agent deployed${NC}\n"

# Wait for deployment
echo -e "${YELLOW}Waiting for application pods to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=account-service -n account-services --timeout=120s 2>/dev/null || true

# Wait for Insights Agent
echo -e "${YELLOW}Waiting for Postman Insights Agent to be ready...${NC}"
kubectl wait --for=condition=ready pod -l name=postman-insights-agent -n postman-insights-namespace --timeout=60s 2>/dev/null || echo -e "${YELLOW}Insights Agent still starting (this is normal)${NC}"

# Get deployment status
echo -e "\n${GREEN}=== Deployment Status ===${NC}"
echo -e "${YELLOW}Account Services:${NC}"
kubectl get all -n account-services

echo -e "\n${YELLOW}Postman Insights Agent:${NC}"
kubectl get all -n postman-insights-namespace

# Get cluster info
echo -e "\n${GREEN}=== Access Information ===${NC}"
echo -e "Cluster context: ${YELLOW}kind-${CLUSTER_NAME}${NC}"
echo -e "Application URL: ${YELLOW}http://localhost:30000${NC}"
echo -e "Namespace: ${YELLOW}account-services${NC}"

echo -e "\n${GREEN}=== Useful Commands ===${NC}"
echo -e "${YELLOW}Application:${NC}"
echo -e "  View pods:          ${YELLOW}kubectl get pods -n account-services${NC}"
echo -e "  View logs:          ${YELLOW}kubectl logs -l app=account-service -n account-services -f${NC}"
echo -e "  Describe service:   ${YELLOW}kubectl describe svc account-service -n account-services${NC}"
echo -e "  Port forward:       ${YELLOW}kubectl port-forward svc/account-service 8080:3000 -n account-services${NC}"
echo -e "\n${YELLOW}Postman Insights Agent:${NC}"
echo -e "  View agent pods:    ${YELLOW}kubectl get pods -n postman-insights-namespace${NC}"
echo -e "  View agent logs:    ${YELLOW}kubectl logs -l name=postman-insights-agent -n postman-insights-namespace -f${NC}"
echo -e "\n${YELLOW}Cluster Management:${NC}"
echo -e "  Delete deployment:  ${YELLOW}kubectl delete -k k8s/${NC}"
echo -e "  Delete cluster:     ${YELLOW}kind delete cluster --name ${CLUSTER_NAME}${NC}"

echo -e "\n${GREEN}=== Testing the Application ===${NC}"
echo -e "Wait a few seconds for the service to be ready, then run:"
echo -e "  ${YELLOW}curl http://localhost:30000/index.html${NC}"

echo -e "\n${GREEN}✓ Setup complete!${NC}\n"
