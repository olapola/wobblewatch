<script lang="ts">
    import '../app.css';
    import { dev } from '$app/environment';
    import { injectAnalytics } from '@vercel/analytics/sveltekit';

    let { children } = $props();

    injectAnalytics({ mode: dev ? 'development' : 'production' });
</script>

<main class="mx-auto min-h-screen max-w-md p-4 pb-20">
    {@render children()}
</main>
