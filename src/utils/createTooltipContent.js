import { get } from "svelte/store";
import { leanColors, leanTextColors } from "./getLeanProperty.js";
import { getPublicationName } from "./getPublicationName.js";
import { activeTheme } from "$runes/misc.svelte.js";
import themeMap from "$data/themeMap.json";


export function createTooltipContent(node) {
	if (!node) return "";

	const title = node.title || node.name;
	const url = node.url;

	const publication = getPublicationName(node.publication || node.media_name);
	const publicationDate = node.publish_date || node.publication_date;
	const lean = node.lean;
	const themes = node.themes.split(",").map(theme => theme.trim());



	const date = new Date(publicationDate).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric"
	});

	let themesHtml = "";
	if (themes && Array.isArray(themes)) {
		themesHtml = `
			<div style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px; font-family: var(--sans);">
				<strong style="text-transform: uppercase; font-size: 0.7em; color: #555;">Appears in</strong>
				<ul style="list-style: none; padding: 0; margin: 5px 0 0 0; font-size: 0.9em;">
					${themes
				.map(
					(theme) =>
						`<li style="text-transform: capitalize;">${themeMap[theme]}</li>`
				)
				.join("")}
				</ul>
			</div>
		`;
	}

	return `
		<div style="text-align: left; font-family: var(--sans); padding: 5px; max-width: 300px;" onpointerdown="event.stopPropagation()">
			<div style="font-size: 0.8em; text-transform: uppercase; color: #555; margin-bottom: 5px; font-weight: bold;">${date.toUpperCase()}</div>
			<a href="${url}" target="_blank" rel="noopener noreferrer" style="font-size: 1.1em; color: black; text-decoration: underline; line-height: 1.2; font-style: italic;">${title}</a>
			<div style="margin-top: 8px; display: flex; align-items: center; font-size: 1em;">
				<span style="font-weight: bold;">${publication}</span>
				${lean
			? `<span style="text-transform: uppercase;font-weight: 700;margin-left: 8px; background-color: ${leanColors[lean] ?? leanColors.unknown
			}; color:  ${leanTextColors[lean] ?? leanTextColors.unknown
			}; padding: 2px 6px; border-radius: 4px; font-size: 0.7em; font-weight: bold;">${lean}</span>`
			: ""
		}
			</div>
			${themesHtml}
		</div>
	`;
}
