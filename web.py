from flask import Flask, request, jsonify, send_from_directory, session
import core
import os
from functools import wraps


def create_app():
    app = Flask(__name__, static_folder="static", static_url_path="")
    # secret key for session cookies
    app.secret_key = os.environ.get('SECRET_KEY', 'devsecret')
    # admin password configurable via env var
    app.config['ADMIN_PASSWORD'] = os.environ.get('ADMIN_PASSWORD', 'adminX')

    def login_required(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not session.get('logged_in'):
                return jsonify({"error": "unauthorized"}), 401
            return f(*args, **kwargs)
        return decorated


    # serve single-page application
    @app.route('/')
    def index():
        return send_from_directory(app.static_folder, 'index.html')

    # login endpoint
    @app.route('/api/login', methods=['POST'])
    def api_login():
        data = request.get_json(force=True)
        pw = data.get('password', '')
        if pw == app.config['ADMIN_PASSWORD']:
            session['logged_in'] = True
            return jsonify({"ok": True})
        else:
            return jsonify({"error": "bad password"}), 401

    # auth status check
    @app.route('/api/auth', methods=['GET'])
    def api_auth():
        return jsonify({"logged_in": bool(session.get('logged_in'))})

    # list servers (without blocking for status)
    @app.route('/api/servers', methods=['GET'])
    def api_list():
        servers = core.load_servers()
        return jsonify({"servers": servers})

    # get status for a specific server
    @app.route('/api/status/<name>', methods=['GET'])
    def api_status(name):
        servers = core.load_servers()
        if name not in servers:
            return jsonify({"error": "not found"}), 404
        s = servers[name]
        stat = core.status(name) or "unknown"
        return jsonify({"name": name, "status": stat})

    # add server
    @app.route('/api/servers', methods=['POST'])
    @login_required
    def api_add():
        data = request.get_json(force=True)
        core.add_server(data['name'], data['host'], data['user'], data['password'])
        return jsonify({"ok": True}), 201

    # remove server
    @app.route('/api/servers/<name>', methods=['DELETE'])
    @login_required
    def api_remove(name):
        core.remove_server(name)
        return jsonify({"ok": True})

    # power action endpoint
    @app.route('/api/power/<name>/<action>', methods=['POST'])
    @login_required
    def api_power(name, action):
        servers = core.load_servers()
        if name not in servers:
            return jsonify({"error": "not found"}), 404
        s = servers[name]
        result = core.run_ipmi(s['host'], s['user'], s['password'], ['chassis', 'power', action])
        return jsonify({"result": result})

    return app
