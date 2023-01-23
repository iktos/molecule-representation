CURRENT_PATH=$(dirname "$0")
PROJECT_PATH="$CURRENT_PATH/.."

DIST_PATH="$PROJECT_PATH/lib/cjs"

cd $DIST_PATH || exit 1
node index.js
