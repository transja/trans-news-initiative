import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";

export function tooltip(node, params) {
	const getOptions = (p) => {
		if (typeof p === "string" || !p) {
			return { content: p, trigger: "mouseenter focus" };
		}
		return { trigger: "mouseenter focus", ...p };
	};

	let options = getOptions(params);

	const instance = tippy(node, {
		allowHTML: true,
		arrow: true,
		duration: 0,
		theme: "light",
		content: options.content,
		trigger: options.trigger
	});

	if (!options.content) {
		instance.disable();
	}

    node.addEventListener("click", () => {
        // instance.hide();
        console.log("clicked");
    });

	if (options.trigger === "manual" && options.content) {
		instance.show();
	}

	return {
		update(newParams) {
			const newOptions = getOptions(newParams);
			instance.setProps({ trigger: newOptions.trigger });

			if (newOptions.content) {
				instance.setContent(newOptions.content);
				instance.enable();
				if (newOptions.trigger === "manual") {
					instance.show();
				}
			} else {
				instance.disable();
				if (newOptions.trigger === "manual") {
					instance.hide();
				}
			}
		},
		destroy() {
			instance.destroy();
		}
	};
}

export function createTooltipContent(node) {
	if (!node) return "";

	const title = node.title || node.name;
	const url = node.url;
	const publication = node.media_name || node.publication;
	const publicationDate = node.publish_date || node.publication_date;
	const lean = node.lean;
	const themes = node.themes;

	const date = new Date(publicationDate).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric"
	});

	let themesHtml = "";
	if (themes && Array.isArray(themes) && themes.length > 1) {
		themesHtml = `
			<div style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">
				<strong style="text-transform: uppercase; font-size: 0.7em; color: #555;">Appears in</strong>
				<ul style="list-style: none; padding: 0; margin: 5px 0 0 0; font-size: 0.9em;">
					${themes
						.map((theme) => `<li>${theme} &rarr;</li>`)
						.join("")}
				</ul>
			</div>
		`;
	}

	return `
		<div style="text-align: left; font-family: sans-serif; padding: 5px; max-width: 300px;">
			<div style="font-size: 0.8em; text-transform: uppercase; color: #555; margin-bottom: 5px;">${date.toUpperCase()}</div>
			<a href="${url}" target="_blank" rel="noopener noreferrer" style="font-size: 1.1em; color: black; text-decoration: underline; line-height: 1.2;">${title}</a>
			<div style="margin-top: 8px; display: flex; align-items: center; font-size: 1em;">
				<span style="font-weight: bold;">${publication}</span>
				${
					lean
						? `<span style="margin-left: 8px; background-color: #ed7d7d; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7em; font-weight: bold;">${lean}</span>`
						: ""
				}
			</div>
			${themesHtml}
		</div>
	`;
}
