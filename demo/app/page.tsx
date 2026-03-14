import Link from "next/link";

const agentSteps = [
  "Listen to a freeform goal and turn it into a concrete commitment.",
  "Use deterministic evidence when possible and keep conversational hints advisory.",
  "Recommend the next action, but never sign on behalf of the human.",
  "Prepare the contract call and let the user approve it in-wallet.",
];

const userSteps = [
  "Describe a health goal in plain language.",
  "Review the proposed cadence, target, stake, and proof policy.",
  "Create the commitment by signing the onchain transaction.",
  "Feed evidence into the system and review the next recommended action.",
];

export default function HomePage() {
  return (
    <main className="page">
      <nav className="topbar">
        <span className="brand">Habit Maker</span>
        <div className="topbar-links">
          <Link href="/manual">Manual Test</Link>
          <a href="/api/plan-commitment">API</a>
        </div>
      </nav>

      <section className="hero hero-home">
        <div>
          <p className="eyebrow">Agents that cooperate</p>
          <h1>Health goals, bounded agent behavior, onchain enforcement.</h1>
          <p className="lede">
            Habit Maker is a thin external agent pattern: it translates a human goal into a commitment, evaluates evidence,
            recommends the next step, and prepares the transaction. The human still signs the blockchain action.
          </p>
        </div>
        <div className="hero-actions">
          <Link href="/manual" className="button-link">
            Open manual testing
          </Link>
          <a href="/api/plan-commitment" className="button-link button-link-secondary">
            Inspect API
          </a>
        </div>
      </section>

      <section className="grid landing-grid">
        <article className="card">
          <h2>How an agent should use this</h2>
          <ol className="number-list">
            {agentSteps.map(step => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>

        <article className="card">
          <h2>How a user should use this</h2>
          <ol className="number-list">
            {userSteps.map(step => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>

        <article className="card wide">
          <h2>Current live setup</h2>
          <div className="two-col">
            <div>
              <p>
                <strong>Chain:</strong> Base mainnet (`8453`)
              </p>
              <p>
                <strong>Contract:</strong> `HabitMakerCommitments`
              </p>
              <p>
                <strong>Address:</strong> `0x47cf89B3F97bFAF738fa909891b374cDa135d88E`
              </p>
            </div>
            <div>
              <p>
                <strong>Manual flow:</strong> `/manual`
              </p>
              <p>
                <strong>Planner endpoint:</strong> `/api/plan-commitment`
              </p>
              <p>
                <strong>Recommendation endpoint:</strong> `/api/recommend-action`
              </p>
            </div>
          </div>
        </article>

        <article className="card wide">
          <h2>Testing modes</h2>
          <div className="two-col">
            <div>
              <p className="muted">Agent mode</p>
              <p>
                Use the deployed API routes directly and treat the output as planning + recommendation support. The agent should
                never imply it can bypass wallet approval.
              </p>
            </div>
            <div>
              <p className="muted">Manual mode</p>
              <p>
                Open the manual page, connect a wallet, plan a commitment, inject evidence, request the recommendation, and sign
                the prepared transaction.
              </p>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}

