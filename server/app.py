from flask import Flask, request, send_file, jsonify, current_app
from flask_cors import CORS
import traceback
from book_generator import generate_book_data

app = Flask(__name__)
CORS(app)

@app.route('/api/generate-book', methods=['POST'])
def generate_book_endpoint():
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        data = request.get_json()

        title, download_url = generate_book_data(data)
        return jsonify({"message": "Book generated successfully", "download_url": download_url}), 200

    except Exception as e:
        current_app.logger.error(f"Failed to generate book: {e}\n{traceback.format_exc()}")
        return jsonify({"error": "Error generating book", "message": str(e)}), 500

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    file_path = f"generated_books/{filename}"
    return send_file(file_path, as_attachment=True)

@app.route('/', methods=['GET'])
def index():
    return jsonify({'message': 'Welcome to the Book Generator API'})

if __name__ == '__main__':
    app.run(debug=True, port=5001)