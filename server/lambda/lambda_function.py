import json
import book_generator

def lambda_handler(event, context):
    if 'body' not in event:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Missing request body'})
        }

    data = json.loads(event['body'])
    writing_style = data.get('writing_style')
    book_description = data.get('book_description')
    chapter_titles = data.get('chapter_titles')
    chapter_elaborations = data.get('chapter_elaborations', [])

    if not all([writing_style, book_description, chapter_titles]):
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Missing data for writing style, book description, or chapter titles'})
        }

    try:
        chapters_content = book_generator.generate_book(writing_style, book_description, chapter_titles, chapter_elaborations)
        title = book_generator.generate_title(book_description)
        cover_image_path = book_generator.create_cover_image(book_description)

        file_stream = io.BytesIO()
        book_generator.create_doc(title, 'Author Name', chapters_content, chapter_titles, cover_image_path, file_stream)
        file_stream.seek(0)

        return {
            'statusCode': 200,
            'body': base64.b64encode(file_stream.getvalue()).decode('utf-8'),
            'headers': {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': f'attachment; filename="{title}.docx"'
            }
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Error generating book', 'message': str(e)})
        }