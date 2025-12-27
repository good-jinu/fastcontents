import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FastContent } from "../FastContent";
import { setupPointerEventMock } from "./setupPointerMock";

setupPointerEventMock();

describe("FastContent Swipe Interactions", () => {
	it("should only capture pointer after dragging starts (threshold exceeded)", async () => {
		const fetchCallback = vi.fn(() => Promise.resolve({ items: [{ id: 1, title: "1" }], hasMore: false }));
		const setPointerCaptureMock = vi.fn();

		// Mock setPointerCapture on HTMLElement prototype
		HTMLElement.prototype.setPointerCapture = setPointerCaptureMock;

		render(
			<FastContent
				fetchCallback={fetchCallback}
				renderer={({ content }) => <div>{content.title}</div>}
				enableSwipe={true}
			/>
		);

		await screen.findByText("1");

		const container = screen.getByText("1").closest("div")?.parentElement?.parentElement;
        if (!container) throw new Error("Container not found");

		// 1. Pointer Down
		fireEvent.pointerDown(container, { clientX: 0, clientY: 0, pointerId: 1 });

		// Should NOT capture yet (waiting for threshold)
		expect(setPointerCaptureMock).not.toHaveBeenCalled();

		// 2. Move slightly (less than threshold)
		fireEvent.pointerMove(container, { clientX: 3, clientY: 0, pointerId: 1 });
		expect(setPointerCaptureMock).not.toHaveBeenCalled();

		// 3. Move more (exceed threshold)
		fireEvent.pointerMove(container, { clientX: 10, clientY: 0, pointerId: 1 });
		expect(setPointerCaptureMock).toHaveBeenCalledWith(1);
	});
});
