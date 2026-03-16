import type { Page } from "playwright-core";

interface SnapshotNode {
  ref: number;
  role: string;
  name: string;
  tag: string;
  value?: string;
  href?: string;
  children?: SnapshotNode[];
}

export async function takeSnapshot(page: Page): Promise<string> {
  const tree = await page.evaluate(() => {
    let refCounter = 0;
    const INTERACTIVE_ROLES = new Set([
      "link", "button", "textbox", "checkbox", "radio",
      "combobox", "menuitem", "tab", "switch", "searchbox",
      "slider", "spinbutton", "option", "menuitemcheckbox",
      "menuitemradio",
    ]);
    const SKIP_TAGS = new Set(["script", "style", "noscript", "svg", "path"]);

    function walk(el: Element): any | null {
      const tag = el.tagName.toLowerCase();
      if (SKIP_TAGS.has(tag)) return null;

      const role = el.getAttribute("role") || inferRole(el);
      const name = getAccessibleName(el);
      const isInteractive = INTERACTIVE_ROLES.has(role) || el.matches("a[href], button, input, select, textarea, [tabindex]");

      const children: any[] = [];
      for (const child of el.children) {
        const c = walk(child);
        if (c) children.push(c);
      }

      const hasText = el.childNodes.length > 0 &&
        Array.from(el.childNodes).some(n =>
          n.nodeType === 3 && n.textContent?.trim()
        );

      if (!isInteractive && children.length === 0 && !hasText && !name) return null;

      const node: any = { role, name: name.slice(0, 120), tag };

      if (isInteractive) {
        node.ref = ++refCounter;
        (el as any).__snapRef = node.ref;
      }

      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        node.value = el.value.slice(0, 80);
      }
      if (el instanceof HTMLAnchorElement && el.href) {
        node.href = el.href.slice(0, 200);
      }
      if (children.length > 0) node.children = children;

      return node;
    }

    function inferRole(el: Element): string {
      const tag = el.tagName.toLowerCase();
      const map: Record<string, string> = {
        a: "link", button: "button", input: inferInputRole(el),
        select: "combobox", textarea: "textbox", img: "img",
        h1: "heading", h2: "heading", h3: "heading", h4: "heading",
        nav: "navigation", main: "main", form: "form",
        table: "table", ul: "list", ol: "list", li: "listitem",
      };
      return map[tag] || "generic";
    }

    function inferInputRole(el: Element): string {
      const type = (el as HTMLInputElement).type || "text";
      if (type === "checkbox") return "checkbox";
      if (type === "radio") return "radio";
      if (type === "submit" || type === "button") return "button";
      if (type === "search") return "searchbox";
      return "textbox";
    }

    function getAccessibleName(el: Element): string {
      const aria = el.getAttribute("aria-label");
      if (aria) return aria;
      const labelledBy = el.getAttribute("aria-labelledby");
      if (labelledBy) {
        const ref = document.getElementById(labelledBy);
        if (ref) return ref.textContent?.trim() || "";
      }
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
        const id = el.id;
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (label) return label.textContent?.trim() || "";
        }
        const ph = el.getAttribute("placeholder");
        if (ph) return ph;
      }
      if (el instanceof HTMLImageElement) return el.alt || "";
      const directText = Array.from(el.childNodes)
        .filter(n => n.nodeType === 3)
        .map(n => n.textContent?.trim())
        .filter(Boolean)
        .join(" ");
      return directText.slice(0, 120);
    }

    return walk(document.body);
  });

  if (!tree) return "[empty page]";
  return formatTree(tree, 0);
}

const MAX_SIBLINGS_PER_ROLE = 5;

function formatTree(node: SnapshotNode, depth: number): string {
  const indent = "  ".repeat(depth);
  let line = `${indent}`;

  if (node.ref) line += `[${node.ref}] `;
  line += `${node.role}`;
  if (node.name) line += ` "${node.name}"`;
  if (node.value) line += ` value="${node.value}"`;
  if (node.href) line += ` → ${node.href}`;

  const lines = [line];
  if (node.children) {
    const grouped = new Map<string, number>();
    for (const child of node.children) {
      const count = grouped.get(child.role) || 0;
      grouped.set(child.role, count + 1);

      if (count < MAX_SIBLINGS_PER_ROLE) {
        lines.push(formatTree(child, depth + 1));
      } else if (count === MAX_SIBLINGS_PER_ROLE) {
        const total = node.children.filter(c => c.role === child.role).length;
        const remaining = total - MAX_SIBLINGS_PER_ROLE;
        lines.push(`${"  ".repeat(depth + 1)}... +${remaining} more ${child.role} items`);
      }
    }
  }
  return lines.join("\n");
}

export async function getElementByRef(page: Page, ref: number): Promise<any> {
  const handle = await page.evaluateHandle((targetRef: number) => {
    function find(el: Element): Element | null {
      if ((el as any).__snapRef === targetRef) return el;
      for (const child of el.children) {
        const found = find(child);
        if (found) return found;
      }
      return null;
    }
    return find(document.body);
  }, ref);

  const element = handle.asElement();
  if (!element) throw new Error(`Element ref [${ref}] not found. Run snapshot again.`);
  return element;
}
