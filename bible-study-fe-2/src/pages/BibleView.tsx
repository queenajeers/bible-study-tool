import { useState } from "react";
import ReadHeader from "../components/ReadHeader";
import BibleChapter from "../components/BibleChapter";

export const BibleView = () => {
  const [book, setBook] = useState("GEN");
  const [chapter, setChapter] = useState(1);
  const [version, setVersion] = useState("BSB");

  return (
    <>
      <ReadHeader
        onSelectionChange={(b, c, v) => {
          setBook(b);
          setChapter(c);
          setVersion(v);
        }}
      />
      <div className="flex items-center justify-center">
        <BibleChapter book={book} chapter={chapter} version={version} />
      </div>
    </>
  );
};
