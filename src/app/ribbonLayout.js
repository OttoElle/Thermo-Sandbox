// Responsive ribbon: a row that would overflow switches to icon-only tool
// buttons; if it still overflows, the mouse wheel scrolls it horizontally.
const ribbonRows = document.querySelectorAll('.header-row-ribbon');

function fitRibbonRow(row) {
  row.classList.remove('ribbon-compact');
  if (row.scrollWidth > row.clientWidth + 1) row.classList.add('ribbon-compact');
}

function fitRibbon() {
  ribbonRows.forEach(fitRibbonRow);
}

const ribbonObserver = new ResizeObserver(fitRibbon);
ribbonRows.forEach(row => {
  ribbonObserver.observe(row);
  row.addEventListener('wheel', (e) => {
    if (row.scrollWidth <= row.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    row.scrollLeft += e.deltaY;
  }, { passive: false });
});
