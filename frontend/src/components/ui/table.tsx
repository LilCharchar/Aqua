import React from "react";

interface Column<T> {
    header: string;
    accessor: keyof T;
    render?: (value: any, row: T) => React.ReactNode;
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
}

export function Table<T>({ columns, data }: TableProps<T>) {
    return (
        <div className="overflow-x-auto rounded-xl bg-[var(--secondary)] text-[var(--text-primary)]">
            <table className="min-w-full text-left border-collapse">
                <thead className="border-b border-[var(--text-primary)]">
                    <tr>
                        {columns.map((col, i) => (
                            <th key={i} className="px-4 py-3 text-sm manrope-medium">
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>                
                <tbody>
                    {data.length > 0 ? (
                    data.map((row, i) => (
                        <tr key={i} className="border-b border-[var(--text-primary)] hover:bg-white">
                            {columns.map((col, j) => (
                                <td key={j} className="px-4 py-2">
                                    {col.render
                                        ? col.render(row[col.accessor], row)
                                        : row[col.accessor] as React.ReactNode}
                                </td>
                            ))}
                        </tr>
                    ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length} className="px-4 text-[var(--text-primary)] text-center">
                                No hay datos disponibles.
                            </td> 
                        </tr>
                    )}
                </tbody>         
            </table>
        </div>
    );
}

export default Table;