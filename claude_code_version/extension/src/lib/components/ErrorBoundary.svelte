<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
  let error: string | null = $state(null);

  /** Reset the error state. */
  function retry(): void {
    error = null;
  }
</script>

{#if error}
  <Card class="border-destructive m-4">
    <CardContent class="p-4">
      <h3 class="text-sm font-semibold text-destructive mb-2">Something went wrong</h3>
      <p class="text-xs text-muted-foreground mb-3">{error}</p>
      <Button variant="outline" size="sm" onclick={retry}>
        {#snippet children()}Try Again{/snippet}
      </Button>
    </CardContent>
  </Card>
{:else}
  {@render children()}
{/if}
