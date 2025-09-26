<script>
	import { onMount } from "svelte";
	import { debounce } from "$utils/debounce.js";

	// stores
	import { activeTheme, inThemeView } from "../../stores/global.js";

	// components
	import Dashboard from "$components/Dashboard.svelte";
	import Controls from "$components/Controls.svelte";
	import Header from "$components/Header.svelte";
	import ThemeSection from "$components/ThemeSection.svelte";

	import csvdata from "../../data/old_articles_with_themes.csv";
	import leanData from "../../data/lean.csv";

	const processedData = csvdata
		.map((item) => ({
			...item,
			themes: item.topics.split(",")?.map((t) => t.trim()) || [],
			lean:
				leanData.find((d) => d.domain === item.media_name)?.aggLean || "unknown"
		}))
		.filter((item) => item.cluster != "-1");

	const allDates = processedData.map((d) => d.publish_date).filter(Boolean);

	const minDate = allDates.length
		? new Date(Math.min(...allDates.map((d) => new Date(d))))
		: new Date();

	const maxDate = allDates.length
		? new Date(Math.max(...allDates.map((d) => new Date(d))))
		: new Date();


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
		if (!$activeTheme && !$inThemeView) {
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

	const themes = [...new Set(processedData.map((d) => d.themes).flat())].sort();
	const themeMap = {
		healthcare: "health care and bodily autonomy",
		freeSpeech: "censorship and free speech",
		activism: "resilience and resistance",
		identity: "trans and nonbinary identity",
		children: "parental rights and trans youth",
		bigotry: "anti-trans violence and hate",
		publicSpace: "access to public goods and spaces",
		sports: "trans people in sports",
		statePolicy: "state level measures",
		federalPolicy: "federal level measures",
		internationalPolicy: "international measures",
		popCulture: "pop culture and creativity",
		cultureWars: "culture wars, ideology, and religion"
	};

	const summaryContent = $derived.by(() => {
		const allArticles = {
			title: `trans issues`,
			count: processedData.length,
			theme: null
		};

		const themeArticles = themes.map((theme) => ({
			title: themeMap[theme] || theme,
			count: processedData.filter((d) => d.themes.includes(theme)).length,
			theme: theme
		}));

		return [allArticles, ...themeArticles];
	});

	let highlightedIndex = $state(0);
	let highlightedContent = $state(summaryContent[highlightedIndex]);
	let isHoveringOverPlot = $state(false);

	$effect(() => {
		highlightedContent = summaryContent[highlightedIndex];
	});

	$effect(() => {
		if (introFinished) return;
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
			window.addEventListener("wheel", handleFirstInteraction, { once: true });
		}, 1000);

		return () => {
			clearTimeout(timer);
			window.removeEventListener("mousedown", handleFirstInteraction);
			window.removeEventListener("keydown", handleFirstInteraction);
			window.removeEventListener("wheel", handleFirstInteraction);
		};
	});

	let filteredData = $derived(
		processedData
			.filter((d) => d.themes.includes($activeTheme))
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
			return d >= debouncedDateRange.start && d <= debouncedDateRange.end;
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

	let controlsHeight = $state(0);
</script>

<svelte:boundary onerror={(e) => console.error(e)}>
	<Header />
	<div class="main-content" style="--controls-height: {controlsHeight}px">
		<section class="wide-section">
			<Dashboard
				data={filteredData.length ? filteredData : processedData}
				{filteredDataWithDateRange}
				{minDate}
				{maxDate}
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
			bind:controlsHeight
			data={processedData}
			{transitionDuration}
			{summaryContent}
			mode={introFinished
				? isHoveringOverPlot
					? "hovering"
					: "default"
				: "intro"}
			{minDate}
			{maxDate}
		/>

		{#if $inThemeView}
			<section class="container-section">
				<ThemeSection
					data={filteredDataWithDateRange}
					{xDomain}
				/>
			</section>
		{/if}
	</div>
</svelte:boundary>

<style lang="scss">
	.main-content {
		font-family: "Inter", sans-serif;

		.container-section {
			padding: 0 3rem;
			margin-top: 2rem;
			padding-top: 2rem;
			border-top: 1px solid #e5e5e5;
			background: #f8f8f8;
		}
	}
</style>
