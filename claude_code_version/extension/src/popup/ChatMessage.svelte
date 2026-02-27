<script lang="ts">
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';

  interface Props {
    role: 'user' | 'assistant';
    content: string;
    sources?: readonly { url: string; title: string }[];
    streaming?: boolean;
  }

  let { role, content, sources = [], streaming = false }: Props = $props();
</script>

<div class="flex {role === 'user' ? 'justify-end' : 'justify-start'} mb-3">
  <Card class="max-w-[85%] {role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'}">
    <CardContent class="p-3">
      <p class="text-sm whitespace-pre-wrap">{content}{#if streaming}<span class="animate-pulse">▋</span>{/if}</p>
      {#if sources && sources.length > 0}
        <div class="mt-2 flex flex-wrap gap-1">
          {#each sources as source}
            <Badge variant="outline" class="text-xs">
              <a href={source.url} target="_blank" rel="noopener noreferrer" class="hover:underline">
                {source.title || source.url}
              </a>
            </Badge>
          {/each}
        </div>
      {/if}
    </CardContent>
  </Card>
</div>
