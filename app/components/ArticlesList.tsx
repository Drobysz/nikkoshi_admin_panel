"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest, formatApiError, unwrapData } from "@/lib/api";
import {
  articleImageUrl,
  type ApiCollection,
  type Article,
} from "@/types/api";

export default function ArticlesList() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadArticles() {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<ApiCollection<Article>>("/articles");
      setArticles(unwrapData<Article[]>(response));
    } catch (loadError) {
      setError(formatApiError(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadArticles();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function deleteArticle(article: Article) {
    const confirmed = window.confirm(`Delete article "${article.title}"?`);
    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await apiRequest<void>(`/articles/${article.id}`, { method: "DELETE" });
      setMessage("Article deleted.");
      await loadArticles();
    } catch (deleteError) {
      setError(formatApiError(deleteError));
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Articles</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage article covers, content sections, and timeline events.
          </p>
        </div>
        <Link
          href="/articles/new"
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          New article
        </Link>
      </header>

      {message ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-5 py-8 text-sm text-slate-500">
            Loading articles...
          </div>
        ) : articles.length === 0 ? (
          <div className="px-5 py-8 text-sm text-slate-500">
            No articles found.
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">ID</th>
                <th className="px-5 py-3 font-semibold">Cover</th>
                <th className="px-5 py-3 font-semibold">Title</th>
                <th className="px-5 py-3 font-semibold">Subtitle</th>
                <th className="px-5 py-3 font-semibold">Year</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Author</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {articles.map((article) => {
                const imageUrl = articleImageUrl(article);

                return (
                  <tr key={article.id}>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">
                      {article.id}
                    </td>
                    <td className="px-5 py-3">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt=""
                          className="h-12 w-16 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-16 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400">
                          None
                        </div>
                      )}
                    </td>
                    <td className="max-w-56 px-5 py-3 font-medium text-slate-950">
                      {article.title}
                    </td>
                    <td className="max-w-64 px-5 py-3 text-slate-500">
                      {article.subtitle}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{article.year}</td>
                    <td className="px-5 py-3 text-slate-600">{article.type}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {article.author?.name ?? "-"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/articles/${article.id}`}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          View/Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => void deleteArticle(article)}
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
