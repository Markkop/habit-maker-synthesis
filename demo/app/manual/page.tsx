import Link from "next/link";
import { ManualTester } from "../../components/ManualTester";

export default function ManualPage() {
  return (
    <main className="page">
      <nav className="topbar">
        <Link href="/" className="brand">
          Habit Maker
        </Link>
        <div className="topbar-links">
          <Link href="/">How It Works</Link>
          <a href="https://habit-maker-synthesis-demo.vercel.app/api/plan-commitment">API</a>
        </div>
      </nav>
      <ManualTester />
    </main>
  );
}

