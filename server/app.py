from flask import Flask, request, send_file, jsonify, current_app
import traceback
from book_generator import generate_book_data, download_book, collection 

app = Flask(__name__)

@app.route('/api/generate-book', methods=['POST'])
def generate_book_endpoint():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    data = request.get_json()
    print(f"Received data: {data}")  # Debug: Print received data
    try:
        title, download_url, document_id = generate_book_data(data)
        return jsonify({"message": "Book generated successfully", "download_url": download_url, "title": title, "id": str(document_id)}), 200
    except Exception as e:
        current_app.logger.error(f"Failed to generate book: {e}\n{traceback.format_exc()}")
        return jsonify({"error": "Error generating book", "message": str(e)}), 500



@app.route('/api/books', methods=['GET'])
def get_books():
    # Pagination parameters
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    skip = (page - 1) * per_page

    try:
        # Fetch books with pagination
        books_cursor = collection.find({}, {'title': 1, '_id': 1}).skip(skip).limit(per_page)
        books = list(books_cursor)
        total_books = collection.count_documents({})
        books_list = [{'title': book['title'], 'id': str(book['_id'])} for book in books]

        # Constructing pagination metadata
        return jsonify({
            'books': books_list,
            'total_books': total_books,
            'page': page,
            'per_page': per_page,
            'pages': total_books // per_page + (1 if total_books % per_page > 0 else 0)
        }), 200
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
