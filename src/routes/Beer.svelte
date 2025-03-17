<script lang="ts">

    import { onMount } from "svelte";

    let interval = 0;
    let height = $state(0);

    onMount(() => {
        return () => {
            clearInterval(interval);
        }
    })

    function start() {
        const el = document.getElementById('beer');
        if (!el) {
            console.error("beer element not found");
            return;
        }

        height = el.clientHeight;
        console.log("initial beer height", height);

        interval = setInterval(() => {
            if (height >= 300) {
                clearInterval(interval);
            }

            height++;
            el.style.height = `${height}px`;

            console.log("current beer height", height);
        }, 10)
    }

    function stop() {
        clearInterval(interval);
    }
</script>

<div id="beer" class="bg-amber-200 w-40 h-10"></div>

<p>
    Height {height}
</p>

<button class="" onclick={start}>Start</button>
<button class="" onclick={stop}>Stop</button>
