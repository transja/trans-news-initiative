<script>
    import { getContext } from "svelte";
    import { TriangleAlert } from "@lucide/svelte";

    const copy = getContext("copy");
</script>

<div id="data-error">
    <div class="icon">
        <TriangleAlert size={48} />
    </div>
    <p>{copy.dataError}</p>
</div>

<style>
    #data-error {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--color-gray-700);
        padding: 1rem;
    }

    .icon {
        animation: flash 0.8s 3;
    }

    p {
        font-size: var(--18px);
        font-style: italic;
        max-width: 400px;
    }

    @media(max-width: 1000px) {
        p {
            font-size: 14px;
        }
    }

    @keyframes flash {
        0%, 100% {
            opacity: 1;
        }
        50% {
            opacity: 0;
        }
    }
</style>