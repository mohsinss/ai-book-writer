from flask import Flask, request, send_file, jsonify, current_app
from flask_cors import CORS
import io
import traceback
from book_generator import generate_book, generate_title, create_cover_image, create_doc

app = Flask(__name__)
CORS(app)

@app.route('/api/generate-book', methods=['POST'])
def generate_book_endpoint():
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        data = request.get_json()
        writing_style = data.get('writing_style')
        book_description = data.get('book_description')
        chapter_titles = data.get('chapter_titles')
        chapter_elaborations = data.get('chapter_elaborations', [])  # Default to an empty list if not provided

        if not all([writing_style, book_description, chapter_titles]):
            return jsonify({"error": "Missing data for writing style, book description, or chapter titles"}), 400

        chapters_content = generate_book(writing_style, book_description, chapter_titles, chapter_elaborations)
        title = generate_title(book_description)
        cover_image_path = create_cover_image(book_description)

        file_stream = io.BytesIO()
        create_doc(title, 'Author Name', chapters_content, chapter_titles, cover_image_path, file_stream)
        file_stream.seek(0)

        return send_file(file_stream, as_attachment=True, attachment_filename=f"{title}.docx")

    except Exception as e:
        current_app.logger.error(f"Failed to generate book: {e}\n{traceback.format_exc()}")
        return jsonify({"error": "Error generating book", "message": str(e)}), 500

@app.route('/', methods=['GET'])
def index():
    return jsonify({'message': 'Welcome to the Book Generator API'})

if __name__ == '__main__':
    app.run(debug=True, port=5001)