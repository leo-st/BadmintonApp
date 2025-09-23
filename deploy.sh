#!/bin/bash

# Badminton App Deployment Script
# Usage: ./deploy.sh [environment] [action]
# Environment: staging, production
# Action: deploy, rollback, status

set -e

ENVIRONMENT=${1:-production}
ACTION=${2:-deploy}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="badminton-app"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.${ENVIRONMENT}"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking deployment requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file $ENV_FILE not found. Please create it from env.prod.example"
        exit 1
    fi
    
    log_info "All requirements satisfied ✓"
}

build_and_deploy() {
    log_info "Building and deploying to $ENVIRONMENT environment..."
    
    # Pull latest images
    log_info "Pulling latest base images..."
    docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE pull
    
    # Build custom images
    log_info "Building application images..."
    docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE build --no-cache
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE down
    
    # Start new containers
    log_info "Starting new containers..."
    docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Run health checks
    check_health
    
    log_info "Deployment completed successfully! 🎉"
}

check_health() {
    log_info "Running health checks..."
    
    # Check if containers are running
    if ! docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE ps | grep -q "Up"; then
        log_error "Some containers are not running properly"
        docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE logs
        exit 1
    fi
    
    # Check backend health
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        log_info "Backend health check passed ✓"
    else
        log_error "Backend health check failed"
        exit 1
    fi
    
    # Check nginx
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log_info "Nginx health check passed ✓"
    else
        log_error "Nginx health check failed"
        exit 1
    fi
}

show_status() {
    log_info "Current deployment status:"
    docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE ps
    
    log_info "Resource usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
}

rollback() {
    log_warn "Rolling back to previous version..."
    
    # This would typically involve:
    # 1. Tagging the current image
    # 2. Pulling the previous image
    # 3. Restarting with the previous image
    
    log_error "Rollback functionality not implemented yet. Manual intervention required."
    exit 1
}

# Main execution
case $ACTION in
    "deploy")
        check_requirements
        build_and_deploy
        ;;
    "rollback")
        rollback
        ;;
    "status")
        show_status
        ;;
    *)
        log_error "Invalid action: $ACTION"
        log_info "Usage: $0 [environment] [deploy|rollback|status]"
        exit 1
        ;;
esac
