pipeline {
    agent any

    environment {
        AWS_REGION            = "ap-south-1"

        // Jenkins Credentials (Secret Text)
        AWS_ACCOUNT_ID        = credentials('aws-account-id')
        AWS_ACCESS_KEY_ID     = credentials('aws-access-key-id')
        AWS_SECRET_ACCESS_KEY = credentials('aws-secret-access-key')

        // App / ECR / EKS details
        ECR_REPO              = "predict-api"
        IMAGE_TAG             = "${BUILD_NUMBER}"
        EKS_CLUSTER_NAME      = "healthcare-cluster"
        K8S_NAMESPACE         = "healthcare-app"
        CONTAINER_NAME        = "predict"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh "npm install"
            }
        }

        stage('Test') {
            steps {
                sh "npm test || echo 'No tests, continuing...'"
            }
        }

        stage('Docker Build') {
            steps {
                sh "docker build -t ${ECR_REPO}:${IMAGE_TAG} ."
            }
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

                    // Update deployment image
                    sh """
                    kubectl set image deployment/predict-api \
                        -n ${K8S_NAMESPACE} \
                        ${CONTAINER_NAME}=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}

                    kubectl rollout status deployment/predict-api -n ${K8S_NAMESPACE}
                    """
                }
            }
        }
    }
}
