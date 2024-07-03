# Function to check if a command exists
function Test-CommandExists {
    param([string]$command)
    return (Get-Command -Name $command -ErrorAction SilentlyContinue) -ne $null
}

# Function to check if running with admin rights
function Test-AdminRights {
    $currentUser = New-Object Security.Principal.WindowsPrincipal ([Security.Principal.WindowsIdentity]::GetCurrent())
    $isAdmin = $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    return $isAdmin
}

# Function to install Chocolatey if not already installed
function Install-Chocolatey {
    Write-Output "Chocolatey is not installed. Installing Chocolatey..."
    Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
}

# Function to install Git if not already installed
function Install-Git {
    if (-not (Test-CommandExists "git")) {
        Write-Output "Git is not installed. Installing Git..."
        choco install git -y
        return $false
    }
    return $true
}

# Function to install CMake if not already installed
function Install-CMake {
    if (-not (Test-CommandExists "cmake")) {
        Write-Output "CMake is not installed. Installing CMake..."
        choco install cmake -y
        return $false
    }
    return $true
}

# Function to install MSBuild (Visual Studio Build Tools) if not already installed
function Install-MSBuild {
    if (-not (Test-CommandExists "MSBuild")) {
        Write-Output "MSBuild is not installed. Installing Visual Studio Build Tools..."
        choco install visualstudio2019buildtools --package-parameters "--allWorkloads --includeRecommended --includeOptional" -y
        return $false
    }
    return $true
}

# Function to elevate script to run as admin
function Start-ElevatedProcess {
    param(
        [string]$scriptPath
    )

    # Check if already running as admin
    if (Test-AdminRights) {
        Write-Output "Running with admin rights."
        & $scriptPath
    }
    else {
        Write-Output "Requesting admin rights..."

        # Create new process start info
        $processStartInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processStartInfo.FileName = "powershell"
        $processStartInfo.Arguments = "-NoProfile -ExecutionPolicy Bypass -Command `"& { Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File ""$scriptPath""' -Verb RunAs }`""

        # Start new process with admin rights
        $processStartInfo.Verb = "runas"
        [System.Diagnostics.Process]::Start($processStartInfo) | Out-Null
    }
}

# Main script starts here
Write-Output "Starting whisper.cpp project setup..."

# Step 1: Check and request admin rights if not already running with admin rights
if (-not (Test-AdminRights)) {
    Start-ElevatedProcess -scriptPath $MyInvocation.MyCommand.Path
    exit
}

# Step 2: Install Chocolatey if not already installed
if (-not (Test-CommandExists "choco")) {
    Install-Chocolatey
}

# Step 3: Install required tools if not already installed
$GitInstalled = Install-Git
$CMakeInstalled = Install-CMake
$MSBuildInstalled = Install-MSBuild

# Check if any tool installation failed
if (-not ($GitInstalled -and $CMakeInstalled -and $MSBuildInstalled)) {
    Write-Output "Please install the required tools manually and rerun the script."
    exit 1
}

# Continue with cloning and building the project
Write-Output "Cloning whisper.cpp project from GitHub..."
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp

Write-Output "Building whisper.cpp project..."
mkdir build
cd build
cmake ..
cmake --build .

Write-Output "Build process completed successfully."