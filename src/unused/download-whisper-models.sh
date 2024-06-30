#!/bin/bash

# LICENSE MIT
# Copyright (c) 2024 rn0x
# github: https://github.com/rn0x
# telegram: https://t.me/F93ii
# repository: https://github.com/rn0x/Audio2TextJS

# This script downloads Whisper model files that have already been converted to ggml format.
# This way you don't have to convert them yourself.

# Ensure script has executable permissions
chmod +x "$0"

script_name="$(basename "$0")"

# Source URLs
src="https://huggingface.co/ggerganov/whisper.cpp"
src_all="https://huggingface.co/akashmjn/tinydiarize-whisper.cpp"
pfx="resolve/main/ggml"




# Function to get the path of this script
function get_script_path() {
    if [ -x "$(command -v realpath)" ]; then
        echo "$(dirname "$(realpath "$0")")"
    else
        local ret="$(cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P)"
        echo "$ret"
    fi
}

# Create models directory if it doesn't exist
function create_models_directory() {
    if [ ! -d "$models_path" ]; then
        if [ "$(uname)" == "Darwin" ] || [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
            mkdir -p "$models_path"
        elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ] || [ "$(expr substr $(uname -s) 1 10)" == "MINGW64_NT" ]; then
            mkdir "$models_path"
        fi
    fi
}

models_path="$(get_script_path)/models"
create_models_directory

# Whisper models
models=( "tiny.en" "tiny" "base.en" "base" "small.en" "small" "medium.en" "medium" "large-v1" "large" )

# Function to list available models
function list_models {
    printf "\n"
    printf "  Available models:"
    for model in "${models[@]}"; do
        printf " $model"
    done
    printf " all\n\n"
}

# Check arguments
if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
    printf "Usage: $0 <model> <folder>\n"
    list_models
    exit 1
fi

model=$1
folder=$2

# If folder is not provided, use default 'models' folder
if [ -z "$folder" ]; then
    models_path="$(get_script_path)/models"
else
    models_path="$(get_script_path)/$folder"
    create_models_directory
fi

# If model is 'all', download all models
if [ "$model" == "all" ]; then
    for model_item in "${models[@]}"; do
        "./$script_name" "$model_item" "$folder"
    done
    exit 0
fi

# Validate model
if [[ ! " ${models[@]} " =~ " ${model} " ]]; then
    printf "Invalid model: $model\n"
    list_models
    exit 1
fi

# Update source URL and prefix if model contains 'tdrz'
if [[ $model == *"tdrz"* ]]; then
    src="$src_all"
fi

# Download ggml model
printf "Downloading ggml model $model from '$src' ...\n"
cd "$models_path"

if [ -f "ggml-$model.bin" ]; then
    printf "Model $model already exists. Skipping download.\n"
else
    if [ -x "$(command -v wget)" ]; then
        wget --no-config --quiet --show-progress -O "ggml-$model.bin" "$src/$pfx-$model.bin"
    elif [ -x "$(command -v curl)" ]; then
        curl -L --output "ggml-$model.bin" "$src/$pfx-$model.bin"
    else
        printf "Either wget or curl is required to download models.\n"
        exit 1
    fi

    if [ $? -ne 0 ]; then
        printf "Failed to download ggml model $model\n"
        printf "Please try again later or download the original Whisper model files and convert them yourself.\n"
        exit 1
    fi

    printf "Done! Model '$model' saved in '$models_path/ggml-$model.bin'\n"
fi

printf "You can now use it like this:\n\n"
printf "  $ ./whisper.exe -m $models_path/ggml-$model.bin -f samples/jfk.wav\n"
printf "\n"