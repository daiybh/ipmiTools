import json
import subprocess
import sys

CONFIG_FILE = "servers.json"


def load_servers():
    try:
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def save_servers(servers):
    with open(CONFIG_FILE, "w") as f:
        json.dump(servers, f, indent=2)


def run_ipmi(host, user, password, command):
    args = ["ipmitool", "-I", "lanplus", "-H", host, "-U", user, "-P", password] + command
    try:
        result = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True, text=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        # propagate error message
        return f"error: {e.stderr.strip()}"


def add_server(name, host, user, password):
    servers = load_servers()
    servers[name] = {"host": host, "user": user, "password": password}
    save_servers(servers)


def remove_server(name):
    servers = load_servers()
    if name in servers:
        del servers[name]
        save_servers(servers)


def power(name, action):
    servers = load_servers()
    if name not in servers:
        return None
    s = servers[name]
    return run_ipmi(s['host'], s['user'], s['password'], ["chassis", "power", action])


def status(name):
    servers = load_servers()
    if name not in servers:
        return None
    s = servers[name]
    return run_ipmi(s['host'], s['user'], s['password'], ["chassis", "power", "status"])
