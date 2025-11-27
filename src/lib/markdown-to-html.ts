// import { AdmonitionComponent } from "../plugins/rehype-component-admonition.mjs";
// import { GithubCardComponent } from "../plugins/rehype-component-github-card.mjs";

import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import type { MarkdownHeading } from "astro";
import GitHubSluggler from "github-slugger";
import type { Root, RootContent } from "mdast";
import { toString as mdastToString } from "mdast-util-to-string";
import getReadingTime from "reading-time";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExpressionCode, {
	type RehypeExpressiveCodeOptions,
	type ThemeObjectOrShikiThemeName,
} from "rehype-expressive-code";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkGithubAdmonitionsToDirectives from "remark-github-admonitions-to-directives";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkSectionize from "remark-sectionize";
import { unified } from "unified";
import { expressiveCodeConfig } from "@/config";
import { pluginCustomCopyButton } from "@/plugins/expressive-code/custom-copy-button";
import { pluginLanguageBadge } from "@/plugins/expressive-code/language-badge";

const slugger = new GitHubSluggler();

export type MarkdownToHtmlResult = {
	html: string;
	excerpt: string;
	minutes: number;
	words: number;
	headings: MarkdownHeading[];
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
		.use(remarkGfm)
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
		.use(rehypeExpressionCode, {
			themes: [
				expressiveCodeConfig.theme,
				expressiveCodeConfig.theme,
			] as ThemeObjectOrShikiThemeName[],
			plugins: [
				pluginCollapsibleSections(),
				pluginLineNumbers(),
				pluginLanguageBadge(),
				pluginCustomCopyButton(),
			],
			styleOverrides: {
				codeBackground: "var(--codeblock-bg)",
				borderRadius: "0.75rem",
				borderColor: "none",
				codeFontSize: "0.875rem",
				codeFontFamily:
					"'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
				codeLineHeight: "1.5rem",
				frames: {
					editorBackground: "var(--codeblock-bg)",
					terminalBackground: "var(--codeblock-bg)",
					terminalTitlebarBackground: "var(--codeblock-topbar-bg)",
					editorTabBarBackground: "var(--codeblock-topbar-bg)",
					editorActiveTabBackground: "none",
					editorActiveTabIndicatorBottomColor: "var(--primary)",
					editorActiveTabIndicatorTopColor: "none",
					editorTabBarBorderBottomColor: "var(--codeblock-topbar-bg)",
					terminalTitlebarBorderBottomColor: "none",
				},
				textMarkers: {
					delHue: "0",
					insHue: "180",
					markHue: "250",
				},
			},
			frames: {
				showCopyToClipboardButton: false,
			},
		} as RehypeExpressiveCodeOptions)
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

	slugger.reset();
	const headings: MarkdownHeading[] = [];

	function traverse(node: Root | RootContent) {
		if (!node) {
			return;
		}

		if (node.type === "heading") {
			const text = mdastToString(node);
			headings.push({
				depth: node.depth,
				slug: slugger.slug(text),
				text: text,
			});
		}

		if ("children" in node && node.children) {
			node.children.forEach(traverse);
		}
	}

	traverse(ast);

	const html = processedContent.toString();
	return {
		html: html,
		excerpt: excerpt,
		minutes: Math.max(1, Math.round(readingTime.minutes)),
		words: readingTime.words,
		headings: headings,
	};
}
