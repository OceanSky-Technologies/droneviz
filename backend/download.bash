#!/usr/bin/env bash

ROOT=$(git rev-parse --show-toplevel)

if [ -f "$ROOT/backend/versions.cfg" ]; then
    source "$ROOT/backend/versions.cfg"
else
    echo "versions.cfg file not found!"
    exit 1
fi

# mavsdk-server
if [ ! -d "$ROOT/dist/backend/modules/mavsdk-server-$MAVSDK_SERVER_VERSION" ]; then
    echo "Downloading mavsdk-server..."
    (
        mkdir -p "$ROOT/dist/backend/modules/mavsdk-server-$MAVSDK_SERVER_VERSION"
        cd "$ROOT/dist/backend/modules/mavsdk-server-$MAVSDK_SERVER_VERSION"

        wget https://github.com/mavlink/MAVSDK/releases/download/v$MAVSDK_SERVER_VERSION/mavsdk-windows-x64-release.zip
        unzip -qq ./mavsdk-windows-x64-release.zip
        rm ./mavsdk-windows-x64-release.zip
    )
else
    echo "mavsdk-server found"
fi

# grpcwebproxy
if [ ! -d "$ROOT/dist/backend/modules/grpcwebproxy-$GRPC_WEB_PROXY_VERSION" ]; then
    echo "Downloading grpcwebproxy..."
    (
        mkdir -p "$ROOT/dist/backend/modules/grpcwebproxy-$GRPC_WEB_PROXY_VERSION"
        cd "$ROOT/dist/backend/modules/grpcwebproxy-$GRPC_WEB_PROXY_VERSION"

        wget https://github.com/improbable-eng/grpc-web/releases/download/v$GRPC_WEB_PROXY_VERSION/grpcwebproxy-v$GRPC_WEB_PROXY_VERSION-win64.exe.zip
        unzip -qq ./grpcwebproxy-v$GRPC_WEB_PROXY_VERSION-win64.exe.zip
        mv dist/grpcwebproxy-v$GRPC_WEB_PROXY_VERSION-win64.exe .
        rm -r dist
        rm ./grpcwebproxy-v$GRPC_WEB_PROXY_VERSION-win64.exe.zip
    )
else
    echo "grpcwebproxy found"
fi


# copy scripts
echo "Copying scripts..."
cp "$ROOT/backend/start.bat" "$ROOT/dist/backend"
cp "$ROOT/backend/stop.bat" "$ROOT/dist/backend"
cp "$ROOT/backend/versions.cfg" "$ROOT/dist/backend"

echo "Finished"
