export function formatDate(value: string) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return "00/00/00"
    }
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = String(date.getFullYear()).slice(-2)
    return `${day}/${month}/${year}`
}
