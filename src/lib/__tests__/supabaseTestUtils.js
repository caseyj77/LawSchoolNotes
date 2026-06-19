function matchesFilters(row, filters) {
  return filters.every((filter) =>
    filter.type === 'in' ? filter.vals.includes(row[filter.col]) : row[filter.col] === filter.val,
  )
}

class MockQueryBuilder {
  constructor(db, table) {
    this.db = db
    this.table = table
    this.filters = []
  }

  select() {
    this.mode = this.mode ?? 'select'
    return this
  }

  insert(payload) {
    this.mode = 'insert'
    this.payload = payload
    return this
  }

  update(payload) {
    this.mode = 'update'
    this.payload = payload
    return this
  }

  upsert(payload, options) {
    this.mode = 'upsert'
    this.payload = payload
    this.onConflict = options?.onConflict ?? 'id'
    return this
  }

  delete() {
    this.mode = 'delete'
    return this
  }

  eq(col, val) {
    this.filters.push({ type: 'eq', col, val })
    return this
  }

  in(col, vals) {
    this.filters.push({ type: 'in', col, vals })
    return this
  }

  order(col, { ascending = true } = {}) {
    this.orderBy = { col, ascending }
    return this
  }

  single() {
    this.wantsSingle = true
    return this
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject)
  }

  async execute() {
    const rows = this.db[this.table] ?? (this.db[this.table] = [])

    if (this.mode === 'insert') {
      const toInsert = Array.isArray(this.payload) ? this.payload : [this.payload]
      const inserted = toInsert.map((row) => ({
        id: row.id ?? crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...row,
      }))
      rows.push(...inserted)
      return { data: this.wantsSingle ? inserted[0] : inserted, error: null }
    }

    if (this.mode === 'update') {
      const matched = rows.filter((row) => matchesFilters(row, this.filters))
      matched.forEach((row) => Object.assign(row, this.payload, { updated_at: new Date().toISOString() }))
      return { data: this.wantsSingle ? matched[0] : matched, error: null }
    }

    if (this.mode === 'upsert') {
      const conflictCols = this.onConflict.split(',')
      const toUpsert = Array.isArray(this.payload) ? this.payload : [this.payload]
      const result = toUpsert.map((row) => {
        const existing = rows.find((existingRow) =>
          conflictCols.every((col) => existingRow[col] === row[col]),
        )
        if (existing) {
          Object.assign(existing, row, { updated_at: new Date().toISOString() })
          return existing
        }
        const created = { id: row.id ?? crypto.randomUUID(), ...row }
        rows.push(created)
        return created
      })
      return { data: result, error: null }
    }

    if (this.mode === 'delete') {
      this.db[this.table] = rows.filter((row) => !matchesFilters(row, this.filters))
      return { data: null, error: null }
    }

    let result = rows.filter((row) => matchesFilters(row, this.filters))
    if (this.orderBy) {
      const { col, ascending } = this.orderBy
      result = [...result].sort((a, b) => (a[col] > b[col] ? 1 : -1) * (ascending ? 1 : -1))
    }
    if (this.wantsSingle) {
      return result.length === 1
        ? { data: result[0], error: null }
        : { data: null, error: { message: 'Expected exactly one row' } }
    }
    return { data: result, error: null }
  }
}

export function createSupabaseMock(initialTables = {}) {
  const db = {}
  for (const [table, rows] of Object.entries(initialTables)) {
    db[table] = rows.map((row) => ({ ...row }))
  }

  return {
    db,
    from: (table) => new MockQueryBuilder(db, table),
  }
}
