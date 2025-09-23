import { articles } from "$data/articles_with_themes.csv";

export async function load() {
	return {
		articles
	};
}
