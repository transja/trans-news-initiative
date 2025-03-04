<script>
    import { onMount, getContext } from "svelte";
    import tniLogo from "$svg/logos/TNI.svg";
    import { activePage } from "$runes/misc.svelte.js";
    import * as d3 from "d3";

    const copy = getContext("copy");
    let transposePath;
    let letterA;

    function drawInPath() {
        transposePath = d3.select("#coming-soon #transposePath");
        letterA = d3.select("#coming-soon #letter-a")

        let pathElement = transposePath.node();
        if (!pathElement) return;

        let pathLen = pathElement.getTotalLength();

        transposePath
            .attr("stroke-dasharray", (d) => pathLen)
            .attr("stroke-dashoffset", (d) => pathLen)
            .transition()
            .delay(500)
            .duration(1000)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);
        
        letterA 
            .transition()
            .delay(1000)
            .duration(250)
            .ease(d3.easeLinear)
            .style("opacity", 0);
    }

    onMount(() => {
        drawInPath();
    })
</script>

{#if activePage.page == "home"}
    <section id="coming-soon">
        <div class="inner">
            <div class="col">
                {@html tniLogo}
            </div>
            <div class="col">
                <p class="coming-soon-label">Coming soon</p>
                {#each copy.longdesc as graf, i}
                    <p>{@html graf.value}</p>
                {/each}
            </div>
        </div>
    </section>
{/if}

<style>
    #coming-soon {
        width: 100%;
        height: 100svh;
        position: absolute;
        top: 0;
        left: 0;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        padding: 6rem 2rem;
        font-family: var(--sans);
    }

    .inner {
        max-width: 900px;
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        justify-content: center;
        gap: 4rem;
    }

    .col:first-of-type {
        width: 40%;
    }

    .col:last-of-type {
        width: 60%;
    }

    p {
        font-size: var(--18px);
        line-height: 1.65;
    }

    .coming-soon-label {
        text-transform: uppercase;
        font-weight: 700;
        font-size: var(--24px);
    }

    @media (max-width: 720px) {
        .inner {
            flex-direction: column;
            align-items: center;
        }

        .col:first-of-type {
            width: 40%;
        }

        .col:last-of-type {
            width: 100%;
        }
    }

    @media (max-width: 600px) {
        #coming-soon {
            align-items: flex-start;
        }

        .inner {
            gap: 2rem;
        }

        .col:first-of-type {
            width: 100%;
            max-width: 200px;
        }

        p {
            font-size: var(--14px);
        }

        .coming-soon-label {
            font-size: var(--18px);
        }
    }

    @media (max-width: 400px) {
        .inner {
            gap: 1rem;
        }
        .col:first-of-type {
            width: 100%;
            max-width: 160px;
        }
    }
</style>