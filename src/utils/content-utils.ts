import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCategoryUrl } from "@utils/url-utils.ts";
import { getAllPosts, supabase } from "@/lib/supabase";

// // Retrieve posts and sort them by publication date
async function getRawSortedPosts() {
	/*const allBlogPosts = await getCollection("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	const sorted = allBlogPosts.sort((a, b) => {
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});
	return sorted;*/
	return getAllPosts().then((res) => {
		if (res.error) {
			console.error("Error fetching posts for sorting:", res.error);
			return [];
		}
		return res.posts || [];
	});
}

export async function getSortedPosts() {
	const sorted = await getRawSortedPosts();

	for (let i = 1; i < sorted.length; i++) {
		sorted[i].nextSlug = sorted[i - 1].slug;
		sorted[i].nextTitle = sorted[i - 1].title;
	}
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].prevSlug = sorted[i + 1].slug;
		sorted[i].prevTitle = sorted[i + 1].title;
	}

	return sorted;
}
export type PostForList = {
	slug: string;
	// data: CollectionEntry<"posts">["data"];
	published_at: string;
	draft: boolean;
	title: string;
	category: string | null;
	tags: string[] | null;
};
export async function getSortedPostsList(): Promise<PostForList[]> {
	// const sortedFullPosts = await getRawSortedPosts();

	// // delete post.body
	// const sortedPostsList = sortedFullPosts.map((post) => ({
	// 	slug: post.slug,
	// 	data: post.data,
	// }));

	// return sortedPostsList;
	let filter = supabase
		.from("posts")
		.select("slug, published_at, draft, title, category, tags, deleted")
		.eq("deleted", false);
	if (import.meta.env.PROD) {
		filter = filter.eq("draft", false);
	}
	return await filter
		.order("published_at", { ascending: false })
		.then((res) => {
			if (res.error) {
				console.error("Error fetching posts for list:", res.error);
				return [];
			}
			return res.data || [];
		});
}
export type Tag = {
	name: string;
	count: number;
};

export async function getTagList(): Promise<Tag[]> {
	// const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
	// 	return import.meta.env.PROD ? data.draft !== true : true;
	// });
	const allBlogPosts = await getAllPosts().then((res) => {
		if (res.error) {
			console.error("Error fetching posts for tags:", res.error);
		}
		return res.posts || [];
	});

	const countMap: { [key: string]: number } = {};
	allBlogPosts.forEach((post) => {
		post.tags?.forEach((tag: string) => {
			if (!countMap[tag]) countMap[tag] = 0;
			countMap[tag]++;
		});
	});

	// sort tags
	const keys: string[] = Object.keys(countMap).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return keys.map((key) => ({ name: key, count: countMap[key] }));
}

export type Category = {
	name: string;
	count: number;
	url: string;
};

export async function getCategoryList(): Promise<Category[]> {
	// const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
	// 	return import.meta.env.PROD ? data.draft !== true : true;
	// });
	const allBlogPosts = await getAllPosts().then((res) => {
		if (res.error) {
			console.error("Error fetching posts for categories:", res.error);
		}
		return res.posts || [];
	});
	const count: { [key: string]: number } = {};
	allBlogPosts.forEach((post) => {
		if (!post.category) {
			const ucKey = i18n(I18nKey.uncategorized);
			count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
			return;
		}

		const categoryName =
			typeof post.category === "string"
				? post.category.trim()
				: String(post.category).trim();

		count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1;
	});

	const lst = Object.keys(count).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	const ret: Category[] = [];
	for (const c of lst) {
		ret.push({
			name: c,
			count: count[c],
			url: getCategoryUrl(c),
		});
	}
	return ret;
}
