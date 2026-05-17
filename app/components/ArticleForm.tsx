"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiRequest, formatApiError, unwrapData } from "@/lib/api";
import {
  articleImageUrl,
  type ApiCollection,
  type ApiResource,
  type Article,
  type Paragraph,
  type Timeline,
  type User,
} from "@/types/api";

type ArticleFormValues = {
  title: string;
  subtitle: string;
  year: string;
  type: string;
  author_id: string;
};

const emptyArticle: ArticleFormValues = {
  title: "",
  subtitle: "",
  year: "",
  type: "temple",
  author_id: "",
};

const emptyParagraph = (): Paragraph => ({
  title: "",
  text: "",
  order: 1,
});

const emptyTimeline = (): Timeline => ({
  year: "",
  event: "",
});

export default function ArticleForm({ articleId }: { articleId?: number }) {
  const router = useRouter();
  const isEditing = Boolean(articleId);
  const [users, setUsers] = useState<User[]>([]);
  const [article, setArticle] = useState<Article | null>(null);
  const [values, setValues] = useState<ArticleFormValues>(emptyArticle);
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([emptyParagraph()]);
  const [timelines, setTimelines] = useState<Timeline[]>([emptyTimeline()]);
  const [removedParagraphIds, setRemovedParagraphIds] = useState<number[]>([]);
  const [removedTimelineIds, setRemovedTimelineIds] = useState<number[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const currentImageUrl = useMemo(() => {
    return article ? articleImageUrl(article) : null;
  }, [article]);

  async function loadArticle(id: number) {
    const response = await apiRequest<ApiResource<Article>>(`/articles/${id}`);
    const loadedArticle = unwrapData<Article>(response);
    const loadedParagraphs = [...(loadedArticle.paragraphs ?? [])].sort(
      (a, b) => Number(a.order) - Number(b.order),
    );

    setArticle(loadedArticle);
    setValues({
      title: loadedArticle.title ?? "",
      subtitle: loadedArticle.subtitle ?? "",
      year: String(loadedArticle.year ?? ""),
      type: loadedArticle.type ?? "",
      author_id: String(
        loadedArticle.author?.id ?? loadedArticle.author_id ?? "",
      ),
    });
    setParagraphs(loadedParagraphs.length ? loadedParagraphs : [emptyParagraph()]);
    setTimelines(
      loadedArticle.timelines?.length
        ? loadedArticle.timelines
        : [emptyTimeline()],
    );
    setRemovedParagraphIds([]);
    setRemovedTimelineIds([]);
    setCoverFile(null);
  }

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setLoading(true);
      setError("");

      try {
        const response = await apiRequest<ApiCollection<User>>("/users");
        const loadedUsers = unwrapData<User[]>(response);
        setUsers(loadedUsers);

        if (loadedUsers.length > 0 && !articleId) {
          setValues((current) =>
            current.author_id
              ? current
              : { ...current, author_id: String(loadedUsers[0].id) },
          );
        }

        if (articleId) {
          await loadArticle(articleId);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(formatApiError(loadError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void boot();

    return () => {
      cancelled = true;
    };
  }, [articleId]);

  function updateValue(field: keyof ArticleFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function updateParagraph(
    index: number,
    field: keyof Pick<Paragraph, "title" | "text" | "order">,
    value: string,
  ) {
    setParagraphs((current) =>
      current.map((paragraph, itemIndex) =>
        itemIndex === index
          ? {
              ...paragraph,
              [field]: field === "order" ? Number(value) : value,
            }
          : paragraph,
      ),
    );
  }

  function updateTimeline(
    index: number,
    field: keyof Pick<Timeline, "year" | "event">,
    value: string,
  ) {
    setTimelines((current) =>
      current.map((timeline, itemIndex) =>
        itemIndex === index ? { ...timeline, [field]: value } : timeline,
      ),
    );
  }

  function removeParagraph(index: number) {
    setParagraphs((current) => {
      const paragraph = current[index];
      if (paragraph?.id) {
        setRemovedParagraphIds((ids) => [...ids, paragraph.id as number]);
      }

      const next = current.filter((_, itemIndex) => itemIndex !== index);
      return next.length ? next : [emptyParagraph()];
    });
  }

  function removeTimeline(index: number) {
    setTimelines((current) => {
      const timeline = current[index];
      if (timeline?.id) {
        setRemovedTimelineIds((ids) => [...ids, timeline.id as number]);
      }

      const next = current.filter((_, itemIndex) => itemIndex !== index);
      return next.length ? next : [emptyTimeline()];
    });
  }

  function moveParagraph(index: number, direction: -1 | 1) {
    setParagraphs((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((paragraph, itemIndex) => ({
        ...paragraph,
        order: itemIndex + 1,
      }));
    });
  }

  function validateForm() {
    if (!values.title.trim()) return "Title is required.";
    if (!values.subtitle.trim()) return "Subtitle is required.";
    if (!values.year.trim()) return "Year is required.";
    if (!values.type.trim()) return "Type is required.";
    if (!values.author_id) return "Author is required.";
    if (!isEditing && !coverFile) return "Cover image is required.";

    for (const paragraph of paragraphs) {
      if (!paragraph.title.trim() || !paragraph.text.trim()) {
        return "Paragraph title and text are required.";
      }
    }

    for (const timeline of timelines) {
      if (!String(timeline.year).trim() || !timeline.event.trim()) {
        return "Timeline year and event are required.";
      }
    }

    return "";
  }

  function articleFormData() {
    const formData = new FormData();
    formData.append("title", values.title.trim());
    formData.append("subtitle", values.subtitle.trim());
    formData.append("type", values.type.trim());
    formData.append("year", values.year);
    formData.append("author_id", values.author_id);

    if (coverFile) {
      formData.append("cover", coverFile);
    }

    return formData;
  }

  function appendNestedCreateData(formData: FormData) {
    paragraphs.forEach((paragraph, index) => {
      formData.append(`paragraphs[${index}][title]`, paragraph.title.trim());
      formData.append(`paragraphs[${index}][text]`, paragraph.text.trim());
      formData.append(`paragraphs[${index}][order]`, String(paragraph.order));
    });

    timelines.forEach((timeline, index) => {
      formData.append(`timelines[${index}][year]`, String(timeline.year));
      formData.append(`timelines[${index}][event]`, timeline.event.trim());
    });
  }

  async function syncParagraphs(id: number) {
    await Promise.all(
      removedParagraphIds.map((paragraphId) =>
        apiRequest<void>(`/paragraphs/${paragraphId}`, { method: "DELETE" }),
      ),
    );

    await Promise.all(
      paragraphs.map((paragraph) => {
        const body = {
          title: paragraph.title.trim(),
          text: paragraph.text.trim(),
          order: Number(paragraph.order),
        };

        return paragraph.id
          ? apiRequest<void>(`/paragraphs/${paragraph.id}`, {
              method: "PATCH",
              body,
            })
          : apiRequest<void>(`/articles/${id}/paragraphs`, {
              method: "POST",
              body,
            });
      }),
    );
  }

  async function syncTimelines(id: number) {
    await Promise.all(
      removedTimelineIds.map((timelineId) =>
        apiRequest<void>(`/timelines/${timelineId}`, { method: "DELETE" }),
      ),
    );

    await Promise.all(
      timelines.map((timeline) => {
        const body = {
          year: Number(timeline.year),
          event: timeline.event.trim(),
        };

        return timeline.id
          ? apiRequest<void>(`/timelines/${timeline.id}`, {
              method: "PATCH",
              body,
            })
          : apiRequest<void>(`/articles/${id}/timelines`, {
              method: "POST",
              body,
            });
      }),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      const formData = articleFormData();

      if (articleId) {
        formData.append("_method", "PATCH");
        await apiRequest<ApiResource<Article>>(`/articles/${articleId}`, {
          method: "POST",
          body: formData,
        });
        await syncParagraphs(articleId);
        await syncTimelines(articleId);
        await loadArticle(articleId);
        setMessage("Article updated.");
      } else {
        appendNestedCreateData(formData);
        const response = await apiRequest<ApiResource<Article>>("/articles", {
          method: "POST",
          body: formData,
        });
        const createdArticle = unwrapData<Article>(response);
        router.replace(`/articles/${createdArticle.id}`);
      }
    } catch (submitError) {
      setError(formatApiError(submitError));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-5 py-8 text-sm text-slate-500 shadow-sm">
        Loading article editor...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">
            {isEditing ? "Edit article" : "New article"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Write the article metadata, sections, and historical timeline.
          </p>
        </div>
        <Link
          href="/articles"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back to articles
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

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Article</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <input
              value={values.title}
              onChange={(event) => updateValue("title", event.target.value)}
              className="form-input"
            />
          </Field>
          <Field label="Subtitle">
            <input
              value={values.subtitle}
              onChange={(event) => updateValue("subtitle", event.target.value)}
              className="form-input"
            />
          </Field>
          <Field label="Year">
            <input
              type="number"
              value={values.year}
              onChange={(event) => updateValue("year", event.target.value)}
              className="form-input"
            />
          </Field>
          <Field label="Type">
            <input
              value={values.type}
              onChange={(event) => updateValue("type", event.target.value)}
              className="form-input"
            />
          </Field>
          <Field label="Author">
            <select
              value={values.author_id}
              onChange={(event) => updateValue("author_id", event.target.value)}
              className="form-input"
            >
              <option value="">Select author</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={isEditing ? "Cover image" : "Cover image required"}>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(event) =>
                setCoverFile(event.target.files?.[0] ?? null)
              }
              className="form-input file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700"
            />
          </Field>
        </div>
        {currentImageUrl ? (
          <div className="mt-5">
            <p className="text-sm font-medium text-slate-700">Current cover</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImageUrl}
              alt=""
              className="mt-2 h-36 w-56 rounded-md object-cover"
            />
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-slate-950">Paragraphs</h2>
          <button
            type="button"
            onClick={() =>
              setParagraphs((current) => [
                ...current,
                { ...emptyParagraph(), order: current.length + 1 },
              ])
            }
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Add paragraph
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {paragraphs.map((paragraph, index) => (
            <div
              key={paragraph.id ?? `new-${index}`}
              className="rounded-md border border-slate-200 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-700">
                  Paragraph {index + 1}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => moveParagraph(index, -1)}
                    className="small-button"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveParagraph(index, 1)}
                    className="small-button"
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    onClick={() => removeParagraph(index)}
                    className="small-danger-button"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_120px]">
                <Field label="Title">
                  <input
                    value={paragraph.title}
                    onChange={(event) =>
                      updateParagraph(index, "title", event.target.value)
                    }
                    className="form-input"
                  />
                </Field>
                <Field label="Order">
                  <input
                    type="number"
                    value={paragraph.order}
                    onChange={(event) =>
                      updateParagraph(index, "order", event.target.value)
                    }
                    className="form-input"
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Text">
                    <textarea
                      value={paragraph.text}
                      onChange={(event) =>
                        updateParagraph(index, "text", event.target.value)
                      }
                      className="form-input min-h-32 resize-y"
                    />
                  </Field>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-slate-950">Timeline</h2>
          <button
            type="button"
            onClick={() => setTimelines((current) => [...current, emptyTimeline()])}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Add event
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {timelines.map((timeline, index) => (
            <div
              key={timeline.id ?? `new-${index}`}
              className="grid gap-4 rounded-md border border-slate-200 p-4 md:grid-cols-[140px_1fr_auto]"
            >
              <Field label="Year">
                <input
                  type="number"
                  value={timeline.year}
                  onChange={(event) =>
                    updateTimeline(index, "year", event.target.value)
                  }
                  className="form-input"
                />
              </Field>
              <Field label="Event">
                <input
                  value={timeline.event}
                  onChange={(event) =>
                    updateTimeline(index, "event", event.target.value)
                  }
                  className="form-input"
                />
              </Field>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeTimeline(index)}
                  className="small-danger-button h-9"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Link
          href="/articles"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-slate-950 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400"
        >
          {saving ? "Saving..." : isEditing ? "Update article" : "Create article"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
