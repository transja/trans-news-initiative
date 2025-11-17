<script>
	import { activePage } from "$runes/misc.svelte.js";
	import { onMount } from "svelte";
	import { debounce } from "$utils/debounce.js";
	import { fade } from "svelte/transition";

	// stores
	import { activeTheme, inThemeView } from "$runes/misc.svelte.js";

	// utils
	import {
		getMonthlyCounts,
		getTotalArticleCount,
		getArticlesByTheme
	} from "$utils/aws";
	import { toMonthStart, toMonthEnd } from "$utils/normalizeDateRange.js";
	import themeMap from "$data/themeMap.json";

	// components
	import Dashboard from "$components/Dashboard.svelte";
	import Controls from "$components/Controls.svelte";
	import ThemeSection from "$components/ThemeSection.svelte";
	import LoaderCircles from "$components/helpers/loaders/Loader.Circles.svelte";
	import DataError from "$components/DataError.svelte";

	import leanData from "$data/lean.csv";

	/* =========================
	   URL <-> STATE SYNC
	   ========================= */
	const THEME_PARAM = "theme";
	let suppressURLSync = false;
	let lastHistoryKey = $state("");
	let isHydratingWithTheme = $state(false);

	function deriveThemeFromURL(url = new URL(window.location.href)) {
		const theme = url.searchParams.get(THEME_PARAM);
		return theme && theme.trim() ? theme : null;
	}

	function buildURLFromState() {
		const url = new URL(window.location.href);
		const q = url.searchParams;
		if (inThemeView.state && activeTheme.theme) {
			q.set(THEME_PARAM, activeTheme.theme);
		} else {
			q.delete(THEME_PARAM);
		}
		url.search = q.toString();
		return url;
	}

	function hydrateFromURL({ replace = true } = {}) {
		suppressURLSync = true;
		const theme = deriveThemeFromURL();
		if (theme) {
			// Enter theme view on load; loader $effect below will run
			inThemeView.state = true;
			activeTheme.theme = theme;
			introFinished = true;
			isHydratingWithTheme = true;
		} else {
			inThemeView.state = false;
			activeTheme.theme = null;
		}
		const state = {
			theme: inThemeView.state ? activeTheme.theme : null
		};
		const url = buildURLFromState();
		if (replace) history.replaceState(state, "", url);
		suppressURLSync = false;
	}

	function pushURL({ replace = false } = {}) {
		const state = {
			theme: inThemeView.state ? activeTheme.theme : null
		};
		const url = buildURLFromState();
		if (replace) history.replaceState(state, "", url);
		else history.pushState(state, "", url);
	}

	function onPopState(ev) {
		suppressURLSync = true;

		const st = ev.state;
		const theme = st && "theme" in st ? st.theme : deriveThemeFromURL();

		if (theme === activeTheme.theme) {
			suppressURLSync = false;
			return;
		}

		if (theme) {
			inThemeView.state = true;
			activeTheme.theme = theme;
		} else {
			inThemeView.state = false;
			activeTheme.theme = null;
		}
		suppressURLSync = false;
	}

	onMount(() => {
		if (typeof window === "undefined") return;
		hydrateFromURL({ replace: true });
		window.addEventListener("popstate", onPopState);
		return () => window.removeEventListener("popstate", onPopState);
	});

	$effect(() => {
		if (suppressURLSync) return;
		const key = inThemeView.state ? `theme:${activeTheme.theme ?? ""}` : "home";
		if (key === lastHistoryKey) return;
		lastHistoryKey = key;
		pushURL();
	});

	export function openTheme(theme) {
		if (!theme) return;
		suppressURLSync = true;
		inThemeView.state = true;
		activeTheme.theme = theme;
		suppressURLSync = false;
		pushURL();
	}
	export function goHome() {
		suppressURLSync = true;
		inThemeView.state = false;
		activeTheme.theme = null;
		suppressURLSync = false;
		pushURL();
	}

	let monthlyArticleCounts = $state([]);
	let totalArticleCount = $state(0);
	let themeArticles = $state([]);
	let loadingThemeArticles = $state(false);
	let showThemeSections = $state(false);
	let initialDataStatus = $state("pending");

	let themeCache = new Map();

	let minDate = $state(new Date());
	let maxDate = $state(new Date());

	let introFinished = $state(false);

	const transitionDuration = 500;

	const vizColors = ["#7CDEE0", "#E5BDF5"];

	let filters = $state({
		topic: "All",
		publication: "All",
		publicationLean: "All",
		dateRange: {
			start: minDate,
			end: maxDate
		}
	});

	$effect(() => {
		filters.dateRange = {
			start: minDate,
			end: maxDate
		};
	});

	const resetFilters = (options) => {
		for (const option of options) {
			if (option === "dateRange") {
				filters[option] = {
					start: minDate,
					end: maxDate
				};
			} else {
				filters[option] = "All";
			}
		}
	};

	$effect(() => {
		if (!activeTheme.theme && !inThemeView.state) {
			filters = {
				topic: "All",
				publication: "All",
				publicationLean: "All",
				dateRange: {
					start: minDate,
					end: maxDate
				}
			};
		}
	});

	const themes = $derived(
		[...new Set(monthlyArticleCounts.map((d) => d.theme))].sort()
	);

	const summaryContent = $derived.by(() => {
		const themeCounts = monthlyArticleCounts.reduce((acc, { theme, count }) => {
			acc[theme] = (acc[theme] || 0) + count;
			return acc;
		}, {});

		const themeSummary = themes.map((theme) => ({
			title: themeMap[theme] || theme,
			count: themeCounts[theme] || 0,
			theme: theme
		}));

		const allArticles = {
			title: `trans communities`,
			count: totalArticleCount || 0,
			theme: null
		};

		return [allArticles, ...themeSummary];
	});

	let highlightedIndex = $state(0);
	let highlightedContent = $state(summaryContent[highlightedIndex]);
	let isHoveringOverPlot = $state(false);

	async function withRetries(fn, retries = 3, delay = 1000) {
		let lastError;
		for (let i = 0; i < retries; i++) {
			try {
				return await fn();
			} catch (error) {
				lastError = error;
				console.error(
					`Attempt ${i + 1} failed. Retrying in ${delay}ms...`,
					error
				);
				if (i < retries - 1) {
					await new Promise((res) => setTimeout(res, delay * (i + 1)));
				}
			}
		}
		throw lastError;
	}

	(async () => {
		try {
			const [counts, total] = await Promise.all([
				withRetries(() => getMonthlyCounts()),
				withRetries(() => getTotalArticleCount())
			]);

			monthlyArticleCounts = counts;
			totalArticleCount = total;

			if (counts.length > 0) {
				const dates = counts.map((d) => {
					const date = new Date(d.month);
					return new Date(
						date.valueOf() + date.getTimezoneOffset() * 60 * 1000
					);
				});
				const minD = new Date(Math.min(...dates));
				minDate = toMonthStart(minD);

				const maxD = new Date(Math.max(...dates));
				maxDate = toMonthEnd(maxD);
			}
			if (!isHydratingWithTheme) {
				initialDataStatus = "success";
			}
		} catch (error) {
			console.error("Failed to load initial data:", error);
			initialDataStatus = "error";
		}
	})();

	$effect(() => {
		highlightedContent = summaryContent[highlightedIndex];
	});

	$effect(() => {
		if (introFinished || initialDataStatus !== "success") return;
		const interval = setInterval(() => {
			highlightedIndex = (highlightedIndex + 1) % summaryContent.length;
		}, 2000);

		return () => {
			clearInterval(interval);
		};
	});

	onMount(() => {
		const handleFirstInteraction = () => {
			introFinished = true;
			highlightedIndex = 0;
		};

		// Use a timeout to avoid capturing programmatic focus or events on load.
		const timer = setTimeout(() => {
			window.addEventListener("mousedown", handleFirstInteraction, {
				once: true
			});
			window.addEventListener("keydown", handleFirstInteraction, {
				once: true
			});
		}, 1000);

		return () => {
			clearTimeout(timer);
			window.removeEventListener("mousedown", handleFirstInteraction);
			window.removeEventListener("keydown", handleFirstInteraction);
		};
	});

	// DATA LOADER
	$effect(async () => {
		if (activeTheme.theme && inThemeView.state) {
			// Check cache first
			if (themeCache.has(activeTheme.theme)) {
				loadingThemeArticles = true;

				// Artificial delay for consistent UX
				await new Promise((resolve) => setTimeout(resolve, 100));

				themeArticles = themeCache.get(activeTheme.theme);
				loadingThemeArticles = false;

				if (isHydratingWithTheme) {
					initialDataStatus = "success";
					isHydratingWithTheme = false;
				}
			} else {
				// Fetch if not in cache
				loadingThemeArticles = true;
				try {
					const fetchedArticles = await withRetries(() =>
						getArticlesByTheme(activeTheme.theme)
					);

					const processedArticles = fetchedArticles.map((item) => ({
						...item,
						lean:
							leanData.find((d) => d.domain === item.media_name)?.aggLean ||
							"unknown"
					}));

					// Store in cache
					themeCache.set(activeTheme.theme, processedArticles);

					themeArticles = processedArticles;

					if (isHydratingWithTheme) {
						initialDataStatus = "success";
						isHydratingWithTheme = false;
					}
				} catch (error) {
					console.error("Failed to fetch theme articles:", error);
					// Optionally, set an error state to display a message to the user
					if (isHydratingWithTheme) {
						initialDataStatus = "error";
						isHydratingWithTheme = false;
					}
				} finally {
					setTimeout(() => {
						loadingThemeArticles = false;
					}, 500);
				}
			}
		} else {
			themeArticles = [];
		}
	});


	const eventsToInclude = $derived.by(() => {
		let data = themeArticles.filter((item) => {
			const d = new Date(item.publish_date);
			const correctedDate = new Date(
				d.valueOf() + d.getTimezoneOffset() * 60 * 1000
			);
			return (
				correctedDate >= debouncedDateRange.start &&
				correctedDate <= debouncedDateRange.end
			);
		})
		return Array.from(
			new Map(
				data.filter((d) => d.event).map((item) => [item.event, item])
			).values()
		)
			.map((item) => {
				return {
					name: item.event,
					articles: data.filter((d) => d.event === item.event)
				};
			})
			.sort((a, b) => b.articles.length - a.articles.length)
			.filter((d) => d.articles.length >= EVENT_COUNT_THRESHOLD)
			// .map(d => d.name)
	});


	let filteredData = $derived(
		themeArticles
			.filter((item) => {
				if (filters.publication === "All") {
					return true;
				}
				return item.media_name === filters.publication;
			})
			.filter((item) => {
				if (filters.publicationLean === "All") {
					return true;
				}
				return item.lean === filters.publicationLean;
			})
	);

	let filteredDataWithDateRange = $derived(
		filteredData.filter((item) => {
			const d = new Date(item.publish_date);
			const correctedDate = new Date(
				d.valueOf() + d.getTimezoneOffset() * 60 * 1000
			);
			return (
				correctedDate >= debouncedDateRange.start &&
				correctedDate <= debouncedDateRange.end
			);
		})
	);

	let debouncedDateRange = $state({
		start: minDate,
		end: maxDate
	});

	const updateDebouncedDateRange = debounce((newDateRange) => {
		debouncedDateRange = newDateRange;
	}, 500);

	$effect(() => {
		updateDebouncedDateRange(filters.dateRange);
	});

	const xDomain = $derived([debouncedDateRange.start, debouncedDateRange.end]);

	let controlsHeight = $state();
	let debouncedControlsHeight = $state();

	const updateDebouncedControlsHeight = debounce((newHeight) => {
		debouncedControlsHeight = newHeight;
	}, 100);

	$effect(() => {
		updateDebouncedControlsHeight(controlsHeight);
	});

	// Delay showing theme sections until after transition completes
	$effect(() => {
		if (!loadingThemeArticles && inThemeView.state) {
			// Wait for transition duration before showing theme sections
			const timer = setTimeout(() => {
				showThemeSections = true;
			}, transitionDuration / 2);
			return () => clearTimeout(timer);
		} else if (!inThemeView.state) {
			// Reset when not in theme view
			showThemeSections = false;
		}
	});

	const EVENT_COUNT_THRESHOLD = 10;

	const groupedByEvent = $derived.by(() => {
		return Array.from(
			new Map(
				filteredDataWithDateRange
					.filter((d) => d.event)
					.map((item) => [item.event, item])
			).values()
		)
			.map((item) => {
				return {
					name: item.event,
					articles: filteredDataWithDateRange.filter(
						(d) => d.event === item.event
					)
				};
			})
			.sort((a, b) => b.articles.length - a.articles.length)
			.filter(d => eventsToInclude.map(d => d.name).includes(d.name))
		// .filter((d) => d.articles.length >= EVENT_COUNT_THRESHOLD);
	});

	let filteredPublications = $derived.by(() => {
		return [
			...new Set(
				eventsToInclude
					.map((event) => event.articles.map((article) => article.media_name))
					.flat()
			)
		];
	});


