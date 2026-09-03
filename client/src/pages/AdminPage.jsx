import { useEffect, useState } from "react";
import { getFeedback } from "../api";

export function AdminPage({ user, token }) {
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  async function loadFeedback() {
    setLoading(true);
    setError("");
    try {
      const response = await getFeedback(token);
      setFeedback(response.feedback);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeedback();
  }, [token]);

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleFeedback = normalizedQuery
    ? feedback.filter((item) => `${item.name} ${item.message}`.toLocaleLowerCase().includes(normalizedQuery))
    : feedback;

  return (
    <main className="page-shell admin-shell">
      <div className="page-heading">
        <div className="eyebrow">Admin workspace</div>
        <h1>Feedback inbox</h1>
        <p>A simple view of feedback received from members of the public.</p>
      </div>
      {loading ? <p className="muted">Loading feedback…</p> : error ? (
        <section className="feedback-list">
          <p className="error-message">{error}</p>
          <button className="primary-button" type="button" onClick={loadFeedback}>Retry</button>
        </section>
      ) : feedback.length === 0 ? <p className="muted">No feedback has been received yet.</p> : (
        <section className="feedback-list">
          <div className="list-header"><strong>Latest feedback</strong><span>{visibleFeedback.length} items</span></div>
        <label>
          Search feedback
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search messages or names" />
        </label>
        {visibleFeedback.length === 0 && <p className="muted">{normalizedQuery ? "No feedback matches your search." : "No feedback has been received yet."}</p>}
        {visibleFeedback.map((item) => (
          <article className="feedback-row" key={item.id}>
            <div>
              <div className="feedback-meta">{item.name} · {new Date(item.createdAt).toLocaleDateString()}</div>
              <p>{item.message}</p>
            </div>
            <span className="status-pill">{item.status}</span>
          </article>
        ))}
        </section>
      )}
    </main>
  );
}
