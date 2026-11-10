<script>
	import { getContext, onMount } from "svelte";
	import { getDataDownloadUrl } from "$utils/aws.js";

	const copy = getContext("copy");

	let password = $state("");
	let status = $state("idle");
	let mounted = $state(false);

	// Password-manager extensions inject elements next to password inputs before
	// hydration, which breaks it, so the form is only rendered client-side
	onMount(() => {
		mounted = true;
	});

	async function onsubmit(event) {
		event.preventDefault();
		if (!password.trim() || status === "checking") return;

		status = "checking";
		try {
			const url = await getDataDownloadUrl(password.trim());
			if (url) {
				status = "success";
				window.location.assign(url);
			} else {
				status = "invalid";
			}
		} catch (error) {
			console.error(error);
			status = "error";
		}
	}
</script>

<div class="card" id="download-data">
	<div class="card-header">
		<h3>{@html copy.downloadPasswordHed}</h3>
		{#if copy.downloadPasswordText}
			<p>{@html copy.downloadPasswordText}</p>
		{/if}
	</div>

	{#if mounted}
		<form class="card-body" {onsubmit}>
			<label for="data-password">Password</label>
			<input
				id="data-password"
				type="password"
				autocomplete="current-password"
				bind:value={password}
				oninput={() => {
					if (status !== "checking") status = "idle";
				}}
				aria-invalid={status === "invalid"}
				aria-describedby="data-download-status"
			/>
			<p id="data-download-status" class="status {status}" aria-live="polite">
				{#if status === "invalid"}
					Incorrect password. Please check it and try again.
				{:else if status === "error"}
					Something went wrong. Please try again later.
				{:else if status === "success"}
					Your download should begin shortly.
				{/if}
			</p>
			<button
				type="submit"
				disabled={!password.trim() || status === "checking"}
			>
				{status === "checking" ? "Checking…" : "Download data"}
			</button>
		</form>
	{/if}
</div>

<style>
	.card {
		--form-text: #2c3345;
		--form-muted: #57647e;
		--form-border: #b8bdc9;
		--form-divider: #d7d8e1;
		--form-focus: #2e69ff;
		--form-submit: #18bd5b;
		--form-submit-hover: #14a54f;

		width: calc(100% - 2rem);
		max-width: 752px;
		margin: 0 auto;
		background: #fff;
		border-radius: 4px;
		box-shadow: 0 4px 4px rgba(87, 100, 126, 0.21);
		color: var(--form-text);
		scroll-margin-top: calc(var(--header-height, 90px) + 1rem);
	}

	.card-header {
		padding: 2.5rem 3.25rem;
		border-bottom: 1px solid var(--form-divider);
	}

	h3 {
		font-size: var(--24px, 1.5rem);
		font-weight: 600;
		margin: 0 0 0.5rem 0;
	}

	.card-header p {
		font-size: var(--16px);
		line-height: 1.6;
		color: var(--form-muted);
		margin: 0;
	}

	:global(#download-data .card-header a) {
		color: var(--form-muted);
	}

	.card-body {
		padding: 2.5rem 3.25rem;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	label {
		font-size: var(--16px);
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	input {
		width: 100%;
		max-width: 310px;
		height: 40px;
		padding: 0 10px;
		font-size: var(--16px);
		color: var(--form-text);
		background: #fff;
		border: 1px solid var(--form-border);
		border-radius: 4px;
		box-shadow: none;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}

	input:hover {
		border-color: var(--form-focus);
	}

	input[aria-invalid="true"] {
		border-color: var(--tni-right);
	}

	.status {
		font-size: var(--14px);
		min-height: 1.5em;
		margin: 0.5rem 0 1.5rem 0;
	}

	.status.invalid,
	.status.error {
		color: var(--tni-right);
	}

	.status.success {
		color: var(--form-muted);
	}

	button {
		height: 48px;
		min-width: 180px;
		padding: 0 12px;
		font-size: var(--16px);
		font-weight: 500;
		color: #fff;
		background: var(--form-submit);
		border: 1px solid var(--form-submit);
		border-radius: 4px;
		box-shadow: none;
		cursor: pointer;
		transition:
			background-color 0.15s,
			border-color 0.15s;
	}

	button:hover:not(:disabled) {
		background: var(--form-submit-hover);
		border-color: var(--form-submit-hover);
	}

	button:disabled,
	button:disabled:hover {
		opacity: 0.5;
		cursor: not-allowed;
		background: var(--form-submit);
	}

	@media (max-width: 600px) {
		.card-header,
		.card-body {
			padding: 1.5rem;
		}
	}
</style>