</script>

{#if activePage.page == "home"}
	{#if initialDataStatus === "pending"}
		<div class="loading" transition:fade>
			<LoaderCircles size={70} />
		</div>
	{:else if initialDataStatus === "success"}
		<div
			class="main-content"
			style="--controls-height: {debouncedControlsHeight}px"
			transition:fade
		>
			<section class="wide-section">
				<Dashboard
					data={themeArticles}
					{filteredDataWithDateRange}
					{loadingThemeArticles}
					{minDate}
					{maxDate}
					{monthlyArticleCounts}
					{introFinished}
					bind:filters
					{themes}
					{themeMap}
					bind:highlightedContent
					bind:isHoveringOverPlot
					{transitionDuration}
					{summaryContent}
					controlsHeight={debouncedControlsHeight}
					{vizColors}
					eventsToInclude={eventsToInclude.map(d => d.name)}
				/>
			</section>

			<Controls
				bind:highlightedContent
				bind:filters
				{resetFilters}
				allData={themeArticles}
				filteredData={filteredDataWithDateRange}
				{groupedByEvent}
				bind:controlsHeight
				{transitionDuration}
				{summaryContent}
				mode={introFinished
					? isHoveringOverPlot
						? "hovering"
						: "default"
					: "intro"}
				{minDate}
				{maxDate}
				{loadingThemeArticles}
				{filteredPublications}
			/>

			{#if inThemeView.state}
				{#key activeTheme.theme}
					{#if showThemeSections}
						<section class="container-section" transition:fade>
							<ThemeSection {groupedByEvent} {xDomain} />
						</section>
					{/if}
				{/key}
			{/if}
		</div>
	{:else if initialDataStatus === "error"}
		<div class="loading">
			<DataError />
		</div>
	{/if}
{/if}

<style lang="scss">
	.main-content {
		font-family: var(--sans);

		.container-section {
			padding: 4rem 2rem;
			background: var(--color-gray-50);
		}
	}

	@media (max-width: 1000px) {
		.main-content {
			.container-section {
				padding: 2rem 1rem;
			}
		}
	}
	:global(.loading) {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		width: 100%;
		position: absolute;
		z-index: 1000;
		background: white;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
	}
</style>
