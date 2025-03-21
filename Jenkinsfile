pipeline {
    agent any
    
    // environment {
    //     NODEJS_HOME = tool name: 'NodeJS'  // Adjust as per your Jenkins NodeJS tool config
    //     PATH = "${NODEJS_HOME}/bin:${env.PATH}"
    // }
    
    stages {
        stage('Clone Repository') {
            steps {
                git credentialsId: '33135dda-cb80-45d1-bd26-6c1cdd27661c', url: 'https://amit1208@github.com/amit1208/TaskMg.git', branch: 'marketing'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        
        stage('Build React App') {
            steps {
                sh 'npm run build'
            }
        }
        
stage('Deploy to EC2') {
    steps {
        echo 'Deploying to EC2...'
        sshagent(['ec2-ssh-credentials-id']) {
            sh '''
                ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-201-122-2.ap-south-1.compute.amazonaws.com << 'EOF'
                    cd /root/TaskMg
                    git fetch origin marketing
                    git reset --hard origin/marketing
                    npm install
                    npm run build
                    pm2 restart client
                EOF
            '''
        }
    }
}

    }
    
    post {
        success {
            echo 'Deployment to EC2 successful!'
        }
        failure {
            echo 'Deployment failed!'
        }
    }
}
