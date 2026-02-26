# IPMI Tools Application

download ipmitools https://www.dannynieuwenhuis.nl/download-windows-ipmitool-exe-version-1-8-18/

This repository contains a simple command-line IPMI management tool implemented in Python.  
It provides the following functionality:

- Power **on**, **off**, or **reset** a single server via `ipmitool` commands
- **List** all configured servers
- Retrieve a server's **power status**

The application is intended to be packaged and deployed inside a Docker container for ease of distribution.

## Usage

1. Build the docker image:
   ```sh
   docker build -t ipmi-tools .
   ```

2. (Optional) set an admin password and session secret before running:
   ```sh
   export ADMIN_PASSWORD=yourpass
   export SECRET_KEY=a_random_string
   ```
   Defaults are `admin` and `devsecret`.

3. Run the container, mounting your `servers.json` and mapping the port:
   ```sh
   docker run -d \
     --name ipmi-app \
     -v $(pwd)/servers.json:/app/servers.json \
     -e ADMIN_PASSWORD=$ADMIN_PASSWORD \
     -p 5000:5000 \
     ipmi-tools
   ```
   When you visit `http://localhost:5000` you'll be prompted for the password.  Without logging in you can only view the server list; controls are enabled after authentication.


