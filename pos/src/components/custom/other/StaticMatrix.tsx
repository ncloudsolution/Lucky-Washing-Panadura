import { useEffect, useState } from "react";

export default function StaticMatrix() {
  const [rows, setRows] = useState(50);
  const columns = 20;
  const characters = "0123456789";
  const fontSize = 10; // Approximate height per character in pixels

  useEffect(() => {
    const calculateRows = () => {
      const height = window.innerHeight;
      const calculatedRows = Math.floor(height / fontSize);
      setRows(calculatedRows);
    };

    calculateRows();
    window.addEventListener("resize", calculateRows);
    return () => window.removeEventListener("resize", calculateRows);
  }, []);

  // Generate columns of random numbers
  const matrix: string[] = [];

  for (let col = 0; col < columns; col++) {
    let column = "";
    for (let row = 0; row < rows; row++) {
      column += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    matrix.push(column);
  }

  return (
    <div className="z-0 absolute left-0 right-0 top-0 bottom-0 opacity-30 overflow-hidden">
      <div className="flex text-xs justify-center gap-0 font-mono leading-tight text-superbase">
        {matrix.map((column, index) => (
          <div key={index} className="flex flex-col">
            {column.split("").map((char, i) => (
              <div key={i}>{char}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
