"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Check, X as XIcon } from "lucide-react";

interface EditableViewFrameProps {
  html: string;
  contentMap: Record<string, string> | null;
  onSave: (contentMap: Record<string, string>, updatedHtml: string) => void;
}

const EDITABLE_TAGS = new Set([
  "H1", "H2", "H3", "H4", "H5", "H6",
  "P", "LI", "TD", "TH", "SPAN", "FIGCAPTION", "BLOCKQUOTE", "LABEL",
]);

export default function EditableViewFrame({
  html,
  contentMap,
  onSave,
}: EditableViewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [originalText, setOriginalText] = useState<string>("");
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null);

  // Apply saved content_map edits to the HTML before rendering
  const getRenderedHtml = useCallback(() => {
    if (!contentMap || Object.keys(contentMap).length === 0) return html;
    // We inject a script that applies content_map after DOM loads
    const applyScript = `
      <script>
        (function() {
          var map = ${JSON.stringify(contentMap)};
          document.querySelectorAll('[data-block-id]').forEach(function(el) {
            var id = el.getAttribute('data-block-id');
            if (map[id] !== undefined) el.textContent = map[id];
          });
        })();
      </script>
    `;
    // Insert before </body> or at end
    if (html.includes("</body>")) {
      return html.replace("</body>", applyScript + "</body>");
    }
    return html + applyScript;
  }, [html, contentMap]);

  // After iframe loads, walk DOM and assign data-block-id to text elements
  const setupEditing = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    let blockIndex = 0;
    const walker = doc.createTreeWalker(
      doc.body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node: Element) => {
          if (!EDITABLE_TAGS.has(node.tagName)) return NodeFilter.FILTER_SKIP;
          // Only elements with direct text content
          const text = node.textContent?.trim();
          if (!text || text.length < 2) return NodeFilter.FILTER_SKIP;
          // Skip elements that only contain other editable elements
          const childEditables = node.querySelectorAll(
            Array.from(EDITABLE_TAGS).join(",")
          );
          if (childEditables.length > 0 && node.tagName === "LI") {
            // LI with nested content is still editable
          } else if (childEditables.length > 0) {
            return NodeFilter.FILTER_SKIP;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    const elements: Element[] = [];
    let node: Element | null;
    while ((node = walker.nextNode() as Element | null)) {
      elements.push(node);
    }

    elements.forEach((el) => {
      const id = `block-${blockIndex++}`;
      el.setAttribute("data-block-id", id);
      (el as HTMLElement).style.cursor = "pointer";
      (el as HTMLElement).style.transition = "outline 0.15s, background 0.15s";

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        // Dispatch custom event to parent
        window.postMessage({ type: "block-click", blockId: id }, "*");
      });
    });

    // Apply existing content_map
    if (contentMap) {
      elements.forEach((el) => {
        const id = el.getAttribute("data-block-id");
        if (id && contentMap[id] !== undefined) {
          el.textContent = contentMap[id];
        }
      });
    }

    // Click on empty space cancels editing
    doc.body.addEventListener("click", () => {
      window.postMessage({ type: "block-cancel" }, "*");
    });
  }, [contentMap]);

  // Listen for postMessage from iframe
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === "block-click") {
        handleBlockClick(e.data.blockId);
      } else if (e.data?.type === "block-cancel") {
        cancelEdit();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  });

  function handleBlockClick(blockId: string) {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    // If clicking a different block, cancel current edit
    if (activeBlockId && activeBlockId !== blockId) {
      cancelEdit();
    }

    const el = doc.querySelector(`[data-block-id="${blockId}"]`) as HTMLElement;
    if (!el) return;

    setActiveBlockId(blockId);
    setOriginalText(el.textContent ?? "");

    // Make editable
    el.contentEditable = "true";
    el.style.outline = "2px solid #3A6B8A";
    el.style.outlineOffset = "2px";
    el.style.background = "rgba(58, 107, 138, 0.05)";
    el.focus();

    // Position toolbar
    const iframeRect = iframe.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setToolbarPos({
      top: iframeRect.top + elRect.top - 40,
      left: iframeRect.left + elRect.left,
    });
  }

  function confirmEdit() {
    const iframe = iframeRef.current;
    if (!iframe || !activeBlockId) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    const el = doc.querySelector(`[data-block-id="${activeBlockId}"]`) as HTMLElement;
    if (!el) return;

    const newText = el.textContent ?? "";
    el.contentEditable = "false";
    el.style.outline = "";
    el.style.outlineOffset = "";
    el.style.background = "";

    // Build updated content map
    const updatedMap = { ...(contentMap ?? {}) };
    updatedMap[activeBlockId] = newText;

    // Build updated HTML from iframe
    const updatedHtml = doc.documentElement.outerHTML;

    setActiveBlockId(null);
    setToolbarPos(null);
    onSave(updatedMap, `<!DOCTYPE html>\n${updatedHtml}`);
  }

  function cancelEdit() {
    const iframe = iframeRef.current;
    if (!iframe || !activeBlockId) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    const el = doc.querySelector(`[data-block-id="${activeBlockId}"]`) as HTMLElement;
    if (el) {
      el.textContent = originalText;
      el.contentEditable = "false";
      el.style.outline = "";
      el.style.outlineOffset = "";
      el.style.background = "";
    }

    setActiveBlockId(null);
    setToolbarPos(null);
  }

  return (
    <div className="relative w-full h-full">
      <iframe
        ref={iframeRef}
        srcDoc={getRenderedHtml()}
        sandbox="allow-scripts allow-same-origin"
        className="w-full h-full min-h-[600px] rounded-lg border border-[#1B2B3A]/20 bg-white"
        title="Generated output"
        onLoad={setupEditing}
      />

      {/* Floating toolbar */}
      {activeBlockId && toolbarPos && (
        <div
          className="fixed z-50 flex items-center gap-1 bg-white border border-[#1B2B3A]/20 rounded-lg shadow-lg px-1.5 py-1"
          style={{ top: toolbarPos.top, left: toolbarPos.left }}
        >
          <button
            onClick={confirmEdit}
            className="p-1 rounded hover:bg-[#1D9E75]/10 text-[#1D9E75] transition-colors"
            title="Confirm edit"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={cancelEdit}
            className="p-1 rounded hover:bg-[#D85A30]/10 text-[#D85A30] transition-colors"
            title="Cancel edit"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
