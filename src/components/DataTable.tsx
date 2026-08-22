import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
    header: string;
    render: (row: T) => ReactNode;
}

export interface PaginationState {
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    rows: T[];
    rowKey: (row: T) => string | number;
    loading: boolean;
    emptyMessage: string;
    actions?: (row: T) => ReactNode;
    pagination?: PaginationState;
    onRowClick?: (row: T) => void;
}

function getPageNumbers(current: number, total: number): (number | '…')[] {
    const delta = 1;
    const range: (number | '…')[] = [];

    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
            range.push(i);
        } else if (range[range.length - 1] !== '…') {
            range.push('…');
        }
    }

    return range;
}

export default function DataTable<T>({
                                         columns,
                                         rows,
                                         rowKey,
                                         loading,
                                         emptyMessage,
                                         actions,
                                         pagination,
                                         onRowClick,
                                     }: DataTableProps<T>) {
    const totalPages = pagination
        ? Math.max(1, Math.ceil(pagination.totalCount / pagination.pageSize))
        : 1;

    return (
        <div className="rounded-2xl bg-white shadow-md overflow-hidden">
            {loading ? (
                <div className="px-6 py-12 text-center text-sm text-gray-500">Loading…</div>
            ) : rows.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-gray-500">{emptyMessage}</div>
            ) : (
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        {columns.map((col) => (
                            <th key={col.header} className="px-6 py-3 font-medium text-gray-500">
                                {col.header}
                            </th>
                        ))}
                        {actions && (
                            <th className="px-6 py-3 font-medium text-gray-500 text-right">Actions</th>
                        )}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {rows.map((row) => (
                        <tr
                            key={rowKey(row)}
                            onClick={onRowClick ? () => onRowClick(row) : undefined}
                            className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                        >
                            {columns.map((col) => (
                                <td key={col.header} className="px-6 py-4 text-gray-600">
                                    {col.render(row)}
                                </td>
                            ))}
                            {actions && (
                                <td className="px-6 py-4">
                                    <div className="flex justify-end gap-2">{actions(row)}</div>
                                </td>
                            )}
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            {pagination && !loading && rows.length > 0 && (
                <div className="flex items-center justify-center px-6 py-4 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            disabled={pagination.pageNumber <= 1}
                            onClick={() => pagination.onPageChange(pagination.pageNumber - 1)}
                            aria-label="Previous page"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        {getPageNumbers(pagination.pageNumber, totalPages).map((page, i) =>
                                page === '…' ? (
                                    <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
                  …
                </span>
                                ) : (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => pagination.onPageChange(page)}
                                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                            page === pagination.pageNumber
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-600 hover:bg-gray-50 border border-gray-300'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ),
                        )}

                        <button
                            type="button"
                            disabled={pagination.pageNumber >= totalPages}
                            onClick={() => pagination.onPageChange(pagination.pageNumber + 1)}
                            aria-label="Next page"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}