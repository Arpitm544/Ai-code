import { useState, useEffect } from 'react';
import "prismjs/themes/prism-tomorrow.css";
import Editor from "react-simple-code-editor";
import prism from "prismjs";
import "prismjs/components/prism-java.min.js";  // Import Java support
import "prismjs/components/prism-python.min.js";  // Import Python support
import "prismjs/components/prism-javascript.min.js";  // Import JavaScript support
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import axios from 'axios';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  const [code, setCode] = useState(`// Default JavaScript code
function sum() {
  return 1 + 1;
}`);  // Default JavaScript code

  const [language, setLanguage] = useState('javascript');  // Default language is JavaScript
  const [review, setReview] = useState('');

  useEffect(() => {
    prism.highlightAll();
  }, [code]);

  async function reviewCode() {
    const response = await axios.post('https://ai-code-reviewer-ashen.vercel.app/ai/get-review', { code });
    setReview(response.data);
  }

  function handleLanguageChange(event) {
    const selectedLanguage = event.target.value;
    setLanguage(selectedLanguage);

    // Set default code based on selected language
    if (selectedLanguage === 'javascript') {
      setCode(`// Default JavaScript code
function sum() {
  return 1 + 1;
}`);
    } else if (selectedLanguage === 'java') {
      setCode(`// Default Java code
public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}`);
    } else if (selectedLanguage === 'python') {
      setCode(`# Default Python code
def sum():
    return 1 + 1`);
    }
  }

  return (
    <>
      <main>
        <div className="left">
          <div className="code">
            <Editor
              value={code}
              onValueChange={code => setCode(code)}
              highlight={code => prism.highlight(code, prism.languages[language], language)} // Dynamic language highlighting
              padding={10}
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: 16,
                border: "1px solid #ddd",
                borderRadius: "5px",
                height: "100%",
                width: "100%"
              }}
            />
          </div>
          <div>
            <select onChange={handleLanguageChange} value={language}>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="python">Python</option>
            </select>
          </div>
          <div
            onClick={reviewCode}
            className="review">Review</div>
        </div>
        <div className="right">
          <Markdown rehypePlugins={[rehypeHighlight]}>
            {review}
          </Markdown>
        </div>
      </main>
    </>
  );
}

export default App;