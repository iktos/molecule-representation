#!/bin/bash

CURRENT_PATH=$(dirname "$0")
PROJECT_PATH="$CURRENT_PATH/.."
DIST_PATH="$PROJECT_PATH/lib"

BUILD_TYPE="${1:-release}"

rimraf $DIST_PATH
npm run build