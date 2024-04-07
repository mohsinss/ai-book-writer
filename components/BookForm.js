// BookForm.js
'use client';
import React, { useState } from 'react';
import axios from 'axios';
import styles from './BookForm.module.css';

const BookForm = () => {
  const [writingStyle, setWritingStyle] = useState('');
  const [bookDescription, setBookDescription] = useState('');
  const [chapterCount, setChapterCount] = useState(0);
  const [chapterTitles, setChapterTitles] = useState([]);
  const [checkedChapters, setCheckedChapters] = useState([]);
  const [chapterElaborations, setChapterElaborations] = useState([]);

  const handleChapterCountChange = (e) => {
    const count = parseInt(e.target.value, 10);
    setChapterCount(count);
    setChapterTitles(Array(count).fill(''));
    setCheckedChapters(Array(count).fill(false));
    setChapterElaborations(Array(count).fill(''));
  };

  const handleChapterTitleChange = (index, value) => {
    const updatedTitles = [...chapterTitles];
    updatedTitles[index] = value;
    setChapterTitles(updatedTitles);
  };

  const handleChapterCheck = (index) => {
    const updatedCheckedChapters = [...checkedChapters];
    updatedCheckedChapters[index] = !updatedCheckedChapters[index];
    setCheckedChapters(updatedCheckedChapters);
  };

  const handleChapterElaborationChange = (index, value) => {
    const updatedElaborations = [...chapterElaborations];
    updatedElaborations[index] = value;
    setChapterElaborations(updatedElaborations);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = {
      writing_style: writingStyle,
      book_description: bookDescription,
      chapter_titles: chapterTitles,
      chapter_elaborations: chapterElaborations,
    };

    try {
      const response = await axios.post('http://localhost:5001/api/generate-book', formData, {
        headers: { 'Content-Type': 'application/json' },
        responseType: 'blob',
      });

      const downloadUrl = window.URL.createObjectURL(new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }));
      const link = document.createElement('a');
      link.href = downloadUrl;

      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'generatedBook.docx';
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (fileNameMatch.length > 1) fileName = fileNameMatch[1].replace(/['"]/g, '');
      }

      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>Generate Your Book</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="writingStyle" className={styles.label}>
            Writing Style
          </label>
          <input
            type="text"
            id="writingStyle"
            value={writingStyle}
            onChange={(e) => setWritingStyle(e.target.value)}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="bookDescription" className={styles.label}>
            Book Description
          </label>
          <textarea
            id="bookDescription"
            value={bookDescription}
            onChange={(e) => setBookDescription(e.target.value)}
            className={styles.textarea}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="chapterCount" className={styles.label}>
            Number of Chapters
          </label>
          <input
            type="number"
            id="chapterCount"
            value={chapterCount}
            onChange={handleChapterCountChange}
            className={styles.input}
          />
        </div>
        {Array.from({ length: chapterCount }, (_, index) => (
          <div key={index} className={styles.formGroup}>
            <div className={styles.chapterTitleWrapper}>
              <input
                type="checkbox"
                id={`chapterCheck${index}`}
                checked={checkedChapters[index]}
                onChange={() => handleChapterCheck(index)}
                className={styles.checkbox}
              />
              <label htmlFor={`chapterTitle${index}`} className={styles.label}>
                Chapter {index + 1} Title
              </label>
            </div>
            <input
              type="text"
              id={`chapterTitle${index}`}
              value={chapterTitles[index]}
              onChange={(e) => handleChapterTitleChange(index, e.target.value)}
              className={styles.input}
            />
            {checkedChapters[index] && (
              <div className={styles.formGroup}>
                <label htmlFor={`chapterElaboration${index}`} className={styles.label}>
                  Elaborate more
                </label>
                <textarea
                  id={`chapterElaboration${index}`}
                  value={chapterElaborations[index]}
                  onChange={(e) => handleChapterElaborationChange(index, e.target.value)}
                  className={styles.textarea}
                />
              </div>
            )}
          </div>
        ))}
        <button type="submit" className={styles.submitButton}>
          Submit
        </button>
      </form>
    </div>
  );
};

export default BookForm;