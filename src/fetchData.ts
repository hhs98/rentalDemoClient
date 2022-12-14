export type Person = {
    id: number
    name: string
    code: number
    availability: boolean
    needing_repair: boolean
    durability: number,
    mileage: number,
    price: number,
    subRows?: Person[]
}

export async function fetchData(options: {
    pageIndex: number
    pageSize: number
}) {
    const response = await fetch(`/api/v1/products?limit=${options.pageSize}&offset=${options.pageIndex * options.pageSize}`);
    const data = await response.json();
    return {
        rows: data.results,
        pageCount: Math.ceil(data.count / options.pageSize),
    }
}