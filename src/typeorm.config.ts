import "@timescaledb/typeorm"

import { DataSource, DataSourceOptions } from "typeorm"

export const dataSourceOptions: DataSourceOptions = {
	type: "postgres",
	host: process.env.DB_HOST ?? "localhost",
	port: parseInt(process.env.DB_PORT ?? "5432", 10),
	username: process.env.DB_USERNAME ?? "timescaledb",
	password: process.env.DB_PASSWORD ?? "timescaledb",
	database: process.env.DB_NAME ?? "timescaledb",
	synchronize: false,
	logging: true,
	entities: ["src/**/*.entity.ts"],
	migrations: ["src/migrations/*.ts"]
}

const dataSource = new DataSource(dataSourceOptions)

export default dataSource
