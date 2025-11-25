// import { AdmonitionComponent } from "../plugins/rehype-component-admonition.mjs";
// import { GithubCardComponent } from "../plugins/rehype-component-github-card.mjs";
import { toString as mdastToString } from "mdast-util-to-string";
import getReadingTime from "reading-time";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkGithubAdmonitionsToDirectives from "remark-github-admonitions-to-directives";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkSectionize from "remark-sectionize";
import { unified } from "unified";

export type MarkdownToHtmlResult = {
	html: string;
	excerpt: string;
	minutes: number;
	words: number;
};

export async function parseMarkdownToAst(markdown: string) {
	const processor = unified().use(remarkParse);
	const ast = processor.parse(markdown);
	await processor.run(ast);
	return ast;
}

export async function markdownToHtml(
	markdown: string,
): Promise<MarkdownToHtmlResult> {
	const processedContent = await unified()
		.use(remarkParse)
		.use(remarkMath)
		.use(remarkGithubAdmonitionsToDirectives)
		.use(remarkDirective)
		.use(remarkSectionize)
		.use(remarkRehype)
		.use(rehypeKatex)
		.use(rehypeSlug)
		/*.use(rehypeComponents, {
            components: {
                github: GithubCardComponent,
                note: (x, y) => AdmonitionComponent(x, y, "note"),
                tip: (x, y) => AdmonitionComponent(x, y, "tip"),
                important: (x, y) => AdmonitionComponent(x, y, "important"),
                caution: (x, y) => AdmonitionComponent(x, y, "caution"),
                warning: (x, y) => AdmonitionComponent(x, y, "warning"),
            },
        })*/
		.use(rehypeAutolinkHeadings, {
			behavior: "append",
			properties: {
				className: ["anchor"],
			},
			content: {
				type: "element",
				tagName: "span",
				properties: {
					className: ["anchor-icon"],
					"data-pagefind-ignore": true,
				},
				children: [
					{
						type: "text",
						value: "#",
					},
				],
			},
		})
		.use(rehypeStringify)
		.process(markdown);

	const ast = await parseMarkdownToAst(markdown);
	// Generate excerpt
	let excerpt = "";
	for (const node of ast.children) {
		if (node.type !== "paragraph") {
			continue;
		}
		excerpt = mdastToString(node);
		break;
	}
	// Generate reading time
	const textOnPage = mdastToString(ast);
	const readingTime = getReadingTime(textOnPage);

	const html = processedContent.toString();
	return {
		html: html,
		excerpt: excerpt,
		minutes: Math.max(1, Math.round(readingTime.minutes)),
		words: readingTime.words,
	};
}
