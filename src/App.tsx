import React, {useEffect} from 'react'

import {useQuery} from 'react-query'

import {
    Column,
    Table,
    PaginationState,
    useReactTable,
    ColumnFiltersState,
    getCoreRowModel,
    getFilteredRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFacetedMinMaxValues,
    getPaginationRowModel,
    sortingFns,
    getSortedRowModel,
    FilterFn,
    SortingFn,
    ColumnDef,
    flexRender,
    FilterFns,
} from '@tanstack/react-table'

import {
    RankingInfo,
    rankItem,
    compareItems,
} from '@tanstack/match-sorter-utils'

import {fetchData, Person} from './fetchData'
import DebouncedInput from "./components/DebouncedInput";
import IndeterminateCheckbox from "./components/InderminateCheckbox";

declare module '@tanstack/table-core' {
    interface FilterFns {
        fuzzy: FilterFn<unknown>
    }

    interface FilterMeta {
        itemRank: RankingInfo
    }
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    // Rank the item
    const itemRank = rankItem(row.getValue(columnId), value)

    // Store the itemRank info
    addMeta({
        itemRank,
    })

    // Return if the item should be filtered in/out
    return itemRank.passed
}

function App() {
    const rerender = React.useReducer(() => ({}), {})[1]
    const [rowSelection, setRowSelection] = React.useState({})
    const [globalFilter, setGlobalFilter] = React.useState('')
    const [selectedProduct, setSelectedProduct] = React.useState(0)
    const [fromDate, setFromDate] = React.useState('')
    const [toDate, setToDate] = React.useState('')
    const [estimatedPrice, setEstimatedPrice] = React.useState(0)
    const [usedMileage, setUsedMileage] = React.useState(0)
    const [needsRepair, setNeedsRepair] = React.useState(false)

    const handleDateChange = (value: string, input: string, product: Person) => {
        let date1 = new Date()
        let date2 = new Date()
        setSelectedProduct(product.id)
        if (input === 'from') {
            setFromDate(value)
            date1 = new Date(value);
            date2 = new Date(toDate);
        } else if (input === 'to') {
            setToDate(value)
            date1 = new Date(fromDate);
            date2 = new Date(value);
        }

        const diffTime = Math.abs(date2.getTime() - date1.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const estimatedPrice = diffDays * product.price;
        setEstimatedPrice(estimatedPrice);
    }

    const handleBooking = () => {
        fetch('http://localhost:8000/api/v1/bookings/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from_date: fromDate,
                to_date: toDate,
                price: estimatedPrice,
                product: selectedProduct,
            })
        })
            .then(response => {
                if (response.status === 201) {
                    alert('Booking successful')
                } else {
                    alert('Booking failed')
                }
            })
    }

    const handleReturn = () => {
        fetch('http://localhost:8000/api/v1/returns/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from_date: fromDate,
                to_date: toDate,
                price: estimatedPrice,
                product: selectedProduct,
                mileage_used: usedMileage,
                needs_repair: needsRepair,
            })
        })
            .then(response => {
                if (response.status === 201) {
                    alert('Return successful')
                } else {
                    alert('Return failed')
                }
            })
    }

    const columns = React.useMemo<ColumnDef<Person>[]>(
        () => [
            {
                id: 'select',
                header: ({table}) => (
                    <IndeterminateCheckbox
                        {...{
                            checked: table.getIsAllRowsSelected(),
                            indeterminate: table.getIsSomeRowsSelected(),
                            onChange: table.getToggleAllRowsSelectedHandler(),
                        }}
                    />
                ),
                cell: ({row}) => (
                    <div className="px-1">
                        <IndeterminateCheckbox
                            {...{
                                checked: row.getIsSelected(),
                                indeterminate: row.getIsSomeSelected(),
                                onChange: row.getToggleSelectedHandler(),
                            }}
                        />
                    </div>
                ),
            },
            {
                accessorKey: 'id',
                header: () => <span>Id</span>,
                footer: props => props.column.id,
            },
            {
                accessorKey: 'name',
                header: 'Name',
                footer: props => props.column.id,
            },
            {
                accessorKey: 'availability',
                header: 'Availability',
                footer: props => props.column.id,
            },
            {
                accessorKey: 'needing_repair',
                header: 'Need to repair',
                footer: props => props.column.id,
            },
            {
                accessorKey: 'durability',
                header: 'Durability',
                footer: props => props.column.id,
            },
            {
                accessorKey: 'mileage',
                header: 'Mileage',
                footer: props => props.column.id,
            },
        ],
        []
    )

    const [{pageIndex, pageSize}, setPagination] =
        React.useState<PaginationState>({
            pageIndex: 0,
            pageSize: 10,
        })

    const fetchDataOptions = {
        pageIndex,
        pageSize,
    }

    const dataQuery = useQuery(
        ['results', fetchDataOptions],
        () => fetchData(fetchDataOptions),
        {keepPreviousData: true}
    )

    const defaultData = React.useMemo(() => [], [])

    const pagination = React.useMemo(
        () => ({
            pageIndex,
            pageSize,
        }),
        [pageIndex, pageSize]
    )


    const table = useReactTable({
        data: dataQuery.data?.rows ?? defaultData,
        columns,
        filterFns: {
            fuzzy: fuzzyFilter,
        },
        pageCount: dataQuery.data?.pageCount ?? -1,
        state: {
            pagination,
            globalFilter,
            rowSelection,
        },
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        onPaginationChange: setPagination,
        globalFilterFn: fuzzyFilter,
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        //getPaginationRowModel: getPaginationRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        debugTable: true,
    })

    useEffect(() => {
        console.log(dataQuery)
    }, [])
    return (
        <div className="container mx-auto p-2">
            <div>
                <DebouncedInput
                    value={globalFilter ?? ''}
                    onChange={value => setGlobalFilter(String(value))}
                    className="input w-full max-w-xs input-bordered"
                    placeholder="Search all columns..."
                />
            </div>
            <div className="h-2"/>
            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => {
                                return (
                                    <th key={header.id} colSpan={header.colSpan}>
                                        {header.isPlaceholder ? null : (
                                            <div>
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                            </div>
                                        )}
                                    </th>
                                )
                            })}
                        </tr>
                    ))}
                    </thead>
                    <tbody>
                    {table.getRowModel().rows.map(row => {
                        return (
                            <tr key={row.id}>
                                {row.getVisibleCells().map(cell => {
                                    return (
                                        <td key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    )
                                })}
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>
            <div className="h-2"/>
            <div className="flex gap-2">
                <label htmlFor="booking-modal" className="btn">Book</label>
                <input type="checkbox" id="booking-modal" className="modal-toggle"/>
                <div className="modal">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-3">Book a product?</h3>
                        <input type="text" className="input input-bordered w-full mb-3"
                               value={table.getSelectedRowModel().flatRows[0]?.original.name} readOnly={true}/>
                        <div className="flex gap-2 mb-3">
                            <input type="date"
                                   onChange={(e) => handleDateChange(e.target.value, 'from', table.getSelectedRowModel().flatRows[0]?.original)}
                                   placeholder="From Date" className="input input-bordered w-full max-w-xs"/>
                            <input type="date"
                                   onChange={(e) => handleDateChange(e.target.value, 'to', table.getSelectedRowModel().flatRows[0]?.original)}
                                   placeholder="To Date" className="input input-bordered w-full max-w-xs"/>
                        </div>
                        <h3>Estimated Price: {estimatedPrice}</h3>

                        <div className="modal-action">
                            <label htmlFor="booking-modal" className="btn">No!</label>
                            <label onClick={handleBooking} htmlFor="booking-modal"
                                   className="btn">Yes!</label>
                        </div>
                    </div>
                </div>
                <label htmlFor="return-modal" className="btn">Return</label>
                <input type="checkbox" id="return-modal" className="modal-toggle"/>
                <div className="modal">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-3">Return a product?</h3>
                        <input type="text" className="input input-bordered w-full mb-3"
                               value={table.getSelectedRowModel().flatRows[0]?.original.name} readOnly={true}/>
                        <div className="flex gap-2 mb-3">
                            <input type="date"
                                   onChange={(e) => handleDateChange(e.target.value, 'from', table.getSelectedRowModel().flatRows[0]?.original)}
                                   placeholder="From Date" className="input input-bordered w-full max-w-xs"/>
                            <input type="date"
                                   onChange={(e) => handleDateChange(e.target.value, 'to', table.getSelectedRowModel().flatRows[0]?.original)}
                                   placeholder="To Date" className="input input-bordered w-full max-w-xs"/>
                        </div>
                        <input onChange={(e) => setUsedMileage(parseInt(e.target.value))} placeholder="Mileage Used" type="number"
                               className="input input-bordered w-full max-w-xs"/>
                        <div className="form-control">
                            <label className="cursor-pointer label">
                                <span className="label-text">Needs Repair</span>
                                <input onChange={(e) => setNeedsRepair(e.target.checked)} type="checkbox"
                                       className="checkbox checkbox-warning"/>
                            </label>
                        </div>
                        <h3>Estimated Price: {estimatedPrice}</h3>

                        <div className="modal-action">
                            <label htmlFor="return-modal" className="btn">No!</label>
                            <label onClick={handleReturn} htmlFor="return-modal"
                                   className="btn">Yes!</label>
                        </div>
                    </div>
                </div>

            </div>
            <div className="h-2"/>
            <div className="flex items-center gap-2">
                <button
                    className="btn"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                >
                    {'<<'}
                </button>
                <button
                    className="btn"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    {'<'}
                </button>
                <button
                    className="btn"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    {'>'}
                </button>
                <button
                    className="btn"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                >
                    {'>>'}
                </button>
                <span className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of{' '}{table.getPageCount()}
          </strong>
        </span>
                <span className="flex items-center gap-1">| Go to page:
          <input
              type="number"
              defaultValue={table.getState().pagination.pageIndex + 1}
              onChange={e => {
                  const page = e.target.value ? Number(e.target.value) - 1 : 0
                  table.setPageIndex(page)
              }}
              className="input input-bordered max-w-xs"
          />
        </span>
                <select
                    className="select select-bordered w-full max-w-xs"
                    value={table.getState().pagination.pageSize}
                    onChange={e => {
                        table.setPageSize(Number(e.target.value))
                    }}
                >
                    {[10, 20, 30, 40, 50].map(pageSize => (
                        <option key={pageSize} value={pageSize}>
                            Show {pageSize}
                        </option>
                    ))}
                </select>
                {dataQuery.isFetching ? 'Loading...' : null}
            </div>
            <div>{table.getRowModel().rows.length} Rows</div>
            <div>
                <button onClick={() => rerender()}>Force Rerender</button>
            </div>
            {/*<pre>{JSON.stringify(pagination, null, 2)}</pre>*/}
        </div>
    )
}

export default App