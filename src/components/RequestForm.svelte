<script>
	const JOTFORM_ID = "263085938702060";
	const JOTFORM_ORIGIN = "https://form.jotform.com";

	let height = $state(540);
	let minHeight = $state(0);

	// Jotform posts "<type>:<value>:<formId>" messages to resize its iframe
	function onmessage(event) {
		if (event.origin !== JOTFORM_ORIGIN || typeof event.data !== "string")
			return;
		const [type, value, formId] = event.data.split(":");
		if (formId !== JOTFORM_ID) return;
		const px = Number(value);
		if (!Number.isFinite(px)) return;
		if (type === "setHeight") height = px;
		else if (type === "setMinHeight") minHeight = px;
	}
</script>

<svelte:window {onmessage} />

<iframe
	title="Request access to the data"
	src="{JOTFORM_ORIGIN}/{JOTFORM_ID}"
	allow="geolocation; microphone; camera; fullscreen; payment"
	scrolling="no"
	style:height="{height}px"
	style:min-height="{minHeight}px"
></iframe>

<style>
	iframe {
		display: block;
		width: 100%;
		border: none;
	}
</style>
