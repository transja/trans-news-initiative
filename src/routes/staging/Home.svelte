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
	import themeMap  from "$data/themeMap.json";

	// components
	import Dashboard from "$components/Dashboard.svelte";
	import Controls from "$components/Controls.svelte";
	import ThemeSection from "$components/ThemeSection.svelte";
	import LoaderCircles from "$components/helpers/loaders/Loader.Circles.svelte";

	import leanData from "../../data/lean.csv";

	/* =========================
	   URL <-> STATE SYNC
	   ========================= */
	const THEME_PARAM = "theme"; // only param we use
	let suppressURLSync = false; // prevents loops on hydration/popstate
	let lastHistoryKey = $state(""); // dedupe pushes
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
		// Trust history state when available, else derive from URL
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
		// Your existing data-loading $effect reacts to rune changes.
	}

	onMount(() => {
		if (typeof window === "undefined") return;
		hydrateFromURL({ replace: true });
		window.addEventListener("popstate", onPopState);
		return () => window.removeEventListener("popstate", onPopState);
	});

	// Push a shallow history entry whenever view<->theme changes meaningfully
	$effect(() => {
		if (suppressURLSync) return;
		const key = inThemeView.state ? `theme:${activeTheme.theme ?? ""}` : "home";
		if (key === lastHistoryKey) return;
		lastHistoryKey = key;
		pushURL();
	});

	// Optional helpers if you want to call from buttons/children
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
	let initialDataStatus = $state("pending");

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
				minDate = new Date(Math.min(...dates));
				maxDate = new Date(Math.max(...dates));
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
			loadingThemeArticles = true;
			try {
				const fetchedArticles = await withRetries(() =>
					getArticlesByTheme(activeTheme.theme)
				);

				themeArticles = fetchedArticles.map((item) => ({
					...item,
					lean:
						leanData.find((d) => d.domain === item.media_name)?.aggLean ||
						"unknown"
				}));
				

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
		} else {
			themeArticles = [];
		}
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
	}, 100);

	$effect(() => {
		updateDebouncedDateRange(filters.dateRange);
	});

	const xDomain = $derived([debouncedDateRange.start, debouncedDateRange.end]);

	let controlsHeight = $state();


</script>

{#if activePage.page == "home"}
	{#if initialDataStatus === "pending"}
		<div class="loading" transition:fade>
			<LoaderCircles size={70} />
		</div>
	{:else if initialDataStatus === "success"}
		<div
			class="main-content"
			style="--controls-height: {controlsHeight}px"
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
					{controlsHeight}
					{vizColors}
				/>
			</section>

			<Controls
				bind:highlightedContent
				bind:filters
				{resetFilters}
				allData={themeArticles}
				filteredData={filteredDataWithDateRange}
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
			/>

			{#if inThemeView.state}
				{#key activeTheme.theme}
					{#if !loadingThemeArticles}
						<section class="container-section" transition:fade>
							<ThemeSection data={filteredDataWithDateRange} {xDomain} />
						</section>
					{/if}
				{/key}
			{/if}
		</div>
	{:else if initialDataStatus === "error"}
		<div class="loading">
			<p>Sorry, we couldn't load the data. Please try again later.</p>
		</div>
	{/if}
{/if}

<style lang="scss">
	.main-content {
		font-family: "Inter", sans-serif;

		.container-section {
			padding: 4rem 2rem;
			background: var(--color-gray-50);
		}
	}

	@media (max-width: 600px) {
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
