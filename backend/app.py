from flask import Flask
from routes import register_routes
from flask_cors import CORS

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})
register_routes(app)

if __name__ == "__main__":
    app.run(debug=True)
