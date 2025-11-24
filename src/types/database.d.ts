export type PostInfo = {
    id: string;
    title: string;
    slug: string;
    published_at: string;
    updated_at: string;
    draft: boolean;
    description: string | null;
    image: string | null;
    tags: string[] | null;
    category: string | null;
    lang: string | null;
    body: string;
};
