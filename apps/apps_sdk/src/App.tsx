import { useState } from "react";

export function App() {
  const [count, setCount] = useState(0);
  return <main style={{ maxWidth: 720, margin: "5rem auto", padding: "0 1rem" }}>
    <h1>displaymap Viewer</h1>
  </main>;
}
