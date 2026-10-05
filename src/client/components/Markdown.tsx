import ReactMarkdown from "react-markdown";

// Sanitized markdown. Raw HTML is dropped, images/iframes are not rendered (no remote content, no tracking),
// links open in a new tab with no referrer. Screenshots are attached as files, never embedded by URL.
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-200 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc [&_blockquote]:border-l-2 [&_blockquote]:border-slate-600 [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-slate-800 [&_code]:px-1">
      <ReactMarkdown
        skipHtml
        disallowedElements={["img", "iframe", "script", "style"]}
        components={{
          a: ({ href, children: kids }) => (
            <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="text-blue-300 underline">
              {kids}
            </a>
          ),
        }}
      >
        {children || "*Nothing to preview yet.*"}
      </ReactMarkdown>
    </div>
  );
}
