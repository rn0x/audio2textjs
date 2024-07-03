#!/bin/bash

# Function to check if a command exists
function test_command_exists {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Git if not already installed
function install_git {
    if ! test_command_exists "git"; then
        echo "Git is not installed. Installing Git..."
        if test_command_exists "apt"; then
            sudo apt update
            sudo apt install git -y
        elif test_command_exists "dnf"; then
            sudo dnf install git -y
        elif test_command_exists "yum"; then
            sudo yum install git -y
        else
            echo "Unsupported package manager. Please install Git manually."
            return 1
        fi
        return 1
    fi
    return 0
}

# Function to install CMake if not already installed
function install_cmake {
    if ! test_command_exists "cmake"; then
        echo "CMake is not installed. Installing CMake..."
        if test_command_exists "apt"; then
            sudo apt update
            sudo apt install cmake -y
        elif test_command_exists "dnf"; then
            sudo dnf install cmake -y
        elif test_command_exists "yum"; then
            sudo yum install cmake -y
        else
            echo "Unsupported package manager. Please install CMake manually."
            return 1
        fi
        return 1
    fi
    return 0
}

# Function to install GCC and G++ if not already installed
function install_build_essentials {
    if ! test_command_exists "gcc" || ! test_command_exists "g++"; then
        echo "GCC and/or G++ are not installed. Installing build essentials..."
        if test_command_exists "apt"; then
            sudo apt update
            sudo apt install build-essential -y
        elif test_command_exists "dnf"; then
            sudo dnf groupinstall "Development Tools" -y
        elif test_command_exists "yum"; then
            sudo yum groupinstall "Development Tools" -y
        else
            echo "Unsupported package manager. Please install build essentials manually."
            return 1
        fi
        return 1
    fi
    return 0
}

# Function to set LD_LIBRARY_PATH permanently
function set_ld_library_path {
    if ! grep -q "LD_LIBRARY_PATH" ~/.bashrc; then
        echo "export LD_LIBRARY_PATH=\$LD_LIBRARY_PATH:/path/to/your/library" >> ~/.bashrc
        source ~/.bashrc
    fi
}

# Main script starts here
echo "Starting whisper.cpp project setup..."

# Step 1: Install required tools if not already installed
install_git
install_cmake
install_build_essentials

# Check if any tool installation failed
if [ $? -ne 0 ]; then
    echo "Please install the required tools manually and rerun the script."
    exit 1
fi


# Continue with cloning and building the project
echo "Cloning whisper.cpp project from GitHub..."
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp || exit

echo "Building whisper.cpp project..."
mkdir build
cd build
cmake ..
make

# Set LD_LIBRARY_PATH
# set_ld_library_path

echo "Build process completed successfully."