x1=23
y1=45
x2=50
y2=20

voff = 27

console.log(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://web.resource.org/cc/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" width="100" height="100" id="svg2" version="1.0">

  <g id="test-body-content" font-size="18">

    <defs>
      <mask id="maskedtext">
        <circle cx="50%" cy="50%" r="50" fill="white"/>
        <line stroke="black" stroke-width="10" stroke-linecap="round" 
        x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>
        <line stroke="black" stroke-width="10" stroke-linecap="round" 
        x1="${x2}" y1="${y2}" x2="${x2+(x2-x1)}" y2="${y1}"/>
        <line stroke="black" stroke-width="10" stroke-linecap="round" 
        x1="${x1}" y1="${y1+voff}" x2="${x2}" y2="${y2+voff}"/>
        <line stroke="black" stroke-width="10" stroke-linecap="round" 
        x1="${x2}" y1="${y2+voff}" x2="${x2+(x2-x1)}" y2="${y1+voff}"/>
        
      </mask>
    </defs>
    
    <rect width="100" height="100" x="0" y="0" fill="white" mask="url(#maskedtext)"/>

  </g>

</svg>
`)