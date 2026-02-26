# Use a minimal Python base image
FROM python:3.11-slim

# install ipmitool
RUN apt-get update && \
    apt-get install -y ipmitool && \
    rm -rf /var/lib/apt/lists/*

# create app directory
WORKDIR /app

# install python dependencies
RUN pip install flask

# make sure servers.json exists (builds may run before it's added to repo)
RUN [ -f servers.json ] || echo "{}" > servers.json

# copy application files
COPY ipmi_app.py core.py web.py  ./

# copy static assets
COPY static ./static

# make script executable
RUN chmod +x ipmi_app.py

# default command
ENTRYPOINT ["/app/ipmi_app.py"]
