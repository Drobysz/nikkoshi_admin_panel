export type User = {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
};

export type Paragraph = {
  id?: number;
  article_id?: number;
  title: string;
  text: string;
  order: number;
  created_at?: string;
  updated_at?: string;
};

export type Timeline = {
  id?: number;
  article_id?: number;
  year: number | string;
  event: string;
  created_at?: string;
  updated_at?: string;
};

export type Article = {
  id: number;
  title: string;
  subtitle: string;
  year: number | string;
  type: string;
  author_id?: number;
  created_at?: string;
  updated_at?: string;
  author?: User | null;
  img_url?: string | null;
  image_url?: string | null;
  paragraphs?: Paragraph[];
  timelines?: Timeline[];
};

export type ApiCollection<T> = {
  data: T[];
};

export type ApiResource<T> = {
  data: T;
  msg?: string;
};

export type LoginResponse = {
  token: string;
  user: User | ApiResource<User>;
};

export function articleImageUrl(article: Article): string | null {
  return article.img_url ?? article.image_url ?? null;
}
