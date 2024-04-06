'use client'

import React, { useState } from 'react';
import axios from 'axios';

const BookForm = () => {
    const [writingStyle, setWritingStyle] = useState('');
    const [bookDescription, setBookDescription] = useState('');
    const [chapterTitles, setChapterTitles] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();

        const formData = {
            writing_style: writingStyle,
            book_description: bookDescription,
            chapter_titles: chapterTitles,
        };

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_ENDPOINT}`, formData, {
                headers: { 'Content-Type': 'application/json' },
                responseType: 'blob', // Ensure response is handled as a Blob
            });

            // Generate a download URL for the blob
            const downloadUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
            const link = document.createElement('a');
            link.href = downloadUrl;

            // Attempt to extract filename from the Content-Disposition header
            const contentDisposition = response.headers['content-disposition'];
            let fileName = 'generatedBook.docx'; // Default filename if extraction fails
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (fileNameMatch.length > 1) fileName = fileNameMatch[1].replace(/['"]/g, '');
            }

            // Trigger the download
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error submitting form:", error);
            // Optionally, implement further error handling (e.g., user feedback)
        }
    };
    

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>Writing Style:</label>
                <input type="text" value={writingStyle} onChange={(e) => setWritingStyle(e.target.value)} />
            </div>
            <div>
                <label>Book Description:</label>
                <textarea value={bookDescription} onChange={(e) => setBookDescription(e.target.value)} />
            </div>
            <div>
                <label>Chapter Titles (separated by commas):</label>
                <input type="text" value={chapterTitles} onChange={(e) => setChapterTitles(e.target.value)} />
            </div>
            <button type="submit">Submit</button>
        </form>
    );
};

export default BookForm;