from flask import jsonify, request
from services import researcher_get_vulns, researcher_get_bounty

def register_routes(app):
    @app.route("/")
    def welcome():
        name = request.args.get("name")
        if not name:
            return jsonify({"error": "name is required"}), 400
        vulns = researcher_get_vulns(name)
        totals = researcher_get_bounty(vulns, name)
        if not totals:
            return jsonify({"error": "This name is not exist"}), 404
        return jsonify(totals)
