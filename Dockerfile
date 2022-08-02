FROM jenkins/jenkins:lts-slim
USER jenkins
COPY --chown=jenkins:jenkins .gitignore .local/var/jenkins_home /var/jenkins_home/
