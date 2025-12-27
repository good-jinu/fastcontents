// Mock Pointer Events for JSDOM
// JSDOM does not support Pointer Events by default or setPointerCapture/releasePointerCapture

export function setupPointerEventMock() {
	if (!global.PointerEvent) {
		class PointerEvent extends MouseEvent {
			pointerId: number;
			isPrimary: boolean;
			constructor(type: string, params: PointerEventInit = {}) {
				super(type, params);
				this.pointerId = params.pointerId || 0;
				this.isPrimary = params.isPrimary || false;
			}
		}
		// @ts-ignore
		global.PointerEvent = PointerEvent;
	}

	if (!HTMLElement.prototype.setPointerCapture) {
		HTMLElement.prototype.setPointerCapture = function (pointerId: number) {
			// Mock implementation
		};
	}

	if (!HTMLElement.prototype.releasePointerCapture) {
		HTMLElement.prototype.releasePointerCapture = function (pointerId: number) {
			// Mock implementation
		};
	}
}
