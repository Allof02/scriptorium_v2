#!/bin/bash

# startup.sh

# Install dependencies
npm install

npm install uuid

# Run database migrations
npx prisma migrate deploy

#!/bin/bash

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install Node.js 20+
check_install_node() {
    if command_exists node; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 20 ]; then
            echo "Node.js version 20+ is already installed."
        else
            echo "Node.js version is less than 20. Installing Node.js 20+..."
            install_node
        fi
    else
        echo "Node.js is not installed. Installing Node.js 20+..."
        install_node
    fi
}

install_node() {
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
}

# Install GCC and G++
check_install_gcc_gpp() {
    if command_exists gcc && command_exists g++; then
        echo "GCC and G++ are already installed."
    else
        echo "Installing GCC and G++..."
        sudo apt-get update
        sudo apt-get install -y build-essential
    fi
}

# Install Python 3.10+
check_install_python() {
    if command_exists python3; then
        PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}' | cut -d'.' -f1,2)
        REQUIRED_VERSION="3.10"
        if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
            echo "Python 3.10+ is already installed."
        else
            echo "Python version is less than 3.10. Installing Python 3.10+..."
            install_python
        fi
    else
        echo "Python is not installed. Installing Python 3.10+..."
        install_python
    fi
}

install_python() {
    sudo apt-get update
    sudo apt-get install -y python3.10 python3.10-venv python3.10-dev
}

# Install Java 20+
check_install_java() {
    if command_exists java; then
        JAVA_VERSION=$(java -version 2>&1 | awk -F[\"_] '/version/ {print $2}' | cut -d'.' -f1)
        if [ "$JAVA_VERSION" -ge 20 ]; then
            echo "Java 20+ is already installed."
        else
            echo "Java version is less than 20. Installing Java 20+..."
            install_java
        fi
    else
        echo "Java is not installed. Installing Java 20+..."
        install_java
    fi
}

install_java() {
    sudo apt-get update
    sudo apt-get install -y openjdk-20-jdk
}

# Run all checks
check_install_node
check_install_gcc_gpp
check_install_python
check_install_java

# Install npm packages
echo "Running npm install..."
npm install

echo "All dependencies are installed."

