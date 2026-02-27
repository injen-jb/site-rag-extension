<script lang="ts">
  import { cn } from '$lib/utils';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    value?: number;
    max?: number;
  }

  let { value = 0, max = 100, class: className, ...restProps }: Props = $props();

  const percentage = $derived(Math.min(Math.max((value / max) * 100, 0), 100));
</script>

<div
  class={cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
  role="progressbar"
  aria-valuemin={0}
  aria-valuemax={max}
  aria-valuenow={value}
  {...restProps}
>
  <div
    class="h-full bg-primary transition-all duration-300"
    style="width: {percentage}%"
  ></div>
</div>
