import re
from pathlib import Path

preview_path = Path(__file__).resolve().parent / 'src/components/Preview.tsx'

with preview_path.open('r', encoding='utf-8') as f:
    content = f.read()

# We need to render the dangerouslySetInnerHTML OUTSIDE the `viewBox && transform` check, 
# or at least render it with a default style if transform is null, so it gets mounted!
# Wait, if transform is null, we can render it with visibility: hidden or opacity: 0, 
# so it's in the DOM to be parsed, but doesn't flash in the wrong place!

# Let's fix the JSX.
# Find the start of the viewBox && transform block
old_block = """          {viewBox && transform && (
            <div className="relative" style={svgStyle}>
              {/* Rendered TikZ SVG */}
              <div 
                className="absolute inset-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:overflow-visible"
                dangerouslySetInnerHTML={{ __html: processedSvgOutput }} 
              />
              
              {/* Interactive Overlay */}
              <svg 
                viewBox={viewBox} 
                className="absolute inset-0 pointer-events-none overflow-visible"
              >"""

new_block = """          <div className="relative" style={viewBox && transform ? svgStyle : { opacity: 0, pointerEvents: 'none' }}>
            {/* Rendered TikZ SVG ALWAYS in DOM so we can parse it */}
            <div 
              className="absolute inset-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:overflow-visible"
              dangerouslySetInnerHTML={{ __html: processedSvgOutput }} 
            />
            
            {/* Interactive Overlay */}
            {viewBox && transform && (
              <svg 
                viewBox={viewBox} 
                className="absolute inset-0 pointer-events-none overflow-visible"
              >"""

content = content.replace(old_block, new_block)

# And close the tags correctly
old_end = """              </svg>
            </div>
          )}
        </div>"""

new_end = """              </svg>
            )}
          </div>
        </div>"""

content = content.replace(old_end, new_end)

with preview_path.open('w', encoding='utf-8') as f:
    f.write(content)
