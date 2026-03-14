import { readFile } from "fs/promises";
import { join } from "path";
import ReactMarkdown from "react-markdown";

export default async function HomePage() {
  const readmePath = join(process.cwd(), "README.md");
  const content = await readFile(readmePath, "utf-8");

  return (
    <main className="page">
      <article className="readme-content">
        <ReactMarkdown>{content}</ReactMarkdown>
      </article>
    </main>
  );
}
