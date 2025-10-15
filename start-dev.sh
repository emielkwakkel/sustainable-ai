#!/bin/bash

# Set Node.js to trust our self-signed certificate
export NODE_EXTRA_CA_CERTS="$(pwd)/certs/localhost-cert.pem"

# Start the development server
npm run dev
