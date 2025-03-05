<script>
    import { onMount, getContext } from "svelte";
    import tniLogo from "$svg/logos/TNI.svg";
    import { activePage } from "$runes/misc.svelte.js";
    import * as d3 from "d3";

    const copy = getContext("copy");
    let transposePath;
    let letterA;
    let gradientStyle = `linear-gradient(to right, var(--color-stop-1) 50%, var(--color-stop-0) 50%)`;

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
            .delay(1500)
            .duration(500)
            .ease(d3.easeLinear)
            .style("opacity", 0);
    }

    function handleMouseMove(event) {
        const { left, width } = event.currentTarget.getBoundingClientRect();
        const xPercentage = ((event.clientX - left) / width) * 100;

        // Select the 3 stops inside the SVG gradient
        const stop0 = document.querySelector("#transGradient stop:nth-child(1)"); // Left (static)
        const stop1 = document.querySelector("#transGradient stop:nth-child(2)"); // Middle (dynamic)
        const stop2 = document.querySelector("#transGradient stop:nth-child(3)"); // Right (static)

        if (stop0 && stop1 && stop2) {
            const middleStopOffset = Math.max(0, Math.min(100, xPercentage)); // Moves from 0% to 100%
            
            stop0.setAttribute("offset", `0%`); // Left color always at 0%
            stop1.setAttribute("offset", `${middleStopOffset}%`); // Middle stop moves
            stop2.setAttribute("offset", `100%`); // Right color always at 100%
        }
    }

    function handleMouseLeave() {
        // Reset stops to original state
        const stop0 = document.querySelector("#transGradient stop:nth-child(1)");
        const stop1 = document.querySelector("#transGradient stop:nth-child(2)");
        const stop2 = document.querySelector("#transGradient stop:nth-child(3)");

        if (stop0 && stop1 && stop2) {
            stop0.setAttribute("offset", `0%`); // Left side remains at 0%
            stop1.setAttribute("offset", `50%`); // Reset middle stop to 50%
            stop2.setAttribute("offset", `100%`); // Right side remains at 100%
        }
    }

    onMount(() => {
        drawInPath();
    })
</script>

{#if activePage.page == "home"}
    <section id="coming-soon">
        <div class="inner">
            <div class="col" on:mousemove={handleMouseMove} on:mouseleave={handleMouseLeave}>
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

    :global(#coming-soon .col svg .tni-st1) {
        stroke: url(#transGradient);
        stroke-miterlimit: 10;
        stroke-width: 3px;
        fill: none;
    }

    #transGradient {
        --color-stop-0: #5bcefa;
        --color-stop-1: #A8BBD9
        --color-stop-2: #f5a9b8;
        width: 100%;
        height: 100px; /* Adjust as needed */
        background: var(--gradient);
        transition: all 0.1s ease-out;
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

    :global(.tni-st1) {
        stroke: url(#transGradient);
        stroke-miterlimit: 10;
        stroke-width: 3px;
        fill: none;
      }
</style>