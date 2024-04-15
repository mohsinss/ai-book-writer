// BookForm.js
'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './BookForm.module.css';

const BookForm = () => {
  const [writingStyle, setWritingStyle] = useState('Imagine an economist who writes in a style akin to "Freakonomics" turning the mundane into the extraordinary with humor and clarity...');
  const [bookDescription, setBookDescription] = useState('This book delves into the hidden economics of daily life, employing a witty and accessible approach to unravel the surprising truths behind ordinary activities...');
  const [chapterCount, setChapterCount] = useState(1);
  const [chapterTitles, setChapterTitles] = useState([]);
  const [checkedChapters, setCheckedChapters] = useState([]);
  const [chapterElaborations, setChapterElaborations] = useState([]);
  const [books, setBooks] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormModified, setIsFormModified] = useState(false);
  const [bookId, setBookId] = useState('');

  
  const handleChapterCountChange = (e) => {
    const count = parseInt(e.target.value, 10);
    setChapterCount(count);
    setChapterTitles(Array(count).fill(''));
    setCheckedChapters(Array(count).fill(false));
    setChapterElaborations(Array(count).fill(''));
    setIsFormModified(true);
  };

  const handleChapterTitleChange = (index, value) => {
    const updatedTitles = [...chapterTitles];
    updatedTitles[index] = value;
    setChapterTitles(updatedTitles);
    setIsFormModified(true);
  };

  const handleChapterCheck = (index) => {
    const updatedCheckedChapters = [...checkedChapters];
    updatedCheckedChapters[index] = !updatedCheckedChapters[index];
    setCheckedChapters(updatedCheckedChapters);
    setIsFormModified(true);
  };

  const handleChapterElaborationChange = (index, value) => {
    const updatedElaborations = [...chapterElaborations];
    updatedElaborations[index] = value;
    setChapterElaborations(updatedElaborations);
    setIsFormModified(true);
  };

  const handleInputChange = () => {
    setIsFormModified(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = {
      writing_style: writingStyle,
      book_description: bookDescription,
      chapter_titles: chapterTitles,
      chapter_elaborations: chapterElaborations,
    };

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/generate-book`, formData, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.data && response.data.download_url) {
        setDownloadUrl(response.data.download_url);
        setTitle(response.data.title);
        setBookId(response.data.id); // Store the book ID
      } else {
        console.error('No download URL received:', response.data);
      }
      setIsFormModified(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
    setIsSubmitting(false);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/books`);
      setBooks(response.data);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/books`)
      .then(response => {
        setBooks(response.data);
      })
      .catch(error => {
        console.error('Error fetching books:', error);
      });
  }, []);

  const handleDownload = (event, bookId, title) => {
    event.preventDefault();
    event.stopPropagation();

    console.log("Document ID:", bookId);
    console.log("Title:", title);

    axios.get(`${process.env.REACT_APP_API_BASE_URL}/download/${bookId}`, { responseType: 'blob' })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${title}.docx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(error => {
        console.error('Error downloading file:', error);
      });
  };

  

  return (
<div className={styles.container}>
  <div className={styles.bookListContainer}>
    <h3>Generated Books:</h3>
    {books.length > 0 ? (
      <ul className={styles.bookList}>
        {books.map(book => (
          <li key={book.id}>{book.title}</li>
        ))}
      </ul>
    ) : (
      <p>No books found.</p>
    )}
  </div>

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
            onChange={(e) => {
              setWritingStyle(e.target.value);
              handleInputChange();
            }}
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
            onChange={(e) => {
              setBookDescription(e.target.value);
              handleInputChange();
            }}
            className={styles.textarea}
          />
        </div>
        <div className={styles.formGroup}>
  <label htmlFor="chapterCount" className={styles.label}>
    Number of Chapters
  </label>
  <select
    id="chapterCount"
    value={chapterCount}
    onChange={handleChapterCountChange}
    className={styles.input}
    style={{ width: '70px' }} 
  >
    {Array.from({ length: 25 }, (_, i) => (
      <option key={i} value={i + 1}>
        {i + 1}
      </option>
    ))}
  </select>
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
    <div className={styles.buttonContainer}>
      <button
        type="submit"
        className={styles.submitButton}
        disabled={isSubmitting || !isFormModified}
      >
        {isSubmitting ? 'Generating...' : 'Submit'}
      </button>
      {downloadUrl && (
    <button onClick={(event) => handleDownload(event, bookId, title)} className={styles.downloadButton}>
        Download your book: {title}
    </button>
)}
    </div>
      </form>
      </div>
    </div>
  );
};

export default BookForm;