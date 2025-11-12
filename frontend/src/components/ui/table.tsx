import React from "react";

export type Column<T> = {
  header: string;
  accessor: keyof T;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
  cellClassName?: string;
};

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  tableClassName?: string;
}

export function Table<T>({ columns, data }: TableProps<T>) {
  return (
    <div className="overflow-x-auto bg-[var(--secondary)] text-[var(--text-primary)]">
      <table className="min-w-full text-left border-collapse">
        <thead className="bg-[var(--secondary-accent)] manrope-regular">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={`header-${String(col.accessor)}-${idx}`}
                className="px-4 py-3 text-sm manrope-medium"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, rowIdx) => (
              <tr
                key={`row-${rowIdx}`}
                className="border-b border-[var(--text-primary)] hover:bg-white"
              >
                {columns.map((col, colIdx) => (
                  <td key={`cell-${rowIdx}-${colIdx}`} className="px-4 py-2">
                    {col.render
                      ? col.render(row[col.accessor], row)
                      : (row[col.accessor] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="pt-10 text-[var(--text-primary)] text-center"
              >
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
