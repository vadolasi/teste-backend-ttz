import { Test, TestingModule } from "@nestjs/testing"
import { EventsController } from "./events.controller"
import { EventsService } from "./events.service"
import { IngestionProcessor } from "./ingestion.processor"

describe("EventsController", () => {
	let controller: EventsController

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [EventsController],
			providers: [EventsService, IngestionProcessor]
		}).compile()

		controller = module.get<EventsController>(EventsController)
	})

	it("should be defined", () => {
		expect(controller).toBeDefined()
	})
})
