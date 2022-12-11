import {faker} from '@faker-js/faker'

export type Person = {
    id: number
    name: string
    code: number
    availability: boolean
    needing_repair: boolean
    durability: number,
    mileage: number,
    subRows?: Person[]
}

const range = (len: number) => {
    const arr = []
    for (let i = 0; i < len; i++) {
        arr.push(i)
    }
    return arr
}

const newPerson = (): Person => {
    return {
        id: faker.datatype.number(41),
        name: faker.name.lastName(),
        code: faker.datatype.number(40),
        availability: faker.datatype.boolean(),
        durability: faker.datatype.number(100),
        needing_repair: faker.datatype.boolean(),
        mileage: faker.datatype.number(100),
    }
}

export function makeData(...lens: number[]) {
    const makeDataLevel = (depth = 0): Person[] => {
        const len = lens[depth]!
        return range(len).map((d): Person => {
            return {
                ...newPerson(),
                subRows: lens[depth + 1] ? makeDataLevel(depth + 1) : undefined,
            }
        })
    }

    return makeDataLevel()
}

const data = makeData(10000)

export async function fetchData(options: {
    pageIndex: number
    pageSize: number
}) {
    // Simulate some network latency
    await new Promise(r => setTimeout(r, 500))
    console.log(data)
    return {
        rows: data.slice(
            options.pageIndex * options.pageSize,
            (options.pageIndex + 1) * options.pageSize
        ),
        pageCount: Math.ceil(data.length / options.pageSize),
    }
}
