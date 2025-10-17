<script>
    let data = $props();
    let tableData = Object.values(data);
    const columnsToRemove = ["shortTheme", "longThemeLEN", "descriptionLEN", "notes on inclusions/exclusions"];
    let columns = tableData.length > 0 ? Object.keys(tableData[0][0]).filter(col => !columnsToRemove.includes(col)) : [];

    function formatTitles(string) {
        if (string == "groundNewsLean") {
            return "Ground News Lean"
        } else if (string == "mediaCloudVotersLean") {
            return "Media Cloud Twitter/X Voter Lean, 2018"
        } else if (string == "mediaCloudFollowersLean") {
            return "Media Cloud Twitter/X Follower Lean, 2019"
        } else if (string == "longTheme") {
            return "theme"
        } else {
            return string
        }
    }
</script>

<div class="table-wrapper">
    <table>
        <colgroup>
            {#each columns as col}
                <col class="{col}-column">
            {/each}
        </colgroup>
        <thead>
            <tr>
                {#each columns as col}
                    <th>{@html formatTitles(col)}</th>
                {/each}
            </tr>
        </thead>
        <tbody>
            {#each tableData[0] as row}
                <tr>
                    {#each columns as col}
                        <td>{@html row[col]}</td>
                    {/each}
                </tr>
            {/each}
        </tbody>
    </table>

</div>

<style>
    .table-wrapper {
        margin: 2rem 0;
    }
    table {
		width: 100%;
        max-width: 600px;
		border-collapse: collapse;
	}
	th,
	td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #eee;
	}
	th {
		background-color: #f9f9f9;
		font-weight: 600;
		font-size: 0.8rem;
		text-transform: uppercase;
		color: var(--color-gray-1000);
	}
	tbody tr:last-child td {
		border-bottom: none;
	}
    td {
        font-size: var(--14px);
    }
    :global(#methodology .span-left, .span-leanleft, .span-center, .span-leanright, .span-right) {
        padding: 0.4rem;
        border-radius: 5px;
        text-transform: uppercase;
        font-weight: 700;
        font-size: var(--12px);
    }
    :global(#methodology .span-left) {
        background-color: var(--tni-left);
        color: var(--color-bg);
    }
    :global(#methodology .span-leanleft) {
        background-color: var(--tni-leanleft);
        color: var(--color-bg);
    }
    :global(#methodology .span-center) {
        background-color: var(--tni-center);
        color: var(--color-fg);
    }
    :global(#methodology .span-leanright) {
        background-color: var(--tni-leanright);
        color: var(--color-fg);
    }
    :global(#methodology .span-right) {
        background-color: var(--tni-right);
        color: var(--color-bg);
    }
</style>