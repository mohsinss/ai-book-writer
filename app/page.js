import Image from "next/image";

import BookForm from '../components/BookForm';

export default function Home() {
  return (
    <div>
      <h1>Book Generator</h1>
      <BookForm />
    </div>
  );
}
