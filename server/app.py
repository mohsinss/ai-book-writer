from flask import Flask, request, send_file, jsonify, current_app
import traceback
from book_generator import generate_book_data, download_book, collection 

app = Flask(__name__)

@app.route('/api/generate-book', methods=['POST'])
def generate_book_endpoint():
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        data = request.get_json()
        # Log to check incoming data
        print(f"Received data: {data}")
        title, download_url, document_id = generate_book_data(data)
        return jsonify({"message": "Book generated successfully", "download_url": download_url, "title": title, "id": str(document_id)}), 200
    except Exception as e:
        current_app.logger.error(f"Failed to generate book: {e}\n{traceback.format_exc()}")
        return jsonify({"error": "Error generating book", "message": str(e)}), 500


@app.route('/api/books', methods=['GET'])
def get_books():
    try:
        books = list(collection.find({}, {'title': 1, '_id': 1}))
        books_list = [{'title': book['title'], 'id': str(book['_id'])} for book in books]
        return jsonify(books_list), 200
    except Exception as e:
        error_message = f"Failed to fetch books: {str(e)}\n{traceback.format_exc()}"
        current_app.logger.error(error_message)
        return jsonify({"error": "Error fetching books", "message": error_message}), 500
    

@app.route('/download/<document_id>', methods=['GET'])
def download_file(document_id):
    file_stream, filename, error = download_book(document_id)
    if file_stream:
        return send_file(
            file_stream,
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
    else:
        return jsonify({"error": error}), 404 if error == "File not found" else 500

@app.route('/', methods=['GET'])
def index():
    return jsonify({'message': 'Welcome to the Book Generator API'})

if __name__ == '__main__':
    app.run(debug=True, port=5001)
