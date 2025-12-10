pipeline {
    agent any

    environment {
        AWS_REGION               = "ap-south-1"

        // 🔥 Enter these EXACT credential IDs from Jenkins
        AWS_ACCOUNT_ID           = credentials('aws-account-id')
        AWS_ACCESS_KEY_ID        = credentials('aws-access-key-id')
        AWS_SECRET_ACCESS_KEY    = credentials('aws-secret-access-key')

        // 🔥 Change if your ECR repo name is different
        ECR_REPO                 = "predict-api"

        IMAGE_TAG                = "${BUILD_NUMBER}"

        // 🔥 Enter your EKS cluster name
        EKS_CLUSTER_NAME         = "healthcare-cluster"
    }

    stages {

        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Test') {
            steps { sh "npm test" }
        }

        stage('Docker Build') {
            steps { sh "docker build -t ${ECR_REPO}:${IMAGE_TAG} ." }
        }

        stage('Push to ECR') {
            steps {
                withEnv([
                    "AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}",
                    "AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}",
                    "AWS_DEFAULT_REGION=${AWS_REGION}"
                ]) {
                    sh """
                    aws ecr get-login-password --region ${AWS_REGION} \
                    | docker login --username AWS --password-stdin \
                      ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

                    docker tag ${ECR_REPO}:${IMAGE_TAG} \
                      ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}

                    docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}
                    """
                }
            }
        }

        stage('Deploy to EKS') {
            steps {
                withEnv([
                    "AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}",
                    "AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}",
                    "AWS_DEFAULT_REGION=${AWS_REGION}"
                ]) {

                    // Update kubeconfig
                    sh """
                    aws eks update-kubeconfig \
                      --region ${AWS_REGION} \
                      --name ${EKS_CLUSTER_NAME}
                    """

                    // 🔥 Container name MUST match deployment YAML
                    sh """
                    kubectl set image deployment/predict-api \
                      -n healthcare-app \
                      predict=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}

                    kubectl rollout status deployment/predict-api -n healthcare-app
                    """
                }
            }
        }
    }
}
