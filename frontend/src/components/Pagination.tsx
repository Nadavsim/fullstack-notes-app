interface PaginationProps {
    activePage: number;   // Let a be the current page
    totalPages: number;   // n = total pages
    onPageChange: (pageNumber: number) => void;
}

export default function Pagination({ activePage, totalPages, onPageChange }: PaginationProps) {

    const getVisiblePages = (a: number, n: number) => {
    if (n <= 5) {
      // If n <= 5: show buttons [1, ..., n]
        return Array.from({ length: n }, (_, i) => i + 1);
    } else if (a < 3) {
      // If n >= 6: if a < 3 : show buttons [1,2,3,4,5]
        return [1, 2, 3, 4, 5];
    } else if (a >= 3 && a <= n - 2) {
      // If 3 <= a <= (n-2): show buttons [a-2, a-1, a, a+1, a+2]
        return [a - 2, a - 1, a, a + 1, a + 2];
    } else {
      // If a > (n-2): show buttons [n-4, n-3, n-2, n-1, n]
        return [n - 4, n - 3, n - 2, n - 1, n];
    }
};

const visiblePages = getVisiblePages(activePage, totalPages);

return (
    <div className="pagination-container">
    {/* Navigation buttons should have html name attribute "first", "previous"
        Disable irrelevant page buttons: previous is disabled if we're at the first page
      */}
    <button name="first" onClick={() => onPageChange(1)} disabled={activePage === 1}>
        <span>First</span>
    </button>
    <button name="previous" onClick={() => onPageChange(activePage - 1)} disabled={activePage === 1}>
        <span>Previous</span>
    </button>

      {/* Dynamic Page Buttons */}
    {visiblePages.map((page) => (
        <button
        key={page}
          name={`page-${page}`} // Page buttons should have html name attribute "page-<target_page_number>"
        onClick={() => onPageChange(page)}
          disabled={activePage === page} // disable if it's the current page
          style={{ fontWeight: activePage === page ? "bold" : "normal" }} // active page button shown in bold
        >
        <span>{page}</span>
        </button>
    ))}

    {/* Navigation buttons should have html name attribute "next", "last"
        Disable irrelevant page buttons: next is disabled if we're at the last page
      */}
    <button name="next" onClick={() => onPageChange(activePage + 1)} disabled={activePage === totalPages}>
        <span>Next</span>
    </button>
    <button name="last" onClick={() => onPageChange(totalPages)} disabled={activePage === totalPages}>
        <span>Last</span>
    </button>
    </div>
    );
}