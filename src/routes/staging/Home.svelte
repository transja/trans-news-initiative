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
	} from "$utils/supabase";

	// components
	import Dashboard from "$components/Dashboard.svelte";
	import Controls from "$components/Controls.svelte";
	import Header from "$components/Header.svelte";
	import ThemeSection from "$components/ThemeSection.svelte";
	import LoaderCircles from "$components/helpers/loaders/Loader.Circles.svelte";

	import leanData from "../../data/lean.csv";

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

	const themeMap = {
		activism: "Resilience and resistance",
		bigotry: "Anti-trans violence and hate",
		children: "Trans youth and parental rights",
		cultureWars: "Ideology and culture wars",
		federalPolicy: "Federal level measures",
		freeSpeech: "Censorship and free speech",
		healthcare: "Health care and bodily autonomy",
		identity: "Trans and nonbinary identity",
		internationalPolicy: "Internationality",
		popCulture: "Pop culture and creativity",
		publicSpace: "Access to public space",
		sports: "Trans people in sports",
		statePolicy: "State level measures"
	};

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
					return new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
				});
				minDate = new Date(Math.min(...dates));
				maxDate = new Date(Math.max(...dates));
				console.log(minDate, maxDate);
			}
			initialDataStatus = "success";
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

	$effect(async () => {
		if (activeTheme.theme && inThemeView.state) {
			loadingThemeArticles = true;
			try {
				const fetchedArticles = await withRetries(() =>
					getArticlesByTheme(activeTheme.theme)
				);

				// TO DO: Remove this on backend
				const uniqueArticles = Array.from(
					new Map(fetchedArticles.map((item) => [item.url, item])).values()
				);

				themeArticles = uniqueArticles.map((item) => ({
					...item,
					lean:
						leanData.find((d) => d.domain === item.media_name)?.aggLean ||
						"unknown"
				}));
			} catch (error) {
				console.error("Failed to fetch theme articles:", error);
				// Optionally, set an error state to display a message to the user
			} finally {
				loadingThemeArticles = false;
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
				{#if !loadingThemeArticles}
					<section class="container-section" transition:fade>
						<ThemeSection data={filteredDataWithDateRange} {xDomain} />
					</section>
				{/if}
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
