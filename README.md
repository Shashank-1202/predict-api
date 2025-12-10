# predict-api

Predict-api Architecture diagram

<img width="736" height="508" alt="image" src="https://github.com/user-attachments/assets/7efa652c-8876-45ce-9dbc-f910d56d97dd" />

🏗️ Architecture & Deployment Flow — Predict API
📌 1. Explanation of Architecture Flow
### 1️⃣ Developer Pushes Code → GitHub

Source code is stored and version-controlled in GitHub.

### 2️⃣ Jenkins Pipeline Triggers

Jenkins automatically pulls latest code from GitHub and performs:

npm install

Build Docker image

Push Docker image → AWS ECR

Update EKS deployment using:

kubectl set image deployment/predict-api predict=<new-image>

### 3️⃣ Docker Image Stored in AWS ECR

Secure container registry for storing application images.

### 4️⃣ EKS Pulls New Image & Performs Rolling Update

Deployment updates pods with zero downtime.

Old pods terminate only after new pods pass readiness.

### 5️⃣ Secrets Managed via External Secrets Operator (ESO)

ESO fetches secrets from AWS Secrets Manager.

Creates Kubernetes secret app-secret.

Pods load them as environment variables.

### 6️⃣ API Exposed Using AWS Application Load Balancer (ALB)

ALB + Ingress exposes endpoints:

/predict

/health

### 7️⃣ Users Access API

Access through Load Balancer URL

Later Route53 domain can be added.

🔄 2. CI/CD Workflow Overview
Complete Flow
Developer → GitHub → Jenkins → Docker → ECR → EKS → ALB → Users

⚙️ 3. Step-by-Step CI/CD Flow
1️⃣ Developer pushes code → GitHub
2️⃣ Jenkins triggers automatically

Jenkins performs:

Pull latest code

Install NPM dependencies

Build Docker image

Tag image with Build Number

Authenticate & push to ECR

Update EKS deployment:

kubectl set image deployment/predict-api predict=<new-image>

3️⃣ Kubernetes executes rolling update
4️⃣ ALB routes traffic to updated pods
🏗️ 4. Deployment Steps
### Step 1 — Build Node.js API

Files:

app.js

package.json

### Step 2 — Create Multi-Stage Docker Image

Benefits:

Lightweight image

Non-root user

Production-ready

### Step 3 — AWS Infrastructure Setup
(A) Create ECR Repository
aws ecr create-repository --repository-name predict-api --region ap-south-1

(B) Create EKS Cluster
eksctl create cluster \
  --name healthcare-cluster \
  --region ap-south-1 \
  --nodes 2 \
  --node-type t3.medium \
  --with-oidc

(C) Configure kubectl
aws eks update-kubeconfig --region ap-south-1 --name healthcare-cluster

### Step 4 — Create Kubernetes Namespace
kubectl create namespace healthcare-app

### Step 5 — Create Secret in AWS Secrets Manager
aws secretsmanager create-secret \
 --name healthcare/dbpassword \
 --secret-string '{"password":"MyStrongPassword123"}'

### Step 6 — Install External Secrets Operator
Install CRDs
kubectl apply -f https://github.com/external-secrets/external-secrets/releases/latest/download/crds.yaml
kubectl apply -f https://github.com/external-secrets/external-secrets/releases/latest/download


Created resources:

ClusterSecretStore

ExternalSecret

### Step 7 — Application Deployment & Service

Files included:

deployment.yaml

service.yaml

🔧 5. Jenkins Pipeline (Final Verified Version)

Uses 3 Secret Text Credentials:

aws-access-key-id

aws-secret-access-key

aws-account-id

Pipeline tasks:

Docker Build

Docker Push to ECR

Deploy Update to EKS

🔐 6. Security Considerations
✔ IAM Least Privilege

Jenkins IAM user must only have:

ecr:PutImage

ecr:GetAuthorizationToken

eks:DescribeCluster

sts:AssumeRole (if IRSA enabled)

✔ No Secrets in Git

Use AWS Secrets Manager + External Secrets Operator.

✔ Non-root Containers

Multi-stage Dockerfile uses restricted user.

✔ HTTPS via ACM

SSL termination handled by ALB.

✔ Probes for Reliability

Liveness + Readiness probes configured.

✔ Namespace Isolation

App runs under:

healthcare-app

📊 7. Monitoring Setup
CloudWatch Container Insights

Provides:

CPU Usage

Memory Utilization

Pod Restarts

Network Metrics

Enable using EKS addon:

eksctl update addon \
  --cluster healthcare-cluster \
  --name cloudwatch-observability \
  --region ap-south-1

<img width="1366" height="604" alt="deployment" src="https://github.com/user-attachments/assets/45d40f38-2e86-49e8-ba2e-771a2861d62e" />

