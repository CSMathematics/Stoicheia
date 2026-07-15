import { useLayoutEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { ToolType } from '../store';

export interface ToolItem {
  id: ToolType;
  icon: React.ReactNode;
  label: string;
  description: string;
}

export interface ToolSection {
  id: string;
  label: string;
  tools: ToolItem[];
}

interface ToolGroupProps {
  label: string;
  tools: ToolItem[];
  sections?: ToolSection[];
  activeTool: ToolType;
  open: boolean;
  onToggle: () => void;
  onSelect: (tool: ToolType) => void;
  groupToolsLabel?: (label: string) => string;
}

export function ToolGroup({ label, tools, sections, activeTool, open, onToggle, onSelect, groupToolsLabel }: ToolGroupProps) {
  const activeItem = tools.find(tool => tool.id === activeTool);
  const displayItem = activeItem ?? tools[0];
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 76, top: 12 });
  const menuSections = sections?.length ? sections : [{ id: 'all', label, tools }];
  const triggerLabel = groupToolsLabel ? groupToolsLabel(label) : `${label} tools`;

  useLayoutEffect(() => {
    if (!open) return;
    const placeMenu = () => {
      const trigger = triggerRef.current?.getBoundingClientRect();
      const menu = menuRef.current;
      if (!trigger || !menu) return;
      const gap = 10;
      const margin = 12;
      const left = Math.min(trigger.right + gap, Math.max(margin, window.innerWidth - menu.offsetWidth - margin));
      const top = Math.min(Math.max(margin, trigger.top), Math.max(margin, window.innerHeight - menu.offsetHeight - margin));
      setPosition({ left, top });
    };
    placeMenu();
    menuRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.scrollIntoView?.({ block: 'nearest' });
    window.addEventListener('resize', placeMenu);
    return () => window.removeEventListener('resize', placeMenu);
  }, [open, tools.length]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        title={triggerLabel}
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={onToggle}
        className={`group/tool activity-button ${
          activeItem
            ? 'activity-button-active'
            : open
              ? 'activity-button-open'
              : ''
        }`}
      >
        {activeItem && <span className="activity-rail-indicator" />}
        {displayItem.icon}
        <ChevronRight
          size={10}
          className={`absolute right-0.5 bottom-0.5 text-current opacity-55 transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={label}
          style={{ left: position.left, top: position.top, maxHeight: 'calc(100vh - 24px)' }}
          className="theme-dialog inspector-scroll tool-menu fixed z-50 overflow-y-auto border backdrop-blur-xl"
        >
          <div className="tool-menu-header">
            <span>{label}</span><span className="font-mono tracking-normal">{tools.length}</span>
          </div>
          <div className="tool-menu-sections">
            {menuSections.map((section, index) => (
              <section key={section.id} className="tool-menu-section" aria-label={section.label}>
                {(sections?.length || index > 0) && (
                  <div className="tool-menu-section-title">{section.label}</div>
                )}
                <div className="tool-menu-grid grid min-[520px]:grid-cols-2">
                  {section.tools.map(tool => {
                    const isActive = activeTool === tool.id;
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={isActive}
                        onClick={() => onSelect(tool.id)}
                        title={`${tool.label} — ${tool.description}`}
                        className={`tool-menu-item ${isActive ? 'tool-menu-item-active' : ''}`}
                      >
                        <span className="tool-menu-icon">
                          {tool.icon}
                        </span>
                        <span className="min-w-0">
                          <span className="tool-menu-title">{tool.label}</span>
                          <span className="tool-menu-description">{tool.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
