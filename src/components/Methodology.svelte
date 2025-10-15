<script>
    import { onMount, getContext } from "svelte";
    import { activePage } from "$runes/misc.svelte.js";
    import MethodologyTable from "$components/MethodologyTable.svelte";
    import themeData from "$data/themeDefs.csv";
    
    const copy = getContext("copy");
</script>

{#if activePage.page == "methodology"}
<section id="methodology">
    <div class="inner">
        <h2>Methodology</h2>
        {#each copy.methods as graf, i}
            {#if i == 0}
                <h3>Initial article collection</h3>
            {:else if i == 2}
                <h3>Article classification</h3>
            {:else if i == 4}
                <h3>Publication political lean</h3>
            {/if}
            <p>{@html graf.value}</p>
            {#if i == 0}
                <MethodologyTable data={copy.queryTerms} />
            {:else if i == 1}
                <MethodologyTable data={copy.articleData} />
            {:else if i == 3}
                <MethodologyTable data={themeData} />
            {:else if i == 4}
                <MethodologyTable data={copy.leans} />
            {:else if i == 5}
                <MethodologyTable data={copy.avgLeans} />
            {/if}
        {/each}
    </div>
</section>
{/if}

<style>
    #methodology {
        width: 100%;
        position: absolute;
        padding: 10rem 1rem 1rem 1rem;
        font-family: var(--sans);
    }

    h2 {
        font-weight: 700;
    }

    h3 {
        font-weight: 700; 
        margin: 0;
    }

    p {
        font-size: var(--16px);
        line-height: 1.65;
    }

    :global(#methodology a:hover) {
        color: var(--color-gray-600);
        text-decoration-color: var(--color-gray-600);
    }

    .inner {
        max-width: 720px;
        margin: 0 auto 4rem auto;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .methodology-wrapper {
        max-width: 720px;
    }

    .org-contributor-wrapper {
        width: 100%;
        display: flex;
        flex-direction: row;
        gap: 10rem;
    }

    .orgs, .contributors {
        width: 50%;
        display: flex;
        flex-direction: column;
    }

    .orgs p, .contributors p {
        font-size: var(--16px);
        margin: 0;
    }

    .logo {
        width: 200px;
        transition: transform 0.25s linear;
    }

    .logo:hover {
        transform: translateY(-2px);
    }

    .org, .contributor {
        display: flex;
        flex-direction: column;
        gap: 0;
        border-top: 1px solid var(--color-gray-200);
        padding-top: 1rem;
        margin-bottom: 4rem;
    }

    .org {
        gap: 1rem;
    }

    .contributors p.name {
        font-weight: 700;
        font-size: var(--20px);
    }

    .contributors p.title {
        font-style: italic;
    }

    .contributors p.bio {
        margin-top: 1rem;
    }

    @media (max-width: 900px) {
        .org-contributor-wrapper {
            gap: 4rem;
        }
    }

    @media (max-width: 720px) {
        .org-contributor-wrapper {
            flex-direction: column;
        }

        .orgs, .contributors {
            width: 100%;
        }
    }

    @media (max-width: 600px) {
        #about {
            padding: 8rem 1rem 1rem 1rem;
        }

        h2 {
            font-size: var(--32px);
        }

        p, .orgs p, .contributors p {
            font-size: var(--14px);
        }
    }
</style>