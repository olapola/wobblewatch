<script lang="ts">
    import { app } from "$lib/state/app.svelte.js";
</script>

<div>
    <p>Height {app.beerHeight}</p>

    {#if !app.running}
        <button class="btn preset-filled-primary-500" onclick={() => app.start()}>Start</button>
    {:else}
        <button class="btn preset-filled-error-500" onclick={() => app.stop()}>Stop</button>
    {/if}

    <div id="beer" class="bg-amber-200 w-40 h-10"></div>
</div>
