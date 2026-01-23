<script setup lang="ts">
import { computed } from "vue";
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";

const props = defineProps<{ content: string }>();

const md = new MarkdownIt({
  html: false,   // safer
  linkify: true,
  breaks: true
});

// Optional: open links in new tab
const defaultRender =
  md.renderer.rules.link_open ||
  ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  token.attrSet("target", "_blank");
  token.attrSet("rel", "noopener noreferrer");
  return defaultRender(tokens, idx, options, env, self);
};

const html = computed(() => {
  const raw = md.render(props.content || "");
  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true }
  });
});
</script>

<template>
  <!-- Horizontal scroll for wide tables -->
  <div class="max-w-full overflow-x-auto">
    <div
      class="markdown text-sm leading-6 text-foreground
        [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:mt-4 [&_h1]:mb-2
        [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2
        [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1
        [&_p]:my-2
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
        [&_li]:my-1
        [&_a]:underline
        [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-muted [&_code]:text-foreground
        [&_pre]:my-2 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:overflow-auto
        [&_blockquote]:border-l-4 [&_blockquote]:border-muted [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:text-muted-foreground

        /* ✅ TABLE STYLES */
        [&_table]:w-full [&_table]:border-collapse [&_table]:my-3
        [&_thead]:bg-muted/50
        [&_th]:border [&_th]:border-muted [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold
        [&_td]:border [&_td]:border-muted [&_td]:px-3 [&_td]:py-2 [&_td]:align-top
        [&_tr:nth-child(even)]:bg-muted/20
      "
      v-html="html"
    />
  </div>
</template>