import { PAGE_SIZE } from "@constants/constants";
import { createClient } from "@supabase/supabase-js";
import type { PostInfo } from "@/types/database";

export const supabase = createClient(
	import.meta.env.PUBLIC_SUPABASE_URL,
	import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
);

export type GetAllPostsResult = {
	posts: PostInfo[] | null;
	error: Error | null;
};

export type GetPostBySlugResult = {
	post: PostInfo | null;
	error: Error | null;
};

export async function getAllPostsPaginated(
	_page: number,
): Promise<GetAllPostsResult> {
	let filter = supabase.from("posts").select("*").eq("deleted", false);
	if (import.meta.env.PROD) {
		filter = filter.eq("draft", false);
	}
	const { data: posts, error } = await filter
		.order("published_at", { ascending: false })
		.limit(PAGE_SIZE);
	return { posts, error };
}

export async function getAllPosts(): Promise<GetAllPostsResult> {
	let filter = supabase.from("posts").select("*").eq("deleted", false);
	if (import.meta.env.PROD) {
		filter = filter.eq("draft", false);
	}
	const { data: posts, error } = await filter.order("published_at", {
		ascending: false,
	});
	return { posts, error };
}

export async function getPostBySlug(
	slug: string,
): Promise<GetPostBySlugResult> {
	const { data: posts, error } = await supabase
		.from("posts")
		.select("*")
		.eq("deleted", false)
		.eq("slug", slug)
		.limit(1);
	if (posts && posts.length > 0) {
		return { post: posts[0], error };
	}
	return { post: null, error };
}
