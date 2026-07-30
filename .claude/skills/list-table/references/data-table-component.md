# Shared table component

Tables use src/components/DataTable.tsx.

If this file already exists, import and use it — do not hand-roll a
new `<table>` per feature.

If it does not exist yet, create a generic component accepting:
columns (header + render function per column), rows, rowKey, loading,
emptyMessage, optional actions per row, and an optional pagination
object ({ pageNumber, pageSize, totalCount, onPageChange }) rendering
page controls.