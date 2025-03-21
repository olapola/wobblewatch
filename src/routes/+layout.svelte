<script lang="ts">
    import '../app.css';

    let { children } = $props();
</script>

<main class="mx-auto min-h-screen max-w-md p-4 pb-20">
    {@render children()}
</main>
