pipeline {
    agent any

    options {
        disableConcurrentBuilds()
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    parameters {
        booleanParam(
            name: 'SIMULATE_TEST_FAILURE',
            defaultValue: false,
            description: 'Demonstrate a safe test failure; deployment will not run.'
        )

        string(
            name: 'SMARTCHAIN_API_PORT',
            defaultValue: '18000',
            description: 'Local API port used by the Jenkins deployment.'
        )

        string(
            name: 'SMARTCHAIN_WEB_PORT',
            defaultValue: '13000',
            description: 'Local frontend port used by the Jenkins deployment.'
        )

        string(
            name: 'SMARTCHAIN_DB_PORT',
            defaultValue: '13306',
            description: 'Local MySQL port used by the Jenkins deployment.'
        )
    }

    environment {
        COMPOSE_EXE = 'C:\\Users\\ak\\AppData\\Local\\Programs\\DockerDesktop\\resources\\cli-plugins\\docker-compose.exe'
        SMARTCHAIN_DEMO_FAIL = "${params.SIMULATE_TEST_FAILURE ? '1' : '0'}"
    }

    stages {
        stage('Checkout source') {
            steps {
                checkout scm
            }
        }

        stage('Verify Docker CLI and daemon') {
            steps {
                bat '''
                    where docker
                    docker --version
                    docker info --format "{{.ServerVersion}}"
                '''
            }
        }

        stage('Validate Compose configuration') {
            steps {
                bat '''
                    "C:\\Users\\ak\\AppData\\Local\\Programs\\DockerDesktop\\resources\\cli-plugins\\docker-compose.exe" version
                    "C:\\Users\\ak\\AppData\\Local\\Programs\\DockerDesktop\\resources\\cli-plugins\\docker-compose.exe" --env-file .env.example config --quiet
                '''
            }
        }

        stage('Build application images') {
            steps {
                bat '''
                    "C:\\Users\\ak\\AppData\\Local\\Programs\\DockerDesktop\\resources\\cli-plugins\\docker-compose.exe" --env-file .env.example build backend frontend
                '''
            }
        }

        stage('Run backend tests') {
            steps {
                bat '''
                    "C:\\Users\\ak\\AppData\\Local\\Programs\\DockerDesktop\\resources\\cli-plugins\\docker-compose.exe" --env-file .env.example run --no-deps --rm -e DATABASE_URL=sqlite:////tmp/smartchain_ci.db -e SMARTCHAIN_DEMO_FAIL=%SMARTCHAIN_DEMO_FAIL% backend python -m pytest tests/ -v
                '''
            }
        }

        stage('Deploy local application') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'smartchain-mysql-root-password',
                        variable: 'MYSQL_ROOT_PASSWORD'
                    ),
                    string(
                        credentialsId: 'smartchain-mysql-password',
                        variable: 'MYSQL_PASSWORD'
                    )
                ]) {
                    bat '''
                        "C:\\Users\\ak\\AppData\\Local\\Programs\\DockerDesktop\\resources\\cli-plugins\\docker-compose.exe" --env-file .env.example up --detach --no-build
                    '''
                }
            }
        }

        stage('Verify backend health') {
            steps {
                bat '''
                    powershell.exe -NoProfile -NonInteractive -Command "$health = $null; $uri = 'http://127.0.0.1:{0}/api/health' -f $env:SMARTCHAIN_API_PORT; for ($attempt = 0; $attempt -lt 30 -and $null -eq $health; $attempt++) { try { $health = Invoke-RestMethod -Uri $uri -TimeoutSec 2 } catch { Start-Sleep -Seconds 2 } }; if ($null -eq $health -or $health.status -ne 'healthy' -or $health.engine -ne 'mysql') { throw 'Backend is not healthy with MySQL' }; Write-Output 'Backend health check passed (MySQL)'"
                '''
            }
        }
    }

    post {
        success {
            echo 'ChainSphere pipeline succeeded: tests passed, local services deployed, and MySQL health verified.'
        }

        failure {
            echo 'ChainSphere pipeline failed. Review the first failing stage in Console Output.'
        }

        always {
            echo 'Pipeline finished. The existing MySQL Compose volume was not removed.'
        }
    }
}